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

Configure estas variáveis de ambiente no projeto (Environment Variables):

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `CORS_ORIGIN`
- `AUTH_TOKEN_SECRET`
- `VITE_API_BASE_URL`
- `VITE_PLATE_API_URL`
- `VITE_PLATE_API_TOKEN`
- `VITE_FIPE_API_URL`
- `VITE_N8N_WEBHOOK_URL`
- `VITE_WHATSAPP_NUMBER`

> `CORS_ORIGIN` aceita múltiplas origens separadas por vírgula (exemplo: `https://app.exemplo.com,https://admin.exemplo.com`).

> `AUTH_TOKEN_SECRET` assina as sessões (login) da API. Se não for definida, a API gera uma chave aleatória a cada boot e todos os usuários são deslogados a cada reinício/deploy — defina um valor fixo e secreto em produção (ex.: `openssl rand -hex 32`).

> `VITE_WHATSAPP_NUMBER` é o número (somente dígitos, com DDD, sem o 55) usado no botão flutuante de WhatsApp da homepage. O número salvo em **Admin → Configurações** fica apenas no navegador de quem configurou, então é esta variável que vale para os visitantes do site.

> As variáveis `VITE_*` são de build do frontend. Elas são declaradas como `build.args` no `docker-compose.yml` **e** como `ARG`/`ENV` no `Dockerfile` — as duas pontas são necessárias: um build arg que não é declarado no `Dockerfile` é silenciosamente ignorado e a variável chega vazia ao bundle.

> `VITE_N8N_WEBHOOK_URL` é a URL do webhook que recebe os dados do formulário do **Assistente Arycar** na home.

### Rede interna entre serviços

- O nginx do serviço web encaminha chamadas `/api` para o serviço interno da API.
- A API conecta no PostgreSQL externo usando `DATABASE_HOST:DATABASE_PORT`.

## Referência

Consulte também: **`DEPLOY_DOCKER_POSTGRES.md`**.
