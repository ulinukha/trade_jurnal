import { format } from 'date-fns'
import type { Trade } from '../types/journal'
import { SESSION_LABELS } from '../types/journal'
import { formatCurrency, formatPnL, formatPrice } from '../utils/calc'

interface TradeHistoryProps {
  trades: Trade[]
  selectedDate: string
  selectedTradeId?: string | null
  onSelect: (trade: Trade) => void
  onAdd: () => void
}

function openTime(trade: Trade) {
  if (!trade.createdAt) return trade.date
  return `${trade.date} ${format(new Date(trade.createdAt), 'HH:mm')}`
}

function IconHistory() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      {/* Counter-clockwise history arrow */}
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12a9 9 0 1 0 3-6.7"
      />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 4v5h5"
      />
      {/* Clock hands */}
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7v5l3 2"
      />
    </svg>
  )
}

export function TradeHistory({
  trades,
  selectedDate,
  selectedTradeId,
  onSelect,
  onAdd,
}: TradeHistoryProps) {
  const dayTrades = trades.filter((t) => t.date === selectedDate)
  const rows = dayTrades.length > 0 ? dayTrades : trades
  const showingDay = dayTrades.length > 0
  const net = rows.reduce((sum, t) => sum + t.profit, 0)

  return (
    <section className="panel history-panel">
      <div className="panel-header history-head">
        <div className="history-title-row">
          <span className="history-icon" aria-hidden>
            <IconHistory />
          </span>
          <div>
            <h2>Executed trade history & outcomes</h2>
            <p className="hint">
              {showingDay
                ? `Filtered by ${selectedDate}`
                : 'Realized setups record — click a calendar date to filter'}
            </p>
          </div>
        </div>
        <div className="history-tools">
          <div className="history-chip purple">
            <strong>{rows.length}</strong>
            <span>Trades</span>
          </div>
          <div className={`history-chip ${net >= 0 ? 'teal' : 'rose'}`}>
            <strong>{formatPnL(net)}</strong>
            <span>USD</span>
          </div>
          <button type="button" className="btn primary" onClick={onAdd}>
            + /trade
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="empty">No trades yet. Open /trade to log one.</p>
      ) : (
        <div className="trade-table-wrap">
          <table className="trade-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Time open</th>
                <th>Type</th>
                <th>Entry</th>
                <th>Lot</th>
                <th>Exit</th>
                <th>Status</th>
                <th>Result</th>
                <th>Profit ($)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((trade) => {
                const open = trade.result === 'Pending'
                return (
                  <tr
                    key={trade.id}
                    className={trade.id === selectedTradeId ? 'selected' : ''}
                    title={`${SESSION_LABELS[trade.session]} · ${trade.reason}`}
                    onClick={() => onSelect(trade)}
                  >
                    <td>
                      <strong>{trade.pair}</strong>
                    </td>
                    <td className="mono muted">{openTime(trade)}</td>
                    <td>
                      <span className={`side-tag ${trade.side}`}>
                        {trade.side === 'buy' ? 'BUY' : 'SELL'}
                      </span>
                    </td>
                    <td className="mono">{formatPrice(trade.entryPrice)}</td>
                    <td className="mono">{trade.lot.toFixed(2)}</td>
                    <td className="mono">
                      {trade.exitPrice === null
                        ? '—'
                        : formatPrice(trade.exitPrice)}
                    </td>
                    <td>
                      <span className={`status-tag ${open ? 'open' : 'closed'}`}>
                        <span className="status-dot" />
                        {open ? 'OPEN' : 'CLOSED'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`result-tag result-${trade.result.toLowerCase()}`}
                      >
                        {trade.result}
                      </span>
                    </td>
                    <td className={`mono ${trade.profit >= 0 ? 'up' : 'down'}`}>
                      {formatCurrency(trade.profit)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
