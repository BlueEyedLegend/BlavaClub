import React, { useRef, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import styled from 'styled-components';

import { capitalize } from './utils';
import { Button } from './styles';

const Popup = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  color: #006400;
  padding: 1rem 2rem;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  text-align: center;
  z-index: 1000;
  animation: popin 1s ease-out;

  @keyframes popin {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
`;

interface Props {
  participants: string[];
}

const colors = [
  '#CC4629', '#CC9A29', '#B2CC29', '#5ECC29', '#29CC46', '#29CC99',
  '#2985CC', '#293FCC', '#4629CC', '#9929CC', '#CC2981', '#CC2929',
  '#CC5929', '#CC9529', '#B2CC29', '#66CC29', '#29CC5F', '#29CC91'
];

export const Wheel: React.FC<Props> = ({ participants }) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const rotationRef = React.useRef(rotation);
  const setRotationRef = (v: number) => {
    rotationRef.current = v;
    setRotation(v);
  };
  // spins use a single fixed direction now
  const [showPopup, setShowPopup] = useState(false);
  const [popupWinner, setPopupWinner] = useState<string | null>(null);
  const [showGifOverlay, setShowGifOverlay] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const numSectors = participants.length || 1;

  useEffect(() => {
    if (canvasRef.current) {
      drawWheel();
    }
    // prepare audio
    if (!audioRef.current) {
      audioRef.current = new Audio(`${import.meta.env.BASE_URL}let-it-ride-made-with-Voicemod.mp3`);
      audioRef.current.preload = 'auto';
      audioRef.current.loop = false;
      audioRef.current.volume = 1;
      audioRef.current.load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, rotation]);

  const darkenColor = (color: string, amount: number): string => {
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);

    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);

    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  };

  const drawWheel = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const radius = canvas.width / 2;
    const sliceAngle = (2 * Math.PI) / numSectors;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(radius, radius);
    ctx.rotate((-rotation * Math.PI) / 180);

    for (let i = 0; i < numSectors; i++) {
      const startAngle = i * sliceAngle;
      const endAngle = (i + 1) * sliceAngle;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      const color = darkenColor(colors[i % colors.length], 30);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.save();
      ctx.rotate((startAngle + endAngle) / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 3;
      ctx.fillText(capitalize(participants[i] || ''), radius * 0.6, 0);
      ctx.restore();
    }

    ctx.restore();

    // Draw static indicator
    const indicatorLength = 20;
    const indicatorWidth = 10;
    ctx.save();
    ctx.translate(canvas.width, canvas.height / 2);
    ctx.beginPath();
    ctx.moveTo(-indicatorLength, -indicatorWidth / 2);
    ctx.lineTo(0, -indicatorWidth / 2);
    ctx.lineTo(0, indicatorWidth / 2);
    ctx.lineTo(-indicatorLength, indicatorWidth / 2);
    ctx.closePath();
    ctx.fillStyle = 'red';
    ctx.fill();
    ctx.restore();
  };

  // Animate a rotation delta (degrees) over duration (ms). Returns a promise.
  const animateDelta = (delta: number, duration: number) => {
    return new Promise<void>((resolve) => {
      setSpinning(true);
      const easing = (t: number) => 1 - Math.pow(1 - t, 3);
      let startTime: number | null = null;
      const startRotation = rotationRef.current;

      const frame = (time: number) => {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const t = Math.min(elapsed / duration, 1);
        const easeT = easing(t);
        const current = startRotation + delta * easeT;
        setRotationRef(current);
        if (elapsed < duration) requestAnimationFrame(frame);
        else {
          setSpinning(false);
          resolve();
        }
      };

      requestAnimationFrame(frame);
    });
  };

  const startSpin = async () => {
    if (spinning || participants.length === 0) return;

    const numFullRotations = Math.random() * 5 + 5; // 5-10 rotations
    const totalRotation = numFullRotations * 360;
    // single fixed direction (clockwise positive rotation)
    const delta = totalRotation;
    const finalRotation = (rotationRef.current + delta) % 360;

    const spinDuration = 6000;

    await animateDelta(delta, spinDuration);

    // Determine initial winner, then run gif+repeat sequence
    determineWinner(finalRotation, delta, spinDuration);
  };

  // If delta/duration provided, will run gif+repeat sequence using those same options.
  const determineWinner = (finalRotation: number, delta?: number, duration?: number) => {
    const sliceAngle = 360 / numSectors;
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;
    const winningSector = Math.floor(normalizedRotation / sliceAngle);

    setPopupWinner(participants[winningSector]);

    if (delta && duration) {
      // Run GIF overlay + repeat spin pattern 5 times, then show final popup with confetti
      runGifRepeatSequence(delta, duration, 5);
    } else {
      setShowPopup(true);
    }
  };

  // Show gif overlay, then spin the wheel with same delta/duration; repeat `times` times.
  const runGifRepeatSequence = async (delta: number, duration: number, times: number) => {
    // Show gif instead of confetti initially
    for (let i = 0; i < times; i++) {
      // play sound and show gif
      try {
        if (audioRef.current) {
          // reset to start and play from the beginning
          audioRef.current.pause();
          try { audioRef.current.currentTime = 0; } catch {}
          // ignore play promise errors
          void audioRef.current.play();
        }
      } catch (e) {
        // ignore
      }
      setShowGifOverlay(true);
      // show gif and sound for a short moment before spinning (reduced by 0.5s)
      await new Promise((r) => setTimeout(r, 1300));
      setShowGifOverlay(false);
      if (audioRef.current) {
        try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch {}
      }
      // spin with same options
      await animateDelta(delta, duration);
      // small pause between cycles
      await new Promise((r) => setTimeout(r, 400));
    }

    // After repeats, show final popup and confetti
    setShowPopup(true);
    startConfetti();
  };

  // spin direction removed; spins use fixed direction

  useEffect(() => {
    if (showPopup) {
      startConfetti();
      const timer = setTimeout(() => setShowPopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showPopup]);

  const startConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div>
      {showGifOverlay && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}letitride.gif`}
            alt="celebrate"
            style={{
              width: 'min(80vw, 960px)',
              height: 'auto',
              borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          />
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        style={{ borderRadius: '50%', border: '2px solid black' }}
      />
      <ButtonsContainer>
        <Button onClick={startSpin} disabled={participants.length === 0 || spinning}>
          Spin
        </Button>
      </ButtonsContainer>
      {showPopup && popupWinner && (
        <Popup>
          <h2>Congratulations!</h2>
          <h3>{capitalize(popupWinner)}</h3>
        </Popup>
      )}
    </div>
  );
};

export default Wheel;
