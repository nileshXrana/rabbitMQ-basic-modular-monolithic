import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
  schema: 'notifications',
  name: 'notifications',
})
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  order_id!: string;

  @Column()
  type!: string;

  @CreateDateColumn()
  created_at!: Date;
}