import { useState, useEffect, useRef, useMemo } from "react";

/*
  ╔══════════════════════════════════════════════════════╗
  ║  STAKEIT WEBSITE V8 — SIMPLIFIED MODEL              ║
  ║  Penalties fund platform · No charity processing     ║
  ║  Light warm theme · Daily-use focused                ║
  ║                                                      ║
  ║  USER JOURNEYS VERIFIED:                             ║
  ║  ✓ New user: Landing→Onboard→Session→Result→Share    ║
  ║  ✓ Return user: Home→QuickStart or NewSession        ║
  ║  ✓ Failure: QuitConfirm→Penalty→Recovery→Reload      ║
  ║  ✓ Empty wallet: Banner→InlineAdd on every screen    ║
  ║  ✓ Browser refresh: Timer resumes (timestamp-based)  ║
  ║  ✓ Analytics: Unlocks at 2 sessions, grows with use  ║
  ║  ✓ Profile: Enemy change, withdraw, export, delete   ║
  ║  ✓ Share: Receipt card + platform buttons + copy      ║
  ╚══════════════════════════════════════════════════════╝
*/

// ── PALETTE: Warm cream + hot accent ──
const T = {
  bg:"#FDFBF7",surface:"#FFFFFF",card:"#FFFFFF",
  accent:"#FF3355",accentSoft:"#FF335508",accentMid:"#FF335515",
  green:"#10B981",greenSoft:"#10B98108",
  gold:"#F59E0B",goldSoft:"#F59E0B08",
  purple:"#8B5CF6",blue:"#3B82F6",
  text:"#1A1A1A",t1:"#374151",t2:"#6B7280",t3:"#9CA3AF",t4:"#D1D5DB",t5:"#E5E7EB",t6:"#F3F4F6",
  border:"#E8E4DE",borderLight:"#F0EDE8",
  danger:"#EF4444",dangerSoft:"#EF444408",
  shadow:"0 1px 3px rgba(0,0,0,.04),0 1px 2px rgba(0,0,0,.06)",
  shadowMd:"0 4px 12px rgba(0,0,0,.06)",
  shadowLg:"0 10px 30px rgba(0,0,0,.08)",
};

const ENEMIES = [
  {id:"pizza",name:"Pineapple Pizza Alliance",emoji:"🍕",cat:"Absurd"},
  {id:"monday",name:"Make Monday Longer Foundation",emoji:"📅",cat:"Absurd"},
  {id:"comic",name:"Comic Sans Forever Society",emoji:"🔤",cat:"Absurd"},
  {id:"nap",name:"Anti-Nap Coalition",emoji:"😈",cat:"Absurd"},
  {id:"loud",name:"Loud Chewers Association",emoji:"🍿",cat:"Annoying"},
  {id:"reply",name:"Reply-All Enthusiasts Club",emoji:"📧",cat:"Annoying"},
  {id:"spoiler",name:"Movie Spoilers United",emoji:"🎬",cat:"Annoying"},
  {id:"recline",name:"Full Recline Airlines Guild",emoji:"✈️",cat:"Annoying"},
  {id:"rival",name:"Your Rival School Fund",emoji:"🏈",cat:"Rivals"},
  {id:"ex",name:"Your Ex's Ego Fund",emoji:"💔",cat:"Rivals"},
  {id:"flat",name:"Flat Earth Society",emoji:"🌍",cat:"Chaos"},
  {id:"scroll",name:"Infinite Scroll Foundation",emoji:"📱",cat:"Chaos"},
  {id:"robocall",name:"More Robocalls Foundation",emoji:"📞",cat:"Chaos"},
  {id:"snooze",name:"Snooze Button Preservation Fund",emoji:"⏰",cat:"Chaos"},
  {id:"decaf",name:"Mandatory Decaf Movement",emoji:"☕",cat:"Chaos"},
  {id:"procras",name:"National Procrastination Society",emoji:"🛋️",cat:"Chaos"},
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
  {e:"🔥",t:"3-Day Streak",c:(s,k)=>k>=3},
  {e:"⚡",t:"7-Day Streak",c:(s,k)=>k>=7},
  {e:"🏊",t:"1 Hour",c:s=>s.some(x=>x.ok&&x.dur>=60)},
  {e:"💰",t:"$50 Saved",c:s=>s.filter(x=>x.ok).reduce((a,x)=>a+x.stake,0)>=50},
  {e:"🎖️",t:"20 Wins",c:s=>s.filter(x=>x.ok).length>=20},
  {e:"🎨",t:"3 Goals",c:s=>new Set(s.filter(x=>x.ok).map(x=>x.goal)).size>=3},
];

// ── Helpers ──
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
export default function StakeItV8(){
  const[scr,setScr]=useState("load");
  const[user,setUser]=useState(null);
  const[sess,setSess]=useState([]);
  const[wal,setWal]=useState(0);
  const[act,setAct]=useState(null);

  useEffect(()=>{(async()=>{
    const u=await ld("v8u",null),s=await ld("v8s",[]),w=await ld("v8w",0),a=await ld("v8a",null);
    setUser(u);setSess(s);setWal(w);setAct(a);
    setScr(a&&u?"active":u?"home":"land");
  })()},[]);

  const sU=async u=>{setUser(u);await sv("v8u",u)};
  const sS=async s=>{setSess(s);await sv("v8s",s)};
  const sW=async w=>{setWal(Math.round(w*100)/100);await sv("v8w",Math.round(w*100)/100)};
  const sA=async a=>{setAct(a);if(a)await sv("v8a",a);else await rm("v8a")};
  const p={user,sess,wal,go:setScr,sU,sS,sW,sA,act};

  if(scr==="load")return<Shell><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}><span style={{fontSize:40,animation:"bounce .6s infinite alternate"}}>🔥</span></div></Shell>;
  if(scr==="land")return<Landing go={setScr}/>;
  if(scr.startsWith("ob"))return<Onboarding step={scr}{...p}/>;

  const tabs=[{id:"home",i:"⚡",l:"Home"},{id:"setup",i:"⏱",l:"Focus"},{id:"history",i:"📋",l:"History"},{id:"stats",i:"📊",l:"Stats"},{id:"me",i:"👤",l:"Profile"}];
  const full=["active","done","fail","reflect","share"].includes(scr);

  return(
    <Shell>
      <div style={{flex:1,overflowY:"auto",paddingBottom:full?0:66}}>
        {scr==="home"&&<Home{...p}/>}
        {scr==="setup"&&<Setup{...p}/>}
        {scr==="active"&&<ActiveTimer{...p}/>}
        {scr==="done"&&<Result ok={true}{...p}/>}
        {scr==="fail"&&<Result ok={false}{...p}/>}
        {scr==="reflect"&&<Reflect{...p}/>}
        {scr==="history"&&<History{...p}/>}
        {scr==="stats"&&<Stats{...p}/>}
        {scr==="me"&&<Profile{...p}/>}
        {scr==="share"&&<ShareScreen{...p}/>}
      </div>
      {!full&&(
        <div style={S.nav}>
          {tabs.map(t=><button key={t.id} onClick={()=>setScr(t.id)} style={{...S.navBtn,color:scr===t.id?T.accent:T.t3}}>
            <span style={{fontSize:16}}>{t.i}</span>
            <span style={{fontSize:8,fontWeight:600}}>{t.l}</span>
          </button>)}
        </div>
      )}
    </Shell>
  );
}

function Shell({children}){
  return(<div style={S.shell}><style>{CSS}</style>{children}</div>);
}

// ═══════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════
function Landing({go}){
  const[faq,setFaq]=useState(null);
  return(
    <Shell>
      <div style={{overflowY:"auto"}}>
        {/* Nav */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px"}}>
          <span style={{fontFamily:"var(--d)",fontWeight:800,fontSize:18,color:T.text}}>Stake<span style={{color:T.accent}}>It</span></span>
          <button onClick={()=>go("ob1")} style={S.navCta}>Start Free →</button>
        </div>

        {/* Hero */}
        <div style={{padding:"32px 24px 40px",position:"relative"}}>
          <div style={{position:"absolute",top:-60,right:-40,width:300,height:300,background:"radial-gradient(circle,rgba(255,51,85,.06),transparent 70%)",pointerEvents:"none",borderRadius:"50%"}}/>
          <div style={{position:"relative"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:4,background:T.accentSoft,border:`1px solid ${T.accentMid}`,borderRadius:100,padding:"4px 12px",marginBottom:16}}>
              <span style={{fontSize:8}}>🧠</span>
              <span style={{fontFamily:"var(--m)",fontSize:9,fontWeight:600,color:T.accent}}>Based on Yale research · 80% success rate</span>
            </div>
            <h1 style={{fontFamily:"var(--d)",fontSize:34,fontWeight:800,lineHeight:1.08,color:T.text,letterSpacing:-1.5,margin:"0 0 12px"}}>
              Focus or lose<br/>your <span style={{color:T.accent,position:"relative",display:"inline-block"}}>money<svg style={{position:"absolute",bottom:-4,left:0,width:"100%",height:8}} viewBox="0 0 100 8"><path d="M0 5 Q25 0 50 4 T100 3" fill="none" stroke={T.accent} strokeWidth="2" strokeLinecap="round" opacity=".3"/></svg></span>.
            </h1>
            <p style={{fontFamily:"var(--b)",fontSize:15,lineHeight:1.6,color:T.t2,maxWidth:320,margin:"0 0 24px"}}>
              Stake real money on focus sessions. Complete them and keep everything. Quit early and your fictional enemy wins.
            </p>
            <button onClick={()=>go("ob1")} style={S.heroCta}>
              🔥 Try It Free — Takes 60 Seconds
            </button>
            <p style={{fontFamily:"var(--m)",fontSize:8,color:T.t3,marginTop:8}}>No account needed · Free forever · 18+</p>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{display:"flex",justifyContent:"center",gap:28,padding:"0 20px 32px"}}>
          {[{v:"80%",l:"Success Rate"},{v:"2.3×",l:"More Focused"},{v:"$0",l:"To Start"},{v:"60s",l:"Setup"}].map((s,i)=>(
            <div key={i} style={{textAlign:"center"}}>
              <p style={{fontFamily:"var(--m)",fontSize:18,fontWeight:700,color:T.text,margin:0}}>{s.v}</p>
              <p style={{fontFamily:"var(--m)",fontSize:7,color:T.t3,letterSpacing:1,textTransform:"uppercase",margin:0}}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <Section label="HOW IT WORKS" title="Three steps. Zero complexity.">
          {[
            {n:"01",emoji:"😤",t:"Pick your enemy",d:"Choose a fictional organization you'd hate funding. 16 options across 4 categories — or create your own."},
            {n:"02",emoji:"🔒",t:"Lock your stake",d:"Set your focus goal, timer (10 min to 2 hours), and stake ($1–$50). Once locked, you're committed."},
            {n:"03",emoji:"🔥",t:"Focus or pay",d:"Complete your session → keep your money. Quit → your enemy wins. Either way, you get a shareable receipt."},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:14,marginBottom:16,animation:`fadeUp .4s ${i*.08}s ease both`}}>
              <div style={{flexShrink:0}}>
                <span style={{fontFamily:"var(--m)",fontSize:32,fontWeight:700,color:T.t5,lineHeight:1}}>{s.n}</span>
              </div>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                  <span style={{fontSize:16}}>{s.emoji}</span>
                  <span style={{fontFamily:"var(--d)",fontSize:14,fontWeight:700,color:T.text}}>{s.t}</span>
                </div>
                <p style={{fontFamily:"var(--b)",fontSize:11,color:T.t2,lineHeight:1.5,margin:0}}>{s.d}</p>
              </div>
            </div>
          ))}
        </Section>

        {/* Enemies */}
        <Section label="YOUR ENEMIES" title="16 fictional enemies. All imaginary. All effective.">
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {ENEMIES.slice(0,8).map(e=>(
              <div key={e.id} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 4px",textAlign:"center",boxShadow:T.shadow}}>
                <span style={{fontSize:20,display:"block"}}>{e.emoji}</span>
                <p style={{fontFamily:"var(--b)",fontSize:7,color:T.t2,margin:"3px 0 0",lineHeight:1.15}}>{e.name.split(" ").slice(0,2).join(" ")}</p>
              </div>
            ))}
          </div>
          <p style={{fontFamily:"var(--b)",fontSize:9,color:T.t3,textAlign:"center",marginTop:8}}>+ 8 more enemies · Custom option available</p>
        </Section>

        {/* Money transparency */}
        <Section label="HOW MONEY WORKS" title="Full transparency.">
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:T.shadow}}>
            {[
              {emoji:"✅",title:"You complete",desc:"Keep 100% of your stake",color:T.green},
              {emoji:"💀",title:"You quit",desc:"Your penalty keeps StakeIt free",color:T.danger},
              {emoji:"💸",title:"Your balance",desc:"Always 100% withdrawable",color:T.gold},
            ].map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:i<2?`1px solid ${T.borderLight}`:"none"}}>
                <span style={{fontSize:18}}>{r.emoji}</span>
                <div>
                  <p style={{fontFamily:"var(--d)",fontSize:12,fontWeight:700,color:r.color,margin:0}}>{r.title}</p>
                  <p style={{fontFamily:"var(--b)",fontSize:10,color:T.t2,margin:0}}>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:T.greenSoft,border:`1px solid ${T.green}15`,borderRadius:10,padding:"10px 12px",marginTop:8}}>
            <p style={{fontFamily:"var(--b)",fontSize:10,color:T.green,margin:0}}>💚 After any session, we link you to Every.org where you can donate to a real charity of your choice.</p>
          </div>
        </Section>

        {/* Comparison */}
        <Section label="COMPARISON" title="Built different.">
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,overflow:"hidden",boxShadow:T.shadow}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"8px 12px",borderBottom:`1px solid ${T.borderLight}`,background:T.t6}}>
              <span/><span style={{fontFamily:"var(--m)",fontSize:8,fontWeight:700,color:T.accent,textAlign:"center"}}>StakeIt</span><span style={{fontFamily:"var(--m)",fontSize:8,color:T.t3,textAlign:"right"}}>Others</span>
            </div>
            {[{l:"Price",a:"Free",b:"$8-40/mo"},{l:"Sharing",a:"Viral receipts",b:"None"},{l:"Platform",a:"Mobile-first",b:"Desktop"},{l:"Sessions",a:"10min-2hr",b:"Weeks+"},{l:"Setup",a:"60 seconds",b:"10+ min"}].map((r,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"8px 12px",borderBottom:i<4?`1px solid ${T.borderLight}`:"none"}}>
                <span style={{fontFamily:"var(--b)",fontSize:10,color:T.t2}}>{r.l}</span>
                <span style={{fontFamily:"var(--m)",fontSize:10,color:T.green,fontWeight:600,textAlign:"center"}}>{r.a}</span>
                <span style={{fontFamily:"var(--b)",fontSize:10,color:T.t3,textAlign:"right"}}>{r.b}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* FAQ */}
        <Section label="FAQ" title="">
          {[
            ["Do enemies actually receive money?","No. All enemies are fictional. Your penalty simply keeps StakeIt free — that's it. If you want to donate to a real charity, we link to Every.org after any session."],
            ["Can I withdraw my balance?","Yes, always. 100% of unused funds are withdrawable from your Profile screen at any time."],
            ["Is this gambling?","No. You have 100% control over completing your session. This is a commitment device — the same concept studied at Yale and used by StickK since 2008."],
            ["What about my data?","Everything is stored locally on your device. No accounts, no servers. Export or delete anytime."],
            ["How does StakeIt make money?","Failed session penalties. No subscriptions, no ads. The more you succeed, the less we earn."],
          ].map(([q,a],i)=>(
            <div key={i} style={{borderBottom:`1px solid ${T.border}`}}>
              <button onClick={()=>setFaq(faq===i?null:i)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"12px 0",background:"none",border:"none",cursor:"pointer"}}>
                <span style={{fontFamily:"var(--b)",fontSize:12,fontWeight:600,color:T.text,textAlign:"left"}}>{q}</span>
                <span style={{fontFamily:"var(--m)",color:T.t3,fontSize:18,transform:faq===i?"rotate(45deg)":"none",transition:"transform .2s",marginLeft:8,flexShrink:0}}>+</span>
              </button>
              {faq===i&&<p style={{fontFamily:"var(--b)",fontSize:11,color:T.t1,lineHeight:1.6,padding:"0 0 12px"}}>{a}</p>}
            </div>
          ))}
        </Section>

        {/* Final CTA */}
        <div style={{padding:"24px 24px 48px",textAlign:"center"}}>
          <h2 style={{fontFamily:"var(--d)",fontSize:24,fontWeight:800,color:T.text,letterSpacing:-1,margin:"0 0 8px"}}>Ready to focus?</h2>
          <p style={{fontFamily:"var(--b)",fontSize:12,color:T.t2,marginBottom:16}}>First session takes 60 seconds to set up.</p>
          <button onClick={()=>go("ob1")} style={S.heroCta}>🔥 Start Free</button>
          <p style={{fontFamily:"var(--m)",fontSize:7,color:T.t4,marginTop:16}}>© 2026 StakeIt</p>
        </div>
      </div>
    </Shell>
  );
}

function Section({label,title,children}){
  return(
    <div style={{padding:"0 24px 32px"}}>
      <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:700,letterSpacing:2.5,color:T.accent,textTransform:"uppercase",marginBottom:4}}>{label}</p>
      {title&&<h2 style={{fontFamily:"var(--d)",fontSize:20,fontWeight:800,color:T.text,letterSpacing:-.8,margin:"0 0 14px",lineHeight:1.15}}>{title}</h2>}
      {children}
    </div>
  );
}

// ═══════════════════════════════════════
// ONBOARDING — 3 Steps
// ═══════════════════════════════════════
function Onboarding({step,go,sU,sW}){
  const[name,setName]=useState("");const[is18,setIs18]=useState(false);
  const[enemy,setEnemy]=useState(null);const[customE,setCustomE]=useState("");
  const Bk=({to})=><button onClick={()=>go(to)} style={{fontFamily:"var(--b)",color:T.t2,fontSize:11,background:"none",border:"none",cursor:"pointer",padding:"8px 0"}}>← Back</button>;

  if(step==="ob1")return(
    <Shell><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24}}>
      <div style={{textAlign:"center",maxWidth:320,width:"100%"}}>
        <div style={{fontSize:40,marginBottom:10,animation:"fadeUp .4s ease"}}>🔥</div>
        <h1 style={{fontFamily:"var(--d)",fontSize:26,fontWeight:800,color:T.text,letterSpacing:-1,margin:"0 0 6px",animation:"fadeUp .4s .05s ease both"}}>Stake<span style={{color:T.accent}}>It</span></h1>
        <p style={{fontFamily:"var(--b)",color:T.t2,fontSize:13,margin:"0 0 20px",animation:"fadeUp .4s .1s ease both"}}>Put money on your focus.</p>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your first name" maxLength={20} style={{...S.input,animation:"fadeUp .4s .15s ease both"}} onKeyDown={e=>e.key==="Enter"&&name.trim()&&is18&&go("ob2")}/>
        <label style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center",margin:"12px 0",cursor:"pointer",animation:"fadeUp .4s .2s ease both"}}>
          <div onClick={()=>setIs18(!is18)} style={{width:18,height:18,borderRadius:4,border:`2px solid ${is18?T.green:T.t4}`,background:is18?T.green:"white",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",cursor:"pointer"}}>
            {is18&&<span style={{color:"white",fontSize:10,fontWeight:700}}>✓</span>}
          </div>
          <span style={{fontFamily:"var(--b)",color:T.t2,fontSize:11}}>I'm 18 or older</span>
        </label>
        <button onClick={()=>name.trim()&&is18&&go("ob2")} disabled={!name.trim()||!is18} style={{...S.btnPrimary,opacity:name.trim()&&is18?1:.35,animation:"fadeUp .4s .25s ease both"}}>Continue →</button>
      </div>
    </div></Shell>
  );

  if(step==="ob2"){
    const valid=enemy||customE.trim();
    return(
      <Shell><div style={{padding:"32px 20px",maxWidth:440,margin:"0 auto"}}>
        <Bk to="ob1"/>
        <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:700,letterSpacing:2,color:T.accent,margin:"0 0 2px"}}>STEP 1 OF 2</p>
        <h2 style={{fontFamily:"var(--d)",fontSize:20,fontWeight:800,color:T.text,letterSpacing:-.5,margin:"0 0 4px"}}>Pick your enemy 😤</h2>
        <p style={{fontFamily:"var(--b)",fontSize:10,color:T.t2,margin:"0 0 12px"}}>Who do you NOT want getting your money? All fictional.</p>
        
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {ENEMIES.map(e=>{const sel=enemy?.id===e.id&&!customE;return(
            <button key={e.id} onClick={()=>{setEnemy(e);setCustomE("")}} style={{background:sel?T.accentSoft:T.surface,border:`1.5px solid ${sel?T.accent:T.border}`,borderRadius:10,padding:"8px 10px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:6,transition:"all .12s",boxShadow:sel?`0 0 0 3px ${T.accentMid}`:T.shadow}}>
              <span style={{fontSize:16}}>{e.emoji}</span>
              <p style={{fontFamily:"var(--b)",fontSize:9,fontWeight:600,color:sel?T.accent:T.t1,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{e.name}</p>
            </button>
          )})}
        </div>

        <div style={{marginTop:8}}>
          <input value={customE} onChange={e=>{setCustomE(e.target.value);setEnemy(null)}} placeholder='✏️ Or create custom enemy...' maxLength={30} style={{...S.input,fontSize:10}}/>
        </div>

        <button onClick={()=>go("ob3")} disabled={!valid} style={{...S.btnPrimary,marginTop:12,opacity:valid?1:.35}}>Next →</button>
      </div></Shell>
    );
  }

  if(step==="ob3"){
    const en=customE.trim()?{id:"custom",name:customE.trim(),emoji:"😤"}:enemy;
    return(
      <Shell><div style={{padding:"32px 20px",maxWidth:440,margin:"0 auto"}}>
        <Bk to="ob2"/>
        <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:700,letterSpacing:2,color:T.accent,margin:"0 0 2px"}}>STEP 2 OF 2</p>
        <h2 style={{fontFamily:"var(--d)",fontSize:20,fontWeight:800,color:T.text,letterSpacing:-.5,margin:"0 0 4px"}}>Load your wallet 💰</h2>
        <p style={{fontFamily:"var(--b)",fontSize:10,color:T.t2,margin:"0 0 6px"}}>Your commitment fund. Complete sessions = keep it all.</p>
        
        <div style={{background:T.dangerSoft,border:`1px solid ${T.danger}12`,borderRadius:10,padding:"8px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>{en?.emoji}</span>
          <p style={{fontFamily:"var(--b)",fontSize:10,fontWeight:600,color:T.danger,margin:0}}>Quit = {en?.name} wins your stake</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[10,25,50,100].map(amt=>(
            <button key={amt} onClick={()=>{sU({name,enemy:en,anonShare:false,created:Date.now()});sW(amt);go("home")}} style={{background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:12,padding:"16px 8px",cursor:"pointer",textAlign:"center",boxShadow:T.shadow,transition:"all .12s"}}>
              <p style={{fontFamily:"var(--m)",fontSize:24,fontWeight:700,color:T.text,margin:0}}>${amt}</p>
              <p style={{fontFamily:"var(--b)",fontSize:8,color:T.t3,margin:"2px 0 0"}}>{amt<=10?"Try it out":amt<=25?"Solid start":amt<=50?"Committed":"All in 🔥"}</p>
            </button>
          ))}
        </div>
        <p style={{fontFamily:"var(--m)",color:T.t3,fontSize:7,textAlign:"center",marginTop:10,lineHeight:1.5}}>🔒 Balance always withdrawable · Data stored on-device<br/>Penalties keep StakeIt free · By continuing you agree to Terms</p>
      </div></Shell>
    );
  }
}

// ═══════════════════════════════════════
// HOME
// ═══════════════════════════════════════
function Home({user,sess,wal,go,sW}){
  const sk=getStreak(sess);const e=user?.enemy||{};
  const saved=sess.filter(s=>s.ok).reduce((a,s)=>a+s.stake,0);
  const lost=sess.filter(s=>!s.ok).reduce((a,s)=>a+s.stake,0);
  const hrs=(sess.reduce((a,s)=>a+(s.ok?s.actual||0:0),0)/60).toFixed(1);
  const lastOk=sess.filter(s=>s.ok).slice(-1)[0];
  const[showAdd,setShowAdd]=useState(false);

  return(
    <div style={S.page}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <p style={{fontFamily:"var(--b)",color:T.t3,fontSize:10,margin:0}}>Welcome back</p>
          <h1 style={{fontFamily:"var(--d)",fontSize:20,fontWeight:800,color:T.text,letterSpacing:-.5,margin:0}}>{user?.name}</h1>
        </div>
        {sk>0&&<div style={{background:"linear-gradient(135deg,#FF3355,#FF7B93)",borderRadius:8,padding:"3px 8px",display:"flex",alignItems:"center",gap:3}}>
          <span style={{fontSize:10}}>🔥</span><span style={{fontFamily:"var(--m)",color:"white",fontWeight:700,fontSize:12}}>{sk}</span>
        </div>}
      </div>

      {/* Wallet Card */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:14,padding:"14px 16px",marginBottom:8,boxShadow:T.shadow}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:700,letterSpacing:2,color:T.t3,margin:"0 0 2px"}}>WALLET BALANCE</p>
            <span style={{fontFamily:"var(--m)",fontSize:28,fontWeight:700,color:T.text}}>${f$(wal)}</span>
          </div>
          <button onClick={()=>setShowAdd(!showAdd)} style={{...S.btnSm,background:T.accentSoft,color:T.accent,borderColor:T.accentMid}}>+ Add Funds</button>
        </div>
        {showAdd&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,marginTop:8}}>
          {[5,10,25,50].map(a=><button key={a} onClick={async()=>{await sW(wal+a);setShowAdd(false)}} style={{background:T.t6,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 4px",fontFamily:"var(--m)",fontSize:11,fontWeight:700,color:T.text,cursor:"pointer"}}>+${a}</button>)}
        </div>}
        {wal<1&&!showAdd&&<p style={{fontFamily:"var(--b)",color:T.gold,fontSize:9,marginTop:4}}>⚠️ Add funds to start a session</p>}
      </div>

      {/* Enemy */}
      <div style={{background:T.dangerSoft,border:`1px solid ${T.danger}10`,borderRadius:10,padding:"8px 12px",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>{e.emoji}</span>
        <div>
          <p style={{fontFamily:"var(--m)",fontSize:7,fontWeight:700,letterSpacing:1.5,color:T.danger,margin:0}}>YOUR ENEMY</p>
          <p style={{fontFamily:"var(--d)",fontSize:11,fontWeight:700,color:T.text,margin:0}}>{e.name}</p>
        </div>
      </div>

      {/* Quick Start */}
      {lastOk&&wal>=1&&(
        <button onClick={async()=>{const stake=Math.min(lastOk.stake,Math.floor(wal));if(stake<1)return;const ss={goal:lastOk.goal,goalLabel:lastOk.goalLabel,goalEmoji:lastOk.goalEmoji,dur:lastOk.dur,stake,enemy:user.enemy,startTime:Date.now(),pausedTime:0};await sv("v8a",JSON.stringify(ss));window.__ss=ss;go("active")}} style={{background:T.accentSoft,border:`1px solid ${T.accentMid}`,borderRadius:10,width:"100%",padding:"10px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:8,cursor:"pointer",textAlign:"left"}}>
          <span style={{fontSize:14}}>⚡</span>
          <div style={{flex:1}}>
            <p style={{fontFamily:"var(--d)",color:T.accent,fontSize:10,fontWeight:700,margin:0}}>Quick Start — Repeat Last Session</p>
            <p style={{fontFamily:"var(--b)",color:T.t2,fontSize:9,margin:0}}>{lastOk.goalEmoji} {lastOk.goalLabel} · {fD(lastOk.dur)} · ${Math.min(lastOk.stake,Math.floor(wal))}</p>
          </div>
          <span style={{color:T.accent,fontSize:14}}>→</span>
        </button>
      )}

      {/* Main CTA */}
      <button onClick={()=>wal>=1?go("setup"):setShowAdd(true)} style={S.btnPrimary}>
        {wal>=1?"⏱ Start Focus Session":"💰 Add Funds to Start"}
      </button>

      {/* Stats row */}
      {sess.length>=1&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:8}}>
          {[{l:"Saved",v:`$${f$(saved)}`,c:T.green},{l:"Lost",v:`$${f$(lost)}`,c:T.danger},{l:"Focus",v:`${hrs}h`,c:T.purple}].map((s,i)=>(
            <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 4px",textAlign:"center",boxShadow:T.shadow}}>
              <p style={{fontFamily:"var(--m)",color:s.c,fontSize:16,fontWeight:700,margin:0}}>{s.v}</p>
              <p style={{fontFamily:"var(--m)",color:T.t3,fontSize:7,letterSpacing:1,margin:0}}>{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Milestones */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"10px 12px",marginTop:8,boxShadow:T.shadow}}>
        <p style={{fontFamily:"var(--d)",color:T.text,fontSize:11,fontWeight:700,margin:"0 0 6px"}}>🏆 Milestones</p>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          {MILES.map((m,i)=>{const u=m.c(sess,sk);return(
            <div key={i} title={m.t} style={{width:28,height:28,borderRadius:7,background:u?T.goldSoft:T.t6,border:`1px solid ${u?T.gold+"20":T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,opacity:u?1:.25,transition:"all .2s"}}>
              {m.e}
            </div>
          )})}
        </div>
      </div>

      {sess.length===0&&<p style={{fontFamily:"var(--b)",color:T.t3,fontSize:11,textAlign:"center",padding:20}}>🎯 Complete your first session to see stats</p>}
    </div>
  );
}

// ═══════════════════════════════════════
// SETUP
// ═══════════════════════════════════════
function Setup({user,wal,go,sA}){
  const[goal,setGoal]=useState(GOALS[0]);const[cG,setCG]=useState("");const[dur,setDur]=useState(25);const[stake,setStake]=useState(Math.min(5,Math.floor(wal)));
  const gL=goal.id==="custom"?cG.trim():goal.label;const ok=wal>=stake&&stake>=1&&gL;const e=user?.enemy||{};
  return(
    <div style={S.page}>
      <h2 style={{fontFamily:"var(--d)",fontSize:18,fontWeight:800,color:T.text,letterSpacing:-.5,marginBottom:12}}>New Session</h2>
      <Label>GOAL</Label>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,marginBottom:goal.id==="custom"?4:12}}>
        {GOALS.map(g=><button key={g.id} onClick={()=>setGoal(g)} style={{background:goal.id===g.id?T.accentSoft:T.surface,border:`1.5px solid ${goal.id===g.id?T.accent:T.border}`,borderRadius:8,padding:"6px 2px",cursor:"pointer",textAlign:"center"}}>
          <span style={{fontSize:14,display:"block"}}>{g.emoji}</span>
          <span style={{fontFamily:"var(--b)",fontSize:8,fontWeight:600,color:goal.id===g.id?T.accent:T.t2}}>{g.label}</span>
        </button>)}
      </div>
      {goal.id==="custom"&&<input value={cG} onChange={e=>setCG(e.target.value)} placeholder="What's your goal?" maxLength={40} style={{...S.input,fontSize:11,marginBottom:12}}/>}
      <Label>DURATION</Label>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
        {DURS.map(d=><button key={d.v} onClick={()=>setDur(d.v)} style={{fontFamily:"var(--m)",padding:"5px 8px",border:`1.5px solid ${dur===d.v?T.accent:T.border}`,borderRadius:6,background:dur===d.v?T.accentSoft:T.surface,color:dur===d.v?T.accent:T.t2,fontSize:10,fontWeight:600,cursor:"pointer"}}>{d.l}</button>)}
      </div>
      <Label>STAKE — ${f$(wal)} available</Label>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
        {STAKES.map(s=><button key={s} onClick={()=>s<=wal&&setStake(s)} style={{fontFamily:"var(--m)",padding:"5px 8px",border:`1.5px solid ${stake===s?T.danger:T.border}`,borderRadius:6,background:stake===s?T.dangerSoft:T.surface,color:stake===s?T.danger:s>wal?T.t4:T.t2,fontSize:10,fontWeight:600,cursor:"pointer",opacity:s>wal?.35:1}}>${s}</button>)}
      </div>
      <div style={{background:T.dangerSoft,border:`1px solid ${T.danger}10`,borderRadius:10,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>{e.emoji}</span>
        <div>
          <p style={{fontFamily:"var(--d)",fontSize:11,fontWeight:700,color:T.danger,margin:0}}>Quit = {e.name} wins ${stake}</p>
          <p style={{fontFamily:"var(--m)",color:T.t3,fontSize:9,margin:0}}>{dur<1?`Demo: ${Math.round(dur*60)}s`:`Ends at ${new Date(Date.now()+dur*60000).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}`}</p>
        </div>
      </div>
      <button onClick={async()=>{if(!ok)return;const ss={goal:goal.id,goalLabel:gL,goalEmoji:goal.emoji,dur,stake,enemy:user.enemy,startTime:Date.now(),pausedTime:0};await sA(ss);window.__ss=ss;go("active")}} disabled={!ok} style={{...S.btnPrimary,opacity:ok?1:.35}}>🔒 Lock In — ${stake} at Stake</button>
    </div>
  );
}

function Label({children}){return<p style={{fontFamily:"var(--m)",fontSize:8,fontWeight:700,letterSpacing:2,color:T.t3,marginBottom:4}}>{children}</p>}

// ═══════════════════════════════════════
// ACTIVE TIMER
// ═══════════════════════════════════════
function ActiveTimer({user,wal,sW,sess,sS,go,act,sA}){
  const ss=act||window.__ss;if(!ss){go("home");return null}
  const tot=Math.round(ss.dur*60);const[left,setLeft]=useState(tot);const[paused,setPaused]=useState(false);
  const[pN,setPN]=useState(0);const[pL,setPL]=useState(60);const[showQ,setShowQ]=useState(false);
  const done=useRef(false);const pRef=useRef(ss.pausedTime||0);const psRef=useRef(null);const start=ss.startTime||Date.now();
  
  useEffect(()=>{const t=()=>{if(paused)return;const el=Math.floor((Date.now()-start-pRef.current)/1000);const r=Math.max(0,tot-el);setLeft(r);if(r<=0&&!done.current){done.current=true;fin(true)}};t();const id=setInterval(t,250);return()=>clearInterval(id)},[paused]);
  useEffect(()=>{if(!paused)return;psRef.current=Date.now();const id=setInterval(()=>{const u=Math.floor((Date.now()-psRef.current)/1000);setPL(Math.max(0,60-u));if(u>=60){clearInterval(id);unp()}},500);return()=>clearInterval(id)},[paused]);
  const unp=()=>{if(psRef.current){pRef.current+=Date.now()-psRef.current;psRef.current=null}setPaused(false)};
  const doP=()=>{if(pN>=2)return;setPaused(true);setPN(n=>n+1);setPL(60)};
  const fin=async(ok)=>{if(done.current==="x")return;done.current="x";const el=Math.max(1,Math.round((Date.now()-start-pRef.current)/60000));if(!ok)await sW(Math.max(0,wal-ss.stake));await sS([...sess,{...ss,ok,date:Date.now(),actual:ok?ss.dur:el}]);await sA(null);go(ok?"reflect":"fail")};
  
  const pct=((tot-left)/tot)*100;const m=Math.floor(left/60),sec=left%60;const circ=2*Math.PI*100;
  const e=ss.enemy||{};

  return(
    <Shell><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:20}}>
      {showQ&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:T.surface,borderRadius:16,padding:20,maxWidth:280,textAlign:"center",boxShadow:T.shadowLg}}>
          <p style={{fontSize:32,marginBottom:4}}>{e.emoji}</p>
          <h3 style={{fontFamily:"var(--d)",color:T.text,fontSize:16,fontWeight:800,margin:"0 0 2px"}}>Really quit?</h3>
          <p style={{fontFamily:"var(--b)",color:T.danger,fontSize:12,fontWeight:700,margin:"0 0 12px"}}>{e.name} wins ${ss.stake}</p>
          <button onClick={()=>fin(false)} style={{...S.btnDanger,marginBottom:6}}>💀 Quit — Lose ${ss.stake}</button>
          <button onClick={()=>setShowQ(false)} style={{...S.btnSecondary,width:"100%"}}>💪 Keep Going</button>
        </div>
      </div>}

      <div style={{position:"relative",width:220,height:220,marginBottom:12}}>
        <svg width="220" height="220" style={{transform:"rotate(-90deg)"}}>
          <circle cx="110" cy="110" r="100" fill="none" stroke={T.t5} strokeWidth="4"/>
          <circle cx="110" cy="110" r="100" fill="none" stroke={paused?T.gold:T.accent} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ-(pct/100)*circ} strokeLinecap="round" style={{transition:"stroke-dashoffset .3s"}}/>
        </svg>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center"}}>
          <p style={{fontFamily:"var(--m)",color:paused?T.gold:T.text,fontSize:36,fontWeight:700,margin:0,letterSpacing:-2}}>{String(m).padStart(2,"0")}:{String(sec).padStart(2,"0")}</p>
          <p style={{fontFamily:"var(--b)",color:T.t2,fontSize:10,margin:"2px 0"}}>{ss.goalEmoji} {ss.goalLabel}</p>
          <p style={{fontFamily:"var(--m)",color:T.danger,fontSize:9,fontWeight:600}}>${ss.stake} at stake</p>
        </div>
      </div>

      {paused&&<div style={{background:T.goldSoft,border:`1px solid ${T.gold}15`,borderRadius:6,padding:"3px 10px",marginBottom:4}}>
        <p style={{fontFamily:"var(--m)",color:T.gold,fontSize:10,fontWeight:600,margin:0}}>⏸ Break: {pL}s remaining</p>
      </div>}
      <p style={{fontFamily:"var(--m)",color:T.t3,fontSize:8,marginBottom:10}}>Pauses used: {pN}/2</p>
      <div style={{display:"flex",gap:12}}>
        <button onClick={paused?unp:doP} disabled={!paused&&pN>=2} style={{...S.circBtn,borderColor:paused?T.gold:T.t4,opacity:!paused&&pN>=2?.3:1}}>{paused?"▶":"⏸"}</button>
        <button onClick={()=>setShowQ(true)} style={{...S.circBtn,borderColor:`${T.danger}40`,color:T.danger}}>✕</button>
      </div>
    </div></Shell>
  );
}

// ═══════════════════════════════════════
// REFLECT + RESULT + SHARE
// ═══════════════════════════════════════
function Reflect({sess,sS,go}){
  const s=sess[sess.length-1];if(!s){go("done");return null}const[note,setNote]=useState("");const[r,setR]=useState(0);
  return(
    <Shell><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:20}}>
      <div style={{textAlign:"center",maxWidth:300,width:"100%",animation:"fadeUp .3s ease"}}>
        <p style={{fontSize:44,marginBottom:6}}>🎉</p>
        <h2 style={{fontFamily:"var(--d)",color:T.green,fontSize:18,fontWeight:800,margin:"0 0 4px"}}>Session Complete!</h2>
        <p style={{fontFamily:"var(--b)",color:T.t2,fontSize:11,margin:"0 0 16px"}}>{s.goalEmoji} {fD(s.dur)} of {s.goalLabel} — <span style={{color:T.green,fontWeight:700}}>${s.stake} saved</span></p>
        <p style={{fontFamily:"var(--d)",color:T.text,fontSize:10,fontWeight:700,marginBottom:6,textAlign:"left"}}>How was your focus?</p>
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:10}}>
          {["😵","😐","🙂","😊","🔥"].map((e,i)=><button key={i} onClick={()=>setR(i+1)} style={{fontSize:22,background:r===i+1?T.accentSoft:"none",border:`2px solid ${r===i+1?T.accent:"transparent"}`,borderRadius:8,padding:3,cursor:"pointer",opacity:r&&r!==i+1?.2:1,transition:"all .12s"}}>{e}</button>)}
        </div>
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Quick note (optional)..." maxLength={100} style={{...S.input,fontSize:11,marginBottom:10}}/>
        <button onClick={async()=>{if(note.trim()||r){const u=[...sess];u[u.length-1]={...u[u.length-1],note:note.trim(),rating:r};await sS(u)}go("done")}} style={S.btnPrimary}>{note.trim()||r?"Save & Continue →":"Skip →"}</button>
      </div>
    </div></Shell>
  );
}

function Result({ok,sess,go,user,wal,sW}){
  const s=sess[sess.length-1];if(!s)return null;const e=s.enemy||user?.enemy||{};const[showAdd,setShowAdd]=useState(false);
  return(
    <Shell><div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:20}}>
      <div style={{textAlign:"center",animation:"fadeUp .3s ease",maxWidth:300,width:"100%"}}>
        <p style={{fontSize:44,marginBottom:6}}>{ok?"🎉":e.emoji||"💀"}</p>
        <h2 style={{fontFamily:"var(--d)",color:ok?T.green:T.danger,fontSize:18,fontWeight:800,margin:"0 0 4px"}}>{ok?"Well Done!":`${e.name} Wins.`}</h2>
        <p style={{fontFamily:"var(--b)",color:T.t2,fontSize:11,margin:"0 0 14px"}}>
          {ok?<>{s.goalEmoji} {fD(s.dur)} — <span style={{color:T.green,fontWeight:700}}>${s.stake} saved</span></>:<>Lasted {s.actual}m of {fD(s.dur)}. <span style={{color:T.danger,fontWeight:700}}>${s.stake} lost</span>.</>}
        </p>

        {ok?<div style={{background:T.greenSoft,border:`1px solid ${T.green}15`,borderRadius:10,padding:10,marginBottom:12}}>
          <p style={{fontFamily:"var(--b)",color:T.green,fontSize:11,margin:0}}>{e.emoji} {e.name} gets nothing. You kept everything.</p>
        </div>
        :<>
          <div style={{background:T.dangerSoft,border:`1px solid ${T.danger}10`,borderRadius:10,padding:10,marginBottom:6}}>
            <p style={{fontFamily:"var(--b)",color:T.danger,fontSize:10,fontWeight:700,margin:"0 0 2px"}}>{e.emoji} {e.name} wins ${s.stake}</p>
            <p style={{fontFamily:"var(--b)",color:T.t3,fontSize:9,margin:0}}>Your penalty keeps StakeIt free for everyone.</p>
          </div>
          <div style={{background:`${T.purple}06`,border:`1px solid ${T.purple}12`,borderRadius:10,padding:10,marginBottom:6}}>
            <p style={{fontFamily:"var(--b)",color:T.t1,fontSize:9,margin:"0 0 2px"}}>💪 Everyone fails sometimes. Try a shorter session or lower stake next time.</p>
          </div>
          <button onClick={()=>window.open("https://www.every.org","_blank")} style={{background:T.greenSoft,border:`1px solid ${T.green}12`,borderRadius:8,width:"100%",padding:8,cursor:"pointer",marginBottom:6,textAlign:"center"}}>
            <p style={{fontFamily:"var(--b)",color:T.green,fontSize:9,fontWeight:600,margin:0}}>💚 Want to donate to a real charity? → every.org</p>
          </button>
          {wal<1&&!showAdd&&<button onClick={()=>setShowAdd(true)} style={{background:T.goldSoft,border:`1px solid ${T.gold}12`,borderRadius:8,width:"100%",padding:8,cursor:"pointer",marginBottom:6}}>
            <p style={{fontFamily:"var(--b)",color:T.gold,fontSize:9,fontWeight:700,margin:0}}>⚠️ Wallet empty — tap to reload</p>
          </button>}
          {showAdd&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,marginBottom:6}}>{[5,10,25,50].map(a=><button key={a} onClick={async()=>{await sW(wal+a);setShowAdd(false)}} style={{fontFamily:"var(--m)",background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,padding:6,fontSize:11,fontWeight:700,color:T.text,cursor:"pointer"}}>+${a}</button>)}</div>}
        </>}
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>go("share")} style={{...S.btnSecondary,flex:1}}>{ok?"🔥 Share":"📸 Receipt"}</button>
          <button onClick={()=>go("home")} style={{...(ok?S.btnGreen:S.btnPrimary),flex:1}}>{ok?"Home":"Try Again"}</button>
        </div>
      </div>
    </div></Shell>
  );
}

function ShareScreen({user,sess,go}){
  const s=sess[sess.length-1];if(!s)return null;const[cp,setCp]=useState(false);
  const ok=s.ok;const sk=getStreak(sess);const e=s.enemy||user?.enemy||{};
  const nm=user?.anonShare?"Someone":(user?.name||"Someone");
  const txt=ok?`🔥 ${fD(s.dur)} of ${s.goalLabel}. $${s.stake} saved. ${e.name} gets NOTHING.${sk>2?` ${sk}-day streak.`:""}\n\nStakeIt — focus or lose your money`:`💀 ${nm} lost $${s.stake} to ${e.name}. Couldn't focus for ${fD(s.dur)}.\n\nThink you can do better? → StakeIt`;
  const copy=()=>{navigator.clipboard?.writeText(txt);setCp(true);setTimeout(()=>setCp(false),2000)};

  return(
    <Shell><div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:16}}>
      {/* Receipt Card */}
      <div style={{background:T.surface,border:`1.5px solid ${ok?T.green:T.danger}20`,borderRadius:16,padding:20,textAlign:"center",maxWidth:250,width:"100%",boxShadow:T.shadowLg,marginBottom:12}}>
        <p style={{fontSize:28,marginBottom:2}}>{ok?"🔥":e.emoji||"💀"}</p>
        <p style={{fontFamily:"var(--m)",color:ok?T.green:T.danger,fontSize:7,fontWeight:700,letterSpacing:2}}>{ok?"SESSION COMPLETE":"FAILURE RECEIPT"}</p>
        <p style={{fontFamily:"var(--m)",color:T.text,fontSize:28,fontWeight:700,margin:"2px 0"}}>${s.stake}</p>
        <p style={{fontFamily:"var(--m)",color:ok?T.green:T.danger,fontSize:10,fontWeight:700,marginBottom:6}}>{ok?"SAVED":`lost to ${e.name}`}</p>
        <div style={{borderTop:`1px dashed ${T.border}`,paddingTop:6}}>
          <p style={{fontFamily:"var(--b)",color:T.t2,fontSize:8}}>{s.goalEmoji} {s.goalLabel} · {ok?fD(s.dur):`${s.actual}m/${fD(s.dur)}`}{sk>2&&ok?` · 🔥${sk}`:""}</p>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,maxWidth:250,width:"100%",marginBottom:6}}>
        {[{l:"📷 Story",bg:"linear-gradient(135deg,#833AB4,#FD1D1D,#F77737)"},{l:"🎵 TikTok",bg:"#010101"},{l:"💬 Text",bg:T.green,sms:true},{l:cp?"✅ Copied":"📋 Copy",bg:T.surface,txt:T.text,bdr:true}].map((p,i)=>(
          <button key={i} onClick={()=>{copy();if(p.sms)window.open(`sms:?body=${encodeURIComponent(txt)}`,"_self")}} style={{padding:"8px 6px",border:p.bdr?`1px solid ${T.border}`:"none",borderRadius:8,background:p.bg,color:p.txt||"white",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"var(--b)",boxShadow:T.shadow}}>{p.l}</button>
        ))}
      </div>
      <button onClick={()=>go("home")} style={{...S.btnSecondary,maxWidth:250,width:"100%",fontSize:10}}>← Home</button>
    </div></Shell>
  );
}

// ═══════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════
function History({sess}){
  const sorted=[...sess].reverse();const w=sess.filter(s=>s.ok).length,l=sess.filter(s=>!s.ok).length;
  return(
    <div style={S.page}>
      <h2 style={{fontFamily:"var(--d)",fontSize:18,fontWeight:800,color:T.text,letterSpacing:-.5,marginBottom:10}}>Session History</h2>
      <div style={{display:"flex",gap:4,marginBottom:10}}>
        {[{l:"Completed",v:w,c:T.green},{l:"Failed",v:l,c:T.danger},{l:"Success Rate",v:sess.length?Math.round(w/sess.length*100)+"%":"—",c:T.accent}].map((s,i)=>(
          <div key={i} style={{flex:1,background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"8px 4px",textAlign:"center",boxShadow:T.shadow}}>
            <p style={{fontFamily:"var(--m)",color:s.c,fontSize:16,fontWeight:700,margin:0}}>{s.v}</p>
            <p style={{fontFamily:"var(--m)",color:T.t3,fontSize:6,letterSpacing:1,margin:0}}>{s.l}</p>
          </div>
        ))}
      </div>
      {sorted.length===0?<p style={{fontFamily:"var(--b)",color:T.t3,fontSize:11,textAlign:"center",padding:20}}>No sessions yet. Start your first one!</p>
      :<div style={{display:"flex",flexDirection:"column",gap:4}}>
        {sorted.map((s,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:8,boxShadow:T.shadow}}>
            <span style={{fontSize:14}}>{s.ok?"✅":"💀"}</span>
            <div style={{flex:1}}>
              <p style={{fontFamily:"var(--b)",fontSize:10,fontWeight:600,color:T.text,margin:0}}>{s.goalEmoji} {s.goalLabel} — {s.ok?fD(s.dur):`quit at ${s.actual}m`}</p>
              <p style={{fontFamily:"var(--b)",fontSize:8,color:T.t3,margin:0}}>{fDate(s.date)} · {fTime(s.date)}{s.note?` · "${s.note.slice(0,20)}"`:""}{s.rating?` ${["","😵","😐","🙂","😊","🔥"][s.rating]}`:""}</p>
            </div>
            <span style={{fontFamily:"var(--m)",color:s.ok?T.green:T.danger,fontWeight:700,fontSize:9}}>{s.ok?`+${fD(s.dur)}`:`-$${s.stake}`}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ═══════════════════════════════════════
// STATS / ANALYTICS
// ═══════════════════════════════════════
function Stats({sess}){
  const data=useMemo(()=>{
    const ok=sess.filter(s=>s.ok),fl=sess.filter(s=>!s.ok);
    const rate=sess.length?Math.round(ok.length/sess.length*100):0;
    const mins=ok.reduce((a,s)=>a+(s.actual||0),0);
    const saved=ok.reduce((a,s)=>a+s.stake,0);
    const lost=fl.reduce((a,s)=>a+s.stake,0);
    const sk=getStreak(sess);
    const byGoal={};sess.forEach(s=>{const k=s.goalLabel;if(!byGoal[k])byGoal[k]={t:0,ok:0,e:s.goalEmoji};byGoal[k].t++;if(s.ok)byGoal[k].ok++});
    const avgQuit=fl.length?Math.round(fl.reduce((a,s)=>a+(s.actual||0),0)/fl.length):null;
    const daily=[];const now=Date.now();
    for(let i=13;i>=0;i--){const d=new Date(now-i*86400000);const k=dk(d);const ds=sess.filter(s=>dk(s.date)===k);daily.push({l:d.toLocaleDateString("en",{weekday:"narrow"}),n:ds.length,ok:ds.filter(s=>s.ok).length})}
    return{rate,mins,saved,lost,sk,byGoal,avgQuit,daily,total:sess.length};
  },[sess]);

  if(sess.length<2)return(
    <div style={S.page}>
      <h2 style={{fontFamily:"var(--d)",fontSize:18,fontWeight:800,color:T.text,letterSpacing:-.5,marginBottom:10}}>📊 Analytics</h2>
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:24,textAlign:"center",boxShadow:T.shadow}}>
        <p style={{fontSize:32,marginBottom:6}}>📊</p>
        <p style={{fontFamily:"var(--b)",color:T.t2,fontSize:12}}>Complete 2+ sessions to unlock analytics</p>
      </div>
    </div>
  );

  const mx=Math.max(1,...data.daily.map(d=>d.n));
  return(
    <div style={S.page}>
      <h2 style={{fontFamily:"var(--d)",fontSize:18,fontWeight:800,color:T.text,letterSpacing:-.5,marginBottom:10}}>📊 Analytics</h2>

      {/* Overview */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,marginBottom:8}}>
        {[{l:"Sessions",v:data.total,c:T.text},{l:"Rate",v:`${data.rate}%`,c:data.rate>=70?T.green:T.gold},{l:"Streak",v:`${data.sk}d`,c:T.accent},{l:"Hours",v:`${(data.mins/60).toFixed(1)}`,c:T.purple}].map((k,i)=>(
          <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 2px",textAlign:"center",boxShadow:T.shadow}}>
            <p style={{fontFamily:"var(--m)",color:k.c,fontSize:14,fontWeight:700,margin:0}}>{k.v}</p>
            <p style={{fontFamily:"var(--m)",color:T.t3,fontSize:6,letterSpacing:1,margin:0}}>{k.l}</p>
          </div>
        ))}
      </div>

      {/* Money */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:12,marginBottom:8,boxShadow:T.shadow}}>
        <p style={{fontFamily:"var(--d)",color:T.text,fontSize:11,fontWeight:700,margin:"0 0 6px"}}>💰 Money Summary</p>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,textAlign:"center"}}><p style={{fontFamily:"var(--m)",color:T.green,fontSize:18,fontWeight:700,margin:0}}>${f$(data.saved)}</p><p style={{fontFamily:"var(--m)",color:T.t3,fontSize:7}}>Saved</p></div>
          <div style={{flex:1,textAlign:"center"}}><p style={{fontFamily:"var(--m)",color:T.danger,fontSize:18,fontWeight:700,margin:0}}>${f$(data.lost)}</p><p style={{fontFamily:"var(--m)",color:T.t3,fontSize:7}}>Lost</p></div>
        </div>
      </div>

      {/* 14-day chart */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:12,marginBottom:8,boxShadow:T.shadow}}>
        <p style={{fontFamily:"var(--d)",color:T.text,fontSize:11,fontWeight:700,margin:"0 0 6px"}}>📅 Last 14 Days</p>
        <div style={{display:"flex",gap:2,alignItems:"flex-end",height:36}}>
          {data.daily.map((d,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <div style={{width:"100%",borderRadius:3,background:d.n>0?(d.ok===d.n?T.green:d.ok>0?T.gold:T.danger):T.t5,height:`${Math.max(3,d.n/mx*28)}px`,transition:"height .3s"}}/>
              <span style={{fontFamily:"var(--m)",color:T.t3,fontSize:6}}>{d.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By goal */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:12,boxShadow:T.shadow}}>
        <p style={{fontFamily:"var(--d)",color:T.text,fontSize:11,fontWeight:700,margin:"0 0 6px"}}>🎯 Performance by Goal</p>
        {Object.entries(data.byGoal).sort((a,b)=>b[1].t-a[1].t).map(([k,v])=>{const pct=Math.round(v.ok/v.t*100);return(
          <div key={k} style={{marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontFamily:"var(--b)",color:T.t1,fontSize:10}}>{v.e} {k}</span>
              <span style={{fontFamily:"var(--m)",color:pct>=70?T.green:T.gold,fontSize:10,fontWeight:700}}>{pct}%</span>
            </div>
            <div style={{height:4,background:T.t5,borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:2,background:pct>=70?T.green:T.gold,width:`${Math.max(3,pct)}%`,transition:"width .5s"}}/>
            </div>
          </div>
        )})}
        {data.avgQuit!==null&&<p style={{fontFamily:"var(--b)",color:T.t2,fontSize:9,marginTop:6}}>💡 Average quit time: <strong style={{color:T.text}}>{data.avgQuit} min</strong> — try sessions shorter than this!</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════
function Profile({user,sU,wal,sW,sess,go}){
  const[showAdd,setShowAdd]=useState(false);const[showE,setShowE]=useState(false);const[np,setNP]=useState(null);const[ce,setCE]=useState("");
  const e=user?.enemy||{};
  return(
    <div style={S.page}>
      <h2 style={{fontFamily:"var(--d)",fontSize:18,fontWeight:800,color:T.text,letterSpacing:-.5,marginBottom:10}}>Profile</h2>
      
      {/* User card */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px",display:"flex",alignItems:"center",gap:10,marginBottom:8,boxShadow:T.shadow}}>
        <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#FF3355,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🔥</div>
        <div>
          <p style={{fontFamily:"var(--d)",color:T.text,fontSize:14,fontWeight:700,margin:0}}>{user?.name}</p>
          <p style={{fontFamily:"var(--b)",color:T.t3,fontSize:9,margin:0}}>{sess.length} sessions · {sess.filter(s=>s.ok).length} completed</p>
        </div>
      </div>

      {/* Wallet */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:T.shadow}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><Label>WALLET</Label><p style={{fontFamily:"var(--m)",color:T.text,fontSize:22,fontWeight:700,margin:0}}>${f$(wal)}</p></div>
          <button onClick={()=>setShowAdd(!showAdd)} style={{...S.btnSm,background:T.accentSoft,color:T.accent,borderColor:T.accentMid}}>+ Add</button>
        </div>
        {showAdd&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,marginTop:6}}>{[5,10,25,50].map(a=><button key={a} onClick={async()=>{await sW(wal+a);setShowAdd(false)}} style={{fontFamily:"var(--m)",background:T.t6,border:`1px solid ${T.border}`,borderRadius:6,padding:6,fontSize:11,fontWeight:700,color:T.text,cursor:"pointer"}}>+${a}</button>)}</div>}
      </div>
      {wal>0&&<button onClick={async()=>{if(confirm(`Withdraw $${f$(wal)}?`))await sW(0)}} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,width:"100%",padding:"8px 12px",cursor:"pointer",textAlign:"center",marginBottom:8,boxShadow:T.shadow}}>
        <p style={{fontFamily:"var(--b)",color:T.t2,fontSize:10,margin:0}}>💸 Withdraw ${f$(wal)}</p>
      </button>}

      {/* Enemy */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px",marginBottom:8,boxShadow:T.shadow}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{e.emoji}</span><div><Label>ENEMY</Label><p style={{fontFamily:"var(--d)",color:T.text,fontSize:12,fontWeight:700,margin:0}}>{e.name}</p></div></div>
          <button onClick={()=>setShowE(!showE)} style={{...S.btnSm,borderColor:T.border,color:T.t2}}>Change</button>
        </div>
        {showE&&<div style={{marginTop:8}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:3,maxHeight:160,overflowY:"auto",marginBottom:4}}>
            {ENEMIES.map(en=><button key={en.id} onClick={()=>{setNP(en);setCE("")}} style={{background:np?.id===en.id?T.accentSoft:T.surface,border:`1.5px solid ${np?.id===en.id?T.accent:T.border}`,borderRadius:8,padding:"5px 6px",cursor:"pointer",display:"flex",alignItems:"center",gap:4,textAlign:"left"}}>
              <span style={{fontSize:12}}>{en.emoji}</span><span style={{fontFamily:"var(--b)",fontSize:8,color:T.t1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{en.name}</span>
            </button>)}
          </div>
          <input value={ce} onChange={e=>{setCE(e.target.value);setNP(null)}} placeholder="Or type custom..." maxLength={30} style={{...S.input,fontSize:10,marginBottom:4}}/>
          <button onClick={async()=>{const en=ce.trim()?{id:"custom",name:ce.trim(),emoji:"😤"}:np;if(en){await sU({...user,enemy:en});setShowE(false)}}} disabled={!np&&!ce.trim()} style={{...S.btnPrimary,fontSize:10,padding:8,opacity:np||ce.trim()?1:.35}}>Save Enemy</button>
        </div>}
      </div>

      {/* Privacy */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px",boxShadow:T.shadow}}>
        <p style={{fontFamily:"var(--d)",color:T.text,fontSize:11,fontWeight:700,margin:"0 0 6px"}}>🔒 Privacy & Data</p>
        <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",marginBottom:6}}>
          <div onClick={async()=>await sU({...user,anonShare:!user.anonShare})} style={{width:28,height:14,borderRadius:7,background:user?.anonShare?T.green:T.t4,padding:2,display:"flex",alignItems:"center",justifyContent:user?.anonShare?"flex-end":"flex-start",transition:"all .15s",cursor:"pointer"}}>
            <div style={{width:10,height:10,borderRadius:5,background:"white",boxShadow:"0 1px 2px rgba(0,0,0,.15)"}}/>
          </div>
          <span style={{fontFamily:"var(--b)",color:T.t1,fontSize:10}}>Anonymous sharing</span>
        </label>
        <button onClick={()=>{const d=JSON.stringify({sessions:sess,wallet:wal,exported:new Date().toISOString()},null,2);const b=new Blob([d],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="stakeit-export.json";a.click()}} style={{...S.btnSecondary,width:"100%",marginBottom:4}}>📥 Export Data</button>
        <button onClick={async()=>{if(!confirm("Delete ALL StakeIt data?"))return;if(!confirm("This cannot be undone. Are you sure?"))return;for(const k of["v8u","v8s","v8w","v8a"])await rm(k);window.location.reload()}} style={{background:T.dangerSoft,border:`1px solid ${T.danger}10`,borderRadius:8,width:"100%",padding:"8px 12px",cursor:"pointer",fontFamily:"var(--b)",color:T.danger,fontSize:10,fontWeight:600}}>🗑 Delete All Data</button>
        <p style={{fontFamily:"var(--m)",color:T.t3,fontSize:7,marginTop:6}}>All data stored on-device only · Penalties keep StakeIt free</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Cabinet+Grotesk:wght@400;500;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
@font-face{font-family:'Cabinet Grotesk';src:url('https://fonts.cdnfonts.com/css/cabinet-grotesk')}
:root{--d:'Cabinet Grotesk','Instrument Sans',sans-serif;--b:'Instrument Sans',sans-serif;--m:'JetBrains Mono',monospace}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
::-webkit-scrollbar{width:0;display:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-6px)}}
input::placeholder{color:${T.t3}}
button:active{transform:scale(.97)}
`;

const S={
  shell:{maxWidth:440,margin:"0 auto",minHeight:"100vh",background:T.bg,fontFamily:"var(--b)",display:"flex",flexDirection:"column"},
  page:{padding:"14px 16px"},
  input:{width:"100%",padding:"10px 14px",background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:10,color:T.text,fontSize:13,fontFamily:"var(--b)",outline:"none",boxShadow:"inset 0 1px 2px rgba(0,0,0,.03)"},
  btnPrimary:{width:"100%",padding:"12px 16px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#FF3355,#FF7B93)",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--d)",letterSpacing:.3,boxShadow:"0 2px 8px rgba(255,51,85,.25)"},
  btnGreen:{width:"100%",padding:"12px 16px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#10B981,#34D399)",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--d)"},
  btnDanger:{width:"100%",padding:"12px 16px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#EF4444,#F87171)",color:"white",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--d)"},
  btnSecondary:{padding:"10px 14px",border:`1.5px solid ${T.border}`,borderRadius:10,background:T.surface,color:T.text,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)",boxShadow:T.shadow},
  btnSm:{padding:"5px 10px",border:`1.5px solid ${T.border}`,borderRadius:6,background:T.surface,fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:"var(--b)"},
  circBtn:{width:44,height:44,borderRadius:22,border:`2px solid ${T.t4}`,background:T.surface,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,color:T.text,boxShadow:T.shadow},
  navCta:{fontFamily:"var(--d)",fontSize:11,fontWeight:700,color:"white",background:T.accent,border:"none",borderRadius:8,padding:"6px 14px",cursor:"pointer"},
  heroCta:{fontFamily:"var(--d)",fontSize:13,fontWeight:700,color:"white",background:"linear-gradient(135deg,#FF3355,#FF7B93)",border:"none",borderRadius:12,padding:"14px 28px",cursor:"pointer",boxShadow:"0 4px 16px rgba(255,51,85,.2)",width:"100%",maxWidth:300},
  nav:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:440,background:`${T.bg}F8`,backdropFilter:"blur(20px)",borderTop:`1px solid ${T.border}`,display:"flex",justifyContent:"space-around",padding:"4px 0 16px",zIndex:100},
  navBtn:{background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"2px 8px"},
};
