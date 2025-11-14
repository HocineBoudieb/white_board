import React, { memo, useState } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';

interface FlashcardData {
  front: string;
  back: string;
  lastReviewed?: Date;
  nextReview?: Date;
  interval?: number; // days
  easeFactor?: number; // 1.3–2.5
  repetitions?: number;
}

const FlashcardNode = ({ data }: { data: FlashcardData }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => setIsFlipped((prev) => !prev);

  // Simple SM-2 spaced-repetition helpers
  const scheduleNext = (quality: number) => {
    const { interval = 1, easeFactor = 2.5, repetitions = 0 } = data;
    const newEase = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    let newInterval: number;
    let newReps = repetitions + 1;
    if (quality < 3) {
      newInterval = 1;
      newReps = 0;
    } else if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEase);
    }
    const next = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000);
    // Here you would persist these values to your backend/state
    console.log('Next review in', newInterval, 'days');
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
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        cursor: 'pointer',
      }}
      onClick={handleFlip}
    >
      <NodeResizer />
      <div style={{ fontSize: 18, fontWeight: 600 }}>
        {isFlipped ? data.back : data.front}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#555' }}>
        {isFlipped ? 'Cliquez pour retour' : 'Cliquez pour retourner'}
      </div>
      {isFlipped && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button onClick={(e) => { e.stopPropagation(); scheduleNext(1); }}>Difficile</button>
          <button onClick={(e) => { e.stopPropagation(); scheduleNext(3); }}>Correct</button>
          <button onClick={(e) => { e.stopPropagation(); scheduleNext(5); }}>Facile</button>
        </div>
      )}
    </div>
  );
};

export default memo(FlashcardNode);