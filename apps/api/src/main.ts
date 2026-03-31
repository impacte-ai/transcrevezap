import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  process.env.TZ = 'America/Sao_Paulo';

  const app = await NestFactory.create(AppModule);
  const port = process.env.API_PORT || 8005;

  app.enableCors();

  await app.listen(port);
  Logger.log(
    `TranscreveZAP API rodando na porta ${port} — TZ: ${process.env.TZ}`,
    'Bootstrap',
  );
}

bootstrap();
