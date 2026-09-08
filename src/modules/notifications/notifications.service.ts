import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './database/entities/notification.entity';
import { RabbitMQService } from 'src/infrastructure/rabbitmq/rabbitmq.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit() {
    const channel = this.rabbitMQService.getChannel();

    await channel.assertQueue('notification_queue', {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    await channel.bindQueue(
      'notification_queue', // queue name
      'order.exchange', // exchange name
      'order.created', // binding key
    );

    await channel.consume(
      'notification_queue',
      async (message) => {
        if (!message) {
          return;
        }

        const order = JSON.parse(message.content.toString());

        console.log('Order received by Consumer:', order);

        // save order notification to the database
        await this.saveOrderNotification(order.id);

        channel.ack(message);
        console.log('Acknowledged sent by consumer');
      },
      {
        noAck: false, // Enable manual acknowledgment
      },
    );
  }

  async saveOrderNotification(orderId: number) {
    const notification = new Notification();
    notification.order_id = orderId.toString();
    notification.type = 'order_created_notification';
    await this.notificationRepository.save(notification);
    console.log('Order Notification saved to the database');
  }
}
