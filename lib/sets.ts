import { roundMoney, type CartItem, type Occasion, type Product } from "./data";

/** A complete outfit sold together at a discount. */
export type OutfitSet = {
  id: string;
  name: string;
  description: string;
  /** Pieces in the set, by product id. */
  productIds: number[];
  /** Percentage off the pieces' combined price. */
  discountPercent: number;
  occasions?: Occasion[];
};

export type SetPricing = {
  pieces: Product[];
  /** Combined price of the pieces bought separately. */
  full: number;
  /** Set price, rounded to the nearest €0.10. */
  price: number;
  saving: number;
  /** False when any piece is missing or sold out. */
  available: boolean;
};

export function setPricing(set: OutfitSet, products: Product[]): SetPricing | null {
  const pieces = set.productIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => product !== undefined);
  if (pieces.length !== set.productIds.length) return null;

  const full = roundMoney(pieces.reduce((total, piece) => total + piece.price, 0));
  const price = Math.round(full * (1 - set.discountPercent / 100) * 10) / 10;
  return {
    pieces,
    full,
    price,
    saving: roundMoney(full - price),
    available: pieces.every((piece) => piece.stock > 0),
  };
}

export type SetDiscount = {
  set: OutfitSet;
  /** How many complete copies of the set are in the cart. */
  completeSets: number;
  amount: number;
  /** Set lines are in the cart but at least one piece is missing. */
  incomplete: boolean;
};

/**
 * Discounts for sets in the cart. A set counts once for every complete
 * group of its pieces added as that set; a missing piece removes the discount.
 */
export function setDiscounts(cart: CartItem[], products: Product[], sets: OutfitSet[]): SetDiscount[] {
  const result: SetDiscount[] = [];
  for (const set of sets) {
    const lines = cart.filter((item) => item.setId === set.id);
    if (!lines.length) continue;
    const pricing = setPricing(set, products);
    const completeSets = Math.min(
      ...set.productIds.map((id) =>
        lines.filter((line) => line.id === id).reduce((total, line) => total + line.qty, 0),
      ),
    );
    result.push({
      set,
      completeSets,
      amount: pricing ? completeSets * pricing.saving : 0,
      incomplete: completeSets === 0 || lines.some((line) => line.qty > completeSets),
    });
  }
  return result;
}

export const totalSetDiscount = (discounts: SetDiscount[]) =>
  discounts.reduce((total, discount) => total + discount.amount, 0);
