export enum OutboxStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
}

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
  schema: 'orders_schema',
  name: 'outbox',
})
export class Outbox {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  event_type!: string;

  @Column({ type: 'jsonb', nullable: false })
  payload!: object;

  @Column({ type: 'enum', enum: OutboxStatus, default: OutboxStatus.PENDING })
  status!: OutboxStatus;

  @CreateDateColumn()
  created_at!: Date;
}
