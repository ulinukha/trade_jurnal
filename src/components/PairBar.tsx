import { PRESET_PAIRS } from '../types/journal'
import type { Trade } from '../types/journal'

interface PairBarProps {
  trades: Trade[]
  onAddTrade: (pair?: string) => void
}

export function PairBar({ trades, onAddTrade }: PairBarProps) {
  const presets = new Set<string>(PRESET_PAIRS)
  const extra = [
    ...new Set(trades.map((t) => t.pair).filter((p) => !presets.has(p))),
  ]

  const pairs = [...PRESET_PAIRS, ...extra]

  return (
    <section className="pair-bar">
      <span className="pair-bar-label">Monitored</span>
      <div className="pair-pills">
        {pairs.map((pair) => {
          const pending = trades.some(
            (t) => t.pair === pair && t.result === 'Pending',
          )
          const count = trades.filter((t) => t.pair === pair).length
          return (
            <button
              key={pair}
              type="button"
              className={`pair-pill ${pending ? 'live' : ''}`}
              onClick={() => onAddTrade(pair)}
            >
              <span className={`pair-dot ${pending ? 'on' : ''}`} />
              {pair}
              <span className="pair-pill-meta">
                {pending ? 'PENDING' : count > 0 ? `${count}` : 'READY'}
              </span>
            </button>
          )
        })}
      </div>
      <button
        type="button"
        className="btn primary pair-add"
        onClick={() => onAddTrade()}
      >
        + /trade
      </button>
    </section>
  )
}
