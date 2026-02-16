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
- **Postgres não é publicado no host** (sem `5432:5432`).
- **API não é publicada no host** (acesso apenas interno na rede do compose).

### Variáveis obrigatórias no Coolify

Configure estas variáveis de ambiente no serviço:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `CORS_ORIGIN`

> `CORS_ORIGIN` aceita múltiplas origens separadas por vírgula (exemplo: `https://app.exemplo.com,https://admin.exemplo.com`).

### Rede interna entre serviços

- O nginx do serviço web encaminha chamadas `/api` para o serviço interno da API.
- A API conecta no banco usando host interno `db:5432`.


### Fluxo de placa com OS em aberto

- Ao digitar a placa, o sistema verifica cadastro do veículo/cliente.
- Se já existir **OS em aberto** para a placa, o usuário é direcionado para a tela de **Resumo da OS**, com opção de edição rápida e atalho para a fila de OS.
- A API também expõe `GET /api/orders/open-by-plate/:plate` para validação direta no PostgreSQL em produção.



### Perfis e permissões (gestão)

- **Admin**: gerencia serviços, funcionários, configurações e pode cadastrar status personalizados de OS.
- **Funcionário**: pode criar e acompanhar OS (Dashboard/Fila), sem acesso ao painel Admin.
- **Cliente**: acessa área do cliente para consultar status das OS pelo telefone e solicitar novo serviço.

### Solicitação de busca em casa (cliente)

- O cliente pode marcar **Leva e Traz** ao solicitar novo serviço.
- A solicitação só é permitida quando o cadastro do cliente possui **endereço** preenchido.



### Login sem seleção de perfil

- O usuário informa apenas **e-mail** (e senha) ou **telefone**.
- O sistema identifica o perfil automaticamente via cadastro no PostgreSQL.
- Usuário padrão inicial para gestão:
  - e-mail: `admin@arycar.com.br`
  - senha: `admin123`

### PostgreSQL e APIs prontas (fase inicial)

Sim, já é possível iniciar o uso de PostgreSQL agora.

- O banco já possui schema de clientes, veículos, ordens, serviços e funcionários.
- Foi adicionada estrutura de usuários (`users`) e status (`order_statuses`).
- Existe usuário **ADMIN padrão** no seed inicial:
  - e-mail: `admin@arycar.com.br`
  - senha inicial no seed: `admin123` (trocar no primeiro ciclo de segurança)
- Regra de negócio no banco: não permite duas ordens abertas para o mesmo veículo (`waiting`/`in_progress`).

APIs iniciais disponíveis:

- `GET /api/admin/default-user`
- `GET /api/users`
- `POST /api/users`
- `GET /api/services`
- `POST /api/services`
- `GET /api/order-statuses`
- `POST /api/order-statuses`
- `GET /api/orders/open-by-plate/:plate`
- `POST /api/orders`

### Catálogo estático para migração

- Lista dos serviços estáticos atuais: `docs/STATIC_SERVICES_LIST.md`.
- Recomendação: usar essa lista para popular o PostgreSQL e, em seguida, consumir somente do banco.

## Referência

Consulte também: **`DEPLOY_DOCKER_POSTGRES.md`**.
