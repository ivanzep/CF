import { useState } from "react";
import type { LineItem } from "../types";
import { fmtMoney, fmtDate } from "../lib/format";

interface Props {
  item: LineItem;
  onChangeMode: (mode: "EVEN" | "CUSTOM") => void;
  onChangeDates: (startDate: string, endDate: string) => void;
  onSetPayments: (payments: { date: string; amount: number }[]) => void;
}

export function ScheduleEditor({ item, onChangeMode, onChangeDates, onSetPayments }: Props) {
  const [newDate, setNewDate] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const scheduleTotal = item.schedule.reduce((a, b) => a + b.amount, 0);
  const variance = scheduleTotal - item.totalBudget;

  return (
    <div className="schedule-editor">
      <div className="schedule-editor__mode">
        <label>
          <input
            type="radio"
            checked={item.scheduleMode === "EVEN"}
            onChange={() => onChangeMode("EVEN")}
          />
          Spread evenly between dates
        </label>
        <label>
          <input
            type="radio"
            checked={item.scheduleMode === "CUSTOM"}
            onChange={() => onChangeMode("CUSTOM")}
          />
          Specific payment dates
        </label>
      </div>

      {item.scheduleMode === "EVEN" ? (
        <div className="schedule-editor__even">
          <label>
            Start
            <input
              type="date"
              value={item.startDate ?? ""}
              onChange={(e) => onChangeDates(e.target.value, item.endDate ?? e.target.value)}
            />
          </label>
          <label>
            End
            <input
              type="date"
              value={item.endDate ?? ""}
              onChange={(e) => onChangeDates(item.startDate ?? e.target.value, e.target.value)}
            />
          </label>
          {item.startDate && item.endDate && (
            <span className="schedule-editor__hint">
              {item.schedule.length} monthly payment{item.schedule.length === 1 ? "" : "s"} of{" "}
              {fmtMoney(item.totalBudget / Math.max(item.schedule.length, 1))} each
            </span>
          )}
        </div>
      ) : (
        <div className="schedule-editor__custom">
          <table className="mini-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {item.payments.map((p) => (
                <tr key={p.id}>
                  <td>{fmtDate(p.date)}</td>
                  <td>{fmtMoney(p.amount, { cents: true })}</td>
                  <td>
                    <button
                      className="link-button"
                      onClick={() =>
                        onSetPayments(
                          item.payments
                            .filter((x) => x.id !== p.id)
                            .map((x) => ({ date: x.date, amount: x.amount }))
                        )
                      }
                    >
                      remove
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </td>
                <td>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </td>
                <td>
                  <button
                    className="link-button"
                    disabled={!newDate || !newAmount}
                    onClick={() => {
                      onSetPayments([
                        ...item.payments.map((x) => ({ date: x.date, amount: x.amount })),
                        { date: newDate, amount: Number(newAmount) },
                      ]);
                      setNewDate("");
                      setNewAmount("");
                    }}
                  >
                    add
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          {Math.abs(variance) > 0.01 && (
            <div className="schedule-editor__variance">
              Payments total {fmtMoney(scheduleTotal, { cents: true })}, budget is{" "}
              {fmtMoney(item.totalBudget, { cents: true })} ({variance > 0 ? "+" : ""}
              {fmtMoney(variance, { cents: true })})
            </div>
          )}
        </div>
      )}
    </div>
  );
}
