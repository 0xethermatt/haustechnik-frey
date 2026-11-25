import * as React from 'react'
import { Label } from './label'
import { cn } from '@/lib/ops/utils'

/** Formularfeld mit Label, optionalem Hinweis und Fehlermeldung. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
  optional,
}: {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  className?: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? <span className="ml-1 font-normal text-muted-foreground">(optional)</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
