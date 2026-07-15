'use client'

import { useState, useTransition } from 'react'
import { addBetLogEntry } from '@/app/actions/bet-log'

export default function BetLogForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [outcome, setOutcome] = useState('pending')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const result = await addBetLogEntry(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsOpen(false)
        setOutcome('pending')
      }
    })
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{ width: '100%', padding: '16px', background: 'var(--green)', color: '#0C1410', borderRadius: '12px', fontWeight: 800, border: 'none', cursor: 'pointer', marginBottom: '24px' }}
      >
        + Log a bet
      </button>
    )
  }

  return (
    <div style={{ background: 'var(--bg-alt)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Log New Bet</h3>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-dim)', cursor: 'pointer' }}>✕</button>
      </div>

      {error && <div style={{ color: '#FF4444', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--ink-dim)', marginBottom: '4px', fontWeight: 600 }}>Stake Amount</label>
          <input 
            type="number" 
            step="0.01"
            name="stakeAmount" 
            required 
            style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '8px', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--ink-dim)', marginBottom: '4px', fontWeight: 600 }}>Outcome</label>
          <select 
            name="outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '8px', color: '#fff' }}
          >
            <option value="pending">Pending</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        {outcome === 'won' && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--ink-dim)', marginBottom: '4px', fontWeight: 600 }}>Return Amount</label>
            <input 
              type="number" 
              step="0.01"
              name="returnAmount" 
              required 
              style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '8px', color: '#fff' }}
            />
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--ink-dim)', marginBottom: '4px', fontWeight: 600 }}>Logged At</label>
          <input 
            type="datetime-local" 
            name="loggedAt"
            defaultValue={new Date().toISOString().slice(0, 16)}
            style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '8px', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--ink-dim)', marginBottom: '4px', fontWeight: 600 }}>Note (Optional)</label>
          <input 
            type="text" 
            name="note" 
            placeholder="e.g. NBA Parlay"
            style={{ width: '100%', padding: '10px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '8px', color: '#fff' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          style={{ width: '100%', padding: '12px', background: 'var(--green)', color: '#0C1410', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: '8px', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? 'Logging...' : 'Save Log'}
        </button>
      </form>
    </div>
  )
}
