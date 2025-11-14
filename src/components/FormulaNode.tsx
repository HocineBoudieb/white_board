import React, { memo, useState, useEffect } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';

interface FormulaData {
  latex: string; // LaTeX expression
  variables?: Record<string, number>; // e.g. { a: 2, b: 3 }
}

// Very light parser/evaluator for simple math only
const safeEval = (expr: string, vars: Record<string, number>): number => {
  // Replace variables
  let replaced = expr;
  Object.entries(vars).forEach(([k, v]) => {
    replaced = replaced.replace(new RegExp(`\\b${k}\\b`, 'g'), String(v));
  });
  // Only allow digits, +, -, *, /, ., (, )
  if (!/^[0-9+\-*/().\s]+$/.test(replaced)) throw new Error('Unsafe expression');
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${replaced})`)();
};

const FormulaNode = ({ data }: { data: FormulaData }) => {
  const [vars, setVars] = useState<Record<string, number>>(data.variables || {});
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    try {
      const res = safeEval(data.latex, vars);
      setResult(res);
    } catch {
      setResult(null);
    }
  }, [data.latex, vars]);

  const varKeys = Object.keys(data.variables || {});

  return (
    <div
      style={{
        padding: 16,
        border: '1px solid #ccc',
        borderRadius: 8,
        background: '#fff',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <NodeResizer />
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Formule</div>
      <div style={{ fontFamily: 'KaTeX_Main, serif', fontSize: 16, marginBottom: 12 }}>
        ${data.latex}$
      </div>
      {varKeys.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {varKeys.map((k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <label style={{ minWidth: 24 }}>{k} =</label>
              <input
                type="number"
                value={vars[k]}
                onChange={(e) => setVars({ ...vars, [k]: Number(e.target.value) })}
                style={{ width: 80 }}
              />
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 'auto', fontSize: 20, fontWeight: 700 }}>
        Résultat: {result !== null ? result.toFixed(2) : '—'}
      </div>
    </div>
  );
};

export default memo(FormulaNode);