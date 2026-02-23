# Deploy Docker do AryCar com PostgreSQL separado

Este projeto está preparado para subir **frontend + API** no `docker-compose`, conectando em um PostgreSQL **externo** (já criado no Coolify).

## O que está pronto

- `docker-compose.yml` com 2 serviços:
  - `web` (frontend em Nginx)
  - `api` (backend Node/Express)
- Conexão PostgreSQL feita no backend via variáveis de ambiente:
  - `DATABASE_HOST`
  - `DATABASE_PORT`
  - `DATABASE_NAME`
  - `DATABASE_USER`
  - `DATABASE_PASSWORD`

> A API falha na inicialização com erro explícito caso `DATABASE_PASSWORD` não esteja definida.

## 1) Configurar variáveis

```bash
cp .env.example .env
```

Edite o `.env`:

```env
DATABASE_HOST=arycar_db
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=arycar_admin
DATABASE_PASSWORD=

VITE_API_BASE_URL=http://localhost:3001/api
VITE_PLATE_API_URL=https://placas.app.br/api/v1/placas
VITE_PLATE_API_TOKEN=
VITE_FIPE_API_URL=https://parallelum.com.br/fipe/api/v1
```

## 2) Subir stack

```bash
docker compose up -d --build
```

## 3) Verificar saúde

```bash
docker compose ps
curl http://localhost:3001/api/health
```

Esperado: JSON com `status: "ok"` e `db: "connected"`.

## Banco separado no Coolify

No deploy, basta preencher `DATABASE_PASSWORD` (e manter os demais valores conforme seu banco criado).
