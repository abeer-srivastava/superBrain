import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { Link, LinkSchema } from './schemas/link.schema';
import { ContentModule } from '../content/content.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Link.name, schema: LinkSchema }]),
    forwardRef(() => ContentModule),
    UserModule,
  ],
  controllers: [ShareController],
  providers: [ShareService],
  exports: [ShareService],
})
export class ShareModule {}
