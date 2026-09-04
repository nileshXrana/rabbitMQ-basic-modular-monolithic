import { Injectable, OnModuleInit } from '@nestjs/common';
import amqp, { ConfirmChannel, ChannelModel } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private connection!: ChannelModel;
  private channel!: ConfirmChannel;

  async onModuleInit() {
    this.connection = await amqp.connect(process.env.RABBITMQ_URL!);

    this.channel = await this.connection.createConfirmChannel();


    await this.channel.assertExchange('order.exchange', 'direct', {
      durable: true,
    });
  }

  getChannel(): ConfirmChannel {
    return this.channel;
  }
}
