export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  color: string;
  stock: number;
  description: string;
};

export const categories = [
  "Dirndl",
  "Dirndl Blouses",
  "Lederhosen",
  "Traditional Shirts",
  "Traditional Jackets",
  "Accessories",
  "Kids",
  "Sale",
];

const productImages = [
  "/images/asset-03.webp",
  "/images/asset-04.webp",
  "/images/asset-05.webp",
  "/images/asset-06.webp",
  "/images/asset-07.webp",
  "/images/asset-08.webp",
  "/images/asset-09.webp",
  "/images/asset-10.webp",
  "/images/asset-11.webp",
];

const productNames = [
  "Emilia Dirndl",
  "Rosalie Dirndl",
  "Sofia Dirndl",
  "Marie Dirndl Blouse",
  "Anton Lederhosen",
  "Lukas Traditional Shirt",
  "Clara Traditional Jacket",
  "Traditional Handbag",
  "Amelie Dirndl",
  "Helena Dirndl",
  "Traditional Vest",
  "Victoria Dirndl",
];

const productCategoryIndexes = [0, 0, 0, 1, 2, 3, 4, 5, 0, 0, 4, 0];
const productPrices = [
  149.9, 179.9, 129.9, 49.9, 119.9, 69.9, 139.9, 39.9, 199.9, 159.9, 99.9,
  189.9,
];
const productColors = ["Rose", "Sage", "Cream", "Black", "Brown"];

export const products: Product[] = Array.from({ length: 36 }, (_, index) => ({
  id: index + 1,
  name:
    productNames[index % 12] +
    (index > 11 ? ` ${Math.floor(index / 12) + 1}` : ""),
  category: categories[productCategoryIndexes[index % 12]],
  price: productPrices[index % 12],
  oldPrice: index % 4 === 0 ? 229.9 : undefined,
  image: productImages[index % productImages.length],
  color: productColors[index % productColors.length],
  stock: 5 + (index * 7) % 45,
  description:
    "Discover timeless traditional fashion with thoughtful details, quality materials, and an elegant fit.",
}));

export const money = (amount: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
  }).format(amount);

export const initialOrders = [
  {
    id: "KD-1028",
    customer: "Anna Müller",
    date: "2026-10-24",
    total: 179.9,
    status: "New",
  },
  {
    id: "KD-1027",
    customer: "Sophie Weber",
    date: "2026-10-23",
    total: 229.8,
    status: "Shipped",
  },
  {
    id: "KD-1026",
    customer: "Lena Fischer",
    date: "2026-10-22",
    total: 149.9,
    status: "Processing",
  },
  {
    id: "KD-1025",
    customer: "Emma Schmidt",
    date: "2026-10-21",
    total: 99.9,
    status: "Delivered",
  },
];
