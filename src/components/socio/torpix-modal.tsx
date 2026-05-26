'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FileUpload } from '@/components/shared/file-upload'
import { STORAGE_BUCKETS } from '@/lib/utils/constants'
import { Copy, Check, QrCode, Upload, AlertCircle, Zap, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TorpixModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pagamentoId: string
  valor: number
  chavePix: string | null
  qrCodeUrl?: string | null
  tipo: 'mensalidade' | 'ingresso'
  descricao: string
  eventoId?: string
  onComprovanteEnviado?: (url: string) => void
}

type Step = 'pix' | 'comprovante' | 'confirmacao'

export function TorpixModal({
  open,
  onOpenChange,
  pagamentoId,
  valor,
  chavePix,
  qrCodeUrl,
  tipo,
  descricao,
  onComprovanteEnviado,
}: TorpixModalProps) {
  const [step, setStep] = useState<Step>('pix')
  const [copied, setCopied] = useState(false)
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (open) {
      setStep('pix')
      setCopied(false)
      setComprovanteUrl(null)
    }
  }, [open])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleCopyPix = () => {
    if (!chavePix) return

    navigator.clipboard.writeText(chavePix)
    setCopied(true)
    toast.success('Chave PIX copiada!')

    setTimeout(() => setCopied(false), 3000)
  }

  const handleEnviarComprovante = async () => {
    if (!comprovanteUrl) {
      toast.error('Por favor, faca upload do comprovante')
      return
    }

    setEnviando(true)

    try {
      const endpoint = tipo === 'ingresso'
        ? `/api/ingressos/${pagamentoId}/comprovante`
        : `/api/pagamentos/${pagamentoId}/comprovante`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comprovante_url: comprovanteUrl }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao enviar comprovante')
      }

      setStep('confirmacao')
      onComprovanteEnviado?.(comprovanteUrl)
    } catch (error) {
      console.error('Erro ao enviar comprovante:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar comprovante')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <span className="font-bold">
                Tor<span className="text-green-500">PIX</span>
              </span>
            </div>
            <span className="text-muted-foreground text-sm font-normal">
              {tipo === 'mensalidade' ? 'Mensalidade' : 'Ingresso'}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Descricao do pagamento */}
        <div className="text-center text-sm text-muted-foreground bg-muted/50 rounded-lg py-2 px-3">
          {descricao}
        </div>

        {/* Etapa 1: Pagar via PIX */}
        {step === 'pix' && (
          <div className="space-y-5">
            {/* Valor */}
            <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground">Valor a pagar</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(valor)}
              </p>
            </div>

            {/* QR Code */}
            {qrCodeUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-white rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-36 h-36 sm:w-48 sm:h-48"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Escaneie o QR Code com o app do seu banco
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-5 bg-muted/50 rounded-lg">
                <QrCode className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground text-center">
                  QR Code nao disponivel. Use a chave PIX abaixo.
                </p>
              </div>
            )}

            {/* Chave PIX */}
            {chavePix ? (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Chave PIX:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-muted p-2 rounded break-all">
                    {chavePix}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPix}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-4 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Chave PIX nao configurada. Entre em contato com o gestor da torcida.
                  </p>
                </div>
              </Card>
            )}

            {/* Instrucoes */}
            <div className="text-sm text-muted-foreground space-y-1">
              <p>1. Copie a chave PIX ou escaneie o QR Code</p>
              <p>2. Realize o pagamento pelo app do seu banco</p>
              <p>3. Salve o comprovante e envie na proxima etapa</p>
            </div>

            {/* Botao proximo */}
            <Button onClick={() => setStep('comprovante')} className="w-full bg-green-600 hover:bg-green-700">
              <Upload className="h-4 w-4 mr-2" />
              Enviar Comprovante
            </Button>
          </div>
        )}

        {/* Etapa 2: Enviar Comprovante */}
        {step === 'comprovante' && (
          <div className="space-y-5">
            <div className="text-center text-sm text-muted-foreground">
              <p>
                Apos realizar o pagamento, envie o comprovante para confirmacao.
              </p>
            </div>

            {/* Upload do Comprovante */}
            <FileUpload
              tipo="imagem"
              bucket={STORAGE_BUCKETS.COMPROVANTES_PAGAMENTO || 'comprovantes-pagamento'}
              label="Comprovante de Pagamento"
              onUpload={(url) => setComprovanteUrl(url)}
              onRemove={() => setComprovanteUrl(null)}
              valor={comprovanteUrl || undefined}
            />

            {/* Botoes */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('pix')}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleEnviarComprovante}
                disabled={!comprovanteUrl || enviando}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {enviando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar Envio
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Etapa 3: Confirmacao */}
        {step === 'confirmacao' && (
          <div className="space-y-5 text-center py-4">
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Comprovante Enviado!</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Seu comprovante foi enviado com sucesso. Aguarde a confirmacao do gestor da torcida.
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                Status: <span className="font-medium text-foreground">Aguardando aprovacao</span>
              </p>
            </div>

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
