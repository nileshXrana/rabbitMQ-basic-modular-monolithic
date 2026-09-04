import { Injectable, OnModuleInit } from '@nestjs/common';
import { Channel, ChannelModel, connect } from 'amqplib';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  constructor(private readonly notificationsService: NotificationsService) {}
  private connection!: ChannelModel;
  private channel!: Channel;

  async onModuleInit() {
    this.connection = await connect(process.env.RABBITMQ_URL!);

    this.channel = await this.connection.createChannel();

    await this.channel.assertQueue('notification_queue', {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });

    await this.channel.bindQueue(
      'notification_queue', // queue name
      'order.exchange', // exchange name
      'order.created', // binding key
    );

    await this.channel.consume(
      'notification_queue',
      async (message) => {
        if (!message) {
          return;
        }

        const secs = 10;
        const order = JSON.parse(message.content.toString());

        console.log('Order received by Consumer:', order);

        // save order notification to the database
        await this.notificationsService.saveOrderNotification(order.id);

        this.channel.ack(message);
        console.log('Acknowledged sent by consumer');
      },
      {
        noAck: false, // Enable manual acknowledgment
      },
    );
  }

  getChannel(): Channel {
    return this.channel;
  }
}
