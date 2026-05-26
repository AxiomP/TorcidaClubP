'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, ArrowRight } from 'lucide-react'
import type { Database } from '@/types/database'

type Dependente = Database['public']['Tables']['dependentes']['Row']

interface DependentesCardProps {
  dependentes: Dependente[]
  maxDependentes: number | null
  loading?: boolean
}

export function DependentesCard({
  dependentes,
  maxDependentes,
  loading,
}: DependentesCardProps) {
  const dependentesAtivos = dependentes.filter((d) => d.status === 'ativo')
  const podeAdicionar = maxDependentes === null || dependentesAtivos.length < maxDependentes

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            Dependentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Dependentes
        </CardTitle>
        <Badge variant="secondary">
          {dependentesAtivos.length}
          {maxDependentes !== null && ` / ${maxDependentes}`}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {dependentesAtivos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Você ainda não tem dependentes cadastrados.
          </p>
        ) : (
          <div className="space-y-3">
            {dependentesAtivos.slice(0, 3).map((dep) => (
              <div
                key={dep.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-sm font-medium text-purple-500">
                    {dep.nome_completo.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{dep.nome_completo}</p>
                  <p className="text-xs text-muted-foreground">
                    {dep.e_menor ? 'Menor de idade' : 'Maior de idade'}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {dep.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            ))}

            {dependentesAtivos.length > 3 && (
              <p className="text-sm text-muted-foreground text-center">
                +{dependentesAtivos.length - 3} dependente(s)
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/dependentes" className="flex-1">
            <Button variant="outline" className="w-full">
              Ver Todos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>

          {podeAdicionar && (
            <Link href="/dependentes/adicionar" className="flex-1">
              <Button className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </Link>
          )}
        </div>

        {!podeAdicionar && (
          <p className="text-xs text-muted-foreground text-center">
            Limite de dependentes atingido para seu plano.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
