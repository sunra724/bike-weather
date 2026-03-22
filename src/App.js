import React, { useState, useEffect } from "react";

const VERDICT = {
  GO:      { label: "자전거 타세요", emoji: "🚲", color: "#4ade80", bg: "#052e16", desc: "7~10시 강수량이 적어요. 쾌적한 출근 예상!", sub: "GO" },
  CAUTION: { label: "살짝 맞을 수도", emoji: "🌂", color: "#fbbf24", bg: "#1c1400", desc: "약한 비가 올 수 있어요. 방수재킷 챙기면 OK.", sub: "MAYBE" },
  NO_GO:   { label: "걸어서 가세요", emoji: "🚶", color: "#f87171", bg: "#2d0000", desc: "비가 꽤 와요. 자전거는 미끄럽고 힘들어요.", sub: "WALK" },
  LOADING: { label: "날씨 확인 중…", emoji: "🌫️", color: "#94a3b8", bg: "#0f172a", desc: "잠시만 기다려 주세요.", sub: "..." },
  ERROR:   { label: "오류 발생", emoji: "❓", color: "#94a3b8", bg: "#1e293b", desc: "새로고침 해주세요.", sub: "ERR" },
};

const WMO_ICONS = {
  0:"☀️",1:"🌤️",2:"⛅",3:"☁️",45:"🌫️",48:"🌫️",
  51:"🌦️",53:"🌦️",55:"🌧️",61:"🌧️",63:"🌧️",65:"🌧️",
  80:"🌦️",81:"🌦️",82:"🌧️",95:"⛈️",96:"⛈️",99:"⛈️",
};

const DAEGU_LAT = 35.8714;
const DAEGU_LON = 128.6014;

function RainBar({ value, max = 5 }) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value < 0.3 ? "#4ade80" : value < 1.5 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ background: "#1e293b", borderRadius: 4, height: 10, overflow: "hidden", flex: 1 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 1s ease" }} />
    </div>
  );
}

export default function App() {
  const [state, setState] = useState("LOADING");
  const [data, setData] = useState(null);
  const [thresh, setThresh] = useState({ go: 0.3, noGo: 1.5 });
  const [showSettings, setShowSettings] = useState(false);

  function getVerdict(total, go, noGo) {
    if (total <= go) return "GO";
    if (total <= noGo) return "CAUTION";
    return "NO_GO";
  }

  async function fetchWeather(lat, lon) {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,weathercode&timezone=Asia/Seoul&forecast_days=1`
    );
    const json = await res.json();
    const today = new Date().toISOString().slice(0, 10);
    const rows = [7, 8, 9, 10].map(h => {
      const idx = json.hourly.time.indexOf(`${today}T${String(h).padStart(2, "0")}:00`);
      return { hour: h, rain: idx >= 0 ? json.hourly.precipitation[idx] : 0, code: idx >= 0 ? json.hourly.weathercode[idx] : 0 };
    });
    const total = rows.reduce((s, r) => s + r.rain, 0);
    return { rows, total };
  }

  async function load() {
    setState("LOADING");
    try {
      const weather = await fetchWeather(DAEGU_LAT, DAEGU_LON);
      setData(weather);
      setState(getVerdict(weather.total, thresh.go, thresh.noGo));
    } catch {
      setState("ERROR");
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { if (data) setState(getVerdict(data.total, thresh.go, thresh.noGo)); }, [thresh, data]);

  const v = VERDICT[state] ?? VERDICT.LOADING;
  const now = new Date();
  const timeStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });

  return (
    <div style={{ minHeight: "100vh", background: "#020817", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px 16px", fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;600;700&family=Space+Mono:wght@400;700&display=swap');
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=range] { accent-color: #4ade80; width: 100%; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, animation: "slideUp 0.5s ease" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ color: "#475569", fontSize: 12, fontFamily: "Space Mono", letterSpacing: 2, textTransform: "uppercase" }}>출근 날씨 판정기</p>
            <p style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>{dateStr} · {timeStr}</p>
            <p style={{ color: "#334155", fontSize: 13, marginTop: 2 }}>📍 대구</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={load} style={{ background: "none", border: "1px solid #1e293b", borderRadius: 8, color: "#475569", fontSize: 18, padding: "6px 12px", cursor: "pointer" }}>↻</button>
            <button onClick={() => setShowSettings(s => !s)} style={{ background: "none", border: "1px solid #1e293b", borderRadius: 8, color: "#475569", fontSize: 18, padding: "6px 12px", cursor: "pointer" }}>{showSettings ? "✕" : "⚙"}</button>
          </div>
        </div>

        {/* 설정 */}
        {showSettings && (
          <div style={{ background: "#0f172a", borderRadius: 14, padding: 18, marginBottom: 16, border: "1px solid #1e293b" }}>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 14, fontFamily: "Space Mono", letterSpacing: 2 }}>강수 임계값 (7~10시 합계)</p>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#4ade80", fontSize: 14 }}>🚲 자전거 OK 이하</span>
                <span style={{ color: "#4ade80", fontSize: 14, fontFamily: "Space Mono" }}>{thresh.go.toFixed(1)}mm</span>
              </div>
              <input type="range" min={0} max={3} step={0.1} value={thresh.go} onChange={e => setThresh(t => ({ ...t, go: +e.target.value }))} />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#f87171", fontSize: 14 }}>🚶 걷기 권장 초과</span>
                <span style={{ color: "#f87171", fontSize: 14, fontFamily: "Space Mono" }}>{thresh.noGo.toFixed(1)}mm</span>
              </div>
              <input type="range" min={0.5} max={5} step={0.1} value={thresh.noGo} onChange={e => setThresh(t => ({ ...t, noGo: +e.target.value }))} />
            </div>
          </div>
        )}

        {/* 판정 카드 */}
        <div style={{ background: v.bg, border: `1px solid ${v.color}33`, borderRadius: 22, padding: 32, marginBottom: 16 }}>
          <p style={{ fontFamily: "Space Mono", fontSize: 11, letterSpacing: 4, color: v.color, opacity: 0.6, marginBottom: 12, textTransform: "uppercase" }}>{v.sub}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
            <span style={{ fontSize: 60 }}>{v.emoji}</span>
            <div>
              <p style={{ fontSize: 30, fontWeight: 700, color: v.color, lineHeight: 1.2 }}>{v.label}</p>
              {state === "LOADING" && <p style={{ fontSize: 14, color: "#475569", marginTop: 6, animation: "pulse 1.5s infinite" }}>날씨 불러오는 중…</p>}
            </div>
          </div>
          {v.desc && <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.7 }}>{v.desc}</p>}
          {data && (
            <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(0,0,0,0.3)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, color: "#64748b" }}>7~10시 예상 합계</span>
              <span style={{ fontFamily: "Space Mono", fontSize: 26, fontWeight: 700, color: v.color }}>{data.total.toFixed(1)}<span style={{ fontSize: 14, marginLeft: 3 }}>mm</span></span>
            </div>
          )}
        </div>

        {/* 시간대별 */}
        {data && (
          <div style={{ background: "#0f172a", borderRadius: 18, padding: 20, marginBottom: 16, border: "1px solid #1e293b" }}>
            <p style={{ fontFamily: "Space Mono", fontSize: 11, letterSpacing: 3, color: "#475569", marginBottom: 14, textTransform: "uppercase" }}>시간대별 강수량</p>
            {data.rows.map(r => (
              <div key={r.hour} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
                <span style={{ fontFamily: "monospace", fontSize: 15, color: "#64748b", width: 36 }}>{r.hour}시</span>
                <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{WMO_ICONS[r.code] ?? "🌡️"}</span>
                <RainBar value={r.rain} />
                <span style={{ fontFamily: "monospace", fontSize: 15, color: r.rain > 0 ? "#fbbf24" : "#475569", width: 52, textAlign: "right" }}>{r.rain.toFixed(1)}mm</span>
              </div>
            ))}
          </div>
        )}

        {/* 뱃지 */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["🚲 2.5km", "⏱ ~10분", "7~10시 기준"].map(t => (
            <span key={t} style={{ fontSize: 13, color: "#475569", background: "#0f172a", padding: "6px 14px", borderRadius: 20, border: "1px solid #1e293b" }}>{t}</span>
          ))}
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "#334155", marginTop: 12 }}>날씨: Open-Meteo.com · 대구 고정</p>
      </div>
    </div>
  );
}