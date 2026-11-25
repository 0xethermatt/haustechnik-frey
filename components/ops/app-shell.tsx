'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  CalendarDays,
  Clock,
  FileText,
  Home,
  LayoutGrid,
  LogOut,
  Plus,
  ShieldCheck,
  Timer,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/ops/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ThemeToggle } from './theme-toggle'
import type { NavIcon, NavItem } from './nav-items'
import { signOut } from '@/app/(ops)/intern/auth-actions'

const ICONS: Record<NavIcon, LucideIcon> = {
  home: Home,
  reports: FileText,
  calendar: CalendarDays,
  jobs: Wrench,
  customers: UserRound,
  time: Clock,
  timeOverview: Timer,
  employees: Users,
  users: ShieldCheck,
}

function isActive(pathname: string, href: string) {
  if (href === '/intern') return pathname === '/intern'
  if (href === '/intern/zeiten') return pathname === '/intern/zeiten'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppShell({
  items,
  userName,
  roleLabel,
  children,
}: {
  items: NavItem[]
  userName: string
  roleLabel: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const primaryMobile = items.filter((i) => ['home', 'reports'].includes(i.icon))
  const thirdMobile = items.find((i) => i.icon === 'time') ?? items.find((i) => i.icon === 'calendar')
  const mobileTabs = [...primaryMobile, ...(thirdMobile ? [thirdMobile] : [])]
  const moreItems = items.filter((i) => !mobileTabs.includes(i))

  return (
    <div className="min-h-dvh bg-muted/30 md:flex">
      {/* Desktop-Seitenleiste */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">F</div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Frey Haustechnik</div>
            <div className="text-xs text-muted-foreground">Betriebsplattform</div>
          </div>
        </div>
        <div className="px-3 pb-3">
          <Link
            href="/intern/berichte/neu"
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Neuer Bericht
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Hauptnavigation">
          {items.map((item) => {
            const Icon = ICONS[item.icon]
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                  active && 'bg-accent font-medium text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="space-y-3 border-t p-3">
          <ThemeToggle />
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{userName}</div>
              <div className="truncate text-xs text-muted-foreground">{roleLabel}</div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Abmelden"
                title="Abmelden"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-28 md:pb-10">{children}</main>

      {/* Mobile Tab-Leiste – für Bedienung mit dem Daumen */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur pb-safe md:hidden"
        aria-label="Hauptnavigation"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {mobileTabs.slice(0, 2).map((item) => (
            <TabLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
          <div className="flex justify-center">
            <Link
              href="/intern/berichte/neu"
              aria-label="Neuer Arbeitsbericht"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95"
            >
              <Plus className="h-7 w-7" />
            </Link>
          </div>
          {mobileTabs.slice(2, 3).map((item) => (
            <TabLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex h-full flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground',
              moreItems.some((i) => isActive(pathname, i.href)) && 'text-primary',
            )}
          >
            <LayoutGrid className="h-5 w-5" />
            Mehr
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent title="Mehr" description={`${userName} · ${roleLabel}`}>
          <div className="grid grid-cols-3 gap-2">
            {moreItems.map((item) => {
              const Icon = ICONS[item.icon]
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border bg-card p-2 text-center text-xs font-medium',
                    isActive(pathname, item.href) && 'border-primary text-primary',
                  )}
                >
                  <Icon className="h-6 w-6" />
                  {item.label}
                </Link>
              )
            })}
          </div>
          <div className="mt-4 space-y-3">
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium text-destructive"
              >
                <LogOut className="h-4 w-4" /> Abmelden
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = ICONS[item.icon]
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-full flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground',
        active && 'font-medium text-primary',
      )}
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  )
}
