import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

const ENTITIES = [
  'connections',
  'webhooks',
  'settings',
  'users',
  'groups',
  'blocks',
  'languages',
  'logs',
  'statistics',
];

async function main() {
  console.log('Seeding database...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrador com acesso total',
      isSystem: true,
    },
  });

  for (const entity of ENTITIES) {
    await prisma.permission.upsert({
      where: { roleId_entity: { roleId: adminRole.id, entity } },
      update: { actions: JSON.stringify(['read', 'write', 'delete']) },
      create: {
        roleId: adminRole.id,
        entity,
        actions: JSON.stringify(['read', 'write', 'delete']),
      },
    });
  }

  const viewerRole = await prisma.role.upsert({
    where: { name: 'viewer' },
    update: {},
    create: {
      name: 'viewer',
      description: 'Apenas visualização',
      isSystem: true,
    },
  });

  for (const entity of ENTITIES) {
    await prisma.permission.upsert({
      where: { roleId_entity: { roleId: viewerRole.id, entity } },
      update: { actions: JSON.stringify(['read']) },
      create: {
        roleId: viewerRole.id,
        entity,
        actions: JSON.stringify(['read']),
      },
    });
  }

  const email = process.env.ADMIN_EMAIL || 'admin@transcrevezap.local';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Administrador',
      passwordHash: hashPassword(password),
      roleId: adminRole.id,
      isActive: true,
    },
  });

  const defaultSettings: Record<string, string> = {
    'transcription.language': 'pt',
    'transcription.outputMode': 'both',
    'transcription.characterLimit': '500',
    'transcription.useTimestamps': 'false',
    'transcription.sttProvider': 'groq',
    'transcription.sttModel': 'whisper-large-v3-turbo',
    'transcription.llmProvider': 'groq',
    'transcription.llmModel': 'llama-3.3-70b-versatile',
    'transcription.fallbackSttProvider': '',
    'transcription.fallbackSttModel': '',
    'messaging.summaryHeader': '📝 *Resumo do áudio:*',
    'messaging.transcriptionHeader': '🎙️ *Transcrição do áudio:*',
    'messaging.businessMessage': '',
    'processing.mode': 'all',
    'processing.selfMessages': 'false',
    'language.autoDetection': 'true',
    'language.autoTranslation': 'false',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  console.log(`Seed completo:`);
  console.log(`  - Role admin: ${adminRole.id}`);
  console.log(`  - Role viewer: ${viewerRole.id}`);
  console.log(`  - Admin user: ${email}`);
  console.log(`  - ${Object.keys(defaultSettings).length} settings padrão`);
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
