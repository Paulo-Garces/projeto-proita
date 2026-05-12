require('dotenv').config();
const { Pool } = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// Configurando a conexão exatamente como no seu servidor principal
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const categorias = [
        "Alimentação e Gastronomia",
        "Beleza e Estética",
        "Construção e Reformas",
        "Educação e Aulas",
        "Eventos e Produção",
        "Reparos e Assistência Técnica",
        "Serviços Domésticos e Cuidados",
        "Tecnologia e Design",
        "Transporte e Logística",
        "Saúde e Bem-estar",
        "Serviços Rurais e Paisagismo",
        "Moda e Costura",
        "Turismo e Lazer",
        "Serviços Administrativos e Consultoria",
        "Outros Serviços"
    ];

    console.log('Iniciando o plantio das categorias do MEI...');

    for (const nome of categorias) {
        await prisma.category.upsert({
            where: { name: nome },
            update: {}, // Se já existir, não faz nada
            create: { name: nome }, // Se não existir, cria
        });
    }

    console.log('✅ Categorias raiz criadas com sucesso!');
}

main()
    .catch((e) => {
        console.error('Erro no seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });