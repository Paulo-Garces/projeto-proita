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
    console.log('Iniciando o script de backfill para preencher subscriptionStartsAt de usuários antigos...');

    // Busca usuários onde subscriptionEndsAt não é nulo, mas subscriptionStartsAt é nulo
    const usersToUpdate = await prisma.user.findMany({
      where: {
        subscriptionEndsAt: { not: null },
        subscriptionStartsAt: null
      },
      select: {
        id: true,
        createdAt: true,
        nome: true
      }
    });

    console.log(`Encontrados ${usersToUpdate.length} usuários que precisam de atualização.`);

    let updatedCount = 0;

    for (const user of usersToUpdate) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStartsAt: user.createdAt
        }
      });
      updatedCount++;
    }

    console.log(`Sucesso! O script concluiu a atualização de ${updatedCount} usuários.`);
  } catch (error) {
    console.error('Erro durante o backfill:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
