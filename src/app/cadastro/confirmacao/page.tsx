'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, Home, Mail, Zap } from 'lucide-react'

function ConfirmacaoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [cadastroId, setCadastroId] = useState<string | null>(null)

  useEffect(() => {
    const id = searchParams.get('id')
    if (!id) {
      // Se não tem ID, redirecionar para página de cadastro
      router.push('/cadastro')
    } else {
      setCadastroId(id)
      setLoading(false)
    }
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-torcida-laranja" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-secondary">
      <div className="w-full max-w-2xl mx-auto">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image src="/logo.png" alt="TorcidaClub" width={220} height={66} className="object-contain" />
        </div>

        {/* Card de Confirmação */}
        <Card className="p-8 shadow-lg">
          <div className="text-center space-y-6">
            {/* Ícone de Sucesso */}
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Título */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-green-700 dark:text-green-400">
                Cadastro Enviado com Sucesso!
              </h2>
              <p className="text-lg text-muted-foreground mt-2">
                Seu cadastro foi recebido e está em análise
              </p>
            </div>

            {/* Informação do Cadastro */}
            {cadastroId && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Número do Cadastro:</strong> #{cadastroId.substring(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Guarde este número para acompanhamento
                </p>
              </div>
            )}

            {/* Próximos Passos */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-left">
              <h3 className="text-lg font-semibold mb-4 text-center">
                📋 Próximos Passos
              </h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-torcida-laranja text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>
                    O gestor da torcida receberá uma notificação sobre seu cadastro
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-torcida-laranja text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>
                    Seus documentos serão analisados e validados
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-torcida-laranja text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>
                    Você receberá um email quando seu cadastro for aprovado ou se houver alguma pendência
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-torcida-laranja text-white flex items-center justify-center text-xs font-bold">
                    4
                  </span>
                  <span>
                    Após aprovação, você poderá fazer login e acessar todos os benefícios
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                    5
                  </span>
                  <span>
                    No primeiro acesso após aprovação, você realizará o pagamento da sua primeira mensalidade via <strong>TorPIX</strong>
                  </span>
                </li>
              </ol>
            </div>

            {/* Info TorPIX */}
            <div className="flex items-start gap-3 p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 rounded-lg">
              <Zap className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-left text-sm text-green-900 dark:text-green-100">
                <p className="font-medium">
                  <span className="font-bold">TorPIX</span> — Pagamento rápido e seguro
                </p>
                <p className="mt-1 text-green-800 dark:text-green-200">
                  Ao ser aprovado, sua primeira mensalidade será gerada automaticamente. Basta pagar via PIX direto no seu perfil de sócio.
                </p>
              </div>
            </div>

            {/* Informação Adicional */}
            <div className="flex items-start gap-3 p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-left text-sm text-amber-900 dark:text-amber-100">
                <p className="font-medium">Fique atento ao seu email!</p>
                <p className="mt-1 text-amber-800 dark:text-amber-200">
                  Enviaremos todas as atualizações sobre seu cadastro para o email informado.
                  Não esqueça de verificar a caixa de spam.
                </p>
              </div>
            </div>

            {/* Estimativa de Tempo */}
            <p className="text-sm text-muted-foreground">
              <strong>Tempo estimado de análise:</strong> até 48 horas úteis
            </p>

            {/* Botão Voltar */}
            <div className="pt-4">
              <Button size="lg" asChild>
                <Link href="/" className="inline-flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Voltar para Home
                </Link>
              </Button>
            </div>

            {/* Footer */}
            <div className="text-xs text-muted-foreground pt-6 border-t">
              <p>
                Dúvidas? Entre em contato com a torcida através dos canais oficiais
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function ConfirmacaoCadastroPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-torcida-laranja" />
      </div>
    }>
      <ConfirmacaoContent />
    </Suspense>
  )
}
