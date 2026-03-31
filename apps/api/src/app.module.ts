import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadAppConfig } from './infrastructure/config/app.config';
import { PrismaModule } from './infrastructure/modules/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadAppConfig],
    }),
    PrismaModule,
  ],
})
export class AppModule {}
