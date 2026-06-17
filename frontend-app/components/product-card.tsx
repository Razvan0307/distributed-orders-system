"use client"

import { Package, ShoppingCart, Pencil, Trash2 } from "lucide-react"
import type { Product } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const priceFormatter = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  minimumFractionDigits: 2,
})

function stockMeta(stock: number) {
  if (stock === 0) {
    return { label: "Stoc epuizat", className: "bg-destructive/10 text-destructive border-transparent" }
  }
  if (stock < 5) {
    return {
      label: `Stoc redus · ${stock}`,
      className: "bg-amber-500/10 text-amber-600 border-transparent dark:text-amber-400",
    }
  }
  return {
    label: `În stoc · ${stock}`,
    className: "bg-emerald-500/10 text-emerald-600 border-transparent dark:text-emerald-400",
  }
}

type ProductCardProps = {
  product: Product
  onBuy: (product: Product) => void
  adminMode?: boolean
  onEditStock?: (product: Product) => void
  onDelete?: (product: Product) => void
}

export function ProductCard({ product, onBuy, adminMode = false, onEditStock, onDelete }: ProductCardProps) {
  const meta = stockMeta(product.stock)
  const outOfStock = product.stock === 0

  return (
    <Card className="group flex flex-col justify-between gap-0 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-brand/10 group-hover:text-brand">
            <Package className="size-5" aria-hidden="true" />
          </div>
          <Badge variant="outline" className={cn("font-medium", meta.className)}>
            {meta.label}
          </Badge>
        </div>
        <h3 className="text-balance text-base font-semibold leading-snug">{product.name}</h3>
      </CardHeader>

      <CardContent className="flex flex-col gap-0.5">
        <p className="text-2xl font-bold tracking-tight">{priceFormatter.format(product.price)}</p>
        <p className="font-mono text-xs text-muted-foreground">ID produs · #{product.id}</p>
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-2">
        <Button
          className={cn("w-full gap-2", !outOfStock && "bg-brand text-brand-foreground hover:bg-brand/90")}
          variant={outOfStock ? "secondary" : "default"}
          disabled={outOfStock}
          onClick={() => onBuy(product)}
        >
          {!outOfStock && <ShoppingCart className="size-4" aria-hidden="true" />}
          {outOfStock ? "Indisponibil" : "Cumpără"}
        </Button>

        {adminMode && (
          <div className="flex w-full gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onEditStock?.(product)}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Editează stoc
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete?.(product)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Șterge
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
