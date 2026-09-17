import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Notification } from './database/entities/notification.entity';
import { Inbox } from './database/entities/inbox.entity';
import { Order } from '../orders/database/entities/order.entity';

@Injectable()
export class NotificationsService {
  constructor(private readonly dataSource: DataSource) {}

  async createNotification(messageId: string, order: Order) {
    await this.dataSource.transaction(async (manager) => {
      // check for duplicate message in inbox
      const existingInbox = await manager.findOne(Inbox, {
        where: { id: messageId },
      });

      if (existingInbox) {
        console.log(`Duplicate message ${messageId}, skipping processing.`);
        return;
      }

      // save message to inbox
      const inbox = manager.create(Inbox, {
        id: messageId,
        event_type: 'order.created',
        payload: order,
      });

      await manager.save(inbox);

      // Business operation
      const notification = manager.create(Notification, {
        order_id: order.id.toString(),
        type: 'order_created_notification',
      });

      await manager.save(notification);
    });
  }
}
