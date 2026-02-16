# Lista estática de serviços (estado atual do código)

Fonte atual: `src/data/services.ts`.

## Serviços cadastrados estaticamente

1. Lavagem Simples
2. Lavagem Detalhada
3. Lavagem de Motor - Parcial
4. Lavagem de Motor - Completo
5. Lavagem de Chassi
6. Lavagem Caixa de Roda
7. Remoção de Chuva Ácida
8. Cristalização de Vidros
9. Polimento Comercial
10. Polimento Técnico
11. Vitrificação de Pintura
12. Clareamento de Faróis
13. Vitrificação de Faróis
14. Vitrificação de Plásticos
15. Vitrificação de Couro
16. Higienização
17. Oxi Sanitização
18. Descontaminação de Pintura
19. Martelinho de Ouro
20. Envelopamento
21. Pequenos Reparos Express

## Observação

- Esta lista pode ser usada como base para seed no PostgreSQL via API `POST /api/services`.
- O próximo passo recomendado é migrar os dados para o banco e remover dependência da lista estática no frontend.
