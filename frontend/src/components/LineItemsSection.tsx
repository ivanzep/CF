import { useState } from "react";
import type { Project, LineItem } from "../types";
import { useProjectMutations } from "../hooks";
import { EditableText, EditableNumber } from "./Editable";
import { ScheduleEditor } from "./ScheduleEditor";
import { fmtMoney } from "../lib/format";

interface Props {
  project: Project;
}

export function LineItemsSection({ project }: Props) {
  const m = useProjectMutations(project.id);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const groups = [
    ...project.categories.map((c) => ({ id: c.id, name: c.name })),
    { id: null as string | null, name: "Uncategorized" },
  ]
    .map((cat) => ({ ...cat, items: project.lineItems.filter((li) => li.categoryId === cat.id) }))
    .filter((g) => g.id !== null || g.items.length > 0);

  return (
    <div className="section">
      {groups.map((group) => (
        <div className="category-group" key={group.id ?? "uncategorized"}>
          <div className="category-group__header">
            {group.id ? (
              <EditableText
                className="category-group__title"
                value={group.name}
                onSave={(name) => m.updateCategory.mutate({ id: group.id as string, data: { name } })}
              />
            ) : (
              <span className="category-group__title category-group__title--muted">{group.name}</span>
            )}
            <span className="category-group__total">
              {fmtMoney(group.items.reduce((a, li) => a + li.totalBudget, 0))}
            </span>
            {group.id && (
              <button
                className="link-button link-button--danger"
                onClick={() => {
                  if (group.items.length > 0) {
                    alert("Move or delete line items out of this category first.");
                    return;
                  }
                  m.deleteCategory.mutate(group.id as string);
                }}
              >
                delete category
              </button>
            )}
          </div>

          <table className="line-items-table">
            <thead>
              <tr>
                <th className="col-code">Code</th>
                <th>Description</th>
                <th className="col-money">Budget</th>
                <th className="col-schedule">Schedule</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((li) => (
                <LineItemRow
                  key={li.id}
                  item={li}
                  project={project}
                  expanded={expandedId === li.id}
                  onToggleExpand={() => setExpandedId(expandedId === li.id ? null : li.id)}
                />
              ))}
              <tr className="add-row">
                <td colSpan={5}>
                  <button
                    className="link-button"
                    onClick={() =>
                      m.createLineItem.mutate({
                        categoryId: group.id,
                        description: "New line item",
                        totalBudget: 0,
                        scheduleMode: "EVEN",
                      })
                    }
                  >
                    + add line item
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      <button
        className="secondary-button"
        onClick={() => {
          const name = prompt("Category name?");
          if (name) m.createCategory.mutate({ name, sortOrder: project.categories.length });
        }}
      >
        + add category
      </button>
    </div>
  );
}

function LineItemRow({
  item,
  project,
  expanded,
  onToggleExpand,
}: {
  item: LineItem;
  project: Project;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const m = useProjectMutations(project.id);

  const scheduleSummary =
    item.scheduleMode === "EVEN"
      ? item.startDate && item.endDate
        ? `Even, ${item.startDate} → ${item.endDate}`
        : "Even (set dates)"
      : `${item.payments.length} custom payment${item.payments.length === 1 ? "" : "s"}`;

  return (
    <>
      <tr>
        <td className="col-code">
          <EditableText
            className="editable-text editable-text--code"
            value={item.code ?? ""}
            onSave={(code) => m.updateLineItem.mutate({ id: item.id, data: { code } })}
          />
        </td>
        <td>
          <EditableText
            value={item.description}
            onSave={(description) => m.updateLineItem.mutate({ id: item.id, data: { description } })}
          />
          <select
            className="category-select"
            value={item.categoryId ?? ""}
            onChange={(e) =>
              m.updateLineItem.mutate({ id: item.id, data: { categoryId: e.target.value || null } })
            }
          >
            <option value="">Uncategorized</option>
            {project.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </td>
        <td className="col-money">
          <EditableNumber
            className="editable-number"
            value={item.totalBudget}
            onSave={(totalBudget) => m.updateLineItem.mutate({ id: item.id, data: { totalBudget } })}
          />
        </td>
        <td className="col-schedule">
          <button className="link-button" onClick={onToggleExpand}>
            {expanded ? "▾ " : "▸ "}
            {scheduleSummary}
          </button>
        </td>
        <td className="col-actions">
          <button
            className="link-button link-button--danger"
            onClick={() => {
              if (confirm(`Delete "${item.description}"?`)) m.deleteLineItem.mutate(item.id);
            }}
          >
            delete
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="schedule-row">
          <td colSpan={5}>
            <ScheduleEditor
              item={item}
              onChangeMode={(scheduleMode) => m.updateLineItem.mutate({ id: item.id, data: { scheduleMode } })}
              onChangeDates={(startDate, endDate) =>
                m.updateLineItem.mutate({ id: item.id, data: { startDate, endDate } })
              }
              onSetPayments={(payments) => m.setLineItemPayments.mutate({ id: item.id, payments })}
            />
          </td>
        </tr>
      )}
    </>
  );
}
