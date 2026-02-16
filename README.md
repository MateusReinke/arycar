# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Deploy no Coolify (1 stack Docker Compose: web + api + db)

Este repositório está pronto para deploy como **um único stack compose** no Coolify.

### 1) Criar o Resource Docker Compose

1. No Coolify, crie um novo resource do tipo **Docker Compose**.
2. Aponte para este repositório e branch desejada.
3. Garanta que o arquivo usado seja o `docker-compose.yml` da raiz.

### 2) Definir variáveis/Secrets no Coolify

Defina, no mínimo, as variáveis abaixo:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `CORS_ORIGIN`

Opcional:

- `DATABASE_URL` (se quiser sobrescrever a URL montada automaticamente)

### 3) Publicação de serviço

- **Publique apenas o serviço `arycar-web`**.
- **Não publique `arycar-api`** (uso interno da rede compose).
- **Não exponha porta do banco (`arycar-db`)**.

### 4) Rede interna do stack

- O Nginx do web acessa a API por hostname interno: `http://arycar-api:3001/api/`.
- A API acessa o banco por hostname interno: `arycar-db:5432`.

### 5) Banco automático

Na primeira inicialização do volume do Postgres, o script em `docker/postgres/init/01_init.sql` é executado automaticamente para criar schema/tabelas/índices iniciais.

## Execução local (sem quebrar desenvolvimento)

Para rodar localmente com Docker Compose:

```bash
cp .env.example .env
# ajuste as variáveis do .env

docker compose up -d --build
```

Depois:

- Web: `http://localhost:8089`
- API health: `http://localhost:8089/api/health` (via proxy do Nginx)

> Dica: para desenvolvimento frontend puro, `npm run dev` continua funcionando normalmente.
