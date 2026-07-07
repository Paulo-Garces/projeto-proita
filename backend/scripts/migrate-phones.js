const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

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
    console.log('Iniciando migração de telefones para a Carteira de Telefones...');

    const users = await prisma.user.findMany({
      include: {
        profiles: true
      }
    });

    console.log(`Encontrados ${users.length} usuários para verificar.`);

    let insertedCount = 0;

    for (const user of users) {
      const phoneNumbersToInsert = new Set();

      if (user.telefone && user.telefone.trim() !== '') {
        phoneNumbersToInsert.add(user.telefone.trim());
      }

      for (const ad of user.profiles) {
        if (ad.telefoneComercial && ad.telefoneComercial.trim() !== '') {
          phoneNumbersToInsert.add(ad.telefoneComercial.trim());
        }
        if (ad.servicePhone && ad.servicePhone.trim() !== '') {
          phoneNumbersToInsert.add(ad.servicePhone.trim());
        }
        if (ad.whatsapp && ad.whatsapp.trim() !== '') {
          phoneNumbersToInsert.add(ad.whatsapp.trim());
        }
      }

      for (const num of phoneNumbersToInsert) {
        // Verifica se já existe esse número na carteira do usuário
        const existing = await prisma.userPhone.findFirst({
          where: {
            userId: user.id,
            numero: num
          }
        });

        if (!existing) {
          await prisma.userPhone.create({
            data: {
              userId: user.id,
              numero: num,
              isVerified: true
            }
          });
          insertedCount++;
        }
      }
    }

    console.log(`Migração concluída com sucesso! ${insertedCount} telefones adicionados.`);
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
