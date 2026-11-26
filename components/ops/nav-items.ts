export type NavIcon =
  | 'home'
  | 'reports'
  | 'calendar'
  | 'jobs'
  | 'customers'
  | 'time'
  | 'timeOverview'
  | 'employees'
  | 'users'
  | 'check'

export interface NavItem {
  href: string
  label: string
  icon: NavIcon
}

export function navItemsFor(roles: { isOffice: boolean; isAdmin: boolean; isEmployee: boolean }): NavItem[] {
  const items: NavItem[] = [
    { href: '/intern', label: roles.isOffice ? 'Übersicht' : 'Heute', icon: 'home' },
    ...(roles.isOffice ? [{ href: '/intern/abgabe', label: 'Abgabe-Check', icon: 'check' as const }] : []),
    { href: '/intern/berichte', label: 'Berichte', icon: 'reports' },
    { href: '/intern/kalender', label: 'Kalender', icon: 'calendar' },
    { href: '/intern/auftraege', label: 'Aufträge', icon: 'jobs' },
    { href: '/intern/kunden', label: 'Kunden', icon: 'customers' },
  ]
  if (roles.isEmployee) items.push({ href: '/intern/zeiten', label: 'Meine Zeiten', icon: 'time' })
  if (roles.isOffice) {
    items.push({ href: '/intern/zeiten/uebersicht', label: 'Zeitübersicht', icon: 'timeOverview' })
    items.push({ href: '/intern/mitarbeiter', label: 'Mitarbeiter', icon: 'employees' })
  }
  if (roles.isAdmin) items.push({ href: '/intern/benutzer', label: 'Zugänge', icon: 'users' })
  return items
}
