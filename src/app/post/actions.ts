'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function submitTicket(formData: FormData) {
  const supabase = await createClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // Extract form data
  const bookmaker = formData.get('bookmaker') as string
  const totalOdds = parseFloat(formData.get('totalOdds') as string)
  const kickoffAt = formData.get('kickoffAt') as string
  const note = formData.get('note') as string
  const imageUrl = formData.get('imageUrl') as string

  if (!bookmaker || !totalOdds || !kickoffAt || !imageUrl) {
    throw new Error('Missing required fields')
  }

  // Insert into database
  const { error: dbError } = await supabase.from('tickets').insert({
    poster_id: user.id,
    bookmaker,
    note: note || null,
    image_url: imageUrl,
    total_odds: totalOdds,
    kickoff_at: new Date(kickoffAt).toISOString(),
    status: 'pending',
    locked: true
  })

  if (dbError) {
    throw new Error(`Database error: ${dbError.message}`)
  }

  revalidatePath('/')
}
