'use client'

/**
 * Barra de progresso do formulário multi-etapa
 */

import { Check } from 'lucide-react'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  steps: Array<{
    number: number
    title: string
    description?: string
  }>
}

export function ProgressBar({ currentStep, totalSteps, steps }: ProgressBarProps) {
  return (
    <div className="w-full">
      {/* Progress bar visual */}
      <div className="relative">
        {/* Linha de fundo */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />

        {/* Linha de progresso */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-torcida-laranja transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = step.number < currentStep
            const isCurrent = step.number === currentStep

            return (
              <div
                key={step.number}
                className="flex flex-col items-center"
              >
                {/* Círculo do step */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    border-2 transition-all duration-300 bg-background
                    ${isCompleted
                      ? 'border-torcida-laranja bg-torcida-laranja text-white'
                      : isCurrent
                      ? 'border-torcida-laranja bg-background text-torcida-laranja'
                      : 'border-gray-300 dark:border-gray-600 bg-background text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step.number}</span>
                  )}
                </div>

                {/* Título e descrição */}
                <div className="mt-2 text-center hidden sm:block">
                  <p
                    className={`text-xs font-medium ${
                      isCurrent
                        ? 'text-torcida-laranja'
                        : isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Mobile: apenas título quando é step atual */}
                <div className="mt-2 text-center sm:hidden">
                  {isCurrent && (
                    <p className="text-xs font-medium text-torcida-laranja">
                      {step.title}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Indicador textual mobile */}
      <div className="mt-12 sm:hidden text-center">
        <p className="text-sm text-muted-foreground">
          Etapa {currentStep} de {totalSteps}
        </p>
      </div>
    </div>
  )
}
