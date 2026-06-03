// kpn-bridge :: Auth context provider
// License: AGPL-3.0

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/database'

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) handleSession(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        if (session) handleSession(session.user.id)
        else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function handleSession(userId: string) {
    await fetchProfile(userId)
    await completePendingOrgSetup()
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function completePendingOrgSetup() {
    try {
      const { data: pending } = await supabase
        .from('pending_org_setup')
        .select('*')
        .single()

      if (!pending) return

      const { data: existing } = await supabase
        .from('org_memberships')
        .select('id')
        .limit(1)
        .single()

      if (existing) {
        await supabase.from('pending_org_setup').delete().eq('user_id', pending.user_id)
        return
      }

      const { error } = await supabase.rpc('create_organization', {
        org_name: pending.org_name,
        org_slug: pending.org_slug,
      })

      if (!error) {
        await supabase.from('pending_org_setup').delete().eq('user_id', pending.user_id)
        console.log('[kpn-bridge] Org created successfully on first login')
      } else {
        console.error('[kpn-bridge] Failed to complete org setup:', error)
      }
    } catch {
      // No pending setup — normal login, do nothing
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
