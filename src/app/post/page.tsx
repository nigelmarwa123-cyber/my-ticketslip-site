'use client'

import { useState, useRef, Suspense } from 'react'
import { submitTicket } from './actions'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ImagePlus, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import '@/app/feed.css'
function PostForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const [preview, setPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  const handleClearImage = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const formElement = e.currentTarget
      const formData = new FormData(formElement)
      const file = formData.get('screenshot') as File
      
      if (!file || file.size === 0) {
        router.push('/post?error=Please select an image')
        setIsSubmitting(false)
        return
      }

      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tickets')
        .upload(fileName, file)
        
      if (uploadError) {
        router.push(`/post?error=Upload failed: ${encodeURIComponent(uploadError.message)}`)
        setIsSubmitting(false)
        return
      }
      
      const { data: publicUrlData } = supabase.storage
        .from('tickets')
        .getPublicUrl(uploadData.path)
        
      formData.delete('screenshot')
      formData.append('imageUrl', publicUrlData.publicUrl)
      
      await submitTicket(formData)
    } catch (err: any) {
      router.push(`/post?error=Submission failed: ${encodeURIComponent(err.message || 'Unknown error')}`)
      setIsSubmitting(false)
      return
    }

    router.push('/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 bg-[#C97C7C]/20 text-[#C97C7C] border border-[#C97C7C]/30 rounded text-sm text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-[#9A9DA8]">Screenshot (Required)</label>
        
        <div className="relative">
          {/* Always keep the input mounted outside the conditional to preserve the selected file */}
          <input
            ref={fileInputRef}
            id="screenshot"
            type="file"
            name="screenshot"
            accept="image/*"
            onChange={handleImageChange}
            required
            className="hidden"
          />
          {!preview ? (
            <label htmlFor="screenshot" className="border-2 border-dashed border-[#2A2D38] bg-[#1B1E27] rounded-xl flex flex-col items-center justify-center p-8 cursor-pointer hover:border-[#3DDC84] transition-colors min-h-[160px]">
              <ImagePlus className="text-[#9A9DA8] mb-2" size={32} />
              <span className="text-sm text-[#9A9DA8]">Tap to upload bet slip</span>
            </label>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-[#2A2D38]">
              <img src={preview} alt="Preview" className="w-full h-auto object-cover max-h-[300px]" />
              <button
                type="button"
                onClick={handleClearImage}
                className="absolute top-2 right-2 bg-[#14161C]/80 text-white p-2 rounded-full hover:bg-red-500/80 transition"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="bookmaker" className="text-sm font-semibold text-[#9A9DA8]">Bookmaker</label>
        <input
          id="bookmaker"
          name="bookmaker"
          type="text"
          required
          className="p-3 bg-[#1B1E27] border border-[#2A2D38] rounded-xl focus:outline-none focus:border-[#3DDC84] text-[#EDEDEF]"
          placeholder="e.g. Betway, Hollywoodbets"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="totalOdds" className="text-sm font-semibold text-[#9A9DA8]">Total Odds</label>
        <input
          id="totalOdds"
          name="totalOdds"
          type="number"
          step="0.01"
          required
          className="p-3 bg-[#1B1E27] border border-[#2A2D38] rounded-xl focus:outline-none focus:border-[#3DDC84] text-[#EDEDEF] font-mono text-lg"
          placeholder="0.00"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="kickoffAt" className="text-sm font-semibold text-[#9A9DA8]">Kickoff Date & Time</label>
        <input
          id="kickoffAt"
          name="kickoffAt"
          type="datetime-local"
          required
          className="p-3 bg-[#1B1E27] border border-[#2A2D38] rounded-xl focus:outline-none focus:border-[#3DDC84] text-[#EDEDEF]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="note" className="text-sm font-semibold text-[#9A9DA8]">Note (Optional)</label>
        <textarea
          id="note"
          name="note"
          rows={3}
          className="p-3 bg-[#1B1E27] border border-[#2A2D38] rounded-xl focus:outline-none focus:border-[#3DDC84] text-[#EDEDEF] resize-none"
          placeholder="Any reasoning for this pick?"
        ></textarea>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-4 w-full p-4 bg-[#3DDC84] text-[#0C1410] font-bold rounded-xl hover:bg-[#3DDC84]/90 transition-colors disabled:opacity-50 flex items-center justify-center"
      >
        {isSubmitting ? 'Posting...' : 'Post Ticket'}
      </button>
    </form>
  )
}

export default function PostTicketPage() {
  return (
    <div className="phone">
      <header className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '20px' }}>
          <X size={24} />
        </Link>
        <div className="brand">NEW TICKET</div>
      </header>

      <main className="p-4">
        <Suspense fallback={<div className="text-center mt-8">Loading form...</div>}>
          <PostForm />
        </Suspense>
      </main>
      
      <div style={{ height: '80px' }} />

      <nav className="bottom-nav">
        <Link href="/" className="nav-item" style={{ textDecoration: 'none' }}>
          <span className="nav-icon">🏠</span>Feed
        </Link>
        <Link href="/leaderboard" className="nav-item" style={{ textDecoration: 'none' }}>
          <span className="nav-icon">🏆</span>Ranks
        </Link>
        <Link href="/post" className="post-fab" style={{ textDecoration: 'none' }}>
          +
        </Link>
        <Link href="/alerts" className="nav-item" style={{ textDecoration: 'none' }}>
          <span className="nav-icon">🔔</span>Alerts
        </Link>
        <Link href="/profile" className="nav-item" style={{ textDecoration: 'none' }}>
          <span className="nav-icon">👤</span>Profile
        </Link>
      </nav>
    </div>
  )
}
