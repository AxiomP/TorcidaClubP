'use client'

/**
 * Input com máscara automática e validação de CPF
 * RN001: Validação de CPF
 */

import { forwardRef, useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { formatCPF, removeFormatacao } from '@/lib/utils/format'
import { validarCPF } from '@/lib/validations/cpf-validator'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface CPFInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
  onValidChange?: (isValid: boolean) => void
  label?: string
  showValidation?: boolean
  checkDuplicate?: boolean
}

export const CPFInput = forwardRef<HTMLInputElement, CPFInputProps>(
  (
    {
      value = '',
      onChange,
      onValidChange,
      label = 'CPF',
      showValidation = true,
      checkDuplicate = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = useState('')
    const [isValid, setIsValid] = useState<boolean | null>(null)
    const [isDuplicate, setIsDuplicate] = useState(false)
    const [isBlocked, setIsBlocked] = useState(false)
    const [cpfStatus, setCpfStatus] = useState<string | null>(null)
    const [checking, setChecking] = useState(false)
    const [touched, setTouched] = useState(false)

    // Atualizar display quando valor externo mudar
    useEffect(() => {
      if (value) {
        const formatted = formatCPF(value)
        setDisplayValue(formatted)
      } else {
        setDisplayValue('')
      }
    }, [value])

    // Validar CPF quando valor mudar
    useEffect(() => {
      const checkCPFDuplicadoAsync = async (cpf: string) => {
        setChecking(true)
        try {
          const response = await fetch(`/api/cadastro/validar-cpf?cpf=${cpf}`)
          const data = await response.json()
          const isRejeitado = data.status === 'rejeitado';

          setCpfStatus(data.status || null);
          setIsDuplicate(data.exists && !isRejeitado); 
          setIsBlocked(!!data.blocked);
          
          if ((data.exists && !isRejeitado) || data.blocked) {
            setIsValid(false)
            onValidChange?.(false)
          } else {
            setIsValid(true)
            onValidChange?.(true)
          }
        } catch (error) {
          console.error('Erro ao validar CPF:', error)
        } finally {
          setChecking(false)
        }
      }

      if (!displayValue || displayValue.length < 14) {
        setIsValid(null)
        onValidChange?.(false)
        return
      }

      const cpfLimpo = removeFormatacao(displayValue)
      const valid = validarCPF(cpfLimpo)
      setIsValid(valid)
      onValidChange?.(valid)

      // Verificar duplicidade se configurado
      if (valid && checkDuplicate && touched) {
        checkCPFDuplicadoAsync(cpfLimpo)
      }
    }, [displayValue, checkDuplicate, onValidChange, touched])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value
      const numeros = removeFormatacao(input)

      // Limitar a 11 dígitos
      if (numeros.length > 11) return

      // Formatar CPF
      const formatted = formatCPF(numeros)
      setDisplayValue(formatted)

      // Chamar onChange com valor limpo
      onChange?.(numeros)
    }

    const handleBlur = () => {
      setTouched(true)
    }

    const getValidationIcon = () => {
      if (!showValidation || !touched) return null
      if (checking) return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      if (displayValue.length < 14) return null

      if (isDuplicate || isBlocked) {
        return <XCircle className="w-5 h-5 text-red-500" />
      }

      if (isValid === true) {
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      }

      if (isValid === false) {
        return <XCircle className="w-5 h-5 text-red-500" />
      }

      return null
    }

    const getValidationMessage = () => {
      if (!showValidation || !touched || !displayValue) return null

      if (checking) {
        return (
          <span className="text-xs text-gray-500">
            Verificando CPF...
          </span>
        )
      }

      if (displayValue.length > 0 && displayValue.length < 14) {
        return null
      }

      if (isBlocked) {
        return (
          <span className="text-xs text-red-600 dark:text-red-400">
            Este CPF está bloqueado para novos cadastros. Entre em contato com o gestor da torcida.
          </span>
        )
      }

      if (isDuplicate && cpfStatus === 'rejeitado') {
        return (
          <span className="text-xs text-amber-600">
            Identificamos um cadastro anterior rejeitado. Você pode reenviar seus dados para nova análise.
          </span>
        )
      }
      
      if (isDuplicate) {
        return (
          <span className="text-xs text-red-600 dark:text-red-400">
            Este CPF já está cadastrado na plataforma. Se acredita que é um erro, entre em contato com o gestor da torcida.
          </span>
        )
      }

      if (isValid === false) {
        return (
          <span className="text-xs text-red-600 dark:text-red-400">
            CPF inválido
          </span>
        )
      }

      if (isValid === true) {
        return (
          <span className="text-xs text-green-600 dark:text-green-400">
            CPF válido
          </span>
        )
      }

      return null
    }

    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-medium">
            {label} <span className="text-red-500">*</span>
          </label>
        )}

        <div className="relative">
          <Input
            ref={ref}
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={`pr-10 ${
              touched && (isValid === false || isDuplicate || isBlocked)
                ? 'border-red-500 focus-visible:ring-red-500'
                : touched && isValid === true && !isDuplicate && !isBlocked
                ? 'border-green-500 focus-visible:ring-green-500'
                : ''
            }`}
            {...props}
          />

          {showValidation && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {getValidationIcon()}
            </div>
          )}
        </div>

        {getValidationMessage()}
      </div>
    )
  }
)

CPFInput.displayName = 'CPFInput'
