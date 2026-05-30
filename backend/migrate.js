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
    console.log('Iniciando migração de planos de usuários...');
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const result = await prisma.user.updateMany({
      data: {
        planStatus: 'ATIVO',
        subscriptionEndsAt: oneYearFromNow,
        trialEndsAt: null
      }
    });

    console.log(`Sucesso! ${result.count} usuários foram migrados para o plano Patrocinador por 1 ano.`);
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
