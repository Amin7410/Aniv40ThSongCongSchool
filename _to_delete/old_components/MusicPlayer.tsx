'use client'
import { useEffect, useRef, useState } from 'react'

/** Nhạc nền: không bao giờ tự phát; người xem bấm để nghe, trạng thái giữ khi chuyển trang. */
export function MusicPlayer({ src, title }: { src: string; title: string }) {
  const a = useRef<HTMLAudioElement | null>(null)
  const [on, setOn] = useState(false)
  useEffect(() => () => a.current?.pause(), [])
  const toggle = async () => {
    if (!a.current) {
      a.current = new Audio(src)
      a.current.loop = true
      a.current.volume = 0.6
    }
    if (on) {
      a.current.pause()
      setOn(false)
    } else {
      try {
        await a.current.play()
        setOn(true)
      } catch {}
    }
  }
  return (
    <button className="music" type="button" onClick={toggle} aria-pressed={on} aria-label={on ? `Tắt nhạc: ${title}` : `Phát nhạc: ${title}`}>
      <span aria-hidden="true">{on ? '❚❚' : '♪'}</span>
      <span className="music-t">{title}</span>
    </button>
  )
}
