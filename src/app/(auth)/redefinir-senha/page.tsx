'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createRecoveryClient } from '@/lib/supabase/client-recovery'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

function getRecoveryError(error: string | null, errorCode: string | null, description: string | null) {
  if (!error) return null

  if (error === 'access_denied' && errorCode === 'otp_expired') {
    return 'Este link de recuperação expirou. Solicite um novo link de redefinição de senha.'
  }

  if (error === 'access_denied') {
    return description || 'Este link de recuperação é inválido. Solicite um novo link de redefinição de senha.'
  }

  if (description) {
    return decodeURIComponent(description)
  }

  return 'Erro ao verificar o link de recuperação. Solicite um novo link de redefinição de senha.'
}

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)

  const recoveryError = searchParams.get('error')
  const recoveryErrorCode = searchParams.get('error_code')
  const recoveryErrorDescription = searchParams.get('error_description')

  useEffect(() => {
    const mappedError = getRecoveryError(recoveryError, recoveryErrorCode, recoveryErrorDescription)
    if (mappedError) {
      setError(mappedError)
      setPronto(true)
      return
    }

    const recoveryType = searchParams.get('type')
    const code = searchParams.get('code')
    const token = searchParams.get('token')
    const tokenHash = searchParams.get('token_hash')
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const hasRecoveryToken = !!token || !!tokenHash || !!accessToken || !!refreshToken
    const isRecoveryLink = recoveryType === 'recovery' || hasRecoveryToken || !!code

    const supabase = isRecoveryLink ? createRecoveryClient() : createClient()
    let subscription: { unsubscribe: () => void } | null = null
    let sessionCheckAttempts = 0
    const maxAttempts = 3

    console.log('[redefinir-senha] URL params:', {
      recoveryType,
      code,
      token,
      tokenHash,
      accessToken,
      refreshToken,
      isRecoveryLink,
    })

    const handlePronto = () => {
      console.log('[redefinir-senha] Link de recuperação pronto para uso')
      setPronto(true)
    }

    const checkSession = async () => {
      sessionCheckAttempts++
      try {
        console.log(`[redefinir-senha] Verificando sessão (tentativa ${sessionCheckAttempts}/${maxAttempts})`)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (session) {
          console.log('[redefinir-senha] Sessão detectada da URL')
          handlePronto()
          return
        }

        if (error) {
          console.warn('[redefinir-senha] Erro ao verificar sessão:', error)
          // Se foi erro de PKCE (device mismatch), ainda assim mostra o formulário para recovery
          if (isRecoveryLink) {
            handlePronto()
            return
          }
        }

        if (isRecoveryLink) {
          console.log('[redefinir-senha] Link de recuperação detectado; exibindo formulário')
          handlePronto()
        } else if (sessionCheckAttempts < maxAttempts) {
          // Retry se não for link de recovery e não atingiu max attempts
          await new Promise(r => setTimeout(r, 500))
          await checkSession()
        } else {
          console.warn('[redefinir-senha] Sessão não encontrada após', maxAttempts, 'tentativas')
          if (isRecoveryLink) {
            handlePronto()
          }
        }
      } catch (e) {
        console.error('[redefinir-senha] Erro ao verificar sessão:', e)
        if (isRecoveryLink) {
          handlePronto()
        }
      }
    }

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[redefinir-senha] Auth event:', event, 'session?', !!session?.user)
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        handlePronto()
      }
    })

    subscription = authSubscription
    checkSession()

    return () => {
      subscription?.unsubscribe()
    }
  }, [recoveryError, recoveryErrorCode, recoveryErrorDescription, searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (senha.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (senha !== confirmar) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const recoveryToken = searchParams.get('token') || searchParams.get('token_hash')
      const recoveryCode = searchParams.get('code')
      const recoveryTokenHash = searchParams.get('token_hash')
      const recoveryAccessToken = searchParams.get('access_token')
      const recoveryType = searchParams.get('type')
      const isRecoveryLink = recoveryType === 'recovery' || !!recoveryToken || !!recoveryCode || !!recoveryAccessToken
      const supabase = isRecoveryLink ? createRecoveryClient() : createClient()

      const { data: { session } } = await supabase.auth.getSession()
      const recoveryRefreshToken = searchParams.get('refresh_token')

      if (!session && recoveryAccessToken && recoveryRefreshToken) {
        console.log('[redefinir-senha] Tentando criar sessão com access_token/refresh_token do link de recuperação')
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: recoveryAccessToken,
          refresh_token: recoveryRefreshToken,
        })

        if (setSessionError) {
          console.warn('[redefinir-senha] Falha ao setSession:', setSessionError)
        }
      }

      const { data: { session: sessionAfterSet } } = await supabase.auth.getSession()
      const currentSession = session || sessionAfterSet

      if (!currentSession && (recoveryToken || recoveryTokenHash)) {
        console.log('[redefinir-senha] Sem sessão ativa, tentando verifyOtp com token de recuperação')

        const finalToken = recoveryTokenHash || recoveryToken || searchParams.get('token');

        
        const verifyParams = {
          type: 'recovery' as const,
          token_hash: finalToken as string
        };

        const { error: verifyError, data } = await supabase.auth.verifyOtp(verifyParams)

        if (verifyError) {
          console.error('[redefinir-senha] Erro ao verificar OTP:', verifyError)
          setError('Código de recuperação inválido. Solicite um novo link.')
          setLoading(false)
          return
        }

        console.log('[redefinir-senha] OTP verificado com sucesso')
        console.log('[redefinir-senha] Session após OTP:', !!data?.session)

        if (!data?.session) {
          console.warn('[redefinir-senha] OTP verificada mas nenhuma sessão criada')
        }
      } else if (!currentSession && recoveryCode) {
        console.error('[redefinir-senha] Link de recuperação em modo PKCE detectado sem token válido neste dispositivo')
        setError('Este link de recuperação funciona apenas no dispositivo em que foi solicitado. Solicite um novo link.')
        setLoading(false)
        return
      } else if (!currentSession) {
        console.log('[redefinir-senha] Nenhuma sessão ativa e nenhum token de recuperação disponível')
      }

      // Tentar atualizar a senha - com retry se falhar na primeira vez
      let updateError = null
      for (let attempt = 1; attempt <= 2; attempt++) {
        const { error } = await supabase.auth.updateUser({ password: senha })
        updateError = error
        
        if (!error) {
          console.log('[redefinir-senha] Senha atualizada com sucesso')
          break
        }
        
        if (attempt < 2) {
          console.warn(`[redefinir-senha] Tentativa ${attempt} falhou, aguardando e tentando novamente...`)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      if (updateError) {
        console.error('[redefinir-senha] Erro ao atualizar senha:', updateError)

        // Detectar erro PKCE específico (quando o link é de outro dispositivo)
        if (updateError.message?.includes('400') || updateError.message?.includes('invalid_grant')) {
          setError('Este link de recuperação é inválido ou foi usado em outro dispositivo. Solicite um novo link de redefinição de senha.')
        } else if (updateError.message?.includes('Auth session missing')) {
          setError('Sessão expirada. Abra o link de recuperação novamente a partir do email.')
        } else if (updateError.message?.includes('refresh_token_not_found')) {
          setError('Seu link de recuperação expirou. Solicite um novo link de reset.')
        } else if (updateError.message?.includes('invalid_grant')) {
          setError('Seu link de recuperação é inválido ou expirou. Solicite um novo.')
        } else if (updateError.message?.toLowerCase().includes('same') || updateError.message?.toLowerCase().includes('igual')) {
          setError('A nova senha deve ser diferente da senha atual.')
        } else if (updateError.message?.toLowerCase().includes('password')) {
          setError('Erro ao definir a nova senha. Tente novamente.')
        } else {
          setError(updateError.message || 'Erro ao redefinir senha. Tente novamente.')
        }
        return
      }

      console.log('[redefinir-senha] Redefinição completada com sucesso')

      // Limpar a sessão após sucesso para forçar novo login
      await supabase.auth.signOut().catch(() => null)
      router.push('/login?info=senha_alterada')
    } catch (err) {
      console.error('[redefinir-senha] Erro inesperado:', err)
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Redefinir Senha</h1>
          <p className="text-muted-foreground text-sm">
            Digite sua nova senha abaixo.
          </p>
        </div>

        <Card className="p-6">
          {!pronto ? (
            <div className="text-center space-y-3 py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Verificando link de recuperação...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md border border-red-500/50 bg-red-500/10 space-y-2">
                  <p className="text-red-400 text-sm">{error}</p>
                  <div className="text-xs text-muted-foreground">
                    <Link href="/recuperar-senha" className="underline hover:text-foreground">
                      Solicitar outro link de recuperação
                    </Link>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="senha">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    autoFocus
                    disabled={loading}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar Nova Senha</Label>
                <Input
                  id="confirmar"
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !senha || !confirmar}
              >
                {loading ? 'Salvando...' : 'Redefinir Senha'}
              </Button>
            </form>
          )}
        </Card>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  )
}
