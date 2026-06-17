"use client"

import { Bell, CheckCircle2, AlertTriangle, XCircle, RefreshCcw } from "lucide-react"
import type { Notification, SystemEvent } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

const eventMeta: Record<SystemEvent, { label: string; icon: typeof Bell; className: string; dot: string }> = {
  ORDER_CREATED: {
    label: "Comandă creată",
    icon: CheckCircle2,
    className: "text-emerald-500 bg-emerald-500/10",
    dot: "bg-emerald-500",
  },
  STOCK_LOW: {
    label: "Stoc redus",
    icon: AlertTriangle,
    className: "text-amber-500 bg-amber-500/10",
    dot: "bg-amber-500",
  },
  STOCK_OUT: {
    label: "Stoc epuizat",
    icon: XCircle,
    className: "text-destructive bg-destructive/10",
    dot: "bg-destructive",
  },
  SYSTEM_SYNC: {
    label: "Sincronizare",
    icon: RefreshCcw,
    className: "text-sky-500 bg-sky-500/10",
    dot: "bg-sky-500",
  },
}

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

type NotificationsBellProps = {
  notifications: Notification[]
  unreadCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsBell({ notifications, unreadCount, open, onOpenChange }: NotificationsBellProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative size-9 rounded-full"
            aria-label={`Notificări${unreadCount ? `, ${unreadCount} necitite` : ""}`}
          />
        }
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold leading-5 text-brand-foreground ring-2 ring-card">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(92vw,24rem)] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold">Notificări Sistem</h2>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {notifications.length}
          </span>
        </div>

        <ScrollArea className="h-[min(60vh,26rem)]">
          <ol className="divide-y divide-border">
            {notifications.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">Nicio notificare momentan.</li>
            )}
            {notifications.map((n) => {
              const meta = eventMeta[n.event]
              const Icon = meta.icon
              return (
                <li key={n.id} className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                      meta.className,
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{meta.label}</span>
                      <span className="text-[11px] text-muted-foreground">{formatTimestamp(n.timestamp)}</span>
                    </div>
                    <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{n.message}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
