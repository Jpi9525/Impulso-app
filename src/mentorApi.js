import { supabase } from "./supabase";

/* ============================ MENTORÍAS ============================ */

// Trae todas las mentorías visibles para el usuario actual
// (las reglas de seguridad de Supabase filtran lo que no le corresponde).
export async function listMentorships() {
  const { data, error } = await supabase
    .from("mentorships")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// Crea una invitación. inviterRole = el rol del que invita:
//  - "mentee" : yo invito a alguien para que sea MI mentor
//  - "mentor" : yo invito a alguien para ser SU mentor (mi aprendiz)
export async function createInvite({
  inviterId,
  inviterEmail,
  inviterName,
  inviterRole,
  targetEmail,
}) {
  const { error } = await supabase.from("mentorships").insert({
    inviter_id: inviterId,
    inviter_email: inviterEmail,
    inviter_name: inviterName,
    inviter_role: inviterRole,
    target_email: (targetEmail || "").trim().toLowerCase(),
    status: "pending",
  });
  if (error) throw error;
}

// El invitado acepta: se registra su id y nombre, y la mentoría queda activa.
export async function acceptInvite(id, { targetId, targetName }) {
  const { error } = await supabase
    .from("mentorships")
    .update({ target_id: targetId, target_name: targetName, status: "active" })
    .eq("id", id);
  if (error) throw error;
}

// Rechaza una invitación o finaliza una mentoría (borra el vínculo).
export async function removeMentorship(id) {
  const { error } = await supabase.from("mentorships").delete().eq("id", id);
  if (error) throw error;
}

/* ========================= TAREAS COMPARTIDAS ======================= */

export async function listSharedTasks() {
  const { data, error } = await supabase
    .from("shared_tasks")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

// El mentor asigna una tarea a su aprendiz.
export async function assignSharedTask(task) {
  const { error } = await supabase.from("shared_tasks").insert(task);
  if (error) throw error;
}

// Actualiza una tarea compartida (marcar hecha, calificar, etc.).
export async function updateSharedTask(id, patch) {
  const { error } = await supabase
    .from("shared_tasks")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSharedTask(id) {
  const { error } = await supabase.from("shared_tasks").delete().eq("id", id);
  if (error) throw error;
}

/* ====================== AYUDANTES DE ROL ============================ */

// Dado mi id, ¿soy "mentor" o "mentee" en esta mentoría?
export function myRole(m, myId) {
  const iAmInviter = m.inviter_id === myId;
  if (m.inviter_role === "mentor") return iAmInviter ? "mentor" : "mentee";
  return iAmInviter ? "mentee" : "mentor";
}

// Nombre de la otra persona en la mentoría.
export function counterpartName(m, myId) {
  if (m.inviter_id === myId) return m.target_name || m.target_email || "Invitado";
  return m.inviter_name || m.inviter_email || "Invitado";
}

// id del aprendiz (quien realiza las tareas) dentro de la mentoría.
export function menteeId(m) {
  return m.inviter_role === "mentee" ? m.inviter_id : m.target_id;
}