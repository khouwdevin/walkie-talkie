import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventModule } from './event/event.module';
import { RoomModule } from './room/room.module';

@Module({
  imports: [EventModule, RoomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
