import { useState, useEffect, useRef, useMemo } from "react";

/*
  ╔══════════════════════════════════════════════════════╗
  ║  STAKEIT WEBSITE V7 — 3 RECIPIENT MODES             ║
  ║  Anti-Charity (80%) · Friend (52%) · Charity (35%)  ║
  ║  70/30 split: 70% charity, 30% platform fee         ║
  ║  Dark premium theme · Outfit + IBM Plex Mono        ║
  ║                                                      ║
  ║  USER JOURNEYS:                                      ║
  ║  ✓ Landing → "Start Free" → 4-step onboarding       ║
  ║  ✓ Mode select with success rates explained          ║
  ║  ✓ Anti-charity: 16 fictional enemies + custom       ║
  ║  ✓ Friend: Name input + Venmo/Zelle reminder         ║
  ║  ✓ Charity: Pick from 6 real charities + Every.org   ║
  ║  ✓ Wallet load with 70/30 split disclosed            ║
  ║  ✓ Session: Setup → Timer → Reflect → Result → Share ║
  ║  ✓ Failure: Mode-specific messaging + recovery       ║
  ║  ✓ Empty wallet: Inline reload on all screens        ║
  ║  ✓ Quick Start: Capped to wallet, crash-safe         ║
  ║  ✓ Timer: Timestamp-based, survives refresh          ║
  ║  ✓ Analytics: 14-day chart, by-goal, insights        ║
  ║  ✓ Profile: Change mode/recipient, withdraw, export  ║
  ╚══════════════════════════════════════════════════════╝
*/

const C = {
  bg:"#0A0A10",surface:"#111118",card:"#16161F",elevated:"#1C1C28",
  accent:"#FF2E54",accentSoft:"#FF2E5410",accentMid:"#FF2E5425",
  green:"#22C55E",greenSoft:"#22C55E10",
  gold:"#EAB308",goldSoft:"#EAB30810",
  purple:"#A855F7",purpleSoft:"#A855F710",
  blue:"#3B82F6",cyan:"#06B6D4",orange:"#F97316",
  white:"#F8FAFC",t1:"#CBD5E1",t2:"#64748B",t3:"#475569",t4:"#334155",t5:"#1E293B",
  border:"#1E2030",borderLight:"#252538",
  danger:"#EF4444",dangerSoft:"#EF444410",
};

const MODES = [
  {id:"anti",label:"Anti-Charity",emoji:"😤",rate:80,desc:"Money goes to a cause you hate",color:C.accent,tip:"Research shows loss aversion to hated causes drives 80% completion rates."},
  {id:"friend",label:"Pay a Friend",emoji:"🤝",rate:52,desc:"Your friend gets your stake",color:C.gold,tip:"Social accountability adds pressure but friends may go easy on you."},
  {id:"charity",label:"Real Charity",emoji:"💚",rate:35,desc:"Donation to a real charity",color:C.green,tip:"Feels good but low pain = lower motivation. 70% goes to charity, 30% platform fee."},
];

const ENEMIES = [
  {id:"pizza",name:"Pineapple Pizza Alliance",emoji:"🍕"},
  {id:"monday",name:"Make Monday Longer Foundation",emoji:"📅"},
  {id:"comic",name:"Comic Sans Forever Society",emoji:"🔤"},
  {id:"nap",name:"Anti-Nap Coalition",emoji:"😈"},
  {id:"loud",name:"Loud Chewers Association",emoji:"🍿"},
  {id:"reply",name:"Reply-All Enthusiasts Club",emoji:"📧"},
  {id:"spoiler",name:"Movie Spoilers United",emoji:"🎬"},
  {id:"recline",name:"Full Recline Airlines Guild",emoji:"✈️"},
  {id:"rival",name:"Your Rival School Fund",emoji:"🏈"},
  {id:"ex",name:"Your Ex's Ego Fund",emoji:"💔"},
  {id:"flat",name:"Flat Earth Society",emoji:"🌍"},
  {id:"scroll",name:"Infinite Scroll Foundation",emoji:"📱"},
  {id:"robocall",name:"More Robocalls Foundation",emoji:"📞"},
  {id:"snooze",name:"Snooze Button Fund",emoji:"⏰"},
  {id:"decaf",name:"Mandatory Decaf Movement",emoji:"☕"},
  {id:"procras",name:"Procrastination Society",emoji:"🛋️"},
];

const CHARITIES = [
  {id:"redcross",name:"American Red Cross",emoji:"🏥",desc:"Disaster relief & emergency aid"},
  {id:"habitat",name:"Habitat for Humanity",emoji:"🏠",desc:"Building homes for families"},
  {id:"feedam",name:"Feeding America",emoji:"🍎",desc:"Fighting hunger nationwide"},
  {id:"stjude",name:"St. Jude Children's",emoji:"👶",desc:"Pediatric treatment & research"},
  {id:"wwf",name:"World Wildlife Fund",emoji:"🐼",desc:"Protecting endangered species"},
  {id:"other",name:"Choose on Every.org",emoji:"💚",desc:"Browse 1M+ verified nonprofits"},
];

const GOALS = [
  {id:"study",label:"Study",emoji:"📚"},{id:"workout",label:"Work Out",emoji:"💪"},
  {id:"write",label:"Write",emoji:"✍️"},{id:"meditate",label:"Meditate",emoji:"🧘"},
  {id:"deepwork",label:"Deep Work",emoji:"💻"},{id:"practice",label:"Practice",emoji:"🎸"},
  {id:"read",label:"Read",emoji:"📖"},{id:"custom",label:"Custom",emoji:"🎯"},
];
const DURS=[{v:.15,l:"9s ⚡"},{v:10,l:"10m"},{v:15,l:"15m"},{v:25,l:"25m"},{v:30,l:"30m"},{v:45,l:"45m"},{v:60,l:"1h"},{v:90,l:"1.5h"},{v:120,l:"2h"}];
const STAKES=[1,2,5,10,15,20,25,50];
const MILES=[
  {e:"🌱",t:"First Win",c:s=>s.filter(x=>x.ok).length>=1},
  {e:"💪",t:"5 Wins",c:s=>s.filter(x=>x.ok).length>=5},
  {e:"🔥",t:"3-Streak",c:(_,k)=>k>=3},
  {e:"⚡",t:"7-Streak",c:(_,k)=>k>=7},
  {e:"🏊",t:"1hr Session",c:s=>s.some(x=>x.ok&&x.dur>=60)},
  {e:"💰",t:"$50 Saved",c:s=>s.filter(x=>x.ok).reduce((a,x)=>a+x.stake,0)>=50},
  {e:"🎖️",t:"20 Wins",c:s=>s.filter(x=>x.ok).length>=20},
  {e:"🎨",t:"3 Goals",c:s=>new Set(s.filter(x=>x.ok).map(x=>x.goal)).size>=3},
];

// Helpers
const ld=async(k,d)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):d}catch{return d}};
const sv=async(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const rm=async k=>{try{localStorage.removeItem(k)}catch{}};
const fD=m=>{if(m<1)return`${Math.round(m*60)}s`;return m>=60?(m%60===0?`${m/60}h`:`${(m/60).toFixed(1)}h`):`${m}m`};
const dk=d=>new Date(d).toISOString().split("T")[0];
const f$=n=>(Math.round(n*100)/100).toFixed(2);
const fTime=d=>new Date(d).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
const fDate=d=>new Date(d).toLocaleDateString("en",{month:"short",day:"numeric"});
const getStreak=ss=>{if(!ss.length)return 0;const d=new Set();ss.filter(s=>s.ok).forEach(s=>d.add(dk(s.date)));let st=0;const t=new Date();for(let i=0;i<365;i++){const x=new Date(t);x.setDate(x.getDate()-i);if(d.has(dk(x)))st++;else if(i>0)break}return st};

// ═══════════════════════════════════════
// ROOT
// ═══════════════════════════════════════
export default function StakeItV7(){
  const[scr,setScr]=useState("load");
  const[user,setUser]=useState(null);
  const[sess,setSess]=useState([]);
  const[wal,setWal]=useState(0);
  const[act,setAct]=useState(null);

  useEffect(()=>{(async()=>{
    const u=await ld("v7u",null),s=await ld("v7s",[]),w=await ld("v7w",0),a=await ld("v7a",null);
    setUser(u);setSess(s);setWal(w);setAct(a);
    setScr(a&&u?"active":u?"home":"land");
  })()},[]);

  const sU=async u=>{setUser(u);await sv("v7u",u)};
  const sS=async s=>{setSess(s);await sv("v7s",s)};
  const sW=async w=>{const n=Math.round(w*100)/100;setWal(n);await sv("v7w",n)};
  const sA=async a=>{setAct(a);if(a)await sv("v7a",a);else await rm("v7a")};
  const p={user,sess,wal,go:setScr,sU,sS,sW,sA,act};

  if(scr==="load")return<Sh><Ctr><span style={{fontSize:40,animation:"pulse 1.4s infinite"}}>🔥</span></Ctr></Sh>;
  if(scr==="land")return<Landing go={setScr}/>;
  if(scr.startsWith("ob"))return<Onboard step={scr}{...p}/>;

  const tabs=[{id:"home",i:"⚡",l:"Home"},{id:"setup",i:"⏱",l:"Focus"},{id:"history",i:"📋",l:"History"},{id:"stats",i:"📊",l:"Stats"},{id:"me",i:"👤",l:"Profile"}];
  const full=["active","done","fail","reflect","share"].includes(scr);

  return(
    <Sh>
      <div style={{flex:1,overflowY:"auto",paddingBottom:full?0:66}}>
        {scr==="home"&&<Home{...p}/>}{scr==="setup"&&<Setup{...p}/>}
        {scr==="active"&&<ActiveTimer{...p}/>}{scr==="done"&&<Result ok={true}{...p}/>}
        {scr==="fail"&&<Result ok={false}{...p}/>}{scr==="reflect"&&<Reflect{...p}/>}
        {scr==="history"&&<History{...p}/>}{scr==="stats"&&<Stats{...p}/>}
        {scr==="me"&&<Prof{...p}/>}{scr==="share"&&<Share{...p}/>}
      </div>
      {!full&&<div style={S.nav}>{tabs.map(t=><button key={t.id} onClick={()=>setScr(t.id)} style={{...S.navBtn,color:scr===t.id?C.accent:C.t3}}><span style={{fontSize:15}}>{t.i}</span><span style={{fontSize:7,fontWeight:600}}>{t.l}</span></button>)}</div>}
    </Sh>
  );
}

function Sh({children}){return<div style={S.shell}><style>{CSS}</style>{children}</div>}
function Ctr({children}){return<div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>{children}</div>}
function Lbl({children}){return<p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:600,letterSpacing:2,color:C.t3,marginBottom:4,textTransform:"uppercase"}}>{children}</p>}
function Card({children,...props}){return<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,...(props.style||{})}}>{children}</div>}

// ═══════════════════════════════════════
// LANDING
// ═══════════════════════════════════════
function Landing({go}){
  const[faq,setFaq]=useState(null);
  return(
    <Sh><div style={{overflowY:"auto"}}>
      {/* Nav */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 20px",borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontFamily:"var(--d)",fontWeight:800,fontSize:17,color:C.white}}>Stake<span style={{color:C.accent}}>It</span></span>
        <button onClick={()=>go("ob1")} style={{fontFamily:"var(--d)",fontSize:10,fontWeight:700,color:"white",background:C.accent,border:"none",borderRadius:6,padding:"6px 14px",cursor:"pointer"}}>Start Free →</button>
      </div>

      {/* Hero */}
      <div style={{padding:"48px 24px 36px",position:"relative"}}>
        <div style={{position:"absolute",top:-80,right:-60,width:350,height:350,background:"radial-gradient(circle,rgba(255,46,84,.06),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:C.accentSoft,border:`1px solid ${C.accentMid}`,borderRadius:100,padding:"4px 12px",marginBottom:16}}>
            <span style={{fontFamily:"var(--m)",fontSize:9,fontWeight:600,color:C.accent}}>🧠 3 commitment modes · Based on Yale research</span>
          </div>
          <h1 style={{fontFamily:"var(--d)",fontSize:32,fontWeight:800,lineHeight:1.08,color:C.white,letterSpacing:-1.5,margin:"0 0 12px"}}>
            Three ways to<br/>make yourself <span style={{color:C.accent}}>focus</span>.
          </h1>
          <p style={{fontFamily:"var(--b)",fontSize:14,lineHeight:1.6,color:C.t2,maxWidth:340,margin:"0 0 24px"}}>
            Anti-charity, friend accountability, or real donation. Pick your consequence. Stake your money. Focus or pay.
          </p>
          <button onClick={()=>go("ob1")} style={{fontFamily:"var(--d)",fontSize:13,fontWeight:700,color:"white",background:"linear-gradient(135deg,#FF2E54,#FF6B8A)",border:"none",borderRadius:12,padding:"14px 28px",cursor:"pointer",width:"100%",maxWidth:300,boxShadow:"0 4px 16px rgba(255,46,84,.2)"}}>
            🔥 Try It Free — 60 Seconds
          </button>
          <p style={{fontFamily:"var(--m)",fontSize:8,color:C.t3,marginTop:8}}>No account · Free to use · 18+</p>
        </div>
      </div>

      {/* 3 Modes — KEY DIFFERENTIATOR */}
      <div style={{padding:"0 20px 32px"}}>
        <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:700,letterSpacing:2.5,color:C.accent,marginBottom:4}}>THREE MODES</p>
        <h2 style={{fontFamily:"var(--d)",fontSize:20,fontWeight:800,color:C.white,letterSpacing:-.5,margin:"0 0 12px"}}>Choose your consequence.</h2>
        
        {MODES.map((m,i)=>(
          <div key={m.id} style={{background:`${m.color}08`,border:`1px solid ${m.color}18`,borderRadius:14,padding:16,marginBottom:8,position:"relative",overflow:"hidden",animation:`fadeUp .4s ${i*.08}s ease both`}}>
            <div style={{position:"absolute",top:8,right:12}}><span style={{fontFamily:"var(--m)",fontSize:32,fontWeight:700,color:`${m.color}12`}}>{m.rate}%</span></div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:22}}>{m.emoji}</span>
              <div>
                <p style={{fontFamily:"var(--d)",fontSize:14,fontWeight:700,color:m.color,margin:0}}>{m.label}</p>
                <p style={{fontFamily:"var(--b)",fontSize:10,color:C.t2,margin:0}}>{m.desc}</p>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <div style={{flex:1,height:5,background:`${m.color}12`,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:3,background:m.color,width:`${m.rate}%`}}/>
              </div>
              <span style={{fontFamily:"var(--m)",fontSize:10,fontWeight:700,color:m.color}}>{m.rate}%</span>
            </div>
            <p style={{fontFamily:"var(--b)",fontSize:8,color:C.t3,fontStyle:"italic",margin:0}}>{m.tip}</p>
          </div>
        ))}
      </div>

      {/* How money works — 70/30 split */}
      <div style={{padding:"0 20px 32px"}}>
        <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:700,letterSpacing:2.5,color:C.gold,marginBottom:4}}>MONEY TRANSPARENCY</p>
        <h2 style={{fontFamily:"var(--d)",fontSize:20,fontWeight:800,color:C.white,letterSpacing:-.5,margin:"0 0 12px"}}>Where your money goes.</h2>
        <Card style={{padding:14}}>
          {[
            {emoji:"😤",title:"Anti-Charity Mode",lines:["Penalty keeps StakeIt free","Enemies are 100% fictional","Your loss funds the platform"]},
            {emoji:"🤝",title:"Friend Mode",lines:["You send your friend directly","Via Venmo, Zelle, or cash","StakeIt doesn't process it"]},
            {emoji:"💚",title:"Charity Mode",lines:["70% goes to your chosen charity","30% platform fee (disclosed)","Via Every.org with tax receipt"]},
          ].map((s,i)=>(
            <div key={i} style={{padding:"10px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <span style={{fontSize:14}}>{s.emoji}</span>
                <span style={{fontFamily:"var(--d)",fontSize:12,fontWeight:700,color:C.white}}>{s.title}</span>
              </div>
              {s.lines.map((l,j)=><p key={j} style={{fontFamily:"var(--b)",fontSize:9,color:C.t2,margin:"1px 0 1px 22px"}}>· {l}</p>)}
            </div>
          ))}
        </Card>
        <p style={{fontFamily:"var(--b)",fontSize:9,color:C.t3,textAlign:"center",marginTop:6}}>💸 Wallet balance always 100% withdrawable</p>
      </div>

      {/* How it works */}
      <div style={{padding:"0 20px 32px"}}>
        <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:700,letterSpacing:2.5,color:C.purple,marginBottom:4}}>HOW IT WORKS</p>
        {[
          {n:"01",t:"Choose your mode",d:"Anti-charity (80%), friend (52%), or charity (35%). Higher pain = higher success."},
          {n:"02",t:"Pick your recipient",d:"A fictional enemy, a real friend, or a verified charity. Then set goal, timer, and stake."},
          {n:"03",t:"Focus or pay",d:"Complete your session → keep everything. Quit → your recipient wins. Share your receipt."},
        ].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:12,marginBottom:14}}>
            <span style={{fontFamily:"var(--m)",fontSize:28,fontWeight:700,color:C.t4,lineHeight:1,flexShrink:0,width:32}}>{s.n}</span>
            <div><p style={{fontFamily:"var(--d)",fontSize:13,fontWeight:700,color:C.white,margin:"4px 0 2px"}}>{s.t}</p><p style={{fontFamily:"var(--b)",fontSize:10,color:C.t2,lineHeight:1.5,margin:0}}>{s.d}</p></div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{padding:"0 20px 32px"}}>
        <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:700,letterSpacing:2.5,color:C.t3,marginBottom:8}}>FAQ</p>
        {[
          ["Do enemies actually receive money?","No. Anti-charity enemies are fictional motivators. Your penalty funds the StakeIt platform."],
          ["How does the 70/30 charity split work?","In charity mode, 70% of your penalty goes to your chosen charity via Every.org. 30% covers platform costs."],
          ["How does friend mode work?","You're responsible for sending the money directly (Venmo, Zelle, etc). StakeIt tracks your commitment but doesn't process friend payments."],
          ["Can I get my balance back?","Yes. Unused wallet funds are always 100% withdrawable from your Profile."],
          ["Is this gambling?","No. You have 100% control. It's a commitment device — same concept studied at Yale and used by StickK."],
        ].map(([q,a],i)=>(
          <div key={i} style={{borderBottom:`1px solid ${C.border}`}}>
            <button onClick={()=>setFaq(faq===i?null:i)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"10px 0",background:"none",border:"none",cursor:"pointer"}}>
              <span style={{fontFamily:"var(--b)",fontSize:11,fontWeight:600,color:C.white,textAlign:"left"}}>{q}</span>
              <span style={{fontFamily:"var(--m)",color:C.t3,fontSize:16,transform:faq===i?"rotate(45deg)":"none",transition:"transform .15s",marginLeft:8,flexShrink:0}}>+</span>
            </button>
            {faq===i&&<p style={{fontFamily:"var(--b)",fontSize:10,color:C.t1,lineHeight:1.6,padding:"0 0 10px"}}>{a}</p>}
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{padding:"16px 20px 40px",textAlign:"center"}}>
        <h2 style={{fontFamily:"var(--d)",fontSize:22,fontWeight:800,color:C.white,letterSpacing:-.8,margin:"0 0 6px"}}>Pick your mode.</h2>
        <p style={{fontFamily:"var(--d)",fontSize:22,fontWeight:800,color:C.accent,letterSpacing:-.8,margin:"0 0 14px"}}>Start focusing.</p>
        <button onClick={()=>go("ob1")} style={{fontFamily:"var(--d)",fontSize:13,fontWeight:700,color:"white",background:"linear-gradient(135deg,#FF2E54,#FF6B8A)",border:"none",borderRadius:12,padding:"14px 28px",cursor:"pointer",width:"100%",maxWidth:260}}>🔥 Start Free</button>
        <p style={{fontFamily:"var(--m)",fontSize:7,color:C.t4,marginTop:14}}>© 2026 StakeIt · Privacy · Terms</p>
      </div>
    </div></Sh>
  );
}

// ═══════════════════════════════════════
// ONBOARDING — 4 Steps
// ═══════════════════════════════════════
function Onboard({step,go,sU,sW}){
  const[name,setName]=useState("");const[is18,setIs18]=useState(false);
  const[mode,setMode]=useState(null);
  const[enemy,setEnemy]=useState(null);const[customE,setCustomE]=useState("");
  const[friendN,setFriendN]=useState("");
  const[charity,setCharity]=useState(null);
  const Bk=({to})=><button onClick={()=>go(to)} style={{fontFamily:"var(--b)",color:C.t2,fontSize:10,background:"none",border:"none",cursor:"pointer",padding:"6px 0"}}>← Back</button>;

  // Step 1: Name + Age
  if(step==="ob1")return(
    <Sh><Ctr><div style={{textAlign:"center",padding:20,maxWidth:320,width:"100%"}}>
      <div style={{fontSize:40,marginBottom:10,animation:"fadeUp .4s ease"}}>🔥</div>
      <h1 style={{fontFamily:"var(--d)",fontSize:26,fontWeight:800,color:C.white,letterSpacing:-1,margin:"0 0 6px",animation:"fadeUp .4s .05s ease both"}}>Stake<span style={{color:C.accent}}>It</span></h1>
      <p style={{fontFamily:"var(--b)",color:C.t2,fontSize:12,margin:"0 0 18px",animation:"fadeUp .4s .1s ease both"}}>Three ways to make yourself focus.</p>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your first name" maxLength={20} style={{...S.input,animation:"fadeUp .4s .15s ease both"}} onKeyDown={e=>e.key==="Enter"&&name.trim()&&is18&&go("ob2")}/>
      <label style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center",margin:"12px 0",cursor:"pointer",animation:"fadeUp .4s .2s ease both"}}>
        <div onClick={()=>setIs18(!is18)} style={{width:16,height:16,borderRadius:3,border:`2px solid ${is18?C.green:C.t3}`,background:is18?C.green:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"white",transition:"all .12s",cursor:"pointer"}}>{is18?"✓":""}</div>
        <span style={{fontFamily:"var(--b)",color:C.t2,fontSize:10}}>I'm 18 or older</span>
      </label>
      <button onClick={()=>name.trim()&&is18&&go("ob2")} disabled={!name.trim()||!is18} style={{...S.btn,opacity:name.trim()&&is18?1:.3,animation:"fadeUp .4s .25s ease both"}}>Continue →</button>
    </div></Ctr></Sh>
  );

  // Step 2: Choose Mode
  if(step==="ob2")return(
    <Sh><div style={{padding:"28px 16px",maxWidth:440,margin:"0 auto"}}><Bk to="ob1"/>
      <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:600,letterSpacing:2,color:C.accent,margin:"0 0 2px"}}>STEP 1 OF 3</p>
      <h2 style={{fontFamily:"var(--d)",fontSize:18,fontWeight:800,color:C.white,letterSpacing:-.5,margin:"0 0 4px"}}>Choose your mode</h2>
      <p style={{fontFamily:"var(--b)",fontSize:10,color:C.t2,margin:"0 0 12px"}}>How should you be punished for quitting?</p>
      
      {MODES.map((m,i)=>{const sel=mode?.id===m.id;return(
        <button key={m.id} onClick={()=>setMode(m)} style={{width:"100%",background:sel?`${m.color}0A`:"transparent",border:`1.5px solid ${sel?m.color+"40":C.border}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"left",marginBottom:6,transition:"all .12s",animation:`fadeUp .3s ${i*.06}s ease both`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20}}>{m.emoji}</span>
              <div><p style={{fontFamily:"var(--d)",fontSize:13,fontWeight:700,color:sel?m.color:C.white,margin:0}}>{m.label}</p><p style={{fontFamily:"var(--b)",fontSize:9,color:C.t2,margin:0}}>{m.desc}</p></div>
            </div>
            <div style={{textAlign:"right"}}><span style={{fontFamily:"var(--m)",fontSize:18,fontWeight:700,color:sel?m.color:C.t3}}>{m.rate}%</span><p style={{fontFamily:"var(--m)",fontSize:6,color:C.t3,margin:0}}>success</p></div>
          </div>
        </button>
      )})}
      <button onClick={()=>go("ob3")} disabled={!mode} style={{...S.btn,marginTop:6,opacity:mode?1:.3}}>Next →</button>
    </div></Sh>
  );

  // Step 3: Mode-specific recipient
  if(step==="ob3"){
    const isA=mode?.id==="anti",isF=mode?.id==="friend",isC=mode?.id==="charity";
    const valid=isA?(enemy||customE.trim()):isF?friendN.trim():isC?charity:false;
    return(
      <Sh><div style={{padding:"28px 16px",maxWidth:440,margin:"0 auto"}}><Bk to="ob2"/>
        <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:600,letterSpacing:2,color:mode?.color,margin:"0 0 2px"}}>STEP 2 OF 3</p>
        <h2 style={{fontFamily:"var(--d)",fontSize:18,fontWeight:800,color:C.white,letterSpacing:-.5,margin:"0 0 4px"}}>
          {isA?"Pick your enemy":isF?"Name your friend":"Choose a charity"}
        </h2>
        <p style={{fontFamily:"var(--b)",fontSize:10,color:C.t2,margin:"0 0 10px"}}>
          {isA?"Who do you NOT want winning? All fictional.":isF?"Who gets your money when you quit?":"Where should your penalty be donated?"}
        </p>

        {isA&&<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,maxHeight:220,overflowY:"auto",marginBottom:6}}>
            {ENEMIES.map(e=>{const sel=enemy?.id===e.id&&!customE;return(
              <button key={e.id} onClick={()=>{setEnemy(e);setCustomE("")}} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 8px",border:`1.5px solid ${sel?C.danger:C.border}`,borderRadius:8,background:sel?C.dangerSoft:"transparent",cursor:"pointer",textAlign:"left",transition:"all .1s"}}>
                <span style={{fontSize:14}}>{e.emoji}</span>
                <p style={{fontFamily:"var(--b)",fontSize:8,fontWeight:600,color:sel?C.white:C.t1,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{e.name}</p>
              </button>
            )})}
          </div>
          <input value={customE} onChange={e=>{setCustomE(e.target.value);setEnemy(null)}} placeholder='✏️ Or custom enemy...' maxLength={30} style={{...S.input,fontSize:10}}/>
        </>}

        {isF&&<>
          <input value={friendN} onChange={e=>setFriendN(e.target.value)} placeholder="Friend's name" maxLength={20} style={{...S.input,fontSize:12,marginBottom:6}}/>
          <div style={{background:C.goldSoft,border:`1px solid ${C.gold}15`,borderRadius:8,padding:10}}>
            <p style={{fontFamily:"var(--b)",fontSize:9,color:C.gold,margin:0}}>💡 You'll send money directly via Venmo, Zelle, or cash. StakeIt tracks your commitment — you handle the transfer.</p>
          </div>
        </>}

        {isC&&<>
          <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:6}}>
            {CHARITIES.map(ch=>{const sel=charity?.id===ch.id;return(
              <button key={ch.id} onClick={()=>setCharity(ch)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",border:`1.5px solid ${sel?C.green:C.border}`,borderRadius:10,background:sel?C.greenSoft:"transparent",cursor:"pointer",textAlign:"left",transition:"all .1s"}}>
                <span style={{fontSize:16}}>{ch.emoji}</span>
                <div style={{flex:1}}><p style={{fontFamily:"var(--d)",fontSize:11,fontWeight:700,color:sel?C.green:C.white,margin:0}}>{ch.name}</p><p style={{fontFamily:"var(--b)",fontSize:8,color:C.t2,margin:0}}>{ch.desc}</p></div>
                {sel&&<span style={{color:C.green,fontSize:14}}>✓</span>}
              </button>
            )})}
          </div>
          <div style={{background:`${C.gold}08`,border:`1px solid ${C.gold}12`,borderRadius:8,padding:8}}>
            <p style={{fontFamily:"var(--b)",fontSize:8,color:C.gold,margin:0}}>⚠️ 70% of your penalty goes to this charity. 30% is a platform fee. Processed via Every.org.</p>
          </div>
        </>}

        <button onClick={()=>go("ob4")} disabled={!valid} style={{...S.btn,marginTop:8,opacity:valid?1:.3}}>Next →</button>
      </div></Sh>
    );
  }

  // Step 4: Wallet
  if(step==="ob4"){
    const recipient=mode?.id==="anti"?(customE.trim()?{id:"custom",name:customE.trim(),emoji:"😤"}:enemy):mode?.id==="friend"?{id:"friend",name:friendN.trim(),emoji:"🤝"}:charity;
    return(
      <Sh><div style={{padding:"28px 16px",maxWidth:440,margin:"0 auto"}}><Bk to="ob3"/>
        <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:600,letterSpacing:2,color:C.gold,margin:"0 0 2px"}}>STEP 3 OF 3</p>
        <h2 style={{fontFamily:"var(--d)",fontSize:18,fontWeight:800,color:C.white,letterSpacing:-.5,margin:"0 0 4px"}}>Load your wallet</h2>
        <p style={{fontFamily:"var(--b)",fontSize:10,color:C.t2,margin:"0 0 8px"}}>Your commitment fund. Complete sessions = keep it all.</p>
        
        <div style={{background:`${mode?.color}08`,border:`1px solid ${mode?.color}15`,borderRadius:10,padding:"8px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>{recipient?.emoji}</span>
          <div>
            <p style={{fontFamily:"var(--d)",fontSize:10,fontWeight:700,color:mode?.color,margin:0}}>Quit = {recipient?.name} wins</p>
            <p style={{fontFamily:"var(--m)",fontSize:7,color:C.t3,margin:0}}>{mode?.label} mode · {mode?.rate}% success rate</p>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[10,25,50,100].map(amt=>(
            <button key={amt} onClick={()=>{sU({name,mode,recipient,anonShare:false,created:Date.now()});sW(amt);go("home")}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 6px",cursor:"pointer",textAlign:"center",transition:"all .1s"}}>
              <p style={{fontFamily:"var(--m)",fontSize:22,fontWeight:700,color:C.white,margin:0}}>${amt}</p>
              <p style={{fontFamily:"var(--b)",fontSize:8,color:C.t3,margin:"2px 0 0"}}>{amt<=10?"Try it":amt<=25?"Solid":amt<=50?"Committed":"All in 🔥"}</p>
            </button>
          ))}
        </div>
        <p style={{fontFamily:"var(--m)",color:C.t3,fontSize:6,textAlign:"center",marginTop:8,lineHeight:1.5}}>
          🔒 Balance always withdrawable · Data on-device only
          {mode?.id==="charity"&&" · 70% charity / 30% platform fee"}
        </p>
      </div></Sh>
    );
  }
}

// ═══════════════════════════════════════
// HOME
// ═══════════════════════════════════════
function Home({user,sess,wal,go,sW}){
  const sk=getStreak(sess);const r=user?.recipient||{};const m=user?.mode||{};
  const saved=sess.filter(s=>s.ok).reduce((a,s)=>a+s.stake,0);
  const lost=sess.filter(s=>!s.ok).reduce((a,s)=>a+s.stake,0);
  const hrs=(sess.reduce((a,s)=>a+(s.ok?s.actual||0:0),0)/60).toFixed(1);
  const lastOk=sess.filter(s=>s.ok).slice(-1)[0];
  const[showAdd,setShowAdd]=useState(false);

  return(<div style={S.page}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div><p style={{fontFamily:"var(--b)",color:C.t2,fontSize:9,margin:0}}>Welcome back</p><h1 style={{fontFamily:"var(--d)",fontSize:19,fontWeight:800,color:C.white,letterSpacing:-.5,margin:0}}>{user?.name}</h1></div>
      {sk>0&&<div style={{background:"linear-gradient(135deg,#FF2E54,#FF6B8A)",borderRadius:7,padding:"2px 7px",display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:9}}>🔥</span><span style={{fontFamily:"var(--m)",color:"white",fontWeight:700,fontSize:11}}>{sk}</span></div>}
    </div>

    <Card style={{padding:"12px 14px",marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><Lbl>WALLET</Lbl><span style={{fontFamily:"var(--m)",fontSize:24,fontWeight:700,color:C.white}}>${f$(wal)}</span></div>
        <button onClick={()=>setShowAdd(!showAdd)} style={{...S.btnSm,background:C.accentSoft,color:C.accent,borderColor:C.accentMid}}>+ Add</button>
      </div>
      {showAdd&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,marginTop:6}}>{[5,10,25,50].map(a=><button key={a} onClick={async()=>{await sW(wal+a);setShowAdd(false)}} style={{fontFamily:"var(--m)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:6,fontSize:10,fontWeight:700,color:C.white,cursor:"pointer"}}>+${a}</button>)}</div>}
      {wal<1&&!showAdd&&<p style={{fontFamily:"var(--b)",color:C.gold,fontSize:9,marginTop:3}}>⚠️ Add funds to start</p>}
    </Card>

    <div style={{background:`${m.color||C.accent}08`,border:`1px solid ${m.color||C.accent}15`,borderRadius:10,padding:"7px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:7}}>
      <span style={{fontSize:15}}>{r.emoji}</span>
      <div><p style={{fontFamily:"var(--m)",fontSize:6,fontWeight:600,letterSpacing:1.5,color:m.color||C.accent,margin:0}}>{m.label?.toUpperCase()||"MODE"}</p><p style={{fontFamily:"var(--d)",fontSize:10,fontWeight:700,color:C.white,margin:0}}>{r.name}</p></div>
    </div>

    {lastOk&&wal>=1&&<button onClick={async()=>{const stake=Math.min(lastOk.stake,Math.floor(wal));if(stake<1)return;const ss={goal:lastOk.goal,goalLabel:lastOk.goalLabel,goalEmoji:lastOk.goalEmoji,dur:lastOk.dur,stake,mode:user.mode,recipient:user.recipient,startTime:Date.now(),pausedTime:0};await sv("v7a",JSON.stringify(ss));window.__ss=ss;go("active")}} style={{background:C.accentSoft,border:`1px solid ${C.accentMid}`,borderRadius:9,width:"100%",padding:"8px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:7,cursor:"pointer",textAlign:"left"}}><span style={{fontSize:12}}>⚡</span><div style={{flex:1}}><p style={{fontFamily:"var(--d)",color:C.accent,fontSize:9,fontWeight:700,margin:0}}>Quick Start</p><p style={{fontFamily:"var(--b)",color:C.t3,fontSize:8,margin:0}}>{lastOk.goalEmoji} {lastOk.goalLabel} · {fD(lastOk.dur)} · ${Math.min(lastOk.stake,Math.floor(wal))}</p></div><span style={{color:C.accent,fontSize:11}}>→</span></button>}

    <button onClick={()=>wal>=1?go("setup"):setShowAdd(true)} style={S.btn}>{wal>=1?"⏱ Start Focus Session":"💰 Add Funds to Start"}</button>

    {sess.length>=1&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginTop:6}}>{[{l:"Saved",v:`$${f$(saved)}`,c:C.green},{l:"Lost",v:`$${f$(lost)}`,c:C.danger},{l:"Focus",v:`${hrs}h`,c:C.purple}].map((s,i)=>(<Card key={i} style={{padding:"6px 3px",textAlign:"center"}}><p style={{fontFamily:"var(--m)",color:s.c,fontSize:14,fontWeight:700,margin:0}}>{s.v}</p><p style={{fontFamily:"var(--m)",color:C.t3,fontSize:6,margin:0}}>{s.l}</p></Card>))}</div>}

    <Card style={{padding:"8px 10px",marginTop:6}}><p style={{fontFamily:"var(--d)",color:C.white,fontSize:9,fontWeight:700,margin:"0 0 4px"}}>🏆 Milestones</p><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{MILES.map((m,i)=>{const u=m.c(sess,sk);return<div key={i} title={m.t} style={{width:26,height:26,borderRadius:6,background:u?C.goldSoft:C.t5,border:`1px solid ${u?C.gold+"18":C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,opacity:u?1:.2}}>{m.e}</div>})}</div></Card>
  </div>);
}

// ═══════════════════════════════════════
// SETUP + TIMER + REFLECT + RESULT + SHARE
// ═══════════════════════════════════════
function Setup({user,wal,go,sA}){
  const[goal,setGoal]=useState(GOALS[0]);const[cG,setCG]=useState("");const[dur,setDur]=useState(25);const[stake,setStake]=useState(Math.min(5,Math.floor(wal)));
  const gL=goal.id==="custom"?cG.trim():goal.label;const ok=wal>=stake&&stake>=1&&gL;const r=user?.recipient||{};const m=user?.mode||{};
  return(<div style={S.page}>
    <h2 style={{fontFamily:"var(--d)",fontSize:17,fontWeight:800,color:C.white,marginBottom:10}}>New Session</h2>
    <Lbl>GOAL</Lbl>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,marginBottom:goal.id==="custom"?3:10}}>{GOALS.map(g=><button key={g.id} onClick={()=>setGoal(g)} style={{background:goal.id===g.id?C.accentSoft:C.card,border:`1.5px solid ${goal.id===g.id?C.accent:C.border}`,borderRadius:8,padding:"5px 2px",cursor:"pointer",textAlign:"center"}}><span style={{fontSize:13,display:"block"}}>{g.emoji}</span><span style={{fontFamily:"var(--b)",fontSize:7,fontWeight:600,color:goal.id===g.id?C.accent:C.t2}}>{g.label}</span></button>)}</div>
    {goal.id==="custom"&&<input value={cG} onChange={e=>setCG(e.target.value)} placeholder="Goal?" maxLength={40} style={{...S.input,fontSize:10,marginBottom:10}}/>}
    <Lbl>DURATION</Lbl>
    <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>{DURS.map(d=><button key={d.v} onClick={()=>setDur(d.v)} style={{fontFamily:"var(--m)",padding:"4px 7px",border:`1.5px solid ${dur===d.v?C.accent:C.border}`,borderRadius:5,background:dur===d.v?C.accentSoft:"transparent",color:dur===d.v?C.accent:C.t2,fontSize:9,fontWeight:600,cursor:"pointer"}}>{d.l}</button>)}</div>
    <Lbl>STAKE — ${f$(wal)} available</Lbl>
    <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>{STAKES.map(s=><button key={s} onClick={()=>s<=wal&&setStake(s)} style={{fontFamily:"var(--m)",padding:"4px 7px",border:`1.5px solid ${stake===s?C.danger:C.border}`,borderRadius:5,background:stake===s?C.dangerSoft:"transparent",color:stake===s?C.danger:s>wal?C.t4:C.t2,fontSize:9,fontWeight:600,cursor:"pointer",opacity:s>wal?.3:1}}>${s}</button>)}</div>
    <div style={{background:`${m.color||C.accent}08`,border:`1px solid ${m.color||C.accent}15`,borderRadius:10,padding:"8px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:7}}>
      <span style={{fontSize:16}}>{r.emoji}</span>
      <div><p style={{fontFamily:"var(--d)",fontSize:10,fontWeight:700,color:m.color||C.danger,margin:0}}>Quit = {r.name} wins ${stake}</p><p style={{fontFamily:"var(--m)",color:C.t3,fontSize:8,margin:0}}>{m.label} · {dur<1?`Demo ${Math.round(dur*60)}s`:`Ends ${new Date(Date.now()+dur*60000).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`}</p></div>
    </div>
    <button onClick={async()=>{if(!ok)return;const ss={goal:goal.id,goalLabel:gL,goalEmoji:goal.emoji,dur,stake,mode:user.mode,recipient:user.recipient,startTime:Date.now(),pausedTime:0};await sA(ss);window.__ss=ss;go("active")}} disabled={!ok} style={{...S.btn,opacity:ok?1:.3}}>🔒 Lock In — ${stake}</button>
  </div>);
}

function ActiveTimer({user,wal,sW,sess,sS,go,act,sA}){
  const ss=act||window.__ss;if(!ss){go("home");return null}
  const tot=Math.round(ss.dur*60);const[left,setLeft]=useState(tot);const[paused,setPaused]=useState(false);const[pN,setPN]=useState(0);const[pL,setPL]=useState(60);const[showQ,setShowQ]=useState(false);
  const done=useRef(false);const pRef=useRef(ss.pausedTime||0);const psRef=useRef(null);const start=ss.startTime||Date.now();
  useEffect(()=>{const t=()=>{if(paused)return;const el=Math.floor((Date.now()-start-pRef.current)/1000);const r=Math.max(0,tot-el);setLeft(r);if(r<=0&&!done.current){done.current=true;fin(true)}};t();const id=setInterval(t,250);return()=>clearInterval(id)},[paused]);
  useEffect(()=>{if(!paused)return;psRef.current=Date.now();const id=setInterval(()=>{const u=Math.floor((Date.now()-psRef.current)/1000);setPL(Math.max(0,60-u));if(u>=60){clearInterval(id);unp()}},500);return()=>clearInterval(id)},[paused]);
  const unp=()=>{if(psRef.current){pRef.current+=Date.now()-psRef.current;psRef.current=null}setPaused(false)};
  const doP=()=>{if(pN>=2)return;setPaused(true);setPN(n=>n+1);setPL(60)};
  const fin=async(ok)=>{if(done.current==="x")return;done.current="x";const el=Math.max(1,Math.round((Date.now()-start-pRef.current)/60000));if(!ok)await sW(Math.max(0,wal-ss.stake));await sS([...sess,{...ss,ok,date:Date.now(),actual:ok?ss.dur:el}]);await sA(null);go(ok?"reflect":"fail")};
  const pct=((tot-left)/tot)*100;const m=Math.floor(left/60),sec=left%60;const circ=2*Math.PI*98;const r=ss.recipient||{};

  return(<Sh><Ctr><div style={{textAlign:"center",padding:16}}>
    {showQ&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",backdropFilter:"blur(12px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <Card style={{padding:18,maxWidth:260,textAlign:"center"}}><p style={{fontSize:30,marginBottom:3}}>{r.emoji}</p><h3 style={{fontFamily:"var(--d)",color:C.white,fontSize:15,fontWeight:800,margin:"0 0 3px"}}>Quit?</h3><p style={{fontFamily:"var(--b)",color:C.danger,fontSize:11,fontWeight:700,margin:"0 0 10px"}}>{r.name} wins ${ss.stake}</p>
        <button onClick={()=>fin(false)} style={{...S.btn,background:"linear-gradient(135deg,#EF4444,#F87171)",marginBottom:4}}>💀 Quit — Lose ${ss.stake}</button>
        <button onClick={()=>setShowQ(false)} style={{...S.btnSec,width:"100%"}}>💪 Keep Going</button>
      </Card>
    </div>}
    <div style={{position:"relative",width:216,height:216,marginBottom:10}}>
      <svg width="216" height="216" style={{transform:"rotate(-90deg)"}}><circle cx="108" cy="108" r="98" fill="none" stroke={C.t5} strokeWidth="4"/><circle cx="108" cy="108" r="98" fill="none" stroke={paused?C.gold:C.accent} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ} strokeLinecap="round" style={{transition:"stroke-dashoffset .3s"}}/></svg>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
        <p style={{fontFamily:"var(--m)",color:paused?C.gold:C.white,fontSize:34,fontWeight:700,margin:0,letterSpacing:-2}}>{String(m).padStart(2,"0")}:{String(sec).padStart(2,"0")}</p>
        <p style={{fontFamily:"var(--b)",color:C.t2,fontSize:9,margin:"2px 0"}}>{ss.goalEmoji} {ss.goalLabel}</p>
        <p style={{fontFamily:"var(--m)",color:C.danger,fontSize:8}}>${ss.stake} at stake</p>
      </div>
    </div>
    {paused&&<div style={{background:C.goldSoft,borderRadius:5,padding:"2px 8px",marginBottom:2}}><p style={{fontFamily:"var(--m)",color:C.gold,fontSize:9,fontWeight:600,margin:0}}>⏸ {pL}s</p></div>}
    <p style={{fontFamily:"var(--m)",color:C.t3,fontSize:8,marginBottom:8}}>Pauses: {pN}/2</p>
    <div style={{display:"flex",gap:10}}><button onClick={paused?unp:doP} disabled={!paused&&pN>=2} style={{...S.circBtn,borderColor:paused?C.gold:C.t4,opacity:!paused&&pN>=2?.3:1}}>{paused?"▶":"⏸"}</button><button onClick={()=>setShowQ(true)} style={{...S.circBtn,borderColor:`${C.danger}35`,color:C.danger}}>✕</button></div>
  </div></Ctr></Sh>);
}

function Reflect({sess,sS,go}){
  const s=sess[sess.length-1];if(!s){go("done");return null}const[note,setNote]=useState("");const[r,setR]=useState(0);
  return(<Sh><Ctr><div style={{textAlign:"center",maxWidth:280,width:"100%",padding:16,animation:"fadeUp .3s ease"}}>
    <p style={{fontSize:40,marginBottom:4}}>🎉</p><h2 style={{fontFamily:"var(--d)",color:C.green,fontSize:16,fontWeight:800,margin:"0 0 3px"}}>Complete!</h2>
    <p style={{fontFamily:"var(--b)",color:C.t2,fontSize:10,margin:"0 0 14px"}}>{s.goalEmoji} {fD(s.dur)} — <span style={{color:C.green,fontWeight:700}}>${s.stake} saved</span></p>
    <p style={{fontFamily:"var(--d)",color:C.white,fontSize:9,fontWeight:700,marginBottom:4,textAlign:"left"}}>Focus quality?</p>
    <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:8}}>{["😵","😐","🙂","😊","🔥"].map((e,i)=><button key={i} onClick={()=>setR(i+1)} style={{fontSize:20,background:r===i+1?C.accentSoft:"none",border:`2px solid ${r===i+1?C.accent:"transparent"}`,borderRadius:6,padding:2,cursor:"pointer",opacity:r&&r!==i+1?.2:1,transition:"all .1s"}}>{e}</button>)}</div>
    <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Quick note..." maxLength={100} style={{...S.input,fontSize:10,marginBottom:8}}/>
    <button onClick={async()=>{if(note.trim()||r){const u=[...sess];u[u.length-1]={...u[u.length-1],note:note.trim(),rating:r};await sS(u)}go("done")}} style={S.btn}>{note.trim()||r?"Save →":"Skip →"}</button>
  </div></Ctr></Sh>);
}

function Result({ok,sess,go,user,wal,sW}){
  const s=sess[sess.length-1];if(!s)return null;const r=s.recipient||user?.recipient||{};const m=s.mode||user?.mode||{};const[showAdd,setShowAdd]=useState(false);
  const failMsg=m.id==="anti"?"Penalty keeps StakeIt free.":m.id==="friend"?`Send ${r.name} $${s.stake} via Venmo/Zelle.`:`70% ($${(s.stake*.7).toFixed(2)}) to ${r.name}. 30% platform fee.`;
  return(<Sh><Ctr><div style={{textAlign:"center",animation:"fadeUp .3s ease",maxWidth:280,width:"100%",padding:16}}>
    <p style={{fontSize:40,marginBottom:4}}>{ok?"🎉":r.emoji||"💀"}</p>
    <h2 style={{fontFamily:"var(--d)",color:ok?C.green:C.danger,fontSize:16,fontWeight:800,margin:"0 0 3px"}}>{ok?"Well Done!":`${r.name} Wins.`}</h2>
    <p style={{fontFamily:"var(--b)",color:C.t2,fontSize:10,margin:"0 0 12px"}}>{ok?<>{s.goalEmoji} {fD(s.dur)} — <span style={{color:C.green,fontWeight:700}}>${s.stake} saved</span></>:<>Lasted {s.actual}m of {fD(s.dur)}. <span style={{color:C.danger,fontWeight:700}}>${s.stake} lost</span>.</>}</p>
    
    {ok?<div style={{background:C.greenSoft,border:`1px solid ${C.green}12`,borderRadius:9,padding:8,marginBottom:10}}><p style={{fontFamily:"var(--b)",color:C.green,fontSize:10,margin:0}}>{r.emoji} {r.name} gets nothing.</p></div>
    :<>
      <div style={{background:C.dangerSoft,border:`1px solid ${C.danger}12`,borderRadius:9,padding:8,marginBottom:5}}>
        <p style={{fontFamily:"var(--d)",color:C.danger,fontSize:10,fontWeight:700,margin:"0 0 2px"}}>{r.emoji} {r.name} wins ${s.stake}</p>
        <p style={{fontFamily:"var(--b)",color:C.t3,fontSize:8,margin:0}}>{failMsg}</p>
      </div>
      {(m.id==="charity"||m.id==="friend")&&<button onClick={()=>window.open("https://www.every.org","_blank")} style={{background:C.greenSoft,border:`1px solid ${C.green}12`,borderRadius:7,width:"100%",padding:6,marginBottom:5,cursor:"pointer"}}><p style={{fontFamily:"var(--b)",color:C.green,fontSize:8,fontWeight:600,margin:0}}>{m.id==="charity"?"💚 Complete donation on Every.org →":"💚 Want to donate to charity too? → every.org"}</p></button>}
      {wal<1&&!showAdd&&<button onClick={()=>setShowAdd(true)} style={{background:C.goldSoft,border:`1px solid ${C.gold}12`,borderRadius:7,width:"100%",padding:6,marginBottom:5,cursor:"pointer"}}><p style={{fontFamily:"var(--b)",color:C.gold,fontSize:8,fontWeight:700,margin:0}}>⚠️ Wallet empty — reload</p></button>}
      {showAdd&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2,marginBottom:5}}>{[5,10,25,50].map(a=><button key={a} onClick={async()=>{await sW(wal+a);setShowAdd(false)}} style={{fontFamily:"var(--m)",background:C.card,border:`1px solid ${C.border}`,borderRadius:5,padding:5,fontSize:10,fontWeight:700,color:C.white,cursor:"pointer"}}>+${a}</button>)}</div>}
    </>}
    <div style={{display:"flex",gap:5}}><button onClick={()=>go("share")} style={{...S.btnSec,flex:1,fontSize:9}}>{ok?"🔥 Share":"📸 Receipt"}</button><button onClick={()=>go("home")} style={{...(ok?{...S.btn,background:"linear-gradient(135deg,#22C55E,#4ADE80)"}:S.btn),flex:1}}>{ok?"Home":"Try Again"}</button></div>
  </div></Ctr></Sh>);
}

function Share({user,sess,go}){
  const s=sess[sess.length-1];if(!s)return null;const[cp,setCp]=useState(false);const ok=s.ok;const sk=getStreak(sess);const r=s.recipient||{};const m=s.mode||{};
  const nm=user?.anonShare?"Someone":(user?.name||"Someone");
  const txt=ok?`🔥 ${fD(s.dur)} of ${s.goalLabel}. $${s.stake} saved. ${r.name} gets NOTHING.${sk>2?` ${sk}-day streak.`:""}\nStakeIt 🔥`:`💀 ${nm} lost $${s.stake} to ${r.name} (${m.label}). Only lasted ${s.actual}m.\nStakeIt 🔥`;
  const copy=()=>{navigator.clipboard?.writeText(txt);setCp(true);setTimeout(()=>setCp(false),2000)};
  return(<Sh><Ctr><div style={{padding:14}}>
    <Card style={{borderColor:`${ok?C.green:C.danger}15`,borderRadius:14,padding:16,textAlign:"center",maxWidth:230,width:"100%",marginBottom:10}}>
      <p style={{fontSize:24,marginBottom:2}}>{ok?"🔥":r.emoji||"💀"}</p>
      <p style={{fontFamily:"var(--m)",color:ok?C.green:C.danger,fontSize:6,fontWeight:700,letterSpacing:2}}>{ok?"SESSION COMPLETE":"FAILURE RECEIPT"}</p>
      <p style={{fontFamily:"var(--m)",color:C.white,fontSize:24,fontWeight:700,margin:"1px 0"}}>${s.stake}</p>
      <p style={{fontFamily:"var(--m)",color:ok?C.green:C.danger,fontSize:9,fontWeight:700,marginBottom:4}}>{ok?"SAVED":`lost to ${r.name}`}</p>
      <div style={{borderTop:`1px dashed ${C.border}`,paddingTop:4}}><p style={{fontFamily:"var(--b)",color:C.t3,fontSize:7}}>{s.goalEmoji} {s.goalLabel} · {m.label} · {ok?fD(s.dur):`${s.actual}m/${fD(s.dur)}`}</p></div>
    </Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,maxWidth:230,width:"100%",marginBottom:4}}>
      {[{l:"📷 Story",bg:"linear-gradient(135deg,#833AB4,#FD1D1D,#F77737)"},{l:"🎵 TikTok",bg:"#010101"},{l:"💬 Text",bg:C.green,sms:true},{l:cp?"✅":"📋 Copy",bg:C.card,bdr:true}].map((p,i)=>(
        <button key={i} onClick={()=>{copy();if(p.sms)window.open(`sms:?body=${encodeURIComponent(txt)}`,"_self")}} style={{padding:"7px 5px",border:p.bdr?`1px solid ${C.border}`:"none",borderRadius:7,background:p.bg,color:"white",fontSize:9,fontWeight:700,cursor:"pointer",fontFamily:"var(--b)"}}>{p.l}</button>
      ))}
    </div>
    <button onClick={()=>go("home")} style={{...S.btnSec,maxWidth:230,width:"100%",fontSize:8}}>← Home</button>
  </div></Ctr></Sh>);
}

// ═══════════════════════════════════════
// HISTORY + STATS + PROFILE
// ═══════════════════════════════════════
function History({sess}){
  const sorted=[...sess].reverse();const w=sess.filter(s=>s.ok).length,l=sess.filter(s=>!s.ok).length;
  return(<div style={S.page}><h2 style={{fontFamily:"var(--d)",fontSize:17,fontWeight:800,color:C.white,marginBottom:8}}>History</h2>
    <div style={{display:"flex",gap:3,marginBottom:8}}>{[{l:"Won",v:w,c:C.green},{l:"Lost",v:l,c:C.danger},{l:"Rate",v:sess.length?Math.round(w/sess.length*100)+"%":"—",c:C.accent}].map((s,i)=>(<Card key={i} style={{flex:1,padding:"6px 3px",textAlign:"center"}}><p style={{fontFamily:"var(--m)",color:s.c,fontSize:14,fontWeight:700,margin:0}}>{s.v}</p><p style={{fontFamily:"var(--m)",color:C.t3,fontSize:6,margin:0}}>{s.l}</p></Card>))}</div>
    {sorted.length===0?<p style={{fontFamily:"var(--b)",color:C.t2,fontSize:10,textAlign:"center",padding:16}}>No sessions yet</p>
    :<div style={{display:"flex",flexDirection:"column",gap:3}}>{sorted.map((s,i)=>(<Card key={i} style={{padding:"8px 10px",display:"flex",alignItems:"center",gap:6}}>
      <span style={{fontSize:12}}>{s.ok?"✅":"💀"}</span>
      <div style={{flex:1}}><p style={{fontFamily:"var(--b)",fontSize:9,fontWeight:600,color:C.white,margin:0}}>{s.goalEmoji} {s.goalLabel} — {s.ok?fD(s.dur):`quit ${s.actual}m`}</p><p style={{fontFamily:"var(--b)",fontSize:7,color:C.t3,margin:0}}>{fDate(s.date)} · {fTime(s.date)} · {(s.mode||{}).label||""}{s.note?` · "${s.note.slice(0,16)}"`:""}{s.rating?` ${["","😵","😐","🙂","😊","🔥"][s.rating]}`:""}</p></div>
      <span style={{fontFamily:"var(--m)",color:s.ok?C.green:C.danger,fontWeight:700,fontSize:8}}>{s.ok?`+${fD(s.dur)}`:`-$${s.stake}`}</span>
    </Card>))}</div>}
  </div>);
}

function Stats({sess}){
  const d=useMemo(()=>{const ok=sess.filter(s=>s.ok),fl=sess.filter(s=>!s.ok);const rate=sess.length?Math.round(ok.length/sess.length*100):0;const mins=ok.reduce((a,s)=>a+(s.actual||0),0);const saved=ok.reduce((a,s)=>a+s.stake,0);const lost=fl.reduce((a,s)=>a+s.stake,0);const sk=getStreak(sess);const bg={};sess.forEach(s=>{const k=s.goalLabel;if(!bg[k])bg[k]={t:0,ok:0,e:s.goalEmoji};bg[k].t++;if(s.ok)bg[k].ok++});const bm={};sess.forEach(s=>{const k=(s.mode||{}).label||"?";if(!bm[k])bm[k]={t:0,ok:0};bm[k].t++;if(s.ok)bm[k].ok++});const dy=[];const now=Date.now();for(let i=13;i>=0;i--){const x=new Date(now-i*86400000);const k=dk(x);const ds=sess.filter(s=>dk(s.date)===k);dy.push({l:x.toLocaleDateString("en",{weekday:"narrow"}),n:ds.length,ok:ds.filter(s=>s.ok).length})}return{rate,mins,saved,lost,sk,bg,bm,dy,total:sess.length}},[sess]);

  if(sess.length<2)return<div style={S.page}><h2 style={{fontFamily:"var(--d)",fontSize:17,fontWeight:800,color:C.white,marginBottom:8}}>📊 Analytics</h2><Card style={{padding:20,textAlign:"center"}}><p style={{fontSize:28,marginBottom:4}}>📊</p><p style={{fontFamily:"var(--b)",color:C.t2,fontSize:11}}>2+ sessions to unlock</p></Card></div>;
  const mx=Math.max(1,...d.dy.map(x=>x.n));
  return(<div style={S.page}><h2 style={{fontFamily:"var(--d)",fontSize:17,fontWeight:800,color:C.white,marginBottom:8}}>📊 Analytics</h2>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:3,marginBottom:6}}>{[{l:"Total",v:d.total,c:C.white},{l:"Rate",v:`${d.rate}%`,c:d.rate>=70?C.green:C.gold},{l:"Streak",v:`${d.sk}d`,c:C.accent},{l:"Hours",v:`${(d.mins/60).toFixed(1)}`,c:C.purple}].map((k,i)=>(<Card key={i} style={{padding:"5px 2px",textAlign:"center"}}><p style={{fontFamily:"var(--m)",color:k.c,fontSize:12,fontWeight:700,margin:0}}>{k.v}</p><p style={{fontFamily:"var(--m)",color:C.t3,fontSize:5,margin:0}}>{k.l}</p></Card>))}</div>
    <Card style={{padding:10,marginBottom:6}}><p style={{fontFamily:"var(--d)",color:C.white,fontSize:10,fontWeight:700,margin:"0 0 4px"}}>💰 Money</p><div style={{display:"flex",gap:6}}><div style={{flex:1,textAlign:"center"}}><p style={{fontFamily:"var(--m)",color:C.green,fontSize:16,fontWeight:700,margin:0}}>${f$(d.saved)}</p><p style={{fontFamily:"var(--m)",color:C.t3,fontSize:6}}>Saved</p></div><div style={{flex:1,textAlign:"center"}}><p style={{fontFamily:"var(--m)",color:C.danger,fontSize:16,fontWeight:700,margin:0}}>${f$(d.lost)}</p><p style={{fontFamily:"var(--m)",color:C.t3,fontSize:6}}>Lost</p></div></div></Card>
    <Card style={{padding:10,marginBottom:6}}><p style={{fontFamily:"var(--d)",color:C.white,fontSize:10,fontWeight:700,margin:"0 0 4px"}}>📅 14 Days</p><div style={{display:"flex",gap:1,alignItems:"flex-end",height:30}}>{d.dy.map((x,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><div style={{width:"100%",borderRadius:2,background:x.n>0?(x.ok===x.n?C.green:x.ok>0?C.gold:C.danger):C.t5,height:`${Math.max(2,x.n/mx*24)}px`}}/><span style={{fontFamily:"var(--m)",color:C.t3,fontSize:5}}>{x.l}</span></div>))}</div></Card>
    {/* By Mode — V7 exclusive */}
    {Object.keys(d.bm).length>1&&<Card style={{padding:10,marginBottom:6}}><p style={{fontFamily:"var(--d)",color:C.white,fontSize:10,fontWeight:700,margin:"0 0 4px"}}>📊 By Mode</p>{Object.entries(d.bm).map(([k,v])=>{const pct=Math.round(v.ok/v.t*100);return(<div key={k} style={{marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:"var(--b)",color:C.t1,fontSize:9}}>{k}</span><span style={{fontFamily:"var(--m)",color:pct>=70?C.green:C.gold,fontSize:9,fontWeight:700}}>{pct}% ({v.ok}/{v.t})</span></div><div style={{height:3,background:C.t5,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:pct>=70?C.green:C.gold,width:`${Math.max(3,pct)}%`}}/></div></div>)})}</Card>}
    <Card style={{padding:10}}><p style={{fontFamily:"var(--d)",color:C.white,fontSize:10,fontWeight:700,margin:"0 0 4px"}}>🎯 By Goal</p>{Object.entries(d.bg).sort((a,b)=>b[1].t-a[1].t).map(([k,v])=>{const pct=Math.round(v.ok/v.t*100);return(<div key={k} style={{marginBottom:4}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontFamily:"var(--b)",color:C.t1,fontSize:9}}>{v.e} {k}</span><span style={{fontFamily:"var(--m)",color:pct>=70?C.green:C.gold,fontSize:9,fontWeight:700}}>{pct}%</span></div><div style={{height:3,background:C.t5,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",borderRadius:2,background:pct>=70?C.green:C.gold,width:`${Math.max(3,pct)}%`}}/></div></div>)})}</Card>
  </div>);
}

function Prof({user,sU,wal,sW,sess,go}){
  const[showAdd,setShowAdd]=useState(false);const r=user?.recipient||{};const m=user?.mode||{};
  return(<div style={S.page}><h2 style={{fontFamily:"var(--d)",fontSize:17,fontWeight:800,color:C.white,marginBottom:8}}>Profile</h2>
    <Card style={{padding:"10px 12px",display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
      <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#FF2E54,#A855F7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🔥</div>
      <div><p style={{fontFamily:"var(--d)",color:C.white,fontSize:12,fontWeight:700,margin:0}}>{user?.name}</p><p style={{fontFamily:"var(--b)",color:C.t3,fontSize:8,margin:0}}>{sess.length} sessions · {m.label} mode</p></div>
    </Card>

    <Card style={{padding:"10px 12px",marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><Lbl>WALLET</Lbl><p style={{fontFamily:"var(--m)",color:C.white,fontSize:20,fontWeight:700,margin:0}}>${f$(wal)}</p></div><button onClick={()=>setShowAdd(!showAdd)} style={{...S.btnSm,background:C.accentSoft,color:C.accent,borderColor:C.accentMid}}>+ Add</button></div>
      {showAdd&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2,marginTop:5}}>{[5,10,25,50].map(a=><button key={a} onClick={async()=>{await sW(wal+a);setShowAdd(false)}} style={{fontFamily:"var(--m)",background:C.surface,border:`1px solid ${C.border}`,borderRadius:5,padding:5,fontSize:10,fontWeight:700,color:C.white,cursor:"pointer"}}>+${a}</button>)}</div>}
    </Card>
    {wal>0&&<button onClick={async()=>{if(confirm(`Withdraw $${f$(wal)}?`))await sW(0)}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,width:"100%",padding:"7px 10px",cursor:"pointer",textAlign:"center",marginBottom:6}}><p style={{fontFamily:"var(--b)",color:C.t2,fontSize:9,margin:0}}>💸 Withdraw ${f$(wal)}</p></button>}

    <div style={{background:`${m.color||C.accent}08`,border:`1px solid ${m.color||C.accent}15`,borderRadius:10,padding:"8px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:7}}>
      <span style={{fontSize:14}}>{r.emoji}</span>
      <div><p style={{fontFamily:"var(--m)",fontSize:6,fontWeight:600,letterSpacing:1.5,color:m.color||C.accent,margin:0}}>{m.label?.toUpperCase()}</p><p style={{fontFamily:"var(--d)",fontSize:10,fontWeight:700,color:C.white,margin:0}}>{r.name}</p></div>
    </div>

    <Card style={{padding:"10px 12px"}}>
      <p style={{fontFamily:"var(--d)",color:C.white,fontSize:10,fontWeight:700,margin:"0 0 4px"}}>🔒 Privacy & Data</p>
      <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",marginBottom:5}}>
        <div onClick={async()=>await sU({...user,anonShare:!user.anonShare})} style={{width:24,height:12,borderRadius:6,background:user?.anonShare?C.green:C.t4,padding:1,display:"flex",alignItems:"center",justifyContent:user?.anonShare?"flex-end":"flex-start",transition:"all .15s",cursor:"pointer"}}><div style={{width:8,height:8,borderRadius:4,background:"white"}}/></div>
        <span style={{fontFamily:"var(--b)",color:C.t1,fontSize:9}}>Anonymous sharing</span>
      </label>
      <button onClick={()=>{const d=JSON.stringify({sessions:sess,wallet:wal},null,2);const b=new Blob([d],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="stakeit-v7.json";a.click()}} style={{...S.btnSec,width:"100%",marginBottom:3}}>📥 Export Data</button>
      <button onClick={async()=>{if(!confirm("Delete ALL data?"))return;if(!confirm("Really? Can't undo."))return;for(const k of["v7u","v7s","v7w","v7a"])await rm(k);window.location.reload()}} style={{background:C.dangerSoft,border:`1px solid ${C.danger}12`,borderRadius:7,width:"100%",padding:"7px 10px",cursor:"pointer",fontFamily:"var(--b)",color:C.danger,fontSize:9,fontWeight:600}}>🗑 Delete All Data</button>
      <p style={{fontFamily:"var(--m)",color:C.t3,fontSize:6,marginTop:4}}>All data on-device only{m.id==="charity"?" · 70/30 charity split":""}</p>
    </Card>
  </div>);
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
:root{--d:'Outfit',sans-serif;--b:'Outfit',sans-serif;--m:'IBM Plex Mono',monospace}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
::-webkit-scrollbar{width:0;display:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
input::placeholder{color:${C.t3}}
button:active{transform:scale(.97)}
`;

const S={
  shell:{maxWidth:440,margin:"0 auto",minHeight:"100vh",background:C.bg,fontFamily:"var(--b)",display:"flex",flexDirection:"column"},
  page:{padding:"12px 14px"},
  input:{width:"100%",padding:"9px 12px",background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:8,color:C.white,fontSize:12,fontFamily:"var(--b)",outline:"none"},
  btn:{width:"100%",padding:"11px 14px",border:"none",borderRadius:9,background:"linear-gradient(135deg,#FF2E54,#FF6B8A)",color:"white",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"var(--d)",letterSpacing:.3},
  btnSec:{padding:"8px 12px",border:`1.5px solid ${C.border}`,borderRadius:8,background:C.card,color:C.white,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)"},
  btnSm:{padding:"4px 8px",border:`1.5px solid ${C.border}`,borderRadius:5,background:"transparent",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)"},
  circBtn:{width:42,height:42,borderRadius:21,border:`2px solid ${C.t4}`,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:13,color:C.white},
  nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:440,background:`${C.bg}F5`,backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-around",padding:"3px 0 14px",zIndex:100},
  navBtn:{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"2px 6px"},
};
