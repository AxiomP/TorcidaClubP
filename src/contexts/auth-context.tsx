'use client'

import { createContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Gestor = Database['public']['Tables']['gestores']['Row']
type Socio = Database['public']['Tables']['socios']['Row']
type Dependente = Database['public']['Tables']['dependentes']['Row']

export type UserType = 'gestor' | 'socio_titular' | 'dependente' | null

export interface UseAuthReturn {
  user: User | null
  loading: boolean
  isGestor: boolean
  isSocioTitular: boolean
  isDependente: boolean
  isAuthenticated: boolean
  userType: UserType
  gestorData: Partial<Gestor> | null
  socioData: Partial<Socio> | null
  dependenteData: Partial<Dependente> | null
  titularId: string | null
  torcidaId: string | null
  refetch: () => Promise<void>
}

export const AuthContext = createContext<UseAuthReturn | null>(null)

// Safety timeout (aumentado para VPS com latência maior)
const AUTH_SAFETY_TIMEOUT = 15000
// Delay entre retries
const RETRY_DELAY = 300

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [gestorData, setGestorData] = useState<Partial<Gestor> | null>(null)
  const [socioData, setSocioData] = useState<Partial<Socio> | null>(null)
  const [dependenteData, setDependenteData] = useState<Partial<Dependente> | null>(null)
  const initializedRef = useRef(false)
  const mountedRef = useRef(true)
  const isCheckingRef = useRef(false)
  const safetyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Captura usuário que chega via onAuthStateChange enquanto checkSession está rodando
  // (race condition: getSession() retorna null antes do cookie sincronizar com localStorage)
  const pendingUserRef = useRef<User | null>(null)

  // useRef garante referência estável — não recria o client a cada render
  const supabaseRef = useRef(createClient())

  // Verificar se estamos em uma página de auth onde não devemos tentar autenticar
  const isAuthPage = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/login') ||
    window.location.pathname.startsWith('/recuperar-senha') ||
    window.location.pathname.startsWith('/redefinir-senha') ||
    window.location.pathname.startsWith('/cadastro')
  )

  const fetchUserData = useCallback(async (_authUser: User) => {
    if (!mountedRef.current) return

    try {
      const res = await fetch('/api/auth/me')
      if (!mountedRef.current) return

      if (!res.ok) {
        console.warn('[auth-context] /api/auth/me retornou erro:', res.status)
        setGestorData(null)
        setSocioData(null)
        setDependenteData(null)
        return
      }

      const { gestor, socio, dependente } = await res.json()
      if (!mountedRef.current) return

      // Determinar tipo (prioridade: gestor > socio > dependente)
      if (gestor && gestor.ativo !== false) {
        setGestorData(gestor)
        setSocioData(null)
        setDependenteData(null)
      } else if (socio && ['ativo', 'inadimplente', 'bloqueado'].includes(socio.status)) {
        setGestorData(null)
        setSocioData(socio)
        setDependenteData(null)
      } else if (dependente && dependente.status === 'ativo') {
        setGestorData(null)
        setSocioData(null)
        setDependenteData(dependente)
      } else {
        setGestorData(null)
        setSocioData(null)
        setDependenteData(null)
      }
    } catch (error) {
      console.error('[auth-context] Exceção ao buscar dados do usuário:', error)
      if (mountedRef.current) {
        setGestorData(null)
        setSocioData(null)
        setDependenteData(null)
      }
    }
  }, [])

  const checkSession = useCallback(async (retries = 2): Promise<void> => {
    if (!mountedRef.current || isCheckingRef.current) return
    isCheckingRef.current = true

    try {
      const { data: { session }, error } = await supabaseRef.current.auth.getSession()
      console.log('[auth] checkSession: session?', !!session?.user)

      // Em páginas de auth, não tentar verificar sessão
      if (isAuthPage) {
        setLoading(false)
        return
      }

      // Detectar erro fatal de token (não adianta fazer retry)
      if (error) {
        const isFatalAuthError =
          error.message?.includes('Refresh Token Not Found') ||
          error.message?.includes('invalid_grant')

        if (isFatalAuthError) {
          console.error('[auth-context] Token inválido. Limpando sessão...')
          await supabaseRef.current.auth.signOut({ scope: 'local' })
          window.location.href = '/login?erro=sessao_expirada'
          return
        }
      }

      // Se houver erro e ainda temos retries, tentar novamente após delay
      if (error && retries > 0) {
        console.warn(
          `[auth-context] Erro ao verificar sessão, tentando novamente... (${retries} tentativas restantes)`
        )
        isCheckingRef.current = false
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        if (mountedRef.current) {
          return checkSession(retries - 1)
        }
        return
      }

      if (!mountedRef.current) return

      if (session?.user) {
        pendingUserRef.current = null
        await fetchUserData(session.user)
        console.log('[auth] dados carregados, setUser + setLoading(false)')
        setUser(session.user) // só depois dos dados prontos
      } else {
        // getSession() retornou null — verificar se onAuthStateChange capturou um usuário
        // enquanto isCheckingRef estava true (race condition: cookie ainda não sincronizado
        // com localStorage no primeiro load após redirect de login)
        const captured = pendingUserRef.current
        pendingUserRef.current = null
        if (captured && mountedRef.current) {
          console.log('[auth] usando sessão capturada de onAuthStateChange')
          await fetchUserData(captured)
          setUser(captured)
        } else {
          setUser(null)
          setGestorData(null)
          setSocioData(null)
          setDependenteData(null)
        }
      }
    } catch (error) {
      pendingUserRef.current = null
      console.error('[auth-context] Exceção em checkSession:', error)
      if (retries > 0) {
        isCheckingRef.current = false
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
        if (mountedRef.current) {
          return checkSession(retries - 1)
        }
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        initializedRef.current = true
      }
      isCheckingRef.current = false
    }
  }, [fetchUserData, isAuthPage])

  const refetch = useCallback(async () => {
    if (!mountedRef.current) return
    setLoading(true)
    isCheckingRef.current = false
    await checkSession()
  }, [checkSession])

  useEffect(() => {
    mountedRef.current = true

    checkSession().then(() => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current)
        safetyTimeoutRef.current = null
      }
    })

    // Safety timeout
    safetyTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('[auth-context] SAFETY TIMEOUT: Forçando loading = false após 15s')
        setLoading(false)
        initializedRef.current = true
      }
    }, AUTH_SAFETY_TIMEOUT)

    // Escutar mudanças de autenticação (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabaseRef.current.auth.onAuthStateChange(async (event, session) => {
      console.log('[auth] onAuthStateChange:', event, !!session?.user)
      if (!mountedRef.current) return

      // Evitar processar eventos enquanto checkSession está rodando,
      // mas capturar o usuário para caso getSession() retorne null (race condition de cookie)
      if (isCheckingRef.current) {
        if (session?.user) {
          pendingUserRef.current = session.user
        }
        return
      }

      // TOKEN_REFRESHED: apenas atualiza o user (token novo) sem rebuscar dados do DB
      if (event === 'TOKEN_REFRESHED') {
        if (session?.user) setUser(session.user)
        return
      }

      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current)
        safetyTimeoutRef.current = null
      }
      if (session?.user) {
        await fetchUserData(session.user)
        setUser(session.user) // só depois dos dados prontos
      } else {
        setUser(null)
        setGestorData(null)
        setSocioData(null)
        setDependenteData(null)
      }

      if (mountedRef.current) {
        setLoading(false)
      }
    })

    return () => {
      mountedRef.current = false
      initializedRef.current = false
      isCheckingRef.current = false
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current)
      }
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Determinar tipo de usuário
  const isGestor = !!gestorData
  const isSocioTitular = !!socioData
  const isDependente = !!dependenteData

  let userType: UserType = null
  if (isGestor) userType = 'gestor'
  else if (isSocioTitular) userType = 'socio_titular'
  else if (isDependente) userType = 'dependente'

  // Determinar torcida_id baseado no tipo de usuário
  let torcidaId: string | null = null
  if (gestorData?.torcida_id) torcidaId = gestorData.torcida_id
  else if (socioData?.torcida_id) torcidaId = socioData.torcida_id
  else if (dependenteData?.torcida_id) torcidaId = dependenteData.torcida_id

  const value: UseAuthReturn = {
    user,
    loading,
    isGestor,
    isSocioTitular,
    isDependente,
    isAuthenticated: !!user,
    userType,
    gestorData,
    socioData,
    dependenteData,
    titularId: dependenteData?.socio_titular_id ?? null,
    torcidaId,
    refetch,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
