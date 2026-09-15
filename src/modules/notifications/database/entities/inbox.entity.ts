import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export enum InboxStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
}

@Entity({
  schema: 'notifications_schema',
  name: 'inbox',
})
export class Inbox {
  @PrimaryColumn({ type: 'uuid', nullable: false })
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  event_type: string;

  @Column({ type: 'jsonb', nullable: false })
  payload: object;

  @CreateDateColumn()
  received_at: Date;
}
