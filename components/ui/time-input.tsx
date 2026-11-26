'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { maskTimeInput, normalizeTime } from '@/lib/ops/domain/time-input'

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'inputMode'> & {
  value: string
  onValueChange: (value: string) => void
}

/** 24-Stunden-Uhrzeit (HH:MM). Ersetzt <input type="time">, das auf Geräten mit US-Einstellung AM/PM zeigt. */
export function TimeInput({ value, onValueChange, onBlur, className, ...props }: Props) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="HH:MM"
      maxLength={5}
      value={value}
      className={className}
      onChange={(e) => onValueChange(maskTimeInput(e.target.value))}
      onBlur={(e) => {
        const normalized = normalizeTime(e.target.value)
        if (normalized && normalized !== value) onValueChange(normalized)
        onBlur?.(e)
      }}
    />
  )
}
