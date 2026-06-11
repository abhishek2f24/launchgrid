import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'LaunchGrid Pricing — Start at ₹999/mo'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#050505',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'serif',
        }}
      >
        <div style={{ fontSize: '14px', letterSpacing: '0.2em', color: '#666', fontFamily: 'sans-serif', marginBottom: '20px', textTransform: 'uppercase' }}>
          Pricing
        </div>
        <div style={{ fontSize: '64px', fontWeight: 900, color: '#F8F8F2', lineHeight: 1.1, textAlign: 'center', marginBottom: '16px' }}>
          Start at ₹999/mo
        </div>
        <div style={{ fontSize: '22px', color: '#888', fontFamily: 'sans-serif', marginBottom: '48px', textAlign: 'center' }}>
          Starter · Growth · Scale — 7-day free trial on all plans
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { plan: 'Starter', price: '₹999' },
            { plan: 'Growth', price: '₹3,999' },
            { plan: 'Scale', price: '₹9,999' },
          ].map((p) => (
            <div
              key={p.plan}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '20px 32px',
                textAlign: 'center',
                fontFamily: 'sans-serif',
              }}
            >
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '6px' }}>{p.plan}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#C8F56A' }}>{p.price}</div>
              <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>/mo</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
