export type Product = {
  id: number
  name: string
  price: number
  stock: number
}

export type SystemEvent = "ORDER_CREATED" | "STOCK_LOW" | "STOCK_OUT" | "SYSTEM_SYNC"

export type Notification = {
  event: SystemEvent
  id: number
  message: string
  timestamp: string
}

export type OrderPayload = {
  product_id: number
  quantity: number
  customer_name: string
}
