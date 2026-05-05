# proITA - Guia dos Três Climas

O proITA é um guia local de profissionais e serviços focado em conectar clientes a prestadores de serviço com alta eficiência e design moderno, voltado para a região de Itapipoca.

## Estrutura do Projeto

O projeto é dividido em duas partes principais:
- **`/frontend`**: Aplicação React com Vite, Tailwind CSS (v4), React Router DOM e Lucide React.
- **`/backend`**: Servidor Node.js com Express e PostgreSQL (Neon).

## Como rodar o projeto localmente

### 1. Configurando e rodando o Backend
Abra um terminal e acesse a pasta do backend:
```bash
cd backend
```

Instale as dependências:
```bash
npm install
```

Configure o banco de dados:
- Abra o arquivo `backend/.env`
- Preencha a variável `DATABASE_URL` com a string de conexão do PostgreSQL (Neon).
*(Nota: O servidor inicia normalmente mesmo sem o banco de dados configurado no início)*

Inicie o servidor de desenvolvimento:
```bash
node server.js
```
O backend estará rodando em `http://localhost:5000`

### 2. Configurando e rodando o Frontend
Abra um novo terminal e acesse a pasta do frontend:
```bash
cd frontend
```

Instale as dependências:
```bash
npm install
```

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
O frontend estará rodando em `http://localhost:5173`. Acesse no seu navegador para ver a interface completa com os dados fictícios simulados.

## Telas Principais Implementadas
- **Home**: Dashboard interativo com busca, categorias em destaque e estado diferente para usuário logado/deslogado.
- **Busca (/search)**: Lista de profissionais com filtros por categoria e busca textual.
- **Perfil do Profissional (/profile/:id)**: Vitrine pública com descrição detalhada, avaliações e botão para chamar no WhatsApp.
- **Autenticação (/auth)**: Formulário unificado de login e cadastro.
- **Anunciar (/advertise)**: Fluxo passo-a-passo (Wizard) para transformar um usuário básico em profissional.
- **Dashboard (/dashboard)**: Painel de conta para editar dados, ver favoritos e gerenciar o anúncio.
