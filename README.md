# AryCar

## Desenvolvimento local

Instale dependências e rode o frontend em modo desenvolvimento:

```sh
npm install
npm run dev
```

## Deploy no Coolify (Docker Compose)

Este repositório está pronto para deploy via **Docker Compose** no Coolify.

### Exposição de portas

- Aplicação principal (nginx/web) exposta no host em **`8089`**.
  - Acesso: `http://<ip-do-servidor>:8089`
- **Postgres não é publicado no host** (banco separado, já provisionado no Coolify).
- **API não é publicada no host** (acesso apenas interno na rede do compose).


### Qual formato usar no Coolify

Use **Docker Compose** (recomendado para este projeto).

- O repositório já está preparado com `docker-compose.yml` para subir `web` + `api` juntos.
- Não use deploy por Dockerfile único para este cenário, porque você precisa dos 2 serviços e das variáveis de ambiente do backend.
- No Coolify, selecione o tipo **Docker Compose** e preencha as variáveis em **Environment Variables**.

### Variáveis obrigatórias no Coolify

Configure estas variáveis de ambiente no serviço:

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `CORS_ORIGIN`

> `CORS_ORIGIN` aceita múltiplas origens separadas por vírgula (exemplo: `https://app.exemplo.com,https://admin.exemplo.com`).

### Rede interna entre serviços

- O nginx do serviço web encaminha chamadas `/api` para o serviço interno da API.
- A API conecta no PostgreSQL externo usando `DATABASE_HOST:DATABASE_PORT`.

## Referência

Consulte também: **`DEPLOY_DOCKER_POSTGRES.md`**.
