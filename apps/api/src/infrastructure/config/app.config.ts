export interface AppConfig {
  port: number;
  timezone: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  database: {
    url: string;
  };
}

export function loadAppConfig(): AppConfig {
  return {
    port: parseInt(process.env.API_PORT || '8005', 10),
    timezone: 'America/Sao_Paulo',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
    },
    database: {
      url: process.env.DATABASE_URL || 'file:./data/transcrevezap.db',
    },
  };
}
