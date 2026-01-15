import { useEffect, useState } from 'react';

interface ConfettiPiece {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  color: string;
}

export default function Confetti() {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    const colors = ['#00ffff', '#06b6d4', '#22d3ee', '#ff00ff', '#d946ef', '#ec4899', '#ffff00', '#fde047'];
    const pieces: ConfettiPiece[] = [];

    for (let i = 0; i < 60; i++) {
      pieces.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 2 + Math.random() * 3,
        animationDelay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    setConfetti(pieces);

    const timer = setTimeout(() => {
      setConfetti([]);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 opacity-0 animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animationDuration: `${piece.animationDuration}s`,
            animationDelay: `${piece.animationDelay}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}
