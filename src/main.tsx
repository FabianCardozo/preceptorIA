import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { BookOpenText, CheckCircle2, ClipboardCheck, Database, FileCheck2, LayoutDashboard, MessageSquareText, School, Settings, ShieldAlert, Trash2, Users } from "lucide-react";
import "./styles.css";

type Student = { id: string; apellido: string; nombre: string; dni: string; curso: string; division: string; turno: string };
type Attendance = { id: string; fecha: string; estudianteId: string; estado: "presente" | "ausente" | "tarde" };
type Note = { id: string; fecha: string; tipo: "novedad" | "justificacion" | "convivencia" | "familia"; estudianteId?: string; detalle: string };
type Config = { institucion: string; preceptor: string; ciclo: string };
type Store = { students: Student[]; attendance: Attendance[]; notes: Note[]; config: Config };
type View = "inicio" | "asistencia" | "estudiantes" | "novedades" | "justificaciones" | "convivencia" | "familias" | "config";

const KEY = "preceptoria-nueva-v2";
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const today = () => new Date().toLocaleDateString("en-CA");
const initial: Store = { students: [], attendance: [], notes: [], config: { institucion: "Institución educativa", preceptor: "", ciclo: "2026" } };

function load(): Store {
  try { return { ...initial, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
  catch { return initial; }
}

const menu: { id: View; label: string; icon: React.ComponentType<{size?: number}> }[] = [
  { id:"inicio", label:"Inicio", icon:LayoutDashboard }, { id:"asistencia", label:"Pase de lista", icon:ClipboardCheck },
  { id:"estudiantes", label:"Estudiantes", icon:Users }, { id:"novedades", label:"Novedades", icon:BookOpenText },
  { id:"justificaciones", label:"Justificaciones", icon:FileCheck2 }, { id:"convivencia", label:"Convivencia", icon:ShieldAlert },
  { id:"familias", label:"Notas a familias", icon:MessageSquareText }, { id:"config", label:"Configuración", icon:Settings }
];

function App(){
  const [store,setStore]=useState<Store>(load);
  const [view,setView]=useState<View>("inicio");
  const [toast,setToast]=useState("");
  useEffect(()=>localStorage.setItem(KEY,JSON.stringify(store)),[store]);
  const save=(next:Store,msg="Cambios guardados")=>{setStore(next);setToast(msg);setTimeout(()=>setToast(""),1600)};
  return <div className="shell">
    <aside><div className="brand"><School/><div><b>PRECEPTORÍA</b><small>Cuaderno digital</small></div></div><nav>{menu.map(m=><button key={m.id} className={view===m.id?"active":""} onClick={()=>setView(m.id)}><m.icon size={18}/>{m.label}</button>)}</nav><div className="db-status"><Database size={16}/><span>Supabase preparado</span></div></aside>
    <main><header><div><small>{store.config.institucion}</small><h1>{menu.find(m=>m.id===view)?.label}</h1></div><div className="cycle">Ciclo {store.config.ciclo}</div></header><section>
      {view==="inicio"&&<Dashboard store={store} setView={setView}/>} {view==="estudiantes"&&<Students store={store} save={save}/>} {view==="asistencia"&&<AttendanceView store={store} save={save}/>} {view==="config"&&<ConfigView store={store} save={save}/>} {!["inicio","estudiantes","asistencia","config"].includes(view)&&<NotesView type={view} store={store} save={save}/>} 
    </section></main>{toast&&<div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
  </div>
}

function Dashboard({store,setView}:{store:Store;setView:(v:View)=>void}){
  const d=today(); const day=store.attendance.filter(a=>a.fecha===d); const abs=day.filter(a=>a.estado==="ausente").length; const late=day.filter(a=>a.estado==="tarde").length;
  return <><div className="hero"><div><span>GESTIÓN COTIDIANA</span><h2>La información de preceptoría, ordenada y disponible.</h2><p>Administrá estudiantes, asistencia, novedades, justificaciones, convivencia y comunicaciones.</p></div></div><div className="cards">
    <button onClick={()=>setView("estudiantes")}><Users/><small>Estudiantes</small><b>{store.students.length}</b></button><button onClick={()=>setView("asistencia")}><ClipboardCheck/><small>Ausentes hoy</small><b>{abs}</b></button><button onClick={()=>setView("asistencia")}><ClipboardCheck/><small>Tardanzas hoy</small><b>{late}</b></button><button onClick={()=>setView("novedades")}><BookOpenText/><small>Registros</small><b>{store.notes.length}</b></button>
  </div><div className="panel"><h3>Estado del sistema</h3><p>La aplicación funciona actualmente con guardado local y ya está estructurada para migrar los registros a Supabase sin modificar la interfaz.</p></div></>
}

function Students({store,save}:{store:Store;save:(s:Store,m?:string)=>void}){
  const empty={apellido:"",nombre:"",dni:"",curso:"1°",division:"A",turno:"Mañana"}; const [f,setF]=useState(empty);
  const add=()=>{if(!f.apellido.trim()||!f.nombre.trim())return; save({...store,students:[...store.students,{id:uid(),...f}]},"Estudiante agregado");setF(empty)};
  return <div className="two"><div className="panel"><h3>Agregar estudiante</h3><div className="form"><input placeholder="Apellido" value={f.apellido} onChange={e=>setF({...f,apellido:e.target.value})}/><input placeholder="Nombre" value={f.nombre} onChange={e=>setF({...f,nombre:e.target.value})}/><input placeholder="DNI" value={f.dni} onChange={e=>setF({...f,dni:e.target.value})}/><input placeholder="Curso" value={f.curso} onChange={e=>setF({...f,curso:e.target.value})}/><input placeholder="División" value={f.division} onChange={e=>setF({...f,division:e.target.value})}/><select value={f.turno} onChange={e=>setF({...f,turno:e.target.value})}><option>Mañana</option><option>Tarde</option><option>Vespertino</option><option>Nocturno</option></select><button className="primary" onClick={add}>Guardar estudiante</button></div></div><div className="panel"><h3>Listado</h3>{store.students.length===0?<p className="muted">Todavía no hay estudiantes cargados.</p>:store.students.map(s=><div className="row" key={s.id}><div><b>{s.apellido}, {s.nombre}</b><small>{s.curso} {s.division} · {s.turno} · DNI {s.dni||"—"}</small></div><button className="icon" onClick={()=>save({...store,students:store.students.filter(x=>x.id!==s.id),attendance:store.attendance.filter(a=>a.estudianteId!==s.id)},"Estudiante eliminado")}><Trash2 size={16}/></button></div>)}</div></div>
}

function AttendanceView({store,save}:{store:Store;save:(s:Store,m?:string)=>void}){
  const [fecha,setFecha]=useState(today()); const courseOptions=useMemo(()=>Array.from(new Set(store.students.map(s=>`${s.curso}|${s.division}`))),[store.students]); const [course,setCourse]=useState(courseOptions[0]||"");
  useEffect(()=>{if(!course&&courseOptions[0])setCourse(courseOptions[0])},[course,courseOptions]); const [curso,division]=course.split("|"); const students=store.students.filter(s=>s.curso===curso&&s.division===division);
  const status=(id:string)=>store.attendance.find(a=>a.fecha===fecha&&a.estudianteId===id)?.estado||"presente";
  const setStatus=(id:string,estado:Attendance["estado"])=>{const rest=store.attendance.filter(a=>!(a.fecha===fecha&&a.estudianteId===id)); save({...store,attendance:[...rest,{id:uid(),fecha,estudianteId:id,estado}]},"Asistencia actualizada")};
  return <div className="panel"><div className="toolbar"><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/><select value={course} onChange={e=>setCourse(e.target.value)}>{courseOptions.map(c=><option key={c} value={c}>{c.replace("|"," ")}</option>)}</select></div>{students.length===0?<p className="muted">Cargá estudiantes para comenzar el pase de lista.</p>:students.map(s=><div className="row attendance" key={s.id}><b>{s.apellido}, {s.nombre}</b><div className="seg">{(["presente","ausente","tarde"] as const).map(x=><button key={x} className={status(s.id)===x?`sel ${x}`:""} onClick={()=>setStatus(s.id,x)}>{x}</button>)}</div></div>)}</div>
}

function NotesView({type,store,save}:{type:View;store:Store;save:(s:Store,m?:string)=>void}){
  const map:Record<string,Note["tipo"]>={novedades:"novedad",justificaciones:"justificacion",convivencia:"convivencia",familias:"familia"}; const noteType=map[type]; const [detalle,setDetalle]=useState(""); const [studentId,setStudentId]=useState("");
  const add=()=>{if(!detalle.trim())return; save({...store,notes:[...store.notes,{id:uid(),fecha:today(),tipo:noteType,estudianteId:studentId||undefined,detalle}]},"Registro guardado");setDetalle("")}; const rows=store.notes.filter(n=>n.tipo===noteType);
  return <div className="two"><div className="panel"><h3>Nuevo registro</h3><div className="form">{type!=="novedades"&&<select value={studentId} onChange={e=>setStudentId(e.target.value)}><option value="">Seleccionar estudiante</option>{store.students.map(s=><option value={s.id} key={s.id}>{s.apellido}, {s.nombre}</option>)}</select>}<textarea rows={7} placeholder="Detalle" value={detalle} onChange={e=>setDetalle(e.target.value)}/><button className="primary" onClick={add}>Guardar registro</button></div></div><div className="panel"><h3>Historial</h3>{rows.length===0?<p className="muted">Sin registros todavía.</p>:rows.slice().reverse().map(n=><div className="row" key={n.id}><div><b>{n.fecha}</b><small>{n.detalle}</small></div><button className="icon" onClick={()=>save({...store,notes:store.notes.filter(x=>x.id!==n.id)},"Registro eliminado")}><Trash2 size={16}/></button></div>)}</div></div>
}

function ConfigView({store,save}:{store:Store;save:(s:Store,m?:string)=>void}){const [f,setF]=useState(store.config);return <div className="panel narrow"><h3>Datos institucionales</h3><div className="form"><label>Institución<input value={f.institucion} onChange={e=>setF({...f,institucion:e.target.value})}/></label><label>Preceptor/a<input value={f.preceptor} onChange={e=>setF({...f,preceptor:e.target.value})}/></label><label>Ciclo lectivo<input value={f.ciclo} onChange={e=>setF({...f,ciclo:e.target.value})}/></label><button className="primary" onClick={()=>save({...store,config:f},"Configuración guardada")}>Guardar configuración</button></div></div>}

createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>);
