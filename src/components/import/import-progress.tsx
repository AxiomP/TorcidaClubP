'use client'

import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'

interface ImportProgressProps {
  current: number
  total: number
  phase: 'parsing' | 'validating' | 'importing' | 'completed' | 'error'
  message?: string
}

export function ImportProgress({ current, total, phase, message }: ImportProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  const phaseLabels = {
    parsing: 'Lendo arquivo...',
    validating: 'Validando dados...',
    importing: 'Importando sócios...',
    completed: 'Importação concluída!',
    error: 'Erro na importação',
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {phase !== 'completed' && phase !== 'error' && (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          )}
          <div>
            <h3 className="font-semibold">{phaseLabels[phase]}</h3>
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        </div>

        {phase === 'importing' && (
          <>
            <Progress value={percentage} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{current} de {total}</span>
              <span>{percentage}%</span>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
