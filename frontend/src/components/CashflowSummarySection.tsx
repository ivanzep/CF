import { Fragment, useLayoutEffect, useRef, useState } from "react";
import type { Summary } from "../types";
import { fmtMoney, fmtMonth } from "../lib/format";
import { CashflowChart } from "./CashflowChart";
import { loadMonthNotes, saveMonthNotes } from "../lib/monthNotes";

interface Props {
  summary: Summary;
  projectId: string;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function CashflowSummarySection({ summary, projectId }: Props) {
  const labelRef = useRef<HTMLTableCellElement>(null);
  const [budgetLeft, setBudgetLeft] = useState(260);
  const [highlightCurrentMonth, setHighlightCurrentMonth] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>(() => loadMonthNotes(projectId));
  const thisMonth = currentMonthKey();

  useLayoutEffect(() => {
    if (labelRef.current) setBudgetLeft(labelRef.current.offsetWidth);
  }, [summary]);

  useLayoutEffect(() => {
    setNotes(loadMonthNotes(projectId));
  }, [projectId]);

  function updateNote(month: string, value: string) {
    setNotes((prev) => {
      const next = { ...prev, [month]: value };
      saveMonthNotes(projectId, next);
      return next;
    });
  }

  function monthClass(m: string): string {
    return highlightCurrentMonth && m === thisMonth ? " summary-grid__month--current" : "";
  }

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

      <div className="summary-grid-controls">
        <button className="link-button" onClick={() => setHighlightCurrentMonth((v) => !v)}>
          {highlightCurrentMonth ? "☑" : "☐"} highlight current month
        </button>
      </div>

      <div className="summary-grid-wrap" style={{ ["--budget-col-left" as string]: `${budgetLeft}px` }}>
        <table className="summary-grid">
          <thead>
            <tr>
              <th className="summary-grid__label" ref={labelRef}>
                Line item
              </th>
              <th className="col-money summary-grid__budget">Budget</th>
              {summary.months.map((m, i) => (
                <th key={m} className={"col-money" + monthClass(m)}>
                  <span className="summary-grid__monthnum">Month {i + 1}</span>
                  <span className="summary-grid__monthlabel">{fmtMonth(m)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="summary-grid__notes">
              <td className="summary-grid__label">Notes</td>
              <td className="col-money summary-grid__budget"></td>
              {summary.months.map((m) => (
                <td key={m} className={monthClass(m)}>
                  <input
                    className="summary-grid__notenote"
                    value={notes[m] ?? ""}
                    placeholder="—"
                    onChange={(e) => updateNote(m, e.target.value)}
                  />
                </td>
              ))}
            </tr>
            {summary.categories.map((cat) => (
              <Fragment key={cat.id ?? "uncat"}>
                <tr className="summary-grid__category">
                  <td className="summary-grid__label">{cat.name}</td>
                  <td className="col-money summary-grid__budget"></td>
                  {summary.months.map((m) => (
                    <td key={m} className={"col-money" + monthClass(m)}></td>
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
                      <td key={m} className={"col-money" + monthClass(m)}>
                        {li.monthly[m] ? fmtMoney(li.monthly[m]) : ""}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="summary-grid__subtotal">
                  <td className="summary-grid__label">Total {cat.name}</td>
                  <td className="col-money summary-grid__budget">{fmtMoney(cat.subtotalTotal)}</td>
                  {summary.months.map((m) => (
                    <td key={m} className={"col-money" + monthClass(m)}>
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
                <td key={m} className={"col-money" + monthClass(m)}>
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
