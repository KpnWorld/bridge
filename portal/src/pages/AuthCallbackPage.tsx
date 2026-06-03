// kpn-bridge :: Auth callback handler (email confirmation redirect)
// License: AGPL-3.0

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { consumeReturnTo } from '../lib/returnTo'

type ErrorState = {
  title: string
  description: string
}

function parseHashError(): ErrorState | null {
  const hash = window.location.hash.slice(1)
  const params = new URLSearchParams(hash)
  const error = params.get('error')
  const errorCode = params.get('error_code')
  const errorDescription = params.get('error_description')

  if (!error) return null

  if (
    errorCode === 'otp_expired' ||
    (errorDescription && /expired/i.test(errorDescription))
  ) {
    return {
      title: 'Confirmation link expired',
      description:
        'This email confirmation link has expired. Confirmation links are only valid for a short time — please request a new one below.',
    }
  }

  if (
    errorCode === 'otp_already_used' ||
    (errorDescription && /already (been )?used/i.test(errorDescription))
  ) {
    return {
      title: 'Link already used',
      description:
        "This confirmation link has already been used. If you haven't confirmed your email yet, request a new link below.",
    }
  }

  return {
    title: 'Confirmation failed',
    description:
      errorDescription?.replace(/\+/g, ' ') ||
      'Something went wrong with your confirmation link. Please request a new one below.',
  }
}

async function storePendingOrgIfPresent(userId: string) {
  const raw = sessionStorage.getItem('pendingOrg')
  if (!raw) return
  try {
    const { orgName, orgSlug } = JSON.parse(raw)
    const { error } = await supabase.rpc('store_pending_org', {
      p_user_id: userId,
      org_name: orgName,
      org_slug: orgSlug,
    })
    if (error) {
      console.error('[kpn-bridge] store_pending_org failed:', error)
    } else {
      console.log('[kpn-bridge] Pending org stored successfully')
    }
  } catch (err) {
    console.error('[kpn-bridge] Failed to parse pendingOrg from sessionStorage:', err)
  } finally {
    sessionStorage.removeItem('pendingOrg')
  }
}

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [linkError, setLinkError] = useState<ErrorState | null>(null)
  const [email, setEmail] = useState('')
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  useEffect(() => {
    const hashError = parseHashError()
    if (hashError) {
      setLinkError(hashError)
      return
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Store pending org now that we have a live session (auth.uid() is set)
        await storePendingOrgIfPresent(session.user.id)

        const returnTo = consumeReturnTo()
        navigate(returnTo, { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    })
  }, [navigate])

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setResendStatus('sending')
    setResendMessage(null)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    })

    if (error) {
      console.error('[kpn-bridge] Resend confirmation error:', error)
      setResendStatus('error')
      setResendMessage(error.message)
    } else {
      setResendStatus('sent')
      setResendMessage(`A new confirmation email has been sent to ${email.trim()}. Please check your inbox.`)
    }
  }

  if (!linkError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            kpn-bridge
          </h1>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">{linkError.title}</h2>
            <p className="text-sm text-muted-foreground">{linkError.description}</p>
          </div>

          {resendStatus === 'sent' ? (
            <div className="rounded-md bg-primary/10 border border-primary/20 px-4 py-3">
              <p className="text-sm text-primary">{resendMessage}</p>
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Your email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {resendStatus === 'error' && resendMessage && (
                <p className="text-sm text-destructive">{resendMessage}</p>
              )}

              <button
                type="submit"
                disabled={resendStatus === 'sending'}
                className="w-full py-2 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendStatus === 'sending' ? 'Sending…' : 'Send new confirmation email'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already confirmed?{' '}
          <a href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
