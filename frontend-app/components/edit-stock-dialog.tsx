"use client"

import { useEffect, useState } from "react"
import type { Product } from "@/lib/types"
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

type EditStockDialogProps = {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (product: Product) => void
}

export function EditStockDialog({ product, open, onOpenChange, onSaved }: EditStockDialogProps) {
  const [stock, setStock] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && product) {
      setStock(product.stock)
      setError(null)
      setSaving(false)
    }
  }, [open, product])

  if (!product) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stocul trebuie să fie un întreg pozitiv.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Actualizarea a eșuat.")
        return
      }
      onSaved(data.product)
      onOpenChange(false)
    } catch {
      setError("Eroare de rețea. Încercați din nou.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editează stocul</DialogTitle>
          <DialogDescription>
            Actualizați nivelul de stoc pentru acest produs. Trimite o cerere PUT către serviciul de inventar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-product">Produs</Label>
            <Input id="edit-product" value={product.name} readOnly className="bg-muted text-muted-foreground" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-stock">Stoc nou</Label>
            <Input
              id="edit-stock"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(Number(e.target.value))}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Anulează
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Se salvează…" : "Salvează"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
