'use client'

import { useContext } from 'react'
import { AuthContext } from '@/contexts/auth-context'
import type { UseAuthReturn, UserType } from '@/contexts/auth-context'

/**
 * Hook para acessar dados de autenticação do AuthProvider.
 * Deve ser usado dentro de um AuthProvider (layouts socio/gestor).
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export type { UseAuthReturn, UserType }
