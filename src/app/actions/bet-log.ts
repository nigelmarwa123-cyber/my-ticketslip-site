'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addBetLogEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const stakeAmount = parseFloat(formData.get('stakeAmount') as string)
  const outcome = formData.get('outcome') as 'pending' | 'won' | 'lost'
  const returnAmountStr = formData.get('returnAmount') as string
  const returnAmount = outcome === 'won' && returnAmountStr ? parseFloat(returnAmountStr) : null
  const note = formData.get('note') as string
  const loggedAt = formData.get('loggedAt') as string || new Date().toISOString()

  if (isNaN(stakeAmount)) {
    return { error: 'Invalid stake amount' }
  }

  const { error } = await supabase.from('bet_log_entries').insert({
    user_id: user.id,
    stake_amount: stakeAmount,
    outcome,
    return_amount: returnAmount,
    note: note ? note.trim() : null,
    logged_at: loggedAt
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/bet-log')
}
