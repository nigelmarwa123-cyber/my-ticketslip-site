'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFollow(followingId: string, currentPath: string = '/') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .maybeSingle()

  if (existing) {
    await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', followingId)
  } else {
    await supabase.from('follows').insert({ follower_id: user.id, following_id: followingId })
  }
  revalidatePath(currentPath)
}

export async function toggleReaction(ticketId: string, type: 'fire' | 'risky', currentPath: string = '/') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('ticket_id', ticketId)
    .eq('type', type)
    .maybeSingle()

  if (existing) {
    await supabase.from('reactions').delete().eq('id', existing.id)
  } else {
    await supabase.from('reactions').insert({ user_id: user.id, ticket_id: ticketId, type })
  }
  revalidatePath(currentPath)
}

export async function toggleFlag(ticketId: string, currentPath: string = '/') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: existing } = await supabase
    .from('flags')
    .select('id')
    .eq('user_id', user.id)
    .eq('ticket_id', ticketId)
    .maybeSingle()

  if (existing) {
    await supabase.from('flags').delete().eq('id', existing.id)
  } else {
    await supabase.from('flags').insert({ user_id: user.id, ticket_id: ticketId })
  }
  revalidatePath(currentPath)
}
