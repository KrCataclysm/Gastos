import { ICON_NAMES, Icon } from "./Icon";

export const PALETTE = ["#0f766e", "#16a34a", "#65a30d", "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#8b5cf6", "#3b82f6", "#06b6d4", "#64748b"];

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="field"><span className="lbl" id="cor-lbl">Cor</span>
      <div className="chips" role="group" aria-labelledby="cor-lbl">
        {PALETTE.map((c) => <button key={c} type="button" className="chip" aria-pressed={value === c} aria-label={`Cor ${c}`} onClick={() => onChange(c)} style={{ padding: 0, width: 36, justifyContent: "center" }}><i className="dot" style={{ background: c, width: 20, height: 20 }} /></button>)}
      </div>
    </div>
  );
}

export function IconPicker({ value, onChange }: { value: string; onChange: (i: string) => void }) {
  return (
    <div className="field"><span className="lbl" id="ico-lbl">Ícone</span>
      <div className="chips" role="group" aria-labelledby="ico-lbl">
        {ICON_NAMES.map((n) => <button key={n} type="button" className="chip" aria-pressed={value === n} aria-label={`Ícone ${n}`} onClick={() => onChange(n)} style={{ padding: 0, width: 38, justifyContent: "center" }}><Icon name={n} size={18} /></button>)}
      </div>
    </div>
  );
}
