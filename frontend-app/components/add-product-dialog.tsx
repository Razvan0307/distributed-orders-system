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

type AddProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (product: Product) => void
}

export function AddProductDialog({ open, onOpenChange, onCreated }: AddProductDialogProps) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName("")
      setPrice("")
      setStock("")
      setError(null)
      setSaving(false)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const priceNum = Number(price)
    const stockNum = Number(stock)

    if (!name.trim()) {
      setError("Numele produsului este obligatoriu.")
      return
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Prețul trebuie să fie un număr pozitiv.")
      return
    }
    if (!Number.isInteger(stockNum) || stockNum < 0) {
      setError("Stocul trebuie să fie un întreg pozitiv.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), price: priceNum, stock: stockNum }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Crearea a eșuat.")
        return
      }
      onCreated(data.product)
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
          <DialogTitle>Adaugă produs nou</DialogTitle>
          <DialogDescription>
            Înregistrați un produs nou în catalog. Trimite o cerere POST către serviciul de produse.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="new-name">Nume produs</Label>
            <Input
              id="new-name"
              placeholder="ex. Tabletă Samsung Galaxy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-price">Preț (RON)</Label>
              <Input
                id="new-price"
                type="number"
                min={0}
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-stock">Stoc inițial</Label>
              <Input
                id="new-stock"
                type="number"
                min={0}
                placeholder="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
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
              {saving ? "Se adaugă…" : "Adaugă produs"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
