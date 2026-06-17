import { NextResponse } from "next/server"
import { addProduct, getProducts } from "@/lib/store"

export async function GET() {
  return NextResponse.json({ products: getProducts() })
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corp JSON invalid." }, { status: 400 })
  }

  const { name, price, stock } = (body ?? {}) as Record<string, unknown>

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Numele produsului este obligatoriu." }, { status: 400 })
  }
  if (typeof price !== "number" || Number.isNaN(price) || price < 0) {
    return NextResponse.json({ error: "Prețul trebuie să fie un număr pozitiv." }, { status: 400 })
  }
  if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Stocul trebuie să fie un întreg pozitiv." }, { status: 400 })
  }

  const product = addProduct({ name: name.trim(), price, stock })
  return NextResponse.json({ product }, { status: 201 })
}
