import { useId } from "react";

export function SwitchRow({ title, description, checked, onChange }: { title: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="switch-row">
      <div><label htmlFor={id} className="t">{title}</label>{description && <div className="d" id={`${id}-d`}>{description}</div>}</div>
      <span className="switch"><input id={id} type="checkbox" role="switch" checked={checked} aria-describedby={description ? `${id}-d` : undefined} onChange={(e) => onChange(e.target.checked)} /><span /></span>
    </div>
  );
}
