import { useState } from "react";
import type { Project, Summary } from "../types";
import { useProjectMutations } from "../hooks";
import { EditableText } from "./Editable";
import { fmtMoney, fmtDate } from "../lib/format";

interface Props {
  project: Project;
  summary: Summary;
}

export function CapTableSection({ project, summary }: Props) {
  const m = useProjectMutations(project.id);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [splitDate, setSplitDate] = useState(new Date().toISOString().slice(0, 10));
  const [splitAmount, setSplitAmount] = useState("");

  const computedById = new Map(summary.capTable.map((r) => [r.id, r]));

  return (
    <div className="section">
      <p className="section__intro">
        Track each member's capital contributions and adjust their draws (distributions). Ownership % is
        computed pro-rata from contributions unless you set a manual override.
      </p>

      <table className="line-items-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th className="col-money">Ownership %</th>
            <th className="col-money">Contributed</th>
            <th className="col-money">Distributed</th>
            <th className="col-money">Net Position</th>
            <th className="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          {project.capTable.map((member) => {
            const computed = computedById.get(member.id);
            return (
              <MemberRows
                key={member.id}
                projectId={project.id}
                member={member}
                computed={computed}
                expanded={expandedId === member.id}
                onToggleExpand={() => setExpandedId(expandedId === member.id ? null : member.id)}
              />
            );
          })}
          <tr className="add-row">
            <td colSpan={7}>
              <button
                className="link-button"
                onClick={() =>
                  m.createMember.mutate({
                    name: `Member ${project.capTable.length + 1}`,
                    role: "LP",
                    sortOrder: project.capTable.length,
                  })
                }
              >
                + add member
              </button>
            </td>
          </tr>
          <tr className="total-row">
            <td>Total</td>
            <td></td>
            <td className="col-money">
              {summary.capTable.reduce((a, r) => a + r.ownershipPercent, 0).toFixed(2)}%
            </td>
            <td className="col-money">{fmtMoney(summary.equityTotals.totalContributed)}</td>
            <td className="col-money">{fmtMoney(summary.equityTotals.totalDistributed)}</td>
            <td className="col-money">
              {fmtMoney(summary.equityTotals.totalContributed - summary.equityTotals.totalDistributed)}
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div className="auto-split">
        <h3>Adjust member draws — split a distribution across all members</h3>
        <div className="auto-split__controls">
          <label>
            Date
            <input type="date" value={splitDate} onChange={(e) => setSplitDate(e.target.value)} />
          </label>
          <label>
            Total amount
            <input
              type="number"
              placeholder="0.00"
              value={splitAmount}
              onChange={(e) => setSplitAmount(e.target.value)}
            />
          </label>
          <button
            className="secondary-button"
            disabled={!splitAmount || Number(splitAmount) <= 0}
            onClick={() => {
              m.autoSplitDistribution.mutate({
                date: splitDate,
                totalAmount: Number(splitAmount),
                note: "Auto-split distribution",
              });
              setSplitAmount("");
            }}
          >
            Split by ownership %
          </button>
        </div>
      </div>
    </div>
  );
}

function MemberRows({
  projectId,
  member,
  computed,
  expanded,
  onToggleExpand,
}: {
  projectId: string;
  member: Project["capTable"][number];
  computed: Summary["capTable"][number] | undefined;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const m = useProjectMutations(projectId);
  const [contribDate, setContribDate] = useState(new Date().toISOString().slice(0, 10));
  const [contribAmount, setContribAmount] = useState("");
  const [distDate, setDistDate] = useState(new Date().toISOString().slice(0, 10));
  const [distAmount, setDistAmount] = useState("");

  return (
    <>
      <tr>
        <td>
          <EditableText value={member.name} onSave={(name) => m.updateMember.mutate({ id: member.id, data: { name } })} />
        </td>
        <td>
          <select
            value={member.role}
            onChange={(e) => m.updateMember.mutate({ id: member.id, data: { role: e.target.value } })}
          >
            <option value="GP">GP</option>
            <option value="LP">LP</option>
          </select>
        </td>
        <td className="col-money">
          <input
            type="number"
            className="editable-number"
            placeholder="auto"
            value={member.ownershipPercent ?? ""}
            onChange={(e) =>
              m.updateMember.mutate({
                id: member.id,
                data: { ownershipPercent: e.target.value === "" ? null : Number(e.target.value) },
              })
            }
          />
          {member.ownershipPercent == null && computed && (
            <span className="auto-badge">auto: {computed.ownershipPercent.toFixed(2)}%</span>
          )}
        </td>
        <td className="col-money">{fmtMoney(computed?.totalContributed ?? 0)}</td>
        <td className="col-money">{fmtMoney(computed?.totalDistributed ?? 0)}</td>
        <td className="col-money">{fmtMoney(computed?.netPosition ?? 0)}</td>
        <td className="col-actions">
          <button className="link-button" onClick={onToggleExpand}>
            {expanded ? "▾ ledger" : "▸ ledger"}
          </button>{" "}
          <button
            className="link-button link-button--danger"
            onClick={() => {
              if (confirm(`Remove "${member.name}" from the cap table?`)) m.deleteMember.mutate(member.id);
            }}
          >
            delete
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="schedule-row">
          <td colSpan={7}>
            <div className="ledger">
              <div className="ledger__column">
                <h4>Contributions</h4>
                <table className="mini-table">
                  <tbody>
                    {member.contributions.map((c) => (
                      <tr key={c.id}>
                        <td>{fmtDate(c.date)}</td>
                        <td>{fmtMoney(c.amount, { cents: true })}</td>
                        <td>{c.note}</td>
                        <td>
                          <button className="link-button" onClick={() => m.deleteContribution.mutate(c.id)}>
                            remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <input type="date" value={contribDate} onChange={(e) => setContribDate(e.target.value)} />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={contribAmount}
                          onChange={(e) => setContribAmount(e.target.value)}
                        />
                      </td>
                      <td colSpan={2}>
                        <button
                          className="link-button"
                          disabled={!contribAmount}
                          onClick={() => {
                            m.createContribution.mutate({
                              memberId: member.id,
                              date: contribDate,
                              amount: Number(contribAmount),
                            });
                            setContribAmount("");
                          }}
                        >
                          add
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="ledger__column">
                <h4>Distributions (draws)</h4>
                <table className="mini-table">
                  <tbody>
                    {member.distributions.map((d) => (
                      <tr key={d.id}>
                        <td>{fmtDate(d.date)}</td>
                        <td>{fmtMoney(d.amount, { cents: true })}</td>
                        <td>{d.note}</td>
                        <td>
                          <button className="link-button" onClick={() => m.deleteDistribution.mutate(d.id)}>
                            remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <input type="date" value={distDate} onChange={(e) => setDistDate(e.target.value)} />
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={distAmount}
                          onChange={(e) => setDistAmount(e.target.value)}
                        />
                      </td>
                      <td colSpan={2}>
                        <button
                          className="link-button"
                          disabled={!distAmount}
                          onClick={() => {
                            m.createDistribution.mutate({
                              memberId: member.id,
                              date: distDate,
                              amount: Number(distAmount),
                            });
                            setDistAmount("");
                          }}
                        >
                          add
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
