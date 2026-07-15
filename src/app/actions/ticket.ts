'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTicketStatus(ticketId: string, status: 'won' | 'lost') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)
    .eq('poster_id', user.id)
    .eq('status', 'pending')
  
  if (error) return { error: error.message }
  
  revalidatePath(`/ticket/${ticketId}`)
  revalidatePath('/')
  revalidatePath(`/profile/${user.id}`)
}

export async function addComment(ticketId: string, formData: FormData) {
  const body = formData.get('body') as string
  if (!body || body.trim() === '') return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('comments').insert({
    ticket_id: ticketId,
    user_id: user.id,
    body: body.trim()
  })
  
  revalidatePath(`/ticket/${ticketId}`)
}
