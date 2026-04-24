import { readFileSync, writeFileSync } from 'fs';

let c = readFileSync('src/App.jsx', 'utf8');

// Find the anchor: the opening of the global style block that we want to replace
// It was corrupted with JSX embedded inside it. We need to find from the style tag
// that has '* { box-sizing' and replace everything from there to end of file.
const anchor = `      <style>{\`\n        * { box-sizing: border-box; }`;
const idx = c.indexOf(anchor);

if (idx === -1) {
  // Try alternate — the script may have already partially mangled it
  // Find from the last </> close of the return
  console.log('anchor not found, searching file tail...');
  // Show last 2000 chars to debug
  console.log(c.slice(-2000));
  process.exit(1);
}

const before = c.substring(0, idx);

const overlay = `      {/* ── Loading overlay (fixed; fades out over app) ── */}
      {!overlayGone && (
        <div style={{
          position:"fixed",inset:0,zIndex:9999,
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          background:MU.black,fontFamily:"'DM Sans',sans-serif",gap:20,
          opacity: overlayFading ? 0 : 1,
          transition: overlayFading ? "opacity 0.65s ease" : "none",
          pointerEvents: overlayFading ? "none" : "all",
        }}>
          <MULogo size={56}/>
          <div style={{fontSize:18,fontWeight:800,color:"#fff",fontFamily:"'Playfair Display',serif",letterSpacing:"-0.02em"}}>Millersville University</div>
          <div style={{fontSize:11,color:MU.gold,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginTop:-10}}>Course Registration</div>
          <div style={{marginTop:16,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <div style={{width:40,height:40,border:"3px solid rgba(238,177,17,0.2)",borderTopColor:MU.gold,borderRadius:"50%",animation:"mu-spin 0.8s linear infinite"}}/>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>{overlayFading ? "Ready!" : "Loading course catalog\u2026"}</div>
          </div>
        </div>
      )}

      <style>{\`
        * { box-sizing: border-box; }
        @keyframes mu-spin{to{transform:rotate(360deg)}}
        input::placeholder { color: #9E9782; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4CEBC; border-radius: 4px; }
        @keyframes ghostPulse { 0%,100%{opacity:0.5} 50%{opacity:0.95} }
        @keyframes wishlistPulse { 0%,100%{opacity:0.65;transform:none} 50%{opacity:1;transform:translateY(-1px)} }
      \`}</style>
    </>
  );
}
`;

writeFileSync('src/App.jsx', before + overlay);
console.log('Done. Total lines:', (before + overlay).split('\n').length);
