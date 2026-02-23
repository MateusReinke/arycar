# Banco PostgreSQL separado no Coolify (com migração fácil depois)

Este guia cria o banco **independente** do projeto AryCar no Coolify, mantendo uma estrutura pronta para conectar qualquer app agora e migrar depois com mínimo esforço.

## Objetivo da arquitetura

- Banco como recurso separado no Coolify (não acoplado ao container da aplicação).
- Estrutura SQL versionada em arquivos (`001_...`, `002_...`).
- Políticas de acesso por papel (`runtime` e `readonly`).
- Caminho simples para evoluir para migrações (Flyway/Prisma/Knex) sem retrabalho.

---

## 1) Criar o banco separado no Coolify

1. No Coolify, clique em **New Resource**.
2. Selecione **PostgreSQL**.
3. Defina:
   - `Database`: `arycar_db`
   - `User`: (ex. `arycar_admin`)
   - `Password`: senha forte
4. Faça deploy do recurso.
5. Salve a string de conexão gerada pelo Coolify (host, porta, db, usuário, senha).

> Dica: mantenha esse banco em um projeto de infraestrutura separado do app.

---

## 2) Aplicar estrutura de tabelas

Use o arquivo:

- `docker/postgres/standalone/001_schema.sql`

Exemplo (local, usando `psql`):

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/arycar_db" -f docker/postgres/standalone/001_schema.sql
```

Esse script cria:

- Tipos (`vehicle_type`, `vehicle_size`)
- Tabelas principais (clientes, veículos, serviços, ordens etc.)
- Índices
- Trigger de `updated_at`
- Seeds básicos (`admin`, status de OS e `settings`)

---

## 3) Aplicar políticas de acesso

Use o arquivo:

- `docker/postgres/standalone/002_roles_policies.sql`

Exemplo:

```bash
psql "postgresql://USER:PASSWORD@HOST:5432/arycar_db" -f docker/postgres/standalone/002_roles_policies.sql
```

Esse script cria:

- Roles sem login: `arycar_owner`, `arycar_app_rw`, `arycar_app_ro`
- Usuários de login:
  - `arycar_runtime` (leitura/escrita)
  - `arycar_readonly` (somente leitura)
- Grants para objetos atuais e futuros (`ALTER DEFAULT PRIVILEGES`)

> **Importante:** troque as senhas `CHANGE_ME_*` imediatamente após aplicar o script.

---

## 4) Conectar o projeto sem acoplar no compose

No app/API, configure as variáveis de conexão:

```env
DATABASE_HOST=HOST
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=arycar_admin
DATABASE_PASSWORD=SENHA
```

Assim você mantém:

- aplicação escalável separadamente;
- banco com ciclo de vida independente;
- migração para outro servidor gerenciando apenas variáveis de ambiente.

---

## 5) Estratégia de migração futura (recomendada)

Estruture as próximas mudanças SQL em pasta versionada, por exemplo:

```text
migrations/
  001_schema.sql
  002_roles_policies.sql
  003_add_new_table.sql
```

Boas práticas:

- Nunca editar migration antiga em produção.
- Só adicionar novos arquivos incrementais.
- Versionar no Git.
- Rodar migration em CI/CD antes do deploy da aplicação.

---

## 6) RLS / multi-tenant no futuro

O arquivo `002_roles_policies.sql` já deixa um bloco comentado para RLS (Row-Level Security).

Quando quiser multi-tenant:

1. adicionar `organization_id` nas tabelas relevantes;
2. ativar `ENABLE ROW LEVEL SECURITY`;
3. criar policies com `current_setting('app.current_org_id')`.

Isso permite escalar de tenant único para multi-tenant sem recriar o banco.
