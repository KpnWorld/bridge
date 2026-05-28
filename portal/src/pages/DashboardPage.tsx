// kpn-bridge :: Dashboard (Milestone 1 placeholder)
// License: AGPL-3.0

import { useAuth } from '../context/AuthContext'

export default function DashboardPage() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {profile?.display_name ?? 'there'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm border border-border rounded-md text-foreground hover:bg-accent transition-colors"
          >
            Sign out
          </button>
        </div>
        <div className="border border-border rounded-lg p-6 bg-card">
          <p className="text-muted-foreground text-sm">
            🚧 Milestone 2 — Machine inventory coming next.
          </p>
        </div>
      </div>
    </div>
  )
}
