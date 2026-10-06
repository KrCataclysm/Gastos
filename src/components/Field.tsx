import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface Base { label: string; error?: string; hint?: string }

function Wrap({ id, label, error, hint, children }: Base & { id: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <span className="muted" style={{ fontSize: ".8rem" }}>{hint}</span>}
      {error && <span className="err" id={`${id}-err`} role="alert">{error}</span>}
    </div>
  );
}

export function TextField({ label, error, hint, ...p }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return <Wrap id={id} label={label} error={error} hint={hint}><input id={id} className="input" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} {...p} /></Wrap>;
}

export function SelectField({ label, error, hint, children, ...p }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return <Wrap id={id} label={label} error={error} hint={hint}><select id={id} className="input" aria-invalid={!!error} {...p}>{children}</select></Wrap>;
}

export function TextArea({ label, error, hint, ...p }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return <Wrap id={id} label={label} error={error} hint={hint}><textarea id={id} className="input" aria-invalid={!!error} {...p} /></Wrap>;
}
