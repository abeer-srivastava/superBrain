import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { ContentModule } from '../content/content.module';
import { SearchModule } from '../search/search.module';
import { ShareModule } from '../share/share.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [AuthModule, UserModule, ContentModule, SearchModule, ShareModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
