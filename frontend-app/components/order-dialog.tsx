"use client"

import { useEffect, useState } from "react"
import type { Product, OrderPayload } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

type OrderDialogProps = {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: OrderPayload) => void
}

export function OrderDialog({ product, open, onOpenChange, onSubmit }: OrderDialogProps) {
  const [quantity, setQuantity] = useState(1)
  const [customerName, setCustomerName] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setQuantity(1)
      setCustomerName("")
      setError(null)
    }
  }, [open])

  if (!product) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      setError("Introduceți numele clientului.")
      return
    }
    if (quantity < 1 || quantity > product.stock) {
      setError(`Cantitatea trebuie să fie între 1 și ${product.stock}.`)
      return
    }
    onSubmit({
      product_id: product.id,
      quantity,
      customer_name: customerName.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plasează o comandă</DialogTitle>
          <DialogDescription>
            Completați detaliile pentru a trimite comanda către serviciul de comenzi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="product">Produs</Label>
            <Input id="product" value={product.name} readOnly className="bg-muted text-muted-foreground" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Cantitate (max {product.stock})</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer">Nume client</Label>
            <Input
              id="customer"
              placeholder="ex. Ștefan"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button type="submit">Plasează Comanda</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
