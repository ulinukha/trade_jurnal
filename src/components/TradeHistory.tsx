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
        <div>
          <p className="eyebrow">Executed</p>
          <h2>Trade history & outcomes</h2>
          <p className="hint">
            {showingDay
              ? selectedDate
              : 'All trades · click a calendar date to filter'}
          </p>
        </div>
        <div className="history-tools">
          <span className="meta-pill">{rows.length} trades</span>
          <span className={`meta-pill ${net >= 0 ? 'up' : 'down'}`}>
            {formatPnL(net)}
          </span>
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
                <th>Exit</th>
                <th>Status</th>
                <th>Result</th>
                <th>Profit</th>
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
