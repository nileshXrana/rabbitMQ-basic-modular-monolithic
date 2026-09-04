import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async saveOrderNotification(orderId: number) {
    const notification = new Notification();
    notification.order_id = orderId.toString();
    notification.type = 'order_created_notification';
    await this.notificationRepository.save(notification);
    console.log('Order Notification saved to the database');
  }
}
