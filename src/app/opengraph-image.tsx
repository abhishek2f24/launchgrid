import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'LaunchGrid — Launch Your Online Store in 15 Minutes'
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
          padding: '80px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Top label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#C8F56A',
            }}
          />
          <span
            style={{
              fontSize: '13px',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#888',
              fontFamily: 'sans-serif',
              fontWeight: 600,
            }}
          >
            India&apos;s D2C Platform
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 900,
            color: '#F8F8F2',
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span>Launch your</span>
          <span style={{ color: '#C8F56A' }}>online store</span>
          <span>in 15 minutes.</span>
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize: '20px',
            color: '#888',
            fontFamily: 'sans-serif',
            fontWeight: 400,
            marginBottom: '48px',
          }}
        >
          AI storefront · UPI + COD payments · 0% platform fee · 7-day free trial
        </div>

        {/* Pills row */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {['₹999 / mo', 'UPI Native', 'GST Ready', 'COD + OTP'].map((t) => (
            <div
              key={t}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '15px',
                color: '#ccc',
                fontFamily: 'sans-serif',
                fontWeight: 500,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Bottom brand */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            right: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#C8F56A',
              fontFamily: 'sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            LaunchGrid
          </span>
          <span style={{ fontSize: '18px', color: '#444', fontFamily: 'sans-serif' }}>
            launchgrid.in
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
