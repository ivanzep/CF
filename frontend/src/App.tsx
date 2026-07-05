import { useEffect, useState } from "react";
import { useProjects, useProject, useSummary } from "./hooks";
import { api } from "./api";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectHeader } from "./components/ProjectHeader";
import { LineItemsSection } from "./components/LineItemsSection";
import { CashflowSummarySection } from "./components/CashflowSummarySection";
import { DrawsSection } from "./components/DrawsSection";
import { CapTableSection } from "./components/CapTableSection";

type Tab = "line-items" | "summary" | "draws" | "cap-table";

function App() {
  const qc = useQueryClient();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("summary");
  const [busy, setBusy] = useState<string | null>(null);

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

          {tab === "summary" && summary && <CashflowSummarySection summary={summary} />}
          {tab === "line-items" && <LineItemsSection project={project} />}
          {tab === "draws" && <DrawsSection project={project} />}
          {tab === "cap-table" && summary && <CapTableSection project={project} summary={summary} />}
        </>
      )}
    </div>
  );
}

export default App;
