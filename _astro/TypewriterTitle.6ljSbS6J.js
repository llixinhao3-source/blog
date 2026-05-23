import{j as n}from"./jsx-runtime.u17CrQMm.js";import{r as i}from"./index.CO9X3OiW.js";const c=["AI Agent 开发工程师","Python 全栈开发者","数据分析师","OpenClaw / Hermes 实践者"];function m(){const[s,u]=i.useState(0),[e,r]=i.useState(""),[l,a]=i.useState(!1),t=i.useRef(null);return i.useEffect(()=>{const o=c[s];return l?e.length>0?t.current=setTimeout(()=>{r(e.slice(0,-1))},40):(a(!1),u(f=>(f+1)%c.length)):e.length<o.length?t.current=setTimeout(()=>{r(o.slice(0,e.length+1))},80):t.current=setTimeout(()=>a(!0),2e3),()=>{t.current&&clearTimeout(t.current)}},[e,l,s]),n.jsxs("span",{className:"text-sm",style:{background:"linear-gradient(135deg, #c084fc, #a78bfa, #e879f9)",backgroundSize:"200% 200%",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",animation:"gradientShift 4s ease-in-out infinite"},children:[e,n.jsx("span",{className:"inline-block w-[2px] h-[14px] ml-0.5 align-middle",style:{background:"#c084fc",animation:"cursorBlink 1s step-end infinite"}}),n.jsx("style",{children:`
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `})]})}export{m as default};
