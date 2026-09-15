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

  @Cron('*/60 * * * * *') // every 60 seconds
  async processOutbox() {
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
          'order.exchange',
          'order.created',
          Buffer.from(JSON.stringify(event.payload)),
          {
            persistent: true,
            messageId: event.id,
          },
        );

        await channel.waitForConfirms();

        event.status = OutboxStatus.PROCESSED;

        await this.outboxRepository.save(event);

        console.log(`Published outbox event: ${event.id}`);
      } catch (error) {
        console.error(`Failed to publish outbox event: ${event.id}`, error);
      }
    }
  }
}
