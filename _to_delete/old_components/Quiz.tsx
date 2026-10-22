'use client'
import { useState } from 'react'

type Q = { q: string; a: string[]; c: number; e: string }

export function Quiz({ qs }: { qs: Q[] }) {
  const [i, setI] = useState(0)
  const [pick, setPick] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  if (i >= qs.length)
    return (
      <div className="box">
        <h2>Bạn trả lời đúng {score}/{qs.length} câu</h2>
        <button className="btn" onClick={() => { setI(0); setScore(0); setPick(null) }}>Chơi lại</button>
      </div>
    )
  const q = qs[i]
  return (
    <div className="box form">
      <p className="meta">Câu {i + 1}/{qs.length}</p>
      <h2>{q.q}</h2>
      {q.a.map((a, k) => (
        <button
          key={k}
          className={`btn ${pick === null ? 'ghost' : k === q.c ? '' : 'ghost'}`}
          style={pick !== null && k === pick && k !== q.c ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : undefined}
          disabled={pick !== null}
          onClick={() => { setPick(k); if (k === q.c) setScore((s) => s + 1) }}
        >
          {a}
        </button>
      ))}
      <div role="status" aria-live="polite">
        {pick !== null && (
          <>
            <p className={pick === q.c ? 'okmsg' : 'errmsg'}>{pick === q.c ? 'Chính xác!' : 'Chưa đúng.'} {q.e}</p>
            <button className="btn" onClick={() => { setI(i + 1); setPick(null) }}>{i + 1 < qs.length ? 'Câu tiếp' : 'Xem kết quả'}</button>
          </>
        )}
      </div>
    </div>
  )
}
