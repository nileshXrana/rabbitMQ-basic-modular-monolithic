import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from 'node_modules/@nestjs/typeorm/dist/typeorm.module';
import { Notification } from './database/entities/notification.entity';
import { RabbitMQService } from './rmq/rmq.consumer';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [RabbitMQService, NotificationsService],
})
export class NotificationsModule {}
