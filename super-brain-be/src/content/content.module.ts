import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentService } from './content.service';
import { ContentController } from './content.controller';
import { Content, ContentSchema } from './schemas/content.schema';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Content.name, schema: ContentSchema }]), QueueModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
