// ─── CSV Course Loader ────────────────────────────────────────────────────────
// Fetches MU_Courses.csv from /public, parses it, and generates synthetic
// schedule data (days/times/rooms/instructors) deterministically per course.

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Simple seeded pseudo-random number generator (mulberry32). */
function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turn a string into a stable numeric seed. */
function strSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Pick a random item from an array using a given rng. */
function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Static pools for schedule generation ─────────────────────────────────────

const INSTRUCTORS = [
  "Dr. Smith", "Dr. Johnson", "Prof. Williams", "Dr. Brown", "Dr. Davis",
  "Prof. Martinez", "Dr. Patel", "Dr. Nguyen", "Prof. Garcia", "Dr. Wilson",
  "Dr. Anderson", "Prof. Taylor", "Dr. Thomas", "Dr. Jackson", "Prof. White",
  "Dr. Harris", "Dr. Martin", "Prof. Thompson", "Dr. Moore", "Dr. Lee",
  "Prof. Clark", "Dr. Lewis", "Dr. Robinson", "Prof. Walker", "Dr. Hall",
  "Dr. Allen", "Prof. Young", "Dr. Scott", "Dr. King", "Prof. Wright",
];

const BUILDINGS = [
  "Caputo Hall", "Roddy Science Center", "Stayer Hall", "Dilworth Building",
  "Byerly Hall", "Stayer Arts Center", "Boyer Hall", "McNairy Library",
  "Osburn Hall", "Gordinier Hall", "Biemesderfer Executive Center",
];

// Schedule patterns: [days, startHour, durationHrs]
const PATTERNS = [
  { days: ["mon", "wed", "fri"], start: 8.0,  end: 9.0  },
  { days: ["mon", "wed", "fri"], start: 9.0,  end: 10.0 },
  { days: ["mon", "wed", "fri"], start: 10.0, end: 11.0 },
  { days: ["mon", "wed", "fri"], start: 11.0, end: 12.0 },
  { days: ["mon", "wed", "fri"], start: 13.0, end: 14.0 },
  { days: ["mon", "wed", "fri"], start: 14.0, end: 15.0 },
  { days: ["tue", "thu"],        start: 8.0,  end: 9.5  },
  { days: ["tue", "thu"],        start: 9.75, end: 11.25 },
  { days: ["tue", "thu"],        start: 11.0, end: 12.5 },
  { days: ["tue", "thu"],        start: 12.5, end: 14.0 },
  { days: ["tue", "thu"],        start: 14.0, end: 15.5 },
  { days: ["tue", "thu"],        start: 15.5, end: 17.0 },
  { days: ["mon", "wed"],        start: 9.0,  end: 10.5 },
  { days: ["mon", "wed"],        start: 14.0, end: 15.5 },
  { days: ["fri"],               start: 9.0,  end: 12.0 },
];

function fmtTime(h) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const suffix = hr >= 12 ? "PM" : "AM";
  const displayHr = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  const minStr = min === 0 ? "00" : String(min).padStart(2, "0");
  return `${displayHr}:${minStr} ${suffix}`;
}

function makeDisplayTime(pattern) {
  const dayMap = { mon: "M", tue: "T", wed: "W", thu: "Th", fri: "F" };
  const dayStr = pattern.days.map(d => dayMap[d] || d).join("");
  return `${dayStr} ${fmtTime(pattern.start)}–${fmtTime(pattern.end)}`;
}

// ── CSV parser ────────────────────────────────────────────────────────────────

/**
 * Ultra-simple RFC-4180 CSV parser.
 * Handles quoted fields (including embedded commas and newlines).
 */
function parseCSV(text) {
  const rows = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row = [];
    // Parse one row
    while (i < len) {
      let field = "";
      if (text[i] === '"') {
        // Quoted field
        i++; // skip opening quote
        while (i < len) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            field += text[i++];
          }
        }
      } else {
        // Unquoted field
        while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
          field += text[i++];
        }
      }
      row.push(field.trim());
      // Check delimiter
      if (i < len && text[i] === ',') {
        i++;
      } else {
        // End of row — consume \r\n or \n
        if (i < len && text[i] === '\r') i++;
        if (i < len && text[i] === '\n') i++;
        break;
      }
    }
    if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
      rows.push(row);
    }
  }
  return rows;
}

// ── Gen-Ed label mapping ──────────────────────────────────────────────────────

// Map CSV label fragments → canonical display names used in the app.
const GEN_ED_MAP = {
  "G1":                              "Arts & Humanities (G1)",
  "G2":                              "Science & Math (G2)",
  "G3":                              "Social & Behavioral Sciences (G3)",
  "Writing (W)":                     "Writing Intensive (W)",
  "Advanced Writing (AW)":           "Advanced Writing (AW)",
  "Lab (L)":                         "Lab Science (L)",
  "Diversity (D)":                   "Diversity (D)",
  "Perspectives (P)":                "Perspectives (P)",
  "Quantitative Reasoning (QR)":     "Quantitative Reasoning (QR)",
};

function parseGenEd(raw) {
  if (!raw || raw === "-") return [];
  const out = [];
  for (const [fragment, canonical] of Object.entries(GEN_ED_MAP)) {
    if (raw.includes(fragment) && !out.includes(canonical)) {
      out.push(canonical);
    }
  }
  return out;
}

// ── Color palette cycle ───────────────────────────────────────────────────────

const COLOR_PALETTES = [
  { bg:"#EEF2FF", border:"#C7D2FE", text:"#3730A3", accent:"#4F46E5", chip:"#6366F1" },
  { bg:"#FFF7ED", border:"#FED7AA", text:"#9A3412", accent:"#EA580C", chip:"#F97316" },
  { bg:"#F5F3FF", border:"#DDD6FE", text:"#5B21B6", accent:"#7C3AED", chip:"#8B5CF6" },
  { bg:"#ECFDF5", border:"#A7F3D0", text:"#065F46", accent:"#059669", chip:"#10B981" },
  { bg:"#FFF0F6", border:"#FBCFE8", text:"#831843", accent:"#DB2777", chip:"#EC4899" },
  { bg:"#FFFBEB", border:"#FDE68A", text:"#78350F", accent:"#D97706", chip:"#F59E0B" },
  { bg:"#F0FDF4", border:"#BBF7D0", text:"#14532D", accent:"#16A34A", chip:"#22C55E" },
  { bg:"#FFF5F0", border:"#FECBA1", text:"#7C2D12", accent:"#EA580C", chip:"#F97316" },
  { bg:"#F8FAFC", border:"#CBD5E1", text:"#475569", accent:"#64748B", chip:"#94A3B8" },
  { bg:"#FDF2F8", border:"#F9A8D4", text:"#831843", accent:"#BE185D", chip:"#EC4899" },
  { bg:"#F0F9FF", border:"#BAE6FD", text:"#0C4A6E", accent:"#0284C7", chip:"#38BDF8" },
  { bg:"#FAFAF9", border:"#D6D3D1", text:"#44403C", accent:"#78716C", chip:"#A8A29E" },
];

// ── Main loader ───────────────────────────────────────────────────────────────

export async function loadCourses() {
  const response = await fetch("/MU_Courses.csv");
  if (!response.ok) throw new Error(`Failed to load courses CSV: ${response.status}`);
  const text = await response.text();

  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  // Header: "Course Title","Credits","Subject code","Course Number","Academic Level","Course Description","General Education Labels","Requisites"
  const header = rows[0];
  const idxTitle  = header.findIndex(h => h.toLowerCase().includes("course title"));
  const idxCredits= header.findIndex(h => h.toLowerCase().includes("credits"));
  const idxSubj   = header.findIndex(h => h.toLowerCase().includes("subject code"));
  const idxNum    = header.findIndex(h => h.toLowerCase().includes("course number"));
  const idxLevel  = header.findIndex(h => h.toLowerCase().includes("academic level"));
  const idxDesc   = header.findIndex(h => h.toLowerCase().includes("description"));
  const idxGenEd  = header.findIndex(h => h.toLowerCase().includes("general education"));
  const idxReq    = header.findIndex(h => h.toLowerCase().includes("requisites"));

  const courses = [];
  let colorIdx = 0;

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 3) continue;

    const subj   = (row[idxSubj]  || "").trim();
    const num    = (row[idxNum]   || "").trim();
    const title  = (row[idxTitle] || "").trim();
    const level  = (row[idxLevel] || "").trim();

    if (!subj || !num) continue;

    // Skip courses with no real title
    const displayTitle = (title && title !== "-") ? title : `${subj} ${num}`;

    const code   = `${subj} ${num}`;
    const id     = `${subj}${num}`.replace(/\s+/g, "");

    // Credits — CSV often has "-" meaning "varies"; default to 3
    let credits = 3;
    const rawCredits = (row[idxCredits] || "").trim();
    if (rawCredits && rawCredits !== "-") {
      const parsed = parseInt(rawCredits, 10);
      if (!isNaN(parsed)) credits = parsed;
    }

    const description  = (row[idxDesc]   || "").trim().replace(/\s+/g, " ") || "No description available.";
    const rawGenEd     = (row[idxGenEd]  || "").trim();
    const rawReq       = (row[idxReq]    || "").trim();
    const hasRequisites = rawReq && rawReq !== "-" && rawReq.toUpperCase() !== "NO";
    const prerequisites = hasRequisites ? "See course description for prereqs." : "No prerequisites required.";
    const genEd        = parseGenEd(rawGenEd);

    // Format: derive online/in-person from level & description heuristics
    const format = description.toLowerCase().includes("online") ? "100% Online" : "In-Person";

    // Deterministic synthetic schedule
    const rng     = seededRng(strSeed(id));
    const pattern = PATTERNS[Math.floor(rng() * PATTERNS.length)];
    const room    = `${pick(BUILDINGS, rng)} ${Math.floor(rng() * 400 + 100)}`;
    const instructor = pick(INSTRUCTORS, rng);
    const totalSeats = [20, 25, 28, 30, 35, 40][Math.floor(rng() * 6)];
    const seats = Math.floor(rng() * (totalSeats + 1));

    // Color palette — cycle through deterministically by subject
    const palette = COLOR_PALETTES[strSeed(subj) % COLOR_PALETTES.length];

    // Deterministic 5-digit CRN — separate seed so other synthetic fields are unchanged
    const crnRng = seededRng(strSeed(id + "_crn"));
    const crn = String(10000 + Math.floor(crnRng() * 90000));

    courses.push({
      id,
      code,
      name: displayTitle,
      department: subj, // raw subject code; we'll build dept display names dynamically
      genEd,
      format,
      instructor,
      credits,
      seats,
      totalSeats,
      schedule: { days: pattern.days, start: pattern.start, end: pattern.end },
      room,
      displayTime: makeDisplayTime(pattern),
      prereqIds: [],  // we don't have cross-ref data; leave as empty
      labs: null,
      description,
      prerequisites,
      instructorBio: `${instructor} is a faculty member in the ${subj} department at Millersville University.`,
      level,
      crn,
      _color: palette,
    });

    colorIdx++;
  }

  return courses;
}

/** Build a sorted unique list of "Subject code" values for the department filter. */
export function buildDepartments(courses) {
  const codes = [...new Set(courses.map(c => c.department))].sort();
  return ["All Departments", ...codes];
}

/** Build a sorted unique list of gen-ed labels present in the loaded courses. */
export function buildGenEdAttrs(courses) {
  const set = new Set();
  courses.forEach(c => c.genEd.forEach(g => set.add(g)));
  return [...set].sort();
}
