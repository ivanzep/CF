import type { Project } from "../types";
import { useProjectMutations } from "../hooks";
import { EditableText } from "./Editable";

interface Props {
  project: Project;
}

export function ProjectHeader({ project }: Props) {
  const m = useProjectMutations(project.id);

  return (
    <div className="project-header">
      <EditableText
        className="project-header__name"
        value={project.name}
        onSave={(name) => m.updateProject.mutate({ name })}
      />
      <div className="project-header__meta">
        <label>
          Client
          <EditableText
            value={project.client ?? ""}
            placeholder="—"
            onSave={(client) => m.updateProject.mutate({ client })}
          />
        </label>
        <label>
          Address
          <EditableText
            value={project.address ?? ""}
            placeholder="—"
            onSave={(address) => m.updateProject.mutate({ address })}
          />
        </label>
        <label>
          Date
          <input
            type="date"
            value={project.projectDate}
            onChange={(e) => m.updateProject.mutate({ projectDate: e.target.value })}
          />
        </label>
      </div>
      <label className="project-header__description">
        Description
        <EditableText
          value={project.description ?? ""}
          placeholder="—"
          onSave={(description) => m.updateProject.mutate({ description })}
        />
      </label>
    </div>
  );
}
