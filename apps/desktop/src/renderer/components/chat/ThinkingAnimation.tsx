import React, { useEffect, useState } from 'react';
import './ThinkingAnimation.css';

const EMOJIS = ['🤔', '🧐', '💭', '🧠', '✨', '🌟', '💫', '🎯', '🔮', '🪄'];
const WORDS = [
  'Considering',
  'Contemplating',
  'Weighing',
  'Balancing',
  'Thinking',
  'Reflecting',
  'Processing',
  'Mulling',
  'Pondering',
  'Deliberating',
  'Analyzing',
  'Dreaming',
  'Vibing',
  'Fascinating',
  'Wondering',
  'Figuring',
  'Exploring',
  'Discovering',
  'Computing',
  'Reasoning',
];

export function ThinkingAnimation() {
  const [emojiIdx, setEmojiIdx] = useState(0);
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const emojiTimer = setInterval(() => {
      setEmojiIdx(i => (i + 1) % EMOJIS.length);
    }, 900);
    const wordTimer = setInterval(() => {
      setWordIdx(i => (i + 1) % WORDS.length);
    }, 1800);
    return () => {
      clearInterval(emojiTimer);
      clearInterval(wordTimer);
    };
  }, []);

  return (
    <div className="thinking-animation">
      <span className="thinking-emoji" aria-label="thinking emoji" role="img">
        {EMOJIS[emojiIdx]}
      </span>
      <span className="thinking-word">{WORDS[wordIdx]}...</span>
    </div>
  );
}
