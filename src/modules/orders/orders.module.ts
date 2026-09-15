import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from 'node_modules/@nestjs/typeorm/dist/typeorm.module';
import { Order } from './database/entities/order.entity';
import { RabbitMQModule } from 'src/infrastructure/rabbitmq/rabbitmq.module';
import { Outbox } from './database/entities/outbox.entity';
import { OutboxService } from './schedule/outbox.schedule';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Outbox]), RabbitMQModule],
  controllers: [OrdersController],
  providers: [OrdersService, OutboxService],
})
export class OrdersModule {}
