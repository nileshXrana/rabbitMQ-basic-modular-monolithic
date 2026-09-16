import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Outbox, OutboxStatus } from '../database/entities/outbox.entity';
import { RabbitMQService } from 'src/infrastructure/rabbitmq/rabbitmq.service';

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  @Cron('0 * * * * *') // Fires at second 0 of every minute
  async processOutbox() {
    // env variables
    const ordersExchange = process.env.RABBITMQ_ORDERS_EXCHANGE!;
    const ordersRoutingKey = process.env.RABBITMQ_ORDERS_ROUTING_KEY!;

    const events = await this.outboxRepository.find({
      where: {
        status: OutboxStatus.PENDING,
      },
      order: {
        created_at: 'ASC',
      },
      take: 100,
    });

    if (events.length === 0) {
      return;
    }

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
