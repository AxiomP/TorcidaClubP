'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RankingBadge, type RankingType } from '@/components/ui/ranking-badge'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Skeleton, SkeletonTableRow } from '@/components/ui/skeleton'
import { Search, UserPlus, Download, Upload, FileText } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { generateFichaCadastralPDF, generatePDFFilename } from '@/lib/services/pdf-service'
import type { SocioDataForPDF, TorcidaDataForPDF } from '@/lib/services/pdf-service'

type SocioStatus = 'pendente' | 'ativo' | 'cancelado' | 'inadimplente' | 'bloqueado' | 'rejeitado'

interface Socio {
  id: string
  nome_completo: string
  email: string
  cpf: string
  whatsapp: string | null
  status: SocioStatus
  ranking: RankingType
  data_cadastro: string | null
  data_aprovacao?: string | null
}

export default function SociosPage() {
  const supabase = createClient()
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ativo')
  const [rankingFilter, setRankingFilter] = useState<string>('todos')
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [torcidaData, setTorcidaData] = useState<TorcidaDataForPDF | null>(null)

  useEffect(() => {
    fetch('/api/gestor/financeiro')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.torcida) setTorcidaData(data.torcida as TorcidaDataForPDF) })
      .catch(console.error)
  }, [])

  useEffect(() => {
    loadSocios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, rankingFilter])

  async function loadSocios() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'todos') params.set('status', statusFilter)
      if (rankingFilter !== 'todos') params.set('ranking', rankingFilter)

      const res = await fetch(`/api/socios?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar sócios')
      const { socios: data } = await res.json()
      setSocios((data || []) as Socio[])
    } catch (error) {
      console.error('Erro ao carregar sócios:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar por termo de busca
  const filteredSocios = socios.filter(socio =>
    socio.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    socio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    socio.cpf.includes(searchTerm)
  )

  // Extrair bucket e path de uma URL de storage do Supabase
  function extractBucketAndPath(url: string | null): { bucket: string; path: string } | null {
    if (!url) return null
    const match = url.match(/\/storage\/v1\/object\/(?:public|authenticated)\/([^/]+)\/(.+)/)
    if (!match) return null
    return { bucket: match[1], path: match[2] }
  }

  // Download de todas as fichas filtradas como ZIP
  async function handleDownloadAllFichas() {
    if (filteredSocios.length === 0) return
    if (!torcidaData) {
      toast.error('Dados da torcida não carregados')
      return
    }

    setDownloadingAll(true)
    const toastId = 'zip-download'
    toast.loading(`Gerando ${filteredSocios.length} fichas...`, { id: toastId })

    try {
      const params = new URLSearchParams({ fields: 'full', ids: filteredSocios.map(s => s.id).join(',') })
      const res = await fetch(`/api/socios?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar sócios')
      const { socios: sociosCompletos } = await res.json()
      if (!sociosCompletos || sociosCompletos.length === 0) throw new Error('Nenhum sócio encontrado')

      // Gerar signed URLs em batch por bucket
      const buckets: Record<string, string[]> = {}
      const docFields = ['selfie_url', 'doc_frente_url', 'doc_verso_url', 'comprovante_endereco_url', 'assinatura_url'] as const
      for (const socio of sociosCompletos) {
        for (const field of docFields) {
          const parsed = extractBucketAndPath((socio as Record<string, unknown>)[field] as string | null)
          if (parsed) {
            if (!buckets[parsed.bucket]) buckets[parsed.bucket] = []
            if (!buckets[parsed.bucket].includes(parsed.path)) {
              buckets[parsed.bucket].push(parsed.path)
            }
          }
        }
      }

      // Criar mapa path → signedUrl
      const signedUrlMap: Record<string, string> = {}
      for (const [bucket, paths] of Object.entries(buckets)) {
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrls(paths, 3600)
        if (signed) {
          for (const entry of signed) {
            if (entry.signedUrl && entry.path) signedUrlMap[entry.path] = entry.signedUrl
          }
        }
      }

      // Substituir URLs originais por signed URLs em cada sócio
      const sociosComSignedUrls = sociosCompletos.map((socio: Record<string, unknown>) => {
        const s = { ...socio } as Record<string, unknown>
        for (const field of docFields) {
          const parsed = extractBucketAndPath(s[field] as string | null)
          if (parsed && signedUrlMap[parsed.path]) {
            s[field] = signedUrlMap[parsed.path]
          }
        }
        return s
      })

      // Gerar PDFs e montar ZIP
      const { zipSync } = await import('fflate')
      const files: Record<string, Uint8Array> = {}
      for (const socio of sociosComSignedUrls) {
        const blob = await generateFichaCadastralPDF(socio as unknown as SocioDataForPDF, torcidaData)
        const filename = generatePDFFilename(socio as unknown as SocioDataForPDF)
        files[filename] = new Uint8Array(await blob.arrayBuffer())
      }

      // Fazer download do ZIP
      const zipBlob = new Blob([zipSync(files).buffer as ArrayBuffer], { type: 'application/zip' })
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const slug = torcidaData.slug || 'torcida'
      const zipName = `fichas_cadastrais_${slug}_${today}.zip`

      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = zipName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`${filteredSocios.length} fichas baixadas com sucesso!`, { id: toastId })
    } catch (err) {
      console.error('Erro ao gerar ZIP:', err)
      toast.error('Erro ao gerar fichas', { id: toastId })
    } finally {
      setDownloadingAll(false)
    }
  }

  function _handleDownloadCSVSocios() {
    if (filteredSocios.length === 0) return
    const headers = 'Nome,CPF,Email,Telefone,Status,Ranking,Data Cadastro'
    const rows = filteredSocios.map((s) => {
      const nome = `"${s.nome_completo.replace(/"/g, '""')}"`
      const cpf = s.cpf.replace(/\D/g, '')
      return [nome, cpf, s.email, s.whatsapp || '', s.status, s.ranking, s.data_cadastro ? new Date(s.data_cadastro).toLocaleDateString('pt-BR') : ''].join(',')
    })
    const csv = '\uFEFF' + [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    link.download = `socios_${today}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`${filteredSocios.length} sócios exportados!`)
  }

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const styles = {
      pendente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      ativo: 'bg-green-100 text-green-800 border-green-300',
      inativo: 'bg-gray-100 text-gray-800 border-gray-300',
      bloqueado: 'bg-red-100 text-red-800 border-red-300',
      inadimplente: 'bg-orange-100 text-orange-800 border-orange-300',
      rejeitado: 'bg-purple-100 text-purple-800 border-purple-300',
    }

    const labels = {
      pendente: 'Pendente',
      ativo: 'Ativo',
      inativo: 'Inativo',
      bloqueado: 'Bloqueado',
      inadimplente: 'Inadimplente',
      rejeitado: 'Rejeitado',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Sócios</h1>
          <p className="text-muted-foreground">
            Gerencie todos os membros da sua torcida
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/gestor/socios/importar">
              <Upload className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Importar CSV</span>
            </Link>
          </Button>
          <Button asChild>
            <Link href="/gestor/cadastros">
              <UserPlus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Ver Cadastros Pendentes</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-4 w-16" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          <Card className="p-4">
            <div className="text-xl sm:text-2xl font-bold">{socios.filter(s => s.status === 'ativo').length}</div>
            <p className="text-sm text-muted-foreground">Ativos</p>
          </Card>
          <Card className="p-4">
            <div className="text-xl sm:text-2xl font-bold">{socios.filter(s => s.status === 'inadimplente').length}</div>
            <p className="text-sm text-muted-foreground">Inadimplentes</p>
          </Card>
          <Card className="p-4">
            <div className="text-xl sm:text-2xl font-bold">{socios.filter(s => s.status === 'bloqueado').length}</div>
            <p className="text-sm text-muted-foreground">Bloqueados</p>
          </Card>
          <Card className="p-4">
            <div className="text-xl sm:text-2xl font-bold">
              {socios.filter(s => s.status !== 'rejeitado' && s.status !== 'pendente').length}
            </div>
            <p className="text-sm text-muted-foreground">Total Membros</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-700">
            <div className="text-xl sm:text-2xl font-bold">{socios.filter(s => s.ranking === 'bronze' && s.status !== 'rejeitado').length}</div>
            <p className="text-sm text-muted-foreground">Bronze</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-gray-400">
            <div className="text-xl sm:text-2xl font-bold">{socios.filter(s => s.ranking === 'prata' && s.status !== 'rejeitado').length}</div>
            <p className="text-sm text-muted-foreground">Prata</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-yellow-500">
            <div className="text-xl sm:text-2xl font-bold">{socios.filter(s => s.ranking === 'ouro' && s.status !== 'rejeitado').length}</div>
            <p className="text-sm text-muted-foreground">Ouro</p>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inadimplente">Inadimplentes</option>
              <option value="bloqueado">Bloqueados</option>
              <option value="pendente">Pendentes</option>
              <option value="inativo">Inativos</option>
              <option value="rejeitado">Rejeitados</option>
            </select>
            <select
              value={rankingFilter}
              onChange={(e) => setRankingFilter(e.target.value)}
              className="px-4 py-2 border rounded-md bg-background"
            >
              <option value="todos">Todos os Rankings</option>
              <option value="bronze">Bronze</option>
              <option value="prata">Prata</option>
              <option value="ouro">Ouro</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadAllFichas}
              disabled={downloadingAll || filteredSocios.length === 0}
              title={filteredSocios.length === 0 ? 'Nenhum sócio para baixar' : `Baixar ${filteredSocios.length} fichas como ZIP`}
            >
              <Download className={`h-4 w-4 mr-1 ${downloadingAll ? 'animate-bounce' : ''}`} />
              ZIP
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = '/api/socios/export' }}
              title="Exportar CSV completo com todos os campos"
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar CSV Completo
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista/Tabela de Sócios */}
      <Card>
        {loading ? (
          <>
            {/* Skeleton mobile */}
            <div className="sm:hidden divide-y divide-border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
            {/* Skeleton desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    {['Nome', 'Email', 'Telefone', 'Status', 'Ranking', 'Ações'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonTableRow key={i} columns={6} />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : filteredSocios.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'todos'
                ? 'Nenhum sócio encontrado com os filtros aplicados.'
                : 'Nenhum sócio cadastrado ainda.'}
            </p>
          </div>
        ) : (
          <>
            {/* Cards para mobile (< 640px) */}
            <div className="sm:hidden divide-y divide-border">
              {filteredSocios.map((socio) => (
                <div key={socio.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{socio.nome_completo}</p>
                      <p className="text-xs text-muted-foreground truncate">{socio.email}</p>
                      {socio.whatsapp && (
                        <p className="text-xs text-muted-foreground">{socio.whatsapp}</p>
                      )}
                    </div>
                    {getStatusBadge(socio.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <RankingBadge ranking={socio.ranking || 'bronze'} size="sm" />
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" asChild title="Ver Ficha Cadastral">
                        <Link href={`/gestor/socios/${socio.id}/ficha-cadastral`}>
                          <FileText className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/gestor/socios/${socio.id}`}>Ver</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabela para sm+ */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                      Ranking
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {filteredSocios.map((socio) => (
                    <tr key={socio.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{socio.nome_completo}</div>
                        <div className="text-sm text-muted-foreground sm:hidden">{socio.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-muted-foreground">{socio.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-muted-foreground">{socio.whatsapp || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(socio.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                        <RankingBadge ranking={socio.ranking || 'bronze'} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild title="Ver Ficha Cadastral">
                            <Link href={`/gestor/socios/${socio.id}/ficha-cadastral`}>
                              <FileText className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/gestor/socios/${socio.id}`}>
                              Ver Detalhes
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Paginação (placeholder para implementação futura) */}
      {filteredSocios.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {filteredSocios.length} de {socios.length} sócios
          </p>
          {/* Adicionar componente de paginação aqui quando necessário */}
        </div>
      )}
    </div>
  )
}
