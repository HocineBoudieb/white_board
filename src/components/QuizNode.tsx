import React, { memo, useState } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';

interface Choice {
  id: string;
  text: string;
  correct: boolean;
}

interface QuizData {
  question: string;
  choices: Choice[];
  explanation?: string;
}

const QuizNode = ({ data }: { data: QuizData }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleSubmit = () => {
    if (!selected) return;
    const correct = data.choices.find((c) => c.id === selected)?.correct ?? false;
    setScore(correct ? 1 : 0);
    setSubmitted(true);
  };

  const reset = () => {
    setSelected(null);
    setSubmitted(false);
    setScore(null);
  };

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
        justifyContent: 'space-between',
      }}
    >
      <NodeResizer />
      <div>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>{data.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.choices.map((c) => (
            <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="radio"
                name="quiz-choice"
                value={c.id}
                checked={selected === c.id}
                onChange={() => setSelected(c.id)}
                disabled={submitted}
              />
              <span
                style={{
                  color: submitted
                    ? c.correct
                      ? 'green'
                      : selected === c.id
                      ? 'red'
                      : 'inherit'
                    : 'inherit',
                }}
              >
                {c.text}
              </span>
            </label>
          ))}
        </div>
        {submitted && data.explanation && (
          <div style={{ marginTop: 12, fontSize: 14, color: '#555' }}>{data.explanation}</div>
        )}
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {!submitted ? (
          <button onClick={handleSubmit} disabled={!selected}>
            Valider
          </button>
        ) : (
          <>
            <div style={{ alignSelf: 'center', fontWeight: 600 }}>
              Score: {score === 1 ? '✅' : '❌'}
            </div>
            <button onClick={reset}>Recommencer</button>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(QuizNode);