import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentModule } from '../content/content.module';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { SearchService } from './search.service';
import { ConversationService } from './conversation.service';
import { SearchController } from './search.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Conversation.name, schema: ConversationSchema }]), ContentModule],
  controllers: [SearchController],
  providers: [SearchService, ConversationService],
  exports: [ConversationService],
})
export class SearchModule {}
