'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/app/actions/profile'

export default function EditProfileModal({ initialUsername }: { initialUsername: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsOpen(false)
      }
    })
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--line)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
      >
        Edit Profile
      </button>
    )
  }

  return (
    <div style={{ background: 'var(--bg-alt)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fff' }}>Edit Profile</h3>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-dim)', cursor: 'pointer' }}>✕</button>
      </div>

      {error && <div style={{ color: '#FF4444', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--ink-dim)', marginBottom: '4px', fontWeight: 600 }}>Display Name</label>
          <input 
            type="text" 
            name="username" 
            defaultValue={initialUsername}
            required 
            minLength={3}
            maxLength={20}
            style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '8px', color: '#fff' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          style={{ width: '100%', padding: '12px', background: 'var(--green)', color: '#0C1410', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '8px', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  )
}
