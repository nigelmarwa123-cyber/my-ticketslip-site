'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

const AVATAR_COLORS = ['#3DDC84', '#FFB020', '#C97C7C', '#8A8672', '#1E9E5A', '#FFE3CC', '#FCE8B0'];

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;

  if (!email || !password || !username) {
    redirect('/signup?error=Please fill in all fields')
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
  }

  if (data.user) {
    // Insert into profiles
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username: username,
      avatar_color: randomColor,
    })

    if (profileError) {
      redirect(`/signup?error=${encodeURIComponent(profileError.message)}`)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
