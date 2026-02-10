

# 🚗 ARYCAR - Sistema de Gestão de Estética Automotiva

## Visão Geral
Sistema completo de gestão para a ARYCAR, com dashboard de serviços, carrinho de ordens de serviço e painel administrativo. Visual dark premium com a identidade da marca.

---

## 1. Identidade Visual
- **Logo** ARYCAR centralizada no topo (da URL fornecida)
- **Tema dark** com fundo `#0a0a0a`, azul da logo nos botões/detalhes, texto branco/cinza claro
- **shadcn/ui** com tema dark customizado
- Interface profissional e limpa

---

## 2. Dashboard Principal (Página Inicial)

### Seletor de Porte do Veículo
- 3 botões grandes com ícones: **P** (Pequeno), **M** (Médio), **G** (Grande)
- Destaque visual no porte selecionado
- Obrigatório selecionar antes de adicionar serviços

### Grid de Serviços
- Cards organizados mostrando os **22 serviços** da planilha
- Cada card exibe: nome, preço do cliente (conforme porte selecionado), prazo e se precisa agendamento
- Serviços "por peça" (Martelinho, Envelopamento, Pequenos Reparos) terão campo de quantidade
- Indicador visual para serviços que requerem agendamento
- Regras especiais visíveis (ex: Vitrificação de pintura soma com Polimento)

### Carrinho / Ordem de Serviço
- Painel lateral com serviços adicionados
- Mostra preço individual, quantidade e total
- Botão para finalizar/gerar resumo da OS

---

## 3. Área Administrativa

### Tabela de Preços
- Tabela completa com todos os serviços
- Colunas: Serviço, Gasto P/M/G, Preço Cliente P/M/G, Prazo, Agendamento, Produtos, Observação
- Edição inline dos valores
- Cálculo automático da margem de lucro

### Cadastro de Serviços
- Formulário para adicionar novos serviços com todos os campos
- Editar e excluir serviços existentes

### Gestão de Funcionários
- Lista simples com nome e cargo
- Adicionar, editar e remover

---

## 4. Dados Iniciais
- Todos os **22 serviços** da planilha serão pré-carregados
- Incluindo: custos, preços, prazos, produtos utilizados, regras de preço e flag "por peça"

---

## 5. Persistência e Arquitetura
- **LocalStorage** para salvar todos os dados (serviços, funcionários, OSs)
- Camada de **services** centralizada para facilitar futura migração para API/banco
- Estado global com React Context

---

## 6. Arquivos Docker
- **Dockerfile** multi-estágio (Node.js build → Nginx:alpine)
- **docker-compose.yml** expondo na porta 8080

---

## 7. Navegação
- **Dashboard** → tela principal com seletor de porte e grid de serviços
- **Admin** → acesso via botão/menu, sem login (conforme solicitado)
- Dentro do Admin: abas para Tabela de Preços, Cadastro de Serviços e Funcionários

