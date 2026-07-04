import { useEffect, useState } from "react";

interface TextProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function EditableText({ value, onSave, placeholder, className }: TextProps) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <input
      className={className ?? "editable-text"}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onSave(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setDraft(value);
      }}
    />
  );
}

interface NumberProps {
  value: number;
  onSave: (value: number) => void;
  className?: string;
}

export function EditableNumber({ value, onSave, className }: NumberProps) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  return (
    <input
      type="number"
      className={className ?? "editable-number"}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const n = Number(draft);
        if (!Number.isNaN(n) && n !== value) onSave(n);
        else setDraft(String(value));
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") setDraft(String(value));
      }}
    />
  );
}
