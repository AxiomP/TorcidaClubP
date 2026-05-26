'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'

interface PreviewRow {
  row: number
  isValid: boolean
  nome: string
  email: string
  cpf: string
  errors: string[]
  warnings: string[]
}

interface ValidationSummary {
  totalRows: number
  validRows: number
  invalidRows: number
  duplicateRows: number
}

interface ImportPreviewProps {
  validation: ValidationSummary
  preview: PreviewRow[]
  duplicateCpfs?: string[]
}

export function ImportPreview({ validation, preview, duplicateCpfs = [] }: ImportPreviewProps) {
  return (
    <div className="space-y-6">
      {/* Resumo da Validação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{validation.totalRows}</div>
          <p className="text-sm text-muted-foreground">Total de Linhas</p>
        </Card>

        <Card className="p-4 border-green-500/30 bg-green-500/5">
          <div className="text-2xl font-bold text-green-600">{validation.validRows}</div>
          <p className="text-sm text-muted-foreground">Válidas</p>
        </Card>

        <Card className="p-4 border-red-500/30 bg-red-500/5">
          <div className="text-2xl font-bold text-red-600">{validation.invalidRows}</div>
          <p className="text-sm text-muted-foreground">Com Erros</p>
        </Card>

        <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="text-2xl font-bold text-yellow-600">{validation.duplicateRows}</div>
          <p className="text-sm text-muted-foreground">Duplicados</p>
        </Card>
      </div>

      {/* Aviso de Duplicados */}
      {duplicateCpfs.length > 0 && (
        <Card className="p-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">
                {duplicateCpfs.length} CPF(s) já cadastrados serão ignorados
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {duplicateCpfs.slice(0, 5).join(', ')}
                {duplicateCpfs.length > 5 && ` e mais ${duplicateCpfs.length - 5}...`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Preview das Linhas */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-semibold">Preview das Primeiras Linhas</h3>
          <p className="text-sm text-muted-foreground">
            Confira se os dados foram lidos corretamente
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  CPF
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Observações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {preview.map((row) => (
                <tr key={row.row} className={row.isValid ? '' : 'bg-red-500/5'}>
                  <td className="px-4 py-3 text-sm">{row.row}</td>
                  <td className="px-4 py-3">
                    {row.isValid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{row.nome || '-'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{row.email || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono">{row.cpf || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.errors.map((err, i) => (
                        <Badge key={i} variant="error" className="text-xs">
                          {err}
                        </Badge>
                      ))}
                      {row.warnings.map((warn, i) => (
                        <Badge key={i} variant="warning" className="text-xs">
                          {warn}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {preview.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum dado para visualizar
          </div>
        )}
      </Card>
    </div>
  )
}
