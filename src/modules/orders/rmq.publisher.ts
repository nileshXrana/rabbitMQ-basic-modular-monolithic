import { Injectable } from '@nestjs/common';
import { RabbitMQService } from 'src/infrastructure/rabbitmq/rabbitmq.service';
import { Outbox, OutboxStatus } from './database/entities/outbox.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from 'node_modules/@nestjs/typeorm/dist/common/typeorm.decorators';

@Injectable()
export class RMQPublisher {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
  ) {}

  async onModuleInit() {
    // env variables
    const ordersExchange = process.env.RABBITMQ_ORDERS_EXCHANGE!;

    const channel = this.rabbitMQService.getConfirmChannel();

    await channel.assertExchange(ordersExchange, 'direct', {
      durable: true,
    });
  }

  async publishEvents(events: Outbox[]) {
    // env variables
    const ordersExchange = process.env.RABBITMQ_ORDERS_EXCHANGE!;
    const ordersRoutingKey = process.env.RABBITMQ_ORDERS_ROUTING_KEY!;

    const channel = this.rabbitMQService.getConfirmChannel();

    for (const event of events) {
      try {
        channel.publish(
          ordersExchange,
          ordersRoutingKey,
          Buffer.from(JSON.stringify(event.payload)),
          {
            persistent: true,
            messageId: event.id,
            headers: {
              'x-retry-count': 0,
            },
          },
        );

        await channel.waitForConfirms();

        event.status = OutboxStatus.PROCESSED;

        await this.outboxRepository.save(event);
      } catch (error) {
        console.error(`Failed to publish outbox event: ${event.id}`, error);
      }
    }
  }
}
