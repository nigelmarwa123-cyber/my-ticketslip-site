import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import '@/app/feed.css'

export default async function LeaderboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const tab = typeof searchParams.tab === 'string' ? searchParams.tab : 'win_rate'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch all profiles
  const { data: profiles } = await supabase.from('profiles').select('*')
  
  // Fetch all tickets to calculate win rates and streaks
  const { data: tickets } = await supabase.from('tickets').select('poster_id, status, kickoff_at').order('kickoff_at', { ascending: false })
  
  // Fetch all follows to calculate follower counts
  const { data: follows } = await supabase.from('follows').select('following_id')

  if (!profiles) return <div>No profiles found</div>

  // Aggregate stats per profile
  const stats = profiles.map(profile => {
    const userTickets = (tickets || []).filter(t => t.poster_id === profile.id)
    const resolved = userTickets.filter(t => t.status === 'won' || t.status === 'lost')
    const wonCount = resolved.filter(t => t.status === 'won').length
    const winRate = resolved.length > 0 ? (wonCount / resolved.length) * 100 : 0

    let streak = 0
    for (const t of userTickets) {
      if (t.status === 'won') {
        streak++
      } else if (t.status === 'lost' || t.status === 'pending') {
        break
      }
    }

    const followerCount = (follows || []).filter(f => f.following_id === profile.id).length

    return {
      profile,
      resolvedCount: resolved.length,
      winRate,
      streak,
      followerCount
    }
  })

  // Filter and sort based on tab
  let sortedStats = [...stats]
  if (tab === 'win_rate') {
    sortedStats = sortedStats.filter(s => s.resolvedCount >= 5).sort((a, b) => b.winRate - a.winRate)
  } else if (tab === 'streak') {
    sortedStats = sortedStats.filter(s => s.streak > 0).sort((a, b) => b.streak - a.streak)
  } else if (tab === 'followers') {
    sortedStats = sortedStats.sort((a, b) => b.followerCount - a.followerCount)
  }

  return (
    <div className="phone" style={{ background: 'var(--bg)' }}>
      <header className="feed-header">
        <div className="brand" style={{ justifyContent: 'center' }}>LEADERBOARD</div>
        <div className="tabs" style={{ justifyContent: 'space-between', padding: '0 20px' }}>
          <Link href="/leaderboard?tab=win_rate" className={`tab ${tab === 'win_rate' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Win Rate</Link>
          <Link href="/leaderboard?tab=streak" className={`tab ${tab === 'streak' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Streaks</Link>
          <Link href="/leaderboard?tab=followers" className={`tab ${tab === 'followers' ? 'active' : ''}`} style={{ textDecoration: 'none' }}>Followers</Link>
        </div>
      </header>

      {tab === 'win_rate' && (
        <div style={{ padding: '8px 16px', background: 'var(--bg-alt)', fontSize: '10px', color: 'var(--ink-dim)', textAlign: 'center', borderBottom: '1px solid var(--line)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Self-reported — not independently verified.
        </div>
      )}

      <div className="feed">
        {sortedStats.length === 0 ? (
          <div className="empty-hint text-center" style={{ textAlign: 'center', padding: '32px' }}>
            {tab === 'win_rate' ? 'No tipsters have reached 5 resolved tickets yet.' : 'No ranking data available.'}
          </div>
        ) : (
          sortedStats.map((stat, index) => {
            const initials = stat.profile.username ? stat.profile.username.substring(0, 2).toUpperCase() : '??'
            const avatarGradient = stat.profile.avatar_color 
              ? `linear-gradient(135deg, ${stat.profile.avatar_color}, #1E9E5A)`
              : 'linear-gradient(135deg, #3DDC84, #1E9E5A)'
              
            return (
              <Link key={stat.profile.id} href={`/profile/${stat.profile.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px', background: 'var(--bg-alt)', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ width: '24px', fontSize: '14px', fontWeight: 800, color: index < 3 ? '#FFB020' : 'var(--ink-dim)' }}>
                    #{index + 1}
                  </div>
                  <div className="avatar" style={{ background: avatarGradient, width: '40px', height: '40px', fontSize: '16px', margin: '0 12px' }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{stat.profile.username}</div>
                    <div style={{ fontSize: '12px', color: 'var(--ink-dim)' }}>
                      {tab === 'win_rate' && `${stat.resolvedCount} tickets resolved`}
                      {tab === 'streak' && 'Active winning streak'}
                      {tab === 'followers' && 'Total followers'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {tab === 'win_rate' && (
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--green)' }}>{Math.round(stat.winRate)}%</div>
                    )}
                    {tab === 'streak' && (
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#FFB020' }}>🔥 {stat.streak}W</div>
                    )}
                    {tab === 'followers' && (
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>{stat.followerCount}</div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      <div style={{ height: '80px' }} />

      <nav className="bottom-nav">
        <Link href="/" className="nav-item" style={{ textDecoration: 'none' }}>
          <span className="nav-icon">🏠</span>Feed
        </Link>
        <Link href="/leaderboard" className="nav-item active" style={{ textDecoration: 'none' }}>
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
