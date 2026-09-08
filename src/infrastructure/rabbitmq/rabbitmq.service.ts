import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  Channel,
  ChannelModel,
  ConfirmChannel,
  Connection,
  connect,
} from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection!: ChannelModel;
  private channel!: Channel;
  private confirmChannel!: ConfirmChannel;

  async onModuleInit() {
    this.connection = await connect(process.env.RABBITMQ_URL!);

    this.channel = await this.connection.createChannel();

    this.confirmChannel = await this.connection.createConfirmChannel();
  }

  getChannel(): Channel {
    return this.channel;
  }

  getConfirmChannel(): ConfirmChannel {
    return this.confirmChannel;
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.confirmChannel?.close();
    await this.connection?.close();
  }
}
