import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();

async function main() {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6380', 10);
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  console.log(`Conectando ao Redis v2 em ${redisHost}:${redisPort}...`);
  const redis = new Redis({ host: redisHost, port: redisPort, password: redisPassword });

  try {
    await redis.ping();
    console.log('Redis conectado.');
  } catch (error) {
    console.error('Erro ao conectar ao Redis. Verifique as variáveis de ambiente.');
    process.exit(1);
  }

  let migrated = 0;

  // 1. Settings
  console.log('\n--- Migrando Settings ---');
  const settingKeys: Record<string, string> = {
    'transcrevezap:active_llm_provider': 'transcription.sttProvider',
    'transcrevezap:output_mode': 'transcription.outputMode',
    'transcrevezap:character_limit': 'transcription.characterLimit',
    'transcrevezap:TRANSCRIPTION_LANGUAGE': 'transcription.language',
    'transcrevezap:summary_header': 'messaging.summaryHeader',
    'transcrevezap:transcription_header': 'messaging.transcriptionHeader',
    'transcrevezap:BUSINESS_MESSAGE': 'messaging.businessMessage',
    'transcrevezap:process_mode': 'processing.mode',
    'transcrevezap:PROCESS_SELF_MESSAGES': 'processing.selfMessages',
    'transcrevezap:auto_language_detection': 'language.autoDetection',
    'transcrevezap:auto_translation': 'language.autoTranslation',
  };

  for (const [redisKey, prismaKey] of Object.entries(settingKeys)) {
    const value = await redis.get(redisKey);
    if (value) {
      await prisma.setting.upsert({
        where: { key: prismaKey },
        update: { value },
        create: { key: prismaKey, value },
      });
      console.log(`  ${redisKey} → ${prismaKey} = ${value}`);
      migrated++;
    }
  }

  // 2. Allowed Groups
  console.log('\n--- Migrando Grupos Permitidos ---');
  const groups = await redis.smembers('transcrevezap:allowed_groups');
  for (const groupJid of groups) {
    await prisma.allowedGroup.upsert({
      where: { groupJid },
      update: {},
      create: { groupJid },
    });
    console.log(`  Grupo: ${groupJid}`);
    migrated++;
  }

  // 3. Blocked Users
  console.log('\n--- Migrando Usuários Bloqueados ---');
  const blocked = await redis.smembers('transcrevezap:blocked_users');
  for (const userJid of blocked) {
    await prisma.blockedUser.upsert({
      where: { userJid },
      update: {},
      create: { userJid },
    });
    console.log(`  Bloqueado: ${userJid}`);
    migrated++;
  }

  // 4. Contact Languages
  console.log('\n--- Migrando Idiomas de Contato ---');
  const contactLangs = await redis.hgetall('transcrevezap:contact_languages');
  for (const [contactJid, language] of Object.entries(contactLangs)) {
    await prisma.contactLanguage.upsert({
      where: { contactJid },
      update: { language },
      create: { contactJid, language, autoDetected: false },
    });
    console.log(`  ${contactJid} → ${language}`);
    migrated++;
  }

  // 5. Webhook Redirects
  console.log('\n--- Migrando Webhook Redirects ---');
  const webhooksRaw = await redis.hgetall('transcrevezap:webhook_redirects');
  for (const [, jsonValue] of Object.entries(webhooksRaw)) {
    try {
      const wh = JSON.parse(jsonValue);
      if (wh.url) {
        await prisma.webhookRedirect.create({
          data: {
            url: wh.url,
            description: wh.description || null,
            isActive: wh.status !== 'inactive',
            successCount: wh.success_count || 0,
            errorCount: wh.error_count || 0,
          },
        });
        console.log(`  Webhook: ${wh.url}`);
        migrated++;
      }
    } catch {}
  }

  // 6. GROQ API Keys → Settings
  console.log('\n--- Migrando API Keys ---');
  const groqKeys = await redis.smembers('transcrevezap:groq_keys');
  if (groqKeys.length > 0) {
    await prisma.setting.upsert({
      where: { key: 'apikeys.groq' },
      update: { value: JSON.stringify(groqKeys) },
      create: { key: 'apikeys.groq', value: JSON.stringify(groqKeys) },
    });
    console.log(`  ${groqKeys.length} chaves GROQ migradas`);
    migrated++;
  }

  const openaiKeys = await redis.smembers('transcrevezap:openai_keys');
  if (openaiKeys.length > 0) {
    await prisma.setting.upsert({
      where: { key: 'apikeys.openai' },
      update: { value: JSON.stringify(openaiKeys) },
      create: { key: 'apikeys.openai', value: JSON.stringify(openaiKeys) },
    });
    console.log(`  ${openaiKeys.length} chaves OpenAI migradas`);
    migrated++;
  }

  console.log(`\n========================================`);
  console.log(`  Migração completa: ${migrated} itens migrados`);
  console.log(`========================================`);

  await redis.quit();
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Erro na migração:', error);
  process.exit(1);
});
