'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function DependenteBloqueadoPage() {
  const router = useRouter()

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="p-8 text-center border-red-200 dark:border-red-800">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-3">
            Acesso Temporariamente Indisponível
          </h1>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            O acesso da sua conta foi suspenso porque o cadastro do responsável
            pela sua conta está com pendências. Entre em contato com o titular
            para regularizar a situação.
          </p>

          <Button
            onClick={handleSair}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </Card>
      </div>
    </div>
  )
}
