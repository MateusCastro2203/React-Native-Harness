# Especificação do Projeto — Loja Mobile (catálogo + carrinho)

> **O que é este arquivo.** Esta é a *especificação macro* do projeto: o **feedforward de
> nível alto** que o `planner` consulta **antes** de planejar qualquer ticket. Ele descreve a
> visão do produto, os domínios e tipos, as regras de negócio do carrinho, a arquitetura de
> navegação e os padrões de UI que valem para o repositório inteiro.
>
> As **convenções operacionais** (SafeArea sempre, styled-components, camelCase, estrutura de
> pastas, Definition of Done, idioma PT na prosa / EN no código) vivem no `CLAUDE.md` da raiz e
> **não são duplicadas aqui** — este documento as referencia. As specs por ticket
> (`specs/tickets/DEMO-1.md` … `DEMO-7.md`) detalham cada feature individualmente.

---

## 1. Visão do produto

App de **loja mobile** que demonstra um fluxo de e-commerce enxuto: o usuário navega por um
**catálogo** de produtos, abre o **detalhe** de um item, adiciona ao **carrinho**, ajusta
quantidades e vê **subtotal e total** atualizados. Os dados são **100% mockados** (sem backend):
existe uma fake API com latência simulada e estados de `loading`/`error` para que a experiência
seja realista sem depender de rede.

O produto é o **palco** para a palestra `Agent = Model + Harness`: é simples o bastante para ser
navegável em segundos, mas tem regras de negócio reais (totais, quantidades, cupom) que servem de
alvo verificável para os sensores (`typecheck`, `lint`, `test`) e para o backlog de tickets.

**Não-objetivos (fora de escopo):** autenticação, pagamento real, persistência remota, backend,
push notifications, internacionalização. Favoritos são opcionais.

---

## 2. Domínios e tipos

Os tipos de domínio vivem em `src/types/` e funcionam como **sensor natural** (tipagem estrita
pega erros antes do runtime). Identificadores em **inglês** (ver `CLAUDE.md`).

| Tipo | Campos principais | Papel |
|------|-------------------|-------|
| `Product` | `id`, `name`, `description`, `price` (centavos), `categoryId`, `imageUrl`, `inStock` | Item do catálogo |
| `Category` | `id`, `name`, `slug` | Agrupa produtos; base do filtro (DEMO-2) |
| `CartItem` | `product: Product`, `quantity` | Linha do carrinho |
| `Coupon` | `code`, `discountPercent` (0–100), `description?` | Cupom de desconto (DEMO-1) |

**Convenções de dados:**
- **Preço em centavos** (inteiro) para evitar erro de ponto flutuante; a formatação para moeda
  acontece só na camada de UI (componente `Price`).
- `id` é `string`. `quantity` é inteiro `>= 1` (remover item quando chega a 0).
- Catálogo e categorias estáticos em `src/data/products.ts`; acesso sempre via
  `src/services/api.ts` (mesmo sendo mock) para preservar o contrato de loading/error.

---

## 3. Regras de negócio do carrinho

Estado global do carrinho em `src/store/cart.store.ts` (Zustand). Selectors derivados expostos via
hooks em `src/hooks/` (ex.: `useCart`). Regras (toda a lógica em **centavos**, inteiros):

### 3.1 Operações e selectors do store

O store (`useCartStore`, Zustand) expõe **ações** que mutam o estado e **selectors derivados
como funções** (`subtotal()`, `total()`) — coerentes com o uso `useCartStore.getState().total()`
nos testes de aceite. O estado guarda também o `coupon` ativo (`Coupon | null`).

Ações:
- **`add(product)`** — se o produto já está no carrinho, incrementa `quantity` em 1; senão, cria
  `CartItem` com `quantity = 1`. (Assinatura de um único argumento; para somar N unidades,
  chamar `add` N vezes.)
- **`remove(productId)`** — remove a linha inteira do carrinho.
- **`updateQty(productId, quantity)`** — define a quantidade. Se `quantity <= 0`, **remove** a
  linha. Quantidade é sempre inteiro `>= 1` quando a linha existe.
- **`clear()`** — esvazia o carrinho (remove todas as linhas).
- **`applyCoupon(code)`** — valida `code` contra os cupons conhecidos; se válido, guarda o
  `Coupon` em `coupon`; se inválido, mantém `coupon = null` (DEMO-1).
- **`removeCoupon()`** — zera o cupom ativo (`coupon = null`).

Selectors (funções):
- **`subtotal()`** — ver §3.3.
- **`total()`** — ver §3.4.

### 3.2 Quantidades
- `itemCount` = soma das `quantity` de todas as linhas (base do badge do ícone — DEMO-5).
- Cada `CartItem` tem `quantity >= 1`; não existe linha com quantidade 0.

### 3.3 Subtotal
- **`subtotal`** = `Σ (item.product.price × item.quantity)` sobre todas as linhas, em centavos.
- Carrinho vazio ⇒ `subtotal = 0`.

### 3.4 Total
- **`total`** parte do `subtotal` e aplica, **nesta ordem**, os ajustes ativos:
  1. **Desconto de cupom** (DEMO-1): se há cupom ativo, subtrai
     `round(subtotal × discountPercent / 100)`. O desconto incide sobre o **total** — não apenas
     sobre um subtotal exibido.
  2. **Frete** (DEMO-6): frete grátis acima de um limite `X`; abaixo, soma a taxa de frete.
- `total` nunca é negativo (piso em 0).
- Carrinho vazio ⇒ `total = 0` e cupom/frete não se aplicam.

> **Atenção — bug plantado (DEMO-1).** A base inclui um `applyCoupon` **deliberadamente
> incompleto**: ele guarda o cupom e desconta apenas no **subtotal exibido**, deixando o `total`
> errado. O teste de aceite do `total` com desconto **não existe** na base (por isso o estado
> inicial fica verde). Esse é o caso destacado do demo — detalhes em `specs/tickets/DEMO-1.md`.

### 3.5 Invariantes (verificáveis por teste)
- `total <= subtotal` sempre que houver desconto e sem frete.
- Sem cupom e sem frete ⇒ `total == subtotal`.
- Todas as operações são puras sobre o estado (sem efeitos colaterais externos), o que torna a
  lógica testável em isolamento via Jest + RNTL (`tests/`).

---

## 4. Arquitetura de navegação (expo-router)

Navegação baseada em arquivos com `expo-router` 4. Estrutura em `app/`:

```
app/
├─ _layout.tsx            # Stack raiz + SafeAreaProvider + providers globais
├─ (tabs)/
│  ├─ _layout.tsx         # Tab navigator: Catálogo · Busca · Carrinho
│  ├─ index.tsx           # Catálogo (grid de produtos)
│  ├─ search.tsx          # Busca por nome / filtro por categoria / ordenação
│  └─ cart.tsx            # Carrinho (linhas, subtotal, total, cupom)
└─ product/[id].tsx       # Detalhe do produto (stack, empilha sobre as tabs)
```

- **Raiz = Stack.** O `_layout.tsx` raiz monta o `SafeAreaProvider` e os providers globais, e
  declara um `Stack` que contém o grupo `(tabs)` e a rota dinâmica `product/[id]`.
- **Tabs.** Três abas fixas: **Catálogo** (`index`), **Busca** (`search`), **Carrinho** (`cart`).
  O ícone do Carrinho exibe um **badge** com `itemCount` (DEMO-5).
- **Detalhe do produto.** `product/[id].tsx` recebe o `id` via parâmetro de rota, busca o produto
  pela fake API e oferece "adicionar ao carrinho".
- **SafeArea sempre.** `SafeAreaProvider` na raiz; cada tela é envolvida em `SafeAreaView`
  (`react-native-safe-area-context`). Detalhe da convenção no `CLAUDE.md`.

---

## 5. Padrões de UI

- **Estilo:** `styled-components/native`. **Nunca** `StyleSheet.create` solto nas telas.
  Componentes estilizados são **nomeados** (ex.: `Container`, `CardTitle`, `PriceLabel`).
- **Componentes reutilizáveis** em `src/components/` (PascalCase no nome e no arquivo —
  `ProductCard.tsx`, `QtyStepper.tsx`, `Price.tsx`). Telas compõem componentes; não embutem
  lógica de domínio.
- **Catálogo:** grid de `ProductCard` (imagem, nome, preço, ação de adicionar).
- **Carrinho:** lista de linhas com `QtyStepper` (− / qty / +), `Price` por linha, e rodapé com
  **subtotal** e **total** destacados; campo de **cupom** (DEMO-1).
- **Formatação de moeda** só no componente `Price` (recebe centavos, exibe `R$ x,xx`).
- **Estados de carregamento/erro** vindos da fake API são refletidos na UI (skeleton/loading e
  mensagem de erro com retry).
- **Acessibilidade mínima:** elementos interativos com rótulo acessível; alvos de toque adequados.

> As demais regras de nomenclatura, organização de estado (Zustand em `src/store`, selectors em
> `src/hooks`) e a Definition of Done estão no `CLAUDE.md` e **não são repetidas aqui**.

---

## 6. Backlog de tickets (DEMO-1 … DEMO-7)

Cada ticket vira `specs/tickets/<KEY>.md` (espelhando o Jira) e é resolvido pelo workflow
`/resolve <KEY> [--pr]`. Complexidade crescente:

| Ticket | Feature — uma linha |
|--------|---------------------|
| `DEMO-1` | **Cupom de desconto** no carrinho — código válido aplica % de desconto **ao `total`** (o demo destacado; bug plantado garante o vermelho determinístico). |
| `DEMO-2` | **Filtro por categoria** — selecionar uma categoria restringe o catálogo aos produtos daquele `categoryId`. |
| `DEMO-3` | **Busca por nome** — campo de texto filtra produtos cujo `name` casa com o termo (case-insensitive). |
| `DEMO-4` | **Ordenação por preço** — alternar entre menor→maior e maior→menor sobre a lista exibida. |
| `DEMO-5` | **Badge de quantidade** no ícone do Carrinho — exibe `itemCount` e some quando o carrinho está vazio. |
| `DEMO-6` | **Frete grátis acima de X** — calcula frete no `total`; gratuito quando `subtotal >= X`. |
| `DEMO-7` | **Resumo de checkout** — tela/seção consolidando itens, subtotal, descontos, frete e total final. |

---

## 7. Referências

- **`CLAUDE.md`** (raiz) — convenções operacionais, estrutura de pastas, Definition of Done,
  idioma (PT na prosa, EN no código), como invocar o workflow.
- **`AGENTS.md`** (raiz) — resumo dos 4 especialistas, regras e workflow.
- **`.claude/commands/resolve.md`** — contrato do orquestrador (`/resolve <KEY> [--pr]`).
- **`specs/tickets/DEMO-1.md` … `DEMO-7.md`** — specs por ticket (critérios de aceite verificáveis).
