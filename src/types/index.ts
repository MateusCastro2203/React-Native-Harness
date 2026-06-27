// Tipos de domínio canônicos da loja. Identificadores em EN; prosa em PT-BR.
// Estes tipos funcionam como "sensor natural": a tipagem estrita pega erros
// antes do runtime (ver CLAUDE.md e specs/project.md §2).

/** Agrupa produtos; base do filtro por categoria (DEMO-2). */
export interface Category {
  id: string;
  name: string;
  slug: string;
}

/**
 * Item do catálogo.
 * `price` é SEMPRE em centavos (inteiro) — evita erro de ponto flutuante; a
 * formatação para moeda acontece só na UI (componente Price).
 * `categoryId` referencia Category.id.
 */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  inStock: boolean;
}

/** Linha do carrinho: um produto e sua quantidade (>= 1). */
export interface CartItem {
  product: Product;
  quantity: number;
}

/** Cupom de desconto (DEMO-1). `discountPercent` na escala 0–100. */
export interface Coupon {
  code: string;
  discountPercent: number;
  description?: string;
}
