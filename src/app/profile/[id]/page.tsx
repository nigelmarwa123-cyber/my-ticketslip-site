import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TicketCard } from '@/components/TicketCard'
import { toggleFollow } from '@/app/actions/social'
import EditProfileModal from '../EditProfileModal'
import '@/app/feed.css' // Reuse feed css

export default async function ProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const profileId = params.id

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the target profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single()

  if (!profile) {
    return <div className="phone" style={{ padding: '20px', color: '#fff' }}>Profile not found</div>
  }

  // Fetch Follow counts
  const { count: followerCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profileId)
  const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profileId)

  // Determine if current user follows this profile
  const { data: currentFollow } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', profileId)
    .maybeSingle()
  const isFollowing = !!currentFollow

  // Fetch all tickets for this user
  const { data: tickets } = await supabase
    .from('tickets')
    .select(`
      *,
      profiles(id, username, avatar_color),
      reactions(type, user_id),
      flags(user_id)
    `)
    .eq('poster_id', profileId)
    .order('created_at', { ascending: false })

  const userTickets = tickets || []

  // Compute Win Rate
  const resolvedTickets = userTickets.filter(t => t.status === 'won' || t.status === 'lost')
  const wonTickets = resolvedTickets.filter(t => t.status === 'won').length
  const winRate = resolvedTickets.length > 0 ? Math.round((wonTickets / resolvedTickets.length) * 100) : 0

  // Compute Streak
  // Streak is counted backwards through tickets ordered by kickoff_at descending
  let streak = 0
  const timeOrderedTickets = [...userTickets].sort((a, b) => new Date(b.kickoff_at).getTime() - new Date(a.kickoff_at).getTime())
  
  for (const t of timeOrderedTickets) {
    if (t.status === 'won') {
      streak++
    } else if (t.status === 'lost' || t.status === 'pending') {
      break
    }
  }

  const isOwnProfile = user.id === profileId
  const avatarGradient = profile.avatar_color 
    ? `linear-gradient(135deg, ${profile.avatar_color}, #1E9E5A)`
    : 'linear-gradient(135deg, #3DDC84, #1E9E5A)'
  const initials = profile.username ? profile.username.substring(0, 2).toUpperCase() : '??'

  // Current user's following list (to pass to TicketCards)
  const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
  const followingIds = new Set(follows?.map(f => f.following_id) || [])

  return (
    <div className="phone">
      <header className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div className="brand">{profile.username}</div>
      </header>

      <div style={{ padding: '24px 20px', background: 'var(--bg-alt)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="avatar" style={{ background: avatarGradient, width: '72px', height: '72px', fontSize: '28px' }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>{profile.username}</div>
                <div style={{ fontSize: '13px', color: 'var(--ink-dim)', marginTop: '4px' }}>
                  <strong style={{ color: '#fff' }}>{followerCount || 0}</strong> Followers &middot; <strong style={{ color: '#fff' }}>{followingCount || 0}</strong> Following
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <div style={{ flex: 1, background: 'var(--bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: '11px', color: 'var(--ink-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Win Rate</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{resolvedTickets.length > 0 ? `${winRate}%` : '--'}</div>
            <div style={{ fontSize: '10px', color: '#8A8672', marginTop: '4px', textTransform: 'uppercase' }}>self-reported</div>
          </div>
          {streak >= 2 && (
            <div style={{ flex: 1, background: 'var(--bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Current Streak</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#FFB020', marginTop: '4px' }}>🔥 {streak}W</div>
              <div style={{ fontSize: '10px', color: '#8A8672', marginTop: '4px', textTransform: 'uppercase' }}>active</div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexDirection: 'column' }}>
          {isOwnProfile ? (
            <>
              <EditProfileModal initialUsername={profile.username} />
              <Link href="/bet-log" style={{ display: 'block', width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--green)', color: '#0C1410', border: 'none', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>📊 My Bet Log</Link>
            </>
          ) : (
            <form action={async () => {
              'use server';
              await toggleFollow(profileId, `/profile/${profileId}`);
            }}>
              <button type="submit" style={{ width: '100%', padding: '10px', borderRadius: '8px', background: isFollowing ? 'var(--line)' : 'var(--green)', color: isFollowing ? '#fff' : '#0C1410', border: 'none', fontWeight: 600 }}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="feed">
        {userTickets.length === 0 ? (
          <div className="empty-hint text-center" style={{ textAlign: 'center', padding: '32px' }}>
            No tickets posted yet.
          </div>
        ) : (
          userTickets.map(ticket => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              currentUserId={user.id} 
              followingIds={followingIds} 
            />
          ))
        )}
      </div>
      
      {/* Spacer for bottom nav */}
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
        <Link href={`/profile/${user.id}`} className="nav-item active" style={{ textDecoration: 'none' }}>
          <span className="nav-icon">👤</span>Profile
        </Link>
      </nav>
    </div>
  )
}
