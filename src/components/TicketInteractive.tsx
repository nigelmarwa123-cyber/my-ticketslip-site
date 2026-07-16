'use client'

import { toggleFollow, toggleReaction, toggleFlag } from '@/app/actions/social'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function PreReactions({ 
  ticketId, 
  initialFireCount, 
  initialRiskyCount, 
  hasReactedFire, 
  hasReactedRisky,
  kickoffHasPassed
}: { 
  ticketId: string, 
  initialFireCount: number, 
  initialRiskyCount: number, 
  hasReactedFire: boolean, 
  hasReactedRisky: boolean,
  kickoffHasPassed: boolean
}) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  if (kickoffHasPassed) return null; // Reactions only allowed/shown pre-match

  return (
    <div className="pre-reactions">
      <button 
        className="reaction-btn" 
        onClick={(e) => { e.preventDefault(); startTransition(() => { toggleReaction(ticketId, 'fire', pathname) }) }}
        style={{ opacity: isPending ? 0.7 : 1, background: hasReactedFire ? '#3DDC84' : undefined, color: hasReactedFire ? '#0C1410' : undefined }}
      >
        🔥 I'm on this <span className="count" style={{ color: hasReactedFire ? '#0C1410' : undefined }}>{initialFireCount}</span>
      </button>
      <button 
        className="reaction-btn"
        onClick={(e) => { e.preventDefault(); startTransition(() => { toggleReaction(ticketId, 'risky', pathname) }) }}
        style={{ opacity: isPending ? 0.7 : 1, background: hasReactedRisky ? '#FFB020' : undefined, color: hasReactedRisky ? '#0C1410' : undefined }}
      >
        😬 Risky <span className="count" style={{ color: hasReactedRisky ? '#0C1410' : undefined }}>{initialRiskyCount}</span>
      </button>
    </div>
  )
}

export function TicketActionBar({
  ticketId,
  posterId,
  isOwnProfile,
  initialFlags,
  hasFlagged,
  isFollowing,
}: {
  ticketId: string,
  posterId: string,
  isOwnProfile: boolean,
  initialFlags: number,
  hasFlagged: boolean,
  isFollowing: boolean,
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleFlag = (e: React.MouseEvent) => {
    e.preventDefault()
    startTransition(() => { toggleFlag(ticketId, pathname) })
  }

  const handleFollow = (e: React.MouseEvent) => {
    e.preventDefault()
    startTransition(() => { toggleFollow(posterId, pathname) })
  }

  const isHeavilyFlagged = initialFlags >= 10

  return (
    <div className="actions">
      <button className="action" onClick={(e) => { e.preventDefault(); router.push(`/ticket/${ticketId}`) }}>
        💬 Comment
      </button>
      <button 
        className="action flag" 
        onClick={handleFlag}
        style={{ 
          opacity: isPending ? 0.7 : 1, 
          fontWeight: isHeavilyFlagged ? 800 : 600,
          color: hasFlagged ? '#FF4444' : '#C97C7C'
        }}
      >
        🚩 Flag {initialFlags > 0 ? initialFlags : ''}
      </button>
      
      {!isOwnProfile && (
        <button 
          className={`action ${isFollowing ? '' : 'follow'}`} 
          onClick={handleFollow}
          style={{ opacity: isPending ? 0.7 : 1 }}
        >
          {isFollowing ? '✓ Following' : '+ Follow'}
        </button>
      )}
    </div>
  )
}
