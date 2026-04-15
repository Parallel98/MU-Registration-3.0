import { useState, useEffect } from "react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const MU = {
  black:"#111111", gold:"#EEB111", goldDark:"#C9920A",
  goldLight:"#FDF3D8", goldMid:"#F5D97A", cream:"#FAFAF7",
  border:"#E8E4D9", borderDark:"#D4CEBC",
  textPrimary:"#111111", textSecond:"#5C5644", textMuted:"#9E9782",
};

function MULogo({ size=36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <path d="M22 2L4 9V24C4 33.5 12 40.5 22 43C32 40.5 40 33.5 40 24V9L22 2Z" fill="#EEB111"/>
      <path d="M10 30V14L22 22L34 14V30" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M10 14L22 22L34 14" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SEMESTERS = ["Spring 2026","Fall 2025","Summer 2025","Spring 2025"];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const DAY_KEYS = ["mon","tue","wed","thu","fri"];
const HOURS = [8,9,10,11,12,13,14,15,16,17];
const HOUR_HEIGHT = 76;

const DEPARTMENTS = ["All Departments","Computer Science (CS)","Mathematics (MATH)","English (ENG)","Physics (PHYS)","History (HIST)","Biology (BIO)","Chemistry (CHEM)","Sociology (SOC)","Psychology (PSYC)","Art (ART)","Music (MUS)"];
const GEN_ED_ATTRS = ["Writing Intensive (WI)","Quantitative Reasoning (QR)","Social & Behavioral Sciences (SB)","Natural Sciences (NS)","Humanities (HU)","Arts (AR)","Global & Multicultural (GM)","First Year Seminar (FYS)"];

const COLORS = {
  "CS 101":  { bg:"#EEF2FF", border:"#C7D2FE", text:"#3730A3", accent:"#4F46E5", chip:"#6366F1" },
  "CS 201":  { bg:"#FFF7ED", border:"#FED7AA", text:"#9A3412", accent:"#EA580C", chip:"#F97316" },
  "MATH 301":{ bg:"#F5F3FF", border:"#DDD6FE", text:"#5B21B6", accent:"#7C3AED", chip:"#8B5CF6" },
  "ENG 102": { bg:"#ECFDF5", border:"#A7F3D0", text:"#065F46", accent:"#059669", chip:"#10B981" },
  "PHYS 201":{ bg:"#FFF0F6", border:"#FBCFE8", text:"#831843", accent:"#DB2777", chip:"#EC4899" },
  "HIST 110":{ bg:"#FFFBEB", border:"#FDE68A", text:"#78350F", accent:"#D97706", chip:"#F59E0B" },
  "BIO 110": { bg:"#F0FDF4", border:"#BBF7D0", text:"#14532D", accent:"#16A34A", chip:"#22C55E" },
  "CHEM 101":{ bg:"#FFF5F0", border:"#FECBA1", text:"#7C2D12", accent:"#EA580C", chip:"#F97316" },
  "CS 301":  { bg:"#F8FAFC", border:"#CBD5E1", text:"#475569", accent:"#64748B", chip:"#94A3B8" },
  "HIST 101":{ bg:"#FFFBEB", border:"#FDE68A", text:"#78350F", accent:"#D97706", chip:"#F59E0B" },
};
const C = (code) => COLORS[code] || { bg:"#F8FAFC", border:"#E2E8F0", text:"#475569", accent:"#64748B", chip:"#94A3B8" };

const COURSES = [
  { id:"CS101",   code:"CS 101",   format:"In-Person",   name:"Introduction to Computer Science", department:"Computer Science (CS)",  genEd:["Quantitative Reasoning (QR)"],                         instructor:"Dr. Smith",    credits:3, seats:12, totalSeats:30, schedule:{days:["mon","wed","fri"],start:9.0, end:10.0}, room:"Caputo Hall 101",        displayTime:"MWF 9:00-10:00 AM",  prereqIds:[], labs:null,
    description:"A comprehensive introduction to the fundamental concepts of programming and computational thinking.", prerequisites:"No prerequisites required.", instructorBio:"Dr. Smith holds a PhD in Computer Science from Penn State." },
  { id:"CS201",   code:"CS 201",   format:"In-Person",   name:"Data Structures",                  department:"Computer Science (CS)",  genEd:["Quantitative Reasoning (QR)"],                         instructor:"Dr. Johnson", credits:4, seats:5,  totalSeats:25, schedule:{days:["tue","thu"],      start:14.0,end:15.5}, room:"Caputo Hall 201",        displayTime:"TTh 2:00-3:30 PM",   prereqIds:["CS101"], labs:null,
    description:"An in-depth study of fundamental data structures.", prerequisites:"CS 101 — Introduction to Computer Science", instructorBio:"Dr. Johnson researches algorithms and data structures." },
  { id:"MATH301", code:"MATH 301", format:"In-Person",   name:"Linear Algebra",                   department:"Mathematics (MATH)",     genEd:["Quantitative Reasoning (QR)"],                         instructor:"Prof. Williams",credits:3,seats:20, totalSeats:35, schedule:{days:["mon","wed","fri"],start:11.0,end:12.0}, room:"Roddy Science Center 101",displayTime:"MWF 11:00-12:00 PM", prereqIds:[], labs:null,
    description:"Covers vector spaces, linear transformations, matrices, determinants, eigenvalues, and eigenvectors.", prerequisites:"No prerequisites required.", instructorBio:"Prof. Williams connects abstract mathematics to real-world applications." },
  { id:"ENG102",  code:"ENG 102",  format:"100% Online", name:"English Composition",              department:"English (ENG)",          genEd:["Writing Intensive (WI)","Humanities (HU)"],            instructor:"Dr. Brown",   credits:3, seats:8,  totalSeats:28, schedule:{days:["tue","thu"],      start:10.0,end:11.5}, room:"Stayer Hall 205",        displayTime:"TTh 10:00-11:30 AM", prereqIds:[], labs:null,
    description:"Develops critical writing and analytical reading skills.", prerequisites:"No prerequisites required.", instructorBio:"Dr. Brown is an award-winning essayist." },
  { id:"PHYS201", code:"PHYS 201", format:"In-Person",   name:"Physics I",                        department:"Physics (PHYS)",         genEd:["Natural Sciences (NS)","Quantitative Reasoning (QR)"], instructor:"Dr. Davis",   credits:4, seats:15, totalSeats:30, schedule:{days:["mon","wed","fri"],start:13.0,end:14.0}, room:"Roddy Science Center 301",displayTime:"MWF 1:00-2:00 PM",   prereqIds:[], labs:[
    { id:"PHYS201-L1", label:"Lab A — Mon 3:00–5:00 PM", room:"Roddy 302", seats:10, totalSeats:14 },
    { id:"PHYS201-L2", label:"Lab B — Wed 3:00–5:00 PM", room:"Roddy 302", seats:4,  totalSeats:14 },
    { id:"PHYS201-L3", label:"Lab C — Fri 2:00–4:00 PM", room:"Roddy 303", seats:0,  totalSeats:14 },
  ], description:"Newtonian mechanics, kinematics, dynamics, work, energy, momentum.", prerequisites:"No prerequisites required.", instructorBio:"Dr. Davis is a theoretical physicist." },
  { id:"CS301",   code:"CS 301",   format:"In-Person",   name:"Algorithms",                       department:"Computer Science (CS)",  genEd:["Quantitative Reasoning (QR)"],                         instructor:"Prof. Martinez",credits:3,seats:0, totalSeats:25, schedule:{days:["tue","thu"],      start:16.0,end:17.5}, room:"Caputo Hall 303",        displayTime:"TTh 4:00-5:30 PM",   prereqIds:["CS201"], labs:null,
    description:"Design and analysis of algorithms, complexity theory, and problem-solving strategies.", prerequisites:"CS 201 — Data Structures", instructorBio:"Prof. Martinez specializes in computational complexity." },
  { id:"HIST101", code:"HIST 101", format:"100% Online", name:"World History",                    department:"History (HIST)",         genEd:["Humanities (HU)","Global & Multicultural (GM)"],       instructor:"Dr. Patel",   credits:3, seats:18, totalSeats:40, schedule:{days:["mon","wed"],      start:14.0,end:15.5}, room:"Stayer Hall 110",        displayTime:"MW 2:00-3:30 PM",    prereqIds:[], labs:null,
    description:"A survey of global civilizations from prehistory to the modern era.", prerequisites:"No prerequisites required.", instructorBio:"Dr. Patel specializes in South Asian and Islamic history." },
  { id:"BIO110",  code:"BIO 110",  format:"In-Person",   name:"Introduction to Biology",          department:"Biology (BIO)",          genEd:["Natural Sciences (NS)"],                               instructor:"Dr. Nguyen",  credits:3, seats:22, totalSeats:35, schedule:{days:["mon","wed","fri"],start:8.0, end:9.0},  room:"Roddy Science Center 104",displayTime:"MWF 8:00-9:00 AM",   prereqIds:[], labs:[
    { id:"BIO110-L1", label:"Lab A — Tue 1:00–3:00 PM", room:"Roddy 110", seats:8,  totalSeats:16 },
    { id:"BIO110-L2", label:"Lab B — Thu 1:00–3:00 PM", room:"Roddy 110", seats:12, totalSeats:16 },
  ], description:"An introductory survey of biological principles.", prerequisites:"No prerequisites required.", instructorBio:"Dr. Nguyen studies marine microbial ecosystems." },
  { id:"CHEM101", code:"CHEM 101", format:"In-Person",   name:"General Chemistry I",              department:"Chemistry (CHEM)",       genEd:["Natural Sciences (NS)","Quantitative Reasoning (QR)"], instructor:"Prof. Garcia",credits:4, seats:14, totalSeats:30, schedule:{days:["tue","thu"],      start:10.0,end:11.5}, room:"Roddy Science Center 201",displayTime:"TTh 10:00-11:30 AM", prereqIds:[], labs:[
    { id:"CHEM101-L1", label:"Lab A — Mon 2:00–5:00 PM", room:"Roddy 210", seats:6, totalSeats:12 },
    { id:"CHEM101-L2", label:"Lab B — Wed 2:00–5:00 PM", room:"Roddy 210", seats:2, totalSeats:12 },
  ], description:"Covers atomic theory, chemical bonding, stoichiometry.", prerequisites:"No prerequisites required.", instructorBio:"Prof. Garcia has won multiple teaching awards." },
];

const INIT_ENROLLED   = [];
const INIT_WAITLISTED = {};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timesOverlap(a, b) {
  if (a.id === b.id) return false;
  const shared = a.schedule.days.some(d => b.schedule.days.includes(d));
  if (!shared) return false;
  return a.schedule.start < b.schedule.end && b.schedule.start < a.schedule.end;
}
function checkConflicts(course, enrolledIds) {
  const ec = COURSES.filter(c => enrolledIds.includes(c.id));
  const timeConflicts = ec.filter(e => timesOverlap(course, e));
  const missingPrereqs = course.prereqIds.map(pid => COURSES.find(c => c.id===pid)).filter(pc => pc && !enrolledIds.includes(pc.id));
  return { timeConflicts, missingPrereqs };
}
function timeFrac(h) { return h - HOURS[0]; }
function fmtHour(h) {
  if (h===12) return "12:00 PM";
  return h>12 ? `${h-12}:00 PM` : `${h}:00 AM`;
}

// ─── Hold Banner ──────────────────────────────────────────────────────────────
function HoldBanner({ onDismiss }) {
  return (
    <div style={{background:"linear-gradient(90deg,#991B1B,#BE123C)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 20px",gap:12,fontFamily:"'DM Sans',sans-serif",flexShrink:0,zIndex:50}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span>⚠️</span>
        <span style={{fontSize:13,fontWeight:700}}>
          <strong>Action Required: Advising Hold Active.</strong>{" "}
          <span style={{fontWeight:400,opacity:0.9}}>You must clear this hold before registration opens.</span>
        </span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <a href="#" onClick={e=>e.preventDefault()} style={{fontSize:12,fontWeight:700,color:"#FECDD3",textDecoration:"underline",whiteSpace:"nowrap"}}>Learn how to clear →</a>
        <button onClick={onDismiss} style={{background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:6,color:"#fff",fontSize:12,fontWeight:700,padding:"3px 12px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Dismiss</button>
      </div>
    </div>
  );
}

// ─── Format Badge ─────────────────────────────────────────────────────────────
function FormatBadge({ format }) {
  const online = format==="100% Online";
  return (
    <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:20,background:online?"#DCFCE7":"#EFF6FF",color:online?"#15803D":"#1D4ED8",border:`1px solid ${online?"#86EFAC":"#BFDBFE"}`}}>
      {online?"🌐 Online":"🏫 In-Person"}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let _tid = 0;
function Toast({ toast, onDismiss }) {
  const [vis, setVis] = useState(false);
  const ok = toast.type==="success";
  useEffect(()=>{
    requestAnimationFrame(()=>setVis(true));
    const t=setTimeout(()=>{setVis(false);setTimeout(()=>onDismiss(toast.id),300);},4500);
    return ()=>clearTimeout(t);
  },[]);
  return (
    <div onClick={()=>{setVis(false);setTimeout(()=>onDismiss(toast.id),250);}}
      style={{display:"flex",alignItems:"flex-start",gap:10,padding:"11px 16px 11px 14px",background:ok?"#141A0F":"#1A1208",borderRadius:100,boxShadow:"0 8px 24px rgba(0,0,0,0.25)",border:ok?"1px solid rgba(16,185,129,0.25)":"1px solid rgba(239,68,68,0.25)",maxWidth:420,cursor:"pointer",pointerEvents:"all",transform:vis?"translateY(0)":"translateY(16px)",opacity:vis?1:0,transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)"}}>
      <div style={{width:18,height:18,borderRadius:"50%",flexShrink:0,marginTop:1,background:ok?"rgba(16,185,129,0.15)":"rgba(239,68,68,0.15)",border:`1.5px solid ${ok?"#10B981":"#EF4444"}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {ok?<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
           :<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 2V5" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round"/><circle cx="4.5" cy="7" r="0.7" fill="#EF4444"/></svg>}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:13,fontWeight:700,color:"#fff",lineHeight:1.3}}>{toast.title}</div>
        {toast.body&&<div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginTop:2,lineHeight:1.5}}>{toast.body}</div>}
        {toast.chips?.length>0&&<div style={{marginTop:5,display:"flex",gap:4,flexWrap:"wrap"}}>{toast.chips.map(n=><span key={n} style={{fontSize:10,fontWeight:700,padding:"1px 7px",background:"rgba(239,68,68,0.18)",color:"#FCA5A5",borderRadius:20,border:"1px solid rgba(239,68,68,0.3)"}}>{n}</span>)}</div>}
      </div>
    </div>
  );
}
function ToastStack({ toasts, onDismiss }) {
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:300,display:"flex",flexDirection:"column-reverse",gap:8,alignItems:"center",pointerEvents:"none"}}>
      {toasts.map(t=><Toast key={t.id} toast={t} onDismiss={onDismiss}/>)}
    </div>
  );
}

// ─── Slide-Over Drawer ────────────────────────────────────────────────────────
function SlideOver({ course, enrolled, onClose, onRegister }) {
  const [vis, setVis] = useState(false);
  const c = C(course.code);
  const isEnrolled = enrolled.includes(course.id);
  const { timeConflicts, missingPrereqs } = checkConflicts(course, enrolled);
  const hasConflict = !isEnrolled && (timeConflicts.length>0||missingPrereqs.length>0);
  const seatPct = ((course.totalSeats-course.seats)/course.totalSeats)*100;

  useEffect(()=>{
    requestAnimationFrame(()=>setVis(true));
    const fn = e=>{if(e.key==="Escape")close();};
    window.addEventListener("keydown",fn);
    return ()=>window.removeEventListener("keydown",fn);
  },[]);
  function close(){setVis(false);setTimeout(onClose,300);}

  return (
    <>
      <div onClick={close} style={{position:"fixed",inset:0,zIndex:100,background:"rgba(17,17,17,0.25)",opacity:vis?1:0,transition:"opacity 0.3s",backdropFilter:"blur(2px)"}}/>
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:"clamp(320px,28vw,460px)",background:"#fff",boxShadow:"-6px 0 40px rgba(0,0,0,0.15)",zIndex:101,transform:vis?"translateX(0)":"translateX(100%)",transition:"transform 0.3s cubic-bezier(0.32,0,0,1)",display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{height:4,background:hasConflict?"#EF4444":`linear-gradient(90deg,${MU.gold},${MU.goldDark})`,flexShrink:0}}/>
        <div style={{padding:"18px 22px 0"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
              <span style={{background:c.bg,border:`1.5px solid ${c.border}`,color:c.text,fontSize:13,fontWeight:800,padding:"3px 10px",borderRadius:7}}>{course.code}</span>
              <span style={{fontSize:12,color:MU.textMuted}}>{course.seats}/{course.totalSeats} seats</span>
              <FormatBadge format={course.format}/>
            </div>
            <button onClick={close} style={{background:"none",border:"none",cursor:"pointer",color:MU.textMuted,fontSize:18,padding:"0 4px",lineHeight:1}} onMouseEnter={e=>e.currentTarget.style.color=MU.black} onMouseLeave={e=>e.currentTarget.style.color=MU.textMuted}>✕</button>
          </div>
          <h2 style={{margin:"0 0 2px",fontSize:20,fontWeight:800,color:MU.black,letterSpacing:"-0.02em"}}>{course.name}</h2>
          <p style={{margin:"0 0 14px",fontSize:13,color:MU.textSecond}}>{course.credits} Credits</p>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
            {[{icon:"🕐",t:course.displayTime},{icon:"📍",t:course.room},{icon:"👤",t:course.instructor}].map(({icon,t})=>(
              <div key={t} style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:12,width:18,textAlign:"center"}}>{icon}</span>
                <span style={{fontSize:13,color:MU.textPrimary}}>{t}</span>
              </div>
            ))}
          </div>
          {/* Seat bar */}
          <div style={{marginBottom:14,padding:"9px 12px",background:MU.cream,borderRadius:8,border:`1px solid ${MU.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:10,color:MU.textMuted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Seat Availability</span>
              <span style={{fontSize:11,color:seatPct>80?"#EF4444":MU.goldDark,fontWeight:700}}>{course.seats} left</span>
            </div>
            <div style={{height:4,background:MU.border,borderRadius:10,overflow:"hidden"}}>
              <div style={{width:`${seatPct}%`,height:"100%",background:seatPct>80?"#EF4444":MU.gold,borderRadius:10}}/>
            </div>
          </div>
          <div style={{height:1,background:MU.border}}/>
        </div>
        <div style={{flex:1,padding:"0 22px",overflowY:"auto"}}>
          {hasConflict&&(
            <div style={{marginTop:14}}>
              {timeConflicts.length>0&&(
                <div style={{background:"#FEF2F2",border:"1.5px solid #FECACA",borderRadius:10,padding:"10px 14px",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:800,color:"#DC2626",marginBottom:6}}>⛔ Time Conflict</div>
                  {timeConflicts.map(tc=><div key={tc.id} style={{display:"flex",gap:8,alignItems:"center",padding:"4px 8px",background:"rgba(239,68,68,0.07)",borderRadius:6,marginBottom:3}}><span style={{fontSize:12,fontWeight:700,color:"#B91C1C"}}>{tc.code}</span><span style={{fontSize:11,color:"#9CA3AF"}}>{tc.displayTime}</span></div>)}
                </div>
              )}
              {missingPrereqs.length>0&&(
                <div style={{background:"#FFFBEB",border:"1.5px solid #FDE68A",borderRadius:10,padding:"10px 14px",marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:800,color:"#92400E",marginBottom:6}}>⚠️ Missing Prerequisites</div>
                  {missingPrereqs.map(mp=><div key={mp.id} style={{display:"flex",gap:8,alignItems:"center",padding:"4px 8px",background:"rgba(217,119,6,0.06)",borderRadius:6,marginBottom:3}}><span style={{fontSize:12,fontWeight:700,color:"#92400E"}}>{mp.code}</span><span style={{fontSize:11,color:"#9CA3AF"}}>{mp.name}</span></div>)}
                </div>
              )}
            </div>
          )}
          {[["Course Description",<p style={{fontSize:13,color:MU.textSecond,lineHeight:1.75,margin:0}}>{course.description}</p>],["Prerequisites",<p style={{fontSize:13,color:course.prereqIds.length>0?MU.textSecond:MU.textMuted,lineHeight:1.7,margin:0}}>{course.prerequisites}</p>],["Instructor",<div style={{display:"flex",gap:10}}><div style={{width:36,height:36,borderRadius:"50%",background:MU.goldLight,border:`2px solid ${MU.goldMid}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:MU.goldDark,flexShrink:0}}>{course.instructor.split(" ").pop()[0]}</div><div><div style={{fontWeight:700,fontSize:13,color:MU.black,marginBottom:3}}>{course.instructor}</div><p style={{fontSize:12,color:MU.textSecond,lineHeight:1.6,margin:0}}>{course.instructorBio}</p></div></div>]].map(([title,content])=>(
            <div key={title} style={{marginTop:18,paddingBottom:16,borderBottom:`1px solid ${MU.border}`}}>
              <h3 style={{fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 8px"}}>{title}</h3>
              {content}
            </div>
          ))}
          {course.genEd.length>0&&(
            <div style={{marginTop:18,paddingBottom:16}}>
              <h3 style={{fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",margin:"0 0 8px"}}>Gen Ed</h3>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{course.genEd.map(g=><span key={g} style={{fontSize:11,fontWeight:700,padding:"3px 9px",background:MU.goldLight,color:MU.goldDark,border:`1px solid ${MU.goldMid}`,borderRadius:20}}>{g}</span>)}</div>
            </div>
          )}
        </div>
        <div style={{padding:"12px 22px 16px",borderTop:`1px solid ${MU.border}`}}>
          <button onClick={()=>{if(!hasConflict||isEnrolled){onRegister(course.id);close();}}}
            style={{width:"100%",padding:"12px 0",background:isEnrolled?MU.cream:hasConflict?MU.cream:`linear-gradient(135deg,${MU.gold},${MU.goldDark})`,color:isEnrolled?MU.textMuted:hasConflict?MU.textMuted:MU.black,border:hasConflict&&!isEnrolled?`1.5px solid ${MU.border}`:"none",borderRadius:9,fontSize:14,fontWeight:800,cursor:hasConflict&&!isEnrolled?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:!hasConflict&&!isEnrolled?`0 3px 14px rgba(238,177,17,0.4)`:"none"}}>
            {isEnrolled?"✓ Enrolled — Click to Drop":hasConflict?"🚫 Cannot Register":"Register for Course"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Course Card (sidebar) ────────────────────────────────────────────────────
function CourseCard({ course, enrolled, waitlisted, wishlist, onView, onAdd, onWishlist, hovered, onHover, onHoverEnd }) {
  const c = C(course.code);
  const isEnrolled = enrolled.includes(course.id);
  const isWL = !!waitlisted[course.id];
  const isFull = course.seats === 0;
  const isWishlisted = wishlist.includes(course.id);
  const { timeConflicts, missingPrereqs } = checkConflicts(course, enrolled);
  const hasConflict = !isEnrolled && !isWL && (timeConflicts.length>0||missingPrereqs.length>0);
  const [labsOpen, setLabsOpen] = useState(false);
  const [selLab, setSelLab] = useState(null);

  return (
    <div onMouseEnter={()=>onHover(course.id)} onMouseLeave={onHoverEnd}
      style={{background:"#fff",border:`1px solid ${hovered?c.border:MU.border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",transition:"all 0.15s",boxShadow:hovered?`0 4px 16px rgba(0,0,0,0.08)`:"0 1px 3px rgba(0,0,0,0.04)"}}>
      
      {/* Top row: code chip + seats + wishlist + credits */}
      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
        <span style={{fontSize:11,fontWeight:800,padding:"3px 9px",borderRadius:6,background:c.bg,color:c.text,border:`1px solid ${c.border}`,letterSpacing:"0.02em"}}>{course.code}</span>
        {isFull
          ? <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"#FEF2F2",color:"#EF4444",border:"1px solid #FECACA"}}>Full</span>
          : isEnrolled
            ? <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"#ECFDF5",color:"#10B981",border:"1px solid #A7F3D0"}}>✓ Enrolled</span>
            : isWL
              ? <span style={{fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:20,background:"#FFFBEB",color:"#D97706",border:"1px solid #FDE68A"}}>⏳ Waitlist #{waitlisted[course.id]}</span>
              : <span style={{fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,background:MU.goldLight,color:MU.goldDark,border:`1px solid ${MU.goldMid}`}}>{course.seats} seats</span>}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
          {/* Wishlist bookmark */}
          <button onClick={e=>{e.stopPropagation();onWishlist(course.id);}}
            title={isWishlisted?"Remove from Wishlist":"Add to Wishlist"}
            style={{background:"none",border:"none",cursor:"pointer",padding:"2px 3px",borderRadius:5,color:isWishlisted?"#E11D48":MU.borderDark,transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center"}}
            onMouseEnter={e=>e.currentTarget.style.color=isWishlisted?"#9F1239":"#E11D48"}
            onMouseLeave={e=>e.currentTarget.style.color=isWishlisted?"#E11D48":MU.borderDark}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill={isWishlisted?"#E11D48":"none"}>
              <path d="M7 12S2 8.5 2 5.5A3 3 0 0 1 7 3.5a3 3 0 0 1 5 2c0 3-5 6.5-5 6.5Z" stroke={isWishlisted?"#E11D48":"currentColor"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span style={{fontSize:12,fontWeight:700,color:MU.textMuted,flexShrink:0}}>{course.credits} cr</span>
        </div>
      </div>

      {/* Course name */}
      <div onClick={()=>onView(course)} style={{fontSize:13,fontWeight:700,color:MU.black,lineHeight:1.35,marginBottom:7}}>{course.name}</div>

      {/* Instructor + time */}
      <div style={{display:"flex",flexDirection:"column",gap:3,marginBottom:8}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="3.5" r="2" stroke={MU.textMuted} strokeWidth="1.2"/><path d="M1 9.5c0-2 2-3 4.5-3s4.5 1 4.5 3" stroke={MU.textMuted} strokeWidth="1.2" strokeLinecap="round"/></svg>
          <span style={{fontSize:12,color:MU.textSecond}}>{course.instructor}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke={MU.textMuted} strokeWidth="1.2"/><path d="M5.5 3v2.5l1.5 1" stroke={MU.textMuted} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{fontSize:12,color:MU.textSecond}}>{course.displayTime}</span>
        </div>
      </div>

      {/* Format badge */}
      <div style={{marginBottom:course.labs?8:0}}>
        <FormatBadge format={course.format}/>
        {hasConflict&&<span style={{marginLeft:5,fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:20,background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA"}}>Conflict</span>}
      </div>

      {/* Lab accordion */}
      {course.labs&&(
        <div style={{borderTop:`1px solid ${MU.border}`,marginTop:8,paddingTop:8}}>
          <button onClick={e=>{e.stopPropagation();setLabsOpen(o=>!o);}} style={{display:"flex",alignItems:"center",gap:5,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"'DM Sans',sans-serif",width:"100%"}}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{transform:labsOpen?"rotate(90deg)":"none",transition:"transform 0.2s",flexShrink:0}}><path d="M3 2.5l3.5 2.5L3 7.5" stroke={MU.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{fontSize:11,fontWeight:700,color:MU.textSecond}}>🧪 Lab Sections ({course.labs.length})</span>
            {selLab&&<span style={{marginLeft:"auto",fontSize:10,color:MU.goldDark,fontWeight:700}}>✓ Selected</span>}
          </button>
          {labsOpen&&(
            <div style={{marginTop:7,display:"flex",flexDirection:"column",gap:5}}>
              {course.labs.map(lab=>{
                const full=lab.seats===0;
                const sel=selLab===lab.id;
                return (
                  <div key={lab.id} onClick={e=>{e.stopPropagation();if(!full)setSelLab(lab.id);}}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderRadius:7,background:sel?MU.goldLight:full?"#FEF2F2":"#FAFAFA",border:`1.5px solid ${sel?MU.goldMid:full?"#FECACA":MU.border}`,cursor:full?"not-allowed":"pointer",opacity:full?0.7:1}}>
                    <div style={{width:12,height:12,borderRadius:"50%",border:`2px solid ${sel?MU.gold:MU.borderDark}`,background:sel?MU.gold:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {sel&&<div style={{width:5,height:5,borderRadius:"50%",background:MU.black}}/>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,fontWeight:700,color:full?"#9CA3AF":MU.textPrimary,lineHeight:1.2}}>{lab.label}</div>
                      <div style={{fontSize:10,color:MU.textMuted}}>{lab.room}</div>
                    </div>
                    <span style={{fontSize:10,fontWeight:700,color:full?"#EF4444":lab.seats<5?"#D97706":"#059669",whiteSpace:"nowrap"}}>
                      {full?"FULL":`${lab.seats} open`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Drop button */}
      <div style={{marginTop:10}} onClick={e=>e.stopPropagation()}>
        <button onClick={()=>onAdd(course.id)}
          disabled={!isEnrolled&&(isFull||(hasConflict&&!isWL))}
          style={{width:"100%",padding:"7px 0",background:isEnrolled?"#FEF2F2":isFull||hasConflict?MU.cream:`linear-gradient(135deg,${MU.black} 0%,#2a2a2a 100%)`,color:isEnrolled?"#EF4444":isFull||hasConflict?MU.textMuted:MU.gold,border:isEnrolled?"1px solid #FECACA":isFull||hasConflict?`1px solid ${MU.border}`:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:!isEnrolled&&(isFull||hasConflict)?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif",transition:"filter 0.15s"}}
          onMouseEnter={e=>{if(!(!isEnrolled&&(isFull||hasConflict)))e.currentTarget.style.filter="brightness(1.12)";}}
          onMouseLeave={e=>e.currentTarget.style.filter="none"}>
          {isEnrolled?"Drop Course":isFull?"Section Full":hasConflict?"⚠ Conflict":"+ Add to Schedule"}
        </button>
      </div>
    </div>
  );
}

// ─── Wishlist Panel ───────────────────────────────────────────────────────────
function WishlistPanel({ wishlist, enrolled, waitlisted, onRemove, onAdd, onView }) {
  const wishlistedCourses = COURSES.filter(c => wishlist.includes(c.id));

  if (wishlist.length === 0) {
    return (
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",textAlign:"center",gap:12}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:"#FFF1F2",border:"2px solid #FECDD3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 19S3 13.5 3 8.5a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 5-8 10.5-8 10.5Z" stroke="#FDA4AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{fontSize:14,fontWeight:700,color:MU.textSecond}}>Your wishlist is empty</div>
        <div style={{fontSize:12,color:MU.textMuted,lineHeight:1.6}}>Click the ♡ on any course card to save it here for later.</div>
      </div>
    );
  }

  return (
    <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
      <div style={{fontSize:11,color:MU.textMuted,fontWeight:600,padding:"2px 4px",letterSpacing:"0.03em"}}>
        {wishlistedCourses.length} saved course{wishlistedCourses.length!==1?"s":""} — previewing on schedule
      </div>
      {wishlistedCourses.map(course => {
        const c = C(course.code);
        const isEnrolled = enrolled.includes(course.id);
        const isFull = course.seats === 0;
        const { timeConflicts, missingPrereqs } = checkConflicts(course, enrolled);
        const hasConflict = !isEnrolled && (timeConflicts.length>0||missingPrereqs.length>0);
        const seatColor = course.seats===0?"#EF4444":course.seats<8?"#D97706":"#059669";

        return (
          <div key={course.id} style={{background:"#fff",border:`1px solid ${hasConflict?"#FECACA":c.border}`,borderLeft:`3px solid ${hasConflict?"#EF4444":c.accent}`,borderRadius:10,overflow:"hidden",transition:"box-shadow 0.15s",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            {/* Course info row */}
            <div onClick={()=>onView(course)} style={{padding:"10px 12px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=MU.cream} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                <span style={{fontSize:11,fontWeight:800,padding:"2px 7px",borderRadius:5,background:c.bg,color:c.text,border:`1px solid ${c.border}`}}>{course.code}</span>
                {isEnrolled && <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:20,background:"#ECFDF5",color:"#10B981",border:"1px solid #A7F3D0"}}>✓ Enrolled</span>}
                {hasConflict && !isEnrolled && <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:20,background:"#FEF2F2",color:"#EF4444",border:"1px solid #FECACA"}}>Conflict</span>}
                <span style={{marginLeft:"auto",fontSize:11,fontWeight:700,color:seatColor}}>{isFull?"Full":`${course.seats} seats`}</span>
              </div>
              <div style={{fontSize:13,fontWeight:700,color:MU.black,lineHeight:1.3,marginBottom:4}}>{course.name}</div>
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:MU.textSecond}}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1"/><path d="M5 3v2l1.2 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                  {course.displayTime}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:MU.textSecond}}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="3.5" r="1.8" stroke="currentColor" strokeWidth="1"/><path d="M1 9c0-2 1.8-3 4-3s4 1 4 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                  {course.instructor}
                </div>
              </div>
              {hasConflict && !isEnrolled && (
                <div style={{marginTop:6,padding:"5px 8px",background:"#FEF2F2",borderRadius:6,fontSize:11,color:"#DC2626"}}>
                  {timeConflicts.length>0 && `Overlaps with ${timeConflicts.map(c=>c.code).join(", ")}`}
                  {missingPrereqs.length>0 && `Missing: ${missingPrereqs.map(c=>c.code).join(", ")}`}
                </div>
              )}
            </div>
            {/* Action row */}
            <div style={{display:"flex",borderTop:`1px solid ${MU.border}`}}>
              <button onClick={()=>onRemove(course.id)} style={{flex:1,padding:"7px 0",background:"none",border:"none",borderRight:`1px solid ${MU.border}`,cursor:"pointer",fontSize:11,fontWeight:700,color:MU.textMuted,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:5}} onMouseEnter={e=>e.currentTarget.style.background=MU.cream} onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M8.5 2.5l-6 6M2.5 2.5l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Remove
              </button>
              <button onClick={()=>!hasConflict&&!isFull&&!isEnrolled&&onAdd(course.id)}
                style={{flex:2,padding:"7px 0",background:isEnrolled?"#ECFDF5":hasConflict||isFull?MU.cream:`linear-gradient(135deg,${MU.black},#2a2a2a)`,border:"none",cursor:isEnrolled||hasConflict||isFull?"default":"pointer",fontSize:11,fontWeight:700,color:isEnrolled?"#10B981":hasConflict||isFull?MU.textMuted:MU.gold,fontFamily:"'DM Sans',sans-serif"}} onMouseEnter={e=>{if(!isEnrolled&&!hasConflict&&!isFull)e.currentTarget.style.filter="brightness(1.15)";}} onMouseLeave={e=>e.currentTarget.style.filter="none"}>
                {isEnrolled?"✓ Already Enrolled":isFull?"Section Full":hasConflict?"⚠ Has Conflict":"+ Add to Schedule"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Advanced Search Panel ────────────────────────────────────────────────────
function AdvancedSearch({ enrolled, waitlisted, onRegister, onView, wishlist, onWishlist }) {
  const [dept, setDept] = useState("All Departments");
  const [courseName, setCourseName] = useState("");
  const [courseNum, setCourseNum] = useState("");
  const [selGenEd, setSelGenEd] = useState([]);
  const [offeredThisTerm, setOfferedThisTerm] = useState(true);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [genEdOpen, setGenEdOpen] = useState(false);
  const [courseBar, setCourseBar] = useState([]);
  const [expandedLabs, setExpandedLabs] = useState({});
  const [selectedLabs, setSelectedLabs] = useState({});

  function doSearch() {
    let f = COURSES;
    if (dept!=="All Departments") f=f.filter(c=>c.department===dept);
    if (courseName.trim()) f=f.filter(c=>c.name.toLowerCase().includes(courseName.toLowerCase()));
    if (courseNum.trim()) f=f.filter(c=>c.code.toLowerCase().includes(courseNum.toLowerCase()));
    if (selGenEd.length>0) f=f.filter(c=>selGenEd.every(a=>c.genEd.includes(a)));
    setResults(f); setSearched(true);
  }
  function doClear() { setDept("All Departments"); setCourseName(""); setCourseNum(""); setSelGenEd([]); setResults([]); setSearched(false); }

  const inp={width:"100%",boxSizing:"border-box",padding:"8px 11px",background:"#fff",border:`1.5px solid ${MU.border}`,borderRadius:7,fontSize:13,color:MU.textPrimary,fontFamily:"'DM Sans',sans-serif",outline:"none"};
  const lbl={fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4,display:"block"};

  return (
    <div style={{display:"flex",gap:20,height:"100%",minHeight:0}}>
      {/* Filter */}
      <div style={{width:272,flexShrink:0,background:"#fff",borderRadius:12,border:`1px solid ${MU.border}`,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.05)"}}>
        <div style={{background:MU.black,padding:"13px 16px",flexShrink:0}}>
          <div style={{fontSize:12,fontWeight:800,color:MU.gold,letterSpacing:"0.08em",textTransform:"uppercase"}}>Search Filters</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 14px"}}>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Department</label>
            <div style={{position:"relative"}}>
              <button onClick={()=>setDeptOpen(o=>!o)} style={{...inp,textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:dept==="All Departments"?MU.textMuted:MU.textPrimary,fontSize:13}}>{dept}</span>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2.5 4.5l3 3 3-3" stroke={MU.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {deptOpen&&(
                <div style={{position:"absolute",top:"calc(100% + 3px)",left:0,right:0,background:"#fff",border:`1.5px solid ${MU.border}`,borderRadius:9,boxShadow:"0 8px 28px rgba(0,0,0,0.12)",zIndex:60,maxHeight:220,overflowY:"auto"}}>
                  {DEPARTMENTS.map(d=><button key={d} onClick={()=>{setDept(d);setDeptOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"8px 13px",background:d===dept?MU.goldLight:"transparent",border:"none",cursor:"pointer",fontSize:12,color:d===dept?MU.goldDark:MU.textPrimary,fontWeight:d===dept?700:400,fontFamily:"'DM Sans',sans-serif",borderLeft:d===dept?`3px solid ${MU.gold}`:"3px solid transparent"}} onMouseEnter={e=>{if(d!==dept)e.currentTarget.style.background=MU.cream;}} onMouseLeave={e=>{if(d!==dept)e.currentTarget.style.background="transparent";}}>{d}</button>)}
                </div>
              )}
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Course Name <span style={{textTransform:"none",fontWeight:400,letterSpacing:0}}>(optional)</span></label>
            <input value={courseName} onChange={e=>setCourseName(e.target.value)} placeholder="e.g. Linear Algebra" style={inp} onFocus={e=>e.target.style.borderColor=MU.gold} onBlur={e=>e.target.style.borderColor=MU.border} onKeyDown={e=>{if(e.key==="Enter")doSearch();}}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={lbl}>Course Number <span style={{textTransform:"none",fontWeight:400,letterSpacing:0}}>(optional)</span></label>
            <input value={courseNum} onChange={e=>setCourseNum(e.target.value)} placeholder="e.g. 101 or CS" style={inp} onFocus={e=>e.target.style.borderColor=MU.gold} onBlur={e=>e.target.style.borderColor=MU.border} onKeyDown={e=>{if(e.key==="Enter")doSearch();}}/>
          </div>
          <div style={{marginBottom:16}}>
            <button onClick={()=>setGenEdOpen(o=>!o)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:5}}>
              <span style={lbl}>Gen Ed <span style={{textTransform:"none",fontWeight:400,letterSpacing:0}}>(optional)</span></span>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{transform:genEdOpen?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0}}><path d="M2.5 4.5l3 3 3-3" stroke={MU.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {genEdOpen&&GEN_ED_ATTRS.map(attr=>{
              const chk=selGenEd.includes(attr);
              return <div key={attr} onClick={()=>setSelGenEd(p=>p.includes(attr)?p.filter(a=>a!==attr):[...p,attr])} style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",padding:"5px 9px",borderRadius:6,background:chk?MU.goldLight:"transparent",marginBottom:3}}>
                <div style={{width:14,height:14,borderRadius:3,border:`2px solid ${chk?MU.gold:MU.borderDark}`,background:chk?MU.gold:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {chk&&<svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span style={{fontSize:11,color:chk?MU.goldDark:MU.textSecond,fontWeight:chk?700:400}}>{attr}</span>
              </div>;
            })}
          </div>
          {/* Toggle */}
          <div onClick={()=>setOfferedThisTerm(o=>!o)} style={{display:"flex",alignItems:"center",gap:9,marginBottom:18,padding:"9px 11px",background:MU.cream,borderRadius:8,border:`1px solid ${MU.border}`,cursor:"pointer"}}>
            <div style={{width:34,height:19,borderRadius:19,background:offeredThisTerm?MU.gold:MU.borderDark,position:"relative",transition:"background 0.2s",flexShrink:0}}>
              <div style={{position:"absolute",top:2.5,left:offeredThisTerm?16:2.5,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
            </div>
            <span style={{fontSize:12,fontWeight:700,color:offeredThisTerm?MU.textPrimary:MU.textMuted,userSelect:"none"}}>Offered This Term Only</span>
          </div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={doSearch} style={{flex:1,padding:"9px 0",background:`linear-gradient(135deg,${MU.gold},${MU.goldDark})`,color:MU.black,border:"none",borderRadius:7,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.07)"} onMouseLeave={e=>e.currentTarget.style.filter="none"}>Search</button>
            <button onClick={doClear} style={{padding:"9px 13px",background:MU.cream,color:MU.textSecond,border:`1px solid ${MU.border}`,borderRadius:7,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background=MU.border} onMouseLeave={e=>e.currentTarget.style.background=MU.cream}>Clear</button>
          </div>
        </div>
      </div>
      {/* Results */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,gap:12}}>
        {courseBar.length>0&&(
          <div style={{background:"#fff",border:`1px solid ${MU.border}`,borderRadius:9,padding:"9px 14px",boxShadow:"0 1px 4px rgba(0,0,0,0.04)",flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:7}}>Course Bar</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {courseBar.map(cid=>{
                const course=COURSES.find(c=>c.id===cid);if(!course)return null;
                const cc=C(course.code);const isE=enrolled.includes(cid);
                const {timeConflicts:tc,missingPrereqs:mp}=checkConflicts(course,enrolled);
                const hc=!isE&&(tc.length>0||mp.length>0);
                return <div key={cid} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 9px",background:cc.bg,border:`1.5px solid ${cc.border}`,borderRadius:7}}>
                  <span style={{fontSize:12,fontWeight:700,color:cc.text}}>{course.code}</span>
                  <button onClick={()=>onRegister(cid)} disabled={hc&&!isE} style={{fontSize:11,fontWeight:700,padding:"1px 7px",background:isE?"#FEF2F2":hc?MU.cream:MU.black,color:isE?"#EF4444":hc?MU.textMuted:MU.gold,border:"none",borderRadius:4,cursor:hc&&!isE?"not-allowed":"pointer",fontFamily:"'DM Sans',sans-serif"}}>{isE?"Drop":hc?"Conflict":"+ Add"}</button>
                  <button onClick={()=>setCourseBar(p=>p.filter(id=>id!==cid))} style={{background:"none",border:"none",cursor:"pointer",color:MU.textMuted,fontSize:13,lineHeight:1,padding:"0 1px"}}>×</button>
                </div>;
              })}
            </div>
          </div>
        )}
        <div style={{flex:1,background:"#fff",borderRadius:12,border:`1px solid ${MU.border}`,boxShadow:"0 1px 6px rgba(0,0,0,0.05)",overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0}}>
          <div style={{background:MU.cream,padding:"10px 18px",borderBottom:`1px solid ${MU.border}`,flexShrink:0,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,fontWeight:700,color:MU.textSecond}}>{!searched?"Search results will appear here":results.length===0?"No courses matched":`${results.length} course${results.length!==1?"s":""} found`}</div>
            {searched&&results.length>0&&<span style={{fontSize:11,color:MU.textMuted}}>Click row to view · Add to course bar</span>}
          </div>
          {results.length>0&&(
            <div style={{display:"grid",gridTemplateColumns:"88px 1fr 88px 65px 44px 115px",borderBottom:`1.5px solid ${MU.border}`,background:MU.cream,flexShrink:0}}>
              {["Course #","Course Name","Open Seats","Credits","","Action"].map((h,i)=><div key={h} style={{padding:"7px 13px",fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",borderLeft:i>0?`1px solid ${MU.border}`:"none"}}>{h}</div>)}
            </div>
          )}
          <div style={{flex:1,overflowY:"auto"}}>
            {!searched&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:40,textAlign:"center"}}><div style={{width:48,height:48,borderRadius:"50%",background:MU.goldLight,border:`2px solid ${MU.goldMid}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,fontSize:20}}>🔍</div><div style={{fontSize:14,fontWeight:700,color:MU.textSecond,marginBottom:5}}>Find Your Courses</div><div style={{fontSize:13,color:MU.textMuted,lineHeight:1.6}}>Use the filters to search by department, name, number, or gen ed.</div></div>}
            {searched&&results.length===0&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",padding:40,textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:MU.textSecond,marginBottom:5}}>No courses matched</div><div style={{fontSize:13,color:MU.textMuted}}>Try broadening your search.</div></div>}
            {results.map((course,idx)=>{
              const cc=C(course.code);const isE=enrolled.includes(course.id);const inBar=courseBar.includes(course.id);
              const sc=course.seats===0?"#EF4444":course.seats<8?"#D97706":"#059669";
              const labEx=!!expandedLabs[course.id];
              const isWL=wishlist.includes(course.id);
              return <div key={course.id} style={{borderBottom:idx<results.length-1?`1px solid ${MU.border}`:"none"}}>
                <div style={{display:"grid",gridTemplateColumns:"88px 1fr 88px 65px 44px 115px",background:idx%2===0?"#fff":"#FDFDFB",cursor:"pointer",transition:"background 0.12s"}} onMouseEnter={e=>e.currentTarget.style.background=MU.goldLight} onMouseLeave={e=>e.currentTarget.style.background=idx%2===0?"#fff":"#FDFDFB"} onClick={()=>onView(course)}>
                  <div style={{padding:"10px 13px",display:"flex",alignItems:"center"}}><span style={{fontWeight:800,fontSize:11,color:cc.text,background:cc.bg,border:`1px solid ${cc.border}`,padding:"2px 6px",borderRadius:5}}>{course.code}</span></div>
                  <div style={{padding:"10px 13px",borderLeft:`1px solid ${MU.border}`,display:"flex",flexDirection:"column",justifyContent:"center",gap:2}}>
                    <span style={{fontSize:13,fontWeight:600,color:MU.textPrimary,lineHeight:1.3}}>{course.name}</span>
                    <span style={{fontSize:11,color:MU.textMuted}}>{course.displayTime} · {course.instructor}</span>
                    <div style={{display:"flex",gap:4,marginTop:2,alignItems:"center",flexWrap:"wrap"}}><FormatBadge format={course.format}/>{course.genEd.map(g=><span key={g} style={{fontSize:9,fontWeight:700,padding:"1px 5px",background:MU.goldLight,color:MU.goldDark,borderRadius:10,border:`1px solid ${MU.goldMid}`}}>{g.match(/\(([^)]+)\)/)?.[1]||g}</span>)}</div>
                  </div>
                  <div style={{padding:"10px 13px",borderLeft:`1px solid ${MU.border}`,display:"flex",alignItems:"center"}}><div><div style={{fontSize:14,fontWeight:800,color:sc}}>{course.seats}</div><div style={{fontSize:10,color:MU.textMuted}}>of {course.totalSeats}</div></div></div>
                  <div style={{padding:"10px 13px",borderLeft:`1px solid ${MU.border}`,display:"flex",alignItems:"center"}}><span style={{fontSize:13,fontWeight:700,color:MU.textSecond}}>{course.credits} cr</span></div>
                  {/* Wishlist heart column */}
                  <div onClick={e=>e.stopPropagation()} style={{borderLeft:`1px solid ${MU.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <button
                      onClick={()=>onWishlist(course.id)}
                      title={isWL?"Remove from Wishlist":"Add to Wishlist"}
                      style={{background:"none",border:"none",cursor:"pointer",padding:"6px",display:"flex",alignItems:"center",justifyContent:"center",color:isWL?"#E11D48":MU.borderDark,transition:"color 0.15s, transform 0.15s",borderRadius:5}}
                      onMouseEnter={e=>{e.currentTarget.style.color=isWL?"#9F1239":"#E11D48";e.currentTarget.style.transform="scale(1.2)";}}
                      onMouseLeave={e=>{e.currentTarget.style.color=isWL?"#E11D48":MU.borderDark;e.currentTarget.style.transform="scale(1)";}}>
                      <svg width="15" height="15" viewBox="0 0 14 14" fill={isWL?"#E11D48":"none"}>
                        <path d="M7 12S2 8.5 2 5.5A3 3 0 0 1 7 3.5a3 3 0 0 1 5 2c0 3-5 6.5-5 6.5Z" stroke={isWL?"#E11D48":"currentColor"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div onClick={e=>e.stopPropagation()} style={{padding:"10px 11px",borderLeft:`1px solid ${MU.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {isE?<span style={{fontSize:11,fontWeight:700,color:"#10B981",background:"#ECFDF5",padding:"3px 9px",borderRadius:20,border:"1px solid #A7F3D0"}}>✓ Enrolled</span>
                      :inBar?<span style={{fontSize:11,fontWeight:700,color:MU.goldDark,background:MU.goldLight,padding:"3px 9px",borderRadius:20,border:`1px solid ${MU.goldMid}`}}>In Bar</span>
                      :<button onClick={()=>setCourseBar(p=>[...p,course.id])} style={{fontSize:12,fontWeight:800,padding:"4px 11px",background:MU.black,color:MU.gold,border:"none",borderRadius:6,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="#2a2a2a"} onMouseLeave={e=>e.currentTarget.style.background=MU.black}>+ Add</button>}
                  </div>
                </div>
                {course.labs&&<div style={{background:"#FAFAF7",borderTop:`1px solid ${MU.border}`}}>
                  <button onClick={()=>setExpandedLabs(p=>({...p,[course.id]:!p[course.id]}))} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 13px 6px 18px",width:"100%",background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",borderBottom:labEx?`1px solid ${MU.border}`:"none"}}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{transform:labEx?"rotate(90deg)":"none",transition:"transform 0.2s",flexShrink:0}}><path d="M3 2.5l3.5 2.5L3 7.5" stroke={MU.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{fontSize:10,fontWeight:800,color:MU.textSecond,letterSpacing:"0.05em",textTransform:"uppercase"}}>🧪 Lab Sections ({course.labs.length})</span>
                    {selectedLabs[course.id]&&<span style={{marginLeft:"auto",fontSize:10,fontWeight:700,color:MU.goldDark}}>✓ Selected</span>}
                  </button>
                  {labEx&&<div style={{padding:"7px 13px 9px 26px",display:"flex",flexDirection:"column",gap:5}}>
                    {course.labs.map(lab=>{const full=lab.seats===0;const sel=selectedLabs[course.id]===lab.id;return <div key={lab.id} onClick={()=>!full&&setSelectedLabs(p=>({...p,[course.id]:lab.id}))} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 11px",borderRadius:7,background:sel?MU.goldLight:full?"#FEF2F2":"#fff",border:`1.5px solid ${sel?MU.goldMid:full?"#FECACA":MU.border}`,cursor:full?"not-allowed":"pointer",opacity:full?0.65:1}}>
                      <div style={{width:13,height:13,borderRadius:"50%",border:`2px solid ${sel?MU.gold:MU.borderDark}`,background:sel?MU.gold:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>{sel&&<div style={{width:5,height:5,borderRadius:"50%",background:MU.black}}/>}</div>
                      <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:full?"#9CA3AF":MU.textPrimary}}>{lab.label}</div><div style={{fontSize:10,color:MU.textMuted}}>{lab.room}</div></div>
                      <span style={{fontSize:11,fontWeight:700,color:full?"#EF4444":lab.seats<5?"#D97706":"#059669",whiteSpace:"nowrap"}}>{full?"FULL":`${lab.seats}/${lab.totalSeats} open`}</span>
                    </div>;})}
                  </div>}
                </div>}
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Schedule Generator Page ──────────────────────────────────────────────────
const PRINT_HOURS = [8,9,10,11,12,13,14,15,16,17];
const PRINT_H = 60; // px per hour in print grid

function ScheduleGeneratorPage({ enrolled, waitlisted, semester, onClose }) {
  const [vis, setVis] = useState(false);
  const enrolledCourses = COURSES.filter(c => enrolled.includes(c.id));
  const waitlistedCourses = COURSES.filter(c => Object.keys(waitlisted).includes(c.id));
  const allCourses = [...enrolledCourses, ...waitlistedCourses];
  const totalCredits = enrolledCourses.reduce((s,c)=>s+c.credits,0);
  const today = new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  useEffect(()=>{ requestAnimationFrame(()=>setVis(true)); },[]);
  function close(){ setVis(false); setTimeout(onClose,350); }

  // Day abbreviation map for compact display
  const dayAbbr = { mon:"Mon", tue:"Tue", wed:"Wed", thu:"Thu", fri:"Fri" };

  // Build a readable meeting pattern string
  function meetingDays(days) {
    const map = { mon:"M", tue:"T", wed:"W", thu:"Th", fri:"F" };
    return days.map(d=>map[d]||d).join("");
  }

  function printSchedule() {
    window.print();
  }

  return (
    <>
      {/* Backdrop */}
      <div style={{position:"fixed",inset:0,zIndex:200,background:"rgba(17,17,17,0.55)",opacity:vis?1:0,transition:"opacity 0.35s"}} onClick={close}/>

      {/* Slide-up panel */}
      <div style={{position:"fixed",inset:0,zIndex:201,display:"flex",flexDirection:"column",transform:vis?"translateY(0)":"translateY(100%)",transition:"transform 0.4s cubic-bezier(0.32,0,0,1)",fontFamily:"'DM Sans',sans-serif"}}>

        {/* ── Toolbar ── */}
        <div style={{background:MU.black,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",height:56,boxShadow:"0 2px 12px rgba(0,0,0,0.4)",zIndex:10}}>
          <button onClick={close} style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,color:"#fff",fontSize:13,fontWeight:700,padding:"7px 16px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.14)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to Dashboard
          </button>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)",fontWeight:500}}>Schedule Preview</div>
            <div style={{width:1,height:20,background:"rgba(255,255,255,0.15)"}}/>
            <div style={{fontSize:13,fontWeight:700,color:MU.gold}}>{semester}</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={printSchedule} style={{display:"flex",alignItems:"center",gap:8,background:`linear-gradient(135deg,${MU.gold},${MU.goldDark})`,border:"none",borderRadius:8,color:MU.black,fontSize:13,fontWeight:800,padding:"8px 18px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:`0 3px 12px rgba(238,177,17,0.4)`}} onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.08)"} onMouseLeave={e=>e.currentTarget.style.filter="none"}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="10" height="8" rx="1.5" stroke={MU.black} strokeWidth="1.4"/><path d="M4 4V2.5A.5.5 0 014.5 2h5a.5.5 0 01.5.5V4" stroke={MU.black} strokeWidth="1.4"/><path d="M4 9.5h6M4 11.5h4" stroke={MU.black} strokeWidth="1.2" strokeLinecap="round"/><circle cx="4" cy="7" r="0.7" fill={MU.black}/></svg>
              Print Schedule
            </button>
          </div>
        </div>

        {/* ── Scrollable document area ── */}
        <div id="schedule-print-area" style={{flex:1,overflowY:"auto",background:"#E8E4D9",padding:"32px 0 48px"}}>
          <div style={{maxWidth:900,margin:"0 auto",display:"flex",flexDirection:"column",gap:20,padding:"0 24px"}}>

            {/* ══ Document Header ══ */}
            <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
              <div style={{background:MU.black,padding:"22px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <MULogo size={44}/>
                  <div>
                    <div style={{fontSize:20,fontWeight:800,color:"#fff",fontFamily:"'Playfair Display',serif",letterSpacing:"-0.02em"}}>Millersville University</div>
                    <div style={{fontSize:11,color:MU.gold,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginTop:2}}>Official Course Schedule</div>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:18,fontWeight:800,color:"#fff",fontFamily:"'Playfair Display',serif"}}>{semester}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginTop:4}}>Generated {today}</div>
                </div>
              </div>
              {/* Student summary bar */}
              <div style={{background:MU.cream,borderBottom:`1px solid ${MU.border}`,padding:"14px 28px",display:"flex",gap:32}}>
                {[
                  ["Student","Alex Johnson"],
                  ["Student ID","MU-2024-8841"],
                  ["Credits Enrolled", `${totalCredits} credits`],
                  ["Courses Enrolled", `${enrolledCourses.length} course${enrolledCourses.length!==1?"s":""}`],
                  ["Academic Standing","Good Standing"],
                  ["Advisor","Dr. Patricia Miles"],
                ].map(([label,val])=>(
                  <div key={label}>
                    <div style={{fontSize:9,fontWeight:800,color:MU.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>{label}</div>
                    <div style={{fontSize:13,fontWeight:700,color:MU.black}}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ Weekly Calendar Grid ══ */}
            <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 4px 24px rgba(0,0,0,0.08)"}}>
              <div style={{padding:"16px 22px 12px",borderBottom:`1px solid ${MU.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:MU.black,letterSpacing:"-0.02em"}}>Weekly Schedule</div>
                  <div style={{fontSize:12,color:MU.textMuted,marginTop:2}}>All times are Eastern Time · Click course blocks to see details</div>
                </div>
                <div style={{display:"flex",gap:10}}>
                  {enrolledCourses.map(c=>{
                    const cc=C(c.code);
                    return <div key={c.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:600,color:cc.text}}>
                      <div style={{width:10,height:10,borderRadius:3,background:cc.accent,flexShrink:0}}/>
                      {c.code}
                    </div>;
                  })}
                </div>
              </div>
              {/* Grid */}
              <div style={{padding:"0 0 16px"}}>
                {/* Day headers */}
                <div style={{display:"grid",gridTemplateColumns:"56px repeat(5,1fr)",borderBottom:`1.5px solid ${MU.border}`}}>
                  <div/>
                  {DAYS.map(d=><div key={d} style={{padding:"10px 8px",textAlign:"center",fontSize:11,fontWeight:800,color:MU.textSecond,letterSpacing:"0.06em",textTransform:"uppercase",borderLeft:`1px solid ${MU.border}`}}>{d}</div>)}
                </div>
                {/* Hour rows + blocks */}
                <div style={{position:"relative",display:"grid",gridTemplateColumns:"56px repeat(5,1fr)"}}>
                  {PRINT_HOURS.map((h,i)=>(
                    <div key={h} style={{display:"contents"}}>
                      <div style={{height:PRINT_H,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",padding:"3px 8px 0 0",fontSize:10,color:MU.textMuted,fontWeight:700,borderTop:i>0?`1px solid ${MU.border}`:"none"}}>{fmtHour(h)}</div>
                      {DAY_KEYS.map(day=><div key={day} style={{height:PRINT_H,borderLeft:`1px solid ${MU.border}`,borderTop:i>0?`1px solid ${MU.border}`:"none",background:i%2===0?"#fff":"#FCFAF6"}}/>)}
                    </div>
                  ))}
                  {/* Course blocks */}
                  {enrolledCourses.map(course=>
                    course.schedule.days.map(day=>{
                      const col=DAY_KEYS.indexOf(day); if(col===-1) return null;
                      const top=(course.schedule.start-PRINT_HOURS[0])*PRINT_H;
                      const h=(course.schedule.end-course.schedule.start)*PRINT_H-3;
                      const c=C(course.code);
                      return (
                        <div key={`pg-${course.id}-${day}`}
                          style={{position:"absolute",top,height:h,left:`calc(56px + ${col} * ((100% - 56px) / 5) + 3px)`,width:`calc((100% - 56px) / 5 - 6px)`,background:c.bg,border:`1.5px solid ${c.border}`,borderLeft:`4px solid ${c.accent}`,borderRadius:7,padding:"5px 7px",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.07)"}}>
                          <div style={{fontWeight:800,fontSize:11,color:c.text,lineHeight:1.2}}>{course.code}</div>
                          <div style={{fontSize:9.5,color:c.text,opacity:0.85,marginTop:1,lineHeight:1.3,fontWeight:600}}>{course.name}</div>
                          <div style={{marginTop:3,fontSize:9,color:c.text,opacity:0.7,lineHeight:1.5}}>
                            <div>{course.room}</div>
                            <div>{course.instructor}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ══ Course Detail Cards ══ */}
            <div>
              <div style={{fontSize:16,fontWeight:800,color:MU.black,letterSpacing:"-0.02em",marginBottom:14,paddingLeft:2}}>Enrolled Courses — Full Detail</div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                {enrolledCourses.map((course,idx)=>{
                  const c=C(course.code);
                  const seatPct=((course.totalSeats-course.seats)/course.totalSeats)*100;
                  return (
                    <div key={course.id} style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:`1px solid ${MU.border}`}}>
                      {/* Card header bar */}
                      <div style={{height:5,background:c.accent}}/>
                      <div style={{padding:"18px 22px 0"}}>
                        {/* Title row */}
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
                          <div style={{display:"flex",alignItems:"center",gap:12}}>
                            <div style={{width:44,height:44,borderRadius:10,background:c.bg,border:`2px solid ${c.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <span style={{fontSize:16,fontWeight:900,color:c.text,letterSpacing:"-0.03em"}}>{idx+1}</span>
                            </div>
                            <div>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                                <span style={{fontSize:13,fontWeight:800,padding:"3px 10px",borderRadius:7,background:c.bg,color:c.text,border:`1px solid ${c.border}`}}>{course.code}</span>
                                <span style={{fontSize:12,fontWeight:700,color:MU.textMuted}}>{course.credits} Credits</span>
                                <FormatBadge format={course.format}/>
                              </div>
                              <div style={{fontSize:18,fontWeight:800,color:MU.black,letterSpacing:"-0.02em",lineHeight:1.2}}>{course.name}</div>
                            </div>
                          </div>
                          {/* Seat availability */}
                          <div style={{textAlign:"right",flexShrink:0,marginLeft:16}}>
                            <div style={{fontSize:11,color:MU.textMuted,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4}}>Seat Availability</div>
                            <div style={{fontSize:20,fontWeight:800,color:seatPct>80?"#EF4444":MU.goldDark}}>{course.seats}</div>
                            <div style={{fontSize:11,color:MU.textMuted}}>of {course.totalSeats} remaining</div>
                            <div style={{width:100,height:4,background:MU.border,borderRadius:10,marginTop:5,overflow:"hidden"}}>
                              <div style={{width:`${seatPct}%`,height:"100%",background:seatPct>80?"#EF4444":MU.gold,borderRadius:10}}/>
                            </div>
                          </div>
                        </div>
                        {/* Info grid */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:1,background:MU.border,borderRadius:10,overflow:"hidden",marginBottom:16}}>
                          {[
                            ["📅 Meeting Days", course.schedule.days.map(d=>dayAbbr[d]).join(", ")],
                            ["🕐 Time", course.displayTime],
                            ["📍 Room", course.room],
                            ["👤 Instructor", course.instructor],
                            ["🏫 Format", course.format],
                            ["🎓 Gen Ed", course.genEd.length>0 ? course.genEd.map(g=>g.match(/\(([^)]+)\)/)?.[1]||g).join(" · ") : "None"],
                          ].map(([label,val])=>(
                            <div key={label} style={{background:"#fff",padding:"11px 14px"}}>
                              <div style={{fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
                              <div style={{fontSize:13,fontWeight:600,color:MU.textPrimary,lineHeight:1.3}}>{val}</div>
                            </div>
                          ))}
                        </div>
                        {/* Description */}
                        <div style={{marginBottom:16}}>
                          <div style={{fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Course Description</div>
                          <p style={{fontSize:13,color:MU.textSecond,lineHeight:1.75,margin:0}}>{course.description}</p>
                        </div>
                        {/* Prerequisites + Instructor bio */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
                          <div style={{padding:"12px 14px",background:MU.cream,borderRadius:9,border:`1px solid ${MU.border}`}}>
                            <div style={{fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>Prerequisites</div>
                            <p style={{fontSize:12,color:course.prereqIds.length>0?MU.textPrimary:MU.textMuted,lineHeight:1.6,margin:0}}>{course.prerequisites}</p>
                          </div>
                          <div style={{padding:"12px 14px",background:MU.cream,borderRadius:9,border:`1px solid ${MU.border}`}}>
                            <div style={{fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>About the Instructor</div>
                            <p style={{fontSize:12,color:MU.textSecond,lineHeight:1.6,margin:0}}>{course.instructorBio}</p>
                          </div>
                        </div>
                        {/* Important contacts row */}
                        <div style={{borderTop:`1px solid ${MU.border}`,padding:"12px 0",display:"flex",gap:20,flexWrap:"wrap"}}>
                          {[
                            ["Office","Caputo Hall, Room " + (100 + Math.floor(Math.random()*200))],
                            ["Office Hours","Mon & Wed 2:00–4:00 PM"],
                            ["Email", course.instructor.split(" ").pop().toLowerCase() + "@millersville.edu"],
                            ["Registrar Ref","CRN-" + (10000+Math.floor(Math.random()*9000))],
                          ].map(([label,val])=>(
                            <div key={label} style={{minWidth:160}}>
                              <div style={{fontSize:9,fontWeight:800,color:MU.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:2}}>{label}</div>
                              <div style={{fontSize:12,fontWeight:600,color:MU.textPrimary}}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ══ Quick Reference Table ══ */}
            <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:`1px solid ${MU.border}`}}>
              <div style={{background:MU.black,padding:"14px 22px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontSize:14,fontWeight:800,color:"#fff"}}>Quick Reference Summary</div>
                <div style={{fontSize:12,color:MU.gold,fontWeight:700}}>{totalCredits} Total Credits Enrolled</div>
              </div>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{background:MU.cream}}>
                    {["#","Course","Name","Days & Time","Room","Instructor","Cr","Seats"].map((h,i)=>(
                      <th key={h} style={{padding:"9px 14px",fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.07em",textTransform:"uppercase",textAlign:"left",borderBottom:`1.5px solid ${MU.border}`,borderLeft:i>0?`1px solid ${MU.border}`:"none"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrolledCourses.map((course,i)=>{
                    const c=C(course.code);
                    return (
                      <tr key={course.id} style={{background:i%2===0?"#fff":"#FDFDFB"}}>
                        <td style={{padding:"10px 14px",fontSize:12,color:MU.textMuted,fontWeight:700,borderTop:`1px solid ${MU.border}`}}>{i+1}</td>
                        <td style={{padding:"10px 14px",borderTop:`1px solid ${MU.border}`,borderLeft:`1px solid ${MU.border}`}}><span style={{fontSize:12,fontWeight:800,padding:"2px 8px",borderRadius:5,background:c.bg,color:c.text,border:`1px solid ${c.border}`}}>{course.code}</span></td>
                        <td style={{padding:"10px 14px",fontSize:13,fontWeight:600,color:MU.textPrimary,borderTop:`1px solid ${MU.border}`,borderLeft:`1px solid ${MU.border}`}}>{course.name}</td>
                        <td style={{padding:"10px 14px",fontSize:12,color:MU.textSecond,borderTop:`1px solid ${MU.border}`,borderLeft:`1px solid ${MU.border}`,whiteSpace:"nowrap"}}>{meetingDays(course.schedule.days)} · {course.displayTime.split(" ").slice(-2).join(" ")}</td>
                        <td style={{padding:"10px 14px",fontSize:12,color:MU.textSecond,borderTop:`1px solid ${MU.border}`,borderLeft:`1px solid ${MU.border}`}}>{course.room}</td>
                        <td style={{padding:"10px 14px",fontSize:12,color:MU.textSecond,borderTop:`1px solid ${MU.border}`,borderLeft:`1px solid ${MU.border}`}}>{course.instructor}</td>
                        <td style={{padding:"10px 14px",fontSize:13,fontWeight:800,color:MU.textPrimary,borderTop:`1px solid ${MU.border}`,borderLeft:`1px solid ${MU.border}`,textAlign:"center"}}>{course.credits}</td>
                        <td style={{padding:"10px 14px",fontSize:12,fontWeight:700,color:course.seats<8?"#D97706":"#059669",borderTop:`1px solid ${MU.border}`,borderLeft:`1px solid ${MU.border}`,textAlign:"center"}}>{course.seats}</td>
                      </tr>
                    );
                  })}
                  {/* Totals row */}
                  <tr style={{background:MU.goldLight}}>
                    <td colSpan={6} style={{padding:"10px 14px",fontSize:12,fontWeight:800,color:MU.goldDark,borderTop:`2px solid ${MU.goldMid}`,textAlign:"right"}}>Total Credits Enrolled:</td>
                    <td style={{padding:"10px 14px",fontSize:14,fontWeight:900,color:MU.goldDark,borderTop:`2px solid ${MU.goldMid}`,borderLeft:`1px solid ${MU.goldMid}`,textAlign:"center"}}>{totalCredits}</td>
                    <td style={{borderTop:`2px solid ${MU.goldMid}`,borderLeft:`1px solid ${MU.goldMid}`}}/>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ══ Important Dates & Footer ══ */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              <div style={{background:"#fff",borderRadius:14,border:`1px solid ${MU.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                <div style={{padding:"13px 18px",borderBottom:`1px solid ${MU.border}`,background:MU.cream}}>
                  <div style={{fontSize:13,fontWeight:800,color:MU.black}}>📅 Important Academic Dates</div>
                </div>
                <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:10}}>
                  {[
                    ["Jan 13","Spring semester classes begin"],
                    ["Jan 20","Last day to add/drop without record"],
                    ["Mar 3–7","Spring recess (no classes)"],
                    ["Mar 14","Last day to withdraw with W grade"],
                    ["Apr 25","Last day of regular classes"],
                    ["Apr 28 – May 2","Final examination period"],
                    ["May 10","Commencement ceremony"],
                  ].map(([date,event])=>(
                    <div key={date} style={{display:"flex",gap:12,alignItems:"baseline"}}>
                      <span style={{fontSize:11,fontWeight:800,color:MU.goldDark,whiteSpace:"nowrap",minWidth:48}}>{date}</span>
                      <span style={{fontSize:12,color:MU.textSecond,lineHeight:1.4}}>{event}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{background:"#fff",borderRadius:14,border:`1px solid ${MU.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
                  <div style={{padding:"13px 18px",borderBottom:`1px solid ${MU.border}`,background:MU.cream}}>
                    <div style={{fontSize:13,fontWeight:800,color:MU.black}}>📞 Key Contacts</div>
                  </div>
                  <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:9}}>
                    {[
                      ["Registrar's Office","(717) 871-5006 · registrar@millersville.edu"],
                      ["Academic Advisor","Dr. Patricia Miles · pmiles@millersville.edu"],
                      ["Financial Aid","(717) 871-5100 · finaid@millersville.edu"],
                      ["IT Help Desk","(717) 871-7777 · helpdesk@millersville.edu"],
                      ["Student Health","(717) 871-5250 · health@millersville.edu"],
                    ].map(([office,contact])=>(
                      <div key={office}>
                        <div style={{fontSize:10,fontWeight:800,color:MU.textMuted,letterSpacing:"0.05em",textTransform:"uppercase"}}>{office}</div>
                        <div style={{fontSize:11,color:MU.textSecond,marginTop:1}}>{contact}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:MU.black,borderRadius:14,padding:"16px 18px"}}>
                  <div style={{fontSize:11,fontWeight:800,color:MU.gold,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:8}}>Registrar's Note</div>
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.65)",lineHeight:1.7,margin:"0 0 10px"}}>This schedule was generated from the MAX Registration System. Enrollment is subject to change. Please verify your schedule in MAX before the semester begins.</p>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{today} · Millersville University</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Print-only styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #schedule-print-area { display: block !important; position: static !important; overflow: visible !important; background: #fff !important; padding: 0 !important; }
          #schedule-print-area > div { max-width: 100% !important; padding: 0 !important; gap: 12pt !important; }
          @page { margin: 0.6in; size: letter; }
        }
      `}</style>
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [semOpen, setSemOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");
  const [enrolled, setEnrolled] = useState(INIT_ENROLLED);
  const [waitlisted] = useState(INIT_WAITLISTED);
  const [wishlist, setWishlist] = useState(["PHYS201","CS301"]);
  const [sidebarMode, setSidebarMode] = useState("search");
  const [holdDismissed, setHoldDismissed] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState([]);

  function toggleWishlist(courseId) {
    setWishlist(p => p.includes(courseId) ? p.filter(id=>id!==courseId) : [...p, courseId]);
  }

  function pushToast(t) { setToasts(p=>[...p,{...t,id:++_tid}]); }
  function dismissToast(id) { setToasts(p=>p.filter(t=>t.id!==id)); }

  function handleRegister(courseId) {
    const course = COURSES.find(c=>c.id===courseId);
    if (enrolled.includes(courseId)) {
      setEnrolled(p=>p.filter(id=>id!==courseId));
      pushToast({type:"success",title:`Dropped ${course.code}`,body:`${course.name} removed from your schedule.`});
      return;
    }
    const {timeConflicts,missingPrereqs} = checkConflicts(course, enrolled);
    if (timeConflicts.length>0) { pushToast({type:"error",title:"Time Conflict",body:`Overlaps with ${timeConflicts.map(c=>c.code).join(", ")}.`,chips:timeConflicts.map(c=>c.code)}); return; }
    if (missingPrereqs.length>0) { pushToast({type:"error",title:"Missing Prerequisites",body:`Complete ${missingPrereqs.map(c=>c.code).join(", ")} first.`,chips:missingPrereqs.map(c=>c.code)}); return; }
    setEnrolled(p=>[...p,courseId]);
    pushToast({type:"success",title:`Enrolled in ${course.code}`,body:`${course.name} added to your schedule.`});
  }

  const enrolledCourses = COURSES.filter(c=>enrolled.includes(c.id));
  const totalCredits = enrolledCourses.reduce((s,c)=>s+c.credits,0);
  const filteredCourses = COURSES.filter(c => !search.trim() || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase()));

  // Ghost previews: wishlist mode shows all wishlisted non-enrolled courses; otherwise just hovered card
  const ghostIds = sidebarMode === "wishlist"
    ? wishlist.filter(id => !enrolled.includes(id))
    : (hoveredCard && !enrolled.includes(hoveredCard) ? [hoveredCard] : []);
  const ghostCourses = COURSES.filter(c => ghostIds.includes(c.id));

  const tabBtn = (tab, label) => (
    <button onClick={()=>setActiveTab(tab)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 18px",fontSize:13,fontWeight:600,background:activeTab===tab?"#fff":"transparent",color:activeTab===tab?MU.black:"rgba(255,255,255,0.7)",border:"none",borderRadius:7,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",boxShadow:activeTab===tab?"0 1px 4px rgba(0,0,0,0.15)":"none"}}>
      {label}
    </button>
  );

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{height:"100vh",display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif",background:MU.cream,overflow:"hidden"}}>

        {/* Hold Banner */}
        {!holdDismissed&&<HoldBanner onDismiss={()=>setHoldDismissed(true)}/>}

        {/* Header */}
        <header style={{background:MU.black,flexShrink:0,display:"flex",alignItems:"center",padding:"0 24px",height:58,boxShadow:"0 2px 10px rgba(0,0,0,0.3)",zIndex:30,gap:16}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:200}}>
            <MULogo size={34}/>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:"#fff",letterSpacing:"-0.01em",lineHeight:1.1,fontFamily:"'Playfair Display',serif"}}>Millersville University</div>
              <div style={{fontSize:10,color:MU.gold,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>COURSE REGISTRATION</div>
            </div>
          </div>
          {/* Tabs — centered */}
          <div style={{flex:1,display:"flex",justifyContent:"center"}}>
            <div style={{display:"flex",alignItems:"center",background:"rgba(255,255,255,0.1)",borderRadius:9,padding:3,gap:2}}>
              {tabBtn("schedule","📅 My Schedule")}
              {tabBtn("search","🔍 Advanced Search")}
            </div>
          </div>
          {/* Semester + help */}
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:200,justifyContent:"flex-end"}}>
            <div style={{position:"relative"}}>
              <button onClick={()=>setSemOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:7,padding:"6px 13px",background:"rgba(255,255,255,0.07)",border:`1px solid rgba(238,177,17,0.35)`,borderRadius:7,cursor:"pointer",fontSize:13,fontWeight:600,color:"#fff",fontFamily:"'DM Sans',sans-serif"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(238,177,17,0.12)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.07)";}}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="2" width="11" height="10" rx="2" stroke={MU.gold} strokeWidth="1.3"/><path d="M4 1v2M9 1v2M1 5h11" stroke={MU.gold} strokeWidth="1.3" strokeLinecap="round"/></svg>
                {semester}
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 3.5L4.5 6L7 3.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {semOpen&&(
                <div style={{position:"absolute",top:"calc(100% + 7px)",right:0,background:"#fff",border:`1.5px solid ${MU.border}`,borderRadius:9,boxShadow:"0 8px 28px rgba(0,0,0,0.14)",overflow:"hidden",zIndex:100,minWidth:165}}>
                  {SEMESTERS.map(s=><button key={s} onClick={()=>{setSemester(s);setSemOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 14px",background:s===semester?MU.goldLight:"transparent",border:"none",cursor:"pointer",fontSize:13,fontWeight:s===semester?700:500,color:s===semester?MU.goldDark:MU.textPrimary,fontFamily:"'DM Sans',sans-serif",borderLeft:s===semester?`3px solid ${MU.gold}`:"3px solid transparent"}} onMouseEnter={e=>{if(s!==semester)e.currentTarget.style.background=MU.cream;}} onMouseLeave={e=>{if(s!==semester)e.currentTarget.style.background="transparent";}}>{s}</button>)}
                </div>
              )}
            </div>
            {/* Help button */}
            <button style={{width:32,height:32,borderRadius:"50%",background:MU.gold,border:"none",color:MU.black,fontSize:15,fontWeight:800,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>?</button>
          </div>
        </header>

        {/* Body: sidebar + content */}
        <div style={{flex:1,display:"flex",minHeight:0}}>

          {/* ── Left Sidebar ── */}
          <div style={{width:326,flexShrink:0,background:"#fff",borderRight:`1px solid ${MU.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            {/* Sidebar header with mode toggle */}
            <div style={{padding:"12px 14px 10px",borderBottom:`1px solid ${MU.border}`,flexShrink:0}}>
              {/* Mode toggle pills */}
              <div style={{display:"flex",background:MU.cream,borderRadius:9,padding:3,gap:2,marginBottom:10}}>
                {[["search","🔍 Quick Search"],["wishlist","♥ Wishlist"]].map(([mode,label])=>(
                  <button key={mode} onClick={()=>setSidebarMode(mode)}
                    style={{flex:1,padding:"6px 0",fontSize:12,fontWeight:700,background:sidebarMode===mode?"#fff":"transparent",color:sidebarMode===mode?MU.black:MU.textMuted,border:"none",borderRadius:6,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.15s",boxShadow:sidebarMode===mode?"0 1px 4px rgba(0,0,0,0.1)":"none",position:"relative"}}>
                    {label}
                    {mode==="wishlist"&&wishlist.length>0&&(
                      <span style={{position:"absolute",top:-4,right:4,width:16,height:16,borderRadius:"50%",background:"#E11D48",color:"#fff",fontSize:9,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>
                        {wishlist.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {/* Search input — only in search mode */}
              {sidebarMode==="search"&&(
                <div style={{position:"relative"}}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><circle cx="6" cy="6" r="4.5" stroke={MU.textMuted} strokeWidth="1.3"/><path d="M9.5 9.5L12 12" stroke={MU.textMuted} strokeWidth="1.3" strokeLinecap="round"/></svg>
                  <input value={search} onChange={e=>setSearch(e.target.value)} autoComplete="off" placeholder="Search courses..." style={{width:"100%",boxSizing:"border-box",padding:"8px 11px 8px 30px",background:MU.cream,border:`1.5px solid ${MU.border}`,borderRadius:8,fontSize:13,color:MU.textPrimary,fontFamily:"'DM Sans',sans-serif",outline:"none"}} onFocus={e=>e.target.style.borderColor=MU.gold} onBlur={e=>e.target.style.borderColor=MU.border}/>
                </div>
              )}
              {/* Wishlist preview hint */}
              {sidebarMode==="wishlist"&&wishlist.length>0&&(
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 10px",background:"#FFF1F2",borderRadius:7,border:"1px solid #FECDD3"}}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="#E11D48" strokeWidth="1.3"/><path d="M6 3.5v2.5l1.5 1" stroke="#E11D48" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  <span style={{fontSize:11,fontWeight:600,color:"#BE123C"}}>Previewing on schedule →</span>
                </div>
              )}
            </div>
            {/* Sidebar body — search cards or wishlist */}
            {sidebarMode==="search" ? (
              <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:10}}>
                {filteredCourses.map(course=>(
                  <CourseCard key={course.id} course={course} enrolled={enrolled} waitlisted={waitlisted} wishlist={wishlist}
                    onView={setSelectedCourse} onAdd={handleRegister} onWishlist={toggleWishlist}
                    hovered={hoveredCard===course.id}
                    onHover={setHoveredCard} onHoverEnd={()=>setHoveredCard(null)}/>
                ))}
                {filteredCourses.length===0&&<div style={{textAlign:"center",padding:"32px 16px",color:MU.textMuted,fontSize:13}}>No courses match your search.</div>}
              </div>
            ) : (
              <WishlistPanel wishlist={wishlist} enrolled={enrolled} waitlisted={waitlisted}
                onRemove={id=>setWishlist(p=>p.filter(i=>i!==id))}
                onAdd={handleRegister}
                onView={setSelectedCourse}/>
            )}
          </div>

          {/* ── Right Content ── */}
          <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>

            {/* ══ Schedule Tab ══ */}
            {activeTab==="schedule"&&(
              <div style={{flex:1,padding:"20px 24px",overflowY:"auto",display:"flex",flexDirection:"column",gap:14}}>
                {/* Schedule heading + magic wand */}
                <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexShrink:0}}>
                  <div>
                    <h1 style={{fontSize:22,fontWeight:800,color:MU.black,margin:"0 0 3px",letterSpacing:"-0.03em",fontFamily:"'Playfair Display',serif"}}>My Schedule</h1>
                    <p style={{margin:0,fontSize:13,color:MU.textMuted}}>{semester} — {totalCredits} credits enrolled</p>
                  </div>
                  <button onClick={()=>setShowGenerator(true)} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"linear-gradient(135deg,#7C3AED,#6D28D9)",color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 3px 12px rgba(124,58,237,0.35)"}} onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.1)"} onMouseLeave={e=>e.currentTarget.style.filter="none"}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M2.5 12.5L8.5 6.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/>
                      <path d="M8.5 6.5l1.4-3.3L13 2l-1.4 3.3L8.5 6.5Z" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" fill="rgba(255,255,255,0.2)"/>
                      <circle cx="2" cy="6.5" r="0.8" fill="#fff"/>
                      <circle cx="4.5" cy="11" r="0.8" fill="#fff"/>
                      <circle cx="11.5" cy="8.5" r="0.7" fill="#fff"/>
                    </svg>
                    Generate Schedules
                  </button>
                </div>

                {/* Calendar grid */}
                <div style={{background:"#fff",borderRadius:12,border:`1px solid ${MU.border}`,boxShadow:"0 2px 8px rgba(0,0,0,0.05)",overflow:"hidden",flexShrink:0}}>
                  <div style={{height:3,background:`linear-gradient(90deg,${MU.gold},${MU.goldDark})`}}/>
                  {/* Day headers */}
                  <div style={{display:"grid",gridTemplateColumns:"72px repeat(5,1fr)",borderBottom:`1.5px solid ${MU.border}`,background:MU.cream}}>
                    <div style={{padding:"10px 0"}}/>
                    {DAYS.map(d=><div key={d} style={{padding:"10px 8px",textAlign:"center",fontSize:11,fontWeight:800,color:MU.textSecond,letterSpacing:"0.06em",textTransform:"uppercase",borderLeft:`1px solid ${MU.border}`}}>{d}</div>)}
                  </div>
                  {/* Grid body */}
                  <div style={{position:"relative",display:"grid",gridTemplateColumns:"72px repeat(5,1fr)"}}>
                    {HOURS.map((h,i)=>(
                      <div key={h} style={{display:"contents"}}>
                        <div style={{height:HOUR_HEIGHT,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",padding:"4px 10px 0 0",fontSize:10,color:MU.textMuted,fontWeight:700,borderTop:i>0?`1px solid ${MU.border}`:"none"}}>{fmtHour(h)}</div>
                        {DAY_KEYS.map(day=><div key={day} style={{height:HOUR_HEIGHT,borderLeft:`1px solid ${MU.border}`,borderTop:i>0?`1px solid ${MU.border}`:"none",background:i%2===0?"#fff":"#FDFDFB"}}/>)}
                      </div>
                    ))}

                    {/* Enrolled blocks */}
                    {enrolledCourses.map(course=>
                      course.schedule.days.map(day=>{
                        const col=DAY_KEYS.indexOf(day); if(col===-1) return null;
                        const top=timeFrac(course.schedule.start)*HOUR_HEIGHT;
                        const h=(timeFrac(course.schedule.end)-timeFrac(course.schedule.start))*HOUR_HEIGHT-4;
                        const c=C(course.code);
                        const isWL=!!waitlisted[course.id];
                        const wlBg="repeating-linear-gradient(45deg,#FFFBEB 0px,#FFFBEB 8px,#FEF3C7 8px,#FEF3C7 16px)";
                        return (
                          <div key={`${course.id}-${day}`} onClick={()=>setSelectedCourse(course)}
                            style={{position:"absolute",top,height:h,left:`calc(72px + ${col} * ((100% - 72px) / 5) + 3px)`,width:`calc((100% - 72px) / 5 - 6px)`,background:isWL?wlBg:c.bg,border:`1.5px solid ${isWL?"#F59E0B":c.border}`,borderLeft:`3px solid ${isWL?"#D97706":c.accent}`,borderRadius:8,padding:"6px 8px",cursor:"pointer",zIndex:2,overflow:"hidden",boxShadow:isWL?"0 0 0 2px rgba(245,158,11,0.15)":"0 1px 3px rgba(0,0,0,0.06)",transition:"all 0.18s"}}
                            onMouseEnter={e=>{if(!isWL){e.currentTarget.style.boxShadow=`0 3px 12px ${c.border}`;e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.zIndex=10;}}}
                            onMouseLeave={e=>{e.currentTarget.style.boxShadow=isWL?"0 0 0 2px rgba(245,158,11,0.15)":"0 1px 3px rgba(0,0,0,0.06)";e.currentTarget.style.transform="none";e.currentTarget.style.zIndex=2;}}>
                            {isWL&&<div style={{position:"absolute",top:0,right:0,background:"#D97706",color:"#fff",fontSize:7,fontWeight:800,padding:"2px 5px",borderBottomLeftRadius:4,whiteSpace:"nowrap"}}>⏳ #{waitlisted[course.id]}</div>}
                            <div style={{fontWeight:800,fontSize:11,color:isWL?"#92400E":c.text,lineHeight:1.2}}>{course.code}</div>
                            <div style={{fontSize:10,color:isWL?"#B45309":c.text,opacity:0.85,marginTop:1,lineHeight:1.25}}>{course.name}</div>
                            {isWL&&<div style={{fontSize:8,fontWeight:800,color:"#92400E",background:"rgba(217,119,6,0.15)",borderRadius:3,padding:"1px 4px",display:"inline-block",marginTop:2}}>Waitlist: #{waitlisted[course.id]}</div>}
                            <div style={{marginTop:4,fontSize:9,color:isWL?"#92400E":c.text,opacity:0.7,display:"flex",flexDirection:"column",gap:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:3}}>
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 7c0-1.5 1.3-2 3-2s3 .5 3 2" stroke="currentColor" strokeWidth="1"/><circle cx="4" cy="3" r="1.5" stroke="currentColor" strokeWidth="1"/></svg>
                                {course.instructor}
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:3}}>
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1.5h6a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H1a.5.5 0 01-.5-.5V2A.5.5 0 011 1.5Z" stroke="currentColor" strokeWidth="1"/></svg>
                                {course.room}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Ghost previews — wishlisted or hovered non-enrolled courses */}
                    {ghostCourses.map(ghostCourse => {
                      const {timeConflicts:ghostTC} = checkConflicts(ghostCourse, enrolled);
                      const ghostConflict = ghostTC.length > 0;
                      return ghostCourse.schedule.days.map(day=>{
                        const col=DAY_KEYS.indexOf(day); if(col===-1) return null;
                        const c=C(ghostCourse.code);
                        const top=timeFrac(ghostCourse.schedule.start)*HOUR_HEIGHT;
                        const h=(timeFrac(ghostCourse.schedule.end)-timeFrac(ghostCourse.schedule.start))*HOUR_HEIGHT-4;
                        const isWishlistMode = sidebarMode === "wishlist";
                        return (
                          <div key={`ghost-${ghostCourse.id}-${day}`} onClick={()=>setSelectedCourse(ghostCourse)}
                            style={{position:"absolute",top,height:h,left:`calc(72px + ${col} * ((100% - 72px) / 5) + 3px)`,width:`calc((100% - 72px) / 5 - 6px)`,background:ghostConflict?"rgba(254,242,242,0.88)":`${c.bg}DD`,border:`2px dashed ${ghostConflict?"#EF4444":c.accent}`,borderRadius:8,padding:"6px 8px",zIndex:3,cursor:"pointer",animation:isWishlistMode?"wishlistPulse 2.5s ease-in-out infinite":"ghostPulse 1.5s ease-in-out infinite"}}>
                            {isWishlistMode&&(
                              <div style={{position:"absolute",top:0,right:0,background:"#E11D48",color:"#fff",fontSize:7,fontWeight:800,padding:"2px 5px",borderBottomLeftRadius:4,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:2}}>
                                <svg width="7" height="7" viewBox="0 0 7 7" fill="#fff"><path d="M3.5 6S1 4.2 1 2.8a1.8 1.8 0 0 1 2.5-1.6A1.8 1.8 0 0 1 6 2.8C6 4.2 3.5 6 3.5 6Z"/></svg>
                                Wishlist
                              </div>
                            )}
                            <div style={{fontWeight:800,fontSize:11,color:ghostConflict?"#DC2626":c.text,lineHeight:1.2,paddingRight:isWishlistMode?30:0}}>{ghostCourse.code}</div>
                            <div style={{fontSize:9,color:ghostConflict?"#EF4444":c.text,opacity:0.8,marginTop:1}}>{ghostConflict?"⚠ Conflict":"Preview"}</div>
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══ Search Tab ══ */}
            {activeTab==="search"&&(
              <div style={{flex:1,padding:"20px 24px",overflow:"hidden",display:"flex",flexDirection:"column",gap:14}}>
                <div style={{flexShrink:0}}>
                  <h1 style={{fontSize:22,fontWeight:800,color:MU.black,margin:"0 0 3px",letterSpacing:"-0.03em",fontFamily:"'Playfair Display',serif"}}>Course Search</h1>
                  <p style={{margin:0,fontSize:13,color:MU.textMuted}}>{semester} — Filter by department, name, number, or gen ed</p>
                </div>
                <div style={{flex:1,minHeight:0}}>
                  <AdvancedSearch enrolled={enrolled} waitlisted={waitlisted} onRegister={handleRegister} onView={setSelectedCourse} wishlist={wishlist} onWishlist={toggleWishlist}/>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCourse&&<SlideOver course={selectedCourse} enrolled={enrolled} onClose={()=>setSelectedCourse(null)} onRegister={handleRegister}/>}
      {showGenerator&&<ScheduleGeneratorPage enrolled={enrolled} waitlisted={waitlisted} semester={semester} onClose={()=>setShowGenerator(false)}/>}
      <ToastStack toasts={toasts} onDismiss={dismissToast}/>

      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #9E9782; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4CEBC; border-radius: 4px; }
        @keyframes ghostPulse { 0%,100%{opacity:0.5} 50%{opacity:0.95} }
        @keyframes wishlistPulse { 0%,100%{opacity:0.65;transform:none} 50%{opacity:1;transform:translateY(-1px)} }
      `}</style>
    </>
  );
}
