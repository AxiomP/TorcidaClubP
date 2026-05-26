'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorAlert } from '@/components/ui/error-alert'
import { signInWithGoogle } from '@/lib/auth/google-signin'
import { fetchWithTimeout } from '@/lib/utils/fetch-with-timeout'
import { Shield, Users, MessageCircle } from 'lucide-react'

type UserType = 'gestor' | 'socio'

// Mapear erros específicos para mensagens amigáveis
function getErrorMessage(error: unknown): string {
  const errorString = error instanceof Error ? error.message : String(error)

  // Erro: Provider não habilitado
  if (errorString.includes('provider is not enabled') ||
      errorString.includes('validation_failed')) {
    return 'Google OAuth não está configurado. Por favor, siga as instruções em CONFIGURAR-GOOGLE-OAUTH.md para habilitar o provedor Google no Supabase.'
  }

  // Erro: Callback inválido
  if (errorString.includes('redirect') || errorString.includes('callback')) {
    return 'URL de callback não configurada. Verifique se a URL de redirect está correta no Google Cloud Console.'
  }

  // Erro genérico
  return 'Erro ao fazer login. Por favor, verifique sua conexão e tente novamente.'
}

// Mapear erros da URL (após redirect)
function getUrlError(errorCode: string | null): string | null {
  if (!errorCode) return null

  const errorMap: Record<string, string> = {
    'auth_error': 'Erro na autenticação. Por favor, tente novamente.',
    'no_user': 'Usuário não encontrado após autenticação.',
    'callback_error': 'Erro no callback OAuth. Verifique a configuração.',
    'no_code': 'Código de autorização não recebido.',
    'registration_failed': 'Erro ao registrar usuário. Tente novamente.',
    'account_inactive': 'Sua conta de gestor está inativa. Entre em contato com o administrador.',
    'wrong_google_account': 'Este email já está vinculado a outra conta Google. Use a conta Google original.',
  }

  return errorMap[errorCode] || 'Erro desconhecido na autenticação.'
}

export default function LoginPage() {
  const [userType, setUserType] = useState<UserType>('socio')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const searchParams = useSearchParams()

  // Verificar erros e parâmetros na URL (após redirect)
  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) {
      setError(getUrlError(urlError))
    }

    const info = searchParams.get('info')
    if (info === 'senha_alterada') {
      setError(null) // Limpar qualquer erro anterior
      // Mostrar mensagem de sucesso em um toast ou alerta (opcional)
      // Por enquanto apenas permitir que o usuário faça login com a nova senha
    }

    const tipo = searchParams.get('tipo')
    if (tipo === 'socio' || tipo === 'gestor') {
      setUserType(tipo)
    }
  }, [searchParams])

  // Login com Google (para gestores)
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (err) {
      console.error('Erro ao fazer login:', err)
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  // Login com email/senha (para sócios)
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !senha) {
      setError('Preencha email e senha')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetchWithTimeout(
        '/api/auth/login-socio',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, senha }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao fazer login')

        // Se é gestor, sugerir mudar para aba de gestor
        if (data.isGestor) {
          setUserType('gestor')
        }

        setLoading(false)
        return
      }

      // Login bem-sucedido, redirecionar (hard navigation para desmontar o componente
      // e garantir que os cookies de sessão sejam enviados frescos na próxima requisição)
      setLoading(false)
      window.location.href = data.redirectTo
    } catch (err: unknown) {
      console.error('Erro ao fazer login:', err)

      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Servidor demorou muito para responder. Tente novamente.')
      } else {
        setError('Erro de conexão. Tente novamente.')
      }

      setLoading(false)
    }
  }

  return (
    <Card className="p-8 shadow-lg max-w-md w-full">
      <div className="space-y-6">
        {/* Título */}
        <div className="text-center space-y-2">
          {userType === 'gestor' ? (
            <>
              <div className="flex justify-center mb-2">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Acesso do Gestor</h2>
              <p className="text-sm text-muted-foreground">
                Entre com sua conta Google
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-2">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Acesso do Sócio</h2>
              <p className="text-sm text-muted-foreground">
                Entre com seu email e senha
              </p>
            </>
          )}
        </div>

        {/* Erro */}
        {error && (
          <ErrorAlert
            message={error}
            onRetry={() => setError(null)}
          />
        )}

        {/* Formulário de login baseado no tipo */}
        {userType === 'socio' ? (
          // Login de Sócio (Email/Senha)
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Entrando...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </Button>

            <div className="text-center text-sm">
              <Link
                href="/recuperar-senha"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>
          </form>
        ) : (
          // Login de Gestor (Google OAuth)
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Gestores utilizam login com Google para maior segurança
            </p>

            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 text-base"
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Conectando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Entrar com Google</span>
                </div>
              )}
            </Button>
          </div>
        )}

        {/* Divisor */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Link para cadastro / trocar tipo */}
        <div className="text-center text-sm space-y-2">
          {userType === 'socio' ? (
            <>
              <p className="text-muted-foreground">
                Ainda não é sócio?{' '}
                <Link
                  href="/cadastro"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Cadastre-se agora
                </Link>
              </p>
              <p className="text-muted-foreground">
                É gestor?{' '}
                <Link
                  href="/login?tipo=gestor"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Clique aqui
                </Link>
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Primeiro acesso? Entre com Google acima para criar sua conta de gestor.
              </p>
              <p className="text-muted-foreground">
                É sócio?{' '}
                <Link
                  href="/login?tipo=socio"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Clique aqui
                </Link>
              </p>
            </>
          )}
        </div>

        {/* Voltar */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar para home
          </Link>
        </div>

        {/* Política de Privacidade */}
        <div className="text-center pt-2">
          <Link
            href="/privacidade"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Política de Privacidade
          </Link>
        </div>

        {/* Suporte */}
        {process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP && (
          <div className="text-center pt-1">
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP}?text=${encodeURIComponent('Olá! Preciso de ajuda com o acesso à plataforma.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-green-600 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Precisa de ajuda? Fale conosco
            </a>
          </div>
        )}
      </div>
    </Card>
  )
}
