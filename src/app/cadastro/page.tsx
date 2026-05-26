'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { MultiStepForm } from '@/components/cadastro/multi-step-form'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function CadastroPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Voltar */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Home
          </Link>

          {/* Logo e Título */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logo.png" alt="TorcidaClub" width={220} height={66} className="object-contain" />
            </div>
            <p className="text-xl text-muted-foreground">
              Cadastro de Sócio
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Preencha todos os dados para se tornar um sócio
            </p>
          </div>
        </div>

        {/* Formulário Multi-etapa */}
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-torcida-laranja" />
          </div>
        }>
          <MultiStepForm />
        </Suspense>

        {/* Informação de ajuda */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Ao enviar o cadastro, você concorda com nossos{' '}
            <Link href="/termos" className="underline">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacidade" className="underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
