'use client'
import { I } from '@/lib/proto-svg'
import { Raw } from '../Raw'

export function MusicAct({ title }: { title: string }) {
  return (
    <button className="act" onClick={() => window.dispatchEvent(new Event('ptt-music'))}>
      <Raw html={I.music} />
      <b>{title}</b>
      <span>Phát nhạc nền trong khi tham quan</span>
    </button>
  )
}
