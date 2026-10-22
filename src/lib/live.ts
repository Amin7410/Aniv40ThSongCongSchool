/**
 * Trạng thái phát trực tiếp — dùng chung server & client (không import module server).
 */
export type LiveState = 'before' | 'live' | 'after'

export function liveState(ev: { startsAt?: string | null; liveMode?: string | null; liveHours?: number | null }, now = Date.now()): LiveState {
  if (ev.liveMode === 'on') return 'live'
  const start = ev.startsAt ? Date.parse(ev.startsAt) : NaN
  if (Number.isNaN(start)) return 'before'
  const openAt = start - 30 * 60_000
  const endAt = start + (ev.liveHours || 4) * 3_600_000
  if (ev.liveMode === 'off') return now < openAt ? 'before' : 'after'
  return now < openAt ? 'before' : now > endAt ? 'after' : 'live'
}

/** Chỉ cho phép nhúng YouTube (bản nocookie) hoặc Facebook. Mọi URL khác trả null. */
export function embedURL(u?: string | null): string | null {
  if (!u) return null
  let host = ''
  try {
    const url = new URL(u)
    if (url.protocol !== 'https:') return null
    host = url.hostname.replace(/^(www|m|web)\./, '')
  } catch {
    return null
  }
  if (host === 'youtube.com' || host === 'youtu.be') {
    const m = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,20})/.exec(u)
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&mute=1&playsinline=1` : null
  }
  if (host === 'facebook.com' && /^https:\/\/(www\.|m\.|web\.)?facebook\.com\/[\w./?=&%-]+$/.test(u))
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&autoplay=true&mute=true`
  return null
}

export const REACTIONS = ['tim', 'vo-tay', 'hoa', 'co', 'cam-dong', 'chuc-mung'] as const
export type Reaction = (typeof REACTIONS)[number]
export const REACTION_ICON: Record<Reaction, string> = {
  tim: '❤️',
  'vo-tay': '👏',
  hoa: '🌸',
  co: '🇻🇳',
  'cam-dong': '🥹',
  'chuc-mung': '🎉',
}
