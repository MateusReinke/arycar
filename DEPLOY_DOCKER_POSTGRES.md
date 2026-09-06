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

CORS_ORIGIN=https://arycar.mrbautomacoes.site

VITE_API_BASE_URL=https://arycar.mrbautomacoes.site/api
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

No deploy, preencha todas as variáveis obrigatórias (`DATABASE_*`, `CORS_ORIGIN` e `VITE_*`) no Coolify.

> As `VITE_*` são usadas no build da imagem do frontend e, por isso, também precisam existir no Environment Variables do projeto.


## 4) Login do ADMIN padrão

A própria API cria um usuário admin automaticamente na primeira inicialização (com senha já protegida por hash), então não é necessário inserir nada manualmente no banco. Faça login com:

- E-mail: `admin@arycar.com`
- Senha: `Admin@123`
- Perfil: `Admin`

> **Importante:** troque essa senha padrão assim que possível em **Minha conta**, e defina `AUTH_TOKEN_SECRET` no ambiente (veja `.env.example`) para que as sessões de login não sejam invalidadas a cada reinício da API.
>
> Nunca insira senhas em texto puro em `password_hash` via SQL manual — o backend só reconhece senhas no formato `salt:hash` (scrypt) gerado por ele mesmo; qualquer outro valor fica salvo sem proteção nenhuma.

