import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Shield,
  Users,
  CreditCard,
  Ticket,
  CheckCircle,
  TrendingUp,
  Target,
  Zap,
  Heart
} from 'lucide-react'

const recursos = [
  {
    icon: Users,
    title: 'Gestão de Sócios',
    description: 'Visualize, bloqueie, edite e salve a ficha de cada Sócio-Torcedor.'
  },
  {
    icon: CreditCard,
    title: 'Saúde Financeira',
    description: 'Receita mensal esperada, relatório de pagamentos e funções de cobrança.'
  },
  {
    icon: Ticket,
    title: 'Gestão de Ingressos',
    description: 'Compartilhe local, data, quantidade e muito mais.'
  },
  {
    icon: TrendingUp,
    title: 'Relatórios',
    description: 'Dashboard com métricas estratégicas.'
  },
  {
    icon: CheckCircle,
    title: 'Validação Ativa',
    description: 'Modelo de autenticação para comprovantes de ingressos, mensalidades e compras.'
  },
  {
    icon: Shield,
    title: 'Segurança',
    description: 'Criptografia dos dados em conformidade com a LGPD.'
  }
]

const passos = [
  { numero: '01', titulo: 'Cadastre sua torcida', descricao: 'Crie sua conta e configure' },
  { numero: '02', titulo: 'Convide sócios', descricao: 'Envie o link de cadastro' },
  { numero: '03', titulo: 'Aprove cadastros', descricao: 'Valide documentos' },
  { numero: '04', titulo: 'Gerencie tudo', descricao: 'Acompanhe pagamentos e eventos' }
]

const diferenciais = [
  {
    icon: Target,
    title: 'Foco no Segmento',
    description: 'Feito sob medida para pequenas e médias Torcidas.'
  },
  {
    icon: Zap,
    title: 'Otimização de Tempo',
    description: 'Menos tempo no WhatsApp, mais tempo no campo. Aprove novos sócios e valide pagamentos direto pelo site.'
  },
  {
    icon: Heart,
    title: 'Propósito',
    description: 'Trazer de volta o real sentido das Torcidas Organizadas.'
  }
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#252525]">
      {/* Header */}
      <header className="py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-center">
          <Link href="/">
            <Image src="/logo.png" alt="TorcidaClub" width={220} height={66} className="object-contain" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
            Gestão completa para{' '}
            <span className="text-[#FAB515]">Torcidas Organizadas</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            Controle de sócios, pagamentos e ingressos em uma plataforma moderna e fácil de usar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="bg-[#FAB515] hover:bg-[#FAB515]/90 text-[#252525] font-bold px-8 py-6 text-lg transition-all hover:scale-105"
              asChild
            >
              <Link href="/login?tipo=gestor">Sou Gestor</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#FAB515] text-[#FAB515] hover:bg-[#FAB515]/10 font-bold px-8 py-6 text-lg transition-all hover:scale-105"
              asChild
            >
              <Link href="/login?tipo=socio">Sou Sócio</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Recursos Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-gray-400 text-lg">
              Recursos completos para automatizar sua gestão
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recursos.map((recurso, index) => (
              <div
                key={index}
                className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-6 hover:border-[#FAB515]/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-[#FAB515]/10 flex items-center justify-center mb-4">
                  <recurso.icon className="h-6 w-6 text-[#FAB515]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {recurso.title}
                </h3>
                <p className="text-gray-400 text-sm">
                  {recurso.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24 bg-[#1A1A1A]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Como <span className="text-[#FAB515]">funciona</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Comece em minutos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {passos.map((passo, index) => (
              <div key={index} className="relative">
                <div className="text-6xl font-bold text-[#FAB515]/20 mb-4">
                  {passo.numero}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {passo.titulo}
                </h3>
                <p className="text-gray-400 text-sm">
                  {passo.descricao}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diferenciais Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Por que escolher o <span className="text-[#FAB515]">TorcidaClub</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {diferenciais.map((diferencial, index) => (
              <div
                key={index}
                className="bg-[#1A1A1A] border border-gray-800 rounded-xl p-8 text-center hover:border-[#FAB515]/50 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-full bg-[#FAB515]/10 flex items-center justify-center mx-auto mb-6">
                  <diferencial.icon className="h-8 w-8 text-[#FAB515]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {diferencial.title}
                </h3>
                <p className="text-gray-400">
                  {diferencial.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24 bg-[#1A1A1A]">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Pronto para <span className="text-[#FAB515]">começar</span>?
          </h2>
          <p className="text-gray-400 text-lg">
            Modernize a gestão da sua torcida hoje mesmo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="bg-[#FAB515] hover:bg-[#FAB515]/90 text-[#252525] font-bold px-8 py-6 text-lg transition-all hover:scale-105"
              asChild
            >
              <Link href="/login?tipo=gestor">Área do Gestor</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#FAB515] text-[#FAB515] hover:bg-[#FAB515]/10 font-bold px-8 py-6 text-lg transition-all hover:scale-105"
              asChild
            >
              <Link href="/login?tipo=socio">Quero ser Sócio</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <p className="text-sm text-gray-500">
            © 2025 TorcidaClub®. Todos os direitos reservados.
          </p>

          {/* Links institucionais */}
          <div className="flex gap-4 justify-center">
            <Link
              href="/privacidade"
              className="text-xs text-gray-500 hover:text-[#FAB515] transition-colors"
            >
              Política de Privacidade
            </Link>
            <span className="text-gray-700">|</span>
            <Link
              href="/termos"
              className="text-xs text-gray-500 hover:text-[#FAB515] transition-colors"
            >
              Termos de Uso
            </Link>
          </div>

        </div>
      </footer>
    </main>
  )
}
