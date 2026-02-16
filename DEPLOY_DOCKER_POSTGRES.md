# Deploy Docker do AryCar com PostgreSQL automático

Este projeto já está preparado para subir **frontend + API base + PostgreSQL** no mesmo `docker-compose`.

## O que já está pronto

- `docker-compose.yml` com 3 serviços:
  - `arycar-web` (frontend em Nginx)
  - `arycar-api` (backend base Node/Express)
  - `postgres` (PostgreSQL 16)
- Inicialização automática do banco no primeiro start:
  - Script: `docker/postgres/init/01_init.sql`
  - O container do Postgres executa automaticamente tudo que estiver em `/docker-entrypoint-initdb.d`.

## 1) Configurar variáveis

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais (mínimo recomendado):

```env
POSTGRES_USER=arycar_user
POSTGRES_PASSWORD=arycar_pass_123
POSTGRES_DB=arycar_db

VITE_API_BASE_URL=http://localhost:3001/api
VITE_PLATE_API_URL=https://placas.app.br/api/v1/placas
VITE_PLATE_API_TOKEN=
VITE_FIPE_API_URL=https://parallelum.com.br/fipe/api/v1
```

## 2) Subir stack completa

```bash
docker compose up -d --build
```

## 3) Verificar se subiu corretamente

```bash
docker compose ps
```

Checar health da API:

```bash
curl http://localhost:3001/api/health
```

Esperado: JSON com `status: "ok"` e `db: "connected"`.

## 4) Acessos

- Frontend: `http://localhost:8080`
- API: `http://localhost:3001/api`
- PostgreSQL: `localhost:5432`

## Observações importantes

1. O script SQL é executado automaticamente **somente na primeira criação do volume** do Postgres.
2. Se quiser resetar e recriar do zero:

```bash
docker compose down -v
docker compose up -d --build
```

3. O frontend já está preparado para usar `VITE_API_BASE_URL` (arquivo `src/config/api.ts`).
4. O Nginx do frontend também possui proxy para `/api` dentro da rede Docker.

## Próximos passos sugeridos

- Implementar endpoints completos da API conforme `docs/DATABASE_SCHEMA.md`.
- Adicionar migrations versionadas (ex.: Prisma, Knex ou Flyway).
- Remover fallback de `localStorage` quando backend estiver finalizado.
