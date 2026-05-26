'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  User,
  Users,
  Ticket,
  History,
  CreditCard,
  Menu,
  X,
  LogOut,
  Headphones,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { QuemSomosModal } from '@/components/socio/quem-somos-modal'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Painel', href: '/painel', icon: Home },
  { name: 'Perfil', href: '/perfil', icon: User },
  { name: 'Mensalidade', href: '/mensalidade', icon: CreditCard },
  { name: 'Dependentes', href: '/dependentes', icon: Users },
  { name: 'Ingressos', href: '/ingressos', icon: Ticket },
  { name: 'Historico', href: '/historico', icon: History },
]

export function SocioHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { socioData, torcidaId } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [torcidaTelefone, setTorcidaTelefone] = useState<string | null>(null)

  useEffect(() => {
    if (!torcidaId) return
    fetch(`/api/torcida/${torcidaId}/quem-somos`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.gestor_telefone) setTorcidaTelefone(d.gestor_telefone) })
      .catch(() => {})
  }, [torcidaId])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container relative flex h-16 items-center px-4">
        {/* Logo - centered on mobile, left-aligned on desktop */}
        <Link href="/painel" className="flex items-center absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          <Image src="/logo.png" alt="TorcidaClub" width={130} height={40} className="object-contain" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-8">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#FAB515]/10 text-[#FAB515]'
                    : 'text-foreground-muted hover:text-foreground hover:bg-background-secondary'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
          <QuemSomosModal torcidaId={torcidaId as string | null} />
        </nav>

        {/* Actions (Desktop + Mobile) */}
        <div className="ml-auto flex items-center gap-1 md:gap-2">
          {socioData?.id && (
            <NotificationBell socioId={socioData.id as string} />
          )}
          {torcidaTelefone && (
            <a
              href={`https://wa.me/55${torcidaTelefone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Preciso de suporte.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
              title="Suporte via WhatsApp"
            >
              <Headphones className="h-4 w-4" />
              Suporte
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="hidden md:flex text-foreground-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`md:hidden border-t border-border bg-background-secondary${mobileMenuOpen ? '' : ' hidden'}`}>
          <nav className="container px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  prefetch={false}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#FAB515]/10 text-[#FAB515]'
                      : 'text-foreground-muted hover:text-foreground hover:bg-background-tertiary'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
            <QuemSomosModal
              torcidaId={torcidaId as string | null}
              onOpen={() => setMobileMenuOpen(false)}
              trigger={
                <div className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors cursor-pointer">
                  <Info className="h-5 w-5" />
                  Quem Somos
                </div>
              }
            />
            {torcidaTelefone && (
              <a
                href={`https://wa.me/55${torcidaTelefone.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Preciso de suporte.')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-green-600 hover:bg-background-tertiary transition-colors"
              >
                <Headphones className="h-5 w-5" />
                Suporte
              </a>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </nav>
        </div>
    </header>
  )
}
