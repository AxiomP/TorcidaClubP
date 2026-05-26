'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function TorcidaSuspensaPage() {
  const router = useRouter()

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="p-8 text-center border-orange-200 dark:border-orange-800">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-6">
            <Lock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>

          <h1 className="text-2xl font-bold text-orange-700 dark:text-orange-400 mb-3">
            Torcida Temporariamente Suspensa
          </h1>

          <p className="text-muted-foreground mb-6 leading-relaxed">
            Sua torcida está com a assinatura da plataforma em atraso.
            Entre em contato com o gestor da sua torcida para regularizar a situação.
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
