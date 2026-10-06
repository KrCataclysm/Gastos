import { useState } from "react";
import { normalizeHex } from "@/lib/contrast";

/** Seletor de cor + campo hexadecimal validado. */
export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value);
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setText(value);
  }
  const invalid = normalizeHex(text) === null;
  return (
    <div className="field">
      <label>{label}</label>
      <div className="color-row">
        <input type="color" aria-label={`${label}: seletor de cor`} value={value} onChange={(e) => onChange(e.target.value)} />
        <input
          className={`input mono${invalid ? " input-error" : ""}`}
          aria-label={`${label}: código hexadecimal`}
          aria-invalid={invalid}
          value={text}
          maxLength={7}
          spellCheck={false}
          onChange={(e) => {
            setText(e.target.value);
            const hex = normalizeHex(e.target.value);
            if (hex) onChange(hex);
          }}
        />
      </div>
    </div>
  );
}
