import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string
  description?: React.ReactNode
  back?: { href: string; label: string }
  actions?: React.ReactNode
}) {
  return (
    <div className="border-b bg-background">
      <div className="mx-auto max-w-6xl px-4 py-4 md:px-8 md:py-6">
        {back ? (
          <Link
            href={back.href}
            className="-ml-1 mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            {back.label}
          </Link>
        ) : null}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">{title}</h1>
            {description ? <div className="mt-1 text-sm text-muted-foreground">{description}</div> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </div>
  )
}

export function PageBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl space-y-4 px-4 py-4 md:space-y-6 md:px-8 md:py-6 ${className}`}>{children}</div>
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-background px-6 py-10 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
