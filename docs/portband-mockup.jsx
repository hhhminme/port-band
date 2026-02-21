import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";

// ── Icons (inline SVG, CC0) ──
const iconPaths = {
  nodedotjs: "M11.998 24c-.321 0-.641-.084-.922-.247L8.14 22.016c-.438-.245-.224-.332-.08-.383.585-.203.703-.25 1.328-.604.066-.037.152-.024.22.015l2.255 1.339a.29.29 0 00.272 0l8.795-5.076a.274.274 0 00.134-.238V6.993a.282.282 0 00-.137-.242l-8.791-5.072a.278.278 0 00-.271 0L3.075 6.751a.284.284 0 00-.139.241v10.076c0 .099.053.19.138.236l2.409 1.392c1.307.654 2.108-.116 2.108-.89V7.787a.267.267 0 01.264-.264h1.152c.145 0 .264.118.264.264v10.02c0 1.744-.95 2.745-2.604 2.745-.508 0-.909 0-2.026-.55l-2.307-1.33A1.85 1.85 0 011.41 17.07V6.994c0-.656.35-1.267.922-1.593L11.123.325a1.917 1.917 0 011.849 0l8.794 5.076c.572.326.92.937.92 1.593v10.076a1.857 1.857 0 01-.92 1.597l-8.795 5.076a1.9 1.9 0 01-.926.247h-.047z",
  redis: "M23.993 14.762c-.015.238-.296.573-.929.937-1.084.624-6.705 2.876-7.9 3.501-.89.466-1.38.46-2.083.098-1.194-.614-6.836-2.83-7.914-3.397-.54-.284-.82-.522-.82-.748v2.264s7.303 3.168 8.478 3.77c.84.43 1.343.426 2.283-.054 1.283-.655 7.548-3.29 8.078-3.592.534-.302.807-.502.807-.738v-2.041zm0-3.354c-.015.238-.296.573-.929.937-1.084.624-6.705 2.876-7.9 3.501-.89.466-1.38.46-2.083.098-1.194-.614-6.836-2.83-7.914-3.397-.54-.284-.82-.522-.82-.748v2.264s7.303 3.168 8.478 3.77c.84.43 1.343.426 2.283-.054 1.283-.655 7.548-3.29 8.078-3.592.534-.302.807-.502.807-.738V11.41zm0-3.556c.017-.255-.292-.447-.825-.63-1.084-.373-6.734-2.644-7.84-3.09-.89-.358-1.367-.38-2.193-.046C11.95 4.693 5.618 7.202 4.537 7.653c-.53.222-.822.42-.822.596v2.264s7.303 3.168 8.478 3.77c.84.43 1.343.426 2.283-.054 1.283-.655 7.548-3.29 8.078-3.592.534-.302.807-.502.807-.738V7.852z",
  postgresql: "M23.554 14.894c-.122-.406-.512-.675-.946-.675h-.036c-.11.004-.22.022-.322.054-.478.163-.726.405-.87.65-.135-.569-.27-1.151-.405-1.765-.375-1.71-.766-3.477-1.344-5.157a10.1 10.1 0 00-.738-1.617c-1.04-1.8-2.602-2.901-4.633-3.273a6.263 6.263 0 00-1.19-.108c-1.312 0-2.573.457-3.585 1.31-.468-.178-.946-.291-1.435-.296h-.049a4.46 4.46 0 00-3.273 1.405c-1.282 1.364-1.682 3.354-1.19 5.926.263 1.378.64 2.784 1.14 4.105.77 2.032 1.593 3.291 2.514 3.849.309.187.628.28.951.28h.009c.442 0 .872-.2 1.255-.58a.985.985 0 00.693.297h.009a1 1 0 00.69-.291c.293.364.607.502.95.502h.012c.413 0 .837-.218 1.254-.646.028.098.056.193.084.28.159.5.317.867.637 1.2.426.444.98.686 1.549.686.138 0 .278-.017.418-.05a2.12 2.12 0 001.437-1.039c.25-.456.338-.982.413-1.489.044-.296.086-.601.14-.908l.021.007c.88.264 1.717.275 2.48.033l.032-.01c.642-.218 1.133-.588 1.456-1.1.565-.896.498-1.968-.178-2.842z",
  vite: "M23.749 2.456L13.022.044a.896.896 0 00-1.022.614L7.349 16.162a.898.898 0 00.855 1.136l4.571.09a.898.898 0 00.907-.747l1.14-6.067a.898.898 0 01.907-.747l2.505.05a.898.898 0 00.905-.706l2.61-6.715zm-10.153 18.8l-.077.362a.456.456 0 01-.543.345l-9.63-2.052a.456.456 0 01-.332-.589L8.72 1.202a.456.456 0 01.579-.3l4.82 1.428z",
  nginx: "M0 12l5.63-9.75h12.74L24 12l-5.63 9.75H5.63L0 12zm6.42-6.32v12.64l4.97-6.32 1.06 1.26-4.63 5.85h8.36l-4.63-5.85 1.06-1.26 4.97 6.32V5.68h-1.83v8.53L12 9.65l-4.37 4.56V5.68H6.42z",
  docker: "M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.12a.186.186 0 00-.185.185v1.888c0 .102.083.185.186.185zm-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.186.186 0 00-.185.185v1.888c0 .102.082.185.185.186zm0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.186.186 0 00-.185.185v1.887c0 .102.082.186.185.186zm-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.186.186 0 00-.185.185v1.887c0 .102.083.186.185.186zm-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.186.186 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186zm5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.186.186 0 00-.185.185v1.888c0 .102.082.185.185.185zm-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185zm-2.964 0h2.119a.186.186 0 00.185-.185V9.006a.186.186 0 00-.185-.186H5.136a.186.186 0 00-.186.185v1.888c0 .102.084.185.186.185zm-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185zM23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z",
  mysql: "M16.405 5.501c-.115 0-.193.014-.274.033v.013h.014c.054.104.146.18.214.273.054.107.1.214.154.32l.014-.015c.094-.066.14-.172.14-.333-.04-.047-.046-.094-.08-.14-.04-.067-.126-.1-.18-.153zM5.77 18.695h-.927a50.854 50.854 0 00-.27-4.41h-.008l-1.41 4.41H2.45l-1.4-4.41h-.01c-.075 1.413-.13 2.898-.167 4.41H0c.055-1.966.166-3.853.333-5.659h1.168l1.316 4.104h.008l1.317-4.104h1.128c.186 2.035.302 3.922.347 5.659z",
  python: "M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l10.06.01z",
};
const iconColors = { nodedotjs:"#5FA04E", redis:"#FF4438", postgresql:"#4169E1", vite:"#646CFF", nginx:"#009639", docker:"#2496ED", mysql:"#4479A1", python:"#3776AB" };
function SvgIcon({ name, size=16 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill={iconColors[name]||"#888"} xmlns="http://www.w3.org/2000/svg"><path d={iconPaths[name]||""}/></svg>;
}

// Lucide-style icons
const ExternalLink = ({s=14}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
const CopyIcon = ({s=14}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const CheckIcon = ({s=14}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const XIcon = ({s=14}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SettingsIcon = ({s=16}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>;

const services = [
  { id:1, name:"next-app", port:3000, iconKey:"nodedotjs", pid:48291 },
  { id:2, name:"redis-server", port:6379, iconKey:"redis", pid:12847 },
  { id:3, name:"postgres", port:5432, iconKey:"postgresql", pid:93718 },
  { id:4, name:"vite dev", port:5173, iconKey:"vite", pid:55032 },
  { id:5, name:"nginx", port:8080, iconKey:"nginx", pid:7831 },
  { id:6, name:"docker-proxy", port:2375, iconKey:"docker", pid:66104 },
  { id:7, name:"mysqld", port:3306, iconKey:"mysql", pid:20095 },
  { id:8, name:"uvicorn", port:8000, iconKey:"python", pid:41562 },
];

const stickColors = ["#FF6B6B","#4ECDC4","#9B59B6","#F1C40F","#3498DB","#E67E22","#1ABC9C","#EC407A"];
const hairColors = ["#E8485C","#5BC0EB","#9B5DE5","#F15BB5","#FEE440","#00BBF9","#00F5D4","#FF6F61"];

// ── Stickman ──
function Stickman({ index, frame, size=1 }) {
  const ref = useRef(null);
  const color = stickColors[index % 8];
  const hair = hairColors[index % 8];
  useEffect(() => {
    const c = ref.current; if(!c) return;
    const w=40*size, h=60*size;
    c.width=w; c.height=h;
    const ctx=c.getContext("2d");
    ctx.clearRect(0,0,w,h);
    const bounce = frame%2===0?0:-2*size;
    const arm = frame%2===0?1:-1;
    const cx=w/2, headY=12*size+bounce;
    const flip = frame%2===0?-1:1;
    ctx.strokeStyle=hair; ctx.lineWidth=2*size; ctx.lineCap="round";
    for(let i=-2;i<=2;i++){
      ctx.beginPath();
      ctx.moveTo(cx+i*3*size, headY-6*size);
      ctx.quadraticCurveTo(cx+i*3*size+flip*4*size, headY-14*size+Math.abs(i)*2*size, cx+i*3*size+flip*6*size, headY-18*size+Math.abs(i)*3*size);
      ctx.stroke();
    }
    ctx.fillStyle=color;
    ctx.beginPath(); ctx.arc(cx,headY,7*size,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#fff";
    ctx.beginPath(); ctx.arc(cx-3*size,headY-size,1.5*size,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+3*size,headY-size,1.5*size,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=color; ctx.lineWidth=2.5*size;
    ctx.beginPath(); ctx.moveTo(cx,headY+7*size); ctx.lineTo(cx,headY+28*size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,headY+14*size); ctx.lineTo(cx-12*size,headY+20*size+arm*4*size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,headY+14*size); ctx.lineTo(cx+12*size,headY+20*size-arm*4*size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,headY+28*size); ctx.lineTo(cx-8*size,headY+42*size+arm*2*size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,headY+28*size); ctx.lineTo(cx+8*size,headY+42*size-arm*2*size); ctx.stroke();
  },[frame,color,hair,size,index]);
  return <canvas ref={ref} style={{width:40*size,height:60*size}}/>;
}

// ── Menu bar head ──
function MenuBarHead({ count }) {
  const [f,setF]=useState(0);
  const sp=count===0?2000:count<=2?900:count<=4?450:count<=7?220:110;
  useEffect(()=>{const iv=setInterval(()=>setF(p=>p+1),sp);return()=>clearInterval(iv)},[sp]);
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    c.width=24;c.height=24;
    const ctx=c.getContext("2d");
    ctx.clearRect(0,0,24,24);
    const cx=12,cy=15;
    const flip=count===0?0:(f%2===0?-1:1);
    const bounce=count===0?0:(f%2===0?0:2);
    ctx.strokeStyle="#E8485C"; ctx.lineWidth=1.8; ctx.lineCap="round";
    for(let i=-3;i<=3;i++){
      ctx.beginPath();
      ctx.moveTo(cx+i*2, cy-5+bounce);
      ctx.quadraticCurveTo(cx+i*2+flip*4, cy-12+Math.abs(i)+bounce, cx+i*2+flip*7, cy-16+Math.abs(i)*2+bounce);
      ctx.stroke();
    }
    ctx.fillStyle="#FF6B6B";
    ctx.beginPath(); ctx.arc(cx,cy+bounce,6,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#fff";
    ctx.beginPath(); ctx.arc(cx-2.5,cy-1+bounce,1.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx+2.5,cy-1+bounce,1.2,0,Math.PI*2); ctx.fill();
    if(count===0){ctx.fillStyle="#71717a";ctx.font="bold 7px sans-serif";ctx.fillText("z",18,8);ctx.font="bold 5px sans-serif";ctx.fillText("z",20,5);}
  },[f,count]);
  return(
    <div className="flex items-center gap-1">
      <canvas ref={ref} style={{width:24,height:24}}/>
      <span className="text-xs font-medium text-zinc-400 tabular-nums">{count}</span>
    </div>
  );
}

// ── Draggable stickman ──
function DraggableStick({ index, frame, size, initX, initY, stageRef }) {
  const [pos,setPos]=useState({x:initX,y:initY});
  const dragging=useRef(false);
  const offset=useRef({x:0,y:0});
  const onDown=(e)=>{
    e.preventDefault(); dragging.current=true;
    const rect=stageRef.current.getBoundingClientRect();
    const cX=e.touches?e.touches[0].clientX:e.clientX;
    const cY=e.touches?e.touches[0].clientY:e.clientY;
    offset.current={x:cX-rect.left-pos.x,y:cY-rect.top-pos.y};
  };
  useEffect(()=>{
    const onMove=(e)=>{
      if(!dragging.current||!stageRef.current)return;
      const rect=stageRef.current.getBoundingClientRect();
      const cX=e.touches?e.touches[0].clientX:e.clientX;
      const cY=e.touches?e.touches[0].clientY:e.clientY;
      setPos({
        x:Math.max(0,Math.min(rect.width-40*size,cX-rect.left-offset.current.x)),
        y:Math.max(0,Math.min(rect.height-60*size,cY-rect.top-offset.current.y)),
      });
    };
    const onUp=()=>{dragging.current=false};
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    window.addEventListener("touchmove",onMove,{passive:false});
    window.addEventListener("touchend",onUp);
    return()=>{window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);window.removeEventListener("touchmove",onMove);window.removeEventListener("touchend",onUp)};
  },[size,stageRef]);
  return(
    <div onMouseDown={onDown} onTouchStart={onDown}
      style={{position:"absolute",left:pos.x,top:pos.y,cursor:"grab",zIndex:Math.round(pos.y)}}
    >
      <Stickman index={index} frame={frame} size={size}/>
    </div>
  );
}

// ── Band Stage (border only, no black bg) ──
function BandStage({ count, frame, onDragStart }) {
  const stageRef=useRef(null);
  const seed=(i)=>{let s=(i+1)*7919;s=((s*1103515245+12345)>>>0)%1000;return s/1000};
  const n=Math.min(count,8), sz=n>5?0.8:1;
  return(
    <div ref={stageRef}
      className="relative h-36 overflow-hidden rounded-lg"
      style={{border:"1px solid #27272a"}}
      onMouseDown={onDragStart}
    >
      {[...Array(n)].map((_,i)=>(
        <DraggableStick key={i} index={i} frame={frame+i} size={sz}
          initX={seed(i)*(260-40*sz)+10} initY={seed(i+50)*(70-60*sz)+10} stageRef={stageRef}/>
      ))}
      {n > 0 && (
        <span style={{position:"absolute",top:8,right:12,fontFamily:"monospace",fontSize:10,fontWeight:500,color:"#52525b"}}>
          {count<=2?"~60":count<=4?"~120":count<=7?"~180":"~240"} BPM
        </span>
      )}
    </div>
  );
}

// ── Port Row ──
function PortRow({ port, onKill, onOpen, onCopy, killing, justCopied }) {
  const isCopied = justCopied === port.id;
  const btnBase = {height:26,width:26,display:"inline-flex",alignItems:"center",justifyContent:"center",borderRadius:5,background:"transparent",border:"none",cursor:"pointer",transition:"opacity 0.15s"};

  return(
    <div style={{display:"flex",alignItems:"center",padding:"7px 12px",borderRadius:6,opacity:killing?0.15:1,transform:killing?"translateX(80px)":"none",transition:"all 0.35s ease"}}>
      <div style={{width:20,display:"flex",justifyContent:"center",flexShrink:0}}><SvgIcon name={port.iconKey} size={15}/></div>
      <div style={{flex:1,marginLeft:10,minWidth:0}}>
        <div style={{display:"flex",alignItems:"baseline",gap:6}}>
          <span style={{fontSize:13,fontWeight:600,color:"#e4e4e7",fontVariantNumeric:"tabular-nums"}}>:{port.port}</span>
          <span style={{fontSize:12,color:"#71717a"}}>{port.name}</span>
        </div>
        <span style={{fontSize:10,color:"#52525b",fontFamily:"monospace"}}>PID {port.pid}</span>
      </div>

      {/* Always visible — simple, no hover tricks */}
      <div style={{display:"flex",alignItems:"center",gap:1}}>
        <button onClick={()=>onOpen(port)} aria-label="Open" style={{...btnBase,color:"#52525b"}}><ExternalLink s={12}/></button>
        <button onClick={()=>onCopy(port)} aria-label="Copy" style={{...btnBase,color:isCopied?"#34d399":"#52525b"}}>{isCopied?<CheckIcon s={12}/>:<CopyIcon s={12}/>}</button>
        <button onClick={()=>onKill(port)} aria-label="Kill" style={{...btnBase,color:"#ef4444"}}><XIcon s={12}/></button>
      </div>
    </div>
  );
}

// ── Live Pulse ──
function LivePulse() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/>
    </span>
  );
}

// ── Main ──
export default function PortBandApp() {
  const [ports,setPorts]=useState(services.slice(0,3));
  const [killingId,setKillingId]=useState(null);
  const [copied,setCopied]=useState(null);
  const [frame,setFrame]=useState(0);
  const [showHint,setShowHint]=useState(true);
  const count=ports.length;
  const sp=count===0?2000:count<=2?900:count<=4?450:count<=7?220:110;
  useEffect(()=>{const iv=setInterval(()=>setFrame(f=>f+1),sp);return()=>clearInterval(iv)},[sp]);

  const add=()=>{const n=services.find(s=>!ports.find(a=>a.id===s.id));if(n)setPorts(p=>[...p,n])};
  const kill=(port)=>{setKillingId(port.id);setTimeout(()=>{setPorts(p=>p.filter(x=>x.id!==port.id));setKillingId(null)},400)};
  const openPort=(port)=>{/* electron: shell.openExternal */};
  const copyUrl=(port)=>{
    navigator.clipboard?.writeText(`http://localhost:${port.port}`).catch(()=>{});
    setCopied(port.id);setTimeout(()=>setCopied(null),1500);
  };

  return(
    <div className="dark min-h-screen bg-zinc-950 flex flex-col items-center p-7" style={{fontFamily:'-apple-system,"SF Pro Display","Segoe UI",sans-serif'}}>
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-zinc-50 tracking-tight">🎸 PortBand</h1>
        <p className="text-zinc-600 text-sm mt-1">Your dev ports, your pixel band — $1.99</p>
      </div>

      <Tabs defaultValue="popover" className="w-full max-w-sm">
        <TabsList className="grid w-48 grid-cols-2 mx-auto mb-6">
          <TabsTrigger value="menubar">Menu Bar</TabsTrigger>
          <TabsTrigger value="popover">Popover</TabsTrigger>
        </TabsList>

        {/* ═══ MENU BAR ═══ */}
        <TabsContent value="menubar" className="max-w-lg mx-auto">
          <div className="flex items-center justify-end gap-3 px-3 h-7 rounded-t-lg border-b border-zinc-800" style={{background:"linear-gradient(180deg,#2c2c32,#222226)"}}>
            <span className="text-[11px] text-zinc-500">Wi-Fi</span>
            <span className="text-[11px] text-zinc-500">🔋</span>
            <div className="flex items-center bg-white/5 rounded px-1.5 h-5">
              <MenuBarHead count={count}/>
            </div>
            <span className="text-[10px] text-zinc-500">2월 21 토 3:42</span>
          </div>
          <Card className="rounded-t-none border-t-0" style={{background:"#18181b",borderColor:"#27272a"}}>
            <CardContent className="pt-4 pb-4">
              <p className="text-[11px] font-semibold text-zinc-500 tracking-widest uppercase mb-3">Headbanging Speed</p>
              {[
                {r:"0",bpm:"💤 Zzz",desc:"꾸벅꾸벅 졸기",bar:0,c:"#3f3f46"},
                {r:"1–2",bpm:"~60 BPM",desc:"발라드 끄덕",bar:25,c:"#4ECDC4"},
                {r:"3–4",bpm:"~120 BPM",desc:"팝록 리듬",bar:50,c:"#45B7D1"},
                {r:"5–7",bpm:"~180 BPM",desc:"하드록 뱅잉",bar:75,c:"#FFEAA7"},
                {r:"8+",bpm:"~240 BPM",desc:"데스메탈 풀파워",bar:100,c:"#FF6B6B"},
              ].map(item=>(
                <div key={item.r} className="flex items-center gap-2.5 mb-2.5">
                  <span className="text-[11px] text-zinc-500 w-7 text-right shrink-0">{item.r}</span>
                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{width:`${item.bar||2}%`,background:item.c}}/>
                  </div>
                  <span className="text-[10px] font-medium w-16 shrink-0" style={{color:item.c}}>{item.bpm}</span>
                  <span className="text-[10px] text-zinc-700 shrink-0">{item.desc}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ POPOVER ═══ */}
        <TabsContent value="popover">
          <div className="flex justify-end pr-10">
            <div className="w-2.5 h-2.5 bg-zinc-900 border border-zinc-800 border-b-0 border-r-0 -mb-1.5" style={{transform:"rotate(45deg)"}}/>
          </div>

          <Card className="shadow-2xl" style={{background:"#18181b",borderColor:"#27272a"}}>
            <CardHeader className="pb-2 pt-3 px-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm" style={{color:"#fafafa"}}>PortBand</CardTitle>
                  <Badge variant={count>0?"default":"secondary"} style={{fontSize:10,padding:"1px 8px",background:count>0?"rgba(52,211,153,0.1)":"#27272a",color:count>0?"#34d399":"#71717a",border:`1px solid ${count>0?"rgba(52,211,153,0.2)":"#3f3f46"}`}}>
                    {count} active
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" style={{color:"#71717a"}}>
                  <SettingsIcon s={14}/>
                </Button>
              </div>
            </CardHeader>

            {/* Single unified content area — no duplicate empty states */}
            {count === 0 ? (
              <CardContent className="px-2 pb-2">
                <div style={{height:144,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:8,border:"1px dashed #27272a"}}>
                  <p style={{fontSize:12,color:"#52525b"}}>No active ports</p>
                </div>
              </CardContent>
            ) : (
              <>
                <CardContent className="px-2 pb-2">
                  <div className="relative">
                    <BandStage count={count} frame={frame} onDragStart={()=>setShowHint(false)}/>
                    {showHint && (
                      <span style={{position:"absolute",bottom:6,left:0,right:0,textAlign:"center",fontSize:9,color:"#3f3f46",pointerEvents:"none"}} className="animate-pulse">
                        drag to rearrange
                      </span>
                    )}
                  </div>
                </CardContent>

                <div style={{height:1,background:"#27272a"}}/>

                <div className="px-1 py-1 max-h-64 overflow-y-auto">
                  {ports.map(p=>(
                    <PortRow key={p.id} port={p} onKill={kill} onOpen={openPort} onCopy={copyUrl} killing={killingId===p.id} justCopied={copied}/>
                  ))}
                </div>
              </>
            )}

            <div style={{height:1,background:"#27272a"}}/>

            <CardFooter className="px-3.5 py-2 flex justify-between items-center" style={{borderTop:"1px solid #27272a"}}>
              <div className="flex items-center gap-2">
                {count > 0 && <LivePulse/>}
                <span style={{fontSize:10,color:"#52525b"}}>{count > 0 ? "Watching ports" : "Idle"}</span>
              </div>
              {count>0&&(
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" style={{height:24,padding:"0 10px",fontSize:12,color:"#f87171"}}>Kill All</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent style={{background:"#18181b",borderColor:"#27272a"}}>
                    <AlertDialogHeader>
                      <AlertDialogTitle style={{color:"#fafafa"}}>Kill all {count} processes?</AlertDialogTitle>
                      <AlertDialogDescription style={{color:"#a1a1aa"}}>This will send SIGTERM to all listening processes.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel style={{background:"#27272a",color:"#e4e4e7",borderColor:"#3f3f46"}}>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={()=>setPorts([])}>Kill All</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Controls */}
      <div className="flex gap-2 mt-7 flex-wrap justify-center">
        <Button variant="outline" size="sm" onClick={add} disabled={count>=8}>+ Add Port</Button>
        <Button variant="destructive" size="sm" className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" onClick={()=>setPorts([])}>Clear All</Button>
        <Button variant="ghost" size="sm" onClick={()=>setPorts(services.slice(0,3))}>Reset (3)</Button>
        <Button variant="secondary" size="sm" onClick={()=>setPorts([...services])}>Full Band (8)</Button>
      </div>

      <p className="mt-4 text-zinc-700 text-[11px] text-center leading-relaxed">
        무대 위 캐릭터를 드래그해서 위치를 옮겨보세요<br/>
        실제 앱에서는 서비스별 AI 생성 2D 캐릭터로 교체 예정
      </p>
    </div>
  );
}
