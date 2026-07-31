'use client'

import { useEffect, useState } from 'react'

function useCountdown(endAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!endAt) return
    const end = new Date(endAt).getTime()
    const tick = () => setRemaining(Math.max(0, end - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endAt])

  return remaining
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return days > 0
    ? `${days}d ${pad(hours)}h ${pad(minutes)}m`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

export function AnnouncementBar({ text, countdownAt }: { text: string; countdownAt: string | null }) {
  const remaining = useCountdown(countdownAt)

  if (countdownAt && remaining === 0) return null

  return (
    <div
      className="w-full py-2 text-center text-sm font-bold flex items-center justify-center gap-2 flex-wrap px-4"
      style={{ background: 'var(--accent-primary)', color: '#fff' }}
    >
      <span>{text}</span>
      {countdownAt && remaining !== null && (
        <span className="font-mono bg-white/20 px-2 py-0.5 rounded-md text-xs tabular-nums">
          {formatDuration(remaining)}
        </span>
      )}
    </div>
  )
}
