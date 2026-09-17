import { Injectable } from '@nestjs/common';
import { RabbitMQService } from 'src/infrastructure/rabbitmq/rabbitmq.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class RMQConsumer {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    // env variables
    const ordersExchange = process.env.RABBITMQ_ORDERS_EXCHANGE!;
    const ordersRoutingKey = process.env.RABBITMQ_ORDERS_ROUTING_KEY!;
    const notificationsQueue = process.env.RABBITMQ_NOTIFICATIONS_QUEUE!;
    const retryExchange = process.env.RABBITMQ_NOTIFICATIONS_RETRY_EXCHANGE!;
    const retryRoutingKey =
      process.env.RABBITMQ_NOTIFICATIONS_RETRY_ROUTING_KEY!;
    const retryQueue = process.env.RABBITMQ_NOTIFICATIONS_RETRY_QUEUE!;
    const dlx = process.env.RABBITMQ_DLX!;
    const dlxRoutingKey = process.env.RABBITMQ_DLX_ROUTING_KEY!;
    const dlq = process.env.RABBITMQ_DLQ!;
    const retryDelay = Number(process.env.RABBITMQ_RETRY_DELAY!);
    const maxRetries = Number(process.env.RABBITMQ_MAX_RETRIES!);

    const channel = this.rabbitMQService.getChannel();

    // primary queue
    await channel.assertQueue(notificationsQueue, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    await channel.bindQueue(
      notificationsQueue, // queue name
      ordersExchange, // exchange name
      ordersRoutingKey, // binding key
    );

    // retry queue
    await channel.assertExchange(retryExchange, 'direct', {
      durable: true,
    });

    await channel.assertQueue(retryQueue, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
        'x-dead-letter-exchange': ordersExchange,
        'x-dead-letter-routing-key': ordersRoutingKey,
      },
    });

    await channel.bindQueue(retryQueue, retryExchange, retryRoutingKey);

    // dead letter queue
    await channel.assertExchange(dlx, 'direct', {
      durable: true,
    });

    await channel.assertQueue(dlq, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    await channel.bindQueue(dlq, dlx, dlxRoutingKey);

    channel.prefetch(1);

    await channel.consume(
      notificationsQueue,
      async (message) => {
        if (!message) {
          return;
        }

        const messageId = message.properties.messageId;

        try {
          if (!messageId) {
            // send directly to DLQ
            channel.publish(dlx, dlxRoutingKey, message.content, {
              ...message.properties,
              persistent: true,
              headers: {
                ...(message.properties.headers ?? {}),
                'x-retry-count': 0,
                'x-final-failure': true,
              },
            });

            console.log('Message ID is missing, sent to DLQ.');
            channel.ack(message);
            return;
          }

          throw new Error('custom error for testing !.');

          //   const order = JSON.parse(message.content.toString());
          //   await this.notificationsService.createNotification(messageId, order);
          //   channel.ack(message);
          
        } catch (error) {
          const currentRetryCount = Number(
            message.properties.headers?.['x-retry-count'] ?? 0,
          );

          const nextRetryCount = currentRetryCount + 1;

          if (nextRetryCount > maxRetries) {
            channel.publish(dlx, dlxRoutingKey, message.content, {
              ...message.properties,
              persistent: true,
              headers: {
                ...(message.properties.headers ?? {}),
                'x-retry-count': currentRetryCount,
                'x-final-failure': true,
              },
            });

            console.log(
              `Message ${messageId} exceeded max retries, sent to DLQ.`,
            );
            channel.ack(message);
            return;
          }

          const ttl = retryDelay * nextRetryCount;

          channel.publish(retryExchange, retryRoutingKey, message.content, {
            ...message.properties,

            persistent: true,
            expiration: String(ttl),
            headers: {
              ...(message.properties.headers ?? {}),
              'x-retry-count': nextRetryCount,
            },
          });

          console.log(
            `Message ${messageId} sent to retry queue with TTL ${ttl}ms. Retry count: ${nextRetryCount}. Error: ${error.message}`,
          );
          channel.ack(message);
        }
      },
      {
        noAck: false, // Enable manual acknowledgment
      },
    );
  }
}
