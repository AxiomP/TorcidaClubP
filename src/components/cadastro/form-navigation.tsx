'use client'

/**
 * Navegação do formulário multi-etapa (botões voltar/próximo/finalizar)
 */

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2, Send } from 'lucide-react'

interface FormNavigationProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  isFirstStep: boolean
  isLastStep: boolean
  isSubmitting?: boolean
  canProceed?: boolean
}

export function FormNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  isFirstStep,
  isLastStep,
  isSubmitting = false,
  canProceed = true,
}: FormNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t">
      {/* Botão Voltar */}
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep || isSubmitting}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Voltar
      </Button>

      {/* Informação central - desktop */}
      <div className="hidden sm:block text-sm text-muted-foreground">
        <span>
          Etapa <strong className="text-foreground">{currentStep}</strong> de{' '}
          <strong className="text-foreground">{totalSteps}</strong>
        </span>
      </div>

      {/* Botão Próximo/Finalizar */}
      {isLastStep ? (
        <Button
          type="submit"
          disabled={isSubmitting || !canProceed}
          className="flex items-center gap-2 min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Finalizar Cadastro
            </>
          )}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={isSubmitting || !canProceed}
          className="flex items-center gap-2"
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}
