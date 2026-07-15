import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TicketCard } from '@/components/TicketCard'
import './feed.css'

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

export default async function HomePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Default tab logic
  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', user.id)

  const hasFollowing = followingCount && followingCount > 0
  const tab = typeof searchParams.tab === 'string' ? searchParams.tab : (hasFollowing ? 'following' : 'global')
  const chip = typeof searchParams.chip === 'string' ? searchParams.chip : 'newest'

  // Query logic - fetching all related records embedded
  let query = supabase.from('tickets').select(`
    *,
    profiles(id, username, avatar_color),
    reactions(type, user_id),
    flags(user_id)
  `)

  // Get following IDs for both filtering and passing to TicketCard
  const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
  const followingIdsList = follows?.map(f => f.following_id) || []
  const followingIds = new Set(followingIdsList)

  if (tab === 'following') {
    if (followingIdsList.length > 0) {
      query = query.in('poster_id', followingIdsList)
    } else {
      query = query.eq('poster_id', '00000000-0000-0000-0000-000000000000') // Force empty
    }
  }

  if (chip === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else if (chip === 'kicking_off_soon') {
    query = query.gte('kickoff_at', new Date().toISOString()).order('kickoff_at', { ascending: true })
  } else if (chip === 'boldest') {
    query = query.order('total_odds', { ascending: false })
  } else if (chip === 'streaks') {
    // Placeholder: just show newest won tickets as fake streak data since engine isn't built
    query = query.eq('status', 'won').order('created_at', { ascending: false })
  }

  const { data: tickets, error } = await query

  if (error) {
    console.error('Error fetching tickets:', error)
  }

  return (
    <div className="phone">
      <header className="feed-header">
        <div className="brand"><span className="dot">●</span> TICKETSLIP</div>
        <div className="tabs">
          <Link href={`/?tab=following&chip=${chip}`} style={{ textDecoration: 'none' }} className={`tab ${tab === 'following' ? 'active' : ''}`}>Following</Link>
          <Link href={`/?tab=global&chip=${chip}`} style={{ textDecoration: 'none' }} className={`tab ${tab === 'global' ? 'active' : ''}`}>Global</Link>
        </div>
        <div className="subnav overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
          <Link href={`/?tab=${tab}&chip=streaks`} style={{ textDecoration: 'none' }} className={`chip ${chip === 'streaks' ? 'active' : ''}`}>🔥 Streaks</Link>
          <Link href={`/?tab=${tab}&chip=boldest`} style={{ textDecoration: 'none' }} className={`chip ${chip === 'boldest' ? 'active' : ''}`}>💪 Boldest picks</Link>
          <Link href={`/?tab=${tab}&chip=newest`} style={{ textDecoration: 'none' }} className={`chip ${chip === 'newest' ? 'active' : ''}`}>🆕 Newest</Link>
          <Link href={`/?tab=${tab}&chip=kicking_off_soon`} style={{ textDecoration: 'none' }} className={`chip ${chip === 'kicking_off_soon' ? 'active' : ''}`}>⏰ Kicking off soon</Link>
        </div>
      </header>

      <div className="feed">
        {!tickets || tickets.length === 0 ? (
          <div className="empty-hint text-center" style={{ textAlign: 'center', padding: '32px' }}>
            {tab === 'following' && !hasFollowing 
              ? "You aren't following anyone yet. Switch to Global to find tipsters!"
              : "No tickets found for this filter."}
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              currentUserId={user.id} 
              followingIds={followingIds} 
            />
          ))
        )}
      </div>

      <nav className="bottom-nav">
        <Link href="/" className="nav-item active" style={{ textDecoration: 'none' }}>
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
        <Link href={`/profile/${user.id}`} className="nav-item" style={{ textDecoration: 'none' }}>
          <span className="nav-icon">👤</span>Profile
        </Link>
      </nav>
    </div>
  )
}
