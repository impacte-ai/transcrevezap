import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getQueueToken } from '@nestjs/bullmq';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/modules/prisma.service';
import { RedisService } from '../src/infrastructure/modules/redis.service';
import { WebhookDeliveryProcessor } from '../src/adapters/outbound/webhook/webhook-delivery.processor';

describe('Health Check (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
      })
      .overrideProvider(RedisService)
      .useValue({
        client: { ping: jest.fn().mockResolvedValue('PONG') },
        subscriber: { quit: jest.fn() },
        publisher: { quit: jest.fn() },
        onModuleDestroy: jest.fn(),
      })
      .overrideProvider(getQueueToken('webhook-deliveries'))
      .useValue({
        add: jest.fn(),
        addBulk: jest.fn(),
        getWaitingCount: jest.fn().mockResolvedValue(0),
        getActiveCount: jest.fn().mockResolvedValue(0),
        getCompletedCount: jest.fn().mockResolvedValue(0),
        getFailedCount: jest.fn().mockResolvedValue(0),
        getDelayedCount: jest.fn().mockResolvedValue(0),
      })
      .overrideProvider(WebhookDeliveryProcessor)
      .useValue({ process: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health deve retornar status ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('transcrevezap-api');
        expect(res.body.version).toBe('3.0.0.0');
        expect(res.body.timezone).toBe('America/Sao_Paulo');
      });
  });
});
