const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();
const { convertToInternationalPhone } = require('./utils/phoneHelper');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    console.log('Iniciando o script de migração de telefones para a carteira...');

    // Busca todos os usuários com seus telefones de carteira existentes e anúncios
    const users = await prisma.user.findMany({
      include: {
        phones: true,
        profiles: true
      }
    });

    console.log(`Encontrados ${users.length} usuários para verificar.`);

    let totalInserted = 0;

    for (const user of users) {
      const rawPhones = [];
      
      // 1. Coleta o telefone principal do cadastro
      if (user.telefone) {
        rawPhones.push(user.telefone);
      }

      // 2. Coleta os telefones cadastrados nos anúncios (profiles) do usuário
      for (const profile of user.profiles) {
        if (profile.telefoneComercial) rawPhones.push(profile.telefoneComercial);
        if (profile.servicePhone) rawPhones.push(profile.servicePhone);
        if (profile.whatsapp) rawPhones.push(profile.whatsapp);
      }

      // Números normalizados já existentes na carteira do usuário
      const existingNormalized = new Set(
        user.phones
          .map(p => convertToInternationalPhone(p.numero))
          .filter(Boolean)
      );

      const uniqueNormalized = new Set();
      const phonesToInsert = [];

      for (const raw of rawPhones) {
        const normalized = convertToInternationalPhone(raw);
        if (!normalized) continue;

        // Pula se já existe na carteira ou se já foi adicionado para esta inserção
        if (existingNormalized.has(normalized) || uniqueNormalized.has(normalized)) {
          continue;
        }

        // Respeita o limite máximo de 3 telefones na carteira
        if (existingNormalized.size + phonesToInsert.length >= 3) {
          break;
        }

        uniqueNormalized.add(normalized);
        phonesToInsert.push(raw.trim());
      }

      if (phonesToInsert.length > 0) {
        console.log(`Usuário: ${user.nome} (ID: ${user.id})`);
        console.log(` - Telefones a serem inseridos na carteira: ${phonesToInsert.join(', ')}`);
        
        for (const phoneStr of phonesToInsert) {
          await prisma.userPhone.create({
            data: {
              userId: user.id,
              numero: phoneStr,
              isVerified: true
            }
          });
          totalInserted++;
        }
      }
    }

    console.log(`Script de backfill concluído com sucesso. Total de ${totalInserted} novos registros de telefone inseridos na carteira.`);
  } catch (error) {
    console.error('Erro durante o backfill de telefones:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
