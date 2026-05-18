'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Mood = 'happy' | 'focused' | 'tired' | 'calm' | 'excited' | 'default';

const MOOD_GLOW: Record<Mood, string> = {
  happy: 'rgba(251,191,36,0.4)',
  focused: 'rgba(56,189,248,0.4)',
  tired: 'rgba(167,139,250,0.4)',
  calm: 'rgba(52,211,153,0.4)',
  excited: 'rgba(244,114,182,0.4)',
  default: 'rgba(192,132,252,0.3)',
};

const C4=261.63,D4=293.66,E4=329.63,F4=349.23,G4=392,A4=440,B4=493.88,C5=523.25,D5=587.33,E5=659.25,F5=698.46,G5=783.99,A5=880,AS5=932.33,B5=987.77,C6=1046.5,RR=0;

type ToneId = 'qingtian'|'yequ'|'qilixiang';
const TONES: Record<ToneId,{title:string;artist:string;notes:number[];durations:number[];mood:Mood;emoji:string}> = {
  qingtian:{title:'晴天',artist:'周杰伦',mood:'calm',emoji:'🌿',
    notes:[E4,D4,C4,C4,D4,E4,E4,D4,RR,RR,D4,D4,E4,E4,G4,G4,E4,D4,RR,RR,E4,D4,C4,C4,D4,E4,E4,D4,RR,RR,D4,D4,E4,D4,C4,C4,RR,RR,RR,RR],
    durations:[1,1,.5,.5,1,1,1,1,.5,.5,1,1,1,1,1,1,1,2,.5,.5,1,1,.5,.5,1,1,1,1,.5,.5,1,1,1,1,2,2,.5,.5,1,1],
  },
  yequ:{title:'夜曲',artist:'周杰伦',mood:'tired',emoji:'😴',
    notes:[A4,A4,G4,E4,RR,G4,G4,F4,D4,RR,E4,F4,G4,A4,A4,G4,E4,RR,D4,E4,F4,E4,D4,C4,C4,RR,A4,A4,G4,E4,RR,G4,G4,F4,D4,RR],
    durations:[1,1,1,1,.5,1,1,1,1,.5,.5,.5,1,1,1,1,2,.5,.5,.5,1,1,1,1,2,.5,1,1,1,1,.5,1,1,1,1,.5],
  },
  qilixiang:{title:'七里香',artist:'周杰伦',mood:'happy',emoji:'😊',
    notes:[G4,A4,C5,RR,A4,G4,E4,RR,G4,A4,C5,D5,RR,C5,A4,G4,RR,G4,A4,C5,RR,A4,G4,E4,RR,G4,A4,C5,E5,RR,D5,C5,A4,G4,RR],
    durations:[1,1,2,.5,1,1,2,.5,.5,.5,1,1,.5,1,1,2,.5,1,1,2,.5,1,1,2,.5,.5,.5,1,1,.5,.5,.5,.5,2,1],
  },
};
const TRACK_KEYS: ToneId[] = ['qingtian','yequ','qilixiang'];

interface MusicPlayerProps {
  mood?: string;
}

export default function MusicPlayer({ mood }: MusicPlayerProps) {
  const [playing,setPlaying]=useState(false);
  const [currentTrack,setCurrentTrack]=useState(0);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const audioCtxRef=useRef<AudioContext|null>(null);
  const masterRef=useRef<GainNode|null>(null);
  const voicesRef=useRef<ReturnType<typeof createVoice>[]>([]);
  const startedAtRef=useRef(0);
  const pausedAtRef=useRef(0);
  const progressTimerRef=useRef(0);
  const autoplayAttempted = useRef(false);
  const bpm=105,beatDuration=60/bpm;

  const currentMood: Mood = (mood && mood in MOOD_GLOW) ? mood as Mood : TONES[TRACK_KEYS[currentTrack]].mood;
  const track=TONES[TRACK_KEYS[currentTrack]];
  const totalDuration=track.durations.reduce((a,b)=>a+b,0)*beatDuration;
  const currentGlow = MOOD_GLOW[currentMood];

  const ensureCtx=useCallback(()=>{
    if(!audioCtxRef.current||audioCtxRef.current.state==='closed'){
      const ctx=new AudioContext();const master=ctx.createGain();master.gain.value=0.25;
      const dry=ctx.createGain();dry.gain.value=0.8;
      const reverb=getReverb(ctx);const wet=ctx.createGain();wet.gain.value=0.2;
      master.connect(dry);master.connect(reverb);reverb.connect(wet);
      dry.connect(ctx.destination);wet.connect(ctx.destination);
      audioCtxRef.current=ctx;masterRef.current=master;
    }return audioCtxRef.current;
  },[]);

  const stopAll=useCallback(()=>{
    voicesRef.current.forEach(v=>{try{v[0].stop()}catch{} try{v[1].stop()}catch{} try{v[2].stop()}catch{} try{v[3].disconnect()}catch{} try{v[4].disconnect()}catch{}});
    voicesRef.current=[];
  },[]);

  const scheduleNotes=useCallback((startFromSec:number)=>{
    const ctx=audioCtxRef.current,master=masterRef.current;
    if(!ctx||!master)return;stopAll();startedAtRef.current=ctx.currentTime-startFromSec;
    let t=0;
    for(let i=0;i<track.notes.length;i++){
      const f=track.notes[i],dur=track.durations[i]*beatDuration;
      if(f===0){t+=dur;continue}
      const st=startedAtRef.current+t,et=st+dur*.92;
      if(et<ctx.currentTime){t+=dur;continue}
      voicesRef.current.push(createVoice(ctx,master,f,st,et));t+=dur;
    }
  },[track,stopAll]);

  const play=useCallback(()=>{
    const ctx=ensureCtx();if(ctx.state==='suspended')ctx.resume();
    const rt=pausedAtRef.current>0?pausedAtRef.current:0;
    if(rt>=totalDuration){pausedAtRef.current=0;scheduleNotes(0)}else scheduleNotes(rt);
    setPlaying(true);
    const ps=rt,psa=ctx.currentTime;
    progressTimerRef.current=window.setInterval(()=>{
      const e=(ctx.currentTime-psa)+ps;
      if(e>=totalDuration){setPlaying(false);pausedAtRef.current=0;clearInterval(progressTimerRef.current)}
    },120);
  },[ensureCtx,totalDuration,scheduleNotes]);

  const pause=useCallback(()=>{
    const ctx=audioCtxRef.current;if(!ctx)return;
    pausedAtRef.current=ctx.currentTime-startedAtRef.current;
    stopAll();setPlaying(false);clearInterval(progressTimerRef.current);
  },[stopAll]);

  const togglePlay=useCallback(()=>{playing?pause():play();setAutoplayBlocked(false)},[playing,pause,play]);

  const next=useCallback(()=>{
    stopAll();clearInterval(progressTimerRef.current);
    setPlaying(false);pausedAtRef.current=0;setCurrentTrack((ct)=>(ct+1)%TRACK_KEYS.length);
  },[stopAll]);

  useEffect(()=>{stopAll();clearInterval(progressTimerRef.current);setPlaying(false);pausedAtRef.current=0},[currentTrack,stopAll]);
  useEffect(()=>()=>{stopAll();clearInterval(progressTimerRef.current);if(audioCtxRef.current?.state!=='closed')audioCtxRef.current?.close()},[stopAll]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      if (pausedAtRef.current > 0) return;
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const elapsed = ctx.currentTime - startedAtRef.current;
      if (elapsed >= totalDuration) next();
    }, 500);
    return () => clearInterval(interval);
  }, [playing, totalDuration, next]);

  useEffect(() => {
    if (autoplayAttempted.current) return;
    autoplayAttempted.current = true;
    const timer = setTimeout(() => {
      try { ensureCtx(); play(); setAutoplayBlocked(false); }
      catch { setAutoplayBlocked(true); }
    }, 600);
    return () => clearTimeout(timer);
  }, [ensureCtx, play]);

  useEffect(() => {
    if (!autoplayBlocked) return;
    const activate = () => { setAutoplayBlocked(false); document.removeEventListener('click', activate); };
    document.addEventListener('click', activate);
    return () => document.removeEventListener('click', activate);
  }, [autoplayBlocked]);

  return (
    <>
      <div className="w-full flex items-center justify-center relative" style={{ minHeight: 410 }}>
        <AnimatePresence>
          {autoplayBlocked && (
            <motion.div
              initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer"
              style={{background:'transparent'}}
              onClick={togglePlay}
            >
              <motion.div
                className="flex flex-col items-center gap-2"
                animate={{scale:[1,1.04,1]}} transition={{duration:2,repeat:Infinity}}
              >
                <span className="text-3xl">{track.emoji}</span>
                <span className="text-xs text-text-secondary">点击开启音乐</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative" style={{ perspective: 1000 }}>
          <motion.div
            className="vinyl-disc relative rounded-full flex items-center justify-center"
            onClick={togglePlay}
            whileTap={{ scale: 0.96 }}
            style={{
              width: 160, height: 160,
              '--vinyl-speed': `${18 - (currentTrack * 2)}s` as React.CSSProperties,
              cursor: 'pointer',
              animationPlayState: playing ? 'running' : 'paused',
              boxShadow: playing
                ? `0 0 60px ${currentGlow}, 0 0 120px ${currentGlow}, 0 0 180px ${currentGlow.replace('0.4','0.15')}`
                : `0 0 20px ${currentGlow.replace('0.4','0.2')}`,
              transition: 'box-shadow 1s ease',
            }}
          >
            {Array.from({length:7},(_,i)=>{
              const isActive = i === currentTrack;
              return (
                <div key={i} className="absolute rounded-full pointer-events-none"
                  style={{
                    width:`${150-i*18}px`,height:`${150-i*18}px`,
                    border:'1px solid',
                    borderColor: isActive
                      ? `rgba(167,255,235,${0.15+i*0.04})`
                      : `rgba(71,85,105,${0.08+i*0.02})`,
                    transition: 'border-color 0.6s ease',
                  }}
                />
              );
            })}
            <div className="absolute inset-0 rounded-full pointer-events-none opacity-[0.06]" style={{
              background:`repeating-conic-gradient(#fff 0deg,transparent .5deg,transparent 1deg,#fff 1.2deg)`,
            }}/>
            <div className="rounded-full flex items-center justify-center z-10 pointer-events-none"
              style={{width:42,height:42,background:'#0f172a',border:'2px solid #334155'}}>
              <span className="text-lg leading-none">{track.emoji}</span>
            </div>
            <div className="absolute inset-0 rounded-full pointer-events-none" style={{
              background:'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.02) 100%)',
            }}/>
          </motion.div>
        </div>

        <style>{`
          @keyframes vinylRotate {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          .vinyl-disc {
            animation: vinylRotate var(--vinyl-speed, 18s) linear infinite;
            animation-play-state: paused;
            background:
              linear-gradient(135deg, #1e293b 0%, #0f172a 35%, #1a2440 65%, #0f172a 100%);
          }
          .vinyl-disc::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: repeating-radial-gradient(
              circle at center,
              transparent 0px,
              rgba(71,85,105,0.05) 1px,
              transparent 2px,
              transparent 4px,
              rgba(71,85,105,0.03) 5px,
              transparent 6px
            );
            pointer-events: none;
          }
          .vinyl-disc::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 50%;
            background: radial-gradient(
              ellipse at 30% 20%,
              rgba(255,255,255,0.06) 0%,
              transparent 50%
            );
            pointer-events: none;
          }
        `}</style>
      </div>
    </>
  );
}

function createVoice(ctx:AudioContext,master:GainNode,freq:number,startTime:number,endTime:number){
  const o1=ctx.createOscillator();o1.type='sawtooth';o1.frequency.value=freq;
  const o2=ctx.createOscillator();o2.type='sawtooth';o2.frequency.value=freq*1.007;
  const o3=ctx.createOscillator();o3.type='sine';o3.frequency.value=freq*.5;
  const vg=ctx.createGain();vg.gain.value=0;
  const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=400;f.Q.value=2;
  o1.connect(vg);o2.connect(vg);o3.connect(vg);vg.connect(f);f.connect(master);
  const dur=endTime-startTime,a=Math.min(.04,dur*.15),d=Math.min(.1,dur*.2),s=.06,r=Math.min(.3,dur*.4);
  vg.gain.setValueAtTime(0,startTime);vg.gain.linearRampToValueAtTime(.08,startTime+a);
  vg.gain.setTargetAtTime(s,startTime+a+d,.02);vg.gain.setValueAtTime(s,endTime-r);vg.gain.linearRampToValueAtTime(0,endTime);
  f.frequency.setValueAtTime(Math.min(2000,freq*3),startTime);f.frequency.linearRampToValueAtTime(400,startTime+a+d);
  o1.start(startTime);o2.start(startTime);o3.start(startTime);o1.stop(endTime+.05);o2.stop(endTime+.05);o3.stop(endTime+.05);
  return[o1,o2,o3,vg,f]as const;
}
let _reverb:ConvolverNode|null=null;
function getReverb(ctx:AudioContext):ConvolverNode{
  if(_reverb&&_reverb.context===ctx)return _reverb;
  const len=ctx.sampleRate*1.2,buf=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*.35))}
  _reverb=ctx.createConvolver();_reverb.buffer=buf;return _reverb;
}
