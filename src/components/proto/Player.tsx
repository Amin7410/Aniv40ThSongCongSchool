'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { I } from '@/lib/proto-svg'
import { Raw } from '../Raw'

/**
 * Nút nhạc nền cố định góc phải dưới (như prototype). Có tệp nhạc thì phát tệp;
 * chưa có thì phát giai điệu tổng hợp (WebAudio) của prototype. Không bao giờ tự phát.
 * Các nơi khác bật/tắt bằng sự kiện `window.dispatchEvent(new Event('ptt-music'))`.
 */
const MEL = [0, 2, 4, 7, 4, 2, 0, -1, 0, 4, 7, 9, 7, 4, 2, -1, 2, 4, 7, 9, 12, 9, 7, 4, 2, 0, 2, 4, 0, -1, -1, -1]
const BASS = [0, 0, 9, 9, 5, 5, 7, 7]

export function Player({ src, title }: { src?: string | null; title: string }) {
  const [on, setOn] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const ctx = useRef<AudioContext | null>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const st = useRef({ next: 0, step: 0 })

  const tone = (f: number, t: number, d: number, type: OscillatorType, v: number) => {
    const c = ctx.current!
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.value = f
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(v, t + 0.04)
    g.gain.exponentialRampToValueAtTime(0.0005, t + d)
    o.connect(g)
    g.connect(c.destination)
    o.start(t)
    o.stop(t + d + 0.05)
  }
  const sched = () => {
    const c = ctx.current!
    const beat = 0.42
    while (st.current.next < c.currentTime + 0.35) {
      const i = st.current.step % MEL.length
      const n = MEL[i]
      if (n >= 0) tone(392 * Math.pow(2, n / 12), st.current.next, beat * 1.8, 'sine', 0.07)
      if (i % 4 === 0) tone(98 * Math.pow(2, BASS[(i / 4) % 8] / 12), st.current.next, beat * 3.6, 'triangle', 0.05)
      st.current.next += beat
      st.current.step++
    }
  }
  const stop = useCallback(() => {
    audio.current?.pause()
    if (timer.current) clearInterval(timer.current)
    setOn(false)
  }, [])
  const start = useCallback(async () => {
    if (src) {
      if (!audio.current) {
        audio.current = new Audio(src)
        audio.current.loop = true
      }
      try {
        await audio.current.play()
        setOn(true)
      } catch {}
      return
    }
    try {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!ctx.current) ctx.current = new C()
      await ctx.current.resume()
      st.current.next = ctx.current.currentTime + 0.1
      timer.current = setInterval(sched, 100)
      setOn(true)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])
  const toggle = useCallback(() => (on ? stop() : void start()), [on, start, stop])

  useEffect(() => {
    const h = () => toggle()
    window.addEventListener('ptt-music', h)
    return () => window.removeEventListener('ptt-music', h)
  }, [toggle])
  useEffect(() => () => stop(), [stop])

  return (
    <div className={`player${on ? ' on' : ''}`}>
      <button onClick={toggle} aria-label={on ? 'Tạm dừng nhạc nền' : 'Phát nhạc nền'}>
        <Raw html={on ? I.pause : I.play} />
      </button>
      <span className="eq" aria-hidden="true"><i /><i /><i /></span>
      <span id="playTitle">{title}</span>
    </div>
  )
}
