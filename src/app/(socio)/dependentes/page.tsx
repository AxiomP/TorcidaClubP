'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Users,
  UserPlus,
  ArrowLeft,
  Trash2,
  AlertCircle,
  Calendar,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import type { Database } from '@/types/database'

type Dependente = Database['public']['Tables']['dependentes']['Row']

export default function DependentesPage() {
  const { loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dependentes, setDependentes] = useState<Dependente[]>([])
  const [removendo, setRemovendo] = useState<string | null>(null)

  const fetchDependentes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/socio/dependentes')
      if (!res.ok) throw new Error('Erro ao carregar dependentes')
      const data = await res.json()
      if (data.dependentes) setDependentes(data.dependentes)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      console.error('Erro ao carregar dependentes:', error)
      toast.error('Erro ao carregar dependentes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    fetchDependentes()
  }, [fetchDependentes, authLoading])

  async function handleRemoverDependente(dependenteId: string) {
    setRemovendo(dependenteId)
    try {
      const res = await fetch('/api/socio/dependentes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependente_id: dependenteId, status: 'cancelado' }),
      })
      if (!res.ok) throw new Error('Erro ao remover dependente')
      toast.success('Dependente removido com sucesso')
      setDependentes((prev) => prev.filter((d) => d.id !== dependenteId))
    } catch (error) {
      console.error('Erro ao remover dependente:', error)
      toast.error('Erro ao remover dependente')
    } finally {
      setRemovendo(null)
    }
  }

  const dependentesAtivos = dependentes.filter((d) => d.status === 'ativo')
  const maxDependentes = 5
  const podeAdicionar = dependentesAtivos.length < maxDependentes

  const isLoading = authLoading || loading

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-4">
          <Link href="/painel">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-500" />
              Meus Dependentes
            </h1>
            <p className="text-sm text-muted-foreground">
              {dependentesAtivos.length} de {maxDependentes} dependente(s) cadastrado(s)
            </p>
          </div>
        </div>

        {podeAdicionar && (
          <Link href="/dependentes/adicionar">
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Dependente
            </Button>
          </Link>
        )}
      </div>

      {/* Aviso de limite atingido */}
      {!podeAdicionar && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <p className="text-sm">
              Você atingiu o limite de {maxDependentes} dependente(s).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de dependentes */}
      {dependentes.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum dependente cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Adicione familiares como dependentes para que eles também possam
            aproveitar os benefícios da torcida.
          </p>
          {podeAdicionar && (
            <Link href="/dependentes/adicionar">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Dependente
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {dependentes.map((dep) => (
            <Card key={dep.id}>
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 py-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-lg font-medium text-purple-500">
                      {dep.nome_completo.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">{dep.nome_completo}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-0.5">
                      <span>CPF: {dep.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(dep.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      {dep.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {dep.email}
                        </span>
                      )}
                      {dep.auth_user_id && (
                        <span className="flex items-center gap-1 text-green-600">
                          <ShieldCheck className="h-3 w-3" />
                          Conta ativa
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <Badge
                    variant={dep.status === 'ativo' ? 'default' : 'secondary'}
                  >
                    {dep.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {dep.e_menor && (
                    <Badge variant="outline">Menor de idade</Badge>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        disabled={removendo === dep.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover dependente?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover{' '}
                          <strong>{dep.nome_completo}</strong> como dependente?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoverDependente(dep.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
