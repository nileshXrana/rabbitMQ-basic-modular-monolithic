import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({
  schema: 'orders',
  name: 'orders',
})
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'integer',
  })
  user_id!: number;

  @Column('decimal', {
    precision: 10,
    scale: 2,
  })
  amount!: number;

  @CreateDateColumn()
  created_at!: Date;
}
