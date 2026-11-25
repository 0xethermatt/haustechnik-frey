import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fullName(p: { first_name?: string | null; last_name?: string | null }): string {
  return [p.first_name, p.last_name].filter(Boolean).join(' ')
}

export function customerName(c: { first_name?: string | null; last_name?: string | null; company_name?: string | null }): string {
  if (c.company_name) return c.company_name
  return fullName(c) || 'Unbenannter Kunde'
}

export function formatAddress(a: { street?: string | null; postal_code?: string | null; city?: string | null }): string {
  const place = [a.postal_code, a.city].filter(Boolean).join(' ')
  return [a.street, place].filter(Boolean).join(', ')
}

export const formatCustomerNumber = (n: number) => `K-${n}`
export const formatJobNumber = (n: number) => `A-${n}`
export const formatReportNumber = (n: number) => `B-${n}`

export function formatQuantity(q: number): string {
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 3 }).format(q)
}
