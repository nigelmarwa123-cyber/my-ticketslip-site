import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BetLogForm from './BetLogForm'
import BetLogChart from './BetLogChart'
import '@/app/feed.css'

export default async function BetLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: entries } = await supabase
    .from('bet_log_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: true })

  const allEntries = entries || []

  // 1. Calculate top-level net profit
  const resolvedEntries = allEntries.filter(e => e.outcome === 'won' || e.outcome === 'lost')
  
  const totalReturn = resolvedEntries.filter(e => e.outcome === 'won').reduce((sum, e) => sum + (Number(e.return_amount) || 0), 0)
  const totalStakeResolved = resolvedEntries.reduce((sum, e) => sum + Number(e.stake_amount), 0)
  const netProfit = totalReturn - totalStakeResolved

  // 2. Prepare chart data (Cumulative Net Profit over time)
  let cumulativeProfit = 0
  const chartData = []
  
  // We need an initial zero point if they have resolved entries
  if (resolvedEntries.length > 0) {
    chartData.push({ date: 'Start', profit: 0 })
  }

  for (const entry of allEntries) {
    if (entry.outcome === 'won') {
      cumulativeProfit += (Number(entry.return_amount) || 0) - Number(entry.stake_amount)
      const d = new Date(entry.logged_at)
      chartData.push({ date: `${d.getMonth()+1}/${d.getDate()}`, profit: cumulativeProfit })
    } else if (entry.outcome === 'lost') {
      cumulativeProfit -= Number(entry.stake_amount)
      const d = new Date(entry.logged_at)
      chartData.push({ date: `${d.getMonth()+1}/${d.getDate()}`, profit: cumulativeProfit })
    }
  }

  // 3. Prepare reverse-chronological list for rendering
  const displayList = [...allEntries].reverse()

  return (
    <div className="phone" style={{ background: 'var(--bg)' }}>
      <header className="feed-header" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href={`/profile/${user.id}`} style={{ color: '#fff', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div className="brand">MY BET LOG</div>
      </header>

      <div style={{ padding: '24px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '13px', color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '8px' }}>Net Profit</div>
          <div style={{ fontSize: '42px', fontWeight: 800, color: netProfit >= 0 ? 'var(--green)' : '#C97C7C', letterSpacing: '-1px' }}>
            {netProfit >= 0 ? '+' : ''}R{netProfit.toFixed(2)}
          </div>
          <BetLogChart data={chartData} />
        </div>

        <BetLogForm />

        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Entry History</h3>
          
          {displayList.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--ink-dim)', padding: '24px' }}>No entries logged yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayList.map(entry => {
                const date = new Date(entry.logged_at)
                const dateStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                
                return (
                  <div key={entry.id} style={{ background: 'var(--bg-alt)', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--ink-dim)' }}>{dateStr}</div>
                      {entry.outcome === 'pending' && <span style={{ fontSize: '11px', background: '#3D424F', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Pending</span>}
                      {entry.outcome === 'won' && <span style={{ fontSize: '11px', background: 'var(--green)', color: '#0C1410', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>Won</span>}
                      {entry.outcome === 'lost' && <span style={{ fontSize: '11px', background: '#C97C7C', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>Lost</span>}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        {entry.note && <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{entry.note}</div>}
                        <div style={{ fontSize: '13px', color: 'var(--ink-dim)' }}>Stake: R{Number(entry.stake_amount).toFixed(2)}</div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        {entry.outcome === 'won' && (
                          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--green)' }}>
                            +R{(Number(entry.return_amount) - Number(entry.stake_amount)).toFixed(2)}
                          </div>
                        )}
                        {entry.outcome === 'lost' && (
                          <div style={{ fontSize: '16px', fontWeight: 800, color: '#C97C7C' }}>
                            -R{Number(entry.stake_amount).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ height: '80px' }} />
    </div>
  )
}
