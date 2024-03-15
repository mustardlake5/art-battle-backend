import { Module } from '@nestjs/common';
import { EventsModule } from './events/events.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [EventsModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
