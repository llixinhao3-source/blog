import{j as t}from"./jsx-runtime.u17CrQMm.js";import{r as s}from"./index.CO9X3OiW.js";function b(){const o=s.useRef(null),c=s.useRef(null),[d,p]=s.useState(0),l=s.useCallback(()=>{const e=c.current,n=o.current;if(!e||!n)return;const r=e.style.clipPath.match(/inset\(0\s+([\d.]+)%/),a=r?100-parseFloat(r[1]):0,f=n.getBoundingClientRect();p(a/100*f.width)},[]);return s.useEffect(()=>{const e=o.current,n=c.current;if(!e||!n)return;let i=0;const r=f=>{const h=e.getBoundingClientRect(),g=(f.clientX-h.left)/h.width*100;n.style.clipPath=`inset(0 ${100-g}% 0 0)`,cancelAnimationFrame(i),i=requestAnimationFrame(l)},a=()=>{n.style.clipPath="inset(0 100% 0 0)",cancelAnimationFrame(i),i=requestAnimationFrame(l)};return e.addEventListener("mousemove",r),e.addEventListener("mouseleave",a),()=>{e.removeEventListener("mousemove",r),e.removeEventListener("mouseleave",a),cancelAnimationFrame(i)}},[l]),t.jsxs("div",{ref:o,className:"relative w-full px-4 cursor-ew-resize select-none overflow-hidden",style:{minHeight:110,fontSize:"clamp(2.25rem, 5vw, 4.5rem)"},children:[t.jsx("div",{className:"font-serif font-bold tracking-wider text-center",style:{whiteSpace:"nowrap",visibility:"hidden",fontSize:"inherit",lineHeight:1.2},children:"hi，我是李心皓"}),t.jsx("div",{className:"absolute inset-0 flex items-center justify-center pointer-events-none",style:{whiteSpace:"nowrap",fontSize:"inherit",lineHeight:1.2},children:t.jsx("span",{className:"font-serif font-bold tracking-wider breathe-text",style:{fontSize:"inherit",background:"linear-gradient(135deg, #c084fc, #a78bfa, #e879f9, #c084fc)",backgroundSize:"300% 300%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",filter:"brightness(0.8)",animation:"breatheShift 4s ease-in-out infinite"},children:"hi，我是sevik"})}),t.jsx("style",{children:`
        @keyframes breatheShift {
          0%, 100% {
            background-position: 0% 50%;
            filter: brightness(0.7);
            opacity: 0.35;
          }
          25% {
            background-position: 100% 0%;
            filter: brightness(1.0);
            opacity: 0.5;
          }
          50% {
            background-position: 100% 100%;
            filter: brightness(1.2);
            opacity: 0.55;
          }
          75% {
            background-position: 0% 100%;
            filter: brightness(0.9);
            opacity: 0.45;
          }
        }
      `}),t.jsx("div",{ref:c,className:"absolute inset-0 flex items-center justify-center pointer-events-none",style:{whiteSpace:"nowrap",fontSize:"inherit",lineHeight:1.2,clipPath:"inset(0 100% 0 0)",transition:"clip-path 0.06s ease-out"},children:t.jsx("span",{className:"font-serif font-bold tracking-wider",style:{fontSize:"inherit",color:"#ffffff",textShadow:"0 0 50px rgba(192,132,252,0.5), 0 0 100px rgba(167,139,250,0.25)"},children:"hi，我是李心皓"})}),t.jsx("div",{className:"absolute top-0 bottom-0 pointer-events-none",style:{width:3,left:d,opacity:d>1?1:0,background:"linear-gradient(to bottom, transparent, rgba(192,132,252,0.6), rgba(192,132,252,0.9), rgba(167,139,250,0.6), transparent)",boxShadow:"0 0 16px rgba(192,132,252,0.5), 0 0 32px rgba(167,139,250,0.2)"}}),t.jsx("style",{children:`
        @keyframes breathingShimmer {
          0%, 100% {
            background-position: 200% center;
            filter: brightness(1) drop-shadow(0 0 8px rgba(192,132,252,0.3));
          }
          50% {
            background-position: -100% center;
            filter: brightness(1.25) drop-shadow(0 0 18px rgba(192,132,252,0.55));
          }
        }
        .breathing-glow-text {
          animation: breathingShimmer 3.5s ease-in-out infinite;
        }
      `})]})}export{b as default};
