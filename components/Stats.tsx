'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Briefcase, Phone } from 'lucide-react'

interface StatItem {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  sublabel: string
  color: string
}

const stats: StatItem[] = [
  {
    icon: <Clock className="w-7 h-7" />,
    value: 30,
    suffix: '+',
    label: 'Jahre selbständig',
    sublabel: 'Meisterbetrieb seit 1994',
    color: 'text-brand-orange',
  },
  {
    icon: <Briefcase className="w-7 h-7" />,
    value: 500,
    suffix: '+',
    label: 'Projekte',
    sublabel: 'Erfolgreich abgeschlossen',
    color: 'text-brand-purple',
  },
  {
    icon: <Phone className="w-7 h-7" />,
    value: 24,
    suffix: '/6',
    label: 'Erreichbarkeit',
    sublabel: 'Auch am Wochenende',
    color: 'text-brand-blue',
  },
]

function CountUp({
  target,
  suffix,
  color,
  duration = 1800,
}: {
  target: number
  suffix: string
  color: string
  duration?: number
}) {
  const [count, setCount] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return
    let startTime: number | null = null
    const startValue = 0

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(startValue + (target - startValue) * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [hasStarted, target, duration])

  return (
    <span ref={ref} className={`text-4xl sm:text-5xl font-serif font-bold ${color}`}>
      {count}
      <span className="text-3xl sm:text-4xl">{suffix}</span>
    </span>
  )
}

export default function Stats() {
  return (
    <section
      className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16"
      aria-label="Kennzahlen"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="bg-white rounded-3xl shadow-card-hover px-6 py-8 sm:px-10"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center text-center py-6 sm:py-4 sm:px-8 gap-3"
            >
              <div className={`${stat.color} opacity-80`} aria-hidden="true">
                {stat.icon}
              </div>
              <CountUp target={stat.value} suffix={stat.suffix} color={stat.color} />
              <div>
                <div className="font-semibold text-brand-purple-deep text-lg leading-tight">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.sublabel}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
