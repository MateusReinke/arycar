# Deploy Docker do AryCar (Coolify-ready)

Este projeto está preparado para subir em **um único stack Docker Compose** com:

- `arycar-web` (Nginx + frontend)
- `arycar-api` (Node/Express)
- `arycar-db` (PostgreSQL)

## Características de produção (Coolify)

- Sem `container_name` (Coolify gerencia nomes/labels).
- Apenas o `arycar-web` é público.
- API e banco ficam privados na rede interna do stack.
- Banco inicializado automaticamente via `docker/postgres/init/01_init.sql`.

## Variáveis necessárias

Configure no Coolify:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `CORS_ORIGIN`

Opcional:

- `DATABASE_URL` (se quiser sobrescrever a URL padrão)

## Deploy

1. Crie resource Docker Compose no Coolify apontando para este repo.
2. Defina as variáveis acima.
3. Publique somente `arycar-web`.
4. Faça deploy.

## Local

```bash
cp .env.example .env
docker compose up -d --build
```

A API fica acessível localmente pelo proxy do web em `/api`.
