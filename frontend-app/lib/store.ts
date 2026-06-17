import type { Product } from "./types"
import { initialProducts } from "./mock-data"

// In-memory product store shared across API route handlers.
// Seeded from the mock catalog; persists for the lifetime of the server process.
const store: { products: Product[]; nextId: number } = {
  products: initialProducts.map((p) => ({ ...p })),
  nextId: Math.max(...initialProducts.map((p) => p.id)) + 1,
}

export function getProducts(): Product[] {
  return store.products
}

export function findProduct(id: number): Product | undefined {
  return store.products.find((p) => p.id === id)
}

export function updateProductStock(id: number, stock: number): Product | undefined {
  const product = store.products.find((p) => p.id === id)
  if (!product) return undefined
  product.stock = stock
  return product
}

export function deleteProduct(id: number): boolean {
  const index = store.products.findIndex((p) => p.id === id)
  if (index === -1) return false
  store.products.splice(index, 1)
  return true
}

export function addProduct(data: { name: string; price: number; stock: number }): Product {
  const product: Product = { id: store.nextId++, ...data }
  store.products.push(product)
  return product
}
