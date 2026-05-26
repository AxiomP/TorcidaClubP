'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ImportResult } from '@/types/import'
import {
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

interface ImportResultsProps {
  result: ImportResult
  onReset: () => void
}

export function ImportResults({ result, onReset }: ImportResultsProps) {
  const downloadErrorReport = () => {
    const errors = result.results.filter(r => r.status === 'error' || r.status === 'skipped')

    if (errors.length === 0) return

    const csvContent = [
      'Linha,CPF,Nome,Status,Erro',
      ...errors.map(e =>
        `${e.row},"${e.cpf}","${e.nome}","${e.status}","${e.error || ''}"`
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `erros_importacao_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <Card className={`p-6 ${result.success ? 'border-green-500/30 bg-green-500/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
        <div className="flex items-center gap-4">
          {result.success ? (
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          ) : (
            <AlertCircle className="h-12 w-12 text-yellow-500" />
          )}
          <div>
            <h2 className="text-xl font-bold">
              {result.success ? 'Importação Concluída!' : 'Importação Concluída com Avisos'}
            </h2>
            <p className="text-muted-foreground">
              {result.imported} sócio(s) importado(s) com sucesso
              {(result.dependentesImported ?? 0) > 0 &&
                ` · ${result.dependentesImported} dependente(s)`}
            </p>
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{result.totalProcessed}</div>
          <p className="text-sm text-muted-foreground">Processados</p>
        </Card>

        <Card className="p-4 border-green-500/30">
          <div className="text-2xl font-bold text-green-600">{result.imported}</div>
          <p className="text-sm text-muted-foreground">Sócios</p>
        </Card>

        <Card className="p-4 border-blue-500/30">
          <div className="text-2xl font-bold text-blue-600">{result.dependentesImported ?? 0}</div>
          <p className="text-sm text-muted-foreground">Dependentes</p>
        </Card>

        <Card className="p-4 border-yellow-500/30">
          <div className="text-2xl font-bold text-yellow-600">{result.skipped}</div>
          <p className="text-sm text-muted-foreground">Ignorados</p>
        </Card>

        <Card className="p-4 border-red-500/30">
          <div className="text-2xl font-bold text-red-600">{result.failed}</div>
          <p className="text-sm text-muted-foreground">Falharam</p>
        </Card>
      </div>

      {/* Detalhes dos Erros */}
      {(result.skipped > 0 || result.failed > 0) && (
        <Card>
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Registros com Problemas</h3>
              <p className="text-sm text-muted-foreground">
                Detalhes dos registros que não foram importados
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadErrorReport}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Relatório
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    Linha
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    Nome
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    CPF
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase">
                    Erro
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.results
                  .filter(r => r.status === 'error' || r.status === 'skipped')
                  .slice(0, 50)
                  .map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-sm">{row.row}</td>
                      <td className="px-4 py-2 text-sm">{row.nome}</td>
                      <td className="px-4 py-2 text-sm font-mono">{row.cpf}</td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={row.status === 'error' ? 'error' : 'warning'}
                        >
                          {row.status === 'error' ? 'Erro' : 'Ignorado'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-sm text-muted-foreground">
                        {row.error || '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Ações */}
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/gestor/socios">
            Ver Lista de Sócios
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>

        <Button variant="outline" onClick={onReset}>
          Nova Importação
        </Button>
      </div>
    </div>
  )
}
