import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Eye, UserPlus, Clock, CheckCircle } from 'lucide-react'
import { formatarCPF } from '@/lib/utils/format'
import { formatarData } from '@/lib/utils/format'

export default async function CadastrosPendentesPage() {
  // Autenticação
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar dados do gestor
  const { data: gestor } = await supabase
    .from('gestores')
    .select('id, torcida_id, torcidas(nome, brasao_url)')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!gestor || !gestor.torcida_id) {
    redirect('/login')
  }

  // Buscar cadastros pendentes — supabaseAdmin contorna RLS com deleted_at removido
  const { data: cadastros, error } = await supabaseAdmin
    .from('socios')
    .select(
      `
      id,
      nome_completo,
      cpf,
      email,
      whatsapp,
      data_nascimento,
      status,
      e_menor,
      data_cadastro,
      selfie_url
    `
    )
    .eq('torcida_id', gestor.torcida_id!)
    .in('status', ['pendente'])
    .order('data_cadastro', { ascending: false })

  if (error) {
    console.error('Erro ao buscar cadastros:', error)
  }

  // Contar por status
  const { count: totalPendentes } = await supabaseAdmin
    .from('socios')
    .select('*', { count: 'exact', head: true })
    .eq('torcida_id', gestor.torcida_id!)
    .eq('status', 'pendente')

  const { count: totalAtivos } = await supabaseAdmin
    .from('socios')
    .select('*', { count: 'exact', head: true })
    .eq('torcida_id', gestor.torcida_id!)
    .eq('status', 'ativo')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cadastros de Sócios</h1>
        <p className="text-muted-foreground">
          Gerencie os cadastros pendentes e aprovados da sua torcida
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
              <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-3xl font-bold">{totalPendentes || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-3xl font-bold">{totalAtivos || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-3xl font-bold">
                {(totalPendentes || 0) + (totalAtivos || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabela de Cadastros Pendentes */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Cadastros Pendentes</h2>
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              {totalPendentes || 0} {totalPendentes === 1 ? 'pendente' : 'pendentes'}
            </Badge>
          </div>

          {!cadastros || cadastros.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <UserPlus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum cadastro pendente</h3>
              <p className="text-sm text-muted-foreground">
                Todos os cadastros foram processados
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cadastros.map((socio) => (
                    <TableRow key={socio.id}>
                      <TableCell>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                          {socio.selfie_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={socio.selfie_url}
                              alt={socio.nome_completo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <UserPlus className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{socio.nome_completo}</p>
                          {socio.e_menor && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              Menor de idade
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatarCPF(socio.cpf)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-muted-foreground">{socio.email}</p>
                          <p className="text-muted-foreground">{socio.whatsapp}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {socio.data_cadastro ? formatarData(new Date(socio.data_cadastro)) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-amber-600 border-amber-600">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendente
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" asChild>
                          <Link href={`/gestor/cadastros/${socio.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Analisar
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
