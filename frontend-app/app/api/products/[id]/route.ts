import { NextResponse } from "next/server"
import { deleteProduct, findProduct, updateProductStock } from "@/lib/store"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = Number(id)
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ error: "ID produs invalid." }, { status: 400 })
  }

  if (!findProduct(productId)) {
    return NextResponse.json({ error: "Produsul nu a fost găsit." }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corp JSON invalid." }, { status: 400 })
  }

  const { stock } = (body ?? {}) as Record<string, unknown>
  if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0) {
    return NextResponse.json({ error: "Stocul trebuie să fie un întreg pozitiv." }, { status: 400 })
  }

  const product = updateProductStock(productId, stock)
  return NextResponse.json({ product })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = Number(id)
  if (!Number.isInteger(productId)) {
    return NextResponse.json({ error: "ID produs invalid." }, { status: 400 })
  }

  const deleted = deleteProduct(productId)
  if (!deleted) {
    return NextResponse.json({ error: "Produsul nu a fost găsit." }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
