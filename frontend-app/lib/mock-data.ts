import type { Product, Notification } from "./types"

export const initialProducts: Product[] = [
  { id: 1, name: "Laptop Dell XPS 13", price: 4500.0, stock: 10 },
  { id: 2, name: "Monitor LG UltraWide 34”", price: 2150.0, stock: 4 },
  { id: 3, name: "Tastatură Mecanică Keychron K2", price: 520.0, stock: 0 },
  { id: 4, name: "Mouse Logitech MX Master 3S", price: 480.0, stock: 23 },
  { id: 5, name: "Cască Sony WH-1000XM5", price: 1750.0, stock: 3 },
  { id: 6, name: "Webcam Logitech Brio 4K", price: 890.0, stock: 8 },
  { id: 7, name: "Docking Station CalDigit TS4", price: 1600.0, stock: 2 },
  { id: 8, name: "SSD Samsung 990 Pro 2TB", price: 1100.0, stock: 15 },
]

export const initialNotifications: Notification[] = [
  {
    event: "ORDER_CREATED",
    id: 1,
    message: "Comanda #1 creata de Stefan pentru 2x Laptop Dell XPS 13",
    timestamp: "2026-06-17T14:27:50Z",
  },
  {
    event: "STOCK_LOW",
    id: 2,
    message: "Stoc scăzut pentru Cască Sony WH-1000XM5 (3 unități rămase)",
    timestamp: "2026-06-17T14:21:12Z",
  },
  {
    event: "SYSTEM_SYNC",
    id: 3,
    message: "API Gateway sincronizat cu serviciul de inventar",
    timestamp: "2026-06-17T14:15:03Z",
  },
  {
    event: "STOCK_OUT",
    id: 4,
    message: "Stoc epuizat pentru Tastatură Mecanică Keychron K2",
    timestamp: "2026-06-17T14:02:47Z",
  },
]
