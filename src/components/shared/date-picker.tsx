'use client'

/**
 * Date Picker com 3 inputs separados (Dia / Mês / Ano)
 * Evita o bug do Chrome/Edge que apaga dia/mês ao digitar o ano
 * RN029: Validação de Idade
 */

import { forwardRef, useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { calcularIdade } from '@/lib/utils/calculate'
import { formatData } from '@/lib/utils/format'

interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  label?: string
  value?: Date | string
  onChange?: (date: Date | null) => void
  showAge?: boolean
  minDate?: Date | string
  maxDate?: Date | string
}

function parsePropValue(value: Date | string | undefined): { day: string; month: string; year: string } {
  if (!value) return { day: '', month: '', year: '' }
  try {
    let date: Date
    if (typeof value === 'string') {
      const ddmmyyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/)
      if (ddmmyyyy) {
        date = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}T00:00:00`)
      } else {
        date = new Date(value)
      }
    } else {
      date = value
    }
    if (isNaN(date.getTime())) return { day: '', month: '', year: '' }
    return {
      day: String(date.getDate()).padStart(2, '0'),
      month: String(date.getMonth() + 1).padStart(2, '0'),
      year: String(date.getFullYear()),
    }
  } catch {
    return { day: '', month: '', year: '' }
  }
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      value,
      onChange,
      showAge = false,
      disabled,
      // minDate and maxDate kept in interface for compatibility but not applied to individual inputs
      minDate: _minDate,
      maxDate: _maxDate,
      ...props
    },
    ref
  ) => {
    const initial = parsePropValue(value)
    const [day, setDay] = useState(initial.day)
    const [month, setMonth] = useState(initial.month)
    const [year, setYear] = useState(initial.year)
    const monthRef = useRef<HTMLInputElement>(null)
    const yearRef = useRef<HTMLInputElement>(null)
    const prevValueRef = useRef(value)

    // Sync internal state when prop changes externally (e.g. form reset)
    useEffect(() => {
      if (prevValueRef.current === value) return
      prevValueRef.current = value
      const parsed = parsePropValue(value)
      setDay(parsed.day)
      setMonth(parsed.month)
      setYear(parsed.year)
    }, [value])

    const tryEmit = (d: string, m: string, y: string) => {
      if (d.length === 2 && m.length === 2 && y.length === 4) {
        const dNum = parseInt(d)
        const mNum = parseInt(m)
        const yNum = parseInt(y)
        if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12 && yNum >= 1900) {
          const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`)
          if (!isNaN(date.getTime())) {
            onChange?.(date)
            return
          }
        }
      }
      if (!d && !m && !y) onChange?.(null)
    }

    const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 2)
      setDay(val)
      if (val.length === 2) monthRef.current?.focus()
      tryEmit(val, month, year)
    }

    const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 2)
      setMonth(val)
      if (val.length === 2) yearRef.current?.focus()
      tryEmit(day, val, year)
    }

    const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.replace(/\D/g, '').slice(0, 4)
      setYear(val)
      tryEmit(day, month, val)
    }

    const getAge = () => {
      if (!value || !showAge) return null
      try {
        return calcularIdade(value)
      } catch {
        return null
      }
    }

    const age = getAge()

    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium">
            {label} <span className="text-red-500">*</span>
          </label>
        )}

        <div className="flex items-center gap-1">
          <Input
            ref={ref}
            type="text"
            inputMode="numeric"
            placeholder="DD"
            value={day}
            onChange={handleDayChange}
            disabled={disabled}
            maxLength={2}
            className="w-14 text-center px-1"
            {...props}
          />
          <span className="text-muted-foreground font-medium">/</span>
          <Input
            ref={monthRef}
            type="text"
            inputMode="numeric"
            placeholder="MM"
            value={month}
            onChange={handleMonthChange}
            disabled={disabled}
            maxLength={2}
            className="w-14 text-center px-1"
          />
          <span className="text-muted-foreground font-medium">/</span>
          <Input
            ref={yearRef}
            type="text"
            inputMode="numeric"
            placeholder="AAAA"
            value={year}
            onChange={handleYearChange}
            disabled={disabled}
            maxLength={4}
            className="w-20 text-center px-1"
          />
        </div>

        {age !== null && (
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {age} {age === 1 ? 'ano' : 'anos'}
            {age < 18 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                (Menor de idade)
              </span>
            )}
          </p>
        )}
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'

/**
 * Componente helper para exibir data formatada
 */
interface DateDisplayProps {
  date: Date | string | null | undefined
  format?: string
  className?: string
}

export function DateDisplay({
  date,
  format = 'dd/MM/yyyy',
  className = '',
}: DateDisplayProps) {
  if (!date) return <span className={`text-gray-400 ${className}`}>-</span>

  try {
    return (
      <span className={className}>{formatData(date, format)}</span>
    )
  } catch {
    return <span className={`text-gray-400 ${className}`}>Data inválida</span>
  }
}
