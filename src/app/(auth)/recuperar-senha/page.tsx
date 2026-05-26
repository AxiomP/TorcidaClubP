'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    try {
      // 2. Inicializa o cliente e monta o redirecionamento apontando para o callback
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/api/auth/callback?next=/redefinir-senha`

      // 3. Executa o disparo diretamente pelo navegador
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })

      if (resetError) {
        throw resetError
      }

      setEnviado(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar e-mail. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Recuperar Senha</h1>
          <p className="text-muted-foreground text-sm">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <Card className="p-6">
          {enviado ? (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-medium">E-mail enviado!</p>
                <p className="text-sm text-muted-foreground">
                  Se o e-mail estiver cadastrado, você receberá um link de recuperação em breve.
                  Verifique também sua caixa de spam.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md border border-red-500/50 bg-red-500/10">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
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
