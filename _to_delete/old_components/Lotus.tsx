const D = ['M32 4C26 14 26 26 32 34C38 26 38 14 32 4Z', 'M32 34C22 30 16 20 16 10C24 14 30 22 32 34Z', 'M32 34C42 30 48 20 48 10C40 14 34 22 32 34Z', 'M32 35C20 35 8 30 2 20C14 20 26 26 32 35Z', 'M32 35C44 35 56 30 62 20C50 20 38 26 32 35Z', 'M14 36.5h36v2.4H14z']

export function Lotus() {
  return (
    <svg viewBox="0 0 64 40" aria-hidden="true">
      <g fill="currentColor">{D.map((d) => <path key={d} d={d} />)}</g>
    </svg>
  )
}
