import { useState, useEffect } from "react";
import { loadCourses, buildDepartments, buildGenEdAttrs } from "./courseLoader";

// ─── Brand ────────────────────────────────────────────────────────────────────
const MU = {
  black: "#111111", gold: "#EEB111", goldDark: "#C9920A",
  goldLight: "#FDF3D8", goldMid: "#F5D97A", cream: "#FAFAF7",
  border: "#E8E4D9", borderDark: "#D4CEBC",
  textPrimary: "#111111", textSecond: "#5C5644", textMuted: "#9E9782",
};

function MULogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <path d="M22 2L4 9V24C4 33.5 12 40.5 22 43C32 40.5 40 33.5 40 24V9L22 2Z" fill="#EEB111" />
      <path d="M10 30V14L22 22L34 14V30" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M10 14L22 22L34 14" stroke="#111111" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SEMESTERS = ["Fall 2026", "Spring 2027", "Spring 2026", "Fall 2025", "Summer 2025", "Spring 2025"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const HOUR_HEIGHT = 76;

// DEPARTMENTS, GEN_ED_ATTRS, and COURSES are now loaded dynamically from CSV.
// They are passed as props or accessed via module-level refs set after loading.
const FALLBACK_COLOR = { bg: "#F8FAFC", border: "#E2E8F0", text: "#475569", accent: "#64748B", chip: "#94A3B8" };
const C = (course) => (course && course._color) ? course._color : FALLBACK_COLOR;

// COURSES is now loaded dynamically — see App component below.
// This module-level ref is updated once loading completes so helper functions
// like checkConflicts() and timesOverlap() that close over COURSES still work.
let COURSES = [];

const INIT_ENROLLED = [];
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
  const missingPrereqs = course.prereqIds.map(pid => COURSES.find(c => c.id === pid)).filter(pc => pc && !enrolledIds.includes(pc.id));
  return { timeConflicts, missingPrereqs };
}
function timeFrac(h) { return h - HOURS[0]; }
function fmtHour(h) {
  if (h === 12) return "12:00 PM";
  return h > 12 ? `${h - 12}:00 PM` : `${h}:00 AM`;
}

// ─── Hold Banner ──────────────────────────────────────────────────────────────
function HoldBanner({ onDismiss }) {
  return (
    <div style={{ background: "linear-gradient(90deg,#991B1B,#BE123C)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 20px", gap: 12, fontFamily: "'DM Sans',sans-serif", flexShrink: 0, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span>⚠️</span>
        <span style={{ fontSize: 13, fontWeight: 700 }}>
          <strong>Action Required: Advising Hold Active.</strong>{" "}
          <span style={{ fontWeight: 400, opacity: 0.9 }}>You must clear this hold before registration opens.</span>
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12, fontWeight: 700, color: "#FECDD3", textDecoration: "underline", whiteSpace: "nowrap" }}>Learn how to clear →</a>
        <button onClick={onDismiss} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 700, padding: "3px 12px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Dismiss</button>
      </div>
    </div>
  );
}

// ─── Format Badge ─────────────────────────────────────────────────────────────
function FormatBadge({ format }) {
  const online = format === "100% Online";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: online ? "#DCFCE7" : "#EFF6FF", color: online ? "#15803D" : "#1D4ED8", border: `1px solid ${online ? "#86EFAC" : "#BFDBFE"}` }}>
      {online ? "🌐 Online" : "🏫 In-Person"}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let _tid = 0;
function Toast({ toast, onDismiss }) {
  const [vis, setVis] = useState(false);
  const ok = toast.type === "success";
  const warn = toast.type === "warning";
  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
    const dur = toast.duration || (warn ? 6000 : ok ? 4500 : 7000);
    const t = setTimeout(() => { setVis(false); setTimeout(() => onDismiss(toast.id), 300); }, dur);
    return () => clearTimeout(t);
  }, []);
  const bg = ok ? "#141A0F" : warn ? "#1A1000" : "#1A1208";
  const bdrClr = ok ? "rgba(16,185,129,0.25)" : warn ? "rgba(217,119,6,0.45)" : "rgba(239,68,68,0.25)";
  const iconClr = ok ? "#10B981" : warn ? "#D97706" : "#EF4444";
  const iconBg  = ok ? "rgba(16,185,129,0.15)" : warn ? "rgba(217,119,6,0.15)" : "rgba(239,68,68,0.15)";
  return (
    <div onClick={() => { setVis(false); setTimeout(() => onDismiss(toast.id), 250); }}
      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 16px 11px 14px", background: bg, borderRadius: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", border: `1px solid ${bdrClr}`, maxWidth: 440, cursor: "pointer", pointerEvents: "all", transform: vis ? "translateY(0)" : "translateY(16px)", opacity: vis ? 1 : 0, transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1, background: iconBg, border: `1.5px solid ${iconClr}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {ok
          ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#10B981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : warn
            ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 2V5" stroke="#D97706" strokeWidth="1.6" strokeLinecap="round" /><circle cx="4.5" cy="7" r="0.7" fill="#D97706" /></svg>
            : <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 2V5" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" /><circle cx="4.5" cy="7" r="0.7" fill="#EF4444" /></svg>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{toast.title}</div>
        {toast.body && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2, lineHeight: 1.5 }}>{toast.body}</div>}
        {toast.chips?.length > 0 && <div style={{ marginTop: 5, display: "flex", gap: 4, flexWrap: "wrap" }}>{toast.chips.map(n => <span key={n} style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", background: "rgba(239,68,68,0.18)", color: "#FCA5A5", borderRadius: 20, border: "1px solid rgba(239,68,68,0.3)" }}>{n}</span>)}</div>}
      </div>
    </div>
  );
}
function ToastStack({ toasts, onDismiss }) {
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 300, display: "flex", flexDirection: "column-reverse", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {toasts.map(t => <Toast key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}

// ─── Slide-Over Drawer ────────────────────────────────────────────────────────
function SlideOver({ course, enrolled, onClose, onRegister }) {
  const [vis, setVis] = useState(false);
  const c = C(course);
  const isEnrolled = enrolled.includes(course.id);
  const { timeConflicts, missingPrereqs } = checkConflicts(course, enrolled);
  const hasConflict = !isEnrolled && (timeConflicts.length > 0 || missingPrereqs.length > 0);
  const seatPct = ((course.totalSeats - course.seats) / course.totalSeats) * 100;

  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
    const fn = e => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  function close() { setVis(false); setTimeout(onClose, 300); }

  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(17,17,17,0.25)", opacity: vis ? 1 : 0, transition: "opacity 0.3s", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "clamp(320px,28vw,460px)", background: "#fff", boxShadow: "-6px 0 40px rgba(0,0,0,0.15)", zIndex: 101, transform: vis ? "translateX(0)" : "translateX(100%)", transition: "transform 0.3s cubic-bezier(0.32,0,0,1)", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ height: 4, background: hasConflict ? "#EF4444" : `linear-gradient(90deg,${MU.gold},${MU.goldDark})`, flexShrink: 0 }} />
        <div style={{ padding: "18px 22px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ background: c.bg, border: `1.5px solid ${c.border}`, color: c.text, fontSize: 13, fontWeight: 800, padding: "3px 10px", borderRadius: 7 }}>{course.code}</span>
              <span style={{ fontSize: 12, color: MU.textMuted }}>{course.seats}/{course.totalSeats} seats</span>
              <FormatBadge format={course.format} />
            </div>
            <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: MU.textMuted, fontSize: 18, padding: "0 4px", lineHeight: 1 }} onMouseEnter={e => e.currentTarget.style.color = MU.black} onMouseLeave={e => e.currentTarget.style.color = MU.textMuted}>✕</button>
          </div>
          <h2 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: MU.black, letterSpacing: "-0.02em" }}>{course.name}</h2>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: MU.textSecond }}>{course.credits} Credits</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {[{ icon: "🕐", t: course.displayTime }, { icon: "📍", t: course.room }, { icon: "👤", t: course.instructor }].map(({ icon, t }) => (
              <div key={t} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, width: 18, textAlign: "center" }}>{icon}</span>
                <span style={{ fontSize: 13, color: MU.textPrimary }}>{t}</span>
              </div>
            ))}
          </div>
          {/* Seat bar */}
          <div style={{ marginBottom: 14, padding: "9px 12px", background: MU.cream, borderRadius: 8, border: `1px solid ${MU.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: MU.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Seat Availability</span>
              <span style={{ fontSize: 11, color: seatPct > 80 ? "#EF4444" : MU.goldDark, fontWeight: 700 }}>{course.seats} left</span>
            </div>
            <div style={{ height: 4, background: MU.border, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ width: `${seatPct}%`, height: "100%", background: seatPct > 80 ? "#EF4444" : MU.gold, borderRadius: 10 }} />
            </div>
          </div>
          <div style={{ height: 1, background: MU.border }} />
        </div>
        <div style={{ flex: 1, padding: "0 22px", overflowY: "auto" }}>
          {hasConflict && (
            <div style={{ marginTop: 14 }}>
              {timeConflicts.length > 0 && (
                <div style={{ background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#DC2626", marginBottom: 6 }}>⛔ Time Conflict</div>
                  {timeConflicts.map(tc => <div key={tc.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 8px", background: "rgba(239,68,68,0.07)", borderRadius: 6, marginBottom: 3 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#B91C1C" }}>{tc.code}</span><span style={{ fontSize: 11, color: "#9CA3AF" }}>{tc.displayTime}</span></div>)}
                </div>
              )}
              {missingPrereqs.length > 0 && (
                <div style={{ background: "#FFFBEB", border: "1.5px solid #FDE68A", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#92400E", marginBottom: 6 }}>⚠️ Missing Prerequisites</div>
                  {missingPrereqs.map(mp => <div key={mp.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 8px", background: "rgba(217,119,6,0.06)", borderRadius: 6, marginBottom: 3 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>{mp.code}</span><span style={{ fontSize: 11, color: "#9CA3AF" }}>{mp.name}</span></div>)}
                </div>
              )}
            </div>
          )}
          {[["Course Description", <p style={{ fontSize: 13, color: MU.textSecond, lineHeight: 1.75, margin: 0 }}>{course.description}</p>], ["Prerequisites", <p style={{ fontSize: 13, color: course.prereqIds.length > 0 ? MU.textSecond : MU.textMuted, lineHeight: 1.7, margin: 0 }}>{course.prerequisites}</p>], ["Instructor", <div style={{ display: "flex", gap: 10 }}><div style={{ width: 36, height: 36, borderRadius: "50%", background: MU.goldLight, border: `2px solid ${MU.goldMid}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: MU.goldDark, flexShrink: 0 }}>{course.instructor.split(" ").pop()[0]}</div><div><div style={{ fontWeight: 700, fontSize: 13, color: MU.black, marginBottom: 3 }}>{course.instructor}</div><p style={{ fontSize: 12, color: MU.textSecond, lineHeight: 1.6, margin: 0 }}>{course.instructorBio}</p></div></div>]].map(([title, content]) => (
            <div key={title} style={{ marginTop: 18, paddingBottom: 16, borderBottom: `1px solid ${MU.border}` }}>
              <h3 style={{ fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>{title}</h3>
              {content}
            </div>
          ))}
          {course.genEd.length > 0 && (
            <div style={{ marginTop: 18, paddingBottom: 16 }}>
              <h3 style={{ fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Gen Ed</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{course.genEd.map(g => <span key={g} style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", background: MU.goldLight, color: MU.goldDark, border: `1px solid ${MU.goldMid}`, borderRadius: 20 }}>{g}</span>)}</div>
            </div>
          )}
        </div>
        <div style={{ padding: "12px 22px 16px", borderTop: `1px solid ${MU.border}` }}>
          <button onClick={() => { if (!hasConflict || isEnrolled) { onRegister(course.id); close(); } }}
            style={{ width: "100%", padding: "12px 0", background: isEnrolled ? MU.cream : hasConflict ? MU.cream : `linear-gradient(135deg,${MU.gold},${MU.goldDark})`, color: isEnrolled ? MU.textMuted : hasConflict ? MU.textMuted : MU.black, border: hasConflict && !isEnrolled ? `1.5px solid ${MU.border}` : "none", borderRadius: 9, fontSize: 14, fontWeight: 800, cursor: hasConflict && !isEnrolled ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: !hasConflict && !isEnrolled ? `0 3px 14px rgba(238,177,17,0.4)` : "none" }}>
            {isEnrolled ? "✓ Enrolled — Click to Drop" : hasConflict ? "🚫 Cannot Register" : "Register for Course"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Course Card (sidebar) ────────────────────────────────────────────────────
function CourseCard({ course, enrolled, waitlisted, wishlist, onView, onAdd, onWishlist, hovered, onHover, onHoverEnd }) {
  const c = C(course);
  const isEnrolled = enrolled.includes(course.id);
  const isWL = !!waitlisted[course.id];
  const isFull = course.seats === 0;
  const isWishlisted = wishlist.includes(course.id);
  const { timeConflicts, missingPrereqs } = checkConflicts(course, enrolled);
  const hasConflict = !isEnrolled && !isWL && (timeConflicts.length > 0 || missingPrereqs.length > 0);
  const [labsOpen, setLabsOpen] = useState(false);
  const [selLab, setSelLab] = useState(null);

  return (
    <div onMouseEnter={() => onHover(course.id)} onMouseLeave={onHoverEnd}
      style={{ background: "#fff", border: `1px solid ${hasConflict && !isEnrolled ? "#FECACA" : hovered ? c.border : MU.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s", boxShadow: hovered ? `0 4px 16px rgba(0,0,0,0.08)` : "0 1px 3px rgba(0,0,0,0.04)", animation: hasConflict && !isEnrolled ? "conflictBorder 2s ease-in-out infinite" : "none" }}>

      {/* Top row: code chip + seats + wishlist + credits */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 6, background: c.bg, color: c.text, border: `1px solid ${c.border}`, letterSpacing: "0.02em" }}>{course.code}</span>
        {isFull
          ? <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>Full</span>
          : isEnrolled
            ? <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#ECFDF5", color: "#10B981", border: "1px solid #A7F3D0" }}>✓ Enrolled</span>
            : isWL
              ? <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" }}>⏳ Waitlist #{waitlisted[course.id]}</span>
              : <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: MU.goldLight, color: MU.goldDark, border: `1px solid ${MU.goldMid}` }}>{course.seats} seats</span>}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          {/* Wishlist bookmark */}
          <button onClick={e => { e.stopPropagation(); onWishlist(course.id); }}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 3px", borderRadius: 5, color: isWishlisted ? "#E11D48" : MU.borderDark, transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}
            onMouseEnter={e => e.currentTarget.style.color = isWishlisted ? "#9F1239" : "#E11D48"}
            onMouseLeave={e => e.currentTarget.style.color = isWishlisted ? "#E11D48" : MU.borderDark}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill={isWishlisted ? "#E11D48" : "none"}>
              <path d="M7 12S2 8.5 2 5.5A3 3 0 0 1 7 3.5a3 3 0 0 1 5 2c0 3-5 6.5-5 6.5Z" stroke={isWishlisted ? "#E11D48" : "currentColor"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={{ fontSize: 12, fontWeight: 700, color: MU.textMuted, flexShrink: 0 }}>{course.credits} cr</span>
        </div>
      </div>

      {/* Course name */}
      <div onClick={() => onView(course)} style={{ fontSize: 13, fontWeight: 700, color: MU.black, lineHeight: 1.35, marginBottom: 7 }}>{course.name}</div>

      {/* Instructor + time */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="3.5" r="2" stroke={MU.textMuted} strokeWidth="1.2" /><path d="M1 9.5c0-2 2-3 4.5-3s4.5 1 4.5 3" stroke={MU.textMuted} strokeWidth="1.2" strokeLinecap="round" /></svg>
          <span style={{ fontSize: 12, color: MU.textSecond }}>{course.instructor}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke={MU.textMuted} strokeWidth="1.2" /><path d="M5.5 3v2.5l1.5 1" stroke={MU.textMuted} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontSize: 12, color: MU.textSecond }}>{course.displayTime}</span>
        </div>
      </div>

      {/* Format badge */}
      <div style={{ marginBottom: course.labs ? 8 : 0 }}>
        <FormatBadge format={course.format} />
        {hasConflict && <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>Conflict</span>}
      </div>

      {/* Lab accordion */}
      {course.labs && (
        <div style={{ borderTop: `1px solid ${MU.border}`, marginTop: 8, paddingTop: 8 }}>
          <button onClick={e => { e.stopPropagation(); setLabsOpen(o => !o); }} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'DM Sans',sans-serif", width: "100%" }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: labsOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}><path d="M3 2.5l3.5 2.5L3 7.5" stroke={MU.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: MU.textSecond }}>🧪 Lab Sections ({course.labs.length})</span>
            {selLab && <span style={{ marginLeft: "auto", fontSize: 10, color: MU.goldDark, fontWeight: 700 }}>✓ Selected</span>}
          </button>
          {labsOpen && (
            <div style={{ marginTop: 7, display: "flex", flexDirection: "column", gap: 5 }}>
              {course.labs.map(lab => {
                const full = lab.seats === 0;
                const sel = selLab === lab.id;
                return (
                  <div key={lab.id} onClick={e => { e.stopPropagation(); if (!full) setSelLab(lab.id); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, background: sel ? MU.goldLight : full ? "#FEF2F2" : "#FAFAFA", border: `1.5px solid ${sel ? MU.goldMid : full ? "#FECACA" : MU.border}`, cursor: full ? "not-allowed" : "pointer", opacity: full ? 0.7 : 1 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${sel ? MU.gold : MU.borderDark}`, background: sel ? MU.gold : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {sel && <div style={{ width: 5, height: 5, borderRadius: "50%", background: MU.black }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: full ? "#9CA3AF" : MU.textPrimary, lineHeight: 1.2 }}>{lab.label}</div>
                      <div style={{ fontSize: 10, color: MU.textMuted }}>{lab.room}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: full ? "#EF4444" : lab.seats < 5 ? "#D97706" : "#059669", whiteSpace: "nowrap" }}>
                      {full ? "FULL" : `${lab.seats} open`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Drop button */}
      <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onAdd(course.id)}
          disabled={!isEnrolled && (isFull || (hasConflict && !isWL))}
          style={{ width: "100%", padding: "7px 0", background: isEnrolled ? "#FEF2F2" : isFull || hasConflict ? MU.cream : `linear-gradient(135deg,${MU.black} 0%,#2a2a2a 100%)`, color: isEnrolled ? "#EF4444" : isFull || hasConflict ? MU.textMuted : MU.gold, border: isEnrolled ? "1px solid #FECACA" : isFull || hasConflict ? `1px solid ${MU.border}` : "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: !isEnrolled && (isFull || hasConflict) ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif", transition: "filter 0.15s" }}
          onMouseEnter={e => { if (!(!isEnrolled && (isFull || hasConflict))) e.currentTarget.style.filter = "brightness(1.12)"; }}
          onMouseLeave={e => e.currentTarget.style.filter = "none"}>
          {isEnrolled ? "Drop Course" : isFull ? "Section Full" : hasConflict ? "⚠ Conflict" : "+ Add to Schedule"}
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
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 20px", textAlign: "center", gap: 12 }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#FFF1F2", border: "2px solid #FECDD3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 19S3 13.5 3 8.5a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 5-8 10.5-8 10.5Z" stroke="#FDA4AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: MU.textSecond }}>Your wishlist is empty</div>
        <div style={{ fontSize: 12, color: MU.textMuted, lineHeight: 1.6 }}>Click the ♡ on any course card to save it here for later.</div>
      </div>
    );
  }

  // Courses that can actually be added (not enrolled, not full, no conflict)
  const addableCourses = wishlistedCourses.filter(course => {
    const isEnrolled = enrolled.includes(course.id);
    const isFull = course.seats === 0;
    const { timeConflicts, missingPrereqs } = checkConflicts(course, enrolled);
    const hasConflict = !isEnrolled && (timeConflicts.length > 0 || missingPrereqs.length > 0);
    return !isEnrolled && !isFull && !hasConflict;
  });
  const canAddAll = addableCourses.length > 0;

  function handleAddAll() {
    if (!canAddAll) return;
    addableCourses.forEach(course => onAdd(course.id));
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* ── Prominent header ── */}
      <div style={{ padding: "10px 14px 8px", borderBottom: `1px solid ${MU.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="#E11D48"><path d="M9 16S2 11.5 2 7a5 5 0 0 1 7-4.5A5 5 0 0 1 16 7c0 4.5-7 9-7 9Z" /></svg>
            <span style={{ fontSize: 17, fontWeight: 800, color: MU.black, letterSpacing: "-0.01em" }}>Wishlist</span>
            <span style={{ fontSize: 11, fontWeight: 800, padding: "1px 8px", borderRadius: 20, background: "#FFF1F2", color: "#E11D48", border: "1px solid #FECDD3" }}>{wishlistedCourses.length}</span>
          </div>
          <button
            onClick={handleAddAll}
            disabled={!canAddAll}
            title={canAddAll ? `Add ${addableCourses.length} eligible course${addableCourses.length !== 1 ? "s" : ""} to your schedule` : "No eligible courses to add"}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 13px",
              background: canAddAll ? `linear-gradient(135deg,${MU.gold},${MU.goldDark})` : MU.cream,
              color: canAddAll ? MU.black : MU.textMuted,
              border: canAddAll ? "none" : `1px solid ${MU.border}`,
              borderRadius: 8, fontSize: 12, fontWeight: 800,
              cursor: canAddAll ? "pointer" : "not-allowed",
              fontFamily: "'DM Sans',sans-serif",
              boxShadow: canAddAll ? "0 3px 10px rgba(238,177,17,0.4)" : "none",
              transition: "all 0.15s", flexShrink: 0,
              opacity: canAddAll ? 1 : 0.6,
            }}
            onMouseEnter={e => { if (canAddAll) { e.currentTarget.style.filter = "brightness(1.07)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
            onMouseLeave={e => { e.currentTarget.style.filter = "none"; e.currentTarget.style.transform = "none"; }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 2v7M2 5.5h7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
            </svg>
            Add All{canAddAll ? ` (${addableCourses.length})` : ""}
          </button>
        </div>
        <div style={{ fontSize: 10, color: MU.textMuted, fontWeight: 600 }}>
          {addableCourses.length > 0 ? `${addableCourses.length} ready to add` : ""}{addableCourses.length > 0 && wishlistedCourses.length - addableCourses.length > 0 ? " · " : ""}{wishlistedCourses.length - addableCourses.length > 0 ? `${wishlistedCourses.length - addableCourses.length} blocked` : ""}{addableCourses.length === wishlistedCourses.length ? "All eligible to add" : ""}
        </div>
      </div>

      {/* ── Scrollable course list ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px 10px", display: "flex", flexDirection: "column", gap: 8 }}>
        {wishlistedCourses.map(course => {
          const c = C(course);
          const isEnrolled = enrolled.includes(course.id);
          const isFull = course.seats === 0;
          const { timeConflicts, missingPrereqs } = checkConflicts(course, enrolled);
          const hasConflict = !isEnrolled && (timeConflicts.length > 0 || missingPrereqs.length > 0);
          const seatColor = course.seats === 0 ? "#EF4444" : course.seats < 8 ? "#D97706" : "#059669";

          return (
            <div key={course.id} style={{ background: "#fff", border: `1px solid ${hasConflict ? "#FECACA" : c.border}`, borderLeft: `3px solid ${hasConflict ? "#EF4444" : c.accent}`, borderRadius: 10, overflow: "hidden", transition: "box-shadow 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div onClick={() => onView(course)} style={{ padding: "10px 12px", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background = MU.cream} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 7px", borderRadius: 5, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{course.code}</span>
                  {isEnrolled && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#ECFDF5", color: "#10B981", border: "1px solid #A7F3D0" }}>✓ Enrolled</span>}
                  {hasConflict && !isEnrolled && <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>⚠ Conflict</span>}
                  <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: seatColor }}>{isFull ? "Full" : `${course.seats} seats`}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: MU.black, lineHeight: 1.3, marginBottom: 4 }}>{course.name}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: MU.textSecond }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1" /><path d="M5 3v2l1.2 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
                    {course.displayTime}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: MU.textSecond }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="3.5" r="1.8" stroke="currentColor" strokeWidth="1" /><path d="M1 9c0-2 1.8-3 4-3s4 1 4 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" /></svg>
                    {course.instructor}
                  </div>
                </div>
                {hasConflict && !isEnrolled && (
                  <div style={{ marginTop: 6, padding: "5px 8px", background: "#FEF2F2", borderRadius: 6, fontSize: 11, color: "#DC2626" }}>
                    {timeConflicts.length > 0 && `Overlaps with ${timeConflicts.map(c => c.code).join(", ")}`}
                    {missingPrereqs.length > 0 && `Missing: ${missingPrereqs.map(c => c.code).join(", ")}`}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", borderTop: `1px solid ${MU.border}` }}>
                <button onClick={() => onRemove(course.id)} style={{ flex: 1, padding: "7px 0", background: "none", border: "none", borderRight: `1px solid ${MU.border}`, cursor: "pointer", fontSize: 11, fontWeight: 700, color: MU.textMuted, fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }} onMouseEnter={e => e.currentTarget.style.background = MU.cream} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M8.5 2.5l-6 6M2.5 2.5l6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  Remove
                </button>
                <button onClick={() => !hasConflict && !isFull && !isEnrolled && onAdd(course.id)}
                  style={{ flex: 2, padding: "7px 0", background: isEnrolled ? "#ECFDF5" : hasConflict || isFull ? MU.cream : `linear-gradient(135deg,${MU.black},#2a2a2a)`, border: "none", cursor: isEnrolled || hasConflict || isFull ? "default" : "pointer", fontSize: 11, fontWeight: 700, color: isEnrolled ? "#10B981" : hasConflict || isFull ? MU.textMuted : MU.gold, fontFamily: "'DM Sans',sans-serif" }} onMouseEnter={e => { if (!isEnrolled && !hasConflict && !isFull) e.currentTarget.style.filter = "brightness(1.15)"; }} onMouseLeave={e => e.currentTarget.style.filter = "none"}>
                  {isEnrolled ? "✓ Already Enrolled" : isFull ? "Section Full" : hasConflict ? "⚠ Has Conflict" : "+ Add to Schedule"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Advanced Search Panel ────────────────────────────────────────────────────
function AdvancedSearch({ enrolled, waitlisted, onRegister, onView, wishlist, onWishlist, departments, genEdAttrs }) {
  const [dept, setDept] = useState("All Departments");
  const [courseName, setCourseName] = useState("");
  const [courseNum, setCourseNum] = useState("");
  const [selGenEd, setSelGenEd] = useState([]);
  const [offeredThisTerm, setOfferedThisTerm] = useState(true);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [genEdOpen, setGenEdOpen] = useState(true);
  const [crn, setCrn] = useState("");
  const [courseBar, setCourseBar] = useState([]);
  const [expandedLabs, setExpandedLabs] = useState({});
  const [selectedLabs, setSelectedLabs] = useState({});

  function doSearch() {
    let f = COURSES;
    if (dept !== "All Departments") f = f.filter(c => c.department === dept);
    if (courseName.trim()) f = f.filter(c => c.name.toLowerCase().includes(courseName.toLowerCase()));
    if (courseNum.trim()) f = f.filter(c => c.code.toLowerCase().includes(courseNum.toLowerCase()));
    if (crn.trim()) f = f.filter(c => String(c.crn || "").includes(crn.trim()));
    if (selGenEd.length > 0) f = f.filter(c => selGenEd.every(a => c.genEd.includes(a)));
    setResults(f); setSearched(true);
  }
  function doClear() { setDept("All Departments"); setCourseName(""); setCourseNum(""); setCrn(""); setSelGenEd([]); setResults([]); setSearched(false); }

  const inp = { width: "100%", boxSizing: "border-box", padding: "8px 11px", background: "#fff", border: `1.5px solid ${MU.border}`, borderRadius: 7, fontSize: 13, color: MU.textPrimary, fontFamily: "'DM Sans',sans-serif", outline: "none" };
  const lbl = { fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ display: "flex", gap: 20, height: "100%", minHeight: 0 }}>
      {/* Filter */}
      <div style={{ width: 272, flexShrink: 0, background: "#fff", borderRadius: 12, border: `1px solid ${MU.border}`, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        <div style={{ background: MU.black, padding: "13px 16px", flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: MU.gold, letterSpacing: "0.08em", textTransform: "uppercase" }}>Search Filters</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Department</label>
            <div style={{ position: "relative" }}>
              <button onClick={() => setDeptOpen(o => !o)} style={{ ...inp, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: dept === "All Departments" ? MU.textMuted : MU.textPrimary, fontSize: 13 }}>{dept}</span>
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2.5 4.5l3 3 3-3" stroke={MU.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {deptOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0, background: "#fff", border: `1.5px solid ${MU.border}`, borderRadius: 9, boxShadow: "0 8px 28px rgba(0,0,0,0.12)", zIndex: 60, maxHeight: 220, overflowY: "auto" }}>
                  {(departments || []).map(d => <button key={d} onClick={() => { setDept(d); setDeptOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 13px", background: d === dept ? MU.goldLight : "transparent", border: "none", cursor: "pointer", fontSize: 12, color: d === dept ? MU.goldDark : MU.textPrimary, fontWeight: d === dept ? 700 : 400, fontFamily: "'DM Sans',sans-serif", borderLeft: d === dept ? `3px solid ${MU.gold}` : "3px solid transparent" }} onMouseEnter={e => { if (d !== dept) e.currentTarget.style.background = MU.cream; }} onMouseLeave={e => { if (d !== dept) e.currentTarget.style.background = "transparent"; }}>{d}</button>)}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Course Name <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional)</span></label>
            <input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="e.g. Linear Algebra" style={inp} onFocus={e => e.target.style.borderColor = MU.gold} onBlur={e => e.target.style.borderColor = MU.border} onKeyDown={e => { if (e.key === "Enter") doSearch(); }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Course Number <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional)</span></label>
            <input value={courseNum} onChange={e => setCourseNum(e.target.value)} placeholder="e.g. 101 or CS" style={inp} onFocus={e => e.target.style.borderColor = MU.gold} onBlur={e => e.target.style.borderColor = MU.border} onKeyDown={e => { if (e.key === "Enter") doSearch(); }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>CRN <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(5-digit code)</span></label>
            <input value={crn} onChange={e => setCrn(e.target.value)} placeholder="e.g. 45231" style={inp} onFocus={e => e.target.style.borderColor = MU.gold} onBlur={e => e.target.style.borderColor = MU.border} onKeyDown={e => { if (e.key === "Enter") doSearch(); }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setGenEdOpen(o => !o)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 5 }}>
              <span style={lbl}>Gen Ed <span style={{ textTransform: "none", fontWeight: 400, letterSpacing: 0 }}>(optional)</span></span>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ transform: genEdOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}><path d="M2.5 4.5l3 3 3-3" stroke={MU.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {genEdOpen && (genEdAttrs || []).map(attr => {
              const chk = selGenEd.includes(attr);
              return <div key={attr} onClick={() => setSelGenEd(p => p.includes(attr) ? p.filter(a => a !== attr) : [...p, attr])} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", padding: "5px 9px", borderRadius: 6, background: chk ? MU.goldLight : "transparent", marginBottom: 3 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${chk ? MU.gold : MU.borderDark}`, background: chk ? MU.gold : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {chk && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <span style={{ fontSize: 11, color: chk ? MU.goldDark : MU.textSecond, fontWeight: chk ? 700 : 400 }}>{attr}</span>
              </div>;
            })}
          </div>
          {/* Toggle */}
          <div onClick={() => setOfferedThisTerm(o => !o)} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18, padding: "9px 11px", background: MU.cream, borderRadius: 8, border: `1px solid ${MU.border}`, cursor: "pointer" }}>
            <div style={{ width: 34, height: 19, borderRadius: 19, background: offeredThisTerm ? MU.gold : MU.borderDark, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 2.5, left: offeredThisTerm ? 16 : 2.5, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: offeredThisTerm ? MU.textPrimary : MU.textMuted, userSelect: "none" }}>Offered This Term Only</span>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button onClick={doSearch} style={{ flex: 1, padding: "9px 0", background: `linear-gradient(135deg,${MU.gold},${MU.goldDark})`, color: MU.black, border: "none", borderRadius: 7, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }} onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.07)"} onMouseLeave={e => e.currentTarget.style.filter = "none"}>Search</button>
            <button onClick={doClear} style={{ padding: "9px 13px", background: MU.cream, color: MU.textSecond, border: `1px solid ${MU.border}`, borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }} onMouseEnter={e => e.currentTarget.style.background = MU.border} onMouseLeave={e => e.currentTarget.style.background = MU.cream}>Clear</button>
          </div>
        </div>
      </div>
      {/* Results */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, gap: 12 }}>
        {courseBar.length > 0 && (
          <div style={{ background: "#fff", border: `1px solid ${MU.border}`, borderRadius: 9, padding: "9px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 }}>Course Bar</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {courseBar.map(cid => {
                const course = COURSES.find(c => c.id === cid); if (!course) return null;
                const cc = C(course); const isE = enrolled.includes(cid);
                const { timeConflicts: tc, missingPrereqs: mp } = checkConflicts(course, enrolled);
                const hc = !isE && (tc.length > 0 || mp.length > 0);
                return <div key={cid} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 9px", background: cc.bg, border: `1.5px solid ${cc.border}`, borderRadius: 7 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: cc.text }}>{course.code}</span>
                  <button onClick={() => onRegister(cid)} disabled={hc && !isE} style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", background: isE ? "#FEF2F2" : hc ? MU.cream : MU.black, color: isE ? "#EF4444" : hc ? MU.textMuted : MU.gold, border: "none", borderRadius: 4, cursor: hc && !isE ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif" }}>{isE ? "Drop" : hc ? "Conflict" : "+ Add"}</button>
                  <button onClick={() => setCourseBar(p => p.filter(id => id !== cid))} style={{ background: "none", border: "none", cursor: "pointer", color: MU.textMuted, fontSize: 13, lineHeight: 1, padding: "0 1px" }}>×</button>
                </div>;
              })}
            </div>
          </div>
        )}
        <div style={{ flex: 1, background: "#fff", borderRadius: 12, border: `1px solid ${MU.border}`, boxShadow: "0 1px 6px rgba(0,0,0,0.05)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ background: MU.cream, padding: "10px 18px", borderBottom: `1px solid ${MU.border}`, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: MU.textSecond }}>{!searched ? "Search results will appear here" : results.length === 0 ? "No courses matched" : `${results.length} course${results.length !== 1 ? "s" : ""} found`}</div>
            {searched && results.length > 0 && <span style={{ fontSize: 11, color: MU.textMuted }}>Click row to view · Add to course bar</span>}
          </div>
          {results.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "84px 1fr 94px 66px 72px 108px", borderBottom: `1.5px solid ${MU.border}`, background: MU.cream, flexShrink: 0 }}>
              {["Course #", "Course Name", "Open Seats", "Credits", "Wishlist", "Action"].map((h, i) => <div key={h || i} style={{ padding: "7px 13px", fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", textAlign: "center", borderLeft: i > 0 ? `1px solid ${MU.border}` : "none" }}>{h}</div>)}
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {!searched && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 40, textAlign: "center" }}><div style={{ width: 48, height: 48, borderRadius: "50%", background: MU.goldLight, border: `2px solid ${MU.goldMid}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 20 }}>🔍</div><div style={{ fontSize: 14, fontWeight: 700, color: MU.textSecond, marginBottom: 5 }}>Find Your Courses</div><div style={{ fontSize: 13, color: MU.textMuted, lineHeight: 1.6 }}>Use the filters to search by department, name, number, or gen ed.</div></div>}
            {searched && results.length === 0 && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 40, textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 700, color: MU.textSecond, marginBottom: 5 }}>No courses matched</div><div style={{ fontSize: 13, color: MU.textMuted }}>Try broadening your search.</div></div>}
            {results.map((course, idx) => {
              const cc = C(course); const isE = enrolled.includes(course.id); const inBar = courseBar.includes(course.id);
              const sc = course.seats === 0 ? "#EF4444" : course.seats < 8 ? "#D97706" : "#059669";
              const labEx = !!expandedLabs[course.id];
              const isWL = wishlist.includes(course.id);
              return <div key={course.id} style={{ borderBottom: idx < results.length - 1 ? `1px solid ${MU.border}` : "none" }}>
                <div style={{ display: "grid", gridTemplateColumns: "84px 1fr 94px 66px 72px 108px", background: idx % 2 === 0 ? "#fff" : "#FDFDFB", cursor: "pointer", transition: "background 0.12s" }} onMouseEnter={e => e.currentTarget.style.background = MU.goldLight} onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#fff" : "#FDFDFB"} onClick={() => onView(course)}>
                  <div style={{ padding: "10px 13px", display: "flex", alignItems: "center" }}><span style={{ fontWeight: 800, fontSize: 11, color: cc.text, background: cc.bg, border: `1px solid ${cc.border}`, padding: "2px 6px", borderRadius: 5 }}>{course.code}</span></div>
                  <div style={{ padding: "10px 13px", borderLeft: `1px solid ${MU.border}`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: MU.textPrimary, lineHeight: 1.3 }}>{course.name}</span>
                    <span style={{ fontSize: 11, color: MU.textMuted }}>{course.displayTime} · {course.instructor}</span>
                    <div style={{ display: "flex", gap: 4, marginTop: 2, alignItems: "center", flexWrap: "wrap" }}><FormatBadge format={course.format} />{course.genEd.map(g => <span key={g} style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", background: MU.goldLight, color: MU.goldDark, borderRadius: 10, border: `1px solid ${MU.goldMid}` }}>{g.match(/\(([^)]+)\)/)?.[1] || g}</span>)}</div>
                  </div>
                  <div style={{ padding: "10px 13px", borderLeft: `1px solid ${MU.border}`, display: "flex", alignItems: "center" }}><div><div style={{ fontSize: 14, fontWeight: 800, color: sc }}>{course.seats}</div><div style={{ fontSize: 10, color: MU.textMuted }}>of {course.totalSeats}</div></div></div>
                  <div style={{ padding: "10px 13px", borderLeft: `1px solid ${MU.border}`, display: "flex", alignItems: "center" }}><span style={{ fontSize: 13, fontWeight: 700, color: MU.textSecond }}>{course.credits} cr</span></div>
                  {/* Wishlist heart column */}
                  <div onClick={e => e.stopPropagation()} style={{ borderLeft: `1px solid ${MU.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <button
                      onClick={() => onWishlist(course.id)}
                      title={isWL ? "Remove from Wishlist" : "Add to Wishlist"}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: isWL ? "#E11D48" : MU.borderDark, transition: "color 0.15s, transform 0.15s", borderRadius: 5 }}
                      onMouseEnter={e => { e.currentTarget.style.color = isWL ? "#9F1239" : "#E11D48"; e.currentTarget.style.transform = "scale(1.2)"; }}
                      onMouseLeave={e => { e.currentTarget.style.color = isWL ? "#E11D48" : MU.borderDark; e.currentTarget.style.transform = "scale(1)"; }}>
                      <svg width="15" height="15" viewBox="0 0 14 14" fill={isWL ? "#E11D48" : "none"}>
                        <path d="M7 12S2 8.5 2 5.5A3 3 0 0 1 7 3.5a3 3 0 0 1 5 2c0 3-5 6.5-5 6.5Z" stroke={isWL ? "#E11D48" : "currentColor"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div onClick={e => e.stopPropagation()} style={{ padding: "10px 11px", borderLeft: `1px solid ${MU.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isE ? <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", background: "#ECFDF5", padding: "3px 9px", borderRadius: 20, border: "1px solid #A7F3D0" }}>✓ Enrolled</span>
                      : inBar ? <span style={{ fontSize: 11, fontWeight: 700, color: MU.goldDark, background: MU.goldLight, padding: "3px 9px", borderRadius: 20, border: `1px solid ${MU.goldMid}` }}>In Bar</span>
                        : <button onClick={() => setCourseBar(p => [...p, course.id])} style={{ fontSize: 12, fontWeight: 800, padding: "4px 11px", background: MU.black, color: MU.gold, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }} onMouseEnter={e => e.currentTarget.style.background = "#2a2a2a"} onMouseLeave={e => e.currentTarget.style.background = MU.black}>+ Add</button>}
                  </div>
                </div>
                {course.labs && <div style={{ background: "#FAFAF7", borderTop: `1px solid ${MU.border}` }}>
                  <button onClick={() => setExpandedLabs(p => ({ ...p, [course.id]: !p[course.id] }))} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px 6px 18px", width: "100%", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", borderBottom: labEx ? `1px solid ${MU.border}` : "none" }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: labEx ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}><path d="M3 2.5l3.5 2.5L3 7.5" stroke={MU.textMuted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: 10, fontWeight: 800, color: MU.textSecond, letterSpacing: "0.05em", textTransform: "uppercase" }}>🧪 Lab Sections ({course.labs.length})</span>
                    {selectedLabs[course.id] && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: MU.goldDark }}>✓ Selected</span>}
                  </button>
                  {labEx && <div style={{ padding: "7px 13px 9px 26px", display: "flex", flexDirection: "column", gap: 5 }}>
                    {course.labs.map(lab => {
                      const full = lab.seats === 0; const sel = selectedLabs[course.id] === lab.id; return <div key={lab.id} onClick={() => !full && setSelectedLabs(p => ({ ...p, [course.id]: lab.id }))} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 11px", borderRadius: 7, background: sel ? MU.goldLight : full ? "#FEF2F2" : "#fff", border: `1.5px solid ${sel ? MU.goldMid : full ? "#FECACA" : MU.border}`, cursor: full ? "not-allowed" : "pointer", opacity: full ? 0.65 : 1 }}>
                        <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${sel ? MU.gold : MU.borderDark}`, background: sel ? MU.gold : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{sel && <div style={{ width: 5, height: 5, borderRadius: "50%", background: MU.black }} />}</div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: full ? "#9CA3AF" : MU.textPrimary }}>{lab.label}</div><div style={{ fontSize: 10, color: MU.textMuted }}>{lab.room}</div></div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: full ? "#EF4444" : lab.seats < 5 ? "#D97706" : "#059669", whiteSpace: "nowrap" }}>{full ? "FULL" : `${lab.seats}/${lab.totalSeats} open`}</span>
                      </div>;
                    })}
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
const PRINT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const PRINT_H = 60; // px per hour in print grid

function ScheduleGeneratorPage({ enrolled, waitlisted, semester, onClose }) {
  const [vis, setVis] = useState(false);
  const [sections, setSections] = useState({
    header: true,
    calendar: true,
    details: true,
    table: true,
    footer: true,
  });
  const toggleSection = key => setSections(s => ({ ...s, [key]: !s[key] }));

  const enrolledCourses = COURSES.filter(c => enrolled.includes(c.id));
  const waitlistedCourses = COURSES.filter(c => Object.keys(waitlisted).includes(c.id));
  const allCourses = [...enrolledCourses, ...waitlistedCourses];
  const totalCredits = enrolledCourses.reduce((s, c) => s + c.credits, 0);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => { requestAnimationFrame(() => setVis(true)); }, []);
  function close() { setVis(false); setTimeout(onClose, 350); }

  // Day abbreviation map for compact display
  const dayAbbr = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri" };

  // Build a readable meeting pattern string
  function meetingDays(days) {
    const map = { mon: "M", tue: "T", wed: "W", thu: "Th", fri: "F" };
    return days.map(d => map[d] || d).join("");
  }

  function printSchedule() {
    const printArea = document.getElementById("schedule-print-area");
    if (!printArea) return;

    // Clone content into a self-contained iframe so React's root styles don't interfere
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:-9999px;top:-9999px;width:1100px;height:1px;border:none;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'DM Sans',sans-serif;background:#E8E4D9;padding:32px 0 48px;}
        @page{margin:0.55in;size:letter;}
        @media print{body{background:#fff!important;padding:0!important;}}
        /* Preserve background colors in print */
        *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      </style>
    </head><body>${printArea.innerHTML}</body></html>`);
    doc.close();

    iframe.contentWindow.focus();
    // Wait briefly for fonts/images to settle, then print
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 600);
  }

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(17,17,17,0.55)", opacity: vis ? 1 : 0, transition: "opacity 0.35s" }} onClick={close} />

      {/* Slide-up panel */}
      <div style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", flexDirection: "column", transform: vis ? "translateY(0)" : "translateY(100%)", transition: "transform 0.4s cubic-bezier(0.32,0,0,1)", fontFamily: "'DM Sans',sans-serif" }}>

        {/* ── Toolbar ── */}
        <div style={{ background: MU.black, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", height: 56, boxShadow: "0 2px 12px rgba(0,0,0,0.4)", zIndex: 10, gap: 16 }}>
          <button onClick={close} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, padding: "7px 16px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Back to Dashboard
          </button>

          {/* Section toggles */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              ["header",   "Header"],
              ["calendar", "Calendar"],
              ["details",  "Course Details"],
              ["table",    "Quick Reference"],
              ["footer",   "Dates & Contacts"],
            ].map(([key, label]) => (
              <button key={key} onClick={() => toggleSection(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 11px", borderRadius: 20,
                  background: sections[key] ? MU.gold : "rgba(255,255,255,0.08)",
                  color: sections[key] ? MU.black : "rgba(255,255,255,0.45)",
                  border: sections[key] ? "none" : "1px solid rgba(255,255,255,0.15)",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                  transition: "all 0.15s",
                  textDecoration: sections[key] ? "none" : "line-through",
                }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  {sections[key]
                    ? <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    : <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />}
                </svg>
                {label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Schedule Preview</div>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: MU.gold }}>{semester}</div>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.15)" }} />
            <button onClick={printSchedule} style={{ display: "flex", alignItems: "center", gap: 8, background: `linear-gradient(135deg,${MU.gold},${MU.goldDark})`, border: "none", borderRadius: 8, color: MU.black, fontSize: 13, fontWeight: 800, padding: "8px 18px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: `0 3px 12px rgba(238,177,17,0.4)` }} onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.08)"} onMouseLeave={e => e.currentTarget.style.filter = "none"}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="4" width="10" height="8" rx="1.5" stroke={MU.black} strokeWidth="1.4" /><path d="M4 4V2.5A.5.5 0 014.5 2h5a.5.5 0 01.5.5V4" stroke={MU.black} strokeWidth="1.4" /><path d="M4 9.5h6M4 11.5h4" stroke={MU.black} strokeWidth="1.2" strokeLinecap="round" /><circle cx="4" cy="7" r="0.7" fill={MU.black} /></svg>
              Print Schedule
            </button>
          </div>
        </div>

        {/* ── Scrollable document area ── */}
        <div id="schedule-print-area" style={{ flex: 1, overflowY: "auto", background: "#E8E4D9", padding: "32px 0 48px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20, padding: "0 24px" }}>

            {/* ══ Document Header ══ */}
            {sections.header && (
              <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                <div style={{ background: MU.black, padding: "22px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <MULogo size={44} />
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display',serif", letterSpacing: "-0.02em" }}>Millersville University</div>
                      <div style={{ fontSize: 11, color: MU.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Official Course Schedule</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display',serif" }}>{semester}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Generated {today}</div>
                  </div>
                </div>
                {/* Student summary bar */}
                <div style={{ background: MU.cream, borderBottom: `1px solid ${MU.border}`, padding: "14px 28px", display: "flex", gap: 32 }}>
                  {[
                    ["Student", "Skully Ville Jr."],
                    ["Student ID", "MU-2024-8841"],
                    ["Credits Enrolled", `${totalCredits} credits`],
                    ["Courses Enrolled", `${enrolledCourses.length} course${enrolledCourses.length !== 1 ? "s" : ""}`],
                    ["Academic Standing", "Good Standing"],
                    ["Advisor", "Dr. Jack Sparrow"],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: MU.black }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )} {/* end header */}

            {/* ══ Weekly Calendar Grid ══ */}
            {sections.calendar && (
              <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                <div style={{ padding: "16px 22px 12px", borderBottom: `1px solid ${MU.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: MU.black, letterSpacing: "-0.02em" }}>Weekly Schedule</div>
                    <div style={{ fontSize: 12, color: MU.textMuted, marginTop: 2 }}>All times are Eastern Time · Click course blocks to see details</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {enrolledCourses.map(c => {
                      const cc = C(c);
                      return <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: cc.text }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: cc.accent, flexShrink: 0 }} />
                        {c.code}
                      </div>;
                    })}
                  </div>
                </div>
                {/* Grid */}
                <div style={{ padding: "0 0 16px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "56px repeat(5,1fr)", borderBottom: `1.5px solid ${MU.border}` }}>
                    <div />
                    {DAYS.map(d => <div key={d} style={{ padding: "10px 8px", textAlign: "center", fontSize: 11, fontWeight: 800, color: MU.textSecond, letterSpacing: "0.06em", textTransform: "uppercase", borderLeft: `1px solid ${MU.border}` }}>{d}</div>)}
                  </div>
                  <div style={{ position: "relative", display: "grid", gridTemplateColumns: "56px repeat(5,1fr)" }}>
                    {PRINT_HOURS.map((h, i) => (
                      <div key={h} style={{ display: "contents" }}>
                        <div style={{ height: PRINT_H, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: "3px 8px 0 0", fontSize: 10, color: MU.textMuted, fontWeight: 700, borderTop: i > 0 ? `1px solid ${MU.border}` : "none" }}>{fmtHour(h)}</div>
                        {DAY_KEYS.map(day => <div key={day} style={{ height: PRINT_H, borderLeft: `1px solid ${MU.border}`, borderTop: i > 0 ? `1px solid ${MU.border}` : "none", background: i % 2 === 0 ? "#fff" : "#FCFAF6" }} />)}
                      </div>
                    ))}
                    {enrolledCourses.map(course =>
                      course.schedule.days.map(day => {
                        const col = DAY_KEYS.indexOf(day); if (col === -1) return null;
                        const top = (course.schedule.start - PRINT_HOURS[0]) * PRINT_H;
                        const h = (course.schedule.end - course.schedule.start) * PRINT_H - 3;
                        const c = C(course);
                        return (
                          <div key={`pg-${course.id}-${day}`}
                            style={{ position: "absolute", top, height: h, left: `calc(56px + ${col} * ((100% - 56px) / 5) + 3px)`, width: `calc((100% - 56px) / 5 - 6px)`, background: c.bg, border: `1.5px solid ${c.border}`, borderLeft: `4px solid ${c.accent}`, borderRadius: 7, padding: "5px 7px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                            <div style={{ fontWeight: 800, fontSize: 11, color: c.text, lineHeight: 1.2 }}>{course.code}</div>
                            <div style={{ fontSize: 9.5, color: c.text, opacity: 0.75, marginTop: 2, lineHeight: 1.4, fontWeight: 600 }}>{course.room}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )} {/* end calendar */}

            {/* ══ Course Detail Cards ══ */}
            {sections.details && (
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: MU.black, letterSpacing: "-0.02em", marginBottom: 14, paddingLeft: 2 }}>Enrolled Courses — Full Detail</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {enrolledCourses.map((course, idx) => {
                  const c = C(course);
                  const seatPct = ((course.totalSeats - course.seats) / course.totalSeats) * 100;
                  return (
                    <div key={course.id} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1px solid ${MU.border}` }}>
                      {/* Card header bar */}
                      <div style={{ height: 5, background: c.accent }} />
                      <div style={{ padding: "18px 22px 0" }}>
                        {/* Title row */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, background: c.bg, border: `2px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: 16, fontWeight: 900, color: c.text, letterSpacing: "-0.03em" }}>{idx + 1}</span>
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                <span style={{ fontSize: 13, fontWeight: 800, padding: "3px 10px", borderRadius: 7, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{course.code}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: MU.textMuted }}>{course.credits} Credits</span>
                                <FormatBadge format={course.format} />
                              </div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: MU.black, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{course.name}</div>
                            </div>
                          </div>
                          {/* Seat availability */}
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                            <div style={{ fontSize: 11, color: MU.textMuted, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>Seat Availability</div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: seatPct > 80 ? "#EF4444" : MU.goldDark }}>{course.seats}</div>
                            <div style={{ fontSize: 11, color: MU.textMuted }}>of {course.totalSeats} remaining</div>
                            <div style={{ width: 100, height: 4, background: MU.border, borderRadius: 10, marginTop: 5, overflow: "hidden" }}>
                              <div style={{ width: `${seatPct}%`, height: "100%", background: seatPct > 80 ? "#EF4444" : MU.gold, borderRadius: 10 }} />
                            </div>
                          </div>
                        </div>
                        {/* Info grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: MU.border, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                          {[
                            ["📅 Meeting Days", course.schedule.days.map(d => dayAbbr[d]).join(", ")],
                            ["🕐 Time", course.displayTime],
                            ["📍 Room", course.room],
                            ["👤 Instructor", course.instructor],
                            ["🏫 Format", course.format],
                            ["🎓 Gen Ed", course.genEd.length > 0 ? course.genEd.map(g => g.match(/\(([^)]+)\)/)?.[1] || g).join(" · ") : "None"],
                          ].map(([label, val]) => (
                            <div key={label} style={{ background: "#fff", padding: "11px 14px" }}>
                              <div style={{ fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: MU.textPrimary, lineHeight: 1.3 }}>{val}</div>
                            </div>
                          ))}
                        </div>
                        {/* Description */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Course Description</div>
                          <p style={{ fontSize: 13, color: MU.textSecond, lineHeight: 1.75, margin: 0 }}>{course.description}</p>
                        </div>
                        {/* Prerequisites + Instructor bio */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
                          <div style={{ padding: "12px 14px", background: MU.cream, borderRadius: 9, border: `1px solid ${MU.border}` }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Prerequisites</div>
                            <p style={{ fontSize: 12, color: course.prereqIds.length > 0 ? MU.textPrimary : MU.textMuted, lineHeight: 1.6, margin: 0 }}>{course.prerequisites}</p>
                          </div>
                          <div style={{ padding: "12px 14px", background: MU.cream, borderRadius: 9, border: `1px solid ${MU.border}` }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>About the Instructor</div>
                            <p style={{ fontSize: 12, color: MU.textSecond, lineHeight: 1.6, margin: 0 }}>{course.instructorBio}</p>
                          </div>
                        </div>
                        {/* Important contacts row */}
                        <div style={{ borderTop: `1px solid ${MU.border}`, padding: "12px 0", display: "flex", gap: 20, flexWrap: "wrap" }}>
                          {[
                            ["Office", "Caputo Hall, Room " + (100 + Math.floor(Math.random() * 200))],
                            ["Office Hours", "Mon & Wed 2:00–4:00 PM"],
                            ["Email", course.instructor.split(" ").pop().toLowerCase() + "@millersville.edu"],
                            ["Registrar Ref", "CRN-" + (10000 + Math.floor(Math.random() * 9000))],
                          ].map(([label, val]) => (
                            <div key={label} style={{ minWidth: 160 }}>
                              <div style={{ fontSize: 9, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: MU.textPrimary }}>{val}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            )} {/* end details */}

            {/* ══ Quick Reference Table ══ */}
            {sections.table && (
              <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: `1px solid ${MU.border}` }}>
                <div style={{ background: MU.black, padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Quick Reference Summary</div>
                  <div style={{ fontSize: 12, color: MU.gold, fontWeight: 700 }}>{totalCredits} Total Credits Enrolled</div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: MU.cream }}>
                      {["#", "Course", "Name", "Days & Time", "Room", "Instructor", "Cr", "Seats"].map((h, i) => (
                        <th key={h} style={{ padding: "9px 14px", fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.07em", textTransform: "uppercase", textAlign: "left", borderBottom: `1.5px solid ${MU.border}`, borderLeft: i > 0 ? `1px solid ${MU.border}` : "none" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrolledCourses.map((course, i) => {
                      const c = C(course);
                      return (
                        <tr key={course.id} style={{ background: i % 2 === 0 ? "#fff" : "#FDFDFB" }}>
                          <td style={{ padding: "10px 14px", fontSize: 12, color: MU.textMuted, fontWeight: 700, borderTop: `1px solid ${MU.border}` }}>{i + 1}</td>
                          <td style={{ padding: "10px 14px", borderTop: `1px solid ${MU.border}`, borderLeft: `1px solid ${MU.border}` }}><span style={{ fontSize: 12, fontWeight: 800, padding: "2px 8px", borderRadius: 5, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{course.code}</span></td>
                          <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: MU.textPrimary, borderTop: `1px solid ${MU.border}`, borderLeft: `1px solid ${MU.border}` }}>{course.name}</td>
                          <td style={{ padding: "10px 14px", fontSize: 12, color: MU.textSecond, borderTop: `1px solid ${MU.border}`, borderLeft: `1px solid ${MU.border}`, whiteSpace: "nowrap" }}>{meetingDays(course.schedule.days)} · {course.displayTime.split(" ").slice(-2).join(" ")}</td>
                          <td style={{ padding: "10px 14px", fontSize: 12, color: MU.textSecond, borderTop: `1px solid ${MU.border}`, borderLeft: `1px solid ${MU.border}` }}>{course.room}</td>
                          <td style={{ padding: "10px 14px", fontSize: 12, color: MU.textSecond, borderTop: `1px solid ${MU.border}`, borderLeft: `1px solid ${MU.border}` }}>{course.instructor}</td>
                          <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: MU.textPrimary, borderTop: `1px solid ${MU.border}`, borderLeft: `1px solid ${MU.border}`, textAlign: "center" }}>{course.credits}</td>
                          <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: course.seats < 8 ? "#D97706" : "#059669", borderTop: `1px solid ${MU.border}`, borderLeft: `1px solid ${MU.border}`, textAlign: "center" }}>{course.seats}</td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: MU.goldLight }}>
                      <td colSpan={6} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 800, color: MU.goldDark, borderTop: `2px solid ${MU.goldMid}`, textAlign: "right" }}>Total Credits Enrolled:</td>
                      <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 900, color: MU.goldDark, borderTop: `2px solid ${MU.goldMid}`, borderLeft: `1px solid ${MU.goldMid}`, textAlign: "center" }}>{totalCredits}</td>
                      <td style={{ borderTop: `2px solid ${MU.goldMid}`, borderLeft: `1px solid ${MU.goldMid}` }} />
                    </tr>
                  </tbody>
                </table>
              </div>
            )} {/* end table */}

            {/* ══ Important Dates & Footer ══ */}
            {sections.footer && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${MU.border}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                  <div style={{ padding: "13px 18px", borderBottom: `1px solid ${MU.border}`, background: MU.cream }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: MU.black }}>📅 Important Academic Dates</div>
                  </div>
                  <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      ["Jan 13", "Spring semester classes begin"],
                      ["Jan 20", "Last day to add/drop without record"],
                      ["Mar 3–7", "Spring recess (no classes)"],
                      ["Mar 14", "Last day to withdraw with W grade"],
                      ["Apr 25", "Last day of regular classes"],
                      ["Apr 28 – May 2", "Final examination period"],
                      ["May 10", "Commencement ceremony"],
                    ].map(([date, event]) => (
                      <div key={date} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: MU.goldDark, whiteSpace: "nowrap", minWidth: 48 }}>{date}</span>
                        <span style={{ fontSize: 12, color: MU.textSecond, lineHeight: 1.4 }}>{event}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${MU.border}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div style={{ padding: "13px 18px", borderBottom: `1px solid ${MU.border}`, background: MU.cream }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: MU.black }}>📞 Key Contacts</div>
                    </div>
                    <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
                      {[
                        ["Registrar's Office", "(717) 871-5006 · registrar@millersville.edu"],
                        ["Academic Advisor", "Dr. Patricia Miles · pmiles@millersville.edu"],
                        ["Financial Aid", "(717) 871-5100 · finaid@millersville.edu"],
                        ["IT Help Desk", "(717) 871-7777 · helpdesk@millersville.edu"],
                        ["Student Health", "(717) 871-5250 · health@millersville.edu"],
                      ].map(([office, contact]) => (
                        <div key={office}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>{office}</div>
                          <div style={{ fontSize: 11, color: MU.textSecond, marginTop: 1 }}>{contact}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: MU.black, borderRadius: 14, padding: "16px 18px" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: MU.gold, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Registrar's Note</div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: "0 0 10px" }}>This schedule was generated from the MAX Registration System. Enrollment is subject to change. Please verify your schedule in MAX before the semester begins.</p>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{today} · Millersville University</div>
                  </div>
                </div>
              </div>
            )} {/* end footer */}



          </div>
        </div>
      </div>

      {/* Print-only styles — fallback if user prints the full page directly */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #schedule-print-area {
            display: flex !important;
            flex-direction: column !important;
            position: static !important;
            overflow: visible !important;
            background: #fff !important;
            padding: 0 !important;
            height: auto !important;
          }
          #schedule-print-area > div { max-width: 100% !important; padding: 0 !important; gap: 12pt !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 0.55in; size: letter; }
        }
      `}</style>
    </>
  );
}

// ─── MaraudAudit Panel ──────────────────────────────────────────────────────
const GEN_ED_REQS = [
  { id: "WI", label: "Writing Intensive", abbr: "WI", required: 2, courseIds: ["ENG102"], color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
  { id: "QR", label: "Quantitative Reasoning", abbr: "QR", required: 2, courseIds: ["CS101", "MATH301", "PHYS201", "CHEM101", "CS201", "CS301"], color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
  { id: "SB", label: "Social & Behavioral Sciences", abbr: "SB", required: 1, courseIds: [], color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
  { id: "NS", label: "Natural Sciences", abbr: "NS", required: 2, courseIds: ["PHYS201", "BIO110", "CHEM101"], color: "#059669", bg: "#F0FDF4", border: "#BBF7D0" },
  { id: "HU", label: "Humanities", abbr: "HU", required: 1, courseIds: ["ENG102", "HIST101"], color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  { id: "AR", label: "Arts", abbr: "AR", required: 1, courseIds: [], color: "#EC4899", bg: "#FDF2F8", border: "#FBCFE8" },
  { id: "GM", label: "Global & Multicultural", abbr: "GM", required: 1, courseIds: ["HIST101"], color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  { id: "FYS", label: "First Year Seminar", abbr: "FYS", required: 1, courseIds: [], color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
];

const MAJOR_REQS = [
  {
    category: "Core Foundation", courses: [
      { code: "CS 101", name: "Intro to Computer Science", credits: 3, id: "CS101" },
      { code: "CS 201", name: "Data Structures", credits: 4, id: "CS201" },
      { code: "MATH 301", name: "Linear Algebra", credits: 3, id: "MATH301" },
    ]
  },
  {
    category: "Upper Division CS", courses: [
      { code: "CS 301", name: "Algorithms", credits: 3, id: "CS301" },
      { code: "CS 350", name: "Operating Systems", credits: 3, id: null },
      { code: "CS 401", name: "Software Engineering", credits: 3, id: null },
      { code: "CS 410", name: "Database Systems", credits: 3, id: null },
    ]
  },
  {
    category: "Science Requirements", courses: [
      { code: "PHYS 201", name: "Physics I", credits: 4, id: "PHYS201" },
      { code: "CHEM 101", name: "General Chemistry I", credits: 4, id: "CHEM101" },
    ]
  },
  {
    category: "General Electives", courses: [
      { code: "ENG 102", name: "English Composition", credits: 3, id: "ENG102" },
      { code: "HIST 101", name: "World History", credits: 3, id: "HIST101" },
      { code: "Any 300+ CS Elective", name: "", credits: 3, id: null },
    ]
  },
];

function MaraudAuditPanel({ enrolled, onClose }) {
  const [vis, setVis] = useState(false);
  const [activeSection, setActiveSection] = useState("genEd");

  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
    const fn = e => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  function close() { setVis(false); setTimeout(onClose, 320); }

  const enrolledCourses = COURSES.filter(c => enrolled.includes(c.id));
  const enrolledGenEds = enrolledCourses.flatMap(c => c.genEd);

  // Compute Gen Ed completion
  const genEdStatus = GEN_ED_REQS.map(req => {
    const completed = req.courseIds.filter(id => enrolled.includes(id)).length;
    const pct = Math.min(100, Math.round((completed / req.required) * 100));
    return { ...req, completed, pct, done: completed >= req.required };
  });
  const genEdDone = genEdStatus.filter(r => r.done).length;
  const genEdTotal = genEdStatus.length;

  // Compute Major completion
  const majorDone = MAJOR_REQS.flatMap(cat => cat.courses).filter(c => c.id && enrolled.includes(c.id)).length;
  const majorTotal = MAJOR_REQS.flatMap(cat => cat.courses).length;

  // Overall progress
  const totalDone = genEdDone + majorDone;
  const totalReqs = genEdTotal + majorTotal;
  const overallPct = Math.round((totalDone / totalReqs) * 100);

  const sectionBtn = (id, label, count, total) => (
    <button onClick={() => setActiveSection(id)}
      style={{ flex: 1, padding: "8px 4px", background: activeSection === id ? "#fff" : "transparent", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 700, color: activeSection === id ? MU.black : MU.textMuted, boxShadow: activeSection === id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {label}
      <span style={{ fontSize: 10, fontWeight: 600, color: activeSection === id ? MU.goldDark : MU.textMuted }}>{count}/{total} done</span>
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(17,17,17,0.3)", opacity: vis ? 1 : 0, transition: "opacity 0.32s", backdropFilter: "blur(2px)" }} />

      {/* Panel */}
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "clamp(340px,30vw,480px)", background: "#fff", boxShadow: "-8px 0 48px rgba(0,0,0,0.18)", zIndex: 201, transform: vis ? "translateX(0)" : "translateX(100%)", transition: "transform 0.32s cubic-bezier(0.32,0,0,1)", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',sans-serif", overflow: "hidden" }}>

        {/* Gold accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg,${MU.gold},${MU.goldDark},#E11D48)`, flexShrink: 0 }} />

        {/* Header */}
        <div style={{ background: MU.black, padding: "16px 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                {/* Cap/diploma icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2L1 6l8 4 8-4-8-4Z" fill={MU.gold} stroke={MU.gold} strokeWidth="0.5" strokeLinejoin="round" />
                  <path d="M1 6v5" stroke={MU.gold} strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M5 9.8v3.5c0 0 1.5 1.2 4 1.2s4-1.2 4-1.2V9.8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>MaraudAudit™</span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10, background: "rgba(238,177,17,0.2)", color: MU.gold, border: `1px solid rgba(238,177,17,0.4)`, letterSpacing: "0.05em" }}>BETA</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Degree Audit · CS — Computer Science</div>
            </div>
            <button onClick={close} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 7, color: "#fff", width: 30, height: 30, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
              ✕
            </button>
          </div>

          {/* Overall progress ring area */}
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 14 }}>
            {/* Circular progress */}
            <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0 }}>
              <svg width="54" height="54" viewBox="0 0 54 54" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="27" cy="27" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                <circle cx="27" cy="27" r="22" fill="none" stroke={MU.gold} strokeWidth="5"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - overallPct / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34,1.56,0.64,1)" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>{overallPct}%</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Overall Progress</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{totalDone} of {totalReqs} requirements met</div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ width: `${overallPct}%`, height: "100%", background: `linear-gradient(90deg,${MU.gold},${MU.goldDark})`, borderRadius: 4, transition: "width 0.8s cubic-bezier(0.34,1.56,0.64,1)" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Section toggle */}
        <div style={{ display: "flex", background: MU.cream, borderBottom: `1px solid ${MU.border}`, padding: "8px 12px", gap: 4, flexShrink: 0 }}>
          {sectionBtn("genEd", "Gen Ed Requirements", genEdDone, genEdTotal)}
          {sectionBtn("major", "Major Requirements", majorDone, majorTotal)}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}>

          {/* ── Gen Ed ── */}
          {activeSection === "genEd" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 11, color: MU.textMuted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
                Millersville Gen Ed Program — {genEdDone}/{genEdTotal} areas satisfied
              </div>
              {genEdStatus.map(req => {
                const completedCourses = req.courseIds.filter(id => enrolled.includes(id)).map(id => COURSES.find(c => c.id === id)).filter(Boolean);
                return (
                  <div key={req.id} style={{ background: req.done ? req.bg : "#fff", border: `1.5px solid ${req.done ? req.border : MU.border}`, borderLeft: `4px solid ${req.done ? req.color : MU.borderDark}`, borderRadius: 10, padding: "11px 13px", transition: "all 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        {/* Status icon */}
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: req.done ? req.color : MU.cream, border: `2px solid ${req.done ? req.color : MU.borderDark}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {req.done
                            ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            : <div style={{ width: 5, height: 5, borderRadius: "50%", background: MU.borderDark }}></div>
                          }
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: req.done ? req.color : MU.textPrimary, lineHeight: 1.2 }}>{req.label}</div>
                          <div style={{ fontSize: 10, color: MU.textMuted }}>{req.completed}/{req.required} course{req.required !== 1 ? "s" : ""} required</div>
                        </div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 10, background: req.done ? req.color : MU.cream, color: req.done ? "#fff" : MU.textMuted, border: `1px solid ${req.done ? req.color : MU.border}` }}>
                        {req.abbr}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 3, background: req.done ? `${req.color}30` : MU.border, borderRadius: 3, overflow: "hidden", marginBottom: req.done && completedCourses.length > 0 ? 6 : 0 }}>
                      <div style={{ width: `${req.pct}%`, height: "100%", background: req.color, borderRadius: 3, transition: "width 0.6s ease" }}></div>
                    </div>
                    {/* Completed courses chips */}
                    {completedCourses.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 5 }}>
                        {completedCourses.map(c => {
                          const cc = C(c);
                          return <span key={c.id} style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}>✓ {c.code}</span>;
                        })}
                      </div>
                    )}
                    {!req.done && (
                      <div style={{ marginTop: 6, fontSize: 10, color: MU.textMuted, fontStyle: "italic" }}>
                        {req.required - req.completed} more course{req.required - req.completed !== 1 ? "s" : ""} needed
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Major ── */}
          {activeSection === "major" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 11, color: MU.textMuted, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>
                B.S. Computer Science — {majorDone}/{majorTotal} courses completed
              </div>
              {MAJOR_REQS.map(cat => (
                <div key={cat.category}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: MU.textSecond, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 7, paddingLeft: 2, borderLeft: `3px solid ${MU.gold}`, paddingLeft: 8 }}>{cat.category}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {cat.courses.map((course, idx) => {
                      const done = course.id && enrolled.includes(course.id);
                      const inProgress = false; // could check waitlisted
                      return (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: done ? "#ECFDF5" : "#FAFAF7", border: `1px solid ${done ? "#A7F3D0" : MU.border}`, borderRadius: 9, transition: "all 0.15s" }}>
                          {/* Checkbox */}
                          <div style={{ width: 18, height: 18, borderRadius: 5, background: done ? "#10B981" : "#fff", border: `2px solid ${done ? "#10B981" : MU.borderDark}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {done && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: done ? "#065F46" : MU.textPrimary, lineHeight: 1.2 }}>
                              {course.code}{course.name ? ` — ${course.name}` : ""}
                            </div>
                            <div style={{ fontSize: 10, color: MU.textMuted, marginTop: 1 }}>{course.credits} credits</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 8, background: done ? "#D1FAE5" : MU.cream, color: done ? "#059669" : MU.textMuted, border: `1px solid ${done ? "#A7F3D0" : MU.border}`, flexShrink: 0, whiteSpace: "nowrap" }}>
                            {done ? "✓ Done" : "Needed"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ borderTop: `1px solid ${MU.border}`, padding: "12px 16px", background: MU.cream, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, color: MU.textMuted }}>Last synced: <strong style={{ color: MU.textSecond }}>Spring 2026</strong></div>
            <button onClick={close} style={{ padding: "7px 16px", background: MU.black, color: MU.gold, border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }} onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.2)"} onMouseLeave={e => e.currentTarget.style.filter = "none"}>
              Close Audit
            </button>
          </div>
        </div>
      </div>
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
  const [wishlist, setWishlist] = useState([]);
  const [sidebarMode, setSidebarMode] = useState("search");
  const [holdDismissed, setHoldDismissed] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);

  // ── CSV course loading ──
  const [overlayGone, setOverlayGone] = useState(false);   // true = overlay fully removed
  const [overlayFading, setOverlayFading] = useState(false); // true = fade-out in progress
  const [coursesError, setCoursesError] = useState(null);
  const [DEPARTMENTS, setDepartments] = useState(["All Departments"]);
  const [GEN_ED_ATTRS, setGenEdAttrs] = useState([]);

  useEffect(() => {
    const startTime = Date.now();
    loadCourses()
      .then(courses => {
        // Update the module-level COURSES ref so all helper functions work
        COURSES.length = 0;
        courses.forEach(c => COURSES.push(c));
        setDepartments(buildDepartments(courses));
        setGenEdAttrs(buildGenEdAttrs(courses));
        // Enforce a minimum 1-second extra hold before fading out
        const elapsed = Date.now() - startTime;
        const minHold = 1000;
        const remaining = Math.max(0, minHold - elapsed);
        setTimeout(() => {
          setOverlayFading(true);                          // start CSS fade-out
          setTimeout(() => setOverlayGone(true), 650);    // remove from DOM after fade
        }, remaining);
      })
      .catch(err => {
        console.error("Failed to load courses:", err);
        setCoursesError(err.message || "Unknown error");
      });
  }, []);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState([]);
  const [showAudit, setShowAudit] = useState(false);

  // Track recently viewed courses (max 6), deduplicated, most-recent first
  function viewCourse(course) {
    setSelectedCourse(course);
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== course.id);
      return [course.id, ...filtered].slice(0, 6);
    });
  }

  function toggleWishlist(courseId) {
    setWishlist(p => p.includes(courseId) ? p.filter(id => id !== courseId) : [...p, courseId]);
  }

  function pushToast(t) { setToasts(p => [...p, { ...t, id: ++_tid }]); }
  function dismissToast(id) { setToasts(p => p.filter(t => t.id !== id)); }

  function handleRegister(courseId) {
    const course = COURSES.find(c => c.id === courseId);
    if (enrolled.includes(courseId)) {
      setEnrolled(p => p.filter(id => id !== courseId));
      pushToast({ type: "success", title: `Dropped ${course.code}`, body: `${course.name} removed from your schedule.` });
      return;
    }
    const { timeConflicts, missingPrereqs } = checkConflicts(course, enrolled);
    if (timeConflicts.length > 0) { pushToast({ type: "error", title: "⛔ Time Conflict", body: `${course.code} overlaps with ${timeConflicts.map(c => c.code).join(", ")}.`, chips: timeConflicts.map(c => c.code), duration: 7000 }); return; }
    if (missingPrereqs.length > 0) { pushToast({ type: "error", title: "⛔ Missing Prerequisites", body: `Complete ${missingPrereqs.map(c => c.code).join(", ")} first.`, chips: missingPrereqs.map(c => c.code), duration: 7000 }); return; }
    const newTotal = totalCredits + course.credits;
    setEnrolled(p => [...p, courseId]);
    pushToast({ type: "success", title: `Enrolled in ${course.code}`, body: `${course.name} added to your schedule.` });
    if (newTotal >= 18) {
      setTimeout(() => pushToast({ type: "warning", title: "⚠ Credit Limit Reached", body: `You're at ${newTotal} credits. The recommended maximum is 18 per semester.`, duration: 7000 }), 600);
    } else if (newTotal >= 15) {
      setTimeout(() => pushToast({ type: "warning", title: "Approaching Credit Limit", body: `You're at ${newTotal} credits — approaching the 18-credit max.`, duration: 6000 }), 600);
    }
  }

  const enrolledCourses = COURSES.filter(c => enrolled.includes(c.id));
  const totalCredits = enrolledCourses.reduce((s, c) => s + c.credits, 0);

  // Only filter the full list when the user has actually typed something
  const filteredCourses = search.trim()
    ? COURSES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.instructor.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  // Home-state courses: recently viewed first, then pad with one-per-department picks
  const homeCourses = (() => {
    const recent = recentlyViewed.map(id => COURSES.find(c => c.id === id)).filter(Boolean);
    if (recent.length >= 6) return recent.slice(0, 6);
    // Fill remaining slots with one representative course per unique department
    const usedDepts = new Set(recent.map(c => c.department));
    const picks = [];
    for (const course of COURSES) {
      if (picks.length + recent.length >= 8) break;
      if (!usedDepts.has(course.department)) {
        picks.push(course);
        usedDepts.add(course.department);
      }
    }
    return [...recent, ...picks];
  })();

  // Ghost previews: wishlist mode shows all wishlisted non-enrolled courses; otherwise just hovered card
  const ghostIds = sidebarMode === "wishlist"
    ? wishlist.filter(id => !enrolled.includes(id))
    : (hoveredCard && !enrolled.includes(hoveredCard) ? [hoveredCard] : []);
  const ghostCourses = COURSES.filter(c => ghostIds.includes(c.id));

  const tabBtn = (tab, label) => (
    <button onClick={() => setActiveTab(tab)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", fontSize: 13, fontWeight: 600, background: activeTab === tab ? "#fff" : "transparent", color: activeTab === tab ? MU.black : "rgba(255,255,255,0.7)", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s", boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.15)" : "none" }}>
      {label}
    </button>
  );


  // ── Loading screen ──
  if (coursesError) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: MU.black, fontFamily: "'DM Sans',sans-serif", gap: 16 }}>
          <MULogo size={52} />
          <div style={{ fontSize: 16, fontWeight: 700, color: "#EF4444", marginTop: 8 }}>Failed to load course catalog</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>{coursesError}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',sans-serif", background: MU.cream, overflow: "hidden" }}>


        {/* Hold Banner */}
        {!holdDismissed && <HoldBanner onDismiss={() => setHoldDismissed(true)} />}

        {/* Header */}
        <header style={{ background: MU.black, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 24px", height: 58, boxShadow: "0 2px 10px rgba(0,0,0,0.3)", zIndex: 30, gap: 16 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
            <MULogo size={34} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.1, fontFamily: "'Playfair Display',serif" }}>Millersville University</div>
              <div style={{ fontSize: 10, color: MU.gold, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>COURSE REGISTRATION</div>
            </div>
          </div>
          {/* Tabs — centered */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.1)", borderRadius: 9, padding: 3, gap: 2 }}>
              {tabBtn("schedule", "📅 My Schedule")}
              {tabBtn("search", "🔍 Advanced Search")}
            </div>
          </div>
          {/* Semester + help */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200, justifyContent: "flex-end" }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setSemOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 13px", background: "rgba(255,255,255,0.07)", border: `1px solid rgba(238,177,17,0.35)`, borderRadius: 7, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'DM Sans',sans-serif" }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(238,177,17,0.12)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="2" width="11" height="10" rx="2" stroke={MU.gold} strokeWidth="1.3" /><path d="M4 1v2M9 1v2M1 5h11" stroke={MU.gold} strokeWidth="1.3" strokeLinecap="round" /></svg>
                {semester}
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 3.5L4.5 6L7 3.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {semOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 7px)", right: 0, background: "#fff", border: `1.5px solid ${MU.border}`, borderRadius: 9, boxShadow: "0 8px 28px rgba(0,0,0,0.14)", overflow: "hidden", zIndex: 100, minWidth: 165 }}>
                  {SEMESTERS.map(s => <button key={s} onClick={() => { setSemester(s); setSemOpen(false); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", background: s === semester ? MU.goldLight : "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: s === semester ? 700 : 500, color: s === semester ? MU.goldDark : MU.textPrimary, fontFamily: "'DM Sans',sans-serif", borderLeft: s === semester ? `3px solid ${MU.gold}` : "3px solid transparent" }} onMouseEnter={e => { if (s !== semester) e.currentTarget.style.background = MU.cream; }} onMouseLeave={e => { if (s !== semester) e.currentTarget.style.background = "transparent"; }}>{s}</button>)}
                </div>
              )}
            </div>
            {/* MaraudAudit button */}
            <button onClick={() => setShowAudit(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", background: "rgba(238,177,17,0.12)", border: `1.5px solid rgba(238,177,17,0.45)`, borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700, color: MU.gold, fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s", whiteSpace: "nowrap" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(238,177,17,0.22)"; e.currentTarget.style.boxShadow = `0 0 0 2px rgba(238,177,17,0.25)`; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(238,177,17,0.12)"; e.currentTarget.style.boxShadow = "none"; }}>
              {/* Cap icon */}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2L1 5.5l6 3.5 6-3.5L7 2Z" fill={MU.gold} strokeLinejoin="round" />
                <path d="M1 5.5v3.5" stroke={MU.gold} strokeWidth="1.2" strokeLinecap="round" />
                <path d="M3.5 8v2.5s1.2 1 3.5 1 3.5-1 3.5-1V8" stroke={MU.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              View MaraudAudit
            </button>
            {/* Help button */}
            <button style={{ width: 32, height: 32, borderRadius: "50%", background: MU.gold, border: "none", color: MU.black, fontSize: 15, fontWeight: 800, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>?</button>
          </div>
        </header>

        {/* Body: sidebar + content */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

          {/* ── Left Sidebar ── */}
          <div style={{ width: 326, flexShrink: 0, background: "#fff", borderRight: `1px solid ${MU.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Sidebar header with mode toggle */}
            <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${MU.border}`, flexShrink: 0 }}>
              {/* Mode toggle pills */}
              <div style={{ display: "flex", background: MU.cream, borderRadius: 9, padding: 3, gap: 2, marginBottom: 10 }}>
                {[["search", "🔍 Quick Search"], ["wishlist", "♥ Wishlist"]].map(([mode, label]) => (
                  <button key={mode} onClick={() => setSidebarMode(mode)}
                    style={{ flex: 1, padding: "6px 0", fontSize: 12, fontWeight: 700, background: sidebarMode === mode ? "#fff" : "transparent", color: sidebarMode === mode ? MU.black : MU.textMuted, border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s", boxShadow: sidebarMode === mode ? "0 1px 4px rgba(0,0,0,0.1)" : "none", position: "relative" }}>
                    {label}
                    {mode === "wishlist" && wishlist.length > 0 && (
                      <span style={{ position: "absolute", top: -4, right: 4, width: 16, height: 16, borderRadius: "50%", background: "#E11D48", color: "#fff", fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                        {wishlist.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {/* Search input — only in search mode */}
              {sidebarMode === "search" && (
                <div style={{ position: "relative" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><circle cx="6" cy="6" r="4.5" stroke={MU.textMuted} strokeWidth="1.3" /><path d="M9.5 9.5L12 12" stroke={MU.textMuted} strokeWidth="1.3" strokeLinecap="round" /></svg>
                  <input value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" placeholder="Search courses..." style={{ width: "100%", boxSizing: "border-box", padding: "8px 11px 8px 30px", background: MU.cream, border: `1.5px solid ${MU.border}`, borderRadius: 8, fontSize: 13, color: MU.textPrimary, fontFamily: "'DM Sans',sans-serif", outline: "none" }} onFocus={e => e.target.style.borderColor = MU.gold} onBlur={e => e.target.style.borderColor = MU.border} />
                </div>
              )}
              {/* Wishlist preview hint */}
              {sidebarMode === "wishlist" && wishlist.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#FFF1F2", borderRadius: 7, border: "1px solid #FECDD3" }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.5" stroke="#E11D48" strokeWidth="1.3" /><path d="M6 3.5v2.5l1.5 1" stroke="#E11D48" strokeWidth="1.3" strokeLinecap="round" /></svg>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#BE123C" }}>Previewing on schedule →</span>
                </div>
              )}
            </div>
            {/* Sidebar body — search cards or wishlist */}
            {sidebarMode === "search" ? (
              <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
                {search.trim() ? (
                  // ── Active search results ──
                  <>
                    {filteredCourses.length === 0 && (
                      <div style={{ textAlign: "center", padding: "32px 16px", color: MU.textMuted, fontSize: 13 }}>No courses match your search.</div>
                    )}
                    {filteredCourses.map(course => (
                      <CourseCard key={course.id} course={course} enrolled={enrolled} waitlisted={waitlisted} wishlist={wishlist}
                        onView={viewCourse} onAdd={handleRegister} onWishlist={toggleWishlist}
                        hovered={hoveredCard === course.id}
                        onHover={setHoveredCard} onHoverEnd={() => setHoveredCard(null)} />
                    ))}
                  </>
                ) : (
                  // ── Home state: recent + recommended ──
                  <>
                    {/* Section label */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "2px 2px 0", flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                        {recentlyViewed.length > 0 ? "🕑 Recently Viewed" : "✨ Recommended"}
                      </span>
                      {recentlyViewed.length > 0 && (
                        <span style={{ fontSize: 10, color: MU.textMuted, fontWeight: 500 }}>· {recentlyViewed.length} course{recentlyViewed.length !== 1 ? "s" : ""}</span>
                      )}
                      <span style={{ marginLeft: "auto", fontSize: 10, color: MU.textMuted, fontStyle: "italic" }}>Search to see all →</span>
                    </div>
                    {homeCourses.map((course, i) => (
                      <div key={course.id} style={{ position: "relative" }}>
                        {/* "Recent" badge for the first N recently-viewed items */}
                        {recentlyViewed.includes(course.id) && (
                          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 4, fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 8, background: MU.goldLight, color: MU.goldDark, border: `1px solid ${MU.goldMid}`, pointerEvents: "none" }}>
                            Recent
                          </div>
                        )}
                        <CourseCard course={course} enrolled={enrolled} waitlisted={waitlisted} wishlist={wishlist}
                          onView={viewCourse} onAdd={handleRegister} onWishlist={toggleWishlist}
                          hovered={hoveredCard === course.id}
                          onHover={setHoveredCard} onHoverEnd={() => setHoveredCard(null)} />
                      </div>
                    ))}
                    {/* Prompt to search for more */}
                    <div style={{ textAlign: "center", padding: "12px 8px 4px", fontSize: 11, color: MU.textMuted, lineHeight: 1.5 }}>
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ verticalAlign: "middle", marginRight: 4 }}><circle cx="5.5" cy="5.5" r="4" stroke={MU.textMuted} strokeWidth="1.3" /><path d="M9 9L11.5 11.5" stroke={MU.textMuted} strokeWidth="1.3" strokeLinecap="round" /></svg>
                      Type to search {COURSES.length.toLocaleString()} courses
                    </div>
                  </>
                )}
              </div>
            ) : (
              <WishlistPanel wishlist={wishlist} enrolled={enrolled} waitlisted={waitlisted}
                onRemove={id => setWishlist(p => p.filter(i => i !== id))}
                onAdd={handleRegister}
                onView={setSelectedCourse} />
            )}
          </div>

          {/* ── Right Content ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

            {/* ══ Schedule Tab ══ */}
            {activeTab === "schedule" && (
              <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Schedule heading + magic wand */}
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexShrink: 0 }}>
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: MU.black, margin: "0 0 3px", letterSpacing: "-0.03em", fontFamily: "'Playfair Display',serif" }}>My Schedule</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, color: MU.textMuted }}>{semester}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 9px", borderRadius: 20, background: totalCredits >= 18 ? "#FEF2F2" : totalCredits >= 15 ? "#FFFBEB" : MU.cream, color: totalCredits >= 18 ? "#DC2626" : totalCredits >= 15 ? "#D97706" : MU.textSecond, border: `1px solid ${totalCredits >= 18 ? "#FECACA" : totalCredits >= 15 ? "#FDE68A" : MU.border}` }}>
                        {totalCredits >= 18 ? "⚠ " : ""}{totalCredits} / 18 cr
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setShowGenerator(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 3px 12px rgba(124,58,237,0.35)" }} onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"} onMouseLeave={e => e.currentTarget.style.filter = "none"}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M2.5 12.5L8.5 6.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
                      <path d="M8.5 6.5l1.4-3.3L13 2l-1.4 3.3L8.5 6.5Z" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" fill="rgba(255,255,255,0.2)" />
                      <circle cx="2" cy="6.5" r="0.8" fill="#fff" />
                      <circle cx="4.5" cy="11" r="0.8" fill="#fff" />
                      <circle cx="11.5" cy="8.5" r="0.7" fill="#fff" />
                    </svg>
                    Generate Schedules
                  </button>
                </div>

                {/* Live Gen Ed status bar */}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", flexShrink: 0, padding: "6px 10px", background: "#fff", borderRadius: 9, border: `1px solid ${MU.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: MU.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", alignSelf: "center", marginRight: 2 }}>Gen Ed</span>
                  {GEN_ED_REQS.map(req => {
                    const done = req.courseIds.filter(id => enrolled.includes(id)).length >= req.required;
                    return (
                      <div key={req.id} title={`${req.label} — ${req.courseIds.filter(id => enrolled.includes(id)).length}/${req.required} completed`}
                        style={{ display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 20, background: done ? req.bg : MU.cream, border: `1px solid ${done ? req.border : MU.border}`, fontSize: 10, fontWeight: 700, color: done ? req.color : MU.textMuted, cursor: "default", transition: "all 0.2s" }}>
                        {done ? "✓" : "○"} {req.abbr}
                      </div>
                    );
                  })}
                </div>

                {/* Calendar grid */}
                <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${MU.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ height: 3, background: `linear-gradient(90deg,${MU.gold},${MU.goldDark})` }} />
                  {/* Day headers */}
                  <div style={{ display: "grid", gridTemplateColumns: "72px repeat(5,1fr)", borderBottom: `1.5px solid ${MU.border}`, background: MU.cream }}>
                    <div style={{ padding: "10px 0" }} />
                    {DAYS.map(d => <div key={d} style={{ padding: "10px 8px", textAlign: "center", fontSize: 11, fontWeight: 800, color: MU.textSecond, letterSpacing: "0.06em", textTransform: "uppercase", borderLeft: `1px solid ${MU.border}` }}>{d}</div>)}
                  </div>
                  {/* Grid body */}
                  <div style={{ position: "relative", display: "grid", gridTemplateColumns: "72px repeat(5,1fr)" }}>
                    {HOURS.map((h, i) => (
                      <div key={h} style={{ display: "contents" }}>
                        <div style={{ height: HOUR_HEIGHT, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: "4px 10px 0 0", fontSize: 10, color: MU.textMuted, fontWeight: 700, borderTop: i > 0 ? `1px solid ${MU.border}` : "none" }}>{fmtHour(h)}</div>
                        {DAY_KEYS.map(day => <div key={day} style={{ height: HOUR_HEIGHT, borderLeft: `1px solid ${MU.border}`, borderTop: i > 0 ? `1px solid ${MU.border}` : "none", background: i % 2 === 0 ? "#fff" : "#FDFDFB" }} />)}
                      </div>
                    ))}

                    {/* Enrolled blocks */}
                    {enrolledCourses.map(course =>
                      course.schedule.days.map(day => {
                        const col = DAY_KEYS.indexOf(day); if (col === -1) return null;
                        const top = timeFrac(course.schedule.start) * HOUR_HEIGHT;
                        const h = (timeFrac(course.schedule.end) - timeFrac(course.schedule.start)) * HOUR_HEIGHT - 4;
                        const c = C(course);
                        const isWL = !!waitlisted[course.id];
                        const wlBg = "repeating-linear-gradient(45deg,#FFFBEB 0px,#FFFBEB 8px,#FEF3C7 8px,#FEF3C7 16px)";
                        return (
                          <div key={`${course.id}-${day}`} onClick={() => setSelectedCourse(course)}
                            style={{ position: "absolute", top, height: h, left: `calc(72px + ${col} * ((100% - 72px) / 5) + 3px)`, width: `calc((100% - 72px) / 5 - 6px)`, background: isWL ? wlBg : c.bg, border: isWL ? "2px dashed #F59E0B" : `1.5px solid ${c.border}`, borderLeft: isWL ? "4px dashed #D97706" : `3px solid ${c.accent}`, borderRadius: 8, padding: "6px 8px", cursor: "pointer", zIndex: 2, overflow: "hidden", opacity: isWL ? 0.72 : 1, boxShadow: isWL ? "0 0 0 3px rgba(245,158,11,0.12)" : "0 1px 3px rgba(0,0,0,0.06)", transition: "all 0.18s" }}
                            onMouseEnter={e => { if (!isWL) { e.currentTarget.style.boxShadow = `0 3px 12px ${c.border}`; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.zIndex = 10; } }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = isWL ? "0 0 0 2px rgba(245,158,11,0.15)" : "0 1px 3px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.zIndex = 2; }}>
                            {isWL && <div style={{ position: "absolute", top: 0, right: 0, background: "#D97706", color: "#fff", fontSize: 7, fontWeight: 800, padding: "2px 5px", borderBottomLeftRadius: 4, whiteSpace: "nowrap" }}>⏳ #{waitlisted[course.id]}</div>}
                            <div style={{ fontWeight: 800, fontSize: 11, color: isWL ? "#92400E" : c.text, lineHeight: 1.2 }}>{course.code}</div>
                            <div style={{ fontSize: 10, color: isWL ? "#B45309" : c.text, opacity: 0.85, marginTop: 1, lineHeight: 1.25 }}>{course.name}</div>
                            {isWL && <div style={{ fontSize: 8, fontWeight: 800, color: "#92400E", background: "rgba(217,119,6,0.15)", borderRadius: 3, padding: "1px 4px", display: "inline-block", marginTop: 2 }}>Waitlist: #{waitlisted[course.id]}</div>}
                            <div style={{ marginTop: 4, fontSize: 9, color: isWL ? "#92400E" : c.text, opacity: 0.7, display: "flex", flexDirection: "column", gap: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 7c0-1.5 1.3-2 3-2s3 .5 3 2" stroke="currentColor" strokeWidth="1" /><circle cx="4" cy="3" r="1.5" stroke="currentColor" strokeWidth="1" /></svg>
                                {course.instructor}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1.5h6a.5.5 0 01.5.5v5a.5.5 0 01-.5.5H1a.5.5 0 01-.5-.5V2A.5.5 0 011 1.5Z" stroke="currentColor" strokeWidth="1" /></svg>
                                {course.room}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* Ghost previews — wishlisted or hovered non-enrolled courses */}
                    {ghostCourses.map(ghostCourse => {
                      const { timeConflicts: ghostTC } = checkConflicts(ghostCourse, enrolled);
                      const ghostConflict = ghostTC.length > 0;
                      return ghostCourse.schedule.days.map(day => {
                        const col = DAY_KEYS.indexOf(day); if (col === -1) return null;
                        const c = C(ghostCourse);
                        const top = timeFrac(ghostCourse.schedule.start) * HOUR_HEIGHT;
                        const h = (timeFrac(ghostCourse.schedule.end) - timeFrac(ghostCourse.schedule.start)) * HOUR_HEIGHT - 4;
                        const isWishlistMode = sidebarMode === "wishlist";
                        return (
                          <div key={`ghost-${ghostCourse.id}-${day}`} onClick={() => setSelectedCourse(ghostCourse)}
                            style={{ position: "absolute", top, height: h, left: `calc(72px + ${col} * ((100% - 72px) / 5) + 3px)`, width: `calc((100% - 72px) / 5 - 6px)`, background: ghostConflict ? "rgba(254,242,242,0.88)" : `${c.bg}DD`, border: `2px dashed ${ghostConflict ? "#EF4444" : c.accent}`, borderRadius: 8, padding: "6px 8px", zIndex: 3, cursor: "pointer", animation: isWishlistMode ? "wishlistPulse 2.5s ease-in-out infinite" : "ghostPulse 1.5s ease-in-out infinite" }}>
                            {isWishlistMode && (
                              <div style={{ position: "absolute", top: 0, right: 0, background: "#E11D48", color: "#fff", fontSize: 7, fontWeight: 800, padding: "2px 5px", borderBottomLeftRadius: 4, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 2 }}>
                                <svg width="7" height="7" viewBox="0 0 7 7" fill="#fff"><path d="M3.5 6S1 4.2 1 2.8a1.8 1.8 0 0 1 2.5-1.6A1.8 1.8 0 0 1 6 2.8C6 4.2 3.5 6 3.5 6Z" /></svg>
                                Wishlist
                              </div>
                            )}
                            <div style={{ fontWeight: 800, fontSize: 11, color: ghostConflict ? "#DC2626" : c.text, lineHeight: 1.2, paddingRight: isWishlistMode ? 30 : 0 }}>{ghostCourse.code}</div>
                            <div style={{ fontSize: 9, color: ghostConflict ? "#EF4444" : c.text, opacity: 0.8, marginTop: 1 }}>{ghostConflict ? "⚠ Conflict" : "Preview"}</div>
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══ Search Tab ══ */}
            {activeTab === "search" && (
              <div style={{ flex: 1, padding: "20px 24px", overflow: "hidden", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ flexShrink: 0 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: MU.black, margin: "0 0 3px", letterSpacing: "-0.03em", fontFamily: "'Playfair Display',serif" }}>Course Search</h1>
                  <p style={{ margin: 0, fontSize: 13, color: MU.textMuted }}>{semester} — Filter by department, name, number, or gen ed</p>
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <AdvancedSearch enrolled={enrolled} waitlisted={waitlisted} onRegister={handleRegister} onView={setSelectedCourse} wishlist={wishlist} onWishlist={toggleWishlist} departments={DEPARTMENTS} genEdAttrs={GEN_ED_ATTRS} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCourse && <SlideOver course={selectedCourse} enrolled={enrolled} onClose={() => setSelectedCourse(null)} onRegister={handleRegister} />}
      {showGenerator && <ScheduleGeneratorPage enrolled={enrolled} waitlisted={waitlisted} semester={semester} onClose={() => setShowGenerator(false)} />}
      {showAudit && <MaraudAuditPanel enrolled={enrolled} onClose={() => setShowAudit(false)} />}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* ── Loading overlay (fixed; fades out over app) ── */}
      {!overlayGone && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: MU.black, fontFamily: "'DM Sans',sans-serif", gap: 20,
          opacity: overlayFading ? 0 : 1,
          transition: overlayFading ? "opacity 0.65s ease" : "none",
          pointerEvents: overlayFading ? "none" : "all",
        }}>
          <MULogo size={56} />
          <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display',serif", letterSpacing: "-0.02em" }}>Millersville University</div>
          <div style={{ fontSize: 11, color: MU.gold, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: -10 }}>Course Registration</div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, border: "3px solid rgba(238,177,17,0.2)", borderTopColor: MU.gold, borderRadius: "50%", animation: "mu-spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{overlayFading ? "Ready!" : "Loading course catalog…"}</div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        @keyframes mu-spin{to{transform:rotate(360deg)}}
        input::placeholder { color: #9E9782; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4CEBC; border-radius: 4px; }
        @keyframes ghostPulse { 0%,100%{opacity:0.5} 50%{opacity:0.95} }
        @keyframes wishlistPulse { 0%,100%{opacity:0.65;transform:none} 50%{opacity:1;transform:translateY(-1px)} }
        @keyframes conflictBorder { 0%,100%{box-shadow:0 0 0 1.5px #FECACA,0 1px 3px rgba(0,0,0,0.04)} 50%{box-shadow:0 0 0 3px rgba(239,68,68,0.35),0 2px 8px rgba(239,68,68,0.15)} }
      `}</style>
    </>
  );
}
