import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from 'node_modules/@nestjs/typeorm/dist/typeorm.module';
import { Order } from './database/entities/order.entity';
import { RabbitMQModule } from 'src/infrastructure/rabbitmq/rabbitmq.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), RabbitMQModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
