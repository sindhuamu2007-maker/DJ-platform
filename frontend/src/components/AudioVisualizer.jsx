import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';

export const AudioVisualizer = ({ isPlaying = false, height = 64, barCount = 32 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let data = audioEngine.getFrequencyData();
      // If paused or silent, generate soft ambient baseline wave
      const isSilent = !isPlaying || data.every(v => v === 0);

      const width = canvas.width;
      const h = canvas.height;
      const barWidth = (width / barCount) - 2;

      for (let i = 0; i < barCount; i++) {
        let value;
        if (isSilent) {
          // Synthetic ambient idle pulse
          const time = Date.now() / 400;
          value = Math.sin(time + i * 0.3) * 12 + 16;
        } else {
          const index = Math.floor((i / barCount) * data.length);
          value = (data[index] / 255) * h * 0.85;
          value = Math.max(4, value);
        }

        const x = i * (barWidth + 2);
        const y = h - value;

        // Gradient color: Electric cyan -> Neon purple -> Hot pink
        const gradient = ctx.createLinearGradient(0, y, 0, h);
        gradient.addColorStop(0, '#EC4899'); // Neon pink top
        gradient.addColorStop(0.5, '#8B5CF6'); // Purple mid
        gradient.addColorStop(1, '#06B6D4'); // Cyan bottom

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, value, [3, 3, 0, 0]);
        ctx.fill();

        // Top glow cap
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, barWidth, 2);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      className="w-full h-full rounded-lg"
    />
  );
};
