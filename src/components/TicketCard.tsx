import Link from 'next/link'
import { PreReactions, TicketActionBar } from './TicketInteractive'

function formatDate(dateString: string) {
  const d = new Date(dateString)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return `${days[d.getDay()]} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function timeAgo(dateString: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + "y"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + "mo"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + "d"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + "h"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + "m"
  return Math.floor(seconds) + "s"
}

export function TicketCard({ ticket, currentUserId, followingIds, streak }: { ticket: any, currentUserId: string, followingIds: Set<string>, streak?: number }) {
  const profile = Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles;
  const initials = profile?.username ? profile.username.substring(0, 2).toUpperCase() : '??'
  const avatarGradient = profile?.avatar_color 
    ? `linear-gradient(135deg, ${profile.avatar_color}, #1E9E5A)`
    : 'linear-gradient(135deg, #3DDC84, #1E9E5A)'
    
  const isOwnProfile = profile?.id === currentUserId
  const isFollowing = followingIds.has(profile?.id)

  const reactions = ticket.reactions || []
  const flags = ticket.flags || []
  
  const fireCount = reactions.filter((r: any) => r.type === 'fire').length
  const riskyCount = reactions.filter((r: any) => r.type === 'risky').length
  const hasReactedFire = reactions.some((r: any) => r.type === 'fire' && r.user_id === currentUserId)
  const hasReactedRisky = reactions.some((r: any) => r.type === 'risky' && r.user_id === currentUserId)
  const hasFlagged = flags.some((f: any) => f.user_id === currentUserId)

  const kickoffPassed = new Date(ticket.kickoff_at) < new Date()

  return (
    <div className="ticket">
      <div className="t-top">
        <Link href={`/profile/${profile?.id}`} className="poster" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="avatar" style={{ background: avatarGradient }}>
            {initials}
          </div>
          <div>
            <div className="poster-name">{profile?.username || 'Unknown User'}</div>
            <div className="poster-meta">
              New user · <span className="self-reported">self-reported</span>
            </div>
          </div>
        </Link>
        <div className="platform-badge">{ticket.bookmaker}</div>
      </div>
      
      <div style={{ padding: '0 18px 10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        {ticket.status === 'won' && <span className="status-won">✓ Won</span>}
        {ticket.status === 'lost' && <span className="status-lost">✗ Lost</span>}
        {ticket.status === 'pending' && <span className="status-pending">⏳ Pending — kicks off {formatDate(ticket.kickoff_at)}</span>}
        
        {streak && streak >= 2 && ticket.status === 'won' && (
          <span className="streak-badge">🔥 {streak}W streak</span>
        )}
      </div>
      
      <div className="perforation"></div>
      
      <Link href={`/ticket/${ticket.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <div className="t-body">
          {ticket.note && <div className="t-note" style={{ marginBottom: '10px', fontWeight: 600 }}>{ticket.note}</div>}
          
          {ticket.image_url && (
            <img 
              className="t-image" 
              src={ticket.image_url} 
              alt="ticket screenshot" 
            />
          )}
          
          <PreReactions 
            ticketId={ticket.id}
            initialFireCount={fireCount}
            initialRiskyCount={riskyCount}
            hasReactedFire={hasReactedFire}
            hasReactedRisky={hasReactedRisky}
            kickoffHasPassed={kickoffPassed}
          />
          
          <div className="t-footer">
            <div className="odds-block">
              <div className="odds-label">Total Odds</div>
              <div className="odds-value">{ticket.total_odds}</div>
            </div>
            <div className="stake-tag">Single</div>
          </div>
        </div>
      </Link>
      
      <div className="timestamp" style={{ padding: '0 18px 10px' }}>
        Posted {timeAgo(ticket.created_at)} ago · {formatDate(ticket.kickoff_at)}
      </div>
      
      <TicketActionBar 
        ticketId={ticket.id}
        posterId={profile?.id}
        isOwnProfile={isOwnProfile}
        initialFlags={flags.length}
        hasFlagged={hasFlagged}
        isFollowing={isFollowing}
      />
    </div>
  )
}
