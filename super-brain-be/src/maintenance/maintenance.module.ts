import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Content, ContentSchema } from '../content/schemas/content.schema';
import { QueueModule } from '../queue/queue.module';
import { MigrationService } from './migration.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Content.name, schema: ContentSchema }]), QueueModule],
  providers: [MigrationService],
})
export class MaintenanceModule {}
