'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CSVUpload } from '@/components/import/csv-upload'
import { ImportPreview } from '@/components/import/import-preview'
import { ImportProgress } from '@/components/import/import-progress'
import { ImportResults } from '@/components/import/import-results'
import type { ImportResult } from '@/types/import'
import { ArrowLeft, Upload, FileSearch, Play, CheckCircle2, FileDown } from 'lucide-react'

type ImportStep = 'upload' | 'preview' | 'importing' | 'completed'

interface PreviewData {
  validation: {
    totalRows: number
    validRows: number
    invalidRows: number
    duplicateRows: number
    dependentesRows: number
  }
  preview: Array<{
    row: number
    isValid: boolean
    nome: string
    email: string
    cpf: string
    errors: string[]
    warnings: string[]
  }>
  duplicateCpfs: string[]
}

export default function ImportarSociosPage() {
  const router = useRouter()

  const [step, setStep] = useState<ImportStep>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Upload do arquivo
  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/socios/import/preview', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar arquivo')
      }

      setPreviewData(data)
      setStep('preview')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo')
      setFile(null)
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Confirmar e iniciar importação
  const handleStartImport = async () => {
    if (!file) return

    setStep('importing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/socios/import', {
        method: 'POST',
        body: formData,
      })

      const result: ImportResult = await response.json()

      setImportResult(result)
      setStep('completed')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro durante importação')
      setStep('preview')
    }
  }

  // Download da planilha modelo — mesmo formato do CSV de exportação
  const downloadCSVTemplate = () => {
    const socioHeaders = [
      'Matrícula', 'Nome Completo', 'CPF', 'Email', 'WhatsApp',
      'Data Nascimento', 'Gênero', 'Estado Civil', 'Profissão',
      'Endereço', 'Número', 'Complemento', 'Bairro', 'Cidade', 'Estado', 'CEP',
      'Status', 'Ranking', 'Membro Desde', 'Data Cadastro', 'Data Aprovação',
      'Meses Pendentes', 'Valor Dívida',
      'Necessidades Especiais', 'Desc. Necessidades', 'Usa Medicação', 'Detalhes Medicação', 'Alergias',
      'Nome Mãe', 'Nome Pai', 'Contato Emergência', 'Tel. Emergência',
      'Tipo Documento', 'Número RG', 'Origem', 'Importado',
    ]
    const socioExample = [
      '', 'João da Silva', '12345678900', 'joao@email.com', '11999999999',
      '1990-06-15', 'masculino', 'solteiro', 'Professor',
      'Rua das Flores', '123', 'Apto 45', 'Centro', 'São Paulo', 'SP', '01310-100',
      'ativo', 'bronze', '2024-01-01', '', '',
      '0', '0',
      'Não', '', 'Não', '', '',
      'Maria da Silva', 'José da Silva', 'Ana Silva', '11988887777',
      'rg', '12.345.678-9', '', 'Sim',
    ]

    const depHeaders = ['CPF Titular', 'Nome Dependente', 'CPF Dependente', 'Data Nascimento', 'É Menor', 'Status', 'Email']
    const depExample = ['12345678900', 'Maria da Silva', '98765432100', '2015-03-20', 'Sim', 'ativo', 'maria@email.com']

    function esc(v: string) {
      return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v
    }

    const csvContent = [
      '=== SÓCIOS ===',
      socioHeaders.join(','),
      socioExample.map(esc).join(','),
      '',
      '=== DEPENDENTES ===',
      depHeaders.join(','),
      depExample.map(esc).join(','),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'planilha_modelo_socios.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Reset para nova importação
  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setPreviewData(null)
    setImportResult(null)
    setError(null)
  }

  // Indicador de passos
  const steps = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'preview', label: 'Validação', icon: FileSearch },
    { key: 'importing', label: 'Importação', icon: Play },
    { key: 'completed', label: 'Concluído', icon: CheckCircle2 },
  ]

  const currentStepIndex = steps.findIndex(s => s.key === step)

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Importar Sócios</h1>
          <p className="text-muted-foreground mt-1">
            Importe sócios usando o mesmo arquivo de exportação (.csv). Os sócios importados poderão definir sua senha via &quot;Esqueci a senha&quot;.
          </p>
        </div>
        <Button variant="outline" onClick={downloadCSVTemplate}>
          <FileDown className="mr-2 h-4 w-4" />
          Planilha Modelo
        </Button>
      </div>

      {/* Indicador de Passos */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, index) => {
          const Icon = s.icon
          const isActive = index === currentStepIndex
          const isCompleted = index < currentStepIndex

          return (
            <div key={s.key} className="flex items-center">
              <div
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full transition-colors
                  ${isActive ? 'bg-primary text-primary-foreground' : ''}
                  ${isCompleted ? 'bg-green-500/10 text-green-600' : ''}
                  ${!isActive && !isCompleted ? 'bg-muted text-muted-foreground' : ''}
                `}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`
                    w-8 h-0.5 mx-2
                    ${index < currentStepIndex ? 'bg-green-500' : 'bg-muted'}
                  `}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Erro Global */}
      {error && (
        <Card className="p-4 border-red-500/50 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </Card>
      )}

      {/* Conteúdo por Step */}
      {step === 'upload' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Selecionar Arquivo CSV</h2>
          <CSVUpload
            onFileSelect={handleFileSelect}
            disabled={loading}
          />
          {loading && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Analisando arquivo...
            </div>
          )}
        </Card>
      )}

      {step === 'preview' && previewData && (
        <>
          <ImportPreview
            validation={previewData.validation}
            preview={previewData.preview}
            duplicateCpfs={previewData.duplicateCpfs}
          />

          {/* Ações */}
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={handleReset}>
              Cancelar
            </Button>
            <Button
              onClick={handleStartImport}
              disabled={previewData.validation.validRows === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Importar {previewData.validation.validRows} Sócio(s)
              {(previewData.validation.dependentesRows ?? 0) > 0 &&
                ` + ${previewData.validation.dependentesRows} Dependente(s)`}
            </Button>
          </div>

          {previewData.validation.validRows === 0 && (
            <Card className="p-4 border-yellow-500/50 bg-yellow-500/10">
              <p className="text-yellow-600 text-sm">
                Nenhum registro válido para importar. Verifique os erros acima.
              </p>
            </Card>
          )}
        </>
      )}

      {step === 'importing' && (
        <ImportProgress
          phase="importing"
          current={0}
          total={previewData?.validation.validRows || 0}
          message={`Importando sócios${(previewData?.validation.dependentesRows ?? 0) > 0 ? ` e ${previewData!.validation.dependentesRows} dependente(s)` : ''}...`}
        />
      )}

      {step === 'completed' && importResult && (
        <ImportResults
          result={importResult}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
