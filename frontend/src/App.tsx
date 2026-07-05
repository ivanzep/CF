import { useEffect, useState } from "react";
import { useProjects, useProject, useSummary } from "./hooks";
import { api } from "./api";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectHeader } from "./components/ProjectHeader";
import { LineItemsSection } from "./components/LineItemsSection";
import { CashflowSummarySection } from "./components/CashflowSummarySection";
import { DrawsSection } from "./components/DrawsSection";
import { CapTableSection } from "./components/CapTableSection";
import { PrintPages } from "./components/PrintPages";
import { ExportCsvButton } from "./components/ExportCsvButton";
import {
  DEFAULT_PRINT_SETTINGS,
  FONT_SCALE,
  MARGIN_LABELS,
  FONT_SIZE_LABELS,
  PAGE_SIZE_LABELS,
  ROW_PADDING_PX,
  ROW_SIZE_LABELS,
  marginCss,
  pageCssSize,
  type PrintSettings,
} from "./lib/printLayout";

type Tab = "line-items" | "summary" | "draws" | "cap-table";

function App() {
  const qc = useQueryClient();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("summary");
  const [busy, setBusy] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);

  useEffect(() => {
    document.body.classList.toggle("print-preview-mode", previewMode);
  }, [previewMode]);

  useEffect(() => {
    document.body.classList.toggle("print-grayscale", printSettings.colorMode === "grayscale");
    document.body.style.setProperty("--print-font-scale", String(FONT_SCALE[printSettings.fontSize]));
    document.body.style.setProperty("--print-row-padding", `${ROW_PADDING_PX[printSettings.rowSize]}px`);
  }, [printSettings]);

  useEffect(() => {
    let styleEl = document.getElementById("dynamic-print-page") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-print-page";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `@page { size: ${pageCssSize(printSettings)}; margin: ${marginCss(printSettings)}; }`;
  }, [printSettings]);

  useEffect(() => {
    if (!projectId && projects && projects.length > 0) setProjectId(projects[0].id);
  }, [projects, projectId]);

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: summary } = useSummary(projectId);

  function invalidateAfterCreate(id: string) {
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["project", id] });
    qc.invalidateQueries({ queryKey: ["summary", id] });
  }

  async function createProject() {
    setBusy("Creating spreadsheet…");
    try {
      const created = await api.createProject({ name: "New Project" });
      invalidateAfterCreate(created.id);
      setProjectId(created.id);
    } finally {
      setBusy(null);
    }
  }

  async function createExampleProject() {
    setBusy("Creating example project…");
    try {
      const created = await api.createProject({ name: "La Costa Hotel" });
      await api.loadExampleData(created.id);
      invalidateAfterCreate(created.id);
      setProjectId(created.id);
    } finally {
      setBusy(null);
    }
  }

  if (projectsLoading) return <div className="app-loading">Loading…</div>;

  if (projects && projects.length === 0) {
    return (
      <div className="app-empty">
        <h1>Cashflow Tracker</h1>
        <p>No projects yet. Each project is its own Google Sheet in your Drive.</p>
        <div className="app-empty__actions">
          <button className="secondary-button" disabled={!!busy} onClick={createProject}>
            + create blank project
          </button>
          <button className="secondary-button" disabled={!!busy} onClick={createExampleProject}>
            + load La Costa Hotel example
          </button>
        </div>
        {busy && <p className="app-empty__busy">{busy}</p>}
      </div>
    );
  }

  return (
    <>
      {previewMode && (
        <div className="print-preview-bar">
          <div className="print-preview-bar__row">
            <span className="print-preview-bar__label">Print Preview</span>
            <button onClick={() => window.print()}>Print</button>
            <button onClick={() => setPreviewMode(false)}>Exit preview</button>
          </div>
          <div className="print-preview-bar__row print-preview-bar__settings">
            <label>
              Page size
              <select
                value={printSettings.pageSize}
                onChange={(e) => setPrintSettings({ ...printSettings, pageSize: e.target.value as PrintSettings["pageSize"] })}
              >
                {Object.entries(PAGE_SIZE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Orientation
              <select
                value={printSettings.orientation}
                onChange={(e) =>
                  setPrintSettings({ ...printSettings, orientation: e.target.value as PrintSettings["orientation"] })
                }
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </label>
            <label>
              Margins
              <select
                value={printSettings.margin}
                onChange={(e) => setPrintSettings({ ...printSettings, margin: e.target.value as PrintSettings["margin"] })}
              >
                {Object.entries(MARGIN_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Font size
              <select
                value={printSettings.fontSize}
                onChange={(e) => setPrintSettings({ ...printSettings, fontSize: e.target.value as PrintSettings["fontSize"] })}
              >
                {Object.entries(FONT_SIZE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Row size
              <select
                value={printSettings.rowSize}
                onChange={(e) => setPrintSettings({ ...printSettings, rowSize: e.target.value as PrintSettings["rowSize"] })}
              >
                {Object.entries(ROW_SIZE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Color
              <select
                value={printSettings.colorMode}
                onChange={(e) =>
                  setPrintSettings({ ...printSettings, colorMode: e.target.value as PrintSettings["colorMode"] })
                }
              >
                <option value="color">Color</option>
                <option value="grayscale">Grayscale</option>
              </select>
            </label>
          </div>
        </div>
      )}
      <div className="app">
      <header className="app-topbar">
        <span className="app-topbar__title">Cashflow Tracker</span>
        {projects && projects.length > 0 && (
          <select value={projectId ?? ""} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        <button className="link-button" disabled={!!busy} onClick={createProject}>
          + new project
        </button>
        {busy && <span className="app-topbar__busy">{busy}</span>}
        {project && <ExportCsvButton project={project} summary={summary} />}
        <button className="link-button" onClick={() => setPreviewMode(true)}>
          Print Preview
        </button>
      </header>

      {projectLoading || !project ? (
        <div className="app-loading">Loading project…</div>
      ) : (
        <>
          <ProjectHeader project={project} />
          <nav className="tabs">
            <button className={tab === "summary" ? "tab tab--active" : "tab"} onClick={() => setTab("summary")}>
              Cash Flow Summary
            </button>
            <button
              className={tab === "line-items" ? "tab tab--active" : "tab"}
              onClick={() => setTab("line-items")}
            >
              Line Items
            </button>
            <button className={tab === "draws" ? "tab tab--active" : "tab"} onClick={() => setTab("draws")}>
              Draws
            </button>
            <button
              className={tab === "cap-table" ? "tab tab--active" : "tab"}
              onClick={() => setTab("cap-table")}
            >
              Cap Table
            </button>
          </nav>

          {tab === "summary" && summary && (
            <>
              {previewMode && (
                <PrintPages settings={printSettings}>
                  <CashflowSummarySection summary={summary} />
                </PrintPages>
              )}
              <div className="print-real-content">
                <CashflowSummarySection summary={summary} />
              </div>
            </>
          )}
          {tab === "line-items" && <LineItemsSection project={project} />}
          {tab === "draws" && <DrawsSection project={project} />}
          {tab === "cap-table" && summary && <CapTableSection project={project} summary={summary} />}
        </>
      )}
      </div>
    </>
  );
}

export default App;
