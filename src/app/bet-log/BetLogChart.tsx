'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function BetLogChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-dim)' }}>No data yet</div>
  }

  return (
    <div style={{ height: '200px', width: '100%', marginTop: '20px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D38" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#9A9DA8" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
          />
          <YAxis 
            stroke="#9A9DA8" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(value) => `R${value}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1B1E27', border: '1px solid #2A2D38', borderRadius: '8px' }}
            itemStyle={{ color: '#3DDC84', fontWeight: 'bold' }}
            labelStyle={{ color: '#9A9DA8', marginBottom: '4px' }}
          />
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="#3DDC84" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#14161C', stroke: '#3DDC84', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#3DDC84' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
