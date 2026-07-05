import { useState } from "react";
import type { Project } from "../types";
import { useProjectMutations } from "../hooks";
import { EditableText, EditableNumber } from "./Editable";
import { fmtMoney } from "../lib/format";
import { generateRecurringDraws } from "../lib/recurringDraws";

interface Props {
  project: Project;
}

const INTERVAL_OPTIONS = [
  { label: "Monthly", months: 1 },
  { label: "Quarterly (every 3 months)", months: 3 },
  { label: "Every 6 months", months: 6 },
  { label: "Annually", months: 12 },
  { label: "Custom", months: 0 },
];

export function DrawsSection({ project }: Props) {
  const m = useProjectMutations(project.id);
  const total = project.draws.reduce((a, d) => a + d.amount, 0);
  const [showGenerator, setShowGenerator] = useState(false);
  const [gen, setGen] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    intervalChoice: 3,
    customMonths: 3,
    count: 4,
    totalAmount: 0,
    splitEvenly: true,
    namePrefix: "Draw",
    source: "",
  });

  function submitGenerator() {
    const intervalMonths = gen.intervalChoice === 0 ? Math.max(1, gen.customMonths) : gen.intervalChoice;
    const count = Math.max(1, gen.count);
    const entries = generateRecurringDraws({
      startDate: gen.startDate,
      intervalMonths,
      count,
      totalAmount: gen.totalAmount,
      splitEvenly: gen.splitEvenly,
      namePrefix: gen.namePrefix || "Draw",
      source: gen.source || null,
      startIndex: project.draws.length + 1,
    });
    m.createDraws.mutate(entries);
    setShowGenerator(false);
  }

  return (
    <div className="section">
      <p className="section__intro">
        Define the draw structure for this project — construction loan draws, equity calls, or any other
        funding event. Each draw has a name, a date, and an amount you can edit freely.
      </p>

      <div className="recurring-draws">
        <button className="link-button" onClick={() => setShowGenerator((s) => !s)}>
          {showGenerator ? "▾" : "▸"} generate recurring draws (e.g. quarterly)
        </button>
        {showGenerator && (
          <div className="recurring-draws__form">
            <label>
              Start date
              <input
                type="date"
                value={gen.startDate}
                onChange={(e) => setGen({ ...gen, startDate: e.target.value })}
              />
            </label>
            <label>
              Repeat
              <select
                value={gen.intervalChoice}
                onChange={(e) => setGen({ ...gen, intervalChoice: Number(e.target.value) })}
              >
                {INTERVAL_OPTIONS.map((o) => (
                  <option key={o.label} value={o.months}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {gen.intervalChoice === 0 && (
              <label>
                Every N months
                <input
                  type="number"
                  min={1}
                  value={gen.customMonths}
                  onChange={(e) => setGen({ ...gen, customMonths: Number(e.target.value) })}
                />
              </label>
            )}
            <label>
              Number of draws
              <input
                type="number"
                min={1}
                value={gen.count}
                onChange={(e) => setGen({ ...gen, count: Number(e.target.value) })}
              />
            </label>
            <label>
              {gen.splitEvenly ? "Total amount (split evenly)" : "Amount per draw"}
              <input
                type="number"
                value={gen.totalAmount}
                onChange={(e) => setGen({ ...gen, totalAmount: Number(e.target.value) })}
              />
            </label>
            <label className="recurring-draws__checkbox">
              <input
                type="checkbox"
                checked={gen.splitEvenly}
                onChange={(e) => setGen({ ...gen, splitEvenly: e.target.checked })}
              />
              Split total evenly across draws
            </label>
            <label>
              Name prefix
              <input
                type="text"
                value={gen.namePrefix}
                onChange={(e) => setGen({ ...gen, namePrefix: e.target.value })}
              />
            </label>
            <label>
              Source
              <input
                type="text"
                placeholder="e.g. Construction Loan"
                value={gen.source}
                onChange={(e) => setGen({ ...gen, source: e.target.value })}
              />
            </label>
            <button className="secondary-button" onClick={submitGenerator}>
              Generate {gen.count} draw{gen.count === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </div>

      <table className="line-items-table">
        <thead>
          <tr>
            <th>Draw</th>
            <th className="col-date">Date</th>
            <th className="col-money">Amount</th>
            <th>Source</th>
            <th className="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          {project.draws.map((d) => (
            <tr key={d.id}>
              <td>
                <EditableText value={d.name} onSave={(name) => m.updateDraw.mutate({ id: d.id, data: { name } })} />
              </td>
              <td className="col-date">
                <input
                  type="date"
                  value={d.date}
                  onChange={(e) => m.updateDraw.mutate({ id: d.id, data: { date: e.target.value } })}
                />
              </td>
              <td className="col-money">
                <EditableNumber value={d.amount} onSave={(amount) => m.updateDraw.mutate({ id: d.id, data: { amount } })} />
              </td>
              <td>
                <EditableText
                  value={d.source ?? ""}
                  placeholder="e.g. Construction Loan"
                  onSave={(source) => m.updateDraw.mutate({ id: d.id, data: { source } })}
                />
              </td>
              <td className="col-actions">
                <button
                  className="link-button link-button--danger"
                  onClick={() => {
                    if (confirm(`Delete "${d.name}"?`)) m.deleteDraw.mutate(d.id);
                  }}
                >
                  delete
                </button>
              </td>
            </tr>
          ))}
          <tr className="add-row">
            <td colSpan={5}>
              <button
                className="link-button"
                onClick={() =>
                  m.createDraw.mutate({
                    name: `Draw ${project.draws.length + 1}`,
                    date: new Date().toISOString().slice(0, 10),
                    amount: 0,
                    sortOrder: project.draws.length,
                  })
                }
              >
                + add draw
              </button>
            </td>
          </tr>
          <tr className="total-row">
            <td>Total</td>
            <td className="col-date"></td>
            <td className="col-money">{fmtMoney(total)}</td>
            <td colSpan={2}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
