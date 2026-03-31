import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'transcrevezap-api',
      version: '3.0.0.0',
      timezone: process.env.TZ || 'America/Sao_Paulo',
      timestamp: new Date().toISOString(),
    };
  }
}
