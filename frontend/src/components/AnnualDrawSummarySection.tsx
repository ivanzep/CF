import { Fragment, useMemo, useState } from "react";
import type { Summary } from "../types";
import { fmtMoney, fmtMonth } from "../lib/format";
import { drawPeriodMonths, yearOf } from "../lib/annualDrawSummary";

interface Props {
  summary: Summary;
}

export function AnnualDrawSummarySection({ summary }: Props) {
  const years = useMemo(() => {
    const set = new Set(summary.months.map(yearOf));
    return Array.from(set).sort();
  }, [summary.months]);

  const sortedDraws = useMemo(() => [...summary.draws].sort((a, b) => a.date.localeCompare(b.date)), [summary.draws]);

  const [selectedDrawId, setSelectedDrawId] = useState<string | undefined>(undefined);
  const activeDrawId = selectedDrawId ?? sortedDraws[sortedDraws.length - 1]?.id;
  const periodMonths = useMemo(
    () => drawPeriodMonths(summary.months, sortedDraws, activeDrawId),
    [summary.months, sortedDraws, activeDrawId]
  );

  if (summary.months.length === 0) return null;

  function yearTotal(monthly: Record<string, number>, year: string): number {
    return summary.months.filter((m) => yearOf(m) === year).reduce((a, m) => a + (monthly[m] ?? 0), 0);
  }

  function periodTotal(monthly: Record<string, number>): number {
    return periodMonths.reduce((a, m) => a + (monthly[m] ?? 0), 0);
  }

  return (
    <div className="section annual-draw-summary">
      <h3>Budget Totals by Year</h3>
      <div className="summary-grid-wrap annual-grid-wrap">
        <table className="summary-grid annual-grid">
          <thead>
            <tr>
              <th className="summary-grid__label">Line item</th>
              <th className="col-money">Budget</th>
              {years.map((y) => (
                <th key={y} className="col-money">
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.categories.map((cat) => (
              <Fragment key={cat.id ?? "uncat"}>
                <tr className="summary-grid__category">
                  <td className="summary-grid__label">{cat.name}</td>
                  <td className="col-money"></td>
                  {years.map((y) => (
                    <td key={y} className="col-money"></td>
                  ))}
                </tr>
                {cat.lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="summary-grid__label">
                      {li.code && <span className="summary-grid__code">{li.code}</span>}
                      {li.description}
                    </td>
                    <td className="col-money">{fmtMoney(li.totalBudget)}</td>
                    {years.map((y) => {
                      const t = yearTotal(li.monthly, y);
                      return (
                        <td key={y} className="col-money">
                          {t ? fmtMoney(t) : ""}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="summary-grid__subtotal">
                  <td className="summary-grid__label">Total {cat.name}</td>
                  <td className="col-money">{fmtMoney(cat.subtotalTotal)}</td>
                  {years.map((y) => {
                    const t = yearTotal(cat.subtotal, y);
                    return (
                      <td key={y} className="col-money">
                        {t ? fmtMoney(t) : ""}
                      </td>
                    );
                  })}
                </tr>
              </Fragment>
            ))}
            <tr className="summary-grid__grandtotal">
              <td className="summary-grid__label">Grand Total</td>
              <td className="col-money">{fmtMoney(summary.grandTotal.total)}</td>
              {years.map((y) => {
                const t = yearTotal(summary.grandTotal.monthly, y);
                return (
                  <td key={y} className="col-money">
                    {t ? fmtMoney(t) : ""}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {sortedDraws.length > 0 && (
        <>
          <div className="annual-draw-summary__draw-header">
            <h3>Draw Request Summary</h3>
            <label>
              Draw
              <select value={activeDrawId} onChange={(e) => setSelectedDrawId(e.target.value)}>
                {sortedDraws.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({fmtMonth(d.date.slice(0, 10))})
                  </option>
                ))}
              </select>
            </label>
            {periodMonths.length > 0 && (
              <span className="annual-draw-summary__period">
                Period: {fmtMonth(periodMonths[0])} – {fmtMonth(periodMonths[periodMonths.length - 1])}
              </span>
            )}
          </div>
          <div className="summary-grid-wrap annual-grid-wrap">
            <table className="summary-grid annual-grid">
              <thead>
                <tr>
                  <th className="summary-grid__label">Line item</th>
                  <th className="col-money">Budget</th>
                  {periodMonths.map((m) => (
                    <th key={m} className="col-money">
                      {fmtMonth(m)}
                    </th>
                  ))}
                  <th className="col-money">Draw Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.categories.map((cat) => (
                  <Fragment key={cat.id ?? "uncat"}>
                    <tr className="summary-grid__category">
                      <td className="summary-grid__label">{cat.name}</td>
                      <td className="col-money"></td>
                      {periodMonths.map((m) => (
                        <td key={m} className="col-money"></td>
                      ))}
                      <td className="col-money"></td>
                    </tr>
                    {cat.lineItems.map((li) => {
                      const t = periodTotal(li.monthly);
                      if (t === 0 && periodMonths.every((m) => !li.monthly[m])) return null;
                      return (
                        <tr key={li.id}>
                          <td className="summary-grid__label">
                            {li.code && <span className="summary-grid__code">{li.code}</span>}
                            {li.description}
                          </td>
                          <td className="col-money">{fmtMoney(li.totalBudget)}</td>
                          {periodMonths.map((m) => (
                            <td key={m} className="col-money">
                              {li.monthly[m] ? fmtMoney(li.monthly[m]) : ""}
                            </td>
                          ))}
                          <td className="col-money">
                            <strong>{t ? fmtMoney(t) : ""}</strong>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="summary-grid__subtotal">
                      <td className="summary-grid__label">Total {cat.name}</td>
                      <td className="col-money">{fmtMoney(cat.subtotalTotal)}</td>
                      {periodMonths.map((m) => (
                        <td key={m} className="col-money">
                          {cat.subtotal[m] ? fmtMoney(cat.subtotal[m]) : ""}
                        </td>
                      ))}
                      <td className="col-money">{fmtMoney(periodTotal(cat.subtotal))}</td>
                    </tr>
                  </Fragment>
                ))}
                <tr className="summary-grid__grandtotal">
                  <td className="summary-grid__label">Grand Total</td>
                  <td className="col-money">{fmtMoney(summary.grandTotal.total)}</td>
                  {periodMonths.map((m) => (
                    <td key={m} className="col-money">
                      {summary.grandTotal.monthly[m] ? fmtMoney(summary.grandTotal.monthly[m]) : ""}
                    </td>
                  ))}
                  <td className="col-money">{fmtMoney(periodTotal(summary.grandTotal.monthly))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {summary.capTable.length > 0 && (
        <>
          <h3>Cap Table Summary</h3>
          <table className="mini-table cap-table-summary">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th className="col-money">Ownership %</th>
                <th className="col-money">Contributed</th>
                <th className="col-money">Distributed</th>
                <th className="col-money">Net Position</th>
              </tr>
            </thead>
            <tbody>
              {summary.capTable.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.role}</td>
                  <td className="col-money">{r.ownershipPercent.toFixed(2)}%</td>
                  <td className="col-money">{fmtMoney(r.totalContributed)}</td>
                  <td className="col-money">{fmtMoney(r.totalDistributed)}</td>
                  <td className="col-money">{fmtMoney(r.netPosition)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
