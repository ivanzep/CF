import { Fragment, useLayoutEffect, useRef, useState } from "react";
import type { Summary } from "../types";
import { fmtMoney, fmtMonth } from "../lib/format";
import { CashflowChart } from "./CashflowChart";

interface Props {
  summary: Summary;
}

export function CashflowSummarySection({ summary }: Props) {
  const labelRef = useRef<HTMLTableCellElement>(null);
  const [budgetLeft, setBudgetLeft] = useState(260);

  useLayoutEffect(() => {
    if (labelRef.current) setBudgetLeft(labelRef.current.offsetWidth);
  }, [summary]);

  if (summary.months.length === 0) {
    return (
      <div className="section">
        <p className="section__intro">
          No scheduled payments yet. Add line items with a schedule to see the monthly cashflow here.
        </p>
      </div>
    );
  }

  return (
    <div className="section">
      <CashflowChart months={summary.months} monthly={summary.grandTotal.monthly} />

      <div className="summary-grid-wrap" style={{ ["--budget-col-left" as string]: `${budgetLeft}px` }}>
        <table className="summary-grid">
          <thead>
            <tr>
              <th className="summary-grid__label" ref={labelRef}>
                Line item
              </th>
              <th className="col-money summary-grid__budget">Budget</th>
              {summary.months.map((m, i) => (
                <th key={m} className="col-money">
                  <span className="summary-grid__monthnum">Month {i + 1}</span>
                  <span className="summary-grid__monthlabel">{fmtMonth(m)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {summary.categories.map((cat) => (
              <Fragment key={cat.id ?? "uncat"}>
                <tr className="summary-grid__category">
                  <td className="summary-grid__label">{cat.name}</td>
                  <td className="col-money summary-grid__budget"></td>
                  {summary.months.map((m) => (
                    <td key={m} className="col-money"></td>
                  ))}
                </tr>
                {cat.lineItems.map((li) => (
                  <tr key={li.id}>
                    <td className="summary-grid__label">
                      {li.code && <span className="summary-grid__code">{li.code}</span>}
                      {li.description}
                    </td>
                    <td className="col-money summary-grid__budget">{fmtMoney(li.totalBudget)}</td>
                    {summary.months.map((m) => (
                      <td key={m} className="col-money">
                        {li.monthly[m] ? fmtMoney(li.monthly[m]) : ""}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="summary-grid__subtotal">
                  <td className="summary-grid__label">Total {cat.name}</td>
                  <td className="col-money summary-grid__budget">{fmtMoney(cat.subtotalTotal)}</td>
                  {summary.months.map((m) => (
                    <td key={m} className="col-money">
                      {cat.subtotal[m] ? fmtMoney(cat.subtotal[m]) : ""}
                    </td>
                  ))}
                </tr>
              </Fragment>
            ))}
            <tr className="summary-grid__grandtotal">
              <td className="summary-grid__label">Grand Total</td>
              <td className="col-money summary-grid__budget">{fmtMoney(summary.grandTotal.total)}</td>
              {summary.months.map((m) => (
                <td key={m} className="col-money">
                  {summary.grandTotal.monthly[m] ? fmtMoney(summary.grandTotal.monthly[m]) : ""}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {summary.draws.length > 0 && (
        <div className="draws-summary">
          <h3>Draws</h3>
          <table className="mini-table">
            <tbody>
              {summary.draws.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.date}</td>
                  <td>{fmtMoney(d.amount, { cents: true })}</td>
                  <td>{d.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
