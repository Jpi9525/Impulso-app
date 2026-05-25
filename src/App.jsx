import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Check, Inbox as InboxIcon, Calendar as CalendarIcon, Users, Settings as SettingsIcon,
  Mic, Plus, Trash2, Clock, Tag, ChevronLeft, ChevronRight, ChevronRight as Arrow, X, Star,
  Crown, Bell, Home, Search, Edit2, ListChecks, Sparkles, Send, RefreshCw, Link2, LogOut,
  Shield, CheckCircle2, Circle, CalendarPlus, Repeat, UserCheck, LayoutGrid, ClipboardList, Mail
} from "lucide-react";
import { supabase } from "./supabase";
import * as MentorAPI from "./mentorApi";

/* =========================================================================
   IMPULSO — Prototipo funcional · web + móvil (responsive)
   Hábitos · tareas · bandeja de pendientes · mentores
   Nivel 2: multiusuario real con Supabase (auth + base de datos + tiempo real).
   ========================================================================= */

/* ------------------------------- TEMAS ----------------------------------- */
// Colores de marca = placeholders. REEMPLAZAR POR HEX OFICIAL con el manual.
const THEMES = {
  profesional: { name: "Profesional", desc: "Azul corporativo, limpio y confiable",
    swatch: ["#1F4E8C", "#5B6B7B", "#FFFFFF"],
    t: { bg: "#EEF1F5", surface: "#FFFFFF", surfaceAlt: "#F4F6F9", text: "#16202E",
      textMuted: "#5B6B7B", faint: "#9AA7B4", primary: "#1F4E8C", primaryFg: "#FFFFFF",
      accent: "#2E7BD6", border: "#E1E6EC", danger: "#D6453D", success: "#2E9E6B",
      radius: "16px", shadow: "0 6px 20px rgba(22,32,46,.08)" } },
  oscuro: { name: "Oscuro", desc: "Modo noche, bajo brillo, foco total",
    swatch: ["#0E1420", "#3B82F6", "#E5E9F0"],
    t: { bg: "#0B0F17", surface: "#161C28", surfaceAlt: "#1E2533", text: "#E5E9F0",
      textMuted: "#9AA6B8", faint: "#5C6678", primary: "#3B82F6", primaryFg: "#FFFFFF",
      accent: "#60A5FA", border: "#27303F", danger: "#F0635A", success: "#37C98C",
      radius: "16px", shadow: "0 8px 24px rgba(0,0,0,.45)" } },
  minimal: { name: "Minimalista", desc: "Blanco, mucho aire, casi monocromo",
    swatch: ["#111111", "#FAFAF8", "#D8D5CC"],
    t: { bg: "#FAFAF8", surface: "#FFFFFF", surfaceAlt: "#F2F1EC", text: "#141414",
      textMuted: "#6B6B66", faint: "#A8A69C", primary: "#141414", primaryFg: "#FFFFFF",
      accent: "#4B4B47", border: "#E6E4DC", danger: "#B23A33", success: "#3C7A57",
      radius: "10px", shadow: "0 2px 8px rgba(0,0,0,.06)" } },
  calido: { name: "Cálido", desc: "Tonos tierra, acogedor y motivador",
    swatch: ["#C0612E", "#FBF3E7", "#7A5C3E"],
    t: { bg: "#FBF3E7", surface: "#FFFBF3", surfaceAlt: "#F4E7D2", text: "#3A2A1A",
      textMuted: "#7A5C3E", faint: "#B79C7C", primary: "#C0612E", primaryFg: "#FFFBF3",
      accent: "#E08A3C", border: "#EAD9BE", danger: "#C04A2E", success: "#5E8C4A",
      radius: "20px", shadow: "0 6px 18px rgba(120,86,40,.14)" } },
  vibrante: { name: "Vibrante", desc: "Enérgico y juvenil, alto contraste",
    swatch: ["#5B3DF5", "#FF5A7A", "#F4F3FF"],
    t: { bg: "#F4F3FF", surface: "#FFFFFF", surfaceAlt: "#ECEAFF", text: "#1A1330",
      textMuted: "#6B6486", faint: "#A6A0C2", primary: "#5B3DF5", primaryFg: "#FFFFFF",
      accent: "#FF5A7A", border: "#E4E0FB", danger: "#F0455F", success: "#1FB57A",
      radius: "22px", shadow: "0 10px 28px rgba(91,61,245,.16)" } },
};

// Color exclusivo para tareas con mentor — fuera de la paleta de la app.
const MENTOR_COLOR = "#D4006A";

const DEFAULT_CLASSIFICATIONS = [
  { id: "c_personal", name: "Personal", color: "#2E7BD6", isDefault: true, mentorId: null,
    auto: ["llamar", "familia", "amigo", "personal", "cumpleaños", "banco"] },
  { id: "c_salud", name: "Salud", color: "#2E9E6B", isDefault: false, mentorId: null,
    auto: ["medico", "médico", "gym", "ejercicio", "correr", "agua", "dormir", "dentista", "salud"] },
  { id: "c_laboral", name: "Laboral", color: "#E0843C", isDefault: false, mentorId: null,
    auto: ["reunion", "reunión", "trabajo", "informe", "correo", "cliente", "proyecto", "junta"] },
  { id: "c_hogar", name: "Hogar", color: "#9B59B6", isDefault: false, mentorId: null,
    auto: ["limpiar", "lavar", "cocina", "casa", "arreglar", "basura", "jardin", "jardín"] },
  { id: "c_compras", name: "Compras", color: "#D6453D", isDefault: false, mentorId: null,
    auto: ["comprar", "jabon", "jabón", "super", "mercado", "tienda", "pedir", "pedido"] },
  { id: "c_habito", name: "Hábito", color: "#1F9FB5", isDefault: false, mentorId: null,
    auto: ["meditar", "leer", "habito", "hábito", "rutina", "estirar"] },
];
const GOOGLE_CLASS = { id: "c_google", name: "Google", color: "#4285F4", isDefault: false, locked: true, mentorId: null, auto: [] };

const SUGGESTED_HABITS = ["Beber 2 litros de agua", "Leer 10 minutos", "Caminar 20 minutos",
  "Meditar 5 minutos", "Estirar al despertar", "Escribir 3 logros del día"];
const GOALS = ["Mi salud", "Mi productividad", "Mi hogar", "Mis estudios", "Mi bienestar mental"];
const MENTOR_OPTIONS = ["Bien hecho", "A mejorar", "Repetir tarea", "Subir dificultad"];
const WEEKDAYS = [["L", 1], ["M", 2], ["X", 3], ["J", 4], ["V", 5], ["S", 6], ["D", 0]];
const RECURRENCE = [
  { k: "none", label: "Una vez" }, { k: "daily", label: "Diario" },
  { k: "weekly", label: "Cada semana" }, { k: "custom", label: "Días específicos" },
];

/* -------------------------------- UTILS ---------------------------------- */
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const todayISO = () => new Date().toISOString().slice(0, 10);
const WD = (iso) => new Date(iso + "T00:00:00").getDay();
const fmtDate = (iso) => {
  if (!iso) return "Sin fecha";
  return new Date(iso + "T00:00:00").toLocaleDateString("es-MX",
    { weekday: "short", day: "numeric", month: "short" });
};
const addDays = (iso, n) => {
  const d = new Date((iso || todayISO()) + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const nextWeekend = () => {
  const day = new Date().getDay();
  return addDays(todayISO(), (6 - day + 7) % 7 || 7);
};
function autoClassify(text, classifications) {
  const lc = (text || "").toLowerCase();
  for (const c of classifications)
    if ((c.auto || []).some((k) => k && lc.includes(k.toLowerCase()))) return c.id;
  const def = classifications.find((c) => c.isDefault);
  return def ? def.id : (classifications[0] && classifications[0].id) || null;
}
// ¿la tarea ocurre en la fecha iso? (considera recurrencia)
function occursOn(task, iso) {
  if (!task.date) return false;
  const rec = task.recurrence || "none";
  if (rec === "none") return task.date === iso;
  if (iso < task.date) return false;
  if (rec === "daily") return true;
  if (rec === "weekly") return WD(iso) === WD(task.date);
  if (rec === "custom") return (task.recurrenceDays || []).includes(WD(iso));
  return false;
}
const isDoneOn = (task, iso) => (task.completedDates || []).includes(iso);
// estado mostrado de una tarea en un día
function dayStatus(task, iso) {
  if (isDoneOn(task, iso)) return "completada";
  if (task.status === "en progreso") return "en progreso";
  return "pendiente";
}
// mentor asociado a una tarea (asignada / supervisada / por clasificación)
function taskMentor(task, state) {
  if (task.source === "mentor") return { name: task.assignedBy || "Mentor", kind: "assigned" };
  if (task.watcherMentorId) {
    const m = (state.mentors || []).find((x) => x.id === task.watcherMentorId);
    if (m) return { name: m.name, kind: "watch" };
  }
  const c = (state.classifications || []).find((x) => x.id === task.classificationId);
  if (c && c.mentorId) {
    const m = (state.mentors || []).find((x) => x.id === c.mentorId);
    if (m) return { name: m.name, kind: "class" };
  }
  return null;
}
// interpretar comando de voz tipo asistente
function parseVoice(raw) {
  let s = (raw || "").trim();
  const lc = s.toLowerCase();
  const target = /\bhoy\b/.test(lc) ? "today" : "inbox";
  s = s.replace(/^(oye |hey |ok )?(impulso[,: ]+)?/i, "");
  s = s.replace(/^(agr[eé]ga(le|me)?|agregar|a[ñn]ade|a[ñn]adir|recu[eé]rda(me)?|crea(r)?|nueva tarea|nota|anota|pon(le|me)?)\s+/i, "");
  s = s.replace(/\s+(a|en)\s+(la\s+)?(lista de\s+)?pendientes?\b.*/i, "");
  s = s.replace(/\s+(a|en)\s+(la\s+)?bandeja\b.*/i, "");
  s = s.replace(/\s+(a|en)\s+(mis\s+)?tareas?\b.*/i, "");
  s = s.replace(/\s+para hoy\b.*/i, "").replace(/\s+a impulso\b.*/i, "").trim();
  if (s) s = s.charAt(0).toUpperCase() + s.slice(1);
  return { title: s, target };
}

/* ----------------------------- PERSISTENCIA ------------------------------ */
// El estado personal de cada usuario (hábitos, tareas, bandeja, ajustes, tema)
// se guarda como un documento JSON en la tabla `app_state` de Supabase:
// una fila por usuario, aislada del resto por Row Level Security.
async function loadState(userId) {
  const { data, error } = await supabase
    .from("app_state").select("data").eq("user_id", userId).maybeSingle();
  if (error) { console.error("loadState:", error.message); return null; }
  return data ? data.data : null;
}
async function saveState(userId, s) {
  const { error } = await supabase.from("app_state")
    .upsert({ user_id: userId, data: s, updated_at: new Date().toISOString() });
  if (error) console.error("saveState:", error.message);
}

/* =============================== UI BÁSICA =============================== */
function Btn({ children, onClick, t, variant = "primary", style, disabled, full }) {
  const base = { border: "none", borderRadius: t.radius, padding: "13px 18px", fontWeight: 700,
    fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center",
    justifyContent: "center", gap: 8, transition: "transform .08s", fontFamily: "inherit" };
  const v = {
    primary: { background: t.primary, color: t.primaryFg },
    ghost: { background: "transparent", color: t.primary, border: `1.5px solid ${t.border}` },
    soft: { background: t.surfaceAlt, color: t.text },
    danger: { background: "transparent", color: t.danger, border: `1.5px solid ${t.danger}40` },
  }[variant];
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseDown={(e) => !disabled && (e.currentTarget.style.transform = "scale(.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      style={{ ...base, ...v, ...style }}>{children}</button>
  );
}
function Modal({ open, onClose, t, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)",
      zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: t.surface, width: "100%",
        borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", overflowY: "auto",
        padding: "8px 18px 24px" }}>
        <div style={{ width: 38, height: 4, background: t.border, borderRadius: 4, margin: "8px auto 14px" }} />
        {title && <h3 style={{ margin: "0 0 14px", fontSize: 18, color: t.text, fontFamily: "var(--display)" }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
}
function Field({ label, t, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: t.textMuted, textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</span>
      <div style={{ marginTop: 6 }}>{children}</div>
    </label>
  );
}
const inputStyle = (t) => ({ width: "100%", boxSizing: "border-box", padding: "12px 14px",
  borderRadius: 12, border: `1.5px solid ${t.border}`, background: t.surfaceAlt, color: t.text,
  fontSize: 15, fontFamily: "inherit", outline: "none" });
const iconBtn = (t, color) => ({ background: "transparent", border: "none", cursor: "pointer",
  padding: 6, color: color || t.textMuted, display: "flex", borderRadius: 8 });
function Pill({ t, text, color }) {
  return <span style={{ fontSize: 10, fontWeight: 700, background: (color || t.textMuted) + "1F",
    color: color || t.textMuted, padding: "2px 7px", borderRadius: 6 }}>{text}</span>;
}
function Empty({ t, text }) {
  return <div style={{ textAlign: "center", padding: "34px 20px", color: t.faint, fontSize: 13 }}>{text}</div>;
}
function MentorBadge({ name, t, kind }) {
  const labels = { assigned: "asignó", watch: "supervisa", class: "categoría" };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: MENTOR_COLOR + "1A",
      color: MENTOR_COLOR, fontSize: 10, fontWeight: 800, padding: "2px 7px 2px 3px", borderRadius: 10 }}>
      <span style={{ width: 15, height: 15, borderRadius: "50%", background: MENTOR_COLOR, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>
        {(name || "?")[0].toUpperCase()}
      </span>
      {name}{kind ? ` · ${labels[kind] || ""}` : ""}
    </span>
  );
}

/* ============================ ENTRADA POR VOZ ============================ */
function useVoice() {
  const [supported] = useState(() =>
    typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const start = useCallback((onResult, onError) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { onError && onError("no-soportado"); return; }
    const r = new SR();
    r.lang = "es-MX"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => onResult(e.results[0][0].transcript);
    r.onerror = (e) => { setListening(false); onError && onError(e.error); };
    r.onend = () => setListening(false);
    recRef.current = r; setListening(true); r.start();
  }, []);
  const stop = useCallback(() => { try { recRef.current && recRef.current.stop(); } catch (e) {} setListening(false); }, []);
  return { supported, listening, start, stop };
}

/* ====================== GESTOR DE CLASIFICACIONES ======================== */
function ClassificationManager({ classifications, setClassifications, t, mentors = [] }) {
  const [editing, setEditing] = useState(null);
  const PALETTE = ["#2E7BD6", "#2E9E6B", "#E0843C", "#9B59B6", "#D6453D", "#1F9FB5", "#E0398A", "#6B7280"];
  const save = (c) => {
    setClassifications((prev) => {
      const exists = prev.find((x) => x.id === c.id);
      let next = exists ? prev.map((x) => (x.id === c.id ? c : x)) : [...prev, c];
      if (c.isDefault) next = next.map((x) => ({ ...x, isDefault: x.id === c.id }));
      return next;
    });
    setEditing(null);
  };
  const remove = (id) => setClassifications((prev) => {
    const left = prev.filter((x) => x.id !== id);
    if (!left.some((x) => x.isDefault) && left[0]) left[0].isDefault = true;
    return [...left];
  });
  return (
    <div>
      {classifications.map((c) => {
        const m = mentors.find((x) => x.id === c.mentorId && x.status === "active");
        return (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            background: t.surfaceAlt, borderRadius: 12, marginBottom: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: c.color, transform: "rotate(45deg)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>
                {c.name}{c.isDefault && <span style={{ fontSize: 10, color: t.primary }}> · predefinida</span>}
                {c.locked && <span style={{ fontSize: 10, color: t.faint }}> · sincronizada</span>}
              </div>
              <div style={{ fontSize: 11, color: t.faint }}>
                {m ? `Mentor: ${m.name}` : (c.auto || []).length ? "Auto: " + c.auto.slice(0, 3).join(", ") : "Sin palabras clave"}
              </div>
            </div>
            {!c.locked && (<>
              <button onClick={() => setEditing(c)} style={iconBtn(t)}><Edit2 size={15} /></button>
              <button onClick={() => remove(c.id)} style={iconBtn(t, t.danger)}><Trash2 size={15} /></button>
            </>)}
          </div>
        );
      })}
      <Btn t={t} variant="ghost" full onClick={() => setEditing({ id: "c_" + uid(), name: "",
        color: PALETTE[0], auto: [], isDefault: false, mentorId: null })}>
        <Plus size={16} /> Añadir clasificación
      </Btn>
      {editing && <ClassEditor cls={editing} palette={PALETTE} t={t} mentors={mentors}
        onCancel={() => setEditing(null)} onSave={save} />}
    </div>
  );
}
function ClassEditor({ cls, palette, t, mentors, onCancel, onSave }) {
  const [name, setName] = useState(cls.name);
  const [color, setColor] = useState(cls.color);
  const [auto, setAuto] = useState((cls.auto || []).join(", "));
  const [isDefault, setIsDefault] = useState(!!cls.isDefault);
  const [mentorId, setMentorId] = useState(cls.mentorId || null);
  const active = (mentors || []).filter((m) => m.status === "active");
  return (
    <Modal open onClose={onCancel} t={t} title={cls.name ? "Editar clasificación" : "Nueva clasificación"}>
      <Field label="Nombre" t={t}>
        <input style={inputStyle(t)} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Finanzas" />
      </Field>
      <Field label="Color" t={t}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {palette.map((p) => (
            <button key={p} onClick={() => setColor(p)} style={{ width: 30, height: 30, borderRadius: 8,
              background: p, cursor: "pointer", border: color === p ? `3px solid ${t.text}` : "2px solid transparent" }} />
          ))}
        </div>
      </Field>
      <Field label="Palabras clave para auto-clasificar (coma)" t={t}>
        <input style={inputStyle(t)} value={auto} onChange={(e) => setAuto(e.target.value)} placeholder="comprar, mercado" />
      </Field>
      {active.length > 0 && (
        <Field label="Mentor de esta clasificación (opcional)" t={t}>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button onClick={() => setMentorId(null)} style={chip(t, !mentorId)}>Ninguno</button>
            {active.map((m) => (
              <button key={m.id} onClick={() => setMentorId(m.id)} style={chip(t, mentorId === m.id, MENTOR_COLOR)}>{m.name}</button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: t.faint, marginTop: 5 }}>
            Todas las tareas de esta clasificación mostrarán la marca del mentor.
          </div>
        </Field>
      )}
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, color: t.text, fontSize: 14 }}>
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        Usar como clasificación predeterminada
      </label>
      <div style={{ display: "flex", gap: 10 }}>
        <Btn t={t} variant="soft" full onClick={onCancel}>Cancelar</Btn>
        <Btn t={t} full disabled={!name.trim()} onClick={() => onSave({ ...cls, name: name.trim(), color,
          auto: auto.split(",").map((s) => s.trim()).filter(Boolean), isDefault, mentorId })}>Guardar</Btn>
      </div>
    </Modal>
  );
}
const chip = (t, active, accent) => ({ padding: "7px 12px", borderRadius: 999, cursor: "pointer",
  fontSize: 12, fontWeight: 700, border: `1.5px solid ${active ? (accent || t.primary) : t.border}`,
  background: active ? (accent || t.primary) : t.surfaceAlt, color: active ? "#fff" : t.textMuted });

/* ================================ DIAMANTE =============================== */
function Diamond({ size = 64, t }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "inline-block" }}>
      <rect x="22" y="22" width="56" height="56" rx="10" transform="rotate(45 50 50)" fill={t.primary} />
      <path d="M38 50 L46 60 L64 40" stroke={t.primaryFg} strokeWidth="8" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ============================== ONBOARDING =============================== */
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [theme, setTheme] = useState("profesional");
  const [authMethod, setAuthMethod] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState(null);
  const [picked, setPicked] = useState([]);
  const [custom, setCustom] = useState("");
  const [reminder, setReminder] = useState("08:00");
  const [classifications, setClassifications] = useState(DEFAULT_CLASSIFICATIONS.map((c) => ({ ...c })));
  const t = THEMES[theme].t;
  const togglePick = (h) => setPicked((p) => p.includes(h) ? p.filter((x) => x !== h) : p.length < 3 ? [...p, h] : p);

  const finish = () => {
    const habits = [...picked, ...(custom.trim() ? [custom.trim()] : [])];
    const tasks = habits.map((h) => ({
      id: uid(), title: h, classificationId: autoClassify(h, classifications),
      date: todayISO(), time: reminder, isHabit: true, status: "pendiente",
      recurrence: "daily", recurrenceDays: [], subtasks: [], completedDates: [],
      createdAt: Date.now(), source: "onboarding", watcherMentorId: null,
    }));
    onDone({
      onboarded: true, theme, classifications,
      profile: { name: name || "Tú", email: email || `${authMethod || "demo"}@impulso.app`,
        authMethod: authMethod || "demo", goal, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      tasks, notifications: { habitReminders: true, inboxDaily: true, inboxAge: true, voiceAssistant: true },
      subscription: { plan: "free", status: "active" }, mentors: [], mentees: [], googleConnected: false,
    });
  };

  const wrap = { fontFamily: "var(--body)", background: t.bg, minHeight: "100%", color: t.text,
    padding: "26px 22px 32px", boxSizing: "border-box" };
  const H = ({ children }) => <h2 style={{ fontFamily: "var(--display)", fontSize: 24, margin: "0 0 6px" }}>{children}</h2>;
  const Sub = ({ children }) => <p style={{ color: t.textMuted, margin: "0 0 20px", fontSize: 14 }}>{children}</p>;
  const Dots = () => (
    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ height: 4, flex: 1, borderRadius: 4, background: i <= step ? t.primary : t.border }} />
      ))}
    </div>
  );

  if (step === 0) return (
    <div style={wrap}><Dots />
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Diamond size={86} t={t} />
        <h1 style={{ fontFamily: "var(--display)", fontSize: 40, margin: "20px 0 4px", letterSpacing: -1 }}>Impulso</h1>
        <p style={{ color: t.textMuted, fontSize: 15 }}>Pequeños pasos, gran impulso.</p>
        <p style={{ color: t.text, fontSize: 14, marginTop: 24, lineHeight: 1.6 }}>
          Organiza hábitos y tareas, captura pendientes por voz y avanza con el apoyo de un mentor.
          Lo dejamos listo en menos de 60 segundos.
        </p>
      </div>
      <Btn t={t} full onClick={() => setStep(1)} style={{ marginTop: 30 }}>Empezar <Arrow size={18} /></Btn>
    </div>
  );

  if (step === 1) return (
    <div style={wrap}><Dots /><H>Elige el estilo de tu app</H>
      <Sub>Puedes cambiarlo cuando quieras desde Ajustes.</Sub>
      {Object.entries(THEMES).map(([key, th]) => (
        <button key={key} onClick={() => setTheme(key)} style={{ display: "flex", alignItems: "center",
          gap: 12, width: "100%", textAlign: "left", padding: 12, marginBottom: 10, borderRadius: 14,
          cursor: "pointer", background: th.t.surface, border: `2px solid ${theme === key ? t.primary : t.border}` }}>
          <div style={{ display: "flex", gap: 4 }}>
            {th.swatch.map((s, i) => <span key={i} style={{ width: 22, height: 36, borderRadius: 5,
              background: s, border: `1px solid ${th.t.border}` }} />)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: th.t.text }}>{th.name}</div>
            <div style={{ fontSize: 12, color: th.t.textMuted }}>{th.desc}</div>
          </div>
          {theme === key && <Check size={20} color={t.primary} />}
        </button>
      ))}
      <Btn t={t} full onClick={() => setStep(2)} style={{ marginTop: 8 }}>Continuar</Btn>
    </div>
  );

  if (step === 2) return (
    <div style={wrap}><Dots /><H>Crea tu cuenta</H>
      <Sub>Tu identidad se guarda separada de tus hábitos.</Sub>
      {[{ k: "google", label: "Continuar con Google", bg: "#fff", fg: "#222", bd: t.border },
        { k: "facebook", label: "Continuar con Facebook", bg: "#1877F2", fg: "#fff", bd: "#1877F2" }].map((o) => (
        <button key={o.k} onClick={() => setAuthMethod(o.k)} style={{ width: "100%", padding: 13,
          borderRadius: 12, marginBottom: 10, cursor: "pointer", background: o.bg, color: o.fg,
          border: `1.5px solid ${authMethod === o.k ? t.primary : o.bd}`, fontWeight: 700, fontSize: 14 }}>
          {o.label}</button>
      ))}
      <div style={{ textAlign: "center", color: t.faint, fontSize: 12, margin: "8px 0" }}>— o con tu correo —</div>
      <Field label="Nombre" t={t}>
        <input style={inputStyle(t)} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
      </Field>
      <Field label="Correo (recibirás un enlace mágico)" t={t}>
        <input style={inputStyle(t)} value={email}
          onChange={(e) => { setEmail(e.target.value); setAuthMethod("email"); }} placeholder="tu@correo.com" />
      </Field>
      <Btn t={t} full disabled={!authMethod && !email} onClick={() => setStep(3)}>Continuar</Btn>
    </div>
  );

  if (step === 3) return (
    <div style={wrap}><Dots /><H>¿Qué quieres impulsar?</H><Sub>Elige tu meta principal.</Sub>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {GOALS.map((g) => (
          <button key={g} onClick={() => setGoal(g)} style={chip(t, goal === g)}>{g}</button>
        ))}
      </div>
      <h3 style={{ fontFamily: "var(--display)", fontSize: 16, margin: "0 0 4px" }}>Tus clasificaciones</h3>
      <p style={{ color: t.textMuted, fontSize: 13, margin: "0 0 12px" }}>
        Edita, añade o elimina las categorías que la app asignará automáticamente según el texto de la tarea.
      </p>
      <ClassificationManager classifications={classifications} setClassifications={setClassifications} t={t} />
      <Btn t={t} full disabled={!goal} onClick={() => setStep(4)} style={{ marginTop: 14 }}>Continuar</Btn>
    </div>
  );

  if (step === 4) return (
    <div style={wrap}><Dots /><H>Elige 1 a 3 hábitos</H><Sub>O crea el tuyo. Empieza pequeño.</Sub>
      {SUGGESTED_HABITS.map((h) => (
        <button key={h} onClick={() => togglePick(h)} style={{ display: "flex", alignItems: "center",
          gap: 10, width: "100%", padding: 12, marginBottom: 8, borderRadius: 12, cursor: "pointer",
          textAlign: "left", background: t.surface, border: `1.5px solid ${picked.includes(h) ? t.primary : t.border}` }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center",
            justifyContent: "center", background: picked.includes(h) ? t.primary : "transparent",
            border: `1.5px solid ${picked.includes(h) ? t.primary : t.border}` }}>
            {picked.includes(h) && <Check size={14} color={t.primaryFg} />}</span>
          <span style={{ color: t.text, fontWeight: 600, fontSize: 14 }}>{h}</span>
        </button>
      ))}
      <Field label="Crear hábito propio (opcional)" t={t}>
        <input style={inputStyle(t)} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Ej. Tocar guitarra 10 min" />
      </Field>
      <Field label="Recordatorio diario" t={t}>
        <input type="time" style={inputStyle(t)} value={reminder} onChange={(e) => setReminder(e.target.value)} />
      </Field>
      <Btn t={t} full disabled={!picked.length && !custom.trim()} onClick={() => setStep(5)}>Casi listo</Btn>
    </div>
  );

  return (
    <div style={wrap}><Dots />
      <div style={{ textAlign: "center", marginTop: 18 }}>
        <Sparkles size={54} color={t.primary} /><H>¡Todo listo, {name || "campeón"}!</H>
        <Sub>Completa tu primer check para arrancar con impulso.</Sub>
      </div>
      <div style={{ background: t.surface, borderRadius: t.radius, padding: 16, boxShadow: t.shadow }}>
        {[...picked, ...(custom.trim() ? [custom.trim()] : [])].slice(0, 3).map((h) => (
          <div key={h} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
            <CheckCircle2 size={20} color={t.success} />
            <span style={{ color: t.text, fontSize: 14 }}>{h}</span>
          </div>
        ))}
      </div>
      <Btn t={t} full onClick={finish} style={{ marginTop: 22 }}>
        <Check size={18} /> Completar primer check y entrar
      </Btn>
    </div>
  );
}

/* ============================== APP RAÍZ ================================= */
// Pantalla de carga
function Splash({ msg }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center",
      minHeight: "100vh", background: "#1f2530" }}>
      <span style={{ color: "#aaa", fontFamily: "sans-serif" }}>{msg || "Cargando…"}</span>
    </div>
  );
}

// Pantalla de autenticación real (Supabase Auth)
function AuthScreen() {
  const t = THEMES.profesional.t;
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!email.trim() || pass.length < 6) {
      setErr("Escribe un correo y una contraseña de al menos 6 caracteres.");
      return;
    }
    setBusy(true); setErr("");
    const fn = mode === "login"
      ? supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
      : supabase.auth.signUp({ email: email.trim(), password: pass });
    const { error } = await fn;
    setBusy(false);
    if (error) setErr(error.message);
  };

  const css = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
    :root{--body:'Plus Jakarta Sans',system-ui,sans-serif;--display:'Fraunces',Georgia,serif;}
    *{box-sizing:border-box;} body{margin:0;}`;

  return (
    <><style>{css}</style>
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "var(--body)", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 380, background: t.surface, borderRadius: 22,
        padding: 28, boxShadow: t.shadow, textAlign: "center" }}>
        <Diamond size={64} t={t} />
        <h1 style={{ fontFamily: "var(--display)", fontSize: 32, margin: "14px 0 2px" }}>Impulso</h1>
        <p style={{ color: t.textMuted, fontSize: 14, marginTop: 0 }}>
          {mode === "login" ? "Entra a tu cuenta." : "Crea tu cuenta."}
        </p>
        <div style={{ marginTop: 16, textAlign: "left" }}>
          <input style={inputStyle(t)} value={email} type="email"
            onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
          <div style={{ height: 10 }} />
          <input style={inputStyle(t)} value={pass} type="password"
            onChange={(e) => setPass(e.target.value)} placeholder="contraseña (mín. 6)"
            onKeyDown={(e) => e.key === "Enter" && submit()} />
          <Btn t={t} full disabled={busy} onClick={submit} style={{ marginTop: 12 }}>
            {busy ? "Procesando…" : mode === "login" ? "Entrar" : "Crear cuenta"}
          </Btn>
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: t.primary,
              fontWeight: 700, fontSize: 13, marginTop: 12, width: "100%" }}>
            {mode === "login" ? "¿No tienes cuenta? Crear una" : "Ya tengo cuenta, entrar"}
          </button>
        </div>
        {err && <p style={{ color: t.danger, fontSize: 12, marginTop: 10 }}>{err}</p>}
      </div>
    </div></>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <Splash />;
  if (!session) return <AuthScreen />;
  return <MainApp key={session.user.id} session={session} />;
}

function MainApp({ session }) {
  const user = session.user;
  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("hoy");
  const [mentorships, setMentorships] = useState([]);
  const [sharedTasks, setSharedTasks] = useState([]);

  // cargar el estado personal del usuario
  useEffect(() => {
    let alive = true;
    loadState(user.id).then((s) => { if (alive) { setState(s); setLoaded(true); } });
    return () => { alive = false; };
  }, [user.id]);

  // guardar el estado personal (con un pequeño retraso para no escribir en cada tecla)
  useEffect(() => {
    if (!loaded || !state) return;
    const id = setTimeout(() => saveState(user.id, state), 400);
    return () => clearTimeout(id);
  }, [state, loaded, user.id]);

  // traer mentorías + tareas compartidas
  const refreshMentor = useCallback(async () => {
    try {
      const [ms, ts] = await Promise.all([
        MentorAPI.listMentorships(), MentorAPI.listSharedTasks(),
      ]);
      setMentorships(ms); setSharedTasks(ts);
    } catch (e) { console.error("refreshMentor:", e.message); }
  }, []);
  useEffect(() => { refreshMentor(); }, [refreshMentor]);

  // tiempo real: refrescar cuando cambian mentorías o tareas compartidas
  useEffect(() => {
    const ch = supabase.channel("impulso-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "mentorships" }, refreshMentor)
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_tasks" }, refreshMentor)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refreshMentor]);

  const css = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
    :root{--body:'Plus Jakarta Sans',system-ui,sans-serif;--display:'Fraunces',Georgia,serif;}
    *{-webkit-tap-highlight-color:transparent;box-sizing:border-box;}
    body{margin:0;}
    .imp-page::-webkit-scrollbar{width:0;}
    .imp-shell{width:100%;max-width:480px;height:100vh;height:100dvh;display:flex;flex-direction:column;position:relative;overflow:hidden;}
    @media(min-width:520px){.imp-shell{height:92vh;max-height:880px;border-radius:26px;box-shadow:0 24px 60px rgba(0,0,0,.28);}}`;

  if (!loaded) return (<><style>{css}</style><Splash msg="Sincronizando tu cuenta…" /></>);

  if (!state || !state.onboarded) return (<><style>{css}</style>
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh",
      background: "#1f2530" }}>
      <div className="imp-shell" style={{ background: "#fff", overflowY: "auto" }}>
        <Onboarding onDone={(s) => setState(s)} />
      </div></div></>);

  const t = THEMES[state.theme || "profesional"].t;
  const patch = (p) => setState((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) }));
  const myName = (state.profile && state.profile.name) || (user.email || "Tú");
  const assignedToMe = sharedTasks.filter((x) => x.owner_id === user.id);

  const toggleShared = async (taskId, done) => {
    setSharedTasks((ts) => ts.map((x) => (x.id === taskId ? { ...x, done } : x)));
    try { await MentorAPI.updateSharedTask(taskId, { done }); }
    catch (e) { console.error(e.message); refreshMentor(); }
  };

  const screens = {
    hoy: <Hoy state={state} patch={patch} t={t} go={setTab}
      assignedToMe={assignedToMe} onToggleShared={toggleShared} />,
    inbox: <InboxScreen state={state} patch={patch} t={t} />,
    cal: <CalendarScreen state={state} patch={patch} t={t} />,
    mentores: <MentoresScreen state={state} t={t} user={user} myName={myName}
      mentorships={mentorships} sharedTasks={sharedTasks} refresh={refreshMentor} />,
    ajustes: <Ajustes state={state} patch={patch} t={t} reset={() => supabase.auth.signOut()} />,
  };
  const nav = [
    { k: "hoy", label: "Hoy", Icon: Home }, { k: "inbox", label: "Inbox", Icon: InboxIcon },
    { k: "cal", label: "Calendario", Icon: CalendarIcon }, { k: "mentores", label: "Mentores", Icon: Users },
    { k: "ajustes", label: "Más", Icon: SettingsIcon },
  ];
  return (<><style>{css}</style>
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh",
      background: t.bg, fontFamily: "var(--body)" }}>
      <div className="imp-shell" style={{ background: t.bg, color: t.text }}>
        <div className="imp-page" style={{ flex: 1, overflowY: "auto" }}>{screens[tab]}</div>
        <nav style={{ display: "flex", background: t.surface, borderTop: `1px solid ${t.border}`, padding: "6px 4px 8px" }}>
          {nav.map(({ k, label, Icon }) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex: 1, background: "none", border: "none",
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              color: tab === k ? t.primary : t.faint, padding: "6px 0" }}>
              <Icon size={21} /><span style={{ fontSize: 10, fontWeight: 700 }}>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div></>);
}

/* -------------------------------- HEADER --------------------------------- */
function Header({ title, t, subtitle, right }) {
  return (
    <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <h1 style={{ fontFamily: "var(--display)", fontSize: 26, margin: 0, color: t.text }}>{title}</h1>
        {subtitle && <p style={{ margin: "2px 0 0", color: t.textMuted, fontSize: 13 }}>{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

/* ================================== HOY ================================== */
function Hoy({ state, patch, t, go, assignedToMe = [], onToggleShared }) {
  const [editor, setEditor] = useState(null);
  const [mode, setMode] = useState("hoy");
  const [voiceMsg, setVoiceMsg] = useState("");
  const voice = useVoice();
  const today = todayISO();
  const cls = (id) => state.classifications.find((c) => c.id === id) || GOOGLE_CLASS;

  const todays = state.tasks.filter((x) => occursOn(x, today));
  const done = todays.filter((x) => isDoneOn(x, today)).length;
  const pct = todays.length ? Math.round((done / todays.length) * 100) : 0;
  const inboxCount = state.tasks.filter((x) => !x.date).length;
  const ownTasks = todays;

  // marcar/desmarcar tarea en un día + sincronizar subtareas
  const toggleDone = (task, iso) => patch((s) => ({
    tasks: s.tasks.map((x) => {
      if (x.id !== task.id) return x;
      const has = (x.completedDates || []).includes(iso);
      const dates = has ? x.completedDates.filter((d) => d !== iso) : [...(x.completedDates || []), iso];
      const subtasks = (x.subtasks || []).map((su) => ({ ...su, done: !has }));
      return { ...x, completedDates: dates, subtasks, status: has ? "pendiente" : x.status };
    }),
  }));

  const captureVoice = () => {
    setVoiceMsg("");
    voice.start(
      (txt) => {
        const { title, target } = parseVoice(txt);
        if (!title) { setVoiceMsg("No entendí, intenta de nuevo."); return; }
        patch((s) => ({
          tasks: [...s.tasks, {
            id: uid(), title, classificationId: autoClassify(title, s.classifications),
            date: target === "today" ? today : null, time: "", isHabit: false, status: "pendiente",
            recurrence: "none", recurrenceDays: [], subtasks: [], completedDates: [],
            createdAt: Date.now(), source: "manual", watcherMentorId: null,
          }],
        }));
        setVoiceMsg(`Añadido${target === "today" ? " a hoy" : " a la bandeja"}: “${title}”`);
      },
      (err) => setVoiceMsg(err === "no-soportado"
        ? "Tu navegador no soporta dictado por voz."
        : "No se escuchó nada, intenta de nuevo.")
    );
  };

  const groups = state.classifications.map((c) => ({
    c, items: state.tasks.filter((x) => x.classificationId === c.id),
  })).filter((g) => g.items.length);

  return (
    <div>
      <Header t={t} title={`Hola, ${state.profile.name.split(" ")[0]}`} subtitle={fmtDate(today)}
        right={<Diamond size={36} t={t} />} />

      {/* CAPTURA POR VOZ EN EL MAIN */}
      <div style={{ margin: "0 20px 14px", background: t.surface, borderRadius: t.radius, padding: 14,
        boxShadow: t.shadow }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={voice.listening ? voice.stop : captureVoice} style={{ width: 52, height: 52,
            borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0,
            background: voice.listening ? t.danger : t.primary, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mic size={24} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: t.text, fontSize: 14 }}>
              {voice.listening ? "🎙️ Escuchando…" : "Captura por voz"}
            </div>
            <div style={{ fontSize: 12, color: t.textMuted }}>
              {voiceMsg || 'Di: “Agrega limpiar la casa a pendientes”'}
            </div>
          </div>
        </div>
        {state.notifications.voiceAssistant && (
          <div style={{ marginTop: 10, fontSize: 11, color: t.faint, background: t.surfaceAlt,
            borderRadius: 10, padding: "8px 10px", lineHeight: 1.5 }}>
            <Sparkles size={11} style={{ verticalAlign: -1 }} /> También desde el asistente del teléfono:
            “Oye Siri / Ok Google, agrega <i>algo</i> a Impulso”. (Disponible al instalar la app nativa.)
          </div>
        )}
      </div>

      {/* progreso */}
      <div style={{ margin: "0 20px 14px", background: t.primary, borderRadius: t.radius, padding: 18, color: t.primaryFg }}>
        <div style={{ fontSize: 13, opacity: .85, fontWeight: 600 }}>Progreso de hoy</div>
        <div style={{ fontSize: 34, fontWeight: 800, fontFamily: "var(--display)" }}>{pct}%</div>
        <div style={{ height: 7, background: "rgba(255,255,255,.25)", borderRadius: 6, marginTop: 6 }}>
          <div style={{ width: pct + "%", height: "100%", background: t.primaryFg, borderRadius: 6, transition: "width .3s" }} />
        </div>
        <div style={{ fontSize: 12, opacity: .85, marginTop: 6 }}>{done} de {todays.length} completadas</div>
      </div>

      {inboxCount > 0 && (
        <button onClick={() => go("inbox")} style={{ margin: "0 20px 14px", width: "calc(100% - 40px)",
          display: "flex", alignItems: "center", gap: 10, background: t.surfaceAlt,
          border: `1px dashed ${t.border}`, borderRadius: 12, padding: 12, cursor: "pointer", color: t.text }}>
          <Bell size={18} color={t.accent} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Tienes {inboxCount} pendiente(s) en tu bandeja</span>
          <Arrow size={16} style={{ marginLeft: "auto" }} color={t.faint} />
        </button>
      )}

      {/* SECCIÓN: TAREAS ENCARGADAS POR TUS MENTORES (datos reales de Supabase) */}
      {assignedToMe.length > 0 && (
        <div style={{ margin: "0 20px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <UserCheck size={16} color={MENTOR_COLOR} />
            <h3 style={{ fontFamily: "var(--display)", fontSize: 16, margin: 0, color: MENTOR_COLOR }}>
              Encargadas por tus mentores
            </h3>
          </div>
          {assignedToMe.map((tk) => (
            <div key={tk.id} style={{ display: "flex", gap: 11, alignItems: "flex-start",
              background: t.surface, borderRadius: 14, padding: 12, marginBottom: 9,
              boxShadow: t.shadow, borderLeft: `4px solid ${MENTOR_COLOR}` }}>
              <button onClick={() => onToggleShared(tk.id, !tk.done)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 1 }}>
                {tk.done ? <CheckCircle2 size={24} color={t.success} /> : <Circle size={24} color={t.faint} />}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: t.text,
                  textDecoration: tk.done ? "line-through" : "none", opacity: tk.done ? .55 : 1 }}>{tk.title}</div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 5, alignItems: "center" }}>
                  {tk.classification && <Pill t={t} text={tk.classification} color={tk.color || MENTOR_COLOR} />}
                  <MentorBadge name={tk.creator_name || "Mentor"} kind="assigned" t={t} />
                  {tk.date && <span style={{ fontSize: 11, color: t.faint }}>
                    <Clock size={10} /> {fmtDate(tk.date)}{tk.time ? ` · ${tk.time}` : ""}</span>}
                  {tk.grade && <Pill t={t} text={`★ ${tk.grade}/5`} color="#C8860A" />}
                </div>
                {tk.feedback && (
                  <div style={{ fontSize: 11, color: t.textMuted, marginTop: 5 }}>
                    {tk.tag && <b>{tk.tag}. </b>}“{tk.feedback}”
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* segmentado Hoy / Por grupo */}
      <div style={{ display: "flex", gap: 7, padding: "0 20px 8px" }}>
        {[["hoy", "Tareas de hoy"], ["grupo", "Por clasificación"]].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} style={{ flex: 1, padding: "8px 4px", borderRadius: 10,
            cursor: "pointer", fontWeight: 700, fontSize: 12, border: "none",
            background: mode === k ? t.primary : t.surfaceAlt, color: mode === k ? t.primaryFg : t.textMuted }}>
            {l}</button>
        ))}
        <button onClick={() => setEditor({})} style={{ width: 38, borderRadius: 10, border: "none",
          background: t.primary, color: t.primaryFg, cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center" }}><Plus size={20} /></button>
      </div>

      <div style={{ padding: "0 20px 30px" }}>
        {mode === "hoy" && (<>
          {ownTasks.length === 0 && assignedToMe.length === 0 &&
            <Empty t={t} text="Nada para hoy. Toca + o usa la voz para crear algo." />}
          {ownTasks.map((task) => (
            <TaskRow key={task.id} task={task} cls={cls(task.classificationId)} t={t} day={today} state={state}
              onToggle={() => toggleDone(task, today)} onOpen={() => setEditor(task)} />
          ))}
        </>)}
        {mode === "grupo" && (<>
          {groups.length === 0 && <Empty t={t} text="Aún no hay tareas." />}
          {groups.map(({ c, items }) => {
            const cDone = items.filter((x) => isDoneOn(x, x.date || today)).length;
            return (
              <div key={c.id} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: c.color, transform: "rotate(45deg)" }} />
                  <h3 style={{ fontFamily: "var(--display)", fontSize: 15, margin: 0, color: t.text }}>{c.name}</h3>
                  <span style={{ fontSize: 11, color: t.faint }}>{cDone}/{items.length}</span>
                </div>
                {items.map((task) => (
                  <TaskRow key={task.id} task={task} cls={c} t={t} day={task.date || today} state={state}
                    onToggle={() => toggleDone(task, task.date || today)} onOpen={() => setEditor(task)} />
                ))}
              </div>
            );
          })}
        </>)}
      </div>

      {editor && <TaskEditor task={editor} state={state} patch={patch} t={t} onClose={() => setEditor(null)} />}
    </div>
  );
}

function TaskRow({ task, cls, t, day, state, onToggle, onOpen }) {
  const st = dayStatus(task, day);
  const subDone = (task.subtasks || []).filter((s) => s.done).length;
  const mentor = taskMentor(task, state);
  const accent = mentor ? MENTOR_COLOR : cls.color;
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", background: t.surface,
      borderRadius: 14, padding: 12, marginBottom: 9, boxShadow: t.shadow, borderLeft: `4px solid ${accent}` }}>
      <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 1 }}>
        {st === "completada" ? <CheckCircle2 size={24} color={t.success} /> : <Circle size={24} color={t.faint} />}
      </button>
      <div style={{ flex: 1, cursor: "pointer" }} onClick={onOpen}>
        <div style={{ fontWeight: 700, fontSize: 14, color: t.text,
          textDecoration: st === "completada" ? "line-through" : "none",
          opacity: st === "completada" ? .55 : 1 }}>{task.title}</div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 5, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: cls.color }}>
            <span style={{ display: "inline-block", width: 7, height: 7, background: cls.color,
              borderRadius: 2, transform: "rotate(45deg)", marginRight: 4 }} />{cls.name}
          </span>
          {mentor && <MentorBadge name={mentor.name} kind={mentor.kind} t={t} />}
          {task.isHabit && <Pill t={t} text="Hábito" />}
          {task.recurrence && task.recurrence !== "none" &&
            <span style={{ fontSize: 11, color: t.faint }}><Repeat size={10} /> {recurLabel(task)}</span>}
          {task.source === "google" && <Pill t={t} text="Google" color="#4285F4" />}
          {task.time && <span style={{ fontSize: 11, color: t.faint }}><Clock size={10} /> {task.time}</span>}
          {(task.subtasks || []).length > 0 &&
            <span style={{ fontSize: 11, color: t.faint }}><ListChecks size={11} /> {subDone}/{task.subtasks.length}</span>}
          {st === "en progreso" && <Pill t={t} text="En progreso" color={t.accent} />}
        </div>
      </div>
    </div>
  );
}
function recurLabel(task) {
  if (task.recurrence === "daily") return "Diario";
  if (task.recurrence === "weekly") return "Semanal";
  if (task.recurrence === "custom")
    return WEEKDAYS.filter(([, n]) => (task.recurrenceDays || []).includes(n)).map(([l]) => l).join("");
  return "";
}

/* ============================ EDITOR DE TAREA ============================ */
function TaskEditor({ task, state, patch, t, onClose }) {
  const isNew = !task.id;
  const anchor = task.date || todayISO();
  const [title, setTitle] = useState(task.title || "");
  const [classificationId, setClassificationId] = useState(task.classificationId || null);
  const [isHabit, setIsHabit] = useState(!!task.isHabit);
  const [date, setDate] = useState(task.date || todayISO());
  const [time, setTime] = useState(task.time || "");
  const [status, setStatus] = useState(task.status || "pendiente");
  const [done, setDone] = useState(isDoneOn(task, anchor));
  const [recurrence, setRecurrence] = useState(task.recurrence || "none");
  const [recurrenceDays, setRecurrenceDays] = useState(task.recurrenceDays || []);
  const [watcherMentorId, setWatcherMentorId] = useState(task.watcherMentorId || null);
  const [subs, setSubs] = useState(task.subtasks || []);
  const [newSub, setNewSub] = useState("");
  const [autoTouched, setAutoTouched] = useState(!isNew);
  const mentors = (state.mentors || []).filter((m) => m.status === "active");

  useEffect(() => {
    if (!autoTouched && title.trim()) setClassificationId(autoClassify(title, state.classifications));
  }, [title]); // eslint-disable-line

  // subtareas <-> tarea (bidireccional)
  const setSubsSync = (next) => {
    setSubs(next);
    if (next.length) setDone(next.every((s) => s.done));
  };
  const toggleTaskDone = (v) => {
    setDone(v);
    if (subs.length) setSubs(subs.map((s) => ({ ...s, done: v })));
  };

  const save = () => {
    let completedDates = (task.completedDates || []).filter((d) => d !== anchor);
    const finalDone = subs.length ? subs.every((s) => s.done) : done;
    if (finalDone) completedDates = [...completedDates, anchor];
    const payload = {
      id: task.id || uid(), title: title.trim(),
      classificationId: classificationId || autoClassify(title, state.classifications),
      isHabit, date, time, status: finalDone ? "pendiente" : status, recurrence,
      recurrenceDays: recurrence === "custom" ? recurrenceDays : [],
      subtasks: subs, completedDates, createdAt: task.createdAt || Date.now(),
      source: task.source || "manual", assignedBy: task.assignedBy, watcherMentorId,
    };
    patch((s) => ({ tasks: isNew ? [...s.tasks, payload] : s.tasks.map((x) => x.id === task.id ? payload : x) }));
    onClose();
  };
  const del = () => { patch((s) => ({ tasks: s.tasks.filter((x) => x.id !== task.id) })); onClose(); };

  return (
    <Modal open onClose={onClose} t={t} title={isNew ? "Nueva tarea / hábito" : "Editar"}>
      <Field label="¿Qué quieres hacer?" t={t}>
        <input style={inputStyle(t)} value={title} autoFocus
          onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Comprar jabón de trastes" />
      </Field>
      <Field label="Clasificación (única — reclasificable)" t={t}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {state.classifications.map((c) => (
            <button key={c.id} onClick={() => { setClassificationId(c.id); setAutoTouched(true); }}
              style={chip(t, classificationId === c.id, c.color)}>{c.name}</button>
          ))}
        </div>
        {!autoTouched && classificationId && (
          <div style={{ fontSize: 11, color: t.faint, marginTop: 5 }}>
            <Sparkles size={11} /> Clasificada automáticamente según el texto.
          </div>
        )}
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Fecha" t={t}>
          <input type="date" style={inputStyle(t)} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Hora" t={t}>
          <input type="time" style={inputStyle(t)} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Repetir" t={t}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {RECURRENCE.map((r) => (
            <button key={r.k} onClick={() => { setRecurrence(r.k); if (r.k !== "none") setIsHabit(true); }}
              style={chip(t, recurrence === r.k)}>{r.label}</button>
          ))}
        </div>
        {recurrence === "custom" && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {WEEKDAYS.map(([l, n]) => (
              <button key={n} onClick={() => setRecurrenceDays((d) => d.includes(n) ? d.filter((x) => x !== n) : [...d, n])}
                style={{ width: 34, height: 34, borderRadius: "50%", cursor: "pointer", fontWeight: 800,
                  fontSize: 12, border: "none",
                  background: recurrenceDays.includes(n) ? t.primary : t.surfaceAlt,
                  color: recurrenceDays.includes(n) ? t.primaryFg : t.textMuted }}>{l}</button>
            ))}
          </div>
        )}
      </Field>
      {mentors.length > 0 && (
        <Field label="Mentor que supervisa esta tarea (opcional)" t={t}>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button onClick={() => setWatcherMentorId(null)} style={chip(t, !watcherMentorId)}>Ninguno</button>
            {mentors.map((m) => (
              <button key={m.id} onClick={() => setWatcherMentorId(m.id)}
                style={chip(t, watcherMentorId === m.id, MENTOR_COLOR)}>{m.name}</button>
            ))}
          </div>
        </Field>
      )}
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, color: t.text, fontSize: 14 }}>
        <input type="checkbox" checked={isHabit} onChange={(e) => setIsHabit(e.target.checked)} /> Es un hábito
      </label>
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, color: t.text, fontSize: 14 }}>
        <input type="checkbox" checked={done} onChange={(e) => toggleTaskDone(e.target.checked)} />
        Completada {date !== todayISO() ? `(${fmtDate(date)})` : "hoy"}
      </label>
      {!done && (
        <Field label="Estado" t={t}>
          <div style={{ display: "flex", gap: 7 }}>
            {["pendiente", "en progreso"].map((s) => (
              <button key={s} onClick={() => setStatus(s)} style={{ flex: 1, padding: "8px 4px",
                borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 700, textTransform: "capitalize",
                border: "none", background: status === s ? t.primary : t.surfaceAlt,
                color: status === s ? t.primaryFg : t.textMuted }}>{s}</button>
            ))}
          </div>
        </Field>
      )}
      <Field label="Subtareas (al completarlas todas se marca la tarea)" t={t}>
        {subs.map((su) => (
          <div key={su.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <button onClick={() => setSubsSync(subs.map((x) => x.id === su.id ? { ...x, done: !x.done } : x))}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              {su.done ? <CheckCircle2 size={18} color={t.success} /> : <Circle size={18} color={t.faint} />}
            </button>
            <span style={{ flex: 1, fontSize: 13, color: t.text, textDecoration: su.done ? "line-through" : "none" }}>{su.title}</span>
            <button onClick={() => setSubsSync(subs.filter((x) => x.id !== su.id))} style={iconBtn(t, t.danger)}><X size={14} /></button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 6 }}>
          <input style={{ ...inputStyle(t), padding: "9px 12px" }} value={newSub}
            onChange={(e) => setNewSub(e.target.value)} placeholder="Añadir subtarea"
            onKeyDown={(e) => { if (e.key === "Enter" && newSub.trim()) {
              setSubsSync([...subs, { id: uid(), title: newSub.trim(), done: false }]); setNewSub(""); } }} />
          <Btn t={t} variant="soft" onClick={() => { if (newSub.trim()) {
            setSubsSync([...subs, { id: uid(), title: newSub.trim(), done: false }]); setNewSub(""); } }}>
            <Plus size={16} /></Btn>
        </div>
      </Field>
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        {!isNew && <Btn t={t} variant="danger" onClick={del}><Trash2 size={16} /></Btn>}
        <Btn t={t} full disabled={!title.trim()} onClick={save}>Guardar</Btn>
      </div>
    </Modal>
  );
}

/* ================================ INBOX ================================== */
function InboxScreen({ state, patch, t }) {
  const [text, setText] = useState("");
  const [classifying, setClassifying] = useState(null);
  const [scheduling, setScheduling] = useState(null);
  const [filter, setFilter] = useState("pendientes");
  const [query, setQuery] = useState("");
  const [voiceMsg, setVoiceMsg] = useState("");
  const voice = useVoice();
  const cls = (id) => state.classifications.find((c) => c.id === id) || GOOGLE_CLASS;

  const items = state.tasks.filter((x) => !x.date)
    .filter((x) => filter === "todas" ? true
      : filter === "completadas" ? (x.completedDates || []).length
      : !(x.completedDates || []).length)
    .filter((x) => x.title.toLowerCase().includes(query.toLowerCase()));

  const addItem = (raw) => {
    const v = parseVoice(raw).title || raw.trim();
    if (!v) return;
    patch((s) => ({ tasks: [...s.tasks, { id: uid(), title: v,
      classificationId: autoClassify(v, s.classifications), date: null, time: "", isHabit: false,
      status: "pendiente", recurrence: "none", recurrenceDays: [], subtasks: [], completedDates: [],
      createdAt: Date.now(), source: "manual", watcherMentorId: null }] }));
    setText("");
  };
  const update = (id, p) => patch((s) => ({ tasks: s.tasks.map((x) => x.id === id ? { ...x, ...p } : x) }));
  const remove = (id) => patch((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) }));
  const markDone = (it) => update(it.id, { completedDates: (it.completedDates || []).length ? [] : [todayISO()] });

  const startVoice = () => {
    setVoiceMsg("");
    voice.start(
      (txt) => { addItem(txt); setVoiceMsg(`Capturado: “${parseVoice(txt).title}”`); },
      (err) => setVoiceMsg(err === "no-soportado"
        ? "Tu navegador no soporta dictado por voz." : "No se escuchó nada.")
    );
  };

  return (
    <div>
      <Header t={t} title="Bandeja" subtitle="Captura ahora, organiza después" />
      <div style={{ padding: "0 20px 8px" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...inputStyle(t), borderRadius: 999 }} value={text}
            onChange={(e) => setText(e.target.value)} placeholder="Escribe un pendiente…"
            onKeyDown={(e) => e.key === "Enter" && addItem(text)} />
          <button onClick={voice.listening ? voice.stop : startVoice} style={{ width: 46, height: 46,
            borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0,
            background: voice.listening ? t.danger : t.surfaceAlt, color: voice.listening ? "#fff" : t.text,
            display: "flex", alignItems: "center", justifyContent: "center" }}><Mic size={20} /></button>
          <button onClick={() => addItem(text)} style={{ width: 46, height: 46, borderRadius: "50%",
            border: "none", cursor: "pointer", flexShrink: 0, background: t.primary, color: t.primaryFg,
            display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={22} /></button>
        </div>
        {voice.listening && <div style={{ fontSize: 12, color: t.danger, marginTop: 6 }}>🎙️ Escuchando…</div>}
        {voiceMsg && <div style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>{voiceMsg}</div>}
      </div>
      <div style={{ padding: "8px 20px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: t.surfaceAlt,
          borderRadius: 999, padding: "6px 12px", marginBottom: 8 }}>
          <Search size={15} color={t.faint} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar"
            style={{ border: "none", background: "transparent", outline: "none", flex: 1, color: t.text,
              fontFamily: "inherit", fontSize: 13 }} />
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          {[["pendientes", "Pendientes"], ["completadas", "Hechas"], ["todas", "Todas"]].map(([k, l]) => (
            <button key={k} onClick={() => setFilter(k)} style={chip(t, filter === k)}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: "10px 20px 30px" }}>
        {items.length === 0 && <Empty t={t} text="Bandeja limpia ✨ Captura algo con texto o voz." />}
        {items.map((it) => {
          const isDone = (it.completedDates || []).length > 0;
          const stale = Date.now() - it.createdAt > 1000 * 60 * 60 * 24 * 4;
          return (
            <div key={it.id} style={{ background: t.surface, borderRadius: 14, padding: 12, marginBottom: 9,
              boxShadow: t.shadow, borderLeft: `4px solid ${cls(it.classificationId).color}` }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <button onClick={() => markDone(it)} style={{ background: "none", border: "none",
                  cursor: "pointer", padding: 0, marginTop: 1 }}>
                  {isDone ? <CheckCircle2 size={22} color={t.success} /> : <Circle size={22} color={t.faint} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: t.text,
                    textDecoration: isDone ? "line-through" : "none", opacity: isDone ? .55 : 1 }}>{it.title}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cls(it.classificationId).color, marginTop: 3 }}>
                    {cls(it.classificationId).name}
                  </div>
                </div>
              </div>
              {stale && !isDone && (
                <div style={{ fontSize: 11, color: t.danger, marginTop: 6, background: t.surfaceAlt,
                  padding: "5px 8px", borderRadius: 8 }}>
                  Lleva varios días aquí — ¿posponer, clasificar o eliminar?
                </div>
              )}
              <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                <QuickAct t={t} icon={<Check size={13} />} label="Hecho" onClick={() => markDone(it)} />
                <QuickAct t={t} icon={<Clock size={13} />} label="Posponer"
                  onClick={() => setScheduling({ ...it, mode: "postpone" })} />
                <QuickAct t={t} icon={<CalendarPlus size={13} />} label="Agendar"
                  onClick={() => setScheduling({ ...it, mode: "schedule" })} />
                <QuickAct t={t} icon={<Tag size={13} />} label="Clasificar" onClick={() => setClassifying(it)} />
                <QuickAct t={t} icon={<Trash2 size={13} />} label="" danger onClick={() => remove(it.id)} />
              </div>
            </div>
          );
        })}
      </div>
      {classifying && (
        <Modal open onClose={() => setClassifying(null)} t={t} title="Clasificar pendiente">
          <p style={{ color: t.textMuted, fontSize: 13, marginTop: 0 }}>“{classifying.title}”</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {state.classifications.map((c) => (
              <button key={c.id} onClick={() => { update(classifying.id, { classificationId: c.id }); setClassifying(null); }}
                style={chip(t, classifying.classificationId === c.id, c.color)}>{c.name}</button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: t.faint }}>Cada tarea tiene una sola clasificación.</p>
        </Modal>
      )}
      {scheduling && (
        <ScheduleModal item={scheduling} t={t} onClose={() => setScheduling(null)}
          onApply={(p) => { update(scheduling.id, p); setScheduling(null); }} />
      )}
    </div>
  );
}
function QuickAct({ t, icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px",
      borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, border: `1px solid ${t.border}`,
      background: t.surfaceAlt, color: danger ? t.danger : t.text }}>{icon}{label}</button>
  );
}
function ScheduleModal({ item, t, onClose, onApply }) {
  const [date, setDate] = useState(item.date || todayISO());
  const [time, setTime] = useState(item.time || "");
  const shortcuts = [{ l: "Hoy más tarde", d: todayISO() }, { l: "Mañana", d: addDays(todayISO(), 1) },
    { l: "Este finde", d: nextWeekend() }];
  return (
    <Modal open onClose={onClose} t={t} title={item.mode === "postpone" ? "Posponer" : "Agendar pendiente"}>
      <p style={{ color: t.textMuted, fontSize: 13, marginTop: 0 }}>“{item.title}”</p>
      <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
        {shortcuts.map((s) => (
          <button key={s.l} onClick={() => setDate(s.d)} style={chip(t, date === s.d)}>{s.l}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Fecha" t={t}>
          <input type="date" style={inputStyle(t)} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Hora (opcional)" t={t}>
          <input type="time" style={inputStyle(t)} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Btn t={t} full onClick={() => onApply({ date, time })}>
        {item.mode === "postpone" ? "Posponer" : "Pasar al calendario"}
      </Btn>
      <p style={{ fontSize: 12, color: t.faint, textAlign: "center" }}>
        Al asignar fecha, el pendiente se convierte en tarea programada.
      </p>
    </Modal>
  );
}

/* ============================== CALENDARIO =============================== */
function CalendarScreen({ state, patch, t }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [selected, setSelected] = useState(todayISO());
  const [reschedule, setReschedule] = useState(null);
  const cls = (id) => state.classifications.find((c) => c.id === id) || GOOGLE_CLASS;

  const first = new Date(cursor.y, cursor.m, 1);
  const startDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const monthName = first.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++)
    cells.push(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);

  const dayTasks = state.tasks.filter((x) => occursOn(x, selected));
  const move = (n) => setCursor((c) => {
    let m = c.m + n, y = c.y;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    return { y, m };
  });

  // cambiar estatus desde el calendario, en el día seleccionado
  const setStatusOn = (task, iso, status) => patch((s) => ({
    tasks: s.tasks.map((x) => {
      if (x.id !== task.id) return x;
      const cd = (x.completedDates || []).filter((d) => d !== iso);
      if (status === "completada")
        return { ...x, completedDates: [...cd, iso], subtasks: (x.subtasks || []).map((u) => ({ ...u, done: true })) };
      return { ...x, completedDates: cd, status,
        subtasks: status === "pendiente" ? (x.subtasks || []).map((u) => ({ ...u, done: false })) : x.subtasks };
    }),
  }));

  return (
    <div>
      <Header t={t} title="Calendario" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px 10px" }}>
        <button onClick={() => move(-1)} style={iconBtn(t)}><ChevronLeft size={20} /></button>
        <span style={{ fontWeight: 800, color: t.text, textTransform: "capitalize", fontFamily: "var(--display)" }}>{monthName}</span>
        <button onClick={() => move(1)} style={iconBtn(t)}><ChevronRight size={20} /></button>
      </div>
      <div style={{ padding: "0 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
          {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: t.faint, padding: 4 }}>{d}</div>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />;
            const dts = state.tasks.filter((x) => occursOn(x, iso));
            const isSel = iso === selected, isToday = iso === todayISO();
            return (
              <button key={i} onClick={() => setSelected(iso)} style={{ aspectRatio: "1", borderRadius: 10,
                cursor: "pointer", border: "none", padding: 2, background: isSel ? t.primary
                  : isToday ? t.surfaceAlt : "transparent", color: isSel ? t.primaryFg : t.text,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 600 }}>{Number(iso.slice(-2))}</span>
                <span style={{ display: "flex", gap: 2 }}>
                  {dts.slice(0, 3).map((x) => (
                    <span key={x.id} style={{ width: 5, height: 5, borderRadius: "50%",
                      background: isSel ? t.primaryFg
                        : (taskMentor(x, state) ? MENTOR_COLOR : cls(x.classificationId).color) }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ padding: "16px 20px 30px" }}>
        <h3 style={{ fontFamily: "var(--display)", fontSize: 16, margin: "0 0 4px", color: t.text }}>{fmtDate(selected)}</h3>
        <p style={{ fontSize: 12, color: t.faint, margin: "0 0 12px" }}>Cambia el estatus con los botones; toca el ícono ↻ para reprogramar.</p>
        {dayTasks.length === 0 && <Empty t={t} text="Sin tareas este día." />}
        {dayTasks.map((task) => {
          const st = dayStatus(task, selected);
          const mentor = taskMentor(task, state);
          return (
            <div key={task.id} style={{ background: t.surface, borderRadius: 12, padding: 11, marginBottom: 8,
              boxShadow: t.shadow, borderLeft: `4px solid ${mentor ? MENTOR_COLOR : cls(task.classificationId).color}` }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: t.text,
                    textDecoration: st === "completada" ? "line-through" : "none" }}>{task.title}</div>
                  <div style={{ fontSize: 11, color: t.faint, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span>{cls(task.classificationId).name}{task.time ? ` · ${task.time}` : ""}</span>
                    {mentor && <MentorBadge name={mentor.name} kind={mentor.kind} t={t} />}
                  </div>
                </div>
                <button onClick={() => setReschedule(task)} style={iconBtn(t)}><RefreshCw size={15} /></button>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 9 }}>
                {[["pendiente", "Pendiente"], ["en progreso", "En progreso"], ["completada", "Hecha"]].map(([k, l]) => (
                  <button key={k} onClick={() => setStatusOn(task, selected, k)} style={{ flex: 1, padding: "7px 4px",
                    borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, border: "none",
                    background: st === k ? (k === "completada" ? t.success : t.primary) : t.surfaceAlt,
                    color: st === k ? "#fff" : t.textMuted }}>{l}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {reschedule && (
        <ScheduleModal item={{ ...reschedule, mode: "postpone" }} t={t} onClose={() => setReschedule(null)}
          onApply={(p) => { patch((s) => ({ tasks: s.tasks.map((x) => x.id === reschedule.id ? { ...x, ...p } : x) }));
            setReschedule(null); }} />
      )}
    </div>
  );
}

/* =============================== MENTORES ================================ */
// Versión multiusuario real: las mentorías y las tareas compartidas viven en
// Supabase y se sincronizan en tiempo real entre cuentas distintas.

function MentoresScreen({ state, t, user, myName, mentorships, sharedTasks, refresh }) {
  const [view, setView] = useState("mios");
  const [detail, setDetail] = useState(null);

  const tasksFor = (mId) => sharedTasks.filter((x) => x.mentorship_id === mId);
  const asMentee = mentorships.filter(
    (m) => m.status === "active" && MentorAPI.myRole(m, user.id) === "mentee");
  const asMentor = mentorships.filter(
    (m) => m.status === "active" && MentorAPI.myRole(m, user.id) === "mentor");
  const incoming = mentorships.filter(
    (m) => m.status === "pending" && m.inviter_id !== user.id);

  return (
    <div>
      <Header t={t} title="Mentores" subtitle="Colabora en tiempo real con otras cuentas"
        right={<button onClick={refresh} style={iconBtn(t, t.primary)}><RefreshCw size={18} /></button>} />
      <div style={{ display: "flex", gap: 6, padding: "0 20px 12px" }}>
        {[["mios", "Mis mentores"], ["soy", "Soy mentor"], ["panel", "Panel"]].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{ flex: 1, padding: "9px 2px", borderRadius: 10,
            cursor: "pointer", fontWeight: 700, fontSize: 12, border: "none",
            background: view === k ? t.primary : t.surfaceAlt, color: view === k ? t.primaryFg : t.textMuted }}>{l}</button>
        ))}
      </div>
      {view === "mios" && (
        <MisMentores t={t} user={user} myName={myName} relations={asMentee}
          incoming={incoming.filter((m) => m.inviter_role === "mentor")}
          tasksFor={tasksFor} refresh={refresh} openDetail={setDetail} />
      )}
      {view === "soy" && (
        <SoyMentor t={t} user={user} myName={myName} state={state} relations={asMentor}
          incoming={incoming.filter((m) => m.inviter_role === "mentee")}
          tasksFor={tasksFor} refresh={refresh} openDetail={setDetail} />
      )}
      {view === "panel" && (
        <PanelMentores t={t} user={user} asMentee={asMentee} asMentor={asMentor}
          tasksFor={tasksFor} openDetail={setDetail} />
      )}
      {detail && (
        <DetailModal t={t} title={detail.title} tasks={detail.tasks} onClose={() => setDetail(null)} />
      )}
    </div>
  );
}

function MisMentores({ t, user, myName, relations, incoming, tasksFor, refresh, openDetail }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const invite = async () => {
    if (!email.trim()) return;
    setBusy(true); setMsg("");
    try {
      await MentorAPI.createInvite({
        inviterId: user.id, inviterEmail: user.email, inviterName: myName,
        inviterRole: "mentee", targetEmail: email,
      });
      setEmail(""); setMsg("Invitación enviada. La verá al iniciar sesión con ese correo.");
      refresh();
    } catch (e) { setMsg("Error: " + e.message); }
    setBusy(false);
  };
  const accept = async (m) => {
    try { await MentorAPI.acceptInvite(m.id, { targetId: user.id, targetName: myName }); refresh(); }
    catch (e) { alert(e.message); }
  };
  const drop = async (m) => {
    try { await MentorAPI.removeMentorship(m.id); refresh(); } catch (e) { alert(e.message); }
  };

  return (
    <div style={{ padding: "0 20px 30px" }}>
      <div style={{ background: t.surface, borderRadius: 14, padding: 14, boxShadow: t.shadow, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: t.text, marginBottom: 4, fontSize: 14 }}>Invitar a un mentor</div>
        <p style={{ fontSize: 12, color: t.textMuted, margin: "0 0 8px" }}>
          Escribe el correo de la persona. Debe tener (o crear) una cuenta de Impulso con ese correo y aceptar.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={inputStyle(t)} value={email} type="email"
            onChange={(e) => setEmail(e.target.value)} placeholder="correo del mentor" />
          <Btn t={t} disabled={busy} onClick={invite}><Send size={16} /></Btn>
        </div>
        {msg && <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>{msg}</div>}
      </div>

      {incoming.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: "var(--display)", fontSize: 15, margin: "0 0 8px", color: t.text }}>
            Invitaciones recibidas
          </h3>
          {incoming.map((m) => (
            <div key={m.id} style={{ background: t.surface, borderRadius: 14, padding: 14,
              boxShadow: t.shadow, marginBottom: 9 }}>
              <div style={{ fontSize: 13, color: t.text }}>
                <b>{m.inviter_name || m.inviter_email}</b> quiere ser tu mentor.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                <Btn t={t} full style={{ padding: 9, fontSize: 13 }} onClick={() => accept(m)}>Aceptar</Btn>
                <Btn t={t} variant="danger" style={{ padding: "9px 14px", fontSize: 13 }}
                  onClick={() => drop(m)}>Rechazar</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {relations.length === 0 && incoming.length === 0 &&
        <Empty t={t} text="Aún no tienes mentores. Invita a alguien por su correo." />}
      {relations.map((m) => {
        const tasks = tasksFor(m.id);
        const done = tasks.filter((x) => x.done).length;
        const name = MentorAPI.counterpartName(m, user.id);
        return (
          <div key={m.id} style={{ background: t.surface, borderRadius: 14, padding: 14,
            boxShadow: t.shadow, marginBottom: 10 }}>
            <button onClick={() => openDetail({ title: `Tareas con ${name}`, tasks })}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <Avatar name={name} color={MENTOR_COLOR} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>{name}</div>
                <div style={{ fontSize: 11, color: t.faint }}>
                  Tu mentor · {tasks.length} tarea(s) · {done} hechas
                </div>
              </div>
              <Arrow size={16} color={t.faint} />
            </button>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
              <Btn t={t} variant="danger" style={miniBtn} onClick={() => drop(m)}>Finalizar mentoría</Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SoyMentor({ t, user, myName, state, relations, incoming, tasksFor, refresh, openDetail }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [assigning, setAssigning] = useState(null);
  const [grading, setGrading] = useState(null);

  const invite = async () => {
    if (!email.trim()) return;
    setBusy(true); setMsg("");
    try {
      await MentorAPI.createInvite({
        inviterId: user.id, inviterEmail: user.email, inviterName: myName,
        inviterRole: "mentor", targetEmail: email,
      });
      setEmail(""); setMsg("Invitación enviada a tu aprendiz.");
      refresh();
    } catch (e) { setMsg("Error: " + e.message); }
    setBusy(false);
  };
  const accept = async (m) => {
    try { await MentorAPI.acceptInvite(m.id, { targetId: user.id, targetName: myName }); refresh(); }
    catch (e) { alert(e.message); }
  };
  const drop = async (m) => {
    try { await MentorAPI.removeMentorship(m.id); refresh(); } catch (e) { alert(e.message); }
  };
  const doAssign = async (m, form) => {
    const c = state.classifications.find((x) => x.name === form.classification);
    try {
      await MentorAPI.assignSharedTask({
        mentorship_id: m.id, owner_id: MentorAPI.menteeId(m), creator_id: user.id,
        creator_name: myName, title: form.title, classification: form.classification,
        color: c ? c.color : MENTOR_COLOR, date: form.date || null, time: form.time || null,
        status: "pendiente", done: false,
      });
      setAssigning(null); refresh();
    } catch (e) { alert(e.message); }
  };
  const doGrade = async (task, g) => {
    try { await MentorAPI.updateSharedTask(task.id, g); setGrading(null); refresh(); }
    catch (e) { alert(e.message); }
  };

  return (
    <div style={{ padding: "0 20px 30px" }}>
      <div style={{ background: t.surface, borderRadius: 14, padding: 14, boxShadow: t.shadow, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, color: t.text, marginBottom: 4, fontSize: 14 }}>Invitar a un aprendiz</div>
        <p style={{ fontSize: 12, color: t.textMuted, margin: "0 0 8px" }}>
          Invita por correo a la persona que quieres acompañar como mentor.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={inputStyle(t)} value={email} type="email"
            onChange={(e) => setEmail(e.target.value)} placeholder="correo del aprendiz" />
          <Btn t={t} disabled={busy} onClick={invite}><Send size={16} /></Btn>
        </div>
        {msg && <div style={{ fontSize: 12, color: t.textMuted, marginTop: 8 }}>{msg}</div>}
      </div>

      {incoming.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: "var(--display)", fontSize: 15, margin: "0 0 8px", color: t.text }}>
            Solicitudes recibidas
          </h3>
          {incoming.map((m) => (
            <div key={m.id} style={{ background: t.surface, borderRadius: 14, padding: 14,
              boxShadow: t.shadow, marginBottom: 9 }}>
              <div style={{ fontSize: 13, color: t.text }}>
                <b>{m.inviter_name || m.inviter_email}</b> te pidió ser su mentor.
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                <Btn t={t} full style={{ padding: 9, fontSize: 13 }} onClick={() => accept(m)}>Aceptar</Btn>
                <Btn t={t} variant="danger" style={{ padding: "9px 14px", fontSize: 13 }}
                  onClick={() => drop(m)}>Rechazar</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {relations.length === 0 && incoming.length === 0 &&
        <Empty t={t} text="Aún no tienes aprendices. Invita a alguien por su correo." />}
      {relations.map((m) => {
        const tasks = tasksFor(m.id);
        const name = MentorAPI.counterpartName(m, user.id);
        return (
          <div key={m.id} style={{ background: t.surface, borderRadius: 14, padding: 14,
            boxShadow: t.shadow, marginBottom: 12 }}>
            <button onClick={() => openDetail({ title: `Tareas de ${name}`, tasks })}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
                background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <Avatar name={name} color={t.accent} />
              <div style={{ flex: 1, textAlign: "left" }}>
                <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>{name}</div>
                <div style={{ fontSize: 11, color: t.faint }}>
                  Tu aprendiz · {tasks.length} tarea(s) · {tasks.filter((x) => x.done).length} hechas
                </div>
              </div>
            </button>
            <div style={{ marginTop: 10 }}>
              {tasks.length === 0 && <div style={{ fontSize: 12, color: t.faint }}>Sin tareas asignadas.</div>}
              {tasks.map((tk) => (
                <div key={tk.id} style={{ background: t.surfaceAlt, borderRadius: 10, padding: 10, marginBottom: 7 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {tk.done ? <CheckCircle2 size={18} color={t.success} /> : <Circle size={18} color={t.faint} />}
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: t.text,
                        textDecoration: tk.done ? "line-through" : "none" }}>{tk.title}</span>
                      <div style={{ fontSize: 10, color: t.faint }}>
                        {tk.classification ? `${tk.classification} · ` : ""}
                        {tk.date ? fmtDate(tk.date) : "sin fecha"}{tk.time ? ` · ${tk.time}` : ""}
                      </div>
                    </div>
                    <button onClick={() => setGrading(tk)}
                      style={{ ...iconBtn(t, t.primary), fontSize: 11, fontWeight: 800 }}>
                      <Star size={14} /> {tk.grade ? `${tk.grade}/5` : "Calificar"}
                    </button>
                  </div>
                  {tk.feedback && (
                    <div style={{ fontSize: 11, color: t.textMuted, marginTop: 5, paddingLeft: 26 }}>
                      {tk.tag && <b>{tk.tag}. </b>}“{tk.feedback}”
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
              <Btn t={t} variant="soft" style={miniBtn} onClick={() => setAssigning(m)}>
                <Plus size={14} /> Asignar tarea</Btn>
              <Btn t={t} variant="danger" style={miniBtn} onClick={() => drop(m)}>Finalizar</Btn>
            </div>
          </div>
        );
      })}
      {assigning && (
        <AssignTask t={t} classifications={state.classifications} onClose={() => setAssigning(null)}
          onSave={(form) => doAssign(assigning, form)} />
      )}
      {grading && (
        <GradeTask t={t} onClose={() => setGrading(null)} onSave={(g) => doGrade(grading, g)} />
      )}
    </div>
  );
}
const miniBtn = { padding: "8px 12px", fontSize: 12 };

function Avatar({ name, color }) {
  return (
    <div style={{ width: 38, height: 38, borderRadius: "50%", background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800,
      textTransform: "uppercase", flexShrink: 0 }}>{(name || "?")[0]}</div>
  );
}

function AssignTask({ t, classifications, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const usable = classifications.filter((c) => !c.locked);
  const [classification, setClassification] = useState(usable[0] && usable[0].name);
  return (
    <Modal open onClose={onClose} t={t} title="Asignar tarea al aprendiz">
      <Field label="Tarea" t={t}>
        <input style={inputStyle(t)} autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Leer 15 minutos" />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Fecha" t={t}>
          <input type="date" style={inputStyle(t)} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Hora" t={t}>
          <input type="time" style={inputStyle(t)} value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Clasificación" t={t}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {usable.map((c) => (
            <button key={c.id} onClick={() => setClassification(c.name)}
              style={chip(t, classification === c.name, c.color)}>{c.name}</button>
          ))}
        </div>
      </Field>
      <Btn t={t} full disabled={!title.trim()} onClick={() => onSave({ title: title.trim(), date, time, classification })}>
        Asignar tarea</Btn>
    </Modal>
  );
}

function GradeTask({ t, onClose, onSave }) {
  const [stars, setStars] = useState(0);
  const [tag, setTag] = useState(null);
  const [fb, setFb] = useState("");
  return (
    <Modal open onClose={onClose} t={t} title="Calificar tarea">
      <Field label="Calificación" t={t}>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setStars(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
              <Star size={30} color="#F5A623" fill={n <= stars ? "#F5A623" : "none"} />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Opciones" t={t}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {MENTOR_OPTIONS.map((o) => (
            <button key={o} onClick={() => setTag(o)} style={chip(t, tag === o)}>{o}</button>
          ))}
        </div>
      </Field>
      <Field label="Retroalimentación" t={t}>
        <textarea style={{ ...inputStyle(t), minHeight: 70, resize: "none" }} value={fb}
          onChange={(e) => setFb(e.target.value)} placeholder="Comentario para tu aprendiz…" />
      </Field>
      <Btn t={t} full disabled={!stars} onClick={() => onSave({ grade: stars, tag, feedback: fb.trim() })}>
        Guardar evaluación</Btn>
    </Modal>
  );
}

// PANEL: tareas designadas/asignadas de mentores y aprendices
function PanelMentores({ t, user, asMentee, asMentor, tasksFor, openDetail }) {
  return (
    <div style={{ padding: "0 20px 30px" }}>
      <PanelSection t={t} icon={<UserCheck size={16} color={MENTOR_COLOR} />} title="Tus mentores te supervisan">
        {asMentee.length === 0 && <Empty t={t} text="Sin mentores activos." />}
        {asMentee.map((m) => {
          const tasks = tasksFor(m.id);
          const name = MentorAPI.counterpartName(m, user.id);
          return (
            <PanelRow key={m.id} t={t} name={name} color={MENTOR_COLOR}
              sub={`${tasks.length} tarea(s) · ${tasks.filter((x) => x.done).length} hechas`}
              onClick={() => openDetail({ title: `Tareas con ${name}`, tasks })} />
          );
        })}
      </PanelSection>
      <PanelSection t={t} icon={<ClipboardList size={16} color={t.accent} />}
        title="Tareas que asignaste a tus aprendices">
        {asMentor.length === 0 && <Empty t={t} text="Sin aprendices activos." />}
        {asMentor.map((m) => {
          const tasks = tasksFor(m.id);
          const name = MentorAPI.counterpartName(m, user.id);
          return (
            <PanelRow key={m.id} t={t} name={name} color={t.accent}
              sub={`${tasks.length} asignada(s) · ${tasks.filter((x) => x.done).length} hechas`}
              onClick={() => openDetail({ title: `Tareas de ${name}`, tasks })} />
          );
        })}
      </PanelSection>
    </div>
  );
}
function PanelSection({ t, icon, title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        {icon}<h3 style={{ fontFamily: "var(--display)", fontSize: 15, margin: 0, color: t.text }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}
function PanelRow({ t, name, sub, color, onClick }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
      background: t.surface, borderRadius: 12, padding: 11, marginBottom: 8, boxShadow: t.shadow,
      border: "none", cursor: "pointer" }}>
      <Avatar name={name} color={color} />
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 11, color: t.faint }}>{sub}</div>
      </div>
      <Arrow size={16} color={t.faint} />
    </button>
  );
}
// modal: tareas de un mentor o aprendiz al tocar su nombre
function DetailModal({ t, title, tasks, onClose }) {
  return (
    <Modal open onClose={onClose} t={t} title={title}>
      {(!tasks || tasks.length === 0) && <Empty t={t} text="Sin tareas todavía." />}
      {(tasks || []).map((tk) => (
        <div key={tk.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 12px",
          background: t.surfaceAlt, borderRadius: 10, marginBottom: 7 }}>
          {tk.done ? <CheckCircle2 size={18} color={t.success} /> : <Circle size={18} color={t.faint} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: t.text, fontSize: 13,
              textDecoration: tk.done ? "line-through" : "none" }}>{tk.title}</div>
            <div style={{ fontSize: 11, color: t.faint }}>
              {[tk.classification, tk.date ? fmtDate(tk.date) : null,
                tk.grade ? `★ ${tk.grade}/5` : null].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>
      ))}
    </Modal>
  );
}

/* ================================ AJUSTES ================================ */
function Ajustes({ state, patch, t, reset }) {
  const [panel, setPanel] = useState(null);
  const setClassifications = (fn) => patch((s) => ({
    classifications: typeof fn === "function" ? fn(s.classifications) : fn }));
  const sections = [
    { k: "dashboard", label: "Panel de progreso", icon: <ListChecks size={18} /> },
    { k: "estilo", label: "Estilo de la app", icon: <Sparkles size={18} /> },
    { k: "clasif", label: "Clasificaciones automáticas", icon: <Tag size={18} /> },
    { k: "google", label: "Sincronizar Google Calendar", icon: <CalendarIcon size={18} /> },
    { k: "notif", label: "Notificaciones y voz", icon: <Bell size={18} /> },
    { k: "plan", label: "Suscripción", icon: <Crown size={18} /> },
    { k: "cuenta", label: "Cuenta y privacidad", icon: <Shield size={18} /> },
  ];
  return (
    <div>
      <Header t={t} title="Más" subtitle="Ajustes y panel" />
      <div style={{ padding: "0 20px 30px" }}>
        <div style={{ background: t.surface, borderRadius: 14, padding: 14, boxShadow: t.shadow,
          display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <Avatar name={state.profile.name} color={t.primary} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: t.text }}>{state.profile.name}</div>
            <div style={{ fontSize: 12, color: t.faint }}>{state.profile.email}</div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, padding: "4px 9px", borderRadius: 7,
            background: state.subscription.plan === "pro" ? "#F5A62322" : t.surfaceAlt,
            color: state.subscription.plan === "pro" ? "#C8860A" : t.textMuted }}>
            {state.subscription.plan === "pro" ? "PRO" : "FREE"}</span>
        </div>
        {sections.map((s) => (
          <button key={s.k} onClick={() => setPanel(s.k)} style={{ width: "100%", display: "flex",
            alignItems: "center", gap: 12, padding: "13px 14px", background: t.surface, border: "none",
            borderRadius: 12, marginBottom: 8, cursor: "pointer", color: t.text }}>
            <span style={{ color: t.primary }}>{s.icon}</span>
            <span style={{ flex: 1, textAlign: "left", fontWeight: 700, fontSize: 14 }}>{s.label}</span>
            <Arrow size={16} color={t.faint} />
          </button>
        ))}
        <p style={{ textAlign: "center", color: t.faint, fontSize: 11, marginTop: 14 }}>Impulso · prototipo</p>
      </div>

      {panel === "dashboard" && <Modal open onClose={() => setPanel(null)} t={t} title="Panel de progreso">
        <Dashboard state={state} t={t} /></Modal>}

      {panel === "estilo" && <Modal open onClose={() => setPanel(null)} t={t} title="Estilo de la app">
        {Object.entries(THEMES).map(([key, th]) => (
          <button key={key} onClick={() => patch({ theme: key })} style={{ display: "flex", alignItems: "center",
            gap: 12, width: "100%", padding: 12, marginBottom: 9, borderRadius: 14, cursor: "pointer",
            background: th.t.surface, border: `2px solid ${state.theme === key ? t.primary : t.border}` }}>
            <div style={{ display: "flex", gap: 4 }}>
              {th.swatch.map((c, i) => <span key={i} style={{ width: 20, height: 32, borderRadius: 5,
                background: c, border: `1px solid ${th.t.border}` }} />)}
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontWeight: 800, color: th.t.text }}>{th.name}</div>
              <div style={{ fontSize: 12, color: th.t.textMuted }}>{th.desc}</div>
            </div>
            {state.theme === key && <Check size={20} color={t.primary} />}
          </button>
        ))}
      </Modal>}

      {panel === "clasif" && <Modal open onClose={() => setPanel(null)} t={t} title="Clasificaciones automáticas">
        <p style={{ fontSize: 13, color: t.textMuted, marginTop: 0 }}>
          Añade, edita o elimina clasificaciones, vincula un mentor y define palabras clave para el auto-clasificado.
        </p>
        <ClassificationManager classifications={state.classifications} setClassifications={setClassifications}
          t={t} mentors={state.mentors || []} />
      </Modal>}

      {panel === "google" && <Modal open onClose={() => setPanel(null)} t={t} title="Google Calendar">
        <GoogleSync state={state} patch={patch} t={t} /></Modal>}

      {panel === "notif" && <Modal open onClose={() => setPanel(null)} t={t} title="Notificaciones y voz">
        {[["habitReminders", "Recordatorios de hábitos", "Avisos a la hora elegida"],
          ["inboxDaily", "Resumen diario de bandeja", "“Tienes X pendientes”"],
          ["inboxAge", "Alerta de pendientes antiguos", "Sugerir posponer / clasificar"],
          ["voiceAssistant", "Atajo del asistente del teléfono", "“Oye Siri / Ok Google, agrega … a Impulso”"]].map(([k, l, d]) => (
          <Toggle key={k} t={t} label={l} desc={d} value={state.notifications[k]}
            onChange={(v) => patch((s) => ({ notifications: { ...s.notifications, [k]: v } }))} />
        ))}
      </Modal>}

      {panel === "plan" && <Modal open onClose={() => setPanel(null)} t={t} title="Suscripción">
        <Paywall state={state} patch={patch} t={t} /></Modal>}

      {panel === "cuenta" && <Modal open onClose={() => setPanel(null)} t={t} title="Cuenta y privacidad">
        <Info t={t} label="Nombre" value={state.profile.name} />
        <Info t={t} label="Correo" value={state.profile.email} />
        <Info t={t} label="Método" value={state.profile.authMethod} />
        <Info t={t} label="Zona horaria" value={state.profile.timezone} />
        <p style={{ fontSize: 12, color: t.faint, lineHeight: 1.6, marginTop: 14 }}>
          Tu identidad se guarda separada de tus hábitos. Los mentores solo ven las tareas que tú compartes.
        </p>
        <Btn t={t} variant="ghost" full style={{ marginTop: 10 }} onClick={reset}><LogOut size={16} /> Cerrar sesión</Btn>
        <Btn t={t} variant="danger" full style={{ marginTop: 10 }}
          onClick={() => { if (window.confirm("¿Borrar la cuenta y todos los datos?")) reset(); }}>
          <Trash2 size={16} /> Borrar cuenta y datos</Btn>
      </Modal>}
    </div>
  );
}
function Toggle({ t, label, desc, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: t.faint }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!value)} style={{ width: 46, height: 27, borderRadius: 20, border: "none",
        cursor: "pointer", position: "relative", background: value ? t.success : t.border, transition: "background .2s" }}>
        <span style={{ position: "absolute", top: 3, left: value ? 22 : 3, width: 21, height: 21,
          borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
      </button>
    </div>
  );
}
function Info({ t, label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${t.border}` }}>
      <span style={{ color: t.textMuted, fontSize: 13 }}>{label}</span>
      <span style={{ color: t.text, fontSize: 13, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

/* ============================== DASHBOARD ================================ */
function Dashboard({ state, t }) {
  const week = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), -i));
  let total = 0, done = 0;
  const byClass = state.classifications.map((c) => {
    let ct = 0, cd = 0;
    state.tasks.filter((x) => x.classificationId === c.id).forEach((x) => {
      week.forEach((d) => { if (occursOn(x, d)) { ct++; total++; if (isDoneOn(x, d)) { cd++; done++; } } });
    });
    return { c, total: ct, done: cd, pct: ct ? Math.round((cd / ct) * 100) : 0 };
  }).filter((x) => x.total > 0);
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <Stat t={t} big label="Cumplimiento semanal" value={pct + "%"} />
        <Stat t={t} label="Completadas" value={done} />
        <Stat t={t} label="Programadas" value={total} />
      </div>
      <h4 style={{ margin: "4px 0 10px", color: t.text, fontFamily: "var(--display)", fontSize: 15 }}>Por clasificación</h4>
      {byClass.length === 0 && <Empty t={t} text="Aún no hay datos esta semana." />}
      {byClass.map(({ c, total, done, pct }) => (
        <div key={c.id} style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, color: t.text }}>{c.name}</span>
            <span style={{ color: t.faint }}>{done}/{total} · {pct}%</span>
          </div>
          <div style={{ height: 8, background: t.surfaceAlt, borderRadius: 6 }}>
            <div style={{ width: pct + "%", height: "100%", background: c.color, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
function Stat({ t, label, value, big }) {
  return (
    <div style={{ flex: big ? 1.4 : 1, background: t.surfaceAlt, borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: t.primary, fontFamily: "var(--display)" }}>{value}</div>
      <div style={{ fontSize: 11, color: t.textMuted }}>{label}</div>
    </div>
  );
}

/* ============================ GOOGLE CALENDAR ============================ */
function GoogleSync({ state, patch, t }) {
  const ensureGoogle = (s) => s.classifications.some((c) => c.id === GOOGLE_CLASS.id)
    ? s.classifications : [...s.classifications, { ...GOOGLE_CLASS }];
  const connect = () => patch((s) => ({ googleConnected: true, classifications: ensureGoogle(s),
    tasks: [...s.tasks,
      mkG("Reunión de equipo", todayISO(), "10:00"),
      mkG("Cita con el dentista", addDays(todayISO(), 2), "16:30"),
      mkG("Cumpleaños de Marta", addDays(todayISO(), 4), "")] }));
  const disconnect = () => patch((s) => ({ googleConnected: false,
    tasks: s.tasks.filter((x) => x.source !== "google") }));
  const simAdd = () => patch((s) => ({ tasks: [...s.tasks, mkG("Nuevo evento de Google", addDays(todayISO(), 1), "12:00")] }));
  const simEdit = () => patch((s) => {
    const g = s.tasks.find((x) => x.source === "google");
    return g ? { tasks: s.tasks.map((x) => x.id === g.id
      ? { ...x, title: x.title.replace(/ \(actualizado\)$/, "") + " (actualizado)", time: "09:00" } : x) } : {};
  });
  const simDel = () => patch((s) => {
    const g = [...s.tasks].reverse().find((x) => x.source === "google");
    return g ? { tasks: s.tasks.filter((x) => x.id !== g.id) } : {};
  });
  const gTasks = state.tasks.filter((x) => x.source === "google");
  return (
    <div>
      <p style={{ fontSize: 13, color: t.textMuted, marginTop: 0, lineHeight: 1.6 }}>
        Al conectar tu Google Calendar, Impulso importa tus eventos con la clasificación <b>Google</b>.
        Cuando agregas, editas o eliminas un evento en Google, el cambio se refleja aquí.
      </p>
      {!state.googleConnected ? (
        <Btn t={t} full onClick={connect}><Link2 size={16} /> Conectar Google Calendar</Btn>
      ) : (<>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#4285F411",
          border: "1px solid #4285F455", borderRadius: 12, padding: 11, marginBottom: 12 }}>
          <CalendarIcon size={18} color="#4285F4" />
          <span style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Conectado · {gTasks.length} eventos</span>
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: t.textMuted, marginBottom: 6 }}>
          SIMULAR CAMBIOS DESDE GOOGLE
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
          <Btn t={t} variant="soft" style={miniBtn} onClick={simAdd}>Añadir</Btn>
          <Btn t={t} variant="soft" style={miniBtn} onClick={simEdit}>Actualizar</Btn>
          <Btn t={t} variant="soft" style={miniBtn} onClick={simDel}>Eliminar</Btn>
        </div>
        {gTasks.map((g) => (
          <div key={g.id} style={{ background: t.surfaceAlt, borderRadius: 10, padding: 10, marginBottom: 7,
            borderLeft: `4px solid ${GOOGLE_CLASS.color}` }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: t.text }}>{g.title}</div>
            <div style={{ fontSize: 11, color: t.faint }}>{fmtDate(g.date)}{g.time ? ` · ${g.time}` : ""}</div>
          </div>
        ))}
        <Btn t={t} variant="danger" full style={{ marginTop: 8 }} onClick={disconnect}>Desconectar</Btn>
      </>)}
    </div>
  );
}
const mkG = (title, date, time) => ({ id: "g" + uid(), title, classificationId: GOOGLE_CLASS.id,
  date, time, isHabit: false, status: "pendiente", recurrence: "none", recurrenceDays: [],
  subtasks: [], completedDates: [], createdAt: Date.now(), source: "google", watcherMentorId: null });

/* ================================ PAYWALL ================================ */
function Paywall({ state, patch, t }) {
  const plan = state.subscription.plan;
  const features = {
    Free: ["Hábitos y tareas ilimitados", "Bandeja de pendientes + voz", "Calendario y panel básico", "1 mentor"],
    Pro: ["Todo lo de Free", "Mentores ilimitados + evaluación", "Clasificaciones e informes avanzados",
      "Sincronización Google Calendar", "Inventario y OCR de tickets (Nivel 6)"],
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {["Free", "Pro"].map((p) => {
          const active = plan === p.toLowerCase();
          return (
            <div key={p} style={{ flex: 1, borderRadius: 16, padding: 14,
              background: p === "Pro" ? t.primary : t.surfaceAlt, color: p === "Pro" ? t.primaryFg : t.text,
              border: active ? `2px solid ${t.accent}` : "2px solid transparent" }}>
              <div style={{ fontWeight: 800, fontFamily: "var(--display)", fontSize: 18,
                display: "flex", alignItems: "center", gap: 5 }}>
                {p === "Pro" && <Crown size={16} />}{p}</div>
              <div style={{ fontSize: 12, opacity: .85, marginBottom: 8 }}>
                {p === "Free" ? "$0" : "$79 MXN / mes"}</div>
              {features[p].map((f) => (
                <div key={f} style={{ fontSize: 11, display: "flex", gap: 5, marginBottom: 4 }}>
                  <Check size={12} /> <span>{f}</span></div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ background: t.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: t.textMuted }}>Estado de tu suscripción</div>
        <div style={{ fontWeight: 800, color: t.text, textTransform: "capitalize" }}>
          {plan} · {state.subscription.status}</div>
      </div>
      {plan === "free" ? (
        <Btn t={t} full onClick={() => patch({ subscription: { plan: "pro", status: "trial" } })}>
          <Crown size={16} /> Iniciar prueba de Pro (7 días)</Btn>
      ) : (
        <Btn t={t} variant="danger" full onClick={() => patch({ subscription: { plan: "free", status: "canceled" } })}>
          Cancelar suscripción</Btn>
      )}
      <p style={{ fontSize: 11, color: t.faint, textAlign: "center", marginTop: 10 }}>
        Pago en modo demostración. Arquitectura lista para un proveedor real (Stripe / Google Play / App Store).
      </p>
    </div>
  );
}