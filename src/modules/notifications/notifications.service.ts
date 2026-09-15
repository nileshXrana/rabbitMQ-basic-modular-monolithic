import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Notification } from './database/entities/notification.entity';
import { RabbitMQService } from 'src/infrastructure/rabbitmq/rabbitmq.service';
import { Inbox } from './database/entities/inbox.entity';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    const channel = this.rabbitMQService.getChannel();

    await channel.assertQueue('notification_queue', {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    channel.prefetch(1);

    await channel.bindQueue(
      'notification_queue', // queue name
      'order.exchange', // exchange name
      'order.created', // binding key
    );

    await channel.consume(
      'notification_queue',
      async (message) => {
        if (!message) {
          return;
        }

        try {
          const order = JSON.parse(message.content.toString());
          const messageId = message.properties.messageId;

          if (!messageId) {
            console.error('Message received without messageId');
            return;
          }

          const result = await this.dataSource.transaction(async (manager) => {
            // check for duplicate message in inbox
            const existingInbox = await manager.findOne(Inbox, {
              where: { id: messageId },
            });

            if (existingInbox) {
              console.log(
                `Duplicate message ${messageId}, skipping processing.`,
              );
              return false;
            }

            // save message to inbox
            const inbox = manager.create(Inbox, {
              id: messageId,
              event_type: 'order.created',
              payload: order,
            });

            await manager.save(inbox);

            // Business operation
            const notification = manager.create(Notification, {
              order_id: order.id.toString(),
              type: 'order_created_notification',
            });

            await manager.save(notification);

            return true;
          });

          channel.ack(message);
        } catch (error) {
          console.error('Failed to process message:', error);
        }
      },
      {
        noAck: false, // Enable manual acknowledgment
      },
    );
  }
}
