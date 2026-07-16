import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TicketCard } from '@/components/TicketCard'
import { addComment, updateTicketStatus } from '@/app/actions/ticket'
import '@/app/feed.css'

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

export default async function TicketDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const ticketId = params.id
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: ticket } = await supabase
    .from('tickets')
    .select(`
      *,
      profiles(id, username, avatar_color),
      reactions(type, user_id),
      flags(user_id)
    `)
    .eq('id', ticketId)
    .single()
    
  if (!ticket) return <div className="phone" style={{ padding: '20px', color: '#fff' }}>Ticket not found</div>

  const { data: comments } = await supabase
    .from('comments')
    .select('*, profiles(id, username, avatar_color)')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id)
  const followingIds = new Set(follows?.map(f => f.following_id) || [])

  const kickoffPassed = new Date(ticket.kickoff_at) < new Date()
  const isPoster = ticket.poster_id === user.id
  const canUpdateStatus = isPoster && kickoffPassed && ticket.status === 'pending'

  return (
    <div className="phone" style={{ background: 'var(--bg-alt)' }}>
      <header className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div className="brand">TICKET DETAIL</div>
      </header>

      <div style={{ padding: '16px' }}>
        <TicketCard ticket={ticket} currentUserId={user.id} followingIds={followingIds} />
      </div>

      {canUpdateStatus && (
        <div style={{ margin: '0 16px 16px', padding: '16px', background: 'var(--bg)', border: '1px solid var(--amber)', borderRadius: '12px' }}>
          <div style={{ fontWeight: 600, color: '#fff', marginBottom: '12px', fontSize: '14px', textAlign: 'center' }}>
            Match kicked off! What was the result?
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <form action={updateTicketStatus.bind(null, ticketId, 'won') as any} style={{ flex: 1 }}>
              <button style={{ width: '100%', padding: '12px', background: 'var(--green)', color: '#0C1410', fontWeight: 700, border: 'none', borderRadius: '8px' }}>✓ Mark as Won</button>
            </form>
            <form action={updateTicketStatus.bind(null, ticketId, 'lost') as any} style={{ flex: 1 }}>
              <button style={{ width: '100%', padding: '12px', background: '#C97C7C', color: '#fff', fontWeight: 700, border: 'none', borderRadius: '8px' }}>✗ Mark as Lost</button>
            </form>
          </div>
        </div>
      )}

      <div style={{ padding: '16px', background: 'var(--bg)', minHeight: '300px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--ink-dim)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Comments</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {(!comments || comments.length === 0) ? (
            <div style={{ color: 'var(--ink-dim)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>No comments yet. Be the first!</div>
          ) : (
            comments.map(comment => {
              const profile = Array.isArray(comment.profiles) ? comment.profiles[0] : comment.profiles;
              const initials = profile?.username ? profile.username.substring(0, 2).toUpperCase() : '??'
              const avatarGradient = profile?.avatar_color 
                ? `linear-gradient(135deg, ${profile.avatar_color}, #1E9E5A)`
                : 'linear-gradient(135deg, #3DDC84, #1E9E5A)'
              
              return (
                <div key={comment.id} style={{ display: 'flex', gap: '12px' }}>
                  <div className="avatar" style={{ background: avatarGradient, width: '32px', height: '32px', fontSize: '12px', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#fff', fontSize: '13px' }}>{profile?.username}</span>
                      <span style={{ fontSize: '10px', color: 'var(--ink-dim)' }}>{timeAgo(comment.created_at)} ago</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--ink)', lineHeight: 1.5 }}>{comment.body}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <form action={addComment.bind(null, ticketId)} style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            name="body" 
            placeholder="Add a comment..." 
            required
            style={{ flex: 1, padding: '12px', borderRadius: '24px', background: 'var(--bg-alt)', border: '1px solid var(--line)', color: '#fff', fontSize: '13px' }}
          />
          <button type="submit" style={{ padding: '0 20px', borderRadius: '24px', background: 'var(--green)', color: '#0C1410', fontWeight: 600, border: 'none' }}>
            Post
          </button>
        </form>
      </div>
      
      <div style={{ height: '80px', background: 'var(--bg)' }} />
    </div>
  )
}
