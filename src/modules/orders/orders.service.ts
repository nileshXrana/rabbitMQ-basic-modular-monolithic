import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './database/entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RabbitMQService } from 'src/infrastructure/rabbitmq/rabbitmq.service';
import { Outbox } from './database/entities/outbox.entity';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly rabbitMQService: RabbitMQService,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
  ) {}

  // rabbitMQ exchange setup
  async onModuleInit() {
    const channel = this.rabbitMQService.getConfirmChannel();

    // env variables
    const ordersExchange = process.env.RABBITMQ_ORDERS_EXCHANGE!;

    await channel.assertExchange(ordersExchange, 'direct', {
      durable: true,
    });
  }

  async create(createOrderDto: CreateOrderDto) {
    // save the order to the database
    const order = await this.dataSource.transaction(async (manager) => {
      // Create and save order
      const order = manager.create(Order, {
        user_id: createOrderDto.userId,
        amount: createOrderDto.amount,
      });

      await manager.save(order);

      // Create outbox event
      const outboxEvent = manager.create(Outbox, {
        event_type: 'order.created',
        payload: order,
      });

      await manager.save(outboxEvent);

      return order;
    });

    // return response to client
    return {
      message: 'Order created successfully',
      status: 201,
      data: order,
    };
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
