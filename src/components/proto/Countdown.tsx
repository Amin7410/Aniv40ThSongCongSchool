'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { I } from '@/lib/proto-svg'
import { Raw } from '../Raw'

/** Cụm đồng hồ cát và các ô đếm ngược (ngày, giờ, phút, giây). */
export function CountdownTimer({ startsAt, after }: { startsAt?: string | null; after?: boolean }) {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const first = setTimeout(() => setNow(Date.now()), 0)
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => {
      clearTimeout(first)
      clearInterval(t)
    }
  }, [])
  const end = startsAt ? Date.parse(startsAt) : NaN
  let ms = Number.isNaN(end) || now === null ? 0 : end - now
  const units = ([[864e5, 'ngày'], [36e5, 'giờ'], [6e4, 'phút'], [1e3, 'giây']] as const).map(([k, l]) => {
    const v = Math.floor(ms / k)
    ms -= v * k
    return [v, l] as const
  })

  return (
    <div className="cd-cluster" aria-label="Đếm ngược">
      <Hourglass />
      <div className="cd">
        {!Number.isNaN(end) && now !== null && end - now <= 0 ? (
          <div style={{ minWidth: 'auto', padding: '10px 16px' }}>
            <b style={{ fontSize: 24 }}>{after ? 'Đại lễ đã diễn ra' : 'Đại lễ đang diễn ra'}</b>
          </div>
        ) : (
          units.map(([v, l]) => (
            <div key={l}>
              <b>{now === null ? '--' : String(v).padStart(2, '0')}</b>
              <span>{l}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/** Dải đếm ngược Đại lễ (giống prototype). */
export function CountdownBand({ title, startsAt, place, liveUrl, after }: { title: string; startsAt?: string | null; place?: string | null; liveUrl?: string | null; after?: boolean }) {
  const end = startsAt ? Date.parse(startsAt) : NaN
  const when = Number.isNaN(end)
    ? ''
    : new Date(end).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' })
  return (
    <section className="cd-band">
      <div className="cd-in">
        <div>
          <h2>{title}</h2>
          <p>{when}{place ? `, ${place}` : ''}</p>
        </div>
        <CountdownTimer startsAt={startsAt} after={after} />
        <div className="cd-acts">
          <Link className="btn gold" href="/dai-le">Gửi lời chúc</Link>
          {liveUrl && (
            <a className="btn ghost" style={{ color: '#f6e7c8', borderColor: 'rgba(241,212,139,.5)' }} href={liveUrl} target="_blank" rel="noopener noreferrer">
              <Raw html={I.live} /> {after ? 'Xem lại buổi lễ' : 'Xem trực tiếp'}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

export function Hourglass() {
  return (
    <div className="cd-hourglass-badge" title="Đồng hồ cát đếm ngược Đại lễ" aria-hidden="true">
      <div className="cd-hourglass-rotor">
        <svg viewBox="0 0 56 72" className="cd-hourglass-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cdHgGold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fff5d0" />
              <stop offset="35%" stopColor="#d4ab55" />
              <stop offset="75%" stopColor="#9a7330" />
              <stop offset="100%" stopColor="#5c3f15" />
            </linearGradient>
            <linearGradient id="cdHgGoldLight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fffdf0" />
              <stop offset="50%" stopColor="#eed082" />
              <stop offset="100%" stopColor="#b98f3b" />
            </linearGradient>
            <linearGradient id="cdHgGlass" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="25%" stopColor="rgba(212,171,85,0.06)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="75%" stopColor="rgba(212,171,85,0.08)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.35)" />
            </linearGradient>
            <linearGradient id="cdHgSand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff1b8" />
              <stop offset="50%" stopColor="#e5be6b" />
              <stop offset="100%" stopColor="#a37626" />
            </linearGradient>
            <filter id="cdHgGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Top plate & bevel */}
          <rect x="7" y="4" width="42" height="5.5" rx="2" fill="url(#cdHgGold)" stroke="#3a1c0d" strokeWidth="0.5" />
          <path d="M 12 9.5 L 44 9.5 L 40 13 L 16 13 Z" fill="url(#cdHgGoldLight)" opacity="0.9" />
          <circle cx="11" cy="6.7" r="1.3" fill="#fff5d0" />
          <circle cx="45" cy="6.7" r="1.3" fill="#fff5d0" />
          <circle cx="28" cy="6.7" r="1.5" fill="#fff9e6" />

          {/* Bottom plate & bevel */}
          <path d="M 16 59 L 40 59 L 44 62.5 L 12 62.5 Z" fill="url(#cdHgGoldLight)" opacity="0.9" />
          <rect x="7" y="62.5" width="42" height="5.5" rx="2" fill="url(#cdHgGold)" stroke="#3a1c0d" strokeWidth="0.5" />
          <circle cx="11" cy="65.2" r="1.3" fill="#fff5d0" />
          <circle cx="45" cy="65.2" r="1.3" fill="#fff5d0" />
          <circle cx="28" cy="65.2" r="1.5" fill="#fff9e6" />

          {/* Side turned pillars */}
          <rect x="9.5" y="10" width="3" height="52" rx="1.5" fill="url(#cdHgGold)" />
          <circle cx="11" cy="22" r="2.2" fill="url(#cdHgGoldLight)" />
          <circle cx="11" cy="36" r="2.6" fill="url(#cdHgGoldLight)" />
          <circle cx="11" cy="50" r="2.2" fill="url(#cdHgGoldLight)" />

          <rect x="43.5" y="10" width="3" height="52" rx="1.5" fill="url(#cdHgGold)" />
          <circle cx="45" cy="22" r="2.2" fill="url(#cdHgGoldLight)" />
          <circle cx="45" cy="36" r="2.6" fill="url(#cdHgGoldLight)" />
          <circle cx="45" cy="50" r="2.2" fill="url(#cdHgGoldLight)" />

          {/* Glass bulbs outline */}
          <path
            d="M 16 13 C 16 26, 25 32, 25 36 C 25 40, 16 46, 16 59 L 40 59 C 40 46, 31 40, 31 36 C 31 32, 40 26, 40 13 Z"
            fill="url(#cdHgGlass)"
            stroke="rgba(241,212,139,0.75)"
            strokeWidth="1.2"
          />

          {/* Upper Sand Mound */}
          <path
            className="cd-hg-sand-top"
            d="M 18.5 20 C 20.5 29, 25.5 33.5, 27 35.5 L 29 35.5 C 30.5 33.5, 35.5 29, 37.5 20 Q 28 23.5 18.5 20 Z"
            fill="url(#cdHgSand)"
            filter="url(#cdHgGlow)"
          />

          {/* Trickling Sand Stream through waist */}
          <line
            className="cd-hg-sand-stream"
            x1="28"
            y1="35.5"
            x2="28"
            y2="55"
            stroke="#ffe9a0"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Sand Falling Particles */}
          <circle className="cd-hg-particle cd-p1" cx="28" cy="38" r="0.9" fill="#fff" />
          <circle className="cd-hg-particle cd-p2" cx="28" cy="44" r="1.1" fill="#ffe9a0" />
          <circle className="cd-hg-particle cd-p3" cx="28" cy="49" r="1.0" fill="#fff" />
          <circle className="cd-hg-particle cd-p4" cx="28" cy="53" r="1.2" fill="#ffe9a0" />

          {/* Lower Sand Mound gathering at bottom */}
          <path
            className="cd-hg-sand-bottom"
            d="M 19 59 Q 28 48 37 59 Z"
            fill="url(#cdHgSand)"
            filter="url(#cdHgGlow)"
          />

          {/* Center decorative golden waist ring */}
          <rect x="23" y="34.5" width="10" height="3" rx="1.5" fill="url(#cdHgGoldLight)" stroke="#4a2614" strokeWidth="0.5" />
          <circle cx="28" cy="36" r="1" fill="#fff" />

          {/* Specular glass reflection curves */}
          <path
            d="M 18 16 C 18.5 23, 23 28, 24 33"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M 18 56 C 18.5 49, 23 44, 24 39"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}
