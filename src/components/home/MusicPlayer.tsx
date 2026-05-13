'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ---- Subtractive synthesizer constants ----
const C4 = 261.63; const D4 = 293.66; const E4 = 329.63; const F4 = 349.23;
const G4 = 392.00; const A4 = 440.00; const B4 = 493.88; const C5 = 523.25;
const D5 = 587.33; const E5 = 659.25; const F5 = 698.46; const G5 = 783.99;
const A5 = 880.00; const AS5 = 932.33; const B5 = 987.77; const C6 = 1046.50;
const R = 0;

type ToneSetName = 'qingtian' | 'yequ' | 'qilixiang';

const TONES: Record<ToneSetName, { title: string; artist: string; notes: number[]; durations: number[] }> = {
  qingtian: {
    title: '晴天',
    artist: '周杰伦',
    notes: [
      E4, D4, C4, C4, D4, E4, E4, D4, R, R,
      D4, D4, E4, E4, G4, G4, E4, D4, R, R,
      E4, D4, C4, C4, D4, E4, E4, D4, R, R,
      D4, D4, E4, D4, C4, C4, R, R, R, R,
    ],
    durations: [
      1,1,0.5,0.5,1,1,1,1,0.5,0.5,
      1,1,1,1,1,1,1,2,0.5,0.5,
      1,1,0.5,0.5,1,1,1,1,0.5,0.5,
      1,1,1,1,2,2,0.5,0.5,1,1,
    ],
  },
  yequ: {
    title: '夜曲',
    artist: '周杰伦',
    notes: [
      A4, A4, G4, E4, R, G4, G4, F4, D4, R,
      E4, F4, G4, A4, A4, G4, E4, R,
      D4, E4, F4, E4, D4, C4, C4, R,
      A4, A4, G4, E4, R, G4, G4, F4, D4, R,
    ],
    durations: [
      1,1,1,1,0.5,1,1,1,1,0.5,
      0.5,0.5,1,1,1,1,2,0.5,
      0.5,0.5,1,1,1,1,2,0.5,
      1,1,1,1,0.5,1,1,1,1,0.5,
    ],
  },
  qilixiang: {
    title: '七里香',
    artist: '周杰伦',
    notes: [
      G4, A4, C5, R, A4, G4, E4, R,
      G4, A4, C5, D5, R, C5, A4, G4, R,
      G4, A4, C5, R, A4, G4, E4, R,
      G4, A4, C5, E5, R, D5, C5, A4, G4, R,
    ],
    durations: [
      1,1,2,0.5,1,1,2,0.5,
      0.5,0.5,1,1,0.5,1,1,2,0.5,
      1,1,2,0.5,1,1,2,0.5,
      0.5,0.5,1,1,0.5,0.5,0.5,0.5,2,1,
    ],
  },
};

const TRACK_KEYS: ToneSetName[] = ['qingtian', 'yequ', 'qilixiang'];

// ---- Subtractive voice: rich synth pad with filter ----
function createVoice(ctx: AudioContext, master: GainNode, freq: number, startTime: number, endTime: number) {
  const osc1 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc1.frequency.value = freq;

  const osc2 = ctx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.value = freq * 1.007;

  const osc3 = ctx.createOscillator();
  osc3.type = 'sine';
  osc3.frequency.value = freq * 0.5;

  const voiceGain = ctx.createGain();
  voiceGain.gain.value = 0;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  filter.Q.value = 2;

  osc1.connect(voiceGain);
  osc2.connect(voiceGain);
  osc3.connect(voiceGain);
  voiceGain.connect(filter);
  filter.connect(master);

  const dur = endTime - startTime;
  const attack = Math.min(0.04, dur * 0.15);
  const decay = Math.min(0.1, dur * 0.2);
  const sustain = 0.06;
  const release = Math.min(0.3, dur * 0.4);

  voiceGain.gain.setValueAtTime(0, startTime);
  voiceGain.gain.linearRampToValueAtTime(0.08, startTime + attack);
  voiceGain.gain.setTargetAtTime(sustain, startTime + attack + decay, 0.02);
  voiceGain.gain.setValueAtTime(sustain, endTime - release);
  voiceGain.gain.linearRampToValueAtTime(0, endTime);

  const fcStart = Math.min(2000, freq * 3);
  filter.frequency.setValueAtTime(fcStart, startTime);
  filter.frequency.linearRampToValueAtTime(400, startTime + attack + decay);

  osc1.start(startTime);
  osc2.start(startTime);
  osc3.start(startTime);
  osc1.stop(endTime + 0.05);
  osc2.stop(endTime + 0.05);
  osc3.stop(endTime + 0.05);

  return [osc1, osc2, osc3, voiceGain, filter] as const;
}

let sharedReverbNode: ConvolverNode | null = null;

function getReverb(ctx: AudioContext): ConvolverNode {
  if (sharedReverbNode && sharedReverbNode.context === ctx) return sharedReverbNode;

  const length = ctx.sampleRate * 1.2;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.35));
    }
  }
  const reverb = ctx.createConvolver();
  reverb.buffer = buffer;
  sharedReverbNode = reverb;
  return reverb;
}

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const reverbWetRef = useRef<GainNode | null>(null);
  const voicesRef = useRef<ReturnType<typeof createVoice>[]>([]);
  const startedAtRef = useRef(0);
  const pausedAtRef = useRef(0);
  const progressTimerRef = useRef(0);
  const bpm = 105;
  const beatDuration = 60 / bpm;

  const track = TONES[TRACK_KEYS[currentTrack]];
  const totalDuration = track.durations.reduce((a, b) => a + b, 0) * beatDuration;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const ensureCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = 0.3;

      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.8;
      const reverb = getReverb(ctx);
      const wetGain = ctx.createGain();
      wetGain.gain.value = 0.2;

      master.connect(dryGain);
      master.connect(reverb);
      reverb.connect(wetGain);
      dryGain.connect(ctx.destination);
      wetGain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      masterRef.current = master;
      reverbWetRef.current = wetGain;
    }
    return audioCtxRef.current;
  }, []);

  const stopAll = useCallback(() => {
    voicesRef.current.forEach((v) => {
      try { v[0].stop(); } catch (_) { /* already stopped */ }
      try { v[1].stop(); } catch (_) { /* already stopped */ }
      try { v[2].stop(); } catch (_) { /* already stopped */ }
      try { v[3].disconnect(); } catch (_) { /* already disconnected */ }
      try { v[4].disconnect(); } catch (_) { /* already disconnected */ }
    });
    voicesRef.current = [];
  }, []);

  const scheduleNotes = useCallback((startFromSec: number) => {
    const ctx = audioCtxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;

    stopAll();

    startedAtRef.current = ctx.currentTime - startFromSec;
    const { notes, durations } = track;

    let timeAccum = 0;
    for (let i = 0; i < notes.length; i++) {
      const freq = notes[i];
      const dur = durations[i] * beatDuration;

      if (freq === 0) {
        timeAccum += dur;
        continue;
      }

      const startTime = startedAtRef.current + timeAccum;
      const endTime = startTime + dur * 0.92;

      if (endTime < ctx.currentTime) {
        timeAccum += dur;
        continue;
      }

      const v = createVoice(ctx, master, freq, startTime, endTime);
      voicesRef.current.push(v);
      timeAccum += dur;
    }
  }, [track, stopAll]);

  const play = useCallback(() => {
    const ctx = ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const resumeTime = pausedAtRef.current > 0 ? pausedAtRef.current : 0;

    if (resumeTime >= totalDuration) {
      setCurrentTime(0);
      pausedAtRef.current = 0;
      scheduleNotes(0);
    } else {
      scheduleNotes(resumeTime);
    }

    setPlaying(true);

    const progressStart = resumeTime;
    const progressStartedAt = ctx.currentTime;
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = (ctx.currentTime - progressStartedAt) + progressStart;
      const pct = Math.min((elapsed / totalDuration) * 100, 100);
      setCurrentTime(Math.min(elapsed, totalDuration));
      setProgress(pct);
      if (pct >= 100) {
        setPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        pausedAtRef.current = 0;
        clearInterval(progressTimerRef.current);
      }
    }, 120);
  }, [ensureCtx, totalDuration, scheduleNotes]);

  const pause = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    pausedAtRef.current = ctx.currentTime - startedAtRef.current;
    stopAll();
    setPlaying(false);
    clearInterval(progressTimerRef.current);
  }, [stopAll]);

  const togglePlay = useCallback(() => {
    if (playing) pause();
    else play();
  }, [playing, pause, play]);

  const switchTrack = useCallback((idx: number) => {
    stopAll();
    clearInterval(progressTimerRef.current);
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    pausedAtRef.current = 0;
    setCurrentTrack(idx);
  }, [stopAll]);

  const next = useCallback(() => switchTrack((currentTrack + 1) % TRACK_KEYS.length), [currentTrack, switchTrack]);
  const prev = useCallback(() => switchTrack((currentTrack - 1 + TRACK_KEYS.length) % TRACK_KEYS.length), [currentTrack, switchTrack]);

  useEffect(() => {
    stopAll();
    clearInterval(progressTimerRef.current);
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    pausedAtRef.current = 0;
  }, [currentTrack, stopAll]);

  useEffect(() => {
    return () => {
      stopAll();
      clearInterval(progressTimerRef.current);
      if (audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close();
      }
    };
  }, [stopAll]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioCtxRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const seekTime = pct * totalDuration;
    stopAll();
    clearInterval(progressTimerRef.current);
    pausedAtRef.current = 0;
    setCurrentTime(seekTime);
    setProgress(pct * 100);
    setPlaying(false);
    scheduleNotes(seekTime);
    setPlaying(true);
    const ctx = audioCtxRef.current;
    const progressStart = seekTime;
    const progressStartedAt = ctx.currentTime;
    progressTimerRef.current = window.setInterval(() => {
      const elapsed = (ctx.currentTime - progressStartedAt) + progressStart;
      const p = Math.min((elapsed / totalDuration) * 100, 100);
      setCurrentTime(Math.min(elapsed, totalDuration));
      setProgress(p);
      if (p >= 100) {
        setPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        pausedAtRef.current = 0;
        clearInterval(progressTimerRef.current);
      }
    }, 120);
  };

  return (
    <div
      className="w-full transition-all duration-500"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        background: 'rgba(30, 41, 59, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '1.25rem',
        padding: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        minHeight: '380px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${playing ? 'animate-pulse' : ''}`} style={{ background: playing ? '#f87171' : '#64748b' }} />
        <span className="text-xs text-text-muted tracking-wide">Cloud Music</span>
        {playing && <span className="text-[10px] text-accent ml-auto">♪ LIVE</span>}
      </div>

      <div className="flex justify-center mb-3">
        <div
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: 100, height: 100,
            background: 'conic-gradient(from 0deg, #1e293b 0deg, #334155 90deg, #1e293b 180deg, #334155 270deg, #1e293b 360deg)',
            boxShadow: playing
              ? '0 0 24px rgba(56, 189, 248, 0.3), inset 0 0 0 3px rgba(0,0,0,0.4)'
              : '0 0 12px rgba(56, 189, 248, 0.1), inset 0 0 0 3px rgba(0,0,0,0.4)',
            animation: playing ? 'spin 8s linear infinite' : 'none',
            transition: 'box-shadow 0.5s ease',
          }}
        >
          <div className="rounded-full flex items-center justify-center"
            style={{ width: 28, height: 28, background: '#0f172a', border: '2px solid #334155' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: playing ? '#38bdf8' : '#475569' }} />
          </div>
        </div>
      </div>

      <div className="text-center mb-3">
        <h4 className="text-sm font-medium text-text-primary truncate">{track.title}</h4>
        <p className="text-xs text-text-muted truncate">{track.artist}</p>
      </div>

      <div className="mb-3">
        <div className="h-1 rounded-full bg-white/10 cursor-pointer relative overflow-hidden" onClick={handleSeek}>
          <div className="h-full rounded-full transition-all duration-200"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #38bdf8, #818cf8)' }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow transition-all duration-200"
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)', background: '#38bdf8', opacity: expanded ? 1 : 0 }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-text-muted tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatTime(currentTime)}</span>
          <span className="text-[10px] text-text-muted tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatTime(totalDuration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={prev} className="text-text-muted hover:text-text-primary transition-colors" aria-label="上一首">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>
          </svg>
        </button>
        <button onClick={togglePlay}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #38bdf8, #818cf8)' }}
          aria-label={playing ? '暂停' : '播放'}>
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
              <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none" style={{ marginLeft: 2 }}>
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>
        <button onClick={next} className="text-text-muted hover:text-text-primary transition-colors" aria-label="下一首">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
        </button>
      </div>

      <div className="overflow-hidden transition-all duration-500 mt-auto"
        style={{ maxHeight: expanded ? '200px' : '0px', opacity: expanded ? 1 : 0 }}>
        <div className="rounded-xl overflow-hidden mt-3" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          {TRACK_KEYS.map((key, i) => {
            const s = TONES[key];
            const isActive = i === currentTrack;
            return (
              <button key={key}
                onClick={() => switchTrack(i)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                  isActive ? 'text-accent bg-accent/10' : 'text-text-secondary hover:bg-white/5'
                }`}
                style={{ borderBottom: i < TRACK_KEYS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <span>{isActive && <span className="mr-1">♪</span>}{s.title}</span>
                <span className="text-text-muted text-[10px]">- {s.artist}</span>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
