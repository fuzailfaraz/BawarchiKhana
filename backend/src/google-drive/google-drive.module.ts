import { Module } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { GoogleDriveController } from './google-drive.controller';

import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [GoogleDriveController],
  providers: [GoogleDriveService]
})
export class GoogleDriveModule {}
