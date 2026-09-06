# Imagens de antes/depois

Esta pasta guarda as fotos usadas no comparador "antes/depois" da homepage
(seção Galeria). Os arquivos são servidos como estáticos — trocar o arquivo
aqui atualiza o site sem precisar mexer em código.

## Padrão de nome

```
<slug-do-serviço>-antes.jpg
<slug-do-serviço>-depois.jpg
```

Serviços atuais:

| Serviço              | Antes                       | Depois                       |
| --------------------- | ---------------------------- | ------------------------------ |
| Polimento              | `polimento-antes.jpg`         | `polimento-depois.jpg`          |
| Vitrificação            | `vitrificacao-antes.jpg`       | `vitrificacao-depois.jpg`        |
| Higienização            | `higienizacao-antes.jpg`       | `higienizacao-depois.jpg`        |

## Como trocar pelas fotos reais

Basta substituir o arquivo mantendo o mesmo nome (formato `.jpg`, ideal
paisagem, mínimo ~1200x800px, mesmo enquadramento no "antes" e no "depois"
para o slider comparar bem). Nenhuma alteração de código é necessária.

## Adicionar um novo serviço ao comparador

1. Coloque as duas imagens aqui seguindo o padrão acima.
2. Em `src/pages/Homepage.tsx`, adicione uma entrada em `beforeAfterShowcases`
   usando `beforeAfterImage('<slug-do-serviço>', 'antes' | 'depois')`.

As imagens atuais são ilustrações geradas automaticamente (placeholder) e
devem ser substituídas por fotos reais dos serviços.
