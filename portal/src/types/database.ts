// kpn-bridge :: Database types
// License: AGPL-3.0

export type PlanTier = 'free' | 'premium'
export type MemberRole = 'owner' | 'admin' | 'viewer'
export type MachineStatus = 'online' | 'offline' | 'degraded'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  plan_tier: PlanTier
  created_at: string
}

export interface OrgMembership {
  id: string
  org_id: string
  user_id: string
  role: MemberRole
  joined_at: string
}

export interface Machine {
  id: string
  org_id: string
  name: string
  agent_version: string | null
  status: MachineStatus
  last_seen_at: string | null
  created_at: string
}
