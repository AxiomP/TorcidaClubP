'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface AprovarCadastroButtonProps {
  socioId: string
}

export function AprovarCadastroButton({ socioId }: AprovarCadastroButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAprovar = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/cadastro/${socioId}/aprovar`, {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao aprovar cadastro')
      }

      toast.success('Cadastro aprovado com sucesso!')
      router.push('/gestor/cadastros')
    } catch (error) {
      console.error('Erro ao aprovar:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao aprovar cadastro'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          size="lg"
          className="bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5 mr-2" />
          )}
          Aprovar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Aprovar Cadastro?</AlertDialogTitle>
          <AlertDialogDescription>
            Ao aprovar este cadastro, o sócio receberá um email de confirmação e
            poderá fazer login na plataforma. O status será alterado para &ldquo;Ativo&rdquo;.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAprovar}
            className="bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            {loading ? 'Aprovando...' : 'Sim, Aprovar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
