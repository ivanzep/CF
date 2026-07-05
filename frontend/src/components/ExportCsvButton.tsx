import { useState } from "react";
import type { Project, Summary } from "../types";
import {
  EXPORT_SECTION_LABELS,
  EXPORT_SECTION_ORDER,
  buildCombinedCsv,
  downloadCsv,
  type ExportSection,
} from "../lib/csvExport";

interface Props {
  project: Project;
  summary: Summary | undefined;
}

export function ExportCsvButton({ project, summary }: Props) {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState<Set<ExportSection>>(new Set(EXPORT_SECTION_ORDER));

  function toggleSection(s: ExportSection) {
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function doExport() {
    const ordered = EXPORT_SECTION_ORDER.filter((s) => sections.has(s));
    const csv = buildCombinedCsv(project, summary, ordered);
    const safeName = project.name.replace(/[^a-z0-9 -]/gi, "").trim() || "project";
    downloadCsv(`${safeName} - cashflow export.csv`, csv);
    setOpen(false);
  }

  return (
    <div className="export-csv">
      <button className="link-button" onClick={() => setOpen((o) => !o)}>
        Export CSV
      </button>
      {open && (
        <div className="export-csv__panel">
          <p className="export-csv__title">Export sections</p>
          {EXPORT_SECTION_ORDER.map((s) => (
            <label key={s} className="export-csv__option">
              <input type="checkbox" checked={sections.has(s)} onChange={() => toggleSection(s)} />
              {EXPORT_SECTION_LABELS[s]}
            </label>
          ))}
          <div className="export-csv__actions">
            <button className="link-button" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="secondary-button" disabled={sections.size === 0} onClick={doExport}>
              Download CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
