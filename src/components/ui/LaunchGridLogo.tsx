/**
 * LaunchGridLogo — inline SVG logo mark + wordmark
 * Uses the icon mark directly so no external image request is needed.
 *
 * Props:
 *   size    — icon height in px (wordmark scales proportionally)
 *   variant — 'dark' (white text) | 'light' (dark text) | 'mark' (icon only)
 *   className — extra classes on the wrapper
 */

interface LaunchGridLogoProps {
  size?: number
  variant?: 'dark' | 'light' | 'mark'
  className?: string
}

/** The 2×2 grid icon mark as an inline SVG */
function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Top-left circle */}
      <circle cx="14" cy="14" r="11" fill="#84CC16" />

      {/* Bottom-left circle */}
      <circle cx="14" cy="42" r="11" fill="#84CC16" />

      {/* Bottom-right circle */}
      <circle cx="42" cy="42" r="11" fill="#84CC16" />

      {/* Top-right: cursor arrow + leaf */}
      <g transform="translate(32,4)">
        {/* Cursor pointer */}
        <path
          d="M0 0 L0 13 L3.5 10 L5.5 16 L8.5 14.5 L6.5 8.5 L12 8.5 Z"
          fill="#84CC16"
        />
        {/* Leaf */}
        <path
          d="M7 -2 C7 -2 18 2 14.5 10 C14.5 10 5 8 7 -2 Z"
          fill="#84CC16"
        />
      </g>
    </svg>
  )
}

export function LaunchGridLogo({
  size = 32,
  variant = 'dark',
  className = '',
}: LaunchGridLogoProps) {
  if (variant === 'mark') {
    return <LogoMark size={size} />
  }

  const textColor = variant === 'dark' ? '#FFFFFF' : '#0A0A0A'
  // Font size scales relative to icon height
  const fontSize = Math.round(size * 0.95)
  const gap = Math.round(size * 0.3)

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap }}
    >
      <LogoMark size={size} />
      <span
        style={{
          fontFamily: "'Geist', 'Inter', -apple-system, sans-serif",
          fontWeight: 800,
          fontSize,
          letterSpacing: '-0.03em',
          color: textColor,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        LaunchGrid
      </span>
    </span>
  )
}

export { LogoMark }
