'use client'

import { useEffect, useRef, useState } from 'react'
import { scrollToId } from './WPContext'

export interface SubNavItem {
  id: string
  label: string
}

export default function WPSubNav({ items }: { items: SubNavItem[] }) {
  const [active, setActive] = useState<string>('')
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )
    items.forEach((i) => {
      const el = document.getElementById(i.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [items])

  useEffect(() => {
    // Nur horizontal scrollen – scrollIntoView würde laufendes Seiten-Scrolling abbrechen
    const list = listRef.current
    const btn = list?.querySelector<HTMLButtonElement>(`[data-id="${active}"]`)
    if (list && btn) {
      list.scrollTo({ left: btn.offsetLeft - list.clientWidth / 2 + btn.clientWidth / 2, behavior: 'smooth' })
    }
  }, [active])

  return (
    <nav
      aria-label="Seitennavigation Wärmepumpe"
      className="sticky top-16 z-30 bg-brand-cream/95 backdrop-blur border-b border-brand-purple/10"
    >
      <ul
        ref={listRef}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {items.map((item) => (
          <li key={item.id} className="flex-shrink-0">
            <button
              data-id={item.id}
              onClick={() => scrollToId(item.id)}
              className={`text-sm font-semibold px-4 py-2 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange ${
                active === item.id
                  ? 'bg-brand-purple text-white'
                  : item.id === 'anfrage'
                  ? 'bg-brand-orange/15 text-brand-orange-dark hover:bg-brand-orange/25'
                  : 'text-brand-purple-deep/70 hover:bg-brand-purple/10'
              }`}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
