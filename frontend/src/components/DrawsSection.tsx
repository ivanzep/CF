import type { Project } from "../types";
import { useProjectMutations } from "../hooks";
import { EditableText, EditableNumber } from "./Editable";
import { fmtMoney } from "../lib/format";

interface Props {
  project: Project;
}

export function DrawsSection({ project }: Props) {
  const m = useProjectMutations(project.id);
  const total = project.draws.reduce((a, d) => a + d.amount, 0);

  return (
    <div className="section">
      <p className="section__intro">
        Define the draw structure for this project — construction loan draws, equity calls, or any other
        funding event. Each draw has a name, a date, and an amount you can edit freely.
      </p>
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
