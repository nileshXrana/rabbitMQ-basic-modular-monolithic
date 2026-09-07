import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './database/entities/order.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RabbitMQService } from './rmq/rmq.producer';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    // save the order to the database
    const order = new Order();
    order.user_id = createOrderDto.userId;
    order.amount = createOrderDto.amount;
    await this.orderRepository.save(order);

    // publish the order to RabbitMQ
    const channel = this.rabbitMQService.getChannel();

    channel.publish(
      'order.exchange', // exchange name
      'order.created', // routing key
      Buffer.from(JSON.stringify(order)),
      {
        persistent: true,
      },
    );

    await channel.waitForConfirms();
    console.log('Message confirmed by RabbitMQ to Publisher');

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
