import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from 'node_modules/@nestjs/typeorm/dist/typeorm.module';
import { Notification } from './database/entities/notification.entity';
import { RabbitMQModule } from 'src/infrastructure/rabbitmq/rabbitmq.module';
import { Inbox } from './database/entities/inbox.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, Inbox]), RabbitMQModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
