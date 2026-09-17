import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Outbox, OutboxStatus } from '../database/entities/outbox.entity';
import { DataSource } from 'typeorm';
import { RMQPublisher } from '../rmq.publisher';

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
    private readonly dataSource: DataSource,
    private readonly rmqPublisher: RMQPublisher,
  ) {}

  @Cron('0 * * * * *') // Fires at second 0 of every minute
  async processOutbox() {
    const queryRunner = this.dataSource.createQueryRunner();

    const tableExists = await queryRunner.hasTable('orders_schema.outbox');

    if (!tableExists) {
      console.log('Outbox table does not exist yet. Skipping cron.');
      return;
    }

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
      console.log('No pending events found in the outbox.');
      return;
    }

    await this.rmqPublisher.publishEvents(events);
  }
}
