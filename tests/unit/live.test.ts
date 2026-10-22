import { describe, expect, it } from 'vitest'
import { embedURL, liveState } from '@/lib/live'

const start = Date.parse('2026-11-20T00:30:00Z') // 07:30 giờ VN

describe('liveState', () => {
  it('trước, trong, sau lễ', () => {
    expect(liveState({ startsAt: '2026-11-20T00:30:00Z' }, start - 31 * 60e3)).toBe('before')
    expect(liveState({ startsAt: '2026-11-20T00:30:00Z' }, start - 29 * 60e3)).toBe('live')
    expect(liveState({ startsAt: '2026-11-20T00:30:00Z', liveHours: 4 }, start + 4.1 * 36e5)).toBe('after')
  })
  it('chế độ bật/tắt tay', () => {
    expect(liveState({ startsAt: '2026-11-20T00:30:00Z', liveMode: 'on' }, 0)).toBe('live')
    expect(liveState({ startsAt: '2026-11-20T00:30:00Z', liveMode: 'off' }, start)).toBe('after')
  })
})

describe('embedURL', () => {
  it('YouTube → nocookie', () => {
    expect(embedURL('https://www.youtube.com/watch?v=abcDEF12345')).toBe('https://www.youtube-nocookie.com/embed/abcDEF12345?autoplay=1&mute=1&playsinline=1')
    expect(embedURL('https://youtu.be/abcDEF12345')).toContain('/embed/abcDEF12345')
    expect(embedURL('https://www.youtube.com/live/abcDEF12345')).toContain('/embed/abcDEF12345')
  })
  it('Facebook', () => expect(embedURL('https://www.facebook.com/thptsongcong/videos/123')).toContain('facebook.com/plugins/video.php?href=https%3A%2F%2F'))
  it('chặn nguồn lạ và javascript:', () => {
    expect(embedURL('javascript:alert(1)')).toBeNull()
    expect(embedURL('https://evil.com/?youtube.com/watch?v=abcdef')).toBeNull()
    expect(embedURL('https://www.facebook.com/x"onload="alert(1)')).toBeNull()
  })
})
