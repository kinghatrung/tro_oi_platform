import { Global, Module } from '@nestjs/common';

import { RealtimeService } from './realtime.service.js';

/** Global: ChatGateway gắn server, NotificationService đẩy "notification:new". */
@Global()
@Module({
  providers: [RealtimeService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
