import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Users, UsersRound, UserRound, LogOut, Menu, X, Plus, Pencil, Power, KeyRound, ArrowRight, CheckCircle2, Circle,
  Settings, BarChart3, BriefcaseBusiness, Cpu, Smartphone, Car, Activity, LayoutDashboard,
  FileBarChart, ClipboardList, Building2, ShieldCheck, RadioTower, GitBranch, Package, FileText, CalendarClock, LayoutTemplate, WalletCards, Repeat2, CalendarRange, TrendingUp, CircleDollarSign, AlertCircle, Clock3, RefreshCw, Receipt, Plug, Link2, Server, TestTube2, DatabaseZap, Webhook, Trash2, Mail
} from "lucide-react";
import "./styles.css";

const menu = [
  ["dashboard", "Dashboard", BarChart3],
  ["prospectos", "Prospectos", BriefcaseBusiness],
  ["clientes", "Clientes", Users],
  ["servicios", "Servicios", Package],
  ["planes", "Planes", Package],
  ["cartera", "Cartera", WalletCards],
  ["activos", "Activos", Car],
  ["equipos", "Equipos GPS", Cpu],
  ["sim", "Tarjetas SIM", Smartphone],
  ["m2m", "Gestión M2M", RadioTower],
  ["consolidacion", "Consolidación", GitBranch],
  ["reportes", "Reportes", FileBarChart],
  ["reportes_personalizados", "Reportes personalizados", LayoutTemplate],
  ["gestion", "Gestión", ClipboardList],
  ["configuracion", "Configuración", Settings],
  ["usuarios", "Usuarios", UserRound],
  ["roles", "Roles y permisos", Settings],
  ["empresas", "Empresas", Building2],
  ["auditoria", "Auditoría avanzada", ShieldCheck]
];

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Error de comunicación con el servidor");
  }

  return data;
}

function Login({ onLogin }) {
  const params=new URLSearchParams(window.location.search);
  const resetToken=params.get("reset")||"";
  const [correo,setCorreo]=useState(""),[password,setPassword]=useState(""),[newPassword,setNewPassword]=useState(""),[error,setError]=useState(""),[message,setMessage]=useState("");
  async function handleSubmit(event){event.preventDefault();setError("");setMessage("");try{await api("/api/auth/login",{method:"POST",body:JSON.stringify({correo,password})});onLogin();}catch(err){setError(err.message)}}
  async function requestRecovery(){setError("");setMessage("");if(!correo)return setError("Ingrese su correo electrónico.");try{const d=await api("/api/auth/solicitar-recuperacion",{method:"POST",body:JSON.stringify({correo})});setMessage(d.message||"Revise su correo.");}catch(e){setError(e.message)}}
  async function resetPassword(event){event.preventDefault();setError("");setMessage("");try{await api("/api/auth/restablecer-clave",{method:"POST",body:JSON.stringify({token:resetToken,password:newPassword})});window.history.replaceState({},"",window.location.pathname);setMessage("Contraseña actualizada. Ya puede iniciar sesión.");setNewPassword("");}catch(e){setError(e.message)}}
  return <main className="login"><form onSubmit={resetToken?resetPassword:handleSubmit}>
    <h1>IT GPS <b>APP</b></h1><hr/><p>Plataforma de gestión GPS</p>
    {resetToken?<><h3>Recuperar acceso</h3><label>Nueva contraseña<input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required minLength="8"/></label><button type="submit">Restablecer contraseña</button></>:<>
      <label>Correo<input type="email" value={correo} onChange={e=>setCorreo(e.target.value)} required/></label>
      <label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      <button type="submit">Iniciar Sesión</button><button type="button" className="secondary login-recovery" onClick={requestRecovery}>¿Olvidó su contraseña?</button>
    </>}
    {error&&<div className="err">{error}</div>}{message&&<div className="success-message">{message}</div>}
  </form></main>;
}

function Modal({ title, children, onClose, wide = false, sectionsOverride = null }) {
  const bodyRef = useRef(null);
  const [sections, setSections] = useState([]);
  const [activeSection, setActiveSection] = useState("");

  // El formulario siempre abre desde el inicio. La navegación de secciones
  // trabaja contra el contenedor desplazable del modal, no contra el documento.
  useLayoutEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    root.scrollTop = 0;
    root.scrollLeft = 0;
    const first = root.querySelector(".form-section-title");
    if (first) setActiveSection(first.id || "modal-section-1");
  }, []);

  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;

    const headings = Array.from(root.querySelectorAll(".form-section-title"));
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `modal-section-${index + 1}`;
      heading.dataset.modalSectionIndex = String(index + 1);
    });

    const next = sectionsOverride?.length ? sectionsOverride : headings.map((heading, index) => ({
      id: heading.id || `modal-section-${index + 1}`,
      label: heading.textContent.trim()
    }));
    setSections(next);
    if (next[0]) setActiveSection(next[0].id);

    // Determina la sección activa por su posición real dentro del scroll.
    const updateActive = () => {
      const top = root.scrollTop + 36;
      let current = headings[0];
      for (const heading of headings) {
        if (heading.offsetTop <= top) current = heading;
        else break;
      }
      if (current) setActiveSection(current.id);
    };

    root.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
    return () => root.removeEventListener("scroll", updateActive);
  }, [children, sectionsOverride]);

  const isDetail = /^Detalle/i.test(title || "");
  const isQuoteForm = /^(Nueva|Editar) cotización/i.test(title || "");
  const showSidebar = !isDetail;

  function goTo(id) {
    const root = bodyRef.current;
    if (!root) return;
    const element = root.querySelector(`#${CSS.escape(id)}`);
    if (!element) return;
    setActiveSection(id);
    const targetTop = Math.max(0, element.offsetTop - 24);
    root.scrollTo({ top: targetTop, behavior: "smooth" });
  }

  return (
    <div className="back">
      <div className={`modal${wide ? " modal-wide" : ""}${isQuoteForm ? " modal-quote" : ""}${showSidebar ? " modal-with-sidebar" : ""}`}>
        <header className="modal-header">
          <div>
            <span className="modal-kicker">{isDetail ? "Detalle" : "Ficha"}</span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X />
          </button>
        </header>

        {showSidebar ? (
          <div className="modal-layout">
            <aside className="modal-sidebar" aria-label="Secciones de la ficha">
              <div className="modal-sidebar-title">Secciones</div>
              {sections.length ? (
                sections.map((section, index) => (
                  <button
                    type="button"
                    key={section.id}
                    className={section.id === activeSection ? "active" : ""}
                    onClick={() => goTo(section.id)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>{section.label}</b>
                  </button>
                ))
              ) : (
                <button type="button" className="active" onClick={() => bodyRef.current?.scrollTo({ top: 0, behavior: "smooth" })}>
                  <span>01</span>
                  <b>Información</b>
                </button>
              )}
              <div className="modal-sidebar-help">
                <small>IT GPS APP</small>
                <span>Complete la ficha y guarde los cambios.</span>
              </div>
            </aside>

            <div className="modal-content" ref={bodyRef}>
              <div className={`modal-content-body${sections.length ? " has-sections" : ""}`}>{children}</div>
            </div>
          </div>
        ) : (
          <div className="modal-content modal-detail-content" ref={bodyRef}>
            <div className={`modal-content-body${sections.length ? " has-sections" : ""}`}>{children}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function UsersPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const [usersResponse, catalogResponse] = await Promise.all([
        api("/api/users"),
        api("/api/users/catalogos")
      ]);

      setUsers(usersResponse.usuarios);
      setRoles(catalogResponse.roles);
      setCompanies(catalogResponse.empresas || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function toggleUser(user) {
    try {
      await api(`/api/users/${user.id}/estado`, { method: "PATCH" });
      await loadUsers();
    } catch (err) {
      alert(err.message);
    }
  }

  async function changePassword(user) {
    const password = window.prompt(
      "Nueva contraseña (mínimo 8 caracteres):"
    );

    if (!password) return;

    try {
      await api(`/api/users/${user.id}/password`, {
        method: "POST",
        body: JSON.stringify({ password })
      });
      alert("Contraseña actualizada correctamente.");
    } catch (err) {
      alert(err.message);
    }
  }

  function UserForm({ user, onClose }) {
    const [form, setForm] = useState({
      nombre: user?.nombre || "",
      apellido: user?.apellido || "",
      correo: user?.correo || "",
      password: "",
      rol_id: user?.rol_id || roles[0]?.id || "",
      empresa_id: user?.empresa_id || companies[0]?.id || "",
      estado: user?.estado ?? 1
    });

    function update(field, value) {
      setForm((current) => ({ ...current, [field]: value }));
    }

    async function save(event) {
      event.preventDefault();

      try {
        if (user) {
          await api(`/api/users/${user.id}`, {
            method: "PUT",
            body: JSON.stringify({
              nombre: form.nombre,
              apellido: form.apellido,
              correo: form.correo,
              rol_id: Number(form.rol_id),
              empresa_id: Number(form.empresa_id),
              estado: Number(form.estado)
            })
          });
        } else {
          await api("/api/users", {
            method: "POST",
            body: JSON.stringify({
              nombre: form.nombre,
              apellido: form.apellido,
              correo: form.correo,
              password: form.password,
              rol_id: Number(form.rol_id),
              empresa_id: Number(form.empresa_id)
            })
          });
        }

        onClose();
        await loadUsers();
      } catch (err) {
        setError(err.message);
      }
    }

    return (
      <form onSubmit={save}>
        <label>
          Nombre
          <input
            value={form.nombre}
            onChange={(e) => update("nombre", e.target.value)}
            required
          />
        </label>

        <label>
          Apellido
          <input
            value={form.apellido}
            onChange={(e) => update("apellido", e.target.value)}
          />
        </label>

        <label>
          Correo
          <input
            type="email"
            value={form.correo}
            onChange={(e) => update("correo", e.target.value)}
            required
          />
        </label>

        {!user && (
          <label>
            Contraseña
            <input
              type="password"
              minLength="8"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
            />
          </label>
        )}

        {currentUser?.rol === "Administrador" && <label>
          Empresa
          <select
            value={form.empresa_id}
            onChange={(e) => update("empresa_id", e.target.value)}
          >
            {companies.map((company) => (
              <option value={company.id} key={company.id}>
                {company.nombre}
              </option>
            ))}
          </select>
        </label>}

        <label>
          Rol
          <select
            value={form.rol_id}
            onChange={(e) => update("rol_id", e.target.value)}
          >
            {roles.map((role) => (
              <option value={role.id} key={role.id}>
                {role.nombre}
              </option>
            ))}
          </select>
        </label>

        {user && (
          <label>
            Estado
            <select
              value={form.estado}
              onChange={(e) => update("estado", e.target.value)}
            >
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </label>
        )}

        <div className="actions">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button type="submit" className="primary">
            Guardar
          </button>
        </div>
      </form>
    );
  }

  return (
    <section className="card">
      <div className="head">
        <div>
          <h2>Usuarios</h2>
          <p>Administración de usuarios, roles y acceso.</p>
        </div>

        <button
          className="primary"
          onClick={() => setModal({ type: "new" })}
        >
          <Plus /> Nuevo usuario
        </button>
      </div>

      {error && <div className="err">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Último ingreso</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.nombre} {user.apellido}</td>
              <td>{user.correo}</td>
              <td>{user.rol}</td>
              <td>{user.estado ? "Activo" : "Inactivo"}</td>
              <td>{user.ultimo_login || "Nunca"}</td>

              <td>
                <button
                  type="button"
                  onClick={() => setModal({ type: "edit", user })}
                  title="Editar"
                >
                  <Pencil />
                </button>

                <button
                  type="button"
                  onClick={() => changePassword(user)}
                  title="Cambiar contraseña"
                >
                  <KeyRound />
                </button>

                <button
                  type="button"
                  onClick={() => toggleUser(user)}
                  title="Activar / desactivar"
                >
                  <Power />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <Modal
          title={
            modal.type === "new"
              ? "Nuevo usuario"
              : "Editar usuario"
          }
          onClose={() => setModal(null)}
        >
          <UserForm
            user={modal.user}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </section>
  );
}

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(new Set());
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [r, p] = await Promise.all([
        api("/api/roles"),
        api("/api/roles/catalogo/permisos")
      ]);
      setRoles(r.roles);
      setPermissions(p.permisos);
      if (selected) await selectRole(selected.id, p.permisos);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, []);

  async function selectRole(roleId, permissionList = permissions) {
    try {
      const data = await api(`/api/roles/${roleId}`);
      setSelected(data.rol);
      setChecked(new Set(data.permisos.map((p) => p.id)));
      if (!permissionList.length) setPermissions(data.permisos);
    } catch (err) { setError(err.message); }
  }

  function togglePermission(id) {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function savePermissions() {
    if (!selected) return;
    try {
      await api(`/api/roles/${selected.id}/permisos`, {
        method: "PUT",
        body: JSON.stringify({ permisos: [...checked] })
      });
      alert("Permisos guardados correctamente.");
      await load();
    } catch (err) { alert(err.message); }
  }

  async function createRole(event) {
    event.preventDefault();
    if (!newName.trim()) return;
    try {
      const result = await api("/api/roles", {
        method: "POST",
        body: JSON.stringify({ nombre: newName.trim() })
      });
      setNewName("");
      await load();
      await selectRole(result.id);
    } catch (err) { alert(err.message); }
  }

  async function toggleRole(role) {
    try {
      await api(`/api/roles/${role.id}`, {
        method: "PUT",
        body: JSON.stringify({ nombre: role.nombre, estado: !role.estado })
      });
      await load();
    } catch (err) { alert(err.message); }
  }

  const groups = permissions.reduce((acc, p) => {
    (acc[p.modulo] ||= []).push(p);
    return acc;
  }, {});

  return (
    <section className="card">
      <div className="head">
        <div>
          <h2>Roles y permisos</h2>
          <p>Configure qué acciones puede realizar cada rol.</p>
        </div>
      </div>

      {error && <div className="err">{error}</div>}

      <div className="roles-layout">
        <div className="roles-list">
          <h3>Roles</h3>
          <form onSubmit={createRole} className="role-create">
            <input
              placeholder="Nuevo rol"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button className="primary" type="submit"><Plus /></button>
          </form>

          {roles.map((role) => (
            <div className={`role-item ${selected?.id === role.id ? "active" : ""}`} key={role.id}>
              <button type="button" onClick={() => selectRole(role.id)}>
                <b>{role.nombre}</b>
                <small>{role.estado ? "Activo" : "Inactivo"}</small>
              </button>
              {role.nombre !== "Administrador" && (
                <button type="button" onClick={() => toggleRole(role)} title="Activar / desactivar">
                  <Power />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="permissions-panel">
          {!selected ? (
            <div className="empty">Seleccione un rol para administrar sus permisos.</div>
          ) : (
            <>
              <div className="permission-head">
                <div>
                  <h3>{selected.nombre}</h3>
                  <p>Marque las acciones permitidas.</p>
                </div>
                <button className="primary" onClick={savePermissions}>Guardar permisos</button>
              </div>

              {Object.entries(groups).map(([module, items]) => (
                <div className="permission-group" key={module}>
                  <div className="permission-module">{module}</div>
                  <div className="permission-grid">
                    {items.map((permission) => (
                      <label key={permission.id}>
                        <input
                          type="checkbox"
                          checked={checked.has(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                        />
                        <span>{permission.accion}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </section>
  );
}


function BrandWhiteLabelModal({ company, currentUser, onClose }) {
  const canEdit = currentUser?.permisos?.includes("empresas.editar");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await api(`/api/companies/${company.id}/marca`);
        if (!alive) return;
        setForm(d.marca || {
          nombre_aplicacion: company.nombre || "",
          nombre_comercial: company.nombre || "",
          logo_principal: "", logo_secundario: "", favicon: "",
          color_principal: "#0A1E2E", color_secundario: "#F5F8FA", color_acento: "#8CF63C",
          encabezado: "", pie_pagina: "", texto_legal: "", terminos_condiciones: "",
          firma_nombre: "", firma_cargo: "", datos_bancarios: "",
          moneda: "COP", formato_fecha: "DD/MM/YYYY", formato_numerico: "es-CO", zona_horaria: "America/Bogota"
        });
      } catch (e) { alert(e.message); onClose(); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [company.id]);

  const change = (key, value) => setForm(x => ({ ...x, [key]: value }));
  async function loadImage(file, key) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("El archivo no puede superar 2 MB.");
    if (!file.type.startsWith("image/")) return alert("Seleccione una imagen válida.");
    const reader = new FileReader();
    reader.onload = () => change(key, String(reader.result || ""));
    reader.readAsDataURL(file);
  }
  async function save(e) {
    e.preventDefault();
    if (!canEdit) return alert("No tiene permisos para modificar la marca de la empresa.");
    setSaving(true);
    try {
      await api(`/api/companies/${company.id}/marca`, { method: "PUT", body: JSON.stringify(form) });
      onClose();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  }
  if (loading || !form) return <div className="brand-loading">Cargando configuración de marca…</div>;

  return <form onSubmit={save} className="brand-form">
    <div id="brand-identidad" className="form-section-title">Identidad de marca</div>
    <div className="form-grid form-grid-3">
      <label>Nombre de la aplicación<input value={form.nombre_aplicacion} onChange={e=>change("nombre_aplicacion",e.target.value)} placeholder="Nombre que verá el usuario" /></label>
      <label>Nombre comercial<input value={form.nombre_comercial} onChange={e=>change("nombre_comercial",e.target.value)} placeholder="Nombre comercial" /></label>
      <label>Moneda<select value={form.moneda} onChange={e=>change("moneda",e.target.value)}><option>COP</option><option>USD</option><option>EUR</option><option>MXN</option><option>PEN</option></select></label>
    </div>

    <div id="brand-visual" className="form-section-title">Identidad visual</div>
    <div className="form-grid form-grid-3">
      <label>Color principal<div className="color-input"><input type="color" value={form.color_principal} onChange={e=>change("color_principal",e.target.value)} /><input value={form.color_principal} onChange={e=>change("color_principal",e.target.value)} pattern="#[0-9A-Fa-f]{6}" /></div></label>
      <label>Color secundario<div className="color-input"><input type="color" value={form.color_secundario} onChange={e=>change("color_secundario",e.target.value)} /><input value={form.color_secundario} onChange={e=>change("color_secundario",e.target.value)} pattern="#[0-9A-Fa-f]{6}" /></div></label>
      <label>Color de acento<div className="color-input"><input type="color" value={form.color_acento} onChange={e=>change("color_acento",e.target.value)} /><input value={form.color_acento} onChange={e=>change("color_acento",e.target.value)} pattern="#[0-9A-Fa-f]{6}" /></div></label>
      <label className="brand-file">Logo principal<input type="file" accept="image/*" onChange={e=>loadImage(e.target.files?.[0],"logo_principal")} />{form.logo_principal&&<img src={form.logo_principal} alt="Logo principal" />}</label>
      <label className="brand-file">Logo secundario<input type="file" accept="image/*" onChange={e=>loadImage(e.target.files?.[0],"logo_secundario")} />{form.logo_secundario&&<img src={form.logo_secundario} alt="Logo secundario" />}</label>
      <label className="brand-file">Favicon<input type="file" accept="image/*" onChange={e=>loadImage(e.target.files?.[0],"favicon")} />{form.favicon&&<img className="brand-favicon-preview" src={form.favicon} alt="Favicon" />}</label>
    </div>

    <div id="brand-documentos" className="form-section-title">Documentos y comunicaciones</div>
    <div className="form-grid form-grid-2">
      <label>Encabezado<textarea rows="3" value={form.encabezado} onChange={e=>change("encabezado",e.target.value)} placeholder="Texto adicional para encabezados." /></label>
      <label>Pie de página<textarea rows="3" value={form.pie_pagina} onChange={e=>change("pie_pagina",e.target.value)} placeholder="Datos que aparecerán al pie." /></label>
      <label>Texto legal<textarea rows="4" value={form.texto_legal} onChange={e=>change("texto_legal",e.target.value)} placeholder="Leyendas legales." /></label>
      <label>Términos y condiciones<textarea rows="4" value={form.terminos_condiciones} onChange={e=>change("terminos_condiciones",e.target.value)} placeholder="Términos comerciales." /></label>
    </div>

    <div className="form-grid form-grid-3">
      <label>Nombre de firma<input value={form.firma_nombre} onChange={e=>change("firma_nombre",e.target.value)} /></label>
      <label>Cargo<input value={form.firma_cargo} onChange={e=>change("firma_cargo",e.target.value)} /></label>
      <label className="full-field">Datos bancarios<textarea rows="3" value={form.datos_bancarios} onChange={e=>change("datos_bancarios",e.target.value)} placeholder="Banco, cuenta, titular y demás información de pago." /></label>
    </div>

    <div id="brand-preferencias" className="form-section-title">Preferencias</div>
    <div className="form-grid form-grid-3">
      <label>Formato de fecha<select value={form.formato_fecha} onChange={e=>change("formato_fecha",e.target.value)}><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option><option>MM/DD/YYYY</option></select></label>
      <label>Formato numérico<input value={form.formato_numerico} onChange={e=>change("formato_numerico",e.target.value)} /></label>
      <label>Zona horaria<input value={form.zona_horaria} onChange={e=>change("zona_horaria",e.target.value)} /></label>
    </div>
    <div id="brand-preview" className="form-section-title">Vista previa</div>
    <div className="brand-preview" style={{"--brand-main":form.color_principal,"--brand-secondary":form.color_secundario,"--brand-accent":form.color_acento}}>
      <div className="brand-preview-head">{form.logo_principal ? <img src={form.logo_principal} alt="Vista previa" /> : <span className="brand-preview-mark">IT</span>}<div><b>{form.nombre_aplicacion || company.nombre}</b><small>{form.nombre_comercial || company.nombre}</small></div><strong>Documento</strong></div>
      <div className="brand-preview-line"></div>
      <div className="brand-preview-body"><b>PREVISUALIZACIÓN DE MARCA</b><span>Así se aplicará la identidad visual en documentos y reportes.</span></div>
    </div>
    <div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={saving}>{saving ? "Guardando…" : "Guardar marca"}</button></div>
  </form>;
}

function CompaniesPage({ currentUser }) {
  const [companies,setCompanies]=useState([]);
  const [modal,setModal]=useState(null);
  const [brand,setBrand]=useState(null);
  const [error,setError]=useState("");
  async function load(){try{const d=await api("/api/companies");setCompanies(d.empresas);}catch(e){setError(e.message);}}
  useEffect(()=>{load();},[]);
  async function save(e){e.preventDefault();try{const b={nombre:e.target.nombre.value,nit:e.target.nit.value,estado:e.target.estado?.value||1};if(modal?.id)await api(`/api/companies/${modal.id}`,{method:"PUT",body:JSON.stringify(b)});else await api("/api/companies",{method:"POST",body:JSON.stringify(b)});setModal(null);await load();}catch(err){alert(err.message);}}
  const canBrand = currentUser?.permisos?.includes("empresas.editar");
  return <section className="card"><div className="head"><div><h2>Empresas</h2><p>Administre las compañías, sus datos y su identidad de marca blanca.</p></div><button className="primary" onClick={()=>setModal({})}><Plus/> Nueva empresa</button></div>{error&&<div className="err">{error}</div>}<table><thead><tr><th>Empresa</th><th>NIT</th><th>Estado</th><th>Creación</th><th></th></tr></thead><tbody>{companies.map(c=><tr key={c.id}><td><b>{c.nombre}</b></td><td>{c.nit||"—"}</td><td>{c.estado?"Activa":"Inactiva"}</td><td>{c.fecha_creacion}</td><td className="row-actions">{canBrand&&<button className="secondary" onClick={()=>setBrand(c)}>Marca</button>}<button onClick={()=>setModal(c)} title="Editar"><Pencil/></button></td></tr>)}</tbody></table>{modal&&<Modal title={modal.id?"Editar empresa":"Nueva empresa"} onClose={()=>setModal(null)}><form onSubmit={save}><div className="form-section-title">Datos de empresa</div><div className="form-grid form-grid-3"><label>Nombre<input name="nombre" defaultValue={modal.nombre||""} required/></label><label>NIT<input name="nit" defaultValue={modal.nit||""}/></label>{modal.id&&<label>Estado<select name="estado" defaultValue={modal.estado?1:0}><option value="1">Activa</option><option value="0">Inactiva</option></select></label>}</div><div className="actions form-actions"><button type="button" className="secondary" onClick={()=>setModal(null)}>Cancelar</button><button className="primary">Guardar</button></div></form></Modal>}{brand&&<Modal wide title={`Marca blanca — ${brand.nombre}`} onClose={()=>setBrand(null)} sectionsOverride={[
        {id:"brand-identidad",label:"Identidad de marca"},
        {id:"brand-visual",label:"Identidad visual"},
        {id:"brand-documentos",label:"Documentos y comunicaciones"},
        {id:"brand-preferencias",label:"Preferencias"},
        {id:"brand-preview",label:"Vista previa"}
      ]}><BrandWhiteLabelModal company={brand} currentUser={currentUser} onClose={()=>setBrand(null)}/></Modal>}</section>;
}

function formatColombiaDate(value){
  if(!value) return "—";
  const raw=String(value).trim();
  let date;
  if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)) date=new Date(raw.replace(" ","T")+"Z");
  else date=new Date(raw);
  if(Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("es-CO",{timeZone:"America/Bogota",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(date);
}

async function downloadBlob(url, filename, errorMessage="No fue posible descargar el archivo") {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || errorMessage);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function AuditPage({ currentUser }){
  const [rows,setRows]=useState([]),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const [filters,setFilters]=useState({q:"",empresa_id:"",usuario_id:"",modulo:"",accion:"",fecha_desde:"",fecha_hasta:"",limit:"25"});
  const [catalog,setCatalog]=useState({empresas:[],usuarios:[],modulos:[],acciones:[]});
  const [summary,setSummary]=useState({total:0,logins:0,cambios:0,exportaciones:0,usuarios:0});
  const [page,setPage]=useState(1),[pages,setPages]=useState(1),[detail,setDetail]=useState(null);
  const canExport=currentUser?.permisos?.includes("auditoria.exportar");

  function queryString(extra={}){
    const p=new URLSearchParams();
    Object.entries({...filters,...extra}).forEach(([k,v])=>{if(v!==undefined&&v!==null&&String(v)!=="")p.set(k,v)});
    return p.toString();
  }
  async function load(nextPage=page){
    setLoading(true);setError("");
    try{
      const qs=queryString({page:nextPage});
      const [d,s]=await Promise.all([api(`/api/auditoria?${qs}`),api(`/api/auditoria/resumen?${queryString()}`)]);
      setRows(d.registros||[]);setPage(d.page||1);setPages(d.pages||1);setSummary(s.resumen||{});
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  async function loadCatalog(){try{setCatalog(await api("/api/auditoria/filtros"))}catch(e){setError(e.message)}}
  useEffect(()=>{loadCatalog();load(1)},[]);
  useEffect(()=>{load(1)},[filters.q,filters.empresa_id,filters.usuario_id,filters.modulo,filters.accion,filters.fecha_desde,filters.fecha_hasta,filters.limit]);

  function clearFilters(){setFilters({q:"",empresa_id:"",usuario_id:"",modulo:"",accion:"",fecha_desde:"",fecha_hasta:"",limit:"25"})}
  async function exportCsv(){
    try{
      const response=await fetch(`/api/auditoria/export?${queryString()}`,{credentials:"include"});
      if(!response.ok){const d=await response.json().catch(()=>({}));throw new Error(d.error||"No fue posible exportar")};
      const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`itgps-auditoria-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url);
    }catch(e){alert(e.message)}
  }
  const jsonView=(value)=>{if(!value)return "—";try{return JSON.stringify(JSON.parse(value),null,2)}catch{return value}};
  return <section className="card audit-page">
    <div className="head"><div><h2>Auditoría avanzada</h2><p>Trazabilidad de accesos, cambios y operaciones realizadas en IT GPS APP.</p></div><div className="toolbar-actions"><button className="secondary" onClick={()=>load(1)}>Actualizar</button>{canExport&&<button className="secondary" onClick={exportCsv}>Exportar CSV</button>}</div></div>
    {error&&<div className="err">{error}</div>}
    <div className="audit-kpis">
      {[["Eventos",summary.total??0],["Inicios de sesión",summary.logins??0],["Cambios",summary.cambios??0],["Exportaciones",summary.exportaciones??0],["Usuarios",summary.usuarios??0]].map(([label,value])=><div className="audit-kpi" key={label}><b>{Number(value).toLocaleString()}</b><span>{label}</span></div>)}
    </div>
    <div className="filters audit-filters">
      <input value={filters.q} placeholder="Buscar usuario, correo, acción, módulo, entidad, detalle, IP..." onChange={e=>setFilters(f=>({...f,q:e.target.value}))}/>
      {currentUser?.rol==="Administrador"&&<select value={filters.empresa_id} onChange={e=>setFilters(f=>({...f,empresa_id:e.target.value}))}><option value="">Todas las empresas</option>{catalog.empresas.map(x=><option key={x.id} value={x.id}>{x.nombre} — {x.nit||""}</option>)}</select>}
      <select value={filters.usuario_id} onChange={e=>setFilters(f=>({...f,usuario_id:e.target.value}))}><option value="">Todos los usuarios</option>{catalog.usuarios.map(x=><option key={x.id} value={x.id}>{[x.nombre,x.apellido].filter(Boolean).join(" ")} — {x.correo}</option>)}</select>
      <select value={filters.modulo} onChange={e=>setFilters(f=>({...f,modulo:e.target.value}))}><option value="">Todos los módulos</option>{catalog.modulos.map(x=><option key={x} value={x}>{x}</option>)}</select>
      <select value={filters.accion} onChange={e=>setFilters(f=>({...f,accion:e.target.value}))}><option value="">Todas las acciones</option>{catalog.acciones.map(x=><option key={x} value={x}>{x}</option>)}</select>
      <label>Desde<input type="date" value={filters.fecha_desde} onChange={e=>setFilters(f=>({...f,fecha_desde:e.target.value}))}/></label>
      <label>Hasta<input type="date" value={filters.fecha_hasta} onChange={e=>setFilters(f=>({...f,fecha_hasta:e.target.value}))}/></label>
      <select value={filters.limit} onChange={e=>setFilters(f=>({...f,limit:e.target.value}))}><option value="25">25</option><option value="50">50</option><option value="100">100</option></select>
      <button className="secondary" onClick={clearFilters}>Limpiar</button>
    </div>
    <div className="table-meta">{loading?"Consultando auditoría...":`${Number(summary.total||0).toLocaleString()} evento(s) encontrado(s) · página ${page} de ${pages}`}</div>
    <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Empresa</th><th>Usuario</th><th>Acción</th><th>Módulo</th><th>Registro</th><th>Resultado</th><th>IP</th><th></th></tr></thead><tbody>
      {rows.length===0?<tr><td colSpan="9" className="empty-cell">No hay eventos para los filtros seleccionados.</td></tr>:rows.map(r=><tr key={r.id}>
        <td>{formatColombiaDate(r.fecha)}</td><td>{r.empresa||"—"}</td><td><b>{r.usuario||"—"}</b><small>{r.usuario_correo||""}</small></td><td><span className="audit-action">{r.accion}</span></td><td>{r.modulo||"—"}</td><td>{r.entidad?`${r.entidad}${r.entidad_id?` #${r.entidad_id}`:""}`:(r.detalle||"—")}</td><td><span className={`status ${r.resultado==="OK"?"active":"inactive"}`}>{r.resultado||"OK"}</span></td><td>{r.ip||"—"}</td><td><button className="secondary audit-detail-btn" onClick={()=>setDetail(r)}>Ver</button></td>
      </tr>)}
    </tbody></table></div>
    <div className="audit-pagination"><button className="secondary" disabled={page<=1||loading} onClick={()=>load(page-1)}>Anterior</button><span>Página {page} / {pages}</span><button className="secondary" disabled={page>=pages||loading} onClick={()=>load(page+1)}>Siguiente</button></div>
    {detail&&<Modal title={`Detalle de auditoría #${detail.id}`} onClose={()=>setDetail(null)} wide><div className="audit-detail">
      <div className="audit-detail-grid"><div><small>Fecha (Colombia)</small><b>{formatColombiaDate(detail.fecha)}</b></div><div><small>Usuario</small><b>{detail.usuario||"Sistema"}</b></div><div><small>Empresa</small><b>{detail.empresa||"—"}</b></div><div><small>Acción</small><b>{detail.accion}</b></div><div><small>Módulo</small><b>{detail.modulo||"—"}</b></div><div><small>Resultado</small><b>{detail.resultado||"OK"}</b></div><div><small>Entidad</small><b>{detail.entidad?`${detail.entidad}${detail.entidad_id?` #${detail.entidad_id}`:""}`:"—"}</b></div><div><small>IP</small><b>{detail.ip||"—"}</b></div><div><small>Método / Ruta</small><b>{[detail.metodo,detail.ruta].filter(Boolean).join(" ")||"—"}</b></div></div>
      <div className="audit-detail-block"><small>Detalle</small><p>{detail.detalle||"Sin detalle adicional."}</p></div>
      {(detail.datos_antes||detail.datos_despues)&&<div className="audit-before-after"><div><small>Datos antes</small><pre>{jsonView(detail.datos_antes)}</pre></div><div><small>Datos después</small><pre>{jsonView(detail.datos_despues)}</pre></div></div>}
      {detail.user_agent&&<div className="audit-detail-block"><small>Navegador / User-Agent</small><p>{detail.user_agent}</p></div>}
      <div className="actions"><button className="secondary" onClick={()=>setDetail(null)}>Cerrar</button></div>
    </div></Modal>}
  </section>;
}



function ModuleDashboard({ eyebrow, title, cards, breakdown = [] }) {
  return (
    <div className="module-dashboard">
      <div className="module-dashboard-head">
        <div><span className="eyebrow">{eyebrow}</span><h3>{title}</h3></div>
      </div>
      <div className="module-dashboard-cards">
        {cards.map(({ label, value, tone = "neutral", hint }) => (
          <div className={`module-kpi ${tone}`} key={label}>
            <span>{label}</span><b>{value}</b>{hint && <small>{hint}</small>}
          </div>
        ))}
      </div>
      {breakdown.length > 0 && (
        <div className="module-breakdown">
          {breakdown.map(({ label, value, percent, tone = "green" }) => (
            <div className="breakdown-item" key={label}>
              <div><span>{label}</span><b>{value}</b></div>
              <div className="breakdown-bar"><i className={tone} style={{width:`${Math.max(0, Math.min(100, Number(percent)||0))}%`}} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClientsPage({ currentUser, setSection }) {
  const [clients, setClients] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [filters, setFilters] = useState({ q: "", estado: "", empresa_id: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canCreate = currentUser.permisos.includes("clientes.crear");
  const canEdit = currentUser.permisos.includes("clientes.editar");
  const canDelete = currentUser.permisos.includes("clientes.eliminar");
  const canExport = currentUser.permisos.includes("clientes.exportar");
  const isAdmin = currentUser.rol === "Administrador";

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (filters.estado !== "") params.set("estado", filters.estado);
      if (isAdmin && filters.empresa_id) params.set("empresa_id", filters.empresa_id);
      const data = await api(`/api/clientes?${params.toString()}`);
      setClients(data.clientes || []);
      setError("");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  async function loadCompanies() {
    if (!isAdmin) return;
    try {
      const data = await api("/api/companies");
      setCompanies((data.empresas || []).filter(c => c.estado));
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { loadCompanies(); }, []);
  useEffect(() => { load(); }, [filters.q, filters.estado, filters.empresa_id]);

  async function removeClient(client) {
    const action = client.estado ? "desactivar" : "activar";
    if (!window.confirm(`¿${action.charAt(0).toUpperCase()+action.slice(1)} el cliente "${client.nombre}"?`)) return;
    try { await api(`/api/clientes/${client.id}`, { method: "DELETE" }); await load(); }
    catch (err) { alert(err.message); }
  }

  async function exportClients() {
    try {
      const params = new URLSearchParams();
      if (filters.q.trim()) params.set("q", filters.q.trim());
      if (filters.estado !== "") params.set("estado", filters.estado);
      if (isAdmin && filters.empresa_id) params.set("empresa_id", filters.empresa_id);
      const response = await fetch(`/api/clientes/export?${params.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error("No fue posible exportar");
      const blob = await response.blob(), url = URL.createObjectURL(blob), anchor = document.createElement("a");
      anchor.href = url; anchor.download = "clientes-itgps.csv"; anchor.click(); URL.revokeObjectURL(url);
    } catch (err) { alert(err.message); }
  }

  function ClientForm({ client, onClose }) {
    const [form, setForm] = useState({
      empresa_id: client?.empresa_id || currentUser.empresa_id,
      codigo: client?.codigo || "",
      nombre: client?.nombre || "",
      nit: client?.nit || "",
      digito_verificacion: client?.digito_verificacion || "",
      tipo_cliente: client?.tipo_cliente || "Empresa",
      razon_social: client?.razon_social || "",
      nombre_comercial: client?.nombre_comercial || "",
      actividad_economica: client?.actividad_economica || "",
      contacto: client?.contacto || "",
      telefono: client?.telefono || "",
      correo: client?.correo || "",
      direccion: client?.direccion || "",
      ciudad: client?.ciudad || "",
      departamento: client?.departamento || "",
      sitio_web: client?.sitio_web || "",
      estado: client?.estado ?? 1,
      observaciones: client?.observaciones || ""
    });
    const [saving, setSaving] = useState(false);

    function update(field, value) { setForm(current => ({ ...current, [field]: value })); }

    async function save(event) {
      event.preventDefault();
      if (form.tipo_cliente === "Empresa" && !form.razon_social.trim() && !form.nombre.trim()) {
        alert("Ingrese la razón social o nombre del cliente."); return;
      }
      setSaving(true);
      try {
        const payload = { ...form, empresa_id: Number(form.empresa_id), estado: Number(form.estado) };
        if (client?.id) await api(`/api/clientes/${client.id}`, { method: "PUT", body: JSON.stringify(payload) });
        else await api("/api/clientes", { method: "POST", body: JSON.stringify(payload) });
        onClose(); await load();
      } catch (err) { alert(err.message); }
      finally { setSaving(false); }
    }

    const corporate = form.tipo_cliente === "Empresa" || form.tipo_cliente === "Entidad pública";
    return <form onSubmit={save} className="client-corporate-form">
      <div className="form-section-title">Empresa y clasificación</div>
      <div className="form-grid form-grid-3">
        {isAdmin && <label>Empresa <span className="required">*</span><select value={form.empresa_id} onChange={e=>update("empresa_id",e.target.value)} required>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}
        <label>Código<input value={form.codigo} onChange={e=>update("codigo",e.target.value)} placeholder="CLI-0001" /></label>
        <label>Tipo de cliente<select value={form.tipo_cliente} onChange={e=>update("tipo_cliente",e.target.value)}><option>Empresa</option><option>Persona</option><option>Entidad pública</option><option>Otro</option></select></label>
      </div>

      <div className="form-section-title">{corporate ? "Identificación corporativa" : "Identificación"}</div>
      <div className="form-grid form-grid-3">
        <label>Razón social {corporate && <span className="required">*</span>}<input value={form.razon_social} onChange={e=>update("razon_social",e.target.value)} placeholder="Razón social registrada" /></label>
        <label>Nombre comercial<input value={form.nombre_comercial} onChange={e=>update("nombre_comercial",e.target.value)} placeholder="Nombre comercial" /></label>
        <label>NIT / Identificación<input value={form.nit} onChange={e=>update("nit",e.target.value)} placeholder="Ej: 900123456" /></label>
        <label>Dígito de verificación<input value={form.digito_verificacion} onChange={e=>update("digito_verificacion",e.target.value)} maxLength="2" /></label>
        <label>Actividad económica<input value={form.actividad_economica} onChange={e=>update("actividad_economica",e.target.value)} placeholder="CIIU / actividad" /></label>
        <label>Nombre / referencia<input value={form.nombre} onChange={e=>update("nombre",e.target.value)} required placeholder="Nombre que verá la plataforma" /></label>
      </div>

      <div className="form-section-title">Ubicación y contacto general</div>
      <div className="form-grid form-grid-3">
        <label>Departamento<input value={form.departamento} onChange={e=>update("departamento",e.target.value)} /></label>
        <label>Ciudad<input value={form.ciudad} onChange={e=>update("ciudad",e.target.value)} /></label>
        <label>Teléfono<input value={form.telefono} onChange={e=>update("telefono",e.target.value)} /></label>
        <label>Correo<input type="email" value={form.correo} onChange={e=>update("correo",e.target.value)} /></label>
        <label>Sitio web<input value={form.sitio_web} onChange={e=>update("sitio_web",e.target.value)} placeholder="https://..." /></label>
        <label>Dirección<input value={form.direccion} onChange={e=>update("direccion",e.target.value)} /></label>
        <label className="full-field">Contacto general <small>Opcional. En clientes Persona puede ser el mismo cliente.</small><input value={form.contacto} onChange={e=>update("contacto",e.target.value)} placeholder="Nombre del contacto general" /></label>
      </div>

      <div className="form-section-title">Estado y observaciones</div>
      <div className="form-grid form-grid-2">
        {client?.id && <label>Estado<select value={form.estado} onChange={e=>update("estado",e.target.value)}><option value="1">Activo</option><option value="0">Inactivo</option></select></label>}
        <label className="full-field">Observaciones<textarea value={form.observaciones} onChange={e=>update("observaciones",e.target.value)} rows="3" /></label>
      </div>

      {client?.id && <div className="client-contact-note"><UsersRound size={18}/><div><b>Contactos corporativos</b><span>Se administran desde la ficha del cliente. Este formulario no crea contactos.</span></div></div>}

      <div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?"Guardando...":"Guardar cliente"}</button></div>
    </form>;
  }


  function ClientCorporateDetail({ client, onClose }) {
    const [data,setData]=useState(null),[contactList,setContactList]=useState([]),[busy,setBusy]=useState(true),[detailError,setDetailError]=useState(""),[contactModal,setContactModal]=useState(null);
    const contactTypes=["Comercial","Administrativo","Técnico","Facturación","Gerencia","Otro"];

    async function loadDetail(){
      setBusy(true); setDetailError("");
      try{
        const [x,c]=await Promise.all([api(`/api/clientes/${client.id}/resumen`),api(`/api/clientes/${client.id}/contactos`)]);
        setData(x); setContactList(c.contactos||[]);
      }catch(e){setDetailError(e.message)}finally{setBusy(false)}
    }
    useEffect(()=>{loadDetail()},[client.id]);

    const resumen=data?.resumen||{};
    const contacts=contactList.filter(c=>c.estado);
    function go(key){
      localStorage.setItem("itgps_cliente_context",JSON.stringify({id:client.id,nombre:client.nombre}));
      onClose(); setSection(key);
    }
    function emptyContact(){return {nombre:"",cargo:"",tipo_contacto:"Comercial",telefono:"",celular:"",correo:"",principal:0,estado:1,observaciones:""};}

    function ContactForm({value,onClose:closeContact}){
      const [f,setF]=useState(value||emptyContact());
      const [savingContact,setSavingContact]=useState(false);
      const change=(k,v)=>setF(x=>({...x,[k]:v}));
      async function saveContact(e){
        e.preventDefault(); setSavingContact(true);
        try{
          const payload={...f,principal:Number(f.principal),estado:Number(f.estado)};
          if(f.id) await api(`/api/clientes/${client.id}/contactos/${f.id}`,{method:"PUT",body:JSON.stringify(payload)});
          else await api(`/api/clientes/${client.id}/contactos`,{method:"POST",body:JSON.stringify(payload)});
          closeContact(); await loadDetail();
        }catch(err){alert(err.message)}finally{setSavingContact(false)}
      }
      return <form onSubmit={saveContact} className="contact-form">
        <div className="contact-owner-banner"><UsersRound size={18}/><div><b>{client.razon_social||client.nombre}</b><span>El contacto quedará asociado automáticamente a este cliente.</span></div></div>
        <div className="form-section-title">Datos del contacto</div>
        <div className="form-grid form-grid-2">
          <label>Nombre <span className="required">*</span><input value={f.nombre} onChange={e=>change("nombre",e.target.value)} required /></label>
          <label>Cargo<input value={f.cargo} onChange={e=>change("cargo",e.target.value)} /></label>
          <label>Función<select value={f.tipo_contacto} onChange={e=>change("tipo_contacto",e.target.value)}>{contactTypes.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Correo<input type="email" value={f.correo} onChange={e=>change("correo",e.target.value)} /></label>
          <label>Teléfono<input value={f.telefono} onChange={e=>change("telefono",e.target.value)} /></label>
          <label>Celular<input value={f.celular} onChange={e=>change("celular",e.target.value)} /></label>
        </div>
        <label className="full-field">Observaciones<textarea value={f.observaciones} onChange={e=>change("observaciones",e.target.value)} /></label>
        <div className="form-grid form-grid-2">
          <label>Contacto principal<select value={f.principal} onChange={e=>change("principal",e.target.value)}><option value="1">Sí</option><option value="0">No</option></select></label>
          {f.id && <label>Estado<select value={f.estado} onChange={e=>change("estado",e.target.value)}><option value="1">Activo</option><option value="0">Inactivo</option></select></label>}
        </div>
        <div className="actions"><button type="button" className="secondary" onClick={closeContact}>Cancelar</button><button className="primary" disabled={savingContact}>{savingContact?"Guardando...":"Guardar contacto"}</button></div>
      </form>;
    }

    return <div className="corporate-detail">
      {detailError&&<div className="err">{detailError}</div>}
      <div className="corporate-hero">
        <div><span className="eyebrow">CLIENTE CORPORATIVO</span><h3>{client.razon_social||client.nombre}</h3><p>{client.nombre_comercial||"Sin nombre comercial"} · NIT {client.nit||"Sin NIT"}{client.digito_verificacion?`-${client.digito_verificacion}`:""}</p></div>
        <span className={client.estado?"status active":"status inactive"}>{client.estado?"Activo":"Inactivo"}</span>
      </div>
      <div className="corporate-kpis">
        {[['Activos',resumen.activos||0,'activos',Car],['Equipos GPS',resumen.equipos||0,'equipos',Cpu],['SIM / M2M',resumen.sims||0,'sim',Smartphone],['Contactos',resumen.contactos||0,null,UsersRound]].map(([label,value,key,Icon])=><button key={label} type="button" className="corporate-kpi" onClick={()=>key&&go(key)} disabled={!key}><Icon size={19}/><b>{Number(value).toLocaleString('es-CO')}</b><span>{label}</span></button>)}
      </div>
      <div className="form-section-title">Información corporativa</div>
      <div className="corporate-info-grid">
        <div><small>Razón social</small><b>{client.razon_social||"—"}</b></div><div><small>Nombre comercial</small><b>{client.nombre_comercial||"—"}</b></div>
        <div><small>Actividad económica</small><b>{client.actividad_economica||"—"}</b></div><div><small>Ubicación</small><b>{[client.ciudad,client.departamento].filter(Boolean).join(", ")||"—"}</b></div>
        <div><small>Dirección</small><b>{client.direccion||"—"}</b></div><div><small>Contacto general</small><b>{client.contacto||"—"}</b></div>
        <div><small>Correo</small><b>{client.correo||"—"}</b></div><div><small>Teléfono</small><b>{client.telefono||"—"}</b></div>
      </div>
      <div className="form-section-title contact-section-heading"><span>Contactos por función</span><button type="button" className="primary" onClick={()=>setContactModal({new:true})}><Plus/> Nuevo contacto</button></div>
      <div className="corporate-contacts-grid">
        {contactTypes.map(type=>{
          const grouped=contacts.filter(x=>x.tipo_contacto===type).sort((a,b)=>(Number(b.principal)-Number(a.principal)) || String(a.nombre||"").localeCompare(String(b.nombre||""),"es"));
          return <div className="corporate-contact-group" key={type}>
            <div className="corporate-contact-group-header"><div className="contact-type">{type}</div><span className="contact-count">{grouped.length}</span></div>
            {grouped.length ? <div className="corporate-contact-group-list">{grouped.map(c=><div className="corporate-contact-card" key={c.id}>
              <div><b>{c.nombre}</b><small>{c.cargo||"Sin cargo"}</small><small>{c.correo||c.celular||c.telefono||"Sin datos de contacto"}</small></div>
              <div className="contact-card-actions">{c.principal&&<span className="status active">Principal</span>}<button type="button" title="Editar contacto" onClick={()=>setContactModal(c)}><Pencil/></button><button type="button" title="Desactivar contacto" onClick={async()=>{if(confirm(`¿Desactivar el contacto ${c.nombre}?`)){try{await api(`/api/clientes/${client.id}/contactos/${c.id}`,{method:"DELETE"});await loadDetail()}catch(e){alert(e.message)}}}}><Power/></button></div>
            </div>)}</div> : <span className="contact-empty">Sin contactos registrados</span>}
          </div>;
        })}
      </div>
      <div className="form-section-title">Relaciones comerciales</div>
      <div className="corporate-roadmap">{[["Servicios","16.2",true],["Planes","16.3",true],["Cotizaciones","16.4",false],["Contratos","16.5",false],["Suscripciones","16.6",false],["Facturación","16.7",false],["Renovaciones","16.8",false]].map(([label,phase,enabled])=><div className={enabled?"roadmap-item ready":"roadmap-item locked"} key={label}><span>{label}</span><small>{enabled?"Disponible":`Fase ${phase}`}</small></div>)}</div>
      <div className="form-section-title">Accesos operacionales</div>
      <div className="corporate-actions"><button type="button" className="secondary" onClick={()=>go("activos")}><Car/> Ver activos</button><button type="button" className="secondary" onClick={()=>go("equipos")}><Cpu/> Ver equipos GPS</button><button type="button" className="secondary" onClick={()=>go("sim")}><Smartphone/> Ver SIM / M2M</button><button type="button" className="secondary" onClick={()=>{onClose();setModal(client)}}><Pencil/> Editar ficha</button></div>
      {busy&&<div className="empty-cell">Cargando resumen del cliente...</div>}
      <div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cerrar</button></div>
      {contactModal&&<Modal title={contactModal.id?"Editar contacto":"Nuevo contacto corporativo"} onClose={()=>setContactModal(null)}><ContactForm value={contactModal.id?contactModal:null} onClose={()=>setContactModal(null)}/></Modal>}
    </div>;
  }


  return <section className="card clients-page">
    <div className="head">
      <div><h2>Clientes</h2><p>Clientes corporativos y administración de relaciones comerciales.</p></div>
      <div className="toolbar-actions">{canExport && <button className="secondary" onClick={exportClients}>Exportar CSV</button>}{canCreate && <button className="primary" onClick={()=>setModal({})}><Plus/> Nuevo cliente</button>}</div>
    </div>
    {error && <div className="err">{error}</div>}
    <ModuleDashboard
      eyebrow="CONTROL DE CLIENTES"
      title="Estado de la cartera de clientes"
      cards={[
        {label:"Total", value:clients.length, tone:"neutral", hint:"registros visibles"},
        {label:"Activos", value:clients.filter(x=>Number(x.estado)===1).length, tone:"success", hint:"clientes operativos"},
        {label:"Inactivos", value:clients.filter(x=>Number(x.estado)===0).length, tone:"warning", hint:"requieren revisión"},
        {label:"Con contacto", value:clients.filter(x=>String(x.contacto||x.correo||x.telefono).trim()).length, tone:"info", hint:"información disponible"}
      ]}
      breakdown={[
        {label:"Activos", value:clients.filter(x=>Number(x.estado)===1).length, percent:clients.length?clients.filter(x=>Number(x.estado)===1).length*100/clients.length:0, tone:"green"},
        {label:"Inactivos", value:clients.filter(x=>Number(x.estado)===0).length, percent:clients.length?clients.filter(x=>Number(x.estado)===0).length*100/clients.length:0, tone:"amber"}
      ]}
    />
    <div className="filters">
      <input placeholder="Buscar por nombre, NIT, contacto, correo..." value={filters.q} onChange={e=>setFilters(f=>({...f,q:e.target.value}))}/>
      <select value={filters.estado} onChange={e=>setFilters(f=>({...f,estado:e.target.value}))}><option value="1">Activos</option><option value="0">Inactivos</option><option value="">Todos</option></select>
      {isAdmin && <select value={filters.empresa_id} onChange={e=>setFilters(f=>({...f,empresa_id:e.target.value}))}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}
      <button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button>
    </div>
    <div className="table-meta">{clients.length} cliente(s) encontrado(s)</div>
    <div className="table-wrap"><table><thead><tr><th>Código</th><th>Cliente corporativo</th>{isAdmin&&<th>Empresa</th>}<th>NIT</th><th>Contacto</th><th>Teléfono</th><th>Ciudad</th><th>Tipo</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>{clients.length===0?<tr><td colSpan={isAdmin?10:9} className="empty-cell">No hay clientes para los filtros seleccionados.</td></tr>:clients.map(c=><tr key={c.id}>
        <td>{c.codigo||"—"}</td><td><b>{c.razon_social||c.nombre}</b><small>{c.nombre_comercial||c.correo||""}</small></td>{isAdmin&&<td>{c.empresa}</td>}<td>{c.nit||"—"}{c.digito_verificacion?`-${c.digito_verificacion}`:""}</td><td>{c.contacto||"—"}</td><td>{c.telefono||"—"}</td><td>{c.ciudad||"—"}</td><td>{c.tipo_cliente}</td><td><span className={c.estado?"status active":"status inactive"}>{c.estado?"Activo":"Inactivo"}</span></td>
        <td className="row-actions">
          {canEdit && <button type="button" className="secondary contact-table-btn" title="Administrar contactos" onClick={()=>setDetail(c)}><UsersRound/><span>Contactos</span></button>}
          <button type="button" className="secondary contact-table-btn" title="Ver ficha corporativa" onClick={()=>setDetail(c)}><span>Ver ficha</span></button>
          {canEdit&&<button type="button" title="Editar" onClick={()=>setModal(c)}><Pencil/></button>}
          {canDelete&&<button type="button" title={c.estado ? "Desactivar cliente" : "Activar cliente"} onClick={()=>removeClient(c)}><Power/></button>}
        </td>
      </tr>)}</tbody></table></div>
    {modal&&<Modal title={modal.id?"Editar cliente corporativo":"Nuevo cliente corporativo"} onClose={()=>setModal(null)} wide><ClientForm client={modal.id?modal:null} onClose={()=>setModal(null)}/></Modal>}
    {detail&&<Modal title={`Ficha corporativa — ${detail.razon_social||detail.nombre}`} onClose={()=>setDetail(null)} wide><ClientCorporateDetail client={detail} onClose={()=>setDetail(null)}/></Modal>}
  </section>;
}



function FlujoComercialPage({ currentUser }) {
  const [data,setData]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState(""),[q,setQ]=useState("");
  const money=v=>Number(v||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0});
  async function load(){setLoading(true);try{const p=q.trim()?`?q=${encodeURIComponent(q.trim())}`:"";setData(await api(`/api/comercial/flujo${p}`));setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{load()},[]);
  const go=section=>window.dispatchEvent(new CustomEvent("itgps:navegar",{detail:{section}}));
  const c=data?.counts||{};
  const steps=[
    ["Prospectos",c.prospectos,"prospectos"],["Cotizaciones",c.cotizaciones,"cotizaciones"],["Aceptadas",c.cotizaciones_aceptadas,"cotizaciones"],
    ["Clientes",c.clientes,"clientes"],["Contratos activos",c.contratos_activos,"contratos"],["Suscripciones activas",c.suscripciones_activas,"suscripciones"],["Facturas pendientes",c.facturas_pendientes,"facturas"]
  ];
  return <section className="card clients-page services-page commercial-flow-page">
    <div className="head"><div><span className="eyebrow">CONSOLIDACIÓN COMERCIAL · FASE 25</span><h2>Flujo comercial</h2><p>Visión unificada del recorrido comercial desde el prospecto hasta la facturación y cartera.</p></div><div className="toolbar-actions"><button className="secondary" onClick={load}>{loading?"Actualizando...":"Actualizar"}</button></div></div>
    {error&&<div className="err">{error}</div>}
    <div className="commercial-steps">{steps.map((x,i)=><React.Fragment key={x[0]}><button type="button" className="commercial-step" onClick={()=>go(x[2])}><span className="step-index">{i+1}</span><div><small>{x[0]}</small><b>{x[1]||0}</b></div></button>{i<steps.length-1&&<ArrowRight className="step-arrow"/>}</React.Fragment>)}</div>
    <div className="filters"><input placeholder="Buscar prospecto por nombre, NIT, contacto o correo..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()}/><button className="secondary" onClick={load}>Buscar</button></div>
    <div className="dashboard-grid financial-grid">
      <section className="card dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">OPORTUNIDADES</span><h2>Prospectos pendientes</h2></div></div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Prospecto</th><th>Etapa</th><th>Última cotización</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{(data?.prospectos||[]).length===0?<tr><td colSpan="6" className="empty-cell">No hay prospectos pendientes.</td></tr>:(data?.prospectos||[]).map(x=><tr key={x.id}><td>{x.codigo||"—"}</td><td><b>{x.nombre}</b></td><td>{x.etapa||"—"}</td><td>{x.cotizacion_codigo||"—"}</td><td>{x.cotizacion_estado||"Sin cotización"}</td><td><button className="secondary" onClick={()=>go("prospectos")}>Abrir</button></td></tr>)}</tbody></table></div></section>
      <section className="card dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">CLIENTES</span><h2>Continuidad del negocio</h2></div></div><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Cotización</th><th>Contrato</th><th>Suscripción</th><th>Factura</th><th>Acción</th></tr></thead><tbody>{(data?.clientes||[]).length===0?<tr><td colSpan="6" className="empty-cell">No hay clientes activos.</td></tr>:(data?.clientes||[]).map(x=><tr key={x.id}><td><b>{x.razon_social||x.nombre_comercial||x.nombre}</b><small>{x.codigo||""}</small></td><td>{x.cotizacion_aceptada||<Circle size={15}/>}</td><td>{x.contrato_codigo||<Circle size={15}/>}</td><td>{x.suscripcion_codigo||<Circle size={15}/>}</td><td>{x.factura_codigo||<Circle size={15}/>}</td><td><button className="secondary" onClick={()=>go(x.factura_id?"facturas":x.suscripcion_id?"suscripciones":x.contrato_id?"contratos":"clientes")}>Abrir</button></td></tr>)}</tbody></table></div></section>
    </div>
    <div className="commercial-flow-note"><CheckCircle2/><div><b>Integración V1</b><span>El concentrador no duplica la información: consulta los módulos comerciales existentes y conserva sus reglas, permisos y datos.</span></div></div>
  </section>;
}

function ServicesPage({ currentUser }) {
  const [items,setItems]=useState([]),[companies,setCompanies]=useState([]),[modal,setModal]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const [filters,setFilters]=useState({q:"",estado:"1",empresa_id:""});
  const isAdmin=currentUser.rol==="Administrador";
  const canCreate=currentUser.permisos.includes("servicios.crear"), canEdit=currentUser.permisos.includes("servicios.editar"), canDelete=currentUser.permisos.includes("servicios.eliminar"), canExport=currentUser.permisos.includes("servicios.exportar");
  const categories=["GPS y monitoreo","M2M / Conectividad","Plataforma","Soporte y mantenimiento","Instalación","Consultoría","Otro"];
  const modalities=["Recurrente","Único","Por consumo","Mixto"];
  const periods=["Mensual","Bimestral","Trimestral","Semestral","Anual","Único"];
  async function load(){setLoading(true);try{const p=new URLSearchParams();if(filters.q.trim())p.set("q",filters.q.trim());if(filters.estado!=="")p.set("estado",filters.estado);if(isAdmin&&filters.empresa_id)p.set("empresa_id",filters.empresa_id);const d=await api(`/api/servicios?${p}`);setItems(d.servicios||[]);setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  async function loadCompanies(){if(!isAdmin)return;try{const d=await api("/api/companies");setCompanies((d.empresas||[]).filter(x=>x.estado))}catch(e){setError(e.message)}}
  useEffect(()=>{loadCompanies()},[]);useEffect(()=>{load()},[filters.q,filters.estado,filters.empresa_id]);
  async function toggle(item){const action=item.estado?"desactivar":"activar";if(!confirm(`¿${action.charAt(0).toUpperCase()+action.slice(1)} el servicio "${item.nombre}"?`))return;try{await api(`/api/servicios/${item.id}`,{method:"DELETE"});await load()}catch(e){alert(e.message)}}
  async function exportCsv(){try{const p=new URLSearchParams();if(filters.q.trim())p.set("q",filters.q.trim());if(filters.estado!=="")p.set("estado",filters.estado);if(isAdmin&&filters.empresa_id)p.set("empresa_id",filters.empresa_id);const r=await fetch(`/api/servicios/export?${p}`,{credentials:"include"});if(!r.ok)throw new Error("No fue posible exportar");const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="servicios-itgps.csv";a.click();URL.revokeObjectURL(u)}catch(e){alert(e.message)}}
  function Form({item,onClose}){
    const [f,setF]=useState({empresa_id:item?.empresa_id||currentUser.empresa_id,codigo:item?.codigo||"",nombre:item?.nombre||"",categoria:item?.categoria||"GPS y monitoreo",descripcion:item?.descripcion||"",modalidad:item?.modalidad||"Recurrente",periodicidad:item?.periodicidad||"Mensual",precio_base:item?.precio_base??0,estado:item?.estado??1,observaciones:item?.observaciones||""});
    const [saving,setSaving]=useState(false);const change=(k,v)=>setF(x=>({...x,[k]:v}));
    async function save(e){e.preventDefault();if(!f.nombre.trim()){alert("Ingrese el nombre del servicio.");return}setSaving(true);try{const body={...f,empresa_id:Number(f.empresa_id),precio_base:Number(f.precio_base||0),estado:Number(f.estado)};if(item?.id)await api(`/api/servicios/${item.id}`,{method:"PUT",body:JSON.stringify(body)});else await api("/api/servicios",{method:"POST",body:JSON.stringify(body)});onClose();await load()}catch(e){alert(e.message)}finally{setSaving(false)}}
    return <form onSubmit={save} className="service-form">
      <div className="form-section-title">Identificación del servicio</div><div className="form-grid form-grid-3">
        {isAdmin&&<label>Empresa <span className="required">*</span><select value={f.empresa_id} onChange={e=>change("empresa_id",e.target.value)} required>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}
        <label>Código<input value={f.codigo} onChange={e=>change("codigo",e.target.value)} placeholder="SRV-0001"/></label>
        <label>Estado<select value={f.estado} onChange={e=>change("estado",e.target.value)}><option value="1">Activo</option><option value="0">Inactivo</option></select></label>
        <label className="full-field">Nombre del servicio <span className="required">*</span><input value={f.nombre} onChange={e=>change("nombre",e.target.value)} placeholder="Monitoreo GPS vehicular" required/></label>
        <label>Categoría<select value={f.categoria} onChange={e=>change("categoria",e.target.value)}>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
      </div>
      <div className="form-section-title">Modalidad comercial</div><div className="form-grid form-grid-3">
        <label>Modalidad<select value={f.modalidad} onChange={e=>change("modalidad",e.target.value)}>{modalities.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Periodicidad<select value={f.periodicidad} onChange={e=>change("periodicidad",e.target.value)}>{periods.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Precio base (COP)<input type="number" min="0" step="1" value={f.precio_base} onChange={e=>change("precio_base",e.target.value)}/></label>
        <label className="full-field">Descripción<textarea rows="3" value={f.descripcion} onChange={e=>change("descripcion",e.target.value)} placeholder="Qué incluye el servicio, alcance y condiciones comerciales."/></label>
      </div>
      <div className="form-section-title">Observaciones</div><label className="full-field"><textarea rows="3" value={f.observaciones} onChange={e=>change("observaciones",e.target.value)} placeholder="Notas internas del catálogo."/></label>
      <div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?"Guardando...":"Guardar servicio"}</button></div>
    </form>
  }
  return <section className="card clients-page services-page"><div className="head"><div><span className="eyebrow">ADMINISTRACIÓN COMERCIAL · FASE 16.2</span><h2>Servicios</h2><p>Catálogo de servicios que IT GPS puede comercializar a sus clientes.</p></div><div className="toolbar-actions">{canExport&&<button className="secondary" onClick={exportCsv}>Exportar CSV</button>}{canCreate&&<button className="primary" onClick={()=>setModal({})}><Plus/> Nuevo servicio</button>}</div></div>
    {error&&<div className="err">{error}</div>}
    <div className="filters"><input placeholder="Buscar por código, nombre, categoría..." value={filters.q} onChange={e=>setFilters(x=>({...x,q:e.target.value}))}/><select value={filters.estado} onChange={e=>setFilters(x=>({...x,estado:e.target.value}))}><option value="1">Activos</option><option value="0">Inactivos</option><option value="">Todos</option></select>{isAdmin&&<select value={filters.empresa_id} onChange={e=>setFilters(x=>({...x,empresa_id:e.target.value}))}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}<button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button></div>
    <div className="table-meta">{items.length} servicio(s) encontrado(s)</div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Servicio</th>{isAdmin&&<th>Empresa</th>}<th>Categoría</th><th>Modalidad</th><th>Periodicidad</th><th>Precio base</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan={isAdmin?9:8} className="empty-cell">No hay servicios para los filtros seleccionados.</td></tr>:items.map(x=><tr key={x.id}><td>{x.codigo||"—"}</td><td><b>{x.nombre}</b><small>{x.descripcion||""}</small></td>{isAdmin&&<td>{x.empresa}</td>}<td>{x.categoria}</td><td>{x.modalidad}</td><td>{x.periodicidad}</td><td>{Number(x.precio_base||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td><span className={x.estado?"status active":"status inactive"}>{x.estado?"Activo":"Inactivo"}</span></td><td className="row-actions">{canEdit&&<button type="button" title="Editar" onClick={()=>setModal(x)}><Pencil/></button>}{canDelete&&<button type="button" title={x.estado?"Desactivar servicio":"Activar servicio"} onClick={()=>toggle(x)}><Power/></button>}</td></tr>)}</tbody></table></div>
    {modal&&<Modal wide title={modal.id?"Editar servicio":"Nuevo servicio"} onClose={()=>setModal(null)}><Form item={modal.id?modal:null} onClose={()=>setModal(null)}/></Modal>}
  </section>;
}

function QuotesPage({ currentUser, initialQuote, onInitialQuoteHandled }) {
  const [items,setItems]=useState([]),[clients,setClients]=useState([]),[prospects,setProspects]=useState([]),[services,setServices]=useState([]),[plans,setPlans]=useState([]),[companies,setCompanies]=useState([]),[nextCode,setNextCode]=useState("COT0001"),[modal,setModal]=useState(null),[detail,setDetail]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const isAdmin=currentUser.rol==="Administrador";
  const canCreate=currentUser.permisos.includes("cotizaciones.crear"),canEdit=currentUser.permisos.includes("cotizaciones.editar"),canDelete=currentUser.permisos.includes("cotizaciones.eliminar"),canExport=currentUser.permisos.includes("cotizaciones.exportar");
  const [filters,setFilters]=useState({q:"",estado:"",empresa_id:""});
  async function catalogs(companyId="") { try { const q=isAdmin&&companyId?`?empresa_id=${companyId}`:""; const d=await api(`/api/cotizaciones/catalogos${q}`); setClients(d.clientes||[]); setProspects(d.prospectos||[]); setServices(d.servicios||[]); setPlans(d.planes||[]); setNextCode(d.siguiente_codigo||"COT0001"); if(isAdmin){const c=await api("/api/companies");setCompanies((c.empresas||[]).filter(x=>x.estado));} } catch(e){setError(e.message)} }
  async function load(){setLoading(true);try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v)p.set(k,v)});if(!isAdmin)p.delete("empresa_id");const d=await api(`/api/cotizaciones?${p}`);setItems(d.cotizaciones||[]);setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{catalogs(filters.empresa_id)},[]);useEffect(()=>{load()},[filters.q,filters.estado,filters.empresa_id]);useEffect(()=>{if(!initialQuote)return;const companyId=initialQuote.empresa_id||filters.empresa_id||currentUser.empresa_id;catalogs(companyId).then(()=>setModal({empresa_id:companyId,prospecto_id:initialQuote.prospecto_id||"",cliente_id:"",prospecto_nombre:initialQuote.prospecto_nombre||""})).finally(()=>onInitialQuoteHandled?.())},[initialQuote]);
  async function exportPdf(x){try{await downloadBlob(`/api/cotizaciones/${x.id}/pdf`,`${x.codigo||"cotizacion"}.pdf`,"No fue posible generar o descargar el PDF de la cotización")}catch(e){alert(e.message)}}
  async function sendEmail(x){const to=window.prompt("Correo del cliente:",x.correo||"");if(!to)return;try{const d=await api(`/api/cotizaciones/${x.id}/enviar-email`,{method:"POST",body:JSON.stringify({destinatario:to})});alert(`Cotización enviada correctamente a ${to}.`);await load();}catch(e){alert(e.message)}}
  async function exportCsv(){try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v)p.set(k,v)});const r=await fetch(`/api/cotizaciones/export?${p}`,{credentials:"include"});if(!r.ok)throw new Error("No fue posible exportar");const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="cotizaciones-itgps.csv";a.click();URL.revokeObjectURL(u)}catch(e){alert(e.message)}}
  async function openDetail(x){try{setDetail(await api(`/api/cotizaciones/${x.id}`))}catch(e){alert(e.message)}}
  async function changeState(x,next){if(!confirm(`¿Cambiar la cotización ${x.codigo||x.id} a ${next}?`))return;try{await api(`/api/cotizaciones/${x.id}/estado`,{method:"PATCH",body:JSON.stringify({estado:next})});await load()}catch(e){alert(e.message)}}
  function Form({item,onClose}){
    const [f,setF]=useState({empresa_id:item?.empresa_id||currentUser.empresa_id,cliente_id:item?.cliente_id||"",prospecto_id:item?.prospecto_id||"",codigo:item?.codigo||"",fecha:item?.fecha||new Date().toISOString().slice(0,10),fecha_vencimiento:item?.fecha_vencimiento||"",responsable_id:item?.responsable_id||"",estado:item?.estado||"Borrador",descuento:item?.descuento??0,impuestos:item?.impuestos??0,condiciones:item?.condiciones||"",observaciones:item?.observaciones||""});
    const [quoteItems,setQuoteItems]=useState(item?.detalles?.map(d=>({...d}))||[{servicio_id:"",plan_id:"",descripcion:"",cantidad:1,precio_unitario:0,descuento:0}]);
    const [saving,setSaving]=useState(false);
    const pc=clients.filter(x=>!isAdmin||x.empresa_id===Number(f.empresa_id));
    const ps=plans.filter(x=>!isAdmin||x.empresa_id===Number(f.empresa_id));
    const change=(k,v)=>setF(x=>({...x,[k]:v}));
    const subtotal=quoteItems.reduce((a,d)=>a+Math.max(0,Number(d.cantidad||1))*Math.max(0,Number(d.precio_unitario||0))-Math.max(0,Number(d.descuento||0)),0);
    const total=Math.max(0,subtotal-Number(f.descuento||0)+Number(f.impuestos||0));
    function updateItem(i,k,v){setQuoteItems(ds=>ds.map((d,j)=>j===i?{...d,[k]:v}:d))}
    function chooseService(i,id){
      const serviceId=Number(id||0);
      const current=quoteItems[i];
      const selectedPlan=ps.find(x=>x.id===Number(current?.plan_id));
      if(selectedPlan && Number(selectedPlan.servicio_id)!==serviceId){
        setQuoteItems(ds=>ds.map((d,j)=>j===i?{...d,servicio_id:id,plan_id:"",precio_unitario:0}:d));
      }else updateItem(i,"servicio_id",id);
    }
    function choosePlan(i,id){
      const plan=ps.find(x=>x.id===Number(id));
      setQuoteItems(ds=>ds.map((d,j)=>j===i?{...d,plan_id:id,servicio_id:plan?.servicio_id?String(plan.servicio_id):d.servicio_id,precio_unitario:Number(plan?.precio||0)}:d));
    }
    function addItem(){setQuoteItems(ds=>[...ds,{servicio_id:"",plan_id:"",descripcion:"",cantidad:1,precio_unitario:0,descuento:0}])}
    function removeItem(i){setQuoteItems(ds=>ds.filter((_,j)=>j!==i))}
    async function save(e){
      e.preventDefault();
      if(!f.cliente_id&&!f.prospecto_id)return alert("Seleccione un cliente o un prospecto.");
      if(!f.fecha_vencimiento)return alert("Seleccione la fecha de vencimiento.");
      if(!quoteItems.length)return alert("Agregue al menos un ítem.");
      const cleanItems=quoteItems.map(d=>({...d,servicio_id:Number(d.servicio_id||0)||null,plan_id:Number(d.plan_id||0)||null,cantidad:Number(d.cantidad||1),precio_unitario:Number(d.precio_unitario||0),descuento:Number(d.descuento||0),descripcion:String(d.descripcion||"").trim()}));
      const invalid=cleanItems.find(d=>!d.servicio_id&&!d.plan_id&&!d.descripcion);
      if(invalid)return alert("Cada ítem debe tener servicio, plan o descripción.");
      setSaving(true);
      try{
        const saved=await api(item?.id?`/api/cotizaciones/${item.id}`:"/api/cotizaciones",{method:item?.id?"PUT":"POST",body:JSON.stringify({...f,empresa_id:Number(f.empresa_id),cliente_id:f.cliente_id?Number(f.cliente_id):null,prospecto_id:f.prospecto_id?Number(f.prospecto_id):null,responsable_id:f.responsable_id?Number(f.responsable_id):null,descuento:Number(f.descuento||0),impuestos:Number(f.impuestos||0),detalles:cleanItems})});
        if(!saved?.ok){throw new Error(saved?.error || "El servidor no confirmó el guardado de la cotización.");}
        const savedQuote=saved.cotizacion || (saved.id ? {id:saved.id,codigo:saved.codigo} : null);
        // Confirmar en el listado desde SQLite antes de cerrar el formulario.
        // Esto evita carreras entre setItems(), los efectos de filtros y la recarga.
        if(!item?.id && savedQuote?.id){
          setItems(prev=>[savedQuote,...prev.filter(x=>x.id!==savedQuote.id)]);
        }
        setError("");
        await load();
        onClose();
      }catch(e){setError(e.message||"No fue posible guardar la cotización.");}finally{setSaving(false)}
    }
    return <form onSubmit={save} className="service-form quote-form">
      <div className="form-section-title">Datos de la cotización</div>
      <div className="form-grid form-grid-3 quote-header-grid">
        <label>Destinatario <span className="required">*</span><select value={f.prospecto_id?`p:${f.prospecto_id}`:`c:${f.cliente_id||""}`} onChange={e=>{const [t,v]=String(e.target.value).split(":");if(t==="p"){change("prospecto_id",v);change("cliente_id","")}else{change("cliente_id",v);change("prospecto_id","")}}} required><option value="">Seleccione cliente o prospecto</option><optgroup label="Clientes">{pc.map(c=><option key={`c-${c.id}`} value={`c:${c.id}`}>{c.razon_social||c.nombre_comercial||c.nombre}</option>)}</optgroup><optgroup label="Prospectos">{prospects.map(p=><option key={`p-${p.id}`} value={`p:${p.id}`}>{p.nombre}</option>)}</optgroup></select></label>
        <label>Fecha<input type="date" value={f.fecha} onChange={e=>change("fecha",e.target.value)} required/></label>
        <label>Vencimiento <span className="required">*</span><input type="date" value={f.fecha_vencimiento} min={f.fecha||undefined} onChange={e=>change("fecha_vencimiento",e.target.value)} required/></label>
        {isAdmin&&<label>Empresa<select value={f.empresa_id} onChange={e=>{change("empresa_id",e.target.value);change("cliente_id","");catalogs(e.target.value)}}>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}
        <label>Código<input value={item?.codigo||nextCode} readOnly disabled title="Código generado automáticamente por el sistema"/></label>
        <label>Estado<select value={f.estado} onChange={e=>change("estado",e.target.value)}>{["Borrador","Enviada","Aceptada","Rechazada","Vencida"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="full-field quote-observations">Observaciones generales<textarea rows="3" value={f.observaciones} onChange={e=>change("observaciones",e.target.value)} placeholder="Observaciones o comentarios generales de la cotización..."/></label>
      </div>
      <div className="form-section-title">Detalle comercial</div>
      <div className="quote-items">
        <div className="quote-item-head"><span>Servicio</span><span>Plan</span><span>Descripción</span><span>Cantidad</span><span>Precio unitario</span><span>Descuento</span><span>Subtotal</span><span></span></div>
        {quoteItems.map((d,i)=><div className="quote-item-row" key={i}>
          <select value={d.servicio_id||""} onChange={e=>chooseService(i,e.target.value)}><option value="">Servicio</option>{services.filter(x=>!isAdmin||x.empresa_id===Number(f.empresa_id)).map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select>
          <select value={d.plan_id||""} onChange={e=>choosePlan(i,e.target.value)}><option value="">Plan</option>{ps.filter(x=>!d.servicio_id||Number(x.servicio_id)===Number(d.servicio_id)).map(x=><option key={x.id} value={x.id}>{x.nombre} — {Number(x.precio||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</option>)}</select>
          <input value={d.descripcion||""} onChange={e=>updateItem(i,"descripcion",e.target.value)} placeholder="Detalle del servicio o plan"/>
          <input type="number" min="1" step="1" value={d.cantidad||1} onChange={e=>updateItem(i,"cantidad",e.target.value)}/>
          <input type="number" min="0" step="1" value={d.precio_unitario??0} onChange={e=>updateItem(i,"precio_unitario",e.target.value)}/>
          <input type="number" min="0" step="1" value={d.descuento??0} onChange={e=>updateItem(i,"descuento",e.target.value)}/>
          <div className="quote-item-subtotal">{Math.max(0,Number(d.cantidad||1)*Number(d.precio_unitario||0)-Number(d.descuento||0)).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</div>
          <button type="button" className="secondary quote-remove" onClick={()=>removeItem(i)} disabled={quoteItems.length===1}>Quitar</button>
        </div>)}
      </div>
      <button type="button" className="secondary quote-add" onClick={addItem}>+ Agregar ítem</button>
      <div className="form-section-title">Totales y condiciones</div>
      <div className="form-grid form-grid-3">
        <label>Descuento general (COP)<input type="number" min="0" value={f.descuento} onChange={e=>change("descuento",e.target.value)}/></label>
        <label>Impuestos (COP)<input type="number" min="0" value={f.impuestos} onChange={e=>change("impuestos",e.target.value)}/></label>
        <label>Total (COP)<input value={total.toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})} readOnly/></label>
        <label className="full-field">Condiciones comerciales<textarea rows="3" value={f.condiciones} onChange={e=>change("condiciones",e.target.value)}/></label>
        <label className="full-field">Observaciones<textarea rows="3" value={f.observaciones} onChange={e=>change("observaciones",e.target.value)}/></label>
      </div>
      {error&&<div className="err quote-save-error" role="alert">{error}</div>}
      <div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button type="submit" className="primary quote-save-button" disabled={saving}>{saving?"Guardando...":"Guardar cotización"}</button></div>
    </form>
  }
  return <section className="card clients-page services-page"><div className="head"><div><span className="eyebrow">ADMINISTRACIÓN COMERCIAL · FASE 16.5</span><h2>Cotizaciones</h2><p>Propuestas comerciales por cliente con detalle de servicios, planes, cantidades y condiciones.</p></div><div className="toolbar-actions">{canExport&&<button className="secondary" onClick={exportCsv}>Exportar CSV</button>}{canCreate&&<button className="primary" onClick={async()=>{await catalogs(filters.empresa_id);setModal({})}}><Plus/> Nueva cotización</button>}</div></div>{error&&<div className="err">{error}</div>}<div className="filters"><input placeholder="Buscar por código o cliente..." value={filters.q} onChange={e=>setFilters(x=>({...x,q:e.target.value}))}/><select value={filters.estado} onChange={e=>setFilters(x=>({...x,estado:e.target.value}))}><option value="">Todos los estados</option>{["Borrador","Enviada","Aceptada","Rechazada","Vencida"].map(x=><option key={x}>{x}</option>)}</select>{isAdmin&&<select value={filters.empresa_id} onChange={e=>{setFilters(x=>({...x,empresa_id:e.target.value}));catalogs(e.target.value)}}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}<button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button></div><div className="table-meta">{items.length} cotización(es) encontrada(s)</div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Cliente</th>{isAdmin&&<th>Empresa</th>}<th>Fecha</th><th>Vencimiento</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan={isAdmin?8:7} className="empty-cell">No hay cotizaciones.</td></tr>:items.map(x=><tr key={x.id}><td>{x.codigo||`COT-${x.id}`}</td><td><b>{x.razon_social||x.nombre_comercial||x.cliente||x.prospecto_nombre||"—"}</b></td>{isAdmin&&<td>{x.empresa}</td>}<td>{x.fecha}</td><td>{x.fecha_vencimiento||"—"}</td><td>{Number(x.total||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td><span className={x.estado==="Aceptada"?"status active":x.estado==="Rechazada"||x.estado==="Vencida"?"status inactive":"status active"}>{x.estado}</span></td><td className="row-actions"><button title="Ver ficha" onClick={()=>openDetail(x)}>Ver</button><button type="button" className="pdf-action" title="Descargar PDF" aria-label="Descargar PDF" onClick={()=>exportPdf(x)}><FileText/></button><button type="button" title="Enviar cotización por correo" aria-label="Enviar cotización por correo" onClick={()=>sendEmail(x)}><Mail/></button>{canEdit&&(x.estado==="Aceptada"?<button type="button" title="Una cotización Aceptada no puede editarse" disabled><Pencil/></button>:<button title="Editar" onClick={async()=>{try{const d=await api(`/api/cotizaciones/${x.id}`);setModal(d.cotizacion?{...d.cotizacion,detalles:d.detalles}:x)}catch(e){alert(e.message)}}}><Pencil/></button>)}{canDelete&&x.estado!=="Aceptada"&&x.estado!=="Rechazada"&&<button title="Cambiar estado" onClick={()=>changeState(x,x.estado==="Borrador"?"Enviada":x.estado==="Enviada"?"Aceptada":"Borrador")}><Power/></button>}</td></tr>)}</tbody></table></div>{modal&&<Modal wide title={modal.id?"Editar cotización":"Nueva cotización"} onClose={()=>setModal(null)}><Form item={modal.id?modal:null} onClose={()=>setModal(null)}/></Modal>}{detail&&<Modal wide title={`Ficha de cotización — ${detail.cotizacion.codigo||detail.cotizacion.id}`} onClose={()=>setDetail(null)}><div className="service-form"><div className="form-grid form-grid-3"><div><small>{detail.cotizacion.cliente_id?"Cliente":"Prospecto"}</small><b>{detail.cotizacion.razon_social||detail.cotizacion.nombre_comercial||detail.cotizacion.cliente_nombre||detail.cotizacion.prospecto_nombre}</b></div><div><small>Estado</small><b>{detail.cotizacion.estado}</b></div><div><small>Vigencia</small><b>{detail.cotizacion.fecha_vencimiento||"—"}</b></div></div><div className="form-section-title">Detalle</div><div className="table-wrap"><table><thead><tr><th>Servicio</th><th>Plan</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>{(detail.detalles||[]).map(d=><tr key={d.id}><td>{d.servicio||"—"}</td><td>{d.plan||"—"}</td><td>{d.descripcion||"—"}</td><td>{d.cantidad}</td><td>{Number(d.precio_unitario||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td>{Number(d.subtotal||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td></tr>)}</tbody></table></div><div className="quote-total"><b>Total: {Number(detail.cotizacion.total||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</b></div></div></Modal>}</section>;
}


function OrdenesServicioPage({ currentUser }) {
  const [items,setItems]=useState([]),[catalog,setCatalog]=useState({clientes:[],contratos:[],activos:[],usuarios:[],empresas:[],siguiente_codigo:"OS0001"}),[modal,setModal]=useState(null),[detail,setDetail]=useState(null),[error,setError]=useState(""),[filters,setFilters]=useState({q:"",estado:""}),[loading,setLoading]=useState(false);
  const isAdmin=currentUser.rol==="Administrador";
  const canCreate=currentUser.permisos.includes("ordenes_servicio.crear"),canEdit=currentUser.permisos.includes("ordenes_servicio.editar"),canDelete=currentUser.permisos.includes("ordenes_servicio.eliminar");
  async function load(){setLoading(true);try{const p=new URLSearchParams(filters);const d=await api(`/api/ordenes-servicio?${p}`);setItems(d.ordenes||[]);setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  async function catalogs(){try{setCatalog(await api("/api/ordenes-servicio/catalogos"))}catch(e){setError(e.message)}}
  useEffect(()=>{catalogs();load()},[]); useEffect(()=>{load()},[filters.q,filters.estado]);
  function Form({item,onClose}) {
    const [f,setF]=useState({cliente_id:item?.cliente_id||"",contrato_id:item?.contrato_id||"",activo_id:item?.activo_id||"",tipo:item?.tipo||"Instalación",prioridad:item?.prioridad||"Media",titulo:item?.titulo||"",descripcion:item?.descripcion||"",fecha_solicitud:item?.fecha_solicitud||new Date().toISOString().slice(0,10),fecha_programada:item?.fecha_programada||"",estado:item?.estado||"Borrador",responsable_id:item?.responsable_id||"",observaciones:item?.observaciones||""}),[saving,setSaving]=useState(false);
    const change=(k,v)=>setF(x=>({...x,[k]:v}));
    const contratos=catalog.contratos.filter(x=>!f.cliente_id||x.cliente_id===Number(f.cliente_id));
    const activos=catalog.activos.filter(x=>!f.cliente_id||x.cliente_id===Number(f.cliente_id));
    async function save(e){e.preventDefault();setSaving(true);try{await api(item?`/api/ordenes-servicio/${item.id}`:"/api/ordenes-servicio",{method:item?"PUT":"POST",body:JSON.stringify({...f,cliente_id:Number(f.cliente_id),contrato_id:Number(f.contrato_id)||null,activo_id:Number(f.activo_id)||null,responsable_id:Number(f.responsable_id)||null})});onClose();await catalogs();await load()}catch(e){alert(e.message)}finally{setSaving(false)}}
    return <form onSubmit={save} className="service-form">
      <div className="form-section-title">Identificación de la orden</div>
      <div className="form-grid form-grid-3">
{item ? <div><small>Código</small><b>{item.codigo}</b></div> : <div><small>Código automático</small><b>{catalog.siguiente_codigo||"OS0001"}</b></div>}
                <label>Cliente <span className="required">*</span><select value={f.cliente_id} onChange={e=>{change("cliente_id",e.target.value);change("contrato_id","");change("activo_id","")}} required><option value="">Seleccione un cliente</option>{catalog.clientes.map(c=><option key={c.id} value={c.id}>{c.razon_social||c.nombre_comercial||c.nombre}</option>)}</select></label>
        <label>Contrato activo<select value={f.contrato_id} onChange={e=>change("contrato_id",e.target.value)}><option value="">Sin contrato</option>{contratos.map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.titulo}</option>)}</select></label>
        <label>Activo<select value={f.activo_id} onChange={e=>change("activo_id",e.target.value)}><option value="">Sin activo</option>{activos.map(a=><option key={a.id} value={a.id}>{a.codigo}{a.placa?` — ${a.placa}`:""}</option>)}</select></label>
        <label>Tipo<select value={f.tipo} onChange={e=>change("tipo",e.target.value)}><option>Instalación</option><option>Desinstalación</option><option>Mantenimiento</option><option>Revisión</option><option>Soporte</option><option>Visita técnica</option><option>Otro</option></select></label>
        <label>Prioridad<select value={f.prioridad} onChange={e=>change("prioridad",e.target.value)}><option>Baja</option><option>Media</option><option>Alta</option><option>Crítica</option></select></label>
        <label>Responsable<select value={f.responsable_id} onChange={e=>change("responsable_id",e.target.value)}><option value="">Sin asignar</option>{catalog.usuarios.map(u=><option key={u.id} value={u.id}>{u.nombre} {u.apellido||""}</option>)}</select></label>
        <label className="full-field">Título <span className="required">*</span><input value={f.titulo} onChange={e=>change("titulo",e.target.value)} required maxLength="150" placeholder="Ej. Instalación GPS vehículo"/></label>
      </div>
      <div className="form-section-title">Programación</div>
      <div className="form-grid form-grid-3">
        <label>Fecha solicitud<input type="date" value={f.fecha_solicitud} onChange={e=>change("fecha_solicitud",e.target.value)} required/></label>
        <label>Fecha programada<input type="date" value={f.fecha_programada} onChange={e=>change("fecha_programada",e.target.value)}/></label>
        <label>Estado<select value={f.estado} onChange={e=>change("estado",e.target.value)}><option>Borrador</option><option>Programada</option><option>En proceso</option><option>Completada</option><option>Cancelada</option></select></label>
        <label className="full-field">Descripción<textarea rows="4" value={f.descripcion} onChange={e=>change("descripcion",e.target.value)}/></label>
        <label className="full-field">Observaciones<textarea rows="3" value={f.observaciones} onChange={e=>change("observaciones",e.target.value)}/></label>
      </div>
      <div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Guardando...":item?"Guardar cambios":"Crear orden"}</button></div>
    </form>;
  }
  async function openDetail(x){try{setDetail(await api(`/api/ordenes-servicio/${x.id}`))}catch(e){alert(e.message)}}
  async function changeStatus(x,status){try{await api(`/api/ordenes-servicio/${x.id}/estado`,{method:"PATCH",body:JSON.stringify({estado:status})});await load()}catch(e){alert(e.message)}}
  return <section className="card clients-page services-page">
    <div className="head"><div><span className="eyebrow">OPERACIÓN · FASE 17.1</span><h2>Órdenes de servicio</h2><p>Solicitudes, programación y seguimiento de servicios asociados a clientes, contratos y activos.</p></div>{canCreate&&<button className="primary" onClick={()=>setModal({})}><Plus/> Nueva orden</button>}</div>
    {error&&<div className="err">{error}</div>}
    <div className="filters"><input placeholder="Buscar código, cliente, activo o título..." value={filters.q} onChange={e=>setFilters(x=>({...x,q:e.target.value}))}/><select value={filters.estado} onChange={e=>setFilters(x=>({...x,estado:e.target.value}))}><option value="">Todos los estados</option><option>Borrador</option><option>Programada</option><option>En proceso</option><option>Completada</option><option>Cancelada</option></select><button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button></div>
    <div className="table-meta">{items.length} orden(es)</div>
    <div className="table-wrap"><table><thead><tr><th>Código</th><th>Cliente</th><th>Orden</th><th>Tipo</th><th>Programada</th><th>Prioridad</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      {items.length===0?<tr><td colSpan="8" className="empty-cell">No hay órdenes de servicio.</td></tr>:items.map(x=><tr key={x.id}><td><b>{x.codigo}</b></td><td>{x.cliente_nombre}</td><td>{x.titulo}</td><td>{x.tipo}</td><td>{x.fecha_programada||"—"}</td><td>{x.prioridad}</td><td><span className={x.estado==="Completada"?"status active":x.estado==="Cancelada"?"status inactive":"status active"}>{x.estado}</span></td><td className="row-actions"><button className="secondary" onClick={()=>openDetail(x)}>Ver</button>{canEdit&&!["Completada","Cancelada"].includes(x.estado)&&<button className="secondary" onClick={()=>setModal(x)}>Editar</button>}{canEdit&&x.estado!=="Completada"&&x.estado!=="Cancelada"&&<button className="secondary" onClick={()=>changeStatus(x,"Completada")}>Completar</button>}</td></tr>)}
    </tbody></table></div>
    {modal&&<Modal wide title={modal.id?`Editar ${modal.codigo}`:"Nueva orden de servicio"} onClose={()=>setModal(null)}><Form item={modal.id?modal:null} onClose={()=>setModal(null)}/></Modal>}
    {detail&&<Modal wide title={`Ficha de orden — ${detail.orden.codigo}`} onClose={()=>setDetail(null)}><div className="service-form"><div className="form-grid form-grid-3"><div><small>Código</small><b>{detail.orden.codigo}</b></div><div><small>Cliente</small><b>{detail.orden.cliente_nombre}</b></div><div><small>Estado</small><b>{detail.orden.estado}</b></div><div><small>Contrato</small><b>{detail.orden.contrato_codigo||"—"}</b></div><div><small>Activo</small><b>{detail.orden.activo_codigo||"—"}{detail.orden.placa?` — ${detail.orden.placa}`:""}</b></div><div><small>Tipo</small><b>{detail.orden.tipo}</b></div><div><small>Prioridad</small><b>{detail.orden.prioridad}</b></div><div><small>Responsable</small><b>{detail.orden.responsable_nombre||"Sin asignar"}</b></div><div><small>Fecha solicitud</small><b>{detail.orden.fecha_solicitud}</b></div><div><small>Fecha programada</small><b>{detail.orden.fecha_programada||"—"}</b></div><div className="full-field"><small>Descripción</small><p>{detail.orden.descripcion||"—"}</p></div><div className="full-field"><small>Observaciones</small><p>{detail.orden.observaciones||"—"}</p></div></div></div></Modal>}
  </section>;
}

function ContractsPage({ currentUser }) {
  async function downloadContractPdf(x){try{await downloadBlob(`/api/contratos/${x.id}/pdf`,`${x.codigo||"contrato"}.pdf`,"No fue posible generar o descargar el PDF del contrato")}catch(e){alert(e.message)}}
  const [items,setItems]=useState([]),[catalog,setCatalog]=useState({clientes:[],cotizaciones:[],suscripciones:[],siguiente_codigo:"CTR0001"}),[modal,setModal]=useState(null),[detail,setDetail]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false),[filters,setFilters]=useState({q:"",estado:""});
  const canCreate=currentUser.permisos.includes("contratos.crear"),canEdit=currentUser.permisos.includes("contratos.editar"),canDelete=currentUser.permisos.includes("contratos.eliminar");
  async function load(){setLoading(true);try{const p=new URLSearchParams(filters);const d=await api(`/api/contratos?${p}`);setItems(d.contratos||[]);setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  async function catalogs(){try{setCatalog(await api("/api/contratos/catalogos"))}catch(e){setError(e.message)}}
  useEffect(()=>{catalogs();load()},[]);useEffect(()=>{load()},[filters.q,filters.estado]);
  function Form({item,onClose}){const [f,setF]=useState({cliente_id:item?.cliente_id||"",cotizacion_id:item?.cotizacion_id||"",suscripcion_id:item?.suscripcion_id||"",titulo:item?.titulo||"",fecha_inicio:item?.fecha_inicio||new Date().toISOString().slice(0,10),fecha_fin:item?.fecha_fin||"",estado:item?.estado||"Borrador",valor:item?.valor??0,observaciones:item?.observaciones||""}),[saving,setSaving]=useState(false);const change=(k,v)=>setF(x=>({...x,[k]:v}));const qs=catalog.cotizaciones.filter(x=>!f.cliente_id||x.cliente_id===Number(f.cliente_id)),ss=catalog.suscripciones.filter(x=>!f.cliente_id||x.cliente_id===Number(f.cliente_id));async function save(e){e.preventDefault();if(!f.cliente_id)return alert("Seleccione el cliente.");setSaving(true);try{await api(item?`/api/contratos/${item.id}`:"/api/contratos",{method:item?"PUT":"POST",body:JSON.stringify({...f,cliente_id:Number(f.cliente_id),cotizacion_id:Number(f.cotizacion_id)||null,suscripcion_id:Number(f.suscripcion_id)||null,valor:Number(f.valor||0)})});onClose();await catalogs();await load()}catch(e){alert(e.message)}finally{setSaving(false)}}return <form onSubmit={save} className="service-form"><div className="form-section-title">Identificación contractual</div><div className="form-grid form-grid-3"><label>Cliente <span className="required">*</span><select value={f.cliente_id} onChange={e=>{change("cliente_id",e.target.value);change("cotizacion_id","");change("suscripcion_id","")}} required><option value="">Seleccione un cliente</option>{catalog.clientes.map(c=><option key={c.id} value={c.id}>{c.razon_social||c.nombre_comercial||c.nombre}</option>)}</select></label><label>Cotización aceptada<select value={f.cotizacion_id} onChange={e=>change("cotizacion_id",e.target.value)}><option value="">Sin cotización</option>{qs.map(q=><option key={q.id} value={q.id}>{q.codigo} — {Number(q.total||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</option>)}</select></label><label>Suscripción activa<select value={f.suscripcion_id} onChange={e=>change("suscripcion_id",e.target.value)}><option value="">Sin suscripción</option>{ss.map(s=><option key={s.id} value={s.id}>{s.codigo} — {s.plan}</option>)}</select></label><div><small>Valor del contrato</small><b>{f.cotizacion_id?(qs.find(q=>q.id===Number(f.cotizacion_id))?.total??f.valor).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}):"Se toma de la cotización aceptada"}</b></div><label className="full-field">Título del contrato<input required value={f.titulo} onChange={e=>change("titulo",e.target.value)} placeholder="Contrato de servicios GPS"/></label></div><div className="form-section-title">Vigencia y condiciones</div><div className="form-grid form-grid-3"><label>Fecha inicio<input type="date" value={f.fecha_inicio} onChange={e=>change("fecha_inicio",e.target.value)} required/></label><label>Fecha fin<input type="date" min={f.fecha_inicio} value={f.fecha_fin} onChange={e=>change("fecha_fin",e.target.value)}/></label><label>Valor (COP)<input type="text" value={Number(f.valor||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})} readOnly/></label><label>Estado<select value={f.estado} onChange={e=>change("estado",e.target.value)}><option>Borrador</option><option>Activo</option><option>Suspendido</option><option>Vencido</option><option>Terminado</option><option>Anulado</option></select></label><label className="full-field">Observaciones<textarea rows="4" value={f.observaciones} onChange={e=>change("observaciones",e.target.value)}/></label></div><div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Guardando...":item?"Guardar cambios":"Crear contrato"}</button></div></form>}
  return <section className="card clients-page services-page"><div className="head"><div><span className="eyebrow">ADMINISTRACIÓN COMERCIAL · FASE 16.8</span><h2>Contratos</h2><p>Gestión de contratos comerciales, vigencias y relación con cotizaciones y suscripciones.</p></div><div className="toolbar-actions">{canCreate&&<button className="primary" onClick={()=>setModal({})}><Plus/> Nuevo contrato</button>}</div></div>{error&&<div className="err">{error}</div>}<div className="filters"><input placeholder="Buscar código, cliente o contrato..." value={filters.q} onChange={e=>setFilters(x=>({...x,q:e.target.value}))}/><select value={filters.estado} onChange={e=>setFilters(x=>({...x,estado:e.target.value}))}><option value="">Todos los estados</option><option>Borrador</option><option>Activo</option><option>Suspendido</option><option>Vencido</option><option>Terminado</option><option>Anulado</option></select><button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button></div><div className="table-meta">{items.length} contrato(s)</div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Cliente</th><th>Contrato</th><th>Vigencia</th><th>Estado</th><th>Valor</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan="7" className="empty-cell">No hay contratos.</td></tr>:items.map(x=><tr key={x.id}><td>{x.codigo}</td><td><b>{x.razon_social||x.nombre_comercial||x.cliente||x.prospecto_nombre||"—"}</b></td><td>{x.titulo}</td><td>{x.fecha_inicio} → {x.fecha_fin||"Indefinida"}</td><td><span className={x.estado==="Activo"?"status active":"status inactive"}>{x.estado}</span></td><td>{Number(x.valor||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td className="row-actions"><button className="secondary" title="Ver ficha" onClick={async()=>{try{setDetail(await api(`/api/contratos/${x.id}`))}catch(e){alert(e.message)}}}>Ver</button><button type="button" className="pdf-action" title="Descargar PDF" aria-label="Descargar PDF" onClick={()=>downloadContractPdf(x)}><FileText/></button>{canEdit&&x.estado!=="Activo"&&x.estado!=="Anulado"&&<button className="secondary" onClick={()=>setModal(x)}>Editar</button>}{canDelete&&x.estado!=="Activo"&&x.estado!=="Anulado"&&<button className="secondary" onClick={async()=>{if(confirm(`¿Anular ${x.codigo}?`)){try{await api(`/api/contratos/${x.id}`,{method:"DELETE"});await load()}catch(e){alert(e.message)}}}}>Anular</button>}</td></tr>)}</tbody></table></div>{modal&&<Modal wide title={modal.id?`Editar ${modal.codigo}`:"Nuevo contrato"} onClose={()=>setModal(null)}><Form item={modal.id?modal:null} onClose={()=>setModal(null)}/></Modal>}{detail&&<Modal wide title={`Ficha de contrato — ${detail.contrato.codigo}`} onClose={()=>setDetail(null)}><div className="service-form"><div className="form-grid form-grid-3"><div><small>Cliente</small><b>{detail.contrato.razon_social||detail.contrato.nombre_comercial||detail.contrato.cliente}</b></div><div><small>Código</small><b>{detail.contrato.codigo}</b></div><div><small>Estado</small><b>{detail.contrato.estado}</b></div><div><small>Título</small><b>{detail.contrato.titulo}</b></div><div><small>Cotización</small><b>{detail.contrato.cotizacion_codigo||"—"}</b></div><div><small>Suscripción</small><b>{detail.contrato.suscripcion_codigo||"—"}</b></div><div><small>Vigencia</small><b>{detail.contrato.fecha_inicio} → {detail.contrato.fecha_fin||"Indefinida"}</b></div><div><small>Valor</small><b>{Number(detail.contrato.valor||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</b></div><div className="full-field"><small>Observaciones</small><p>{detail.contrato.observaciones||"—"}</p></div></div></div></Modal>}</section>;
}

function InvoicesPage({ currentUser }) {
  async function downloadInvoicePdf(x){try{await downloadBlob(`/api/facturas/${x.id}/pdf`,`${x.codigo||"factura"}.pdf`,"No fue posible generar o descargar el PDF de la factura")}catch(e){alert(e.message)}}
  async function sendEmail(x){const to=window.prompt("Correo del cliente:",x.correo||"");if(!to)return;try{await api(`/api/facturas/${x.id}/enviar-email`,{method:"POST",body:JSON.stringify({destinatario:to})});alert(`Factura enviada correctamente a ${to}.`);}catch(e){alert(e.message)}}
  const [items,setItems]=useState([]),[quotes,setQuotes]=useState([]),[companies,setCompanies]=useState([]),[nextCode,setNextCode]=useState("FAC0001"),[modal,setModal]=useState(null),[detail,setDetail]=useState(null),[filters,setFilters]=useState({q:"",estado:"",empresa_id:""}),[loading,setLoading]=useState(false),[error,setError]=useState("");
  const isAdmin=currentUser.rol==="Administrador";
  const canCreate=currentUser.permisos.includes("facturas.crear"),canEdit=currentUser.permisos.includes("facturas.editar");
  async function catalogs(companyId=""){try{const q=isAdmin&&companyId?`?empresa_id=${companyId}`:"";const d=await api(`/api/facturas/catalogos${q}`);setQuotes(d.cotizaciones||[]);setNextCode(d.siguiente_codigo||"FAC0001");if(isAdmin){const c=await api("/api/companies");setCompanies((c.empresas||[]).filter(x=>x.estado));}}catch(e){setError(e.message)}}
  async function load(){setLoading(true);try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v)p.set(k,v)});if(!isAdmin)p.delete("empresa_id");const d=await api(`/api/facturas?${p}`);setItems(d.facturas||[]);setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{catalogs(filters.empresa_id)},[]);useEffect(()=>{load()},[filters.q,filters.estado,filters.empresa_id]);
  async function openDetail(x){try{setDetail(await api(`/api/facturas/${x.id}`))}catch(e){alert(e.message)}}
  async function changeState(x,next){if(!confirm(`¿Cambiar la factura ${x.codigo||x.id} a ${next}?`))return;try{await api(`/api/facturas/${x.id}/estado`,{method:"PATCH",body:JSON.stringify({estado:next})});await load()}catch(e){alert(e.message)}}
  async function createFromQuote(q){setModal(q)}
  function QuoteSelector({onClose}){return <div className="service-form"><div className="form-section-title">Seleccionar origen de facturación</div><p>La factura se genera a partir de una cotización que esté en estado <b>Aceptada</b> y que todavía no tenga factura.</p><div className="table-wrap"><table><thead><tr><th>Cotización</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Acción</th></tr></thead><tbody>{quotes.length===0?<tr><td colSpan="5" className="empty-cell">No hay cotizaciones aceptadas pendientes de facturar.</td></tr>:quotes.map(q=><tr key={q.id}><td><b>{q.codigo}</b></td><td>{q.razon_social||q.nombre_comercial||q.cliente}</td><td>{q.fecha}</td><td>{Number(q.total||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td><button type="button" className="primary" onClick={()=>setModal(q)}>Seleccionar</button></td></tr>)}</tbody></table></div><div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cerrar</button></div></div>}
  function Form({quote,onClose}){const [f,setF]=useState({cotizacion_id:quote.id,fecha_emision:new Date().toISOString().slice(0,10),fecha_vencimiento:"",observaciones:quote.observaciones||""});const [saving,setSaving]=useState(false);async function save(e){e.preventDefault();setSaving(true);try{await api("/api/facturas",{method:"POST",body:JSON.stringify(f)});onClose();await catalogs(filters.empresa_id);await load()}catch(e){alert(e.message)}finally{setSaving(false)}}return <form onSubmit={save} className="service-form"><div className="form-section-title">Origen de facturación</div><div className="form-grid form-grid-3"><label>Cotización<input value={`${quote.codigo} — ${quote.razon_social||quote.nombre_comercial||quote.cliente}`} readOnly/></label><label>Código de factura<input value={nextCode} readOnly/></label><label>Estado<input value="Borrador" readOnly/></label><label>Fecha de emisión<input type="date" value={f.fecha_emision} onChange={e=>setF(x=>({...x,fecha_emision:e.target.value}))} required/></label><label>Fecha de vencimiento<input type="date" min={f.fecha_emision||undefined} value={f.fecha_vencimiento} onChange={e=>setF(x=>({...x,fecha_vencimiento:e.target.value}))}/></label><label className="full-field">Observaciones<textarea rows="3" value={f.observaciones} onChange={e=>setF(x=>({...x,observaciones:e.target.value}))}/></label></div><div className="form-section-title">Resumen</div><div className="form-grid form-grid-3"><div><small>Subtotal</small><b>{Number(quote.subtotal||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</b></div><div><small>Descuento</small><b>{Number(quote.descuento||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</b></div><div><small>Impuestos</small><b>{Number(quote.impuestos||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</b></div><div><small>Total</small><b>{Number(quote.total||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</b></div></div><div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?"Generando...":"Generar factura"}</button></div></form>}
  return <section className="card clients-page services-page"><div className="head"><div><span className="eyebrow">ADMINISTRACIÓN COMERCIAL · FASE 20.1</span><h2>Facturación</h2><p>Facturación a partir de cotizaciones aceptadas, con control de estados y trazabilidad.</p></div><div className="toolbar-actions">{canCreate&&<button className="primary" onClick={()=>setModal({selector:true})}><Plus/> Nueva factura</button>}</div></div>{error&&<div className="err">{error}</div>}<div className="filters"><input placeholder="Buscar por código o cliente..." value={filters.q} onChange={e=>setFilters(x=>({...x,q:e.target.value}))}/><select value={filters.estado} onChange={e=>setFilters(x=>({...x,estado:e.target.value}))}><option value="">Todos los estados</option>{["Borrador","Emitida","Pagada","Vencida","Anulada"].map(x=><option key={x}>{x}</option>)}</select>{isAdmin&&<select value={filters.empresa_id} onChange={e=>{setFilters(x=>({...x,empresa_id:e.target.value}));catalogs(e.target.value)}}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}<button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button></div>{canCreate&&<div className="form-section-title">Cotizaciones aceptadas pendientes de facturar</div>} {canCreate&&<div className="table-wrap"><table><thead><tr><th>Cotización</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Acción</th></tr></thead><tbody>{quotes.length===0?<tr><td colSpan="5" className="empty-cell">No hay cotizaciones aceptadas pendientes de facturar.</td></tr>:quotes.map(q=><tr key={q.id}><td><b>{q.codigo}</b></td><td>{q.razon_social||q.nombre_comercial||q.cliente}</td><td>{q.fecha}</td><td>{Number(q.total||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td><button className="primary" onClick={()=>createFromQuote(q)}>Generar factura</button></td></tr>)}</tbody></table></div>}<div className="form-section-title">Facturas</div><div className="table-meta">{items.length} factura(s) encontrada(s)</div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Cliente</th>{isAdmin&&<th>Empresa</th>}<th>Emisión</th><th>Vencimiento</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan={isAdmin?8:7} className="empty-cell">No hay facturas.</td></tr>:items.map(x=><tr key={x.id}><td>{x.codigo||`FAC${String(x.id).padStart(4,"0")}`}</td><td><b>{x.razon_social||x.nombre_comercial||x.cliente||x.prospecto_nombre||"—"}</b></td>{isAdmin&&<td>{x.empresa}</td>}<td>{x.fecha_emision}</td><td>{x.fecha_vencimiento||"—"}</td><td>{Number(x.total||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td><span className={x.estado==="Anulada"?"status inactive":x.estado==="Pagada"?"status active":"status active"}>{x.estado}</span></td><td className="row-actions"><button title="Ver ficha" onClick={()=>openDetail(x)}>Ver</button><button type="button" className="pdf-action" title="Descargar PDF" aria-label="Descargar PDF" onClick={()=>downloadInvoicePdf(x)}><FileText/></button><button type="button" title="Enviar factura por correo" aria-label="Enviar factura por correo" onClick={()=>sendEmail(x)}><Mail/></button>{canEdit&&x.estado==="Borrador"&&<button title="Marcar como Emitida" onClick={()=>changeState(x,"Emitida")}><Power/></button>}</td></tr>)}</tbody></table></div>{modal&&<Modal wide title={modal.selector?"Nueva factura":"Generar factura"} onClose={()=>setModal(null)}>{modal.selector?<QuoteSelector onClose={()=>setModal(null)}/>:<Form quote={modal} onClose={()=>setModal(null)}/>}</Modal>}{detail&&<Modal wide title={`Ficha de factura — ${detail.factura.codigo||detail.factura.id}`} onClose={()=>setDetail(null)}><div className="service-form"><div className="form-grid form-grid-3"><div><small>Cliente</small><b>{detail.factura.razon_social||detail.factura.nombre_comercial||detail.factura.cliente}</b></div><div><small>Estado</small><b>{detail.factura.estado}</b></div><div><small>Cotización</small><b>{detail.factura.cotizacion_codigo||"—"}</b></div><div><small>Emisión</small><b>{detail.factura.fecha_emision}</b></div><div><small>Vencimiento</small><b>{detail.factura.fecha_vencimiento||"—"}</b></div><div><small>Total</small><b>{Number(detail.factura.total||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</b></div></div><div className="form-section-title">Detalle</div><div className="table-wrap"><table><thead><tr><th>Servicio</th><th>Plan</th><th>Descripción</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>{(detail.detalles||[]).map(d=><tr key={d.id}><td>{d.servicio||"—"}</td><td>{d.plan||"—"}</td><td>{d.descripcion||"—"}</td><td>{d.cantidad}</td><td>{Number(d.precio_unitario||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td>{Number(d.subtotal||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td></tr>)}</tbody></table></div></div></Modal>}</section>;
}


function FacturacionRecurrentePage({ currentUser }) {
  const isAdmin=currentUser.rol==="Administrador", canCreate=currentUser.permisos.includes("facturas.crear"), canEdit=currentUser.permisos.includes("facturas.editar");
  const nowPeriod=new Date().toISOString().slice(0,7);
  const [periodo,setPeriodo]=useState(nowPeriod),[empresaId,setEmpresaId]=useState(isAdmin?String(currentUser.empresa_id||""):""),[data,setData]=useState({periodo:null,candidatas:[],periodos:[],lotes:[]}),[summary,setSummary]=useState({facturas_recurrentes:0,facturado:0,saldo_pendiente:0,saldo_vencido:0,suscripciones_activas:0,valor_suscripciones_activas:0}),[config,setConfig]=useState({activo:1,dia_ejecucion:1,dias_vencimiento:0,estado_inicial:"Emitida",actualizar_vencidas:1}),[companies,setCompanies]=useState([]),[selected,setSelected]=useState([]),[estadoInicial,setEstadoInicial]=useState("Borrador"),[diasVencimiento,setDiasVencimiento]=useState(0),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
  const money=v=>Number(v||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0});
  async function load(p=periodo,e=empresaId){setLoading(true);try{const q=new URLSearchParams({periodo:p});if(isAdmin&&e)q.set("empresa_id",e);const d=await api(`/api/facturacion-recurrente?${q}`);setData(d);setSelected([]);const rs=await api(`/api/facturacion-recurrente/resumen${isAdmin&&e?`?empresa_id=${e}`:""}`);setSummary(rs.resumen||{});if(rs.config)setConfig(rs.config);setError("")}catch(err){setError(err.message)}finally{setLoading(false)}}
  useEffect(()=>{if(isAdmin)api("/api/companies").then(d=>setCompanies((d.empresas||[]).filter(x=>x.estado))).catch(e=>setError(e.message));load()},[]);
  useEffect(()=>{load(periodo,empresaId)},[periodo,empresaId]);
  const candidates=data.candidatas||[], eligible=candidates.filter(x=>!x.existente), allSelected=eligible.length>0&&selected.length===eligible.length;
  function toggle(id){setSelected(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id])}
  async function createPeriod(){try{await api("/api/facturacion-recurrente/periodos",{method:"POST",body:JSON.stringify({periodo,empresa_id:isAdmin&&empresaId?Number(empresaId):undefined})});await load()}catch(e){alert(e.message)}}
  async function togglePeriod(){const p=data.periodo;if(!p)return;if(p.estado==="Cerrado"){if(!confirm(`¿Reabrir el período ${p.periodo}?`))return;try{await api(`/api/facturacion-recurrente/periodos/${p.id}/abrir`,{method:"PATCH"});await load()}catch(e){alert(e.message)}}else{if(!confirm(`¿Cerrar el período ${p.periodo}? Una vez cerrado no se podrán generar facturas recurrentes.`))return;try{await api(`/api/facturacion-recurrente/periodos/${p.id}/cerrar`,{method:"PATCH"});await load()}catch(e){alert(e.message)}}}
  async function generate(){if(!canCreate)return;const ids=selected.length?selected:undefined;const count=ids?ids.length:eligible.length;if(!count)return alert("No hay suscripciones elegibles para facturar en este período.");if(!confirm(`¿Generar ${count} factura(s) recurrente(s) para ${periodo}?`))return;setSaving(true);try{const d=await api("/api/facturacion-recurrente/generar",{method:"POST",body:JSON.stringify({periodo,empresa_id:isAdmin&&empresaId?Number(empresaId):undefined,suscripcion_ids:ids,estado_inicial:estadoInicial,dias_vencimiento:Number(diasVencimiento||0)})});alert(`Proceso completado. Generadas: ${d.generadas}. Omitidas: ${d.omitidas}.`);await load()}catch(e){alert(e.message)}finally{setSaving(false)}}
  async function processCycle(){if(!canCreate)return;if(!confirm(`¿Procesar automáticamente el ciclo ${periodo}? Se generarán las facturas pendientes y se actualizarán vencidas.`))return;setSaving(true);try{const d=await api("/api/facturacion-recurrente/procesar",{method:"POST",body:JSON.stringify({periodo,empresa_id:isAdmin&&empresaId?Number(empresaId):undefined})});alert(`Ciclo procesado. Generadas: ${d.generadas}. Omitidas: ${d.omitidas}. Vencidas actualizadas: ${d.vencidas_actualizadas}.`);await load()}catch(e){alert(e.message)}finally{setSaving(false)}}
  async function refreshOverdue(){try{const d=await api("/api/facturacion-recurrente/actualizar-vencidas",{method:"POST",body:JSON.stringify({empresa_id:isAdmin&&empresaId?Number(empresaId):undefined})});alert(`Vencidas actualizadas: ${d.actualizadas}.`);await load()}catch(e){alert(e.message)}}
  async function saveConfig(){try{const d=await api("/api/facturacion-recurrente/config",{method:"PUT",body:JSON.stringify({...config,empresa_id:isAdmin&&empresaId?Number(empresaId):undefined})});setConfig(d.config||config);alert("Configuración guardada.")}catch(e){alert(e.message)}}
  return <section className="card clients-page services-page">
    <div className="head"><div><span className="eyebrow">ADMINISTRACIÓN FINANCIERA · FASE 26</span><h2>Facturación recurrente + cartera</h2><p>Ciclo recurrente, vencimientos, saldo pendiente y trazabilidad financiera.</p></div><div className="toolbar-actions">{canEdit&&<button className="secondary" onClick={createPeriod}><CalendarRange/> Abrir período</button>}{canEdit&&data.periodo&&<button className={data.periodo.estado==="Cerrado"?"primary":"secondary"} onClick={togglePeriod}>{data.periodo.estado==="Cerrado"?"Reabrir período":"Cerrar período"}</button>}{canCreate&&<button className="primary" disabled={saving||data.periodo?.estado==="Cerrado"} onClick={processCycle}><RefreshCw/> {saving?"Procesando...":"Procesar ciclo automático"}</button>}{canEdit&&<button className="secondary" onClick={refreshOverdue}>Actualizar vencidas</button>}</div></div>
    {error&&<div className="err">{error}</div>}
    <div className="filters"><label style={{margin:0}}>Período<select value={periodo} onChange={e=>setPeriodo(e.target.value)}><option value={nowPeriod}>{nowPeriod}</option>{(data.periodos||[]).filter(x=>x.periodo!==nowPeriod).map(x=><option key={x.periodo} value={x.periodo}>{x.periodo}</option>)}</select></label>{isAdmin&&<label style={{margin:0}}>Empresa<select value={empresaId} onChange={e=>setEmpresaId(e.target.value)}><option value="">Seleccione una empresa</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}<label style={{margin:0}}>Estado inicial<select value={estadoInicial} onChange={e=>setEstadoInicial(e.target.value)}><option>Borrador</option><option>Emitida</option></select></label><label style={{margin:0}}>Días para vencimiento<input type="number" min="0" max="365" value={diasVencimiento} onChange={e=>setDiasVencimiento(e.target.value)}/></label><button className="secondary" onClick={()=>load()}>{loading?"Cargando...":"Actualizar"}</button></div>
    <div className="kpis"><div className="kpi"><small>Período</small><strong>{data.periodo?.periodo||periodo}</strong><span>{data.periodo?.estado||"Abierto"}</span></div><div className="kpi"><small>Suscripciones activas</small><strong>{summary.suscripciones_activas||0}</strong><span>{money(summary.valor_suscripciones_activas||0)} / ciclo</span></div><div className="kpi"><small>Saldo por cobrar</small><strong>{money(summary.saldo_pendiente||0)}</strong><span>Facturación recurrente</span></div><div className="kpi"><small>Saldo vencido</small><strong>{money(summary.saldo_vencido||0)}</strong><span>Se actualiza por fecha de vencimiento</span></div></div>
    <div className="head" style={{marginTop:18}}><div><h3>Control del ciclo</h3><p>El proceso automático genera una sola factura por suscripción y período y actualiza las facturas vencidas con saldo pendiente.</p></div><div className="toolbar-actions"><span className="status active">Automático: {config.activo?"Activo":"Inactivo"}</span><label style={{margin:0}}>Día<input type="number" min="1" max="28" value={config.dia_ejecucion||1} onChange={e=>setConfig(x=>({...x,dia_ejecucion:Number(e.target.value)}))}/></label><label style={{margin:0}}>Vencimiento (días)<input type="number" min="0" max="365" value={config.dias_vencimiento||0} onChange={e=>setConfig(x=>({...x,dias_vencimiento:Number(e.target.value)}))}/></label>{canEdit&&<button className="secondary" onClick={saveConfig}>Guardar configuración</button>}</div></div>
    <div className="head" style={{marginTop:18}}><div><h3>Suscripciones del período</h3><p>Las suscripciones activas recurrentes se calculan según su periodicidad y día de facturación.</p></div><div className="toolbar-actions">{eligible.length>0&&<button className="secondary" onClick={()=>setSelected(allSelected?[]:eligible.map(x=>x.id))}>{allSelected?"Quitar selección":"Seleccionar todas"}</button>}{canCreate&&<button className="primary" disabled={saving||data.periodo?.estado==="Cerrado"||eligible.length===0} onClick={generate}><Repeat2/> {saving?"Generando...":`Generar ${selected.length?selected.length:eligible.length} factura(s)`}</button>}</div></div>
    <div className="table-meta">{candidates.length} suscripción(es) evaluada(s) · {selected.length} seleccionada(s)</div>
    <div className="table-wrap"><table><thead><tr><th></th><th>Suscripción</th><th>Cliente</th>{isAdmin&&<th>Empresa</th>}<th>Plan</th><th>Periodicidad</th><th>Día</th><th>Total</th><th>Estado</th></tr></thead><tbody>{candidates.length===0?<tr><td colSpan={isAdmin?9:8} className="empty-cell">No hay suscripciones recurrentes elegibles para este período.</td></tr>:candidates.map(x=><tr key={x.id}><td><input type="checkbox" checked={selected.includes(x.id)} disabled={!!x.existente||data.periodo?.estado==="Cerrado"} onChange={()=>toggle(x.id)}/></td><td><b>{x.codigo||`SUS-${x.id}`}</b></td><td>{x.razon_social||x.nombre_comercial||x.cliente}</td>{isAdmin&&<td>{x.empresa||"—"}</td>}<td><b>{x.plan}</b><small>{x.servicio}</small></td><td>{x.periodicidad||x.plan_periodicidad}</td><td>{x.dia_facturacion}</td><td>{money(x.total)}</td><td>{x.existente?<span className="status active">Facturada · {x.existente.codigo}</span>:<span className="status active">Pendiente</span>}</td></tr>)}</tbody></table></div>
    <div className="head" style={{marginTop:24}}><div><h3>Últimos lotes</h3><p>Trazabilidad de las generaciones masivas realizadas.</p></div></div><div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Período</th><th>Estado</th><th>Inicial</th><th>Candidatas</th><th>Generadas</th><th>Omitidas</th></tr></thead><tbody>{(data.lotes||[]).length===0?<tr><td colSpan="7" className="empty-cell">No hay lotes generados.</td></tr>:(data.lotes||[]).map(l=><tr key={l.id}><td>{l.fecha_creacion}</td><td>{data.periodo?.periodo}</td><td><span className="status active">{l.estado}</span></td><td>{l.estado_inicial_factura}</td><td>{l.total_candidatas}</td><td>{l.total_generadas}</td><td>{l.total_omitidas}</td></tr>)}</tbody></table></div>
  </section>;
}

function SubscriptionsPage({ currentUser }) {
  const [items,setItems]=useState([]),[clients,setClients]=useState([]),[plans,setPlans]=useState([]),[companies,setCompanies]=useState([]),[modal,setModal]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const [filters,setFilters]=useState({q:"",estado:"Activa",cliente_id:"",plan_id:"",empresa_id:""}); const isAdmin=currentUser.rol==="Administrador";
  const canCreate=currentUser.permisos.includes("suscripciones.crear"),canEdit=currentUser.permisos.includes("suscripciones.editar"),canDelete=currentUser.permisos.includes("suscripciones.eliminar"),canExport=currentUser.permisos.includes("suscripciones.exportar");
  async function catalogs(empresaId){try{const d=await api(`/api/suscripciones/catalogos?${isAdmin&&empresaId?`empresa_id=${empresaId}`:""}`);setClients(d.clientes||[]);setPlans(d.planes||[])}catch(e){setError(e.message)}if(isAdmin){try{const d=await api("/api/companies");setCompanies((d.empresas||[]).filter(x=>x.estado))}catch(e){setError(e.message)}}}
  async function load(){setLoading(true);try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!=="")p.set(k,v)});if(!isAdmin)p.delete("empresa_id");const d=await api(`/api/suscripciones?${p}`);setItems(d.suscripciones||[]);setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{catalogs(filters.empresa_id)},[]);useEffect(()=>{load()},[filters.q,filters.estado,filters.cliente_id,filters.plan_id,filters.empresa_id]);
  async function toggle(x){const action=x.estado==="Activa"?"suspender":"activar";if(!confirm(`¿${action} la suscripción "${x.codigo||x.plan}"?`))return;try{await api(`/api/suscripciones/${x.id}`,{method:"DELETE"});await load()}catch(e){alert(e.message)}}
  async function exportCsv(){try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!=="")p.set(k,v)});const r=await fetch(`/api/suscripciones/export?${p}`,{credentials:"include"});if(!r.ok)throw new Error("No fue posible exportar");const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="suscripciones-itgps.csv";a.click();URL.revokeObjectURL(u)}catch(e){alert(e.message)}}
  function Form({item,onClose}){const [f,setF]=useState({empresa_id:item?.empresa_id||currentUser.empresa_id,cliente_id:item?.cliente_id||"",plan_id:item?.plan_id||"",codigo:item?.codigo||"",fecha_inicio:item?.fecha_inicio||new Date().toISOString().slice(0,10),fecha_fin:item?.fecha_fin||"",cantidad:item?.cantidad||1,precio:item?.precio??0,descuento:item?.descuento??0,dia_facturacion:item?.dia_facturacion||1,renovacion_automatica:item?.renovacion_automatica??0,estado:item?.estado||"Activa",observaciones:item?.observaciones||""});const [saving,setSaving]=useState(false);const change=(k,v)=>setF(x=>({...x,[k]:v}));const pc=clients.filter(x=>!isAdmin||x.empresa_id===Number(f.empresa_id)),pp=plans.filter(x=>!isAdmin||x.empresa_id===Number(f.empresa_id));async function save(e){e.preventDefault();if(!f.cliente_id)return alert("Seleccione el cliente.");if(!f.plan_id)return alert("Seleccione el plan.");setSaving(true);try{await api(item?.id?`/api/suscripciones/${item.id}`:"/api/suscripciones",{method:item?.id?"PUT":"POST",body:JSON.stringify({...f,empresa_id:Number(f.empresa_id),cliente_id:Number(f.cliente_id),plan_id:Number(f.plan_id),cantidad:Number(f.cantidad||1),precio:Number(f.precio||0),descuento:Number(f.descuento||0),dia_facturacion:Number(f.dia_facturacion||1),renovacion_automatica:Number(f.renovacion_automatica),fecha_inicio:f.fecha_inicio,fecha_fin:f.fecha_fin})});onClose();await catalogs(f.empresa_id);await load()}catch(e){alert(e.message)}finally{setSaving(false)}}return <form onSubmit={save} className="service-form"><div className="form-section-title">Asignación comercial</div><div className="form-grid form-grid-3">{isAdmin&&<label>Empresa<select value={f.empresa_id} onChange={e=>{change("empresa_id",e.target.value);change("cliente_id","");change("plan_id","");catalogs(e.target.value)}}>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}<label className="full-field">Cliente <span className="required">*</span><select value={f.cliente_id} onChange={e=>change("cliente_id",e.target.value)} required><option value="">Seleccione un cliente</option>{pc.map(c=><option key={c.id} value={c.id}>{c.razon_social||c.nombre_comercial||c.nombre}</option>)}</select></label><label className="full-field">Plan <span className="required">*</span><select value={f.plan_id} onChange={e=>{const id=e.target.value;change("plan_id",id);const p=pp.find(x=>x.id===Number(id));if(p)change("precio",Number(p.precio||0))}} required><option value="">Seleccione un plan</option>{pp.map(p=><option key={p.id} value={p.id}>{p.nombre} — {p.servicio} — {Number(p.precio||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</option>)}</select></label></div><div className="form-section-title">Vigencia y facturación</div><div className="form-grid form-grid-3"><label>Código<input value={f.codigo} onChange={e=>change("codigo",e.target.value)} placeholder="SUS-0001"/></label><label>Fecha inicio<input type="date" value={f.fecha_inicio} onChange={e=>change("fecha_inicio",e.target.value)} required/></label><label>Fecha fin<input type="date" value={f.fecha_fin} onChange={e=>change("fecha_fin",e.target.value)}/></label><label>Cantidad<input type="number" min="1" step="1" value={f.cantidad} onChange={e=>change("cantidad",e.target.value)}/></label><label>Precio (COP)<input type="number" min="0" step="1" value={f.precio} onChange={e=>change("precio",e.target.value)}/></label><label>Descuento (COP)<input type="number" min="0" step="1" value={f.descuento} onChange={e=>change("descuento",e.target.value)}/></label><label>Día de facturación<input type="number" min="1" max="31" value={f.dia_facturacion} onChange={e=>change("dia_facturacion",e.target.value)}/></label><label>Estado<select value={f.estado} onChange={e=>change("estado",e.target.value)}><option>Activa</option><option>Suspendida</option><option>Finalizada</option><option>Cancelada</option></select></label><label>Renovación automática<select value={f.renovacion_automatica} onChange={e=>change("renovacion_automatica",e.target.value)}><option value="1">Sí</option><option value="0">No</option></select></label><label className="full-field">Observaciones<textarea rows="3" value={f.observaciones} onChange={e=>change("observaciones",e.target.value)}/></label></div><div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Guardando...":"Guardar suscripción"}</button></div></form>}
  return <section className="card clients-page services-page"><div className="head"><div><span className="eyebrow">ADMINISTRACIÓN COMERCIAL · FASE 16.4</span><h2>Suscripciones</h2><p>Contratación de planes por clientes y control de vigencia, facturación y renovación.</p></div><div className="toolbar-actions">{canExport&&<button className="secondary" onClick={exportCsv}>Exportar CSV</button>}{canCreate&&<button className="primary" onClick={()=>setModal({})}><Plus/> Nueva suscripción</button>}</div></div>{error&&<div className="err">{error}</div>}<div className="filters"><input placeholder="Buscar por código, cliente, plan o servicio..." value={filters.q} onChange={e=>setFilters(x=>({...x,q:e.target.value}))}/><select value={filters.estado} onChange={e=>setFilters(x=>({...x,estado:e.target.value}))}><option value="Activa">Activas</option><option value="Suspendida">Suspendidas</option><option value="Finalizada">Finalizadas</option><option value="Cancelada">Canceladas</option><option value="">Todas</option></select><select value={filters.cliente_id} onChange={e=>setFilters(x=>({...x,cliente_id:e.target.value}))}><option value="">Todos los clientes</option>{clients.map(c=><option key={c.id} value={c.id}>{c.razon_social||c.nombre_comercial||c.nombre}</option>)}</select><select value={filters.plan_id} onChange={e=>setFilters(x=>({...x,plan_id:e.target.value}))}><option value="">Todos los planes</option>{plans.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select>{isAdmin&&<select value={filters.empresa_id} onChange={e=>{setFilters(x=>({...x,empresa_id:e.target.value,cliente_id:"",plan_id:""}));catalogs(e.target.value)}}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}<button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button></div><div className="table-meta">{items.length} suscripción(es) encontrada(s)</div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Cliente</th>{isAdmin&&<th>Empresa</th>}<th>Plan / Servicio</th><th>Inicio</th><th>Fin</th><th>Cantidad</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan={isAdmin?10:9} className="empty-cell">No hay suscripciones para los filtros seleccionados.</td></tr>:items.map(x=><tr key={x.id}><td>{x.codigo||"—"}</td><td><b>{x.razon_social||x.nombre_comercial||x.cliente||x.prospecto_nombre||"—"}</b></td>{isAdmin&&<td>{x.empresa}</td>}<td><b>{x.plan}</b><small>{x.servicio}</small></td><td>{x.fecha_inicio}</td><td>{x.fecha_fin||"Indefinida"}</td><td>{x.cantidad}</td><td>{Number(x.precio||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td><span className={x.estado==="Activa"?"status active":"status inactive"}>{x.estado}</span></td><td className="row-actions">{canEdit&&<button title="Editar" onClick={()=>setModal(x)}><Pencil/></button>}{canDelete&&<button title={x.estado==="Activa"?"Suspender":"Activar"} onClick={()=>toggle(x)}><Power/></button>}</td></tr>)}</tbody></table></div>{modal&&<Modal wide title={modal.id?"Editar suscripción":"Nueva suscripción"} onClose={()=>setModal(null)}><Form item={modal.id?modal:null} onClose={()=>setModal(null)}/></Modal>}</section>;
}


function CarteraPage({ currentUser }) {
  const isAdmin=currentUser.rol==="Administrador";
  const canCreate=currentUser.permisos.includes("cartera.crear"),canEdit=currentUser.permisos.includes("cartera.editar");
  const [summary,setSummary]=useState({facturado:0,cobrado:0,por_cobrar:0,vencido:0,clientes_con_saldo:0}),[items,setItems]=useState([]),[detail,setDetail]=useState(null),[companies,setCompanies]=useState([]),[clients,setClients]=useState([]),[modal,setModal]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const [filters,setFilters]=useState({q:"",estado:"",empresa_id:"",cliente_id:""});
  const money=v=>Number(v||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0});
  async function catalogs(companyId=""){
    try{
      const q=isAdmin&&companyId?`?empresa_id=${companyId}`:"";
      const d=await api(`/api/cartera/catalogos${q}`);
      setClients(d.clientes||[]);
      if(isAdmin){const c=await api("/api/companies");setCompanies((c.empresas||[]).filter(x=>x.estado));}
    }catch(e){setError(e.message)}
  }
  async function load(){
    setLoading(true);setError("");
    try{
      const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v)p.set(k,v)});if(!isAdmin)p.delete("empresa_id");
      const d=await api(`/api/cartera?${p}`);setSummary(d.resumen||{});setItems(d.cartera||[]);
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  useEffect(()=>{catalogs(filters.empresa_id);load()},[]);
  useEffect(()=>{load()},[filters.estado,filters.empresa_id,filters.cliente_id]);
  async function openDetail(x){try{setDetail(await api(`/api/cartera/${x.factura_id}`))}catch(e){alert(e.message)}}
  async function registerPayment(x){setModal(x)}
  function PaymentForm({item,onClose}){
    const [f,setF]=useState({fecha_pago:new Date().toISOString().slice(0,10),valor:item.saldo,medio_pago:"Transferencia bancaria",referencia:"",observaciones:""});
    const [saving,setSaving]=useState(false);
    async function save(e){e.preventDefault();const valor=Number(f.valor||0);if(valor<=0)return alert("El valor del pago debe ser mayor que cero.");if(valor>Number(item.saldo||0)+0.001)return alert("El valor no puede superar el saldo pendiente.");setSaving(true);try{await api(`/api/cartera/${item.factura_id}/pagos`,{method:"POST",body:JSON.stringify({...f,valor})});onClose();await load();if(detail) setDetail(await api(`/api/cartera/${item.factura_id}`))}catch(e){alert(e.message)}finally{setSaving(false)}}
    return <form onSubmit={save} className="service-form"><div className="form-section-title">Factura y saldo</div><div className="form-grid form-grid-3"><label>Factura<input value={item.codigo} readOnly/></label><label>Cliente<input value={item.cliente} readOnly/></label><label>Saldo pendiente<input value={money(item.saldo)} readOnly/></label></div><div className="form-section-title">Registrar pago</div><div className="form-grid form-grid-3"><label>Fecha de pago<input type="date" value={f.fecha_pago} onChange={e=>setF(x=>({...x,fecha_pago:e.target.value}))} required/></label><label>Valor (COP)<input type="number" min="1" step="1" max={Number(item.saldo||0)} value={f.valor} onChange={e=>setF(x=>({...x,valor:e.target.value}))} required/></label><label>Medio de pago<select value={f.medio_pago} onChange={e=>setF(x=>({...x,medio_pago:e.target.value}))}>{["Transferencia bancaria","Consignación","PSE","Tarjeta","Efectivo","Cheque","Otro"].map(x=><option key={x}>{x}</option>)}</select></label><label>Referencia<input value={f.referencia} onChange={e=>setF(x=>({...x,referencia:e.target.value}))} maxLength="100" placeholder="No. comprobante / referencia"/></label><label className="full-field">Observaciones<textarea rows="3" value={f.observaciones} onChange={e=>setF(x=>({...x,observaciones:e.target.value}))}/></label></div><div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Aplicando...":"Registrar pago"}</button></div></form>
  }
  return <section className="card clients-page services-page"><div className="head"><div><span className="eyebrow">ADMINISTRACIÓN FINANCIERA · FASE 20.1</span><h2>Cartera</h2><p>Control de cuentas por cobrar, saldos, vencimientos y pagos aplicados a facturas.</p></div></div>{error&&<div className="err">{error}</div>}
    <div className="kpis"><div className="kpi"><small>Total facturado</small><strong>{money(summary.facturado)}</strong></div><div className="kpi"><small>Total cobrado</small><strong>{money(summary.cobrado)}</strong></div><div className="kpi"><small>Por cobrar</small><strong>{money(summary.por_cobrar)}</strong></div><div className="kpi"><small>Vencido</small><strong>{money(summary.vencido)}</strong></div></div>
    <div className="filters"><input placeholder="Buscar factura o cliente..." value={filters.q} onChange={e=>setFilters(x=>({...x,q:e.target.value}))}/><select value={filters.estado} onChange={e=>setFilters(x=>({...x,estado:e.target.value}))}><option value="">Toda la cartera</option><option value="Por cobrar">Por cobrar</option><option value="Vencida">Vencida</option><option value="Pagada">Pagada</option></select>{isAdmin&&<select value={filters.empresa_id} onChange={e=>{setFilters(x=>({...x,empresa_id:e.target.value,cliente_id:""}));catalogs(e.target.value)}}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}<select value={filters.cliente_id} onChange={e=>setFilters(x=>({...x,cliente_id:e.target.value}))}><option value="">Todos los clientes</option>{clients.filter(c=>!isAdmin||!filters.empresa_id||c.empresa_id===Number(filters.empresa_id)).map(c=><option key={c.id} value={c.id}>{c.razon_social||c.nombre_comercial||c.nombre}</option>)}</select><button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button></div>
    <div className="table-meta">{summary.clientes_con_saldo||0} cliente(s) con saldo pendiente · {items.length} registro(s)</div><div className="table-wrap"><table><thead><tr><th>Factura</th><th>Cliente</th>{isAdmin&&<th>Empresa</th>}<th>Emisión</th><th>Vencimiento</th><th>Total</th><th>Pagado</th><th>Saldo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan={isAdmin?10:9} className="empty-cell">No hay registros para los filtros seleccionados.</td></tr>:items.map(x=><tr key={x.factura_id}><td><b>{x.codigo}</b></td><td>{x.cliente}</td>{isAdmin&&<td>{x.empresa}</td>}<td>{x.fecha_emision}</td><td>{x.fecha_vencimiento||"—"}</td><td>{money(x.total)}</td><td>{money(x.pagado)}</td><td><b>{money(x.saldo)}</b></td><td><span className={`status ${x.estado_cartera==="Pagada"?"active":x.estado_cartera==="Vencida"?"inactive":"active"}`}>{x.estado_cartera}</span></td><td className="row-actions"><button className="secondary" onClick={()=>openDetail(x)}>Ver</button>{canCreate&&x.saldo>0&&["Emitida","Vencida"].includes(x.estado)&&<button className="primary" onClick={()=>registerPayment(x)}>Registrar pago</button>}</td></tr>)}</tbody></table></div>
    {modal&&<Modal wide title={`Registrar pago — ${modal.codigo}`} onClose={()=>setModal(null)}><PaymentForm item={modal} onClose={()=>setModal(null)}/></Modal>}
    {detail&&<Modal wide title={`Ficha de cartera — ${detail.factura.codigo}`} onClose={()=>setDetail(null)}><div className="service-form"><div className="form-grid form-grid-3"><div><small>Cliente</small><b>{detail.factura.cliente}</b></div><div><small>Factura</small><b>{detail.factura.codigo}</b></div><div><small>Estado</small><b>{detail.factura.estado_cartera}</b></div><div><small>Total</small><b>{money(detail.factura.total)}</b></div><div><small>Pagado</small><b>{money(detail.factura.pagado)}</b></div><div><small>Saldo</small><b>{money(detail.factura.saldo)}</b></div><div><small>Emisión</small><b>{detail.factura.fecha_emision}</b></div><div><small>Vencimiento</small><b>{detail.factura.fecha_vencimiento||"—"}</b></div></div><div className="form-section-title">Historial de pagos</div><div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Medio</th><th>Referencia</th><th>Valor</th><th>Estado</th></tr></thead><tbody>{(detail.pagos||[]).length===0?<tr><td colSpan="5" className="empty-cell">No hay pagos registrados.</td></tr>:(detail.pagos||[]).map(p=><tr key={p.id}><td>{p.fecha_pago}</td><td>{p.medio_pago}</td><td>{p.referencia||"—"}</td><td>{money(p.valor)}</td><td><span className={`status ${p.estado==="Aplicado"?"active":"inactive"}`}>{p.estado}</span></td></tr>)}</tbody></table></div>{canCreate&&detail.factura.saldo>0&&["Emitida","Vencida"].includes(detail.factura.estado)&&<div className="actions form-actions"><button className="primary" onClick={()=>{setDetail(null);setModal({factura_id:detail.factura.id,codigo:detail.factura.codigo,cliente:detail.factura.cliente,saldo:detail.factura.saldo,estado:detail.factura.estado})}}>Registrar pago</button></div>}</div></Modal>}</section>;
}

function RenewalsPage({ currentUser }) {
  const [items,setItems]=useState([]),[expiring,setExpiring]=useState([]),[companies,setCompanies]=useState([]),[modal,setModal]=useState(null),[detail,setDetail]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false),[filters,setFilters]=useState({q:"",estado:"",empresa_id:""});
  const isAdmin=currentUser.rol==="Administrador", canCreate=currentUser.permisos.includes("renovaciones.crear"), canEdit=currentUser.permisos.includes("renovaciones.editar");
  async function catalogs(companyId=""){try{const q=isAdmin&&companyId?`?empresa_id=${companyId}&dias=60`:"?dias=60";const d=await api(`/api/renovaciones/catalogos${q}`);setExpiring(d.suscripciones||[]);if(isAdmin){const c=await api("/api/companies");setCompanies((c.empresas||[]).filter(x=>x.estado))} }catch(e){setError(e.message)}}
  async function load(){setLoading(true);try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v)p.set(k,v)});if(!isAdmin)p.delete("empresa_id");const d=await api(`/api/renovaciones?${p}`);setItems(d.renovaciones||[]);setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{catalogs(filters.empresa_id);load()},[]);useEffect(()=>{load()},[filters.q,filters.estado,filters.empresa_id]);
  async function process(sub){setModal(sub)}
  function daysLeft(d){const a=new Date();a.setHours(0,0,0,0);const b=new Date(`${d}T00:00:00`);return Math.ceil((b-a)/86400000)}
  function Form({sub,onClose}){const months=Number(sub.duracion_meses)>0?Number(sub.duracion_meses):({Mensual:1,Bimestral:2,Trimestral:3,Semestral:6,Anual:12}[sub.periodicidad]||1);const add=(date,n)=>{const d=new Date(`${date}T12:00:00`);d.setDate(1);d.setMonth(d.getMonth()+n);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(new Date(`${date}T12:00:00`).getDate(),last));return d.toISOString().slice(0,10)};const [f,setF]=useState({suscripcion_id:sub.id,nueva_fecha_inicio:add(sub.fecha_fin,0),nueva_fecha_fin:add(sub.fecha_fin,months),cantidad:sub.cantidad||1,precio:sub.precio||0,descuento:sub.descuento||0,observaciones:""}),[saving,setSaving]=useState(false);async function save(e){e.preventDefault();setSaving(true);try{await api("/api/renovaciones",{method:"POST",body:JSON.stringify({...f,cantidad:Number(f.cantidad),precio:Number(f.precio),descuento:Number(f.descuento)})});onClose();await catalogs(filters.empresa_id);await load()}catch(e){alert(e.message)}finally{setSaving(false)}}return <form onSubmit={save} className="service-form"><div className="form-section-title">Suscripción a renovar</div><div className="form-grid form-grid-3"><label>Cliente<input value={sub.razon_social||sub.nombre_comercial||sub.cliente} readOnly/></label><label>Suscripción<input value={sub.codigo||sub.id} readOnly/></label><label>Plan<input value={`${sub.plan} — ${sub.servicio}`} readOnly/></label></div><div className="form-section-title">Nueva vigencia</div><div className="form-grid form-grid-3"><label>Vencimiento actual<input value={sub.fecha_fin} readOnly/></label><label>Nueva fecha inicio<input type="date" value={f.nueva_fecha_inicio} onChange={e=>setF(x=>({...x,nueva_fecha_inicio:e.target.value}))} required/></label><label>Nueva fecha fin<input type="date" min={f.nueva_fecha_inicio} value={f.nueva_fecha_fin} onChange={e=>setF(x=>({...x,nueva_fecha_fin:e.target.value}))} required/></label><label>Cantidad<input type="number" min="1" step="1" value={f.cantidad} onChange={e=>setF(x=>({...x,cantidad:e.target.value}))}/></label><label>Precio (COP)<input type="number" min="0" step="1" value={f.precio} onChange={e=>setF(x=>({...x,precio:e.target.value}))}/></label><label>Descuento (COP)<input type="number" min="0" step="1" value={f.descuento} onChange={e=>setF(x=>({...x,descuento:e.target.value}))}/></label><label className="full-field">Observaciones<textarea rows="3" value={f.observaciones} onChange={e=>setF(x=>({...x,observaciones:e.target.value}))}/></label></div><div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Procesando...":"Procesar renovación"}</button></div></form>}
  return <section className="card clients-page services-page"><div className="head"><div><span className="eyebrow">ADMINISTRACIÓN COMERCIAL · FASE 16.7</span><h2>Renovaciones</h2><p>Control de vencimientos, renovación de suscripciones y continuidad comercial.</p></div></div>{error&&<div className="err">{error}</div>}<div className="form-section-title">Suscripciones próximas a vencer</div><div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Suscripción</th><th>Plan</th><th>Vencimiento</th><th>Días</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{expiring.length===0?<tr><td colSpan="7" className="empty-cell">No hay suscripciones próximas a vencer en los próximos 60 días.</td></tr>:expiring.map(x=><tr key={x.id}><td><b>{x.razon_social||x.nombre_comercial||x.cliente||x.prospecto_nombre||"—"}</b></td><td>{x.codigo||x.id}</td><td><b>{x.plan}</b><small>{x.servicio}</small></td><td>{x.fecha_fin}</td><td><span className={daysLeft(x.fecha_fin)<=15?"status inactive":"status active"}>{daysLeft(x.fecha_fin)}</span></td><td><span className="status active">Activa</span></td><td>{canCreate&&<button className="primary" onClick={()=>process(x)}>Renovar</button>}</td></tr>)}</tbody></table></div><div className="head" style={{marginTop:24}}><div><h3>Historial de renovaciones</h3></div></div><div className="filters"><input placeholder="Buscar código, cliente, suscripción o plan..." value={filters.q} onChange={e=>setFilters(x=>({...x,q:e.target.value}))}/><select value={filters.estado} onChange={e=>setFilters(x=>({...x,estado:e.target.value}))}><option value="">Todos los estados</option><option>Procesada</option><option>Programada</option><option>Cancelada</option></select>{isAdmin&&<select value={filters.empresa_id} onChange={e=>setFilters(x=>({...x,empresa_id:e.target.value}))}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}<button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button></div><div className="table-meta">{items.length} renovación(es)</div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Cliente</th><th>Suscripción</th><th>Plan</th><th>Nueva vigencia</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan="8" className="empty-cell">No hay renovaciones registradas.</td></tr>:items.map(x=><tr key={x.id}><td>{x.codigo}</td><td><b>{x.razon_social||x.nombre_comercial||x.cliente||x.prospecto_nombre||"—"}</b></td><td>{x.suscripcion_codigo||x.suscripcion_id}</td><td>{x.plan}</td><td>{x.nueva_fecha_inicio} → {x.nueva_fecha_fin}</td><td>{Number(x.total||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td><span className={x.estado==="Cancelada"?"status inactive":"status active"}>{x.estado}</span></td><td><button className="secondary" onClick={async()=>{try{setDetail(await api(`/api/renovaciones/${x.id}`))}catch(e){alert(e.message)}}}>Ver</button>{canEdit&&x.estado!=="Cancelada"&&!x.factura_id&&<button className="secondary" onClick={async()=>{if(confirm(`¿Generar factura para ${x.codigo}?`)){try{await api(`/api/renovaciones/${x.id}/facturar`,{method:"POST"});await load()}catch(e){alert(e.message)}}}}>Facturar</button>}{x.factura_id&&<span className="status active">{x.factura_codigo}</span>}{canEdit&&x.estado!=="Cancelada"&&<button className="secondary" onClick={async()=>{if(confirm(`¿Cancelar ${x.codigo}?`)){try{await api(`/api/renovaciones/${x.id}/cancelar`,{method:"PATCH"});await load()}catch(e){alert(e.message)}}}}>Cancelar</button>}</td></tr>)}</tbody></table></div>{modal&&<Modal wide title={`Renovar ${modal.codigo||modal.id}`} onClose={()=>setModal(null)}><Form sub={modal} onClose={()=>setModal(null)}/></Modal>}{detail&&<Modal wide title={`Ficha de renovación — ${detail.renovacion.codigo}`} onClose={()=>setDetail(null)}><div className="service-form"><div className="form-grid form-grid-3"><div><small>Cliente</small><b>{detail.renovacion.razon_social||detail.renovacion.nombre_comercial||detail.renovacion.cliente}</b></div><div><small>Suscripción</small><b>{detail.renovacion.suscripcion_codigo}</b></div><div><small>Plan</small><b>{detail.renovacion.plan}</b></div><div><small>Vigencia anterior</small><b>{detail.renovacion.fecha_anterior_fin||"—"}</b></div><div><small>Nueva vigencia</small><b>{detail.renovacion.nueva_fecha_inicio} → {detail.renovacion.nueva_fecha_fin}</b></div><div><small>Total</small><b>{Number(detail.renovacion.total||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</b></div></div></div></Modal>}</section>;
}

function PlansPage({ currentUser }) {
  const [items,setItems]=useState([]),[services,setServices]=useState([]),[companies,setCompanies]=useState([]),[modal,setModal]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const [filters,setFilters]=useState({q:"",estado:"1",servicio_id:"",empresa_id:""}); const isAdmin=currentUser.rol==="Administrador";
  const canCreate=currentUser.permisos.includes("planes.crear"),canEdit=currentUser.permisos.includes("planes.editar"),canDelete=currentUser.permisos.includes("planes.eliminar"),canExport=currentUser.permisos.includes("planes.exportar");
  const modalities=["Recurrente","Único","Por consumo","Mixto"], periods=["Mensual","Bimestral","Trimestral","Semestral","Anual","Único"];
  async function load(){setLoading(true);try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!=="")p.set(k,v)});if(!isAdmin)p.delete("empresa_id");const d=await api(`/api/planes?${p}`);setItems(d.planes||[]);setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  async function catalogs(){try{const [s,c]=await Promise.all([api(`/api/servicios?estado=1`),isAdmin?api(`/api/companies`):Promise.resolve({empresas:[]})]);setServices(s.servicios||[]);setCompanies((c.empresas||[]).filter(x=>x.estado))}catch(e){setError(e.message)}}
  useEffect(()=>{catalogs()},[]); useEffect(()=>{load()},[filters.q,filters.estado,filters.servicio_id,filters.empresa_id]);
  async function exportCsv(){try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!=="")p.set(k,v)});if(!isAdmin)p.delete("empresa_id");const r=await fetch(`/api/planes/export?${p}`,{credentials:"include"});if(!r.ok)throw new Error("No fue posible exportar");const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="planes-itgps.csv";a.click();URL.revokeObjectURL(u)}catch(e){alert(e.message)}}
  async function toggle(x){const action=x.estado?"desactivar":"activar";if(!confirm(`¿${action.charAt(0).toUpperCase()+action.slice(1)} el plan "${x.nombre}"?`))return;try{await api(`/api/planes/${x.id}`,{method:"DELETE"});await load()}catch(e){alert(e.message)}}
  function Form({item,onClose}){const [f,setF]=useState({empresa_id:item?.empresa_id||currentUser.empresa_id,servicio_id:item?.servicio_id||"",codigo:item?.codigo||"",nombre:item?.nombre||"",descripcion:item?.descripcion||"",modalidad:item?.modalidad||"Recurrente",periodicidad:item?.periodicidad||"Mensual",precio:item?.precio??0,costo_instalacion:item?.costo_instalacion??0,duracion_meses:item?.duracion_meses??0,estado:item?.estado??1,observaciones:item?.observaciones||""});const [saving,setSaving]=useState(false);const change=(k,v)=>setF(x=>({...x,[k]:v}));
    const visibleServices=services.filter(x=>!isAdmin||x.empresa_id===Number(f.empresa_id));
    async function save(e){e.preventDefault();if(!f.nombre.trim())return alert("Ingrese el nombre del plan.");if(!f.servicio_id)return alert("Seleccione el servicio base.");setSaving(true);try{await api(item?.id?`/api/planes/${item.id}`:"/api/planes",{method:item?.id?"PUT":"POST",body:JSON.stringify({...f,empresa_id:Number(f.empresa_id),servicio_id:Number(f.servicio_id),precio:Number(f.precio||0),costo_instalacion:Number(f.costo_instalacion||0),duracion_meses:Number(f.duracion_meses||0),estado:Number(f.estado)})});onClose();await catalogs();await load()}catch(e){alert(e.message)}finally{setSaving(false)}}
    return <form onSubmit={save} className="service-form"><div className="form-section-title">Identificación del plan</div><div className="form-grid form-grid-3">{isAdmin&&<label>Empresa<select value={f.empresa_id} onChange={e=>{change("empresa_id",e.target.value);change("servicio_id","")}}>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}<label>Código<input value={f.codigo} onChange={e=>change("codigo",e.target.value)} placeholder="PLN-0001"/></label><label>Estado<select value={f.estado} onChange={e=>change("estado",e.target.value)}><option value="1">Activo</option><option value="0">Inactivo</option></select></label><label className="full-field">Nombre del plan <span className="required">*</span><input value={f.nombre} onChange={e=>change("nombre",e.target.value)} placeholder="Monitoreo GPS Básico" required/></label><label className="full-field">Servicio base <span className="required">*</span><select value={f.servicio_id} onChange={e=>change("servicio_id",e.target.value)}><option value="">Seleccione un servicio</option>{visibleServices.map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label></div><div className="form-section-title">Condiciones comerciales</div><div className="form-grid form-grid-3"><label>Modalidad<select value={f.modalidad} onChange={e=>change("modalidad",e.target.value)}>{modalities.map(x=><option key={x}>{x}</option>)}</select></label><label>Periodicidad<select value={f.periodicidad} onChange={e=>change("periodicidad",e.target.value)}>{periods.map(x=><option key={x}>{x}</option>)}</select></label><label>Precio (COP)<input type="number" min="0" step="1" value={f.precio} onChange={e=>change("precio",e.target.value)}/></label><label>Costo instalación (COP)<input type="number" min="0" step="1" value={f.costo_instalacion} onChange={e=>change("costo_instalacion",e.target.value)}/></label><label>Duración (meses)<input type="number" min="0" step="1" value={f.duracion_meses} onChange={e=>change("duracion_meses",e.target.value)} placeholder="0 = indefinido"/></label><label className="full-field">Descripción<textarea rows="3" value={f.descripcion} onChange={e=>change("descripcion",e.target.value)} placeholder="Alcance y condiciones del plan."/></label></div><div className="form-section-title">Observaciones</div><label className="full-field"><textarea rows="3" value={f.observaciones} onChange={e=>change("observaciones",e.target.value)} /></label><div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Guardando...":"Guardar plan"}</button></div></form>}
  return <section className="card clients-page services-page"><div className="head"><div><span className="eyebrow">ADMINISTRACIÓN COMERCIAL · FASE 16.3</span><h2>Planes</h2><p>Planes comerciales construidos a partir del catálogo de servicios de IT GPS.</p></div><div className="toolbar-actions">{canExport&&<button className="secondary" onClick={exportCsv}>Exportar CSV</button>}{canCreate&&<button className="primary" onClick={()=>setModal({})}><Plus/> Nuevo plan</button>}</div></div>{error&&<div className="err">{error}</div>}<div className="filters"><input placeholder="Buscar por código, plan o servicio..." value={filters.q} onChange={e=>setFilters(x=>({...x,q:e.target.value}))}/><select value={filters.servicio_id} onChange={e=>setFilters(x=>({...x,servicio_id:e.target.value}))}><option value="">Todos los servicios</option>{services.map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select><select value={filters.estado} onChange={e=>setFilters(x=>({...x,estado:e.target.value}))}><option value="1">Activos</option><option value="0">Inactivos</option><option value="">Todos</option></select>{isAdmin&&<select value={filters.empresa_id} onChange={e=>setFilters(x=>({...x,empresa_id:e.target.value}))}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}<button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button></div><div className="table-meta">{items.length} plan(es) encontrado(s)</div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Plan</th>{isAdmin&&<th>Empresa</th>}<th>Servicio</th><th>Modalidad</th><th>Periodicidad</th><th>Precio</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan={isAdmin?9:8} className="empty-cell">No hay planes para los filtros seleccionados.</td></tr>:items.map(x=><tr key={x.id}><td>{x.codigo||"—"}</td><td><b>{x.nombre}</b><small>{x.descripcion||""}</small></td>{isAdmin&&<td>{x.empresa}</td>}<td>{x.servicio}</td><td>{x.modalidad}</td><td>{x.periodicidad}</td><td>{Number(x.precio||0).toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td><td><span className={x.estado?"status active":"status inactive"}>{x.estado?"Activo":"Inactivo"}</span></td><td className="row-actions">{canEdit&&<button type="button" title="Editar" onClick={()=>setModal(x)}><Pencil/></button>}{canDelete&&<button type="button" title={x.estado?"Desactivar plan":"Activar plan"} onClick={()=>toggle(x)}><Power/></button>}</td></tr>)}</tbody></table></div>{modal&&<Modal wide title={modal.id?"Editar plan":"Nuevo plan"} onClose={()=>setModal(null)}><Form item={modal.id?modal:null} onClose={()=>setModal(null)}/></Modal>}</section>;
}

function AssetsPage({ currentUser }) {
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [modal, setModal] = useState(null);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const clientContext = (()=>{try{return JSON.parse(localStorage.getItem("itgps_cliente_context")||"null")}catch{return null}})();
  const [filters, setFilters] = useState({ q: clientContext?.nombre || "", estado: "", empresa_id: "" });

  const isAdmin = currentUser.rol === "Administrador";
  const canCreate = currentUser.permisos.includes("activos.crear");
  const canEdit = currentUser.permisos.includes("activos.editar");
  const canDelete = currentUser.permisos.includes("activos.eliminar");
  const canExport = currentUser.permisos.includes("activos.exportar");

  const assetTypes = ["Vehículo", "Camión", "Tractocamión", "Bus", "Buseta", "Motocicleta", "Remolque", "Maquinaria", "Equipo", "Otro"];
  const assetStates = ["Activo", "Inactivo", "Vendido", "Retirado", "En mantenimiento"];

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => { if (value !== "") params.set(key, value); });
      if (!isAdmin) params.delete("empresa_id");
      const data = await api(`/api/activos?${params.toString()}`);
      setItems(data.activos || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanies() {
    setLoadingCatalogs(true);
    try {
      const data = await api("/api/activos/catalogos");
      setCompanies(data.empresas || []);
      setCatalogError("");
      return data.empresas || [];
    } catch (err) {
      setCompanies([]);
      setCatalogError(`No fue posible cargar las empresas: ${err.message}`);
      return [];
    } finally {
      setLoadingCatalogs(false);
    }
  }

  useEffect(() => { loadCompanies(); }, []);
  useEffect(() => { load(); }, [filters.q, filters.estado, filters.empresa_id]);

  async function remove(item) {
    if (!window.confirm(`¿Eliminar el activo "${item.placa || item.codigo}"?`)) return;
    try {
      await api(`/api/activos/${item.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  async function exportCsv() {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => { if (value !== "") params.set(key, value); });
      if (!isAdmin) params.delete("empresa_id");
      const response = await fetch(`/api/activos/export?${params.toString()}`, { credentials: "include" });
      if (!response.ok) throw new Error("No fue posible exportar");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "activos-itgps.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  }

  function emptyForm() {
    return {
      empresa_id: isAdmin ? (filters.empresa_id || "") : currentUser.empresa_id,
      cliente_id: "",
      codigo: "",
      placa: "",
      tipo_activo: "Vehículo",
      marca: "",
      linea: "",
      modelo: "",
      anio: "",
      color: "",
      vin: "",
      numero_motor: "",
      estado: "Activo",
      fecha_alta: "",
      fecha_baja: "",
      observaciones: ""
    };
  }

  async function openNew() {
    setCatalogError("");
    const empresas = await loadCompanies();
    const empresaInicial = isAdmin ? (filters.empresa_id || (empresas.length === 1 ? String(empresas[0].id) : "")) : currentUser.empresa_id;
    setModal({ ...emptyForm(), empresa_id: empresaInicial, cliente_id: "" });
  }

  function AssetForm({ item, onClose }) {
    const [form, setForm] = useState(item);
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState([]);
    const [clientLoading, setClientLoading] = useState(false);

    async function loadFormClients(companyId) {
      const id = Number(companyId || 0);
      if (!id) { setClients([]); return; }
      setClientLoading(true);
      try {
        const data = await api(`/api/activos/catalogos?empresa_id=${id}`);
        setClients(data.clientes || []);
        setCatalogError("");
      } catch (err) {
        setClients([]);
        setCatalogError(`No fue posible cargar los clientes: ${err.message}`);
      } finally {
        setClientLoading(false);
      }
    }

    useEffect(() => {
      loadFormClients(form.empresa_id);
    }, [form.empresa_id]);

    function update(field, value) {
      if (field === "empresa_id") {
        setForm(current => ({ ...current, empresa_id: value, cliente_id: "" }));
        return;
      }
      setForm(current => ({ ...current, [field]: value }));
    }

    async function submit(event) {
      event.preventDefault();
      if (!form.empresa_id) { alert("Seleccione una empresa."); return; }
      if (!form.cliente_id) { alert("Seleccione un cliente."); return; }
      setSaving(true);
      try {
        const payload = {
          ...form,
          empresa_id: isAdmin ? Number(form.empresa_id) : currentUser.empresa_id,
          cliente_id: Number(form.cliente_id),
          anio: form.anio ? Number(form.anio) : null
        };
        if (form.id) {
          await api(`/api/activos/${form.id}`, { method: "PUT", body: JSON.stringify(payload) });
        } else {
          await api("/api/activos", { method: "POST", body: JSON.stringify(payload) });
        }
        onClose();
        await load();
      } catch (err) {
        alert(err.message);
      } finally {
        setSaving(false);
      }
    }

    return (
      <form onSubmit={submit} className="asset-form">
        <div className="form-section-title">Empresa y cliente</div>
        <div className="form-grid form-grid-2">
          {isAdmin ? (
            <label>
              Empresa <span className="required">*</span>
              <select name="empresa_id" value={form.empresa_id} onChange={event => update("empresa_id", event.target.value)} required>
                <option value="">{loadingCatalogs ? "Cargando empresas..." : companies.length ? "Seleccione una empresa" : "No hay empresas activas"}</option>
                {companies.map(company => <option key={company.id} value={company.id}>{company.nombre}{company.nit ? ` — ${company.nit}` : ""}</option>)}
              </select>
            </label>
          ) : (
            <label>
              Empresa
              <input value={currentUser.empresa_nombre || "Empresa actual"} disabled />
            </label>
          )}
          <label>
            Cliente <span className="required">*</span>
            <select name="cliente_id" value={form.cliente_id} onChange={event => update("cliente_id", event.target.value)} required disabled={!form.empresa_id || clientLoading}>
              <option value="">{!form.empresa_id ? "Primero seleccione una empresa" : clientLoading ? "Cargando clientes..." : clients.length ? "Seleccione un cliente" : "No hay clientes activos en esta empresa"}</option>
              {clients.map(client => <option key={client.id} value={client.id}>{client.nombre}{client.nit ? ` — ${client.nit}` : ""}</option>)}
            </select>
          </label>
        </div>

        {catalogError && <div className="err form-message">{catalogError}</div>}

        <div className="form-section-title">Identificación</div>
        <div className="form-grid form-grid-3">
          <label>Código <span className="required">*</span><input name="codigo" value={form.codigo} onChange={event => update("codigo", event.target.value)} placeholder="Ej: ACT-0001" /></label>
          <label>Placa <span className="required">*</span><input name="placa" value={form.placa} onChange={event => update("placa", event.target.value.toUpperCase())} placeholder="Ej: ABC123" /></label>
          <label>Tipo de activo <span className="required">*</span><select name="tipo_activo" value={form.tipo_activo} onChange={event => update("tipo_activo", event.target.value)}>{assetTypes.map(type => <option key={type}>{type}</option>)}</select></label>
        </div>

        <div className="form-section-title">Información del vehículo</div>
        <div className="form-grid form-grid-4">
          <label>Marca<input name="marca" value={form.marca} onChange={event => update("marca", event.target.value)} placeholder="Ej: Chevrolet" /></label>
          <label>Línea<input name="linea" value={form.linea} onChange={event => update("linea", event.target.value)} placeholder="Ej: Onix" /></label>
          <label>Modelo<input name="modelo" value={form.modelo} onChange={event => update("modelo", event.target.value)} placeholder="Ej: LT" /></label>
          <label>Año<input name="anio" type="number" min="1900" max="2100" value={form.anio || ""} onChange={event => update("anio", event.target.value)} placeholder="Ej: 2024" /></label>
          <label>Color<input name="color" value={form.color} onChange={event => update("color", event.target.value)} placeholder="Ej: Blanco" /></label>
          <label className="span-2">VIN / Chasis<input name="vin" value={form.vin} onChange={event => update("vin", event.target.value.toUpperCase())} placeholder="Ej: 9BGN67810JB123456" /></label>
          <label>Número de motor<input name="numero_motor" value={form.numero_motor} onChange={event => update("numero_motor", event.target.value.toUpperCase())} placeholder="Ej: MTR123456789" /></label>
        </div>

        <div className="form-section-title">Información operativa</div>
        <div className="form-grid form-grid-3">
          <label>Estado <span className="required">*</span><select name="estado" value={form.estado} onChange={event => update("estado", event.target.value)}>{assetStates.map(state => <option key={state}>{state}</option>)}</select></label>
          <label>Fecha de alta <span className="required">*</span><input name="fecha_alta" type="date" value={form.fecha_alta || ""} onChange={event => update("fecha_alta", event.target.value)} /></label>
          <label>Fecha de baja<input name="fecha_baja" type="date" value={form.fecha_baja || ""} onChange={event => update("fecha_baja", event.target.value)} /></label>
        </div>

        <label className="full-field observations-field">
          Observaciones
          <textarea name="observaciones" value={form.observaciones} maxLength={500} onChange={event => update("observaciones", event.target.value)} placeholder="Observaciones adicionales del activo..." />
          <small>{(form.observaciones || "").length} / 500</small>
        </label>

        <div className="actions form-actions">
          <button type="button" className="secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="primary" disabled={saving}>{saving ? "Guardando..." : "Guardar activo"}</button>
        </div>
      </form>
    );
  }

  return (
    <section className="card clients-page">
      <div className="head">
        <div><h2>Activos</h2><p>Administre vehículos y activos asociados a sus clientes.</p></div>
        <div className="toolbar-actions">
          <button className="secondary" onClick={exportCsv} disabled={!canExport}>Exportar CSV</button>
          {canCreate && <button className="primary" onClick={openNew}><Plus /> Nuevo activo</button>}
        </div>
      </div>
      {error && <div className="err">{error}</div>}
            <ModuleDashboard eyebrow="CONTROL DE ACTIVOS" title="Estado operacional de los activos" cards={[
        {label:"Total",value:items.length,tone:"neutral",hint:"activos visibles"},
        {label:"Activos",value:items.filter(x=>x.estado==="Activo").length,tone:"success",hint:"en operación"},
        {label:"Mantenimiento",value:items.filter(x=>x.estado==="En mantenimiento").length,tone:"warning",hint:"requieren atención"},
        {label:"Retirados",value:items.filter(x=>x.estado==="Retirado").length,tone:"danger",hint:"fuera de operación"}
      ]} breakdown={[
        {label:"Activos",value:items.filter(x=>x.estado==="Activo").length,percent:items.length?items.filter(x=>x.estado==="Activo").length*100/items.length:0,tone:"green"},
        {label:"Mantenimiento",value:items.filter(x=>x.estado==="En mantenimiento").length,percent:items.length?items.filter(x=>x.estado==="En mantenimiento").length*100/items.length:0,tone:"amber"},
        {label:"Otros estados",value:items.filter(x=>!["Activo","En mantenimiento"].includes(x.estado)).length,percent:items.length?items.filter(x=>!["Activo","En mantenimiento"].includes(x.estado)).length*100/items.length:0,tone:"slate"}
      ]}/>
<div className="filters">
        <input placeholder="Buscar placa, código, marca, modelo o cliente..." value={filters.q} onChange={event => setFilters(current => ({ ...current, q: event.target.value }))} />
        <select value={filters.estado} onChange={event => setFilters(current => ({ ...current, estado: event.target.value }))}><option value="">Todos los estados</option>{assetStates.map(state => <option key={state}>{state}</option>)}</select>
        {isAdmin && <select value={filters.empresa_id} onChange={event => setFilters(current => ({ ...current, empresa_id: event.target.value }))}><option value="">Todas las empresas</option>{companies.map(company => <option key={company.id} value={company.id}>{company.nombre}</option>)}</select>}
      </div>
      <div className="table-wrap">
        <table><thead><tr><th>Código</th><th>Placa</th>{isAdmin && <th>Empresa</th>}<th>Cliente</th><th>Tipo</th><th>Marca / Modelo</th><th>Año</th><th>Estado</th><th></th></tr></thead>
          <tbody>{loading ? <tr><td colSpan={isAdmin ? 9 : 8}>Cargando...</td></tr> : items.length === 0 ? <tr><td colSpan={isAdmin ? 9 : 8} className="empty-cell">No hay activos para los filtros seleccionados.</td></tr> : items.map(item => <tr key={item.id}><td>{item.codigo || "—"}</td><td><b>{item.placa || "—"}</b></td>{isAdmin && <td>{item.empresa}</td>}<td>{item.cliente}</td><td>{item.tipo_activo}</td><td>{[item.marca, item.linea, item.modelo].filter(Boolean).join(" / ") || "—"}</td><td>{item.anio || "—"}</td><td><span className={`status ${item.estado === "Activo" ? "active" : "inactive"}`}>{item.estado}</span></td><td className="row-actions">{canEdit && <button title="Editar" onClick={() => setModal(item)}><Pencil /></button>}{canDelete && <button title="Eliminar" onClick={() => remove(item)}><Power /></button>}</td></tr>)}</tbody>
        </table>
      </div>
      {modal && <Modal title={modal.id ? "Editar activo" : "Nuevo activo"} onClose={() => setModal(null)} wide><AssetForm item={modal} onClose={() => setModal(null)} /></Modal>}
    </section>
  );
}


function EquipmentPage({ currentUser }) {
  const [items,setItems]=useState([]),[companies,setCompanies]=useState([]),[assets,setAssets]=useState([]);
  const [modal,setModal]=useState(null),[error,setError]=useState(""),[catalogError,setCatalogError]=useState(""),[loading,setLoading]=useState(false);
  const clientContext=(()=>{try{return JSON.parse(localStorage.getItem("itgps_cliente_context")||"null")}catch{return null}})();
  const [filters,setFilters]=useState({q:clientContext?.nombre||"",estado:"",empresa_id:""});
  const isAdmin=currentUser.rol==="Administrador";
  const canCreate=currentUser.permisos.includes("equipos.crear"),canEdit=currentUser.permisos.includes("equipos.editar");
  const canDelete=currentUser.permisos.includes("equipos.eliminar");
  const canExport=currentUser.permisos.includes("equipos.exportar");
  const states=["Disponible","Instalado","En servicio","Suspendido","En mantenimiento","Retirado"];

  async function load(){
    try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!=="")p.set(k,v)});if(!isAdmin)p.delete("empresa_id");
      const d=await api(`/api/equipos?${p}`);setItems(d.equipos||[]);setError("")}catch(e){setError(e.message)}
  }
  async function catalogs(companyId=""){
    try{
      const d=await api(companyId?`/api/equipos/catalogos?empresa_id=${companyId}`:"/api/equipos/catalogos");
      setCompanies(d.empresas||[]);setAssets(d.activos||[]);setCatalogError("");return d;
    }catch(e){setAssets([]);setCatalogError(e.message);return {empresas:[],activos:[]}}
  }
  useEffect(()=>{catalogs(isAdmin?filters.empresa_id:currentUser.empresa_id)},[]);
  useEffect(()=>{load()},[filters.q,filters.estado,filters.empresa_id]);

  async function newEquipment(){
    const d=await catalogs(isAdmin?filters.empresa_id:currentUser.empresa_id);
    const empresa_id=isAdmin?(filters.empresa_id||(d.empresas?.length===1?String(d.empresas[0].id):"")):currentUser.empresa_id;
    if(empresa_id){const x=await catalogs(empresa_id);setAssets(x.activos||[])}
    setModal({empresa_id,codigo:"",imei:"",numero_serie:"",fabricante:"",marca:"",modelo:"",tipo_dispositivo:"",estado:"Disponible",
      firmware:"",protocolo:"",fecha_compra:"",fecha_instalacion:"",fecha_garantia:"",observaciones:"",activo_id:""});
  }
  async function edit(x){
    try{const d=await api(`/api/equipos/${x.id}`);const c=await catalogs(String(d.equipo.empresa_id));setAssets(c.activos||[]);
      setModal({...d.equipo,activo_id:d.equipo.activo_id||""})}catch(e){alert(e.message)}
  }
  async function retire(x){if(!confirm(`¿Retirar el equipo GPS con IMEI "${x.imei}"?`))return;try{await api(`/api/equipos/${x.id}`,{method:"DELETE"});load()}catch(e){alert(e.message)}}
  async function exportCsv(){
    try{
      const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!=="")p.set(k,v)});if(!isAdmin)p.delete("empresa_id");
      const r=await fetch(`/api/equipos/export?${p}`,{credentials:"include"});
      if(!r.ok)throw new Error("No fue posible exportar");const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement("a");
      a.href=u;a.download="equipos-gps-itgps.csv";a.click();URL.revokeObjectURL(u);
    }catch(e){alert(e.message)}
  }
  return <section className="card clients-page">
    <div className="head"><div><h2>Equipos GPS</h2><p>Administración técnica de dispositivos GPS y su relación con los activos.</p></div>
      <div className="toolbar-actions">{canExport&&<button className="secondary" onClick={exportCsv}>Exportar CSV</button>}{canCreate&&<button className="primary" onClick={newEquipment}><Plus/> Nuevo equipo</button>}</div>
    </div>
    {error&&<div className="err">{error}</div>}
        <ModuleDashboard eyebrow="CONTROL DE EQUIPOS GPS" title="Estado y asignación de dispositivos" cards={[
      {label:"Total",value:items.length,tone:"neutral",hint:"equipos visibles"},
      {label:"En servicio",value:items.filter(x=>["Instalado","En servicio"].includes(x.estado)).length,tone:"success",hint:"operativos"},
      {label:"Disponibles",value:items.filter(x=>x.estado==="Disponible").length,tone:"info",hint:"listos para asignar"},
      {label:"Mantenimiento",value:items.filter(x=>x.estado==="En mantenimiento").length,tone:"warning",hint:"requieren atención"},
      {label:"Retirados",value:items.filter(x=>x.estado==="Retirado").length,tone:"danger",hint:"fuera de operación"}
    ]} breakdown={[
      {label:"En servicio",value:items.filter(x=>["Instalado","En servicio"].includes(x.estado)).length,percent:items.length?items.filter(x=>["Instalado","En servicio"].includes(x.estado)).length*100/items.length:0,tone:"green"},
      {label:"Disponibles",value:items.filter(x=>x.estado==="Disponible").length,percent:items.length?items.filter(x=>x.estado==="Disponible").length*100/items.length:0,tone:"blue"},
      {label:"Sin asignar",value:items.filter(x=>!x.activo_id).length,percent:items.length?items.filter(x=>!x.activo_id).length*100/items.length:0,tone:"slate"}
    ]}/>
<div className="filters">
      <input placeholder="Buscar IMEI, código, serial, marca, modelo, placa o cliente..." value={filters.q} onChange={e=>setFilters(f=>({...f,q:e.target.value}))}/>
      <select value={filters.estado} onChange={e=>setFilters(f=>({...f,estado:e.target.value}))}><option value="">Todos los estados</option>{states.map(x=><option key={x}>{x}</option>)}</select>
      {isAdmin&&<select value={filters.empresa_id} onChange={async e=>{const v=e.target.value;setFilters(f=>({...f,empresa_id:v}));await catalogs(v)}}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}
      <button className="secondary" onClick={load}>Actualizar</button>
    </div>
    <div className="table-meta">{items.length} equipo(s)</div>
    <div className="table-wrap"><table><thead><tr><th>IMEI</th><th>Código</th><th>Marca / Modelo</th>{isAdmin&&<th>Empresa</th>}<th>Activo</th><th>Cliente</th><th>Estado</th><th>Acciones</th></tr></thead>
    <tbody>{items.length===0?<tr><td colSpan={isAdmin?8:7} className="empty-cell">No hay equipos GPS para los filtros seleccionados.</td></tr>:items.map(x=><tr key={x.id}>
      <td><b>{x.imei}</b></td><td>{x.codigo||"—"}</td><td>{[x.marca,x.modelo].filter(Boolean).join(" / ")||"—"}</td>{isAdmin&&<td>{x.empresa}</td>}
      <td>{x.placa||x.activo_codigo||"Sin asignar"}</td><td>{x.cliente||"—"}</td>
      <td><span className={`status ${x.estado==="En servicio"||x.estado==="Instalado"?"active":x.estado==="Retirado"?"inactive":""}`}>{x.estado}</span></td>
      <td className="row-actions">{canEdit&&<button title="Editar" onClick={()=>edit(x)}><Pencil/></button>}{canDelete&&x.estado!=="Retirado"&&<button title="Retirar" onClick={()=>retire(x)}><Power/></button>}</td>
    </tr>)}</tbody></table></div>
    {modal&&<Modal title={modal.id?"Editar equipo GPS":"Nuevo equipo GPS"} onClose={()=>setModal(null)} wide>
      <EquipmentForm item={modal} currentUser={currentUser} isAdmin={isAdmin} companies={companies} assets={assets} catalogs={catalogs} catalogError={catalogError} loading={loading}
        states={states} onClose={()=>setModal(null)} reload={load}/>
    </Modal>}
  </section>;
}

function EquipmentForm({item,currentUser,isAdmin,companies,assets,catalogs,catalogError,states,onClose,reload}){
  const [form,setForm]=useState(item),[saving,setSaving]=useState(false);
  useEffect(()=>{if(form.empresa_id)catalogs(form.empresa_id)},[form.empresa_id]);
  function update(k,v){setForm(f=>k==="empresa_id"?({...f,empresa_id:v,activo_id:""}):({...f,[k]:v}))}
  async function submit(e){
    e.preventDefault();
    if(!form.empresa_id)return alert("Seleccione una empresa.");
    if(!form.imei)return alert("Ingrese el IMEI.");
    setSaving(true);
    try{
      const payload={...form,empresa_id:isAdmin?Number(form.empresa_id):currentUser.empresa_id,activo_id:form.activo_id?Number(form.activo_id):null};
      if(form.id)await api(`/api/equipos/${form.id}`,{method:"PUT",body:JSON.stringify(payload)});
      else await api("/api/equipos",{method:"POST",body:JSON.stringify(payload)});
      onClose();await reload();
    }catch(e){alert(e.message)}finally{setSaving(false)}
  }
  return <form onSubmit={submit} className="asset-form equipment-form">
    <div className="form-section-title">Empresa y asignación</div>
    <div className="form-grid form-grid-2">
      <label>Empresa <span className="required">*</span>{isAdmin?<select value={form.empresa_id||""} onChange={e=>update("empresa_id",e.target.value)} required><option value="">Seleccione una empresa</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}{c.nit?` — ${c.nit}`:""}</option>)}</select>:<input value={currentUser.empresa_nombre||"Empresa actual"} disabled/>}</label>
      <label>Activo asociado<select value={form.activo_id||""} onChange={e=>update("activo_id",e.target.value)} disabled={!form.empresa_id}><option value="">{form.empresa_id?(assets.length?"Sin asignar":"No hay activos disponibles"):"Primero seleccione una empresa"}</option>{assets.map(a=><option key={a.id} value={a.id}>{a.placa||a.codigo}{a.cliente?` — ${a.cliente}`:""}{a.tipo?` — ${a.tipo}`:""}</option>)}</select></label>
    </div>
    {catalogError&&<div className="err form-message">{catalogError}</div>}

    <div className="form-section-title">Identificación del equipo</div>
    <div className="form-grid form-grid-3">
      <label>IMEI <span className="required">*</span><input value={form.imei||""} onChange={e=>update("imei",e.target.value.replace(/\D/g,""))} placeholder="Ej: 123456789012345" inputMode="numeric" maxLength={20}/></label>
      <label>Código interno<input value={form.codigo||""} onChange={e=>update("codigo",e.target.value)} placeholder="Ej: GPS-00001"/></label>
      <label>Número de serie<input value={form.numero_serie||""} onChange={e=>update("numero_serie",e.target.value)} placeholder="Serial del dispositivo"/></label>
    </div>

    <div className="form-section-title">Fabricante y dispositivo</div>
    <div className="form-grid form-grid-4">
      <label>Fabricante<input value={form.fabricante||""} onChange={e=>update("fabricante",e.target.value)} placeholder="Ej: Concox"/></label>
      <label>Marca<input value={form.marca||""} onChange={e=>update("marca",e.target.value)} placeholder="Ej: Teltonika"/></label>
      <label>Modelo<input value={form.modelo||""} onChange={e=>update("modelo",e.target.value)} placeholder="Ej: FMB920"/></label>
      <label>Tipo de dispositivo<input value={form.tipo_dispositivo||""} onChange={e=>update("tipo_dispositivo",e.target.value)} placeholder="GPS, OBD, portátil..."/></label>
    </div>

    <div className="form-section-title">Información técnica</div>
    <div className="form-grid form-grid-4">
      <label>Firmware<input value={form.firmware||""} onChange={e=>update("firmware",e.target.value)} placeholder="Versión"/></label>
      <label>Protocolo<input value={form.protocolo||""} onChange={e=>update("protocolo",e.target.value)} placeholder="Ej: TCP / GT06"/></label>
      <label>Estado <span className="required">*</span><select value={form.estado||"Disponible"} onChange={e=>update("estado",e.target.value)}>{states.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Fecha de compra<input type="date" value={form.fecha_compra||""} onChange={e=>update("fecha_compra",e.target.value)}/></label>
    </div>

    <div className="form-section-title">Instalación y garantía</div>
    <div className="form-grid form-grid-3">
      <label>Fecha de instalación<input type="date" value={form.fecha_instalacion||""} onChange={e=>update("fecha_instalacion",e.target.value)}/></label>
      <label>Fecha de garantía<input type="date" value={form.fecha_garantia||""} onChange={e=>update("fecha_garantia",e.target.value)}/></label>
      <div></div>
    </div>

    <label className="full-field observations-field">Observaciones<textarea maxLength="500" value={form.observaciones||""} onChange={e=>update("observaciones",e.target.value)} placeholder="Información adicional del equipo..."/><small>{(form.observaciones||"").length} / 500</small></label>

    <div className="actions form-actions"><button type="button" className="secondary" onClick={onClose} disabled={saving}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?"Guardando...":"Guardar equipo"}</button></div>
  </form>;
}

function ProspectsPage({ currentUser }) {
  const [items,setItems]=useState([]),[companies,setCompanies]=useState([]),[modal,setModal]=useState(null),[error,setError]=useState(""),[filters,setFilters]=useState({q:"",etapa:"",estado:"1",empresa_id:""}),[loading,setLoading]=useState(false);
  const adminUser=currentUser.rol==="Administrador", canCreate=currentUser.permisos.includes("prospectos.crear"),canEdit=currentUser.permisos.includes("prospectos.editar"),canDelete=currentUser.permisos.includes("prospectos.eliminar"),canExport=currentUser.permisos.includes("prospectos.exportar"),canQuote=currentUser.permisos.includes("cotizaciones.crear");
  async function load(){setLoading(true);try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!=="")p.set(k,v)});if(!adminUser)p.delete("empresa_id");const d=await api(`/api/prospectos?${p}`);setItems(d.prospectos);setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{if(adminUser)api("/api/companies").then(d=>setCompanies(d.empresas.filter(x=>x.estado))).catch(e=>setError(e.message))},[]);useEffect(()=>{load()},[filters.q,filters.etapa,filters.estado,filters.empresa_id]);
  async function del(x){if(!confirm(`¿Eliminar el prospecto "${x.nombre}"?`))return;try{await api(`/api/prospectos/${x.id}`,{method:"DELETE"});load()}catch(e){alert(e.message)}}
  async function convert(x){if(!confirm(`¿Convertir "${x.nombre}" en cliente?`))return;try{await api(`/api/prospectos/${x.id}/convertir`,{method:"POST"});alert("Prospecto convertido en cliente.");load()}catch(e){alert(e.message)}}
  function quote(x){window.dispatchEvent(new CustomEvent("itgps:nueva-cotizacion",{detail:{prospecto_id:x.id,prospecto_nombre:x.nombre,empresa_id:x.empresa_id}}))}
  async function exportCsv(){try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!=="")p.set(k,v)});if(!adminUser)p.delete("empresa_id");const r=await fetch(`/api/prospectos/export?${p}`,{credentials:"include"});if(!r.ok)throw new Error("No fue posible exportar");const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="prospectos-itgps.csv";a.click();URL.revokeObjectURL(u)}catch(e){alert(e.message)}}
  function Form({item,onClose}){
    const [f,setF]=useState({empresa_id:item?.empresa_id||currentUser.empresa_id,codigo:item?.codigo||"",nombre:item?.nombre||"",tipo_prospecto:item?.tipo_prospecto||"Empresa",nit:item?.nit||"",contacto:item?.contacto||"",telefono:item?.telefono||"",correo:item?.correo||"",ciudad:item?.ciudad||"",direccion:item?.direccion||"",origen:item?.origen||"Otro",etapa:item?.etapa||"Nuevo",estado:item?.estado??1,proxima_gestion:item?.proxima_gestion||"",observaciones:item?.observaciones||""});
    const u=(k,v)=>setF(x=>({...x,[k]:v}));
    async function save(e){e.preventDefault();try{const body={...f,empresa_id:Number(f.empresa_id),estado:Number(f.estado)};await api(item?`/api/prospectos/${item.id}`:"/api/prospectos",{method:item?"PUT":"POST",body:JSON.stringify(body)});onClose();load()}catch(e){alert(e.message)}}
    return <form onSubmit={save} className="service-form">
      <div className="form-section-title">Empresa y clasificación</div>
      <div className="form-grid form-grid-3">
        {adminUser&&<label>Empresa<select value={f.empresa_id} onChange={e=>u("empresa_id",e.target.value)}>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}
        <label>Código generado<input value={f.codigo||"Se generará automáticamente"} readOnly title="Código consecutivo generado por el sistema"/></label>
        <label>Tipo de prospecto<select value={f.tipo_prospecto} onChange={e=>u("tipo_prospecto",e.target.value)}><option>Empresa</option><option>Persona</option><option>Entidad pública</option><option>Otro</option></select></label>
        <label className="full-field">Nombre / Razón social <span className="required">*</span><input required value={f.nombre} onChange={e=>u("nombre",e.target.value)} placeholder="Nombre o razón social"/></label>
      </div>
      <div className="form-section-title">Identificación y contacto</div>
      <div className="form-grid form-grid-3">
        <label>NIT / Identificación<input value={f.nit} onChange={e=>u("nit",e.target.value)} placeholder="NIT o identificación"/></label>
        <label>Contacto<input value={f.contacto} onChange={e=>u("contacto",e.target.value)} placeholder="Nombre del contacto"/></label>
        <label>Teléfono<input value={f.telefono} onChange={e=>u("telefono",e.target.value)} placeholder="Teléfono"/></label>
        <label>Correo<input type="email" value={f.correo} onChange={e=>u("correo",e.target.value)} placeholder="correo@empresa.com"/></label>
      </div>
      <div className="form-section-title">Ubicación y gestión comercial</div>
      <div className="form-grid form-grid-3">
        <label>Ciudad<input value={f.ciudad} onChange={e=>u("ciudad",e.target.value)} placeholder="Ciudad"/></label>
        <label className="full-field">Dirección<input value={f.direccion} onChange={e=>u("direccion",e.target.value)} placeholder="Dirección"/></label>
        <label>Origen<select value={f.origen} onChange={e=>u("origen",e.target.value)}><option>Referido</option><option>Web</option><option>Redes sociales</option><option>Campaña</option><option>Comercial</option><option>Otro</option></select></label>
        <label>Etapa<select value={f.etapa} onChange={e=>u("etapa",e.target.value)}><option>Nuevo</option><option>Contactado</option><option>Calificado</option><option>Cotización</option><option>Negociación</option><option>Ganado</option><option>Perdido</option></select></label>
        <label>Próxima gestión<input type="date" value={f.proxima_gestion} onChange={e=>u("proxima_gestion",e.target.value)}/></label>
      </div>
      <div className="form-section-title">Estado y observaciones</div>
      <div className="form-grid form-grid-3">
        {item&&<label>Estado<select value={f.estado} onChange={e=>u("estado",e.target.value)}><option value="1">Activo</option><option value="0">Inactivo</option></select></label>}
        <label className="full-field">Observaciones<textarea rows="4" value={f.observaciones} onChange={e=>u("observaciones",e.target.value)} placeholder="Notas y seguimiento del prospecto."/></label>
      </div>
      <div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button type="submit" className="primary">Guardar prospecto</button></div>
    </form>
  }

  return <section className="card clients-page"><div className="head"><div><h2>Prospectos</h2><p>Gestión comercial y seguimiento de oportunidades.</p></div><div className="toolbar-actions">{canExport&&<button className="secondary" onClick={exportCsv}>Exportar CSV</button>}{canCreate&&<button className="primary" onClick={()=>setModal({})}><Plus/> Nuevo prospecto</button>}</div></div>{error&&<div className="err">{error}</div>}<ModuleDashboard eyebrow="CONTROL COMERCIAL" title="Estado del proceso de prospectos" cards={[
      {label:"Total",value:items.length,tone:"neutral",hint:"oportunidades visibles"},
      {label:"Nuevos",value:items.filter(x=>x.etapa==="Nuevo").length,tone:"info",hint:"sin gestión inicial"},
      {label:"En seguimiento",value:items.filter(x=>["Contactado","Calificado","Negociación"].includes(x.etapa)).length,tone:"success",hint:"proceso comercial"},
      {label:"Cotización",value:items.filter(x=>x.etapa==="Cotización").length,tone:"warning",hint:"con propuesta"},
      {label:"Ganados",value:items.filter(x=>x.etapa==="Ganado").length,tone:"success",hint:"convertidos"},
      {label:"Perdidos",value:items.filter(x=>x.etapa==="Perdido").length,tone:"danger",hint:"cerrados"}
    ]} breakdown={[
      {label:"En seguimiento",value:items.filter(x=>["Contactado","Calificado","Negociación"].includes(x.etapa)).length,percent:items.length?items.filter(x=>["Contactado","Calificado","Negociación"].includes(x.etapa)).length*100/items.length:0,tone:"green"},
      {label:"Cotización",value:items.filter(x=>x.etapa==="Cotización").length,percent:items.length?items.filter(x=>x.etapa==="Cotización").length*100/items.length:0,tone:"amber"},
      {label:"Cierre",value:items.filter(x=>["Ganado","Perdido"].includes(x.etapa)).length,percent:items.length?items.filter(x=>["Ganado","Perdido"].includes(x.etapa)).length*100/items.length:0,tone:"blue"}
    ]}/><div className="filters"><input placeholder="Buscar prospectos..." value={filters.q} onChange={e=>setFilters(f=>({...f,q:e.target.value}))}/><select value={filters.etapa} onChange={e=>setFilters(f=>({...f,etapa:e.target.value}))}><option value="">Todas las etapas</option><option>Nuevo</option><option>Contactado</option><option>Calificado</option><option>Cotización</option><option>Negociación</option><option>Ganado</option><option>Perdido</option></select><select value={filters.estado} onChange={e=>setFilters(f=>({...f,estado:e.target.value}))}><option value="1">Activos</option><option value="0">Inactivos</option><option value="">Todos</option></select>{adminUser&&<select value={filters.empresa_id} onChange={e=>setFilters(f=>({...f,empresa_id:e.target.value}))}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}<button className="secondary" onClick={load}>{loading?"Cargando...":"Actualizar"}</button></div><div className="table-meta">{items.length} prospecto(s)</div><div className="table-wrap"><table><thead><tr><th>Código</th><th>Prospecto</th>{adminUser&&<th>Empresa</th>}<th>Contacto</th><th>Etapa</th><th>Próxima gestión</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan={adminUser?8:7} className="empty-cell">No hay prospectos.</td></tr>:items.map(x=><tr key={x.id}><td>{x.codigo||"—"}</td><td><b>{x.nombre}</b><small>{x.correo||""}</small></td>{adminUser&&<td>{x.empresa}</td>}<td>{x.contacto||x.telefono||"—"}</td><td><span className="status active">{x.etapa}</span></td><td>{x.proxima_gestion||"—"}</td><td><span className={x.estado?"status active":"status inactive"}>{x.estado?"Activo":"Inactivo"}</span></td><td className="row-actions">{canEdit&&<button title="Editar" onClick={()=>setModal(x)}><Pencil/></button>}{canEdit&&x.etapa!=="Ganado"&&<button title="Convertir en cliente" onClick={()=>convert(x)}><BriefcaseBusiness/></button>}{canQuote&&x.etapa!=="Ganado"&&<button type="button" title="Crear cotización para prospecto" onClick={()=>quote(x)}><FileText/></button> }{canDelete&&<button title="Eliminar" onClick={()=>del(x)}><Power/></button>}</td></tr>)}</tbody></table></div>{modal&&<Modal title={modal.id?"Editar prospecto":"Nuevo prospecto"} onClose={()=>setModal(null)}><Form item={modal.id?modal:null} onClose={()=>setModal(null)}/></Modal>}</section>;
}

function SimPage({ currentUser }) {
  const [items,setItems]=useState([]),[companies,setCompanies]=useState([]),[equipment,setEquipment]=useState([]),[modal,setModal]=useState(null),[error,setError]=useState(""),[catalogError,setCatalogError]=useState("");
  const clientContext=(()=>{try{return JSON.parse(localStorage.getItem("itgps_cliente_context")||"null")}catch{return null}})();
  const [filters,setFilters]=useState({q:clientContext?.nombre||"",estado:"",empresa_id:""});
  const isAdmin=currentUser.rol==="Administrador",canCreate=currentUser.permisos.includes("sim.crear"),canEdit=currentUser.permisos.includes("sim.editar"),canDelete=currentUser.permisos.includes("sim.eliminar"),canExport=currentUser.permisos.includes("sim.exportar");
  const states=["En inventario","Disponible","Asignada","Activa","Suspendida","Baja"];
  async function load(){try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!=="")p.set(k,v)});if(!isAdmin)p.delete("empresa_id");const d=await api(`/api/sim?${p}`);setItems(d.sim_cards||[]);setError("")}catch(e){setError(e.message)}}
  async function catalogs(companyId=""){try{const d=await api(companyId?`/api/sim/catalogos?empresa_id=${companyId}`:"/api/sim/catalogos");setCompanies(d.empresas||[]);setEquipment(d.equipos||[]);setCatalogError("");return d}catch(e){setEquipment([]);setCatalogError(e.message);return {empresas:[],equipos:[]}}}
  useEffect(()=>{catalogs(isAdmin?filters.empresa_id:currentUser.empresa_id)},[]);useEffect(()=>{load()},[filters.q,filters.estado,filters.empresa_id]);
  async function newSim(){const d=await catalogs(isAdmin?filters.empresa_id:currentUser.empresa_id);const empresa_id=isAdmin?(filters.empresa_id||(d.empresas?.length===1?String(d.empresas[0].id):"")):currentUser.empresa_id;const x=empresa_id?await catalogs(empresa_id):d;setEquipment(x.equipos||[]);setModal({empresa_id,iccid:"",imsi:"",numero:"",operador:"",plan_m2m:"",apn:"",usuario_apn:"",clave_apn:"",estado:"En inventario",fecha_activacion:"",fecha_suspension:"",fecha_baja:"",observaciones:"",equipo_id:""})}
  async function edit(x){try{const d=await api(`/api/sim/${x.id}`);const c=await catalogs(String(d.sim.empresa_id));setEquipment(c.equipos||[]);setModal({...d.sim,equipo_id:d.sim.equipo_id||""})}catch(e){alert(e.message)}}
  async function retire(x){if(!confirm(`¿Dar de baja la tarjeta SIM con ICCID "${x.iccid}"?`))return;try{await api(`/api/sim/${x.id}`,{method:"DELETE"});load()}catch(e){alert(e.message)}}
  async function exportCsv(){try{const p=new URLSearchParams();Object.entries(filters).forEach(([k,v])=>{if(v!=="")p.set(k,v)});if(!isAdmin)p.delete("empresa_id");const r=await fetch(`/api/sim/export?${p}`,{credentials:"include"});if(!r.ok)throw new Error("No fue posible exportar");const b=await r.blob(),u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download="tarjetas-sim-itgps.csv";a.click();URL.revokeObjectURL(u)}catch(e){alert(e.message)}}
  return <section className="card clients-page"><div className="head"><div><h2>Tarjetas SIM</h2><p>Administración de SIM, servicios M2M y su relación con los equipos GPS.</p></div><div className="toolbar-actions">{canExport&&<button className="secondary" onClick={exportCsv}>Exportar CSV</button>}{canCreate&&<button className="primary" onClick={newSim}><Plus/> Nueva SIM</button>}</div></div>{error&&<div className="err">{error}</div>}
        <ModuleDashboard eyebrow="CONTROL SIM / M2M" title="Estado y conectividad de las líneas" cards={[
      {label:"Total",value:items.length,tone:"neutral",hint:"líneas visibles"},
      {label:"Activas",value:items.filter(x=>x.estado==="Activa").length,tone:"success",hint:"en operación"},
      {label:"En inventario",value:items.filter(x=>x.estado==="En inventario").length,tone:"info",hint:"disponibles"},
      {label:"Suspendidas",value:items.filter(x=>x.estado==="Suspendida").length,tone:"warning",hint:"requieren revisión"},
      {label:"Baja",value:items.filter(x=>x.estado==="Baja").length,tone:"danger",hint:"fuera de servicio"}
    ]} breakdown={[
      {label:"Activas",value:items.filter(x=>x.estado==="Activa").length,percent:items.length?items.filter(x=>x.estado==="Activa").length*100/items.length:0,tone:"green"},
      {label:"Inventario / disponibles",value:items.filter(x=>["En inventario","Disponible","Asignada"].includes(x.estado)).length,percent:items.length?items.filter(x=>["En inventario","Disponible","Asignada"].includes(x.estado)).length*100/items.length:0,tone:"blue"},
      {label:"Suspendidas / baja",value:items.filter(x=>["Suspendida","Baja"].includes(x.estado)).length,percent:items.length?items.filter(x=>["Suspendida","Baja"].includes(x.estado)).length*100/items.length:0,tone:"amber"}
    ]}/>
<div className="filters"><input placeholder="Buscar ICCID, IMSI, número, operador, equipo, placa o cliente..." value={filters.q} onChange={e=>setFilters(f=>({...f,q:e.target.value}))}/><select value={filters.estado} onChange={e=>setFilters(f=>({...f,estado:e.target.value}))}><option value="">Todos los estados</option>{states.map(x=><option key={x}>{x}</option>)}</select>{isAdmin&&<select value={filters.empresa_id} onChange={async e=>{const v=e.target.value;setFilters(f=>({...f,empresa_id:v}));await catalogs(v)}}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}<button className="secondary" onClick={load}>Actualizar</button></div>
    <div className="table-meta">{items.length} tarjeta(s) SIM</div><div className="table-wrap"><table><thead><tr><th>ICCID</th><th>IMSI / Número</th><th>Operador / Plan</th>{isAdmin&&<th>Empresa</th>}<th>Equipo GPS</th><th>Activo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan={isAdmin?8:7} className="empty-cell">No hay tarjetas SIM para los filtros seleccionados.</td></tr>:items.map(x=><tr key={x.id}><td><b>{x.iccid}</b></td><td>{x.imsi||"—"}<small>{x.numero||""}</small></td><td>{x.operador||"—"}<small>{x.plan_m2m||""}</small></td>{isAdmin&&<td>{x.empresa}</td>}<td>{x.equipo_imei||x.equipo_codigo||"Sin asignar"}<small>{[x.equipo_marca,x.equipo_modelo].filter(Boolean).join(" / ")}</small></td><td>{x.placa||x.activo_codigo||"—"}<small>{x.cliente||""}</small></td><td><span className={`status ${x.estado==="Activa"||x.estado==="Asignada"?"active":x.estado==="Baja"?"inactive":""}`}>{x.estado}</span></td><td className="row-actions">{canEdit&&<button title="Editar" onClick={()=>edit(x)}><Pencil/></button>}{canDelete&&x.estado!=="Baja"&&<button title="Dar de baja" onClick={()=>retire(x)}><Power/></button>}</td></tr>)}</tbody></table></div>
    {modal&&<Modal title={modal.id?"Editar tarjeta SIM":"Nueva tarjeta SIM"} onClose={()=>setModal(null)} wide><SimForm item={modal} currentUser={currentUser} isAdmin={isAdmin} companies={companies} equipment={equipment} catalogs={catalogs} catalogError={catalogError} states={states} onClose={()=>setModal(null)} reload={load}/></Modal>}
  </section>;
}
function SimForm({item,currentUser,isAdmin,companies,equipment,catalogs,catalogError,states,onClose,reload}){const [form,setForm]=useState(item),[saving,setSaving]=useState(false);useEffect(()=>{if(form.empresa_id)catalogs(form.empresa_id)},[form.empresa_id]);function update(k,v){setForm(f=>k==="empresa_id"?({...f,empresa_id:v,equipo_id:""}):({...f,[k]:v}))}async function submit(e){e.preventDefault();if(!form.empresa_id)return alert("Seleccione una empresa.");if(!form.iccid)return alert("Ingrese el ICCID.");setSaving(true);try{const payload={...form,empresa_id:isAdmin?Number(form.empresa_id):currentUser.empresa_id,equipo_id:form.equipo_id?Number(form.equipo_id):null};if(form.id)await api(`/api/sim/${form.id}`,{method:"PUT",body:JSON.stringify(payload)});else await api("/api/sim",{method:"POST",body:JSON.stringify(payload)});onClose();await reload()}catch(e){alert(e.message)}finally{setSaving(false)}}return <form onSubmit={submit} className="asset-form sim-form"><div className="form-section-title">Empresa y asignación</div><div className="form-grid form-grid-2"><label>Empresa <span className="required">*</span>{isAdmin?<select value={form.empresa_id||""} onChange={e=>update("empresa_id",e.target.value)} required><option value="">Seleccione una empresa</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}{c.nit?` — ${c.nit}`:""}</option>)}</select>:<input value={currentUser.empresa_nombre||currentUser.empresa||"Empresa actual"} disabled/>}</label><label>Equipo GPS asociado<select value={form.equipo_id||""} onChange={e=>update("equipo_id",e.target.value)} disabled={!form.empresa_id}><option value="">{form.empresa_id?(equipment.length?"Sin asignar":"No hay equipos GPS disponibles"):"Primero seleccione una empresa"}</option>{equipment.map(x=><option key={x.id} value={x.id}>{x.imei}{x.codigo?` — ${x.codigo}`:""}{x.placa?` — ${x.placa}`:""}{x.cliente?` — ${x.cliente}`:""}</option>)}</select></label></div>{catalogError&&<div className="err form-message">{catalogError}</div>}
<div className="form-section-title">Identificación de la SIM</div><div className="form-grid form-grid-3"><label>ICCID <span className="required">*</span><input value={form.iccid||""} onChange={e=>update("iccid",e.target.value.replace(/\D/g,""))} placeholder="Ej: 8957012345678901234" inputMode="numeric" maxLength={22}/></label><label>IMSI<input value={form.imsi||""} onChange={e=>update("imsi",e.target.value.replace(/\D/g,""))} placeholder="Identificador IMSI" inputMode="numeric" maxLength={20}/></label><label>Número telefónico<input value={form.numero||""} onChange={e=>update("numero",e.target.value)} placeholder="Ej: 3001234567"/></label></div>
<div className="form-section-title">Operador y servicio M2M</div><div className="form-grid form-grid-4"><label>Operador<input value={form.operador||""} onChange={e=>update("operador",e.target.value)} placeholder="Ej: Claro"/></label><label>Plan M2M<input value={form.plan_m2m||""} onChange={e=>update("plan_m2m",e.target.value)} placeholder="Ej: 100 MB M2M"/></label><label>APN<input value={form.apn||""} onChange={e=>update("apn",e.target.value)} placeholder="APN del operador"/></label><label>Usuario APN<input value={form.usuario_apn||""} onChange={e=>update("usuario_apn",e.target.value)} placeholder="Usuario"/></label></div>
<div className="form-grid form-grid-3"><label>Clave APN<input type="password" value={form.clave_apn||""} onChange={e=>update("clave_apn",e.target.value)} placeholder="Clave"/></label><label>Estado <span className="required">*</span><select value={form.estado||"En inventario"} onChange={e=>update("estado",e.target.value)}>{states.map(x=><option key={x}>{x}</option>)}</select></label><label>Fecha de activación<input type="date" value={form.fecha_activacion||""} onChange={e=>update("fecha_activacion",e.target.value)}/></label></div>
<div className="form-section-title">Suspensión y baja</div><div className="form-grid form-grid-2"><label>Fecha de suspensión<input type="date" value={form.fecha_suspension||""} onChange={e=>update("fecha_suspension",e.target.value)}/></label><label>Fecha de baja<input type="date" value={form.fecha_baja||""} onChange={e=>update("fecha_baja",e.target.value)}/></label></div><label className="full-field observations-field">Observaciones<textarea maxLength="500" value={form.observaciones||""} onChange={e=>update("observaciones",e.target.value)} placeholder="Información adicional de la SIM / servicio M2M..."/><small>{(form.observaciones||"").length} / 500</small></label><div className="actions form-actions"><button type="button" className="secondary" onClick={onClose} disabled={saving}>Cancelar</button><button type="submit" className="primary" disabled={saving}>{saving?"Guardando...":"Guardar SIM"}</button></div></form>}

function M2MPage({ currentUser }) {
  const isAdmin=currentUser.rol==="Administrador";
  const canCreate=currentUser.permisos.includes("m2m.crear"), canEdit=currentUser.permisos.includes("m2m.editar"), canDelete=currentUser.permisos.includes("m2m.eliminar");
  const [tab,setTab]=useState("resumen"),[empresaId,setEmpresaId]=useState(isAdmin?"":String(currentUser.empresa_id)),[companies,setCompanies]=useState([]),[summary,setSummary]=useState(null),[lines,setLines]=useState([]),[plans,setPlans]=useState([]),[consumos,setConsumos]=useState([]),[alerts,setAlerts]=useState([]),[history,setHistory]=useState([]),[modal,setModal]=useState(null),[error,setError]=useState(""),[periodo,setPeriodo]=useState(new Date().toISOString().slice(0,7));
  const qs=empresaId?`?empresa_id=${empresaId}`:"";
  async function loadBase(){try{if(isAdmin){const c=await api("/api/companies");setCompanies((c.empresas||[]).filter(x=>x.estado));}const r=await api(`/api/m2m/resumen${qs}`);setSummary(r.kpis);setError("")}catch(e){setError(e.message)}}
  async function loadTab(){try{if(tab==="lineas"){const [l,p]=await Promise.all([api(`/api/m2m/lineas${qs}`),api(`/api/m2m/planes${qs}`)]);setLines(l.lineas||[]);setPlans(p.planes||[])}else if(tab==="planes"){setPlans((await api(`/api/m2m/planes${qs}`)).planes||[])}else if(tab==="consumo"){const [c,l]=await Promise.all([api(`/api/m2m/consumos${qs}${qs?"&":"?"}periodo=${periodo}`),api(`/api/m2m/lineas${qs}`)]);setConsumos(c.consumos||[]);setLines(l.lineas||[])}else if(tab==="alertas"){setAlerts((await api(`/api/m2m/alertas${qs}`)).alertas||[])}else if(tab==="historial"){setHistory((await api(`/api/m2m/historial${qs}`)).historial||[])}}catch(e){setError(e.message)}}
  useEffect(()=>{loadBase()},[empresaId]); useEffect(()=>{loadTab()},[tab,empresaId,periodo]);
  function changeCompany(v){setEmpresaId(v);setTab("resumen")}
  async function savePlan(e){e.preventDefault();const f=new FormData(e.currentTarget);const body={empresa_id:empresaId,nombre:f.get("nombre"),operador:f.get("operador"),descripcion:f.get("descripcion"),mb_incluidos:f.get("mb_incluidos"),costo_mensual:f.get("costo_mensual"),dia_corte:f.get("dia_corte"),alerta_80:f.get("alerta_80"),alerta_100:f.get("alerta_100"),estado:f.get("estado")};try{await api(modal?.id?`/api/m2m/planes/${modal.id}`:"/api/m2m/planes",{method:modal?.id?"PUT":"POST",body:JSON.stringify(body)});setModal(null);loadTab();loadBase()}catch(e){alert(e.message)}}
  async function saveLine(e){e.preventDefault();const f=new FormData(e.currentTarget);try{await api(`/api/m2m/lineas/${modal.id}`,{method:"PUT",body:JSON.stringify({plan_id:f.get("plan_id"),fecha_corte:f.get("fecha_corte")})});setModal(null);loadTab()}catch(e){alert(e.message)}}
  async function saveConsumption(e){e.preventDefault();const f=new FormData(e.currentTarget);try{await api("/api/m2m/consumos",{method:"POST",body:JSON.stringify({sim_id:f.get("sim_id"),periodo:f.get("periodo"),mb_consumidos:f.get("mb_consumidos")})});setModal(null);await loadTab();await loadBase()}catch(e){alert(e.message)}}
  async function changeState(line){const nuevo=window.prompt("Nuevo estado: En inventario, Disponible, Asignada, Activa, Suspendida o Baja",line.estado);if(!nuevo||nuevo===line.estado)return;const motivo=window.prompt("Motivo del cambio (opcional):","")||"";try{await api(`/api/m2m/lineas/${line.id}/estado`,{method:"PATCH",body:JSON.stringify({estado:nuevo,motivo})});loadTab();loadBase()}catch(e){alert(e.message)}}
  async function closeAlert(x){try{await api(`/api/m2m/alertas/${x.id}`,{method:"PATCH",body:JSON.stringify({estado:"ATENDIDA"})});loadTab();loadBase()}catch(e){alert(e.message)}}
  const tabs=[["resumen","Resumen"],["lineas","Líneas M2M"],["planes","Planes"],["consumo","Consumo"],["alertas","Alertas"],["historial","Historial"]];
  return <section className="card clients-page m2m-page"><div className="head"><div><h2>Gestión M2M</h2><p>Administración de planes, consumo, estados y alertas de conectividad M2M.</p></div><div className="toolbar-actions">{isAdmin&&<select className="m2m-company" value={empresaId} onChange={e=>changeCompany(e.target.value)}><option value="">Seleccione empresa</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}</div></div>{error&&<div className="err">{error}</div>}<div className="m2m-tabs">{tabs.map(([k,n])=><button type="button" key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{n}</button>)}</div>
    {tab==="resumen"&&<div className="m2m-dashboard"><div className="m2m-kpis">{[["Líneas activas",summary?.lineas_activas??0],["Suspendidas",summary?.suspendidas??0],["Bajas",summary?.bajas??0],["Consumo del mes",`${Number(summary?.consumo_mb??0).toLocaleString()} MB`],["Planes activos",summary?.planes??0],["Alertas abiertas",summary?.alertas??0]].map(([n,v])=><div className="m2m-kpi" key={n}><b>{v}</b><span>{n}</span></div>)}</div><div className="m2m-info"><h3>Control operativo M2M</h3><p>Esta fase prepara IT GPS APP para controlar planes, ciclos de corte, consumo mensual, alertas por umbral y trazabilidad de estados de las líneas.</p><div className="m2m-flow"><span>SIM</span><b>→</b><span>PLAN M2M</span><b>→</b><span>CONSUMO</span><b>→</b><span>ALERTA</span></div></div></div>}
    {tab==="lineas"&&<><div className="table-meta">{lines.length} línea(s) M2M</div><div className="table-wrap"><table><thead><tr><th>ICCID</th><th>Operador</th><th>Equipo / Activo</th><th>Plan</th><th>Consumo mes</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{lines.length===0?<tr><td colSpan="7" className="empty-cell">No hay líneas M2M.</td></tr>:lines.map(x=><tr key={x.id}><td><b>{x.iccid}</b><small>{x.numero||""}</small></td><td>{x.operador||"—"}</td><td>{x.imei||"Sin equipo"}<small>{x.placa||x.equipo_codigo||""} {x.cliente?`· ${x.cliente}`:""}</small></td><td>{x.plan_nombre||"Sin plan"}<small>{x.mb_incluidos?`${Number(x.mb_incluidos).toLocaleString()} MB` : ""}</small></td><td>{Number(x.consumo_mes||0).toLocaleString()} MB</td><td><span className={`status ${x.estado==="Activa"?"active":x.estado==="Suspendida"||x.estado==="Baja"?"inactive":""}`}>{x.estado}</span></td><td className="row-actions">{canEdit&&<button title="Configurar M2M" onClick={()=>setModal({type:"line",...x})}><Pencil/></button>}{canEdit&&<button title="Cambiar estado" onClick={()=>changeState(x)}><Power/></button>}</td></tr>)}</tbody></table></div></>}
    {tab==="planes"&&<><div className="head subhead"><div><h3>Planes M2M</h3><p>Tarifas y límites de datos por empresa.</p></div>{canCreate&&<button className="primary" onClick={()=>setModal({type:"plan",empresa_id:empresaId,nombre:"",operador:"",descripcion:"",mb_incluidos:0,costo_mensual:0,dia_corte:1,alerta_80:80,alerta_100:100,estado:1})}><Plus/> Nuevo plan</button>}</div><div className="table-wrap"><table><thead><tr><th>Plan</th><th>Operador</th><th>Datos</th><th>Costo mensual</th><th>Corte</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{plans.length===0?<tr><td colSpan="7" className="empty-cell">No hay planes M2M.</td></tr>:plans.map(x=><tr key={x.id}><td><b>{x.nombre}</b><small>{x.descripcion||""}</small></td><td>{x.operador||"—"}</td><td>{Number(x.mb_incluidos||0).toLocaleString()} MB</td><td>${Number(x.costo_mensual||0).toLocaleString()}</td><td>Día {x.dia_corte}</td><td><span className={x.estado?"status active":"status inactive"}>{x.estado?"Activo":"Inactivo"}</span></td><td className="row-actions">{canEdit&&<button title="Editar" onClick={()=>setModal({type:"plan",...x})}><Pencil/></button>}{canDelete&&x.estado===1&&<button title="Desactivar" onClick={async()=>{if(confirm(`¿Desactivar el plan ${x.nombre}?`)){try{await api(`/api/m2m/planes/${x.id}`,{method:"DELETE"});loadTab()}catch(e){alert(e.message)}}}}><Power/></button>}</td></tr>)}</tbody></table></div></>}
    {tab==="consumo"&&<><div className="filters"><label>Periodo <input type="month" value={periodo} onChange={e=>setPeriodo(e.target.value)}/></label>{canEdit&&<button className="primary" onClick={()=>setModal({type:"consumo",sim_id:lines[0]?.id||"",periodo,mb_consumidos:0})}><Plus/> Registrar consumo</button>}</div><div className="table-meta">{consumos.length} registro(s) de consumo</div><div className="table-wrap"><table><thead><tr><th>ICCID</th><th>Equipo</th><th>Plan</th><th>Incluido</th><th>Consumido</th><th>%</th></tr></thead><tbody>{consumos.length===0?<tr><td colSpan="6" className="empty-cell">No hay consumos registrados para {periodo}.</td></tr>:consumos.map(x=>{const pct=x.mb_incluidos?x.mb_consumidos/x.mb_incluidos*100:0;return <tr key={x.id}><td>{x.iccid}<small>{x.numero||""}</small></td><td>{x.imei||"Sin equipo"}<small>{x.placa||""}</small></td><td>{x.plan_nombre||x.plan_m2m||"Sin plan"}</td><td>{x.mb_incluidos?`${Number(x.mb_incluidos).toLocaleString()} MB`:"—"}</td><td>{Number(x.mb_consumidos||0).toLocaleString()} MB</td><td><span className={`status ${pct>=100?"inactive":pct>=80?"":"active"}`}>{pct.toFixed(1)}%</span></td></tr>})}</tbody></table></div></>}
    {tab==="alertas"&&<><div className="table-meta">{alerts.filter(x=>x.estado==="ABIERTA").length} alerta(s) abierta(s)</div><div className="table-wrap"><table><thead><tr><th>Fecha</th><th>SIM</th><th>Tipo</th><th>Umbral</th><th>Mensaje</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{alerts.length===0?<tr><td colSpan="7" className="empty-cell">No hay alertas.</td></tr>:alerts.map(x=><tr key={x.id}><td>{x.fecha_creacion}</td><td>{x.iccid}</td><td>{x.tipo}</td><td>{Number(x.umbral).toFixed(1)}%</td><td>{x.mensaje}</td><td><span className={x.estado==="ABIERTA"?"status inactive":"status active"}>{x.estado}</span></td><td>{x.estado==="ABIERTA"&&canEdit&&<button className="secondary" onClick={()=>closeAlert(x)}>Atender</button>}</td></tr>)}</tbody></table></div></>}
    {tab==="historial"&&<><div className="table-wrap"><table><thead><tr><th>Fecha</th><th>SIM</th><th>Anterior</th><th>Nuevo</th><th>Motivo</th><th>Usuario</th></tr></thead><tbody>{history.length===0?<tr><td colSpan="6" className="empty-cell">No hay cambios de estado registrados.</td></tr>:history.map(x=><tr key={x.id}><td>{x.fecha}</td><td>{x.iccid}</td><td>{x.estado_anterior||"—"}</td><td><span className="status active">{x.estado_nuevo}</span></td><td>{x.motivo||"—"}</td><td>{[x.usuario_nombre,x.usuario_apellido].filter(Boolean).join(" ")||"—"}</td></tr>)}</tbody></table></div></>}
    {modal?.type==="plan"&&<Modal title={modal.id?"Editar plan M2M":"Nuevo plan M2M"} onClose={()=>setModal(null)} wide><form onSubmit={savePlan} className="asset-form"><div className="form-section-title">Información del plan</div><div className="form-grid form-grid-3"><label>Nombre <span className="required">*</span><input name="nombre" required defaultValue={modal.nombre}/></label><label>Operador<input name="operador" defaultValue={modal.operador}/></label><label>MB incluidos<input name="mb_incluidos" type="number" min="0" step="0.01" defaultValue={modal.mb_incluidos}/></label></div><div className="form-grid form-grid-3"><label>Costo mensual<input name="costo_mensual" type="number" min="0" step="0.01" defaultValue={modal.costo_mensual}/></label><label>Día de corte<input name="dia_corte" type="number" min="1" max="31" defaultValue={modal.dia_corte}/></label><label>Estado<select name="estado" defaultValue={modal.estado}><option value="1">Activo</option><option value="0">Inactivo</option></select></label></div><div className="form-grid form-grid-2"><label>Alerta 80%<input name="alerta_80" type="number" min="1" max="200" defaultValue={modal.alerta_80}/></label><label>Alerta crítica<input name="alerta_100" type="number" min="1" max="300" defaultValue={modal.alerta_100}/></label></div><label className="full-field observations-field">Descripción<textarea name="descripcion" maxLength="500" defaultValue={modal.descripcion}/></label><div className="actions form-actions"><button type="button" className="secondary" onClick={()=>setModal(null)}>Cancelar</button><button className="primary">Guardar plan</button></div></form></Modal>}
    {modal?.type==="line"&&<Modal title={`Configurar M2M — ${modal.iccid}`} onClose={()=>setModal(null)}><form onSubmit={saveLine} className="asset-form"><div className="form-section-title">Servicio</div><label>Plan M2M<select name="plan_id" defaultValue={modal.plan_id||""}><option value="">Sin plan</option>{plans.filter(x=>x.estado).map(p=><option key={p.id} value={p.id}>{p.nombre} — {Number(p.mb_incluidos).toLocaleString()} MB</option>)}</select></label><label>Fecha de corte<input name="fecha_corte" type="number" min="1" max="31" defaultValue={modal.fecha_corte||""}/></label><div className="actions form-actions"><button type="button" className="secondary" onClick={()=>setModal(null)}>Cancelar</button><button className="primary">Guardar configuración</button></div></form></Modal>}
    {modal?.type==="consumo"&&<Modal title="Registrar consumo M2M" onClose={()=>setModal(null)}><form onSubmit={saveConsumption} className="asset-form"><div className="form-section-title">Consumo</div><label>SIM<select name="sim_id" defaultValue={modal.sim_id||""} required><option value="">Seleccione una SIM</option>{lines.map(x=><option key={x.id} value={x.id}>{x.iccid}{x.numero?` — ${x.numero}`:""}</option>)}</select></label><label>Periodo<input name="periodo" type="month" defaultValue={modal.periodo}/></label><label>MB consumidos<input name="mb_consumidos" type="number" min="0" step="0.01" defaultValue={modal.mb_consumidos}/></label><div className="actions form-actions"><button type="button" className="secondary" onClick={()=>setModal(null)}>Cancelar</button><button className="primary">Guardar consumo</button></div></form></Modal>}
  </section>;
}



function IntegracionesPage({ currentUser }) {
  const admin=currentUser.rol==="Administrador";
  const canCreate=currentUser.permisos?.includes("integraciones.crear"), canEdit=currentUser.permisos?.includes("integraciones.editar"), canDelete=currentUser.permisos?.includes("integraciones.eliminar");
  const [tab,setTab]=useState("resumen"),[summary,setSummary]=useState(null),[items,setItems]=useState([]),[maps,setMaps]=useState([]),[logs,setLogs]=useState([]),[companies,setCompanies]=useState([]),[empresa,setEmpresa]=useState(""),[modal,setModal]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState("");
  const scoped=admin&&empresa?`?empresa_id=${empresa}`:"";
  async function load(){setLoading(true);try{const [a,b]=await Promise.all([api(`/api/integraciones/resumen${scoped}`),api(`/api/integraciones/${scoped}`)]);setSummary(a.kpis);setItems(b.integraciones||[]);if(admin)setCompanies(b.empresas||[]);setError("")}catch(e){setError(e.message)}finally{setLoading(false)}}
  async function loadTab(t=tab){try{if(t==="mapeos")setMaps((await api(`/api/integraciones/mapeos${scoped}`)).mapeos||[]);if(t==="logs")setLogs((await api(`/api/integraciones/logs/listado${scoped}`)).logs||[])}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[empresa]);useEffect(()=>{loadTab(tab)},[tab,empresa]);
  async function test(x){try{const d=await api(`/api/integraciones/${x.id}/probar`,{method:"POST"});alert(`Conexión OK · HTTP ${d.status} · ${d.ms} ms`);load()}catch(e){alert(e.message);load()}}
  async function sync(x){try{const d=await api(`/api/integraciones/${x.id}/sincronizar`,{method:"POST"});if(d.provider==="M2MDataglobal")alert(`Sincronización M2M completada.

Total: ${d.total}
Nuevas: ${d.creadas}
Actualizadas: ${d.actualizadas}
Consumos: ${d.consumos||0}`);else alert(`Sincronización completada: ${d.procesados} de ${d.total} dispositivo(s).`);load();if(tab==="mapeos")loadTab("mapeos")}catch(e){alert(e.message);load()}}
  async function remove(x){if(!confirm(`¿Desactivar la integración "${x.nombre}"?`))return;try{await api(`/api/integraciones/${x.id}`,{method:"DELETE"});load()}catch(e){alert(e.message)}}
  async function regen(x){if(!confirm("El token actual dejará de funcionar. ¿Regenerar webhook?"))return;try{const d=await api(`/api/integraciones/${x.id}/regenerar-webhook`,{method:"POST"});alert(`Nuevo token de webhook:\n\n${d.webhook_token}`);load()}catch(e){alert(e.message)}}
  const webhookBase=`${window.location.origin.replace(/:\\d+$/,'')}:3001/api/integraciones/webhook/`;
  return <section className="card clients-page integrations-page">
    <div className="head"><div><span className="eyebrow">CAPA DE INTEGRACIÓN · FASE 28</span><h2>Integraciones GPS / M2M</h2><p>Conecta cada empresa con una o varias plataformas GPS y proveedores M2M sin amarrar el núcleo de IT GPS APP a un proveedor.</p></div><div className="toolbar-actions">{canCreate&&<button className="primary" onClick={()=>setModal({empresa_id:empresa,nombre:"",tipo:"GPS",proveedor:"",protocolo:"REST_JSON",base_url:"",auth_tipo:"BEARER",auth_token:"",dispositivos_path:"/devices",consumo_path:"/sim/consumption",timeout_ms:10000,estado:1,notas:""})}><Plus/> Nueva integración</button>}</div></div>
    {admin&&<div className="filters"><select value={empresa} onChange={e=>setEmpresa(e.target.value)}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select><button className="secondary" onClick={()=>{load();loadTab(tab)}}>{loading?<RefreshCw className="spin"/>:"Actualizar"}</button></div>}
    {error&&<div className="err">{error}</div>}
    <div className="m2m-tabs integration-tabs">{[["resumen","Resumen"],["integraciones","Conectores"],["mapeos","Mapeos"],["logs","Logs"]].map(([k,n])=><button type="button" key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}>{n}</button>)}</div>
    {tab==="resumen"&&<><div className="integration-kpis">{[["Integraciones activas",summary?.integraciones??0,Plug],["GPS",summary?.gps??0,Server],["M2M",summary?.m2m??0,DatabaseZap],["Mapeos",summary?.mapeos??0,Link2],["OK últimas 24h",summary?.ok??0,CheckCircle2],["Errores 24h",summary?.errores??0,AlertCircle]].map(([n,v,I])=><div className="integration-kpi" key={n}><span><I size={18}/></span><div><b>{v}</b><small>{n}</small></div></div>)}</div><div className="integration-architecture"><div><span className="eyebrow">ARQUITECTURA</span><h3>Una capa, múltiples plataformas</h3><p>Las empresas pueden utilizar proveedores diferentes. La integración guarda credenciales, endpoints, mapeos y trazabilidad por empresa.</p></div><div className="integration-flow"><span>IT GPS APP</span><b>→</b><span>CONECTOR</span><b>→</b><span>PLATAFORMA GPS / M2M</span></div></div></>}
    {tab==="integraciones"&&<div className="table-wrap"><table><thead><tr><th>Integración</th><th>Tipo</th><th>Proveedor</th><th>Conexión</th><th>Mapeos</th><th>Último resultado</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan="7" className="empty-cell">No hay integraciones configuradas.</td></tr>:items.map(x=><tr key={x.id}><td><b>{x.nombre}</b><small>{x.empresa}</small></td><td><span className="status active">{x.tipo}</span></td><td>{x.proveedor||"—"}</td><td>{x.base_url||"Sin URL"}<small>{x.protocolo} · {x.auth_tipo}</small></td><td>{x.mapeos}</td><td>{x.ultimo_resultado||"Sin pruebas"}<small>{x.ultimo_error||x.ultima_sincronizacion||""}</small></td><td className="row-actions">{canEdit&&<><button title="Probar conexión" onClick={()=>test(x)}><TestTube2/></button>{["M2M","AMBOS"].includes(x.tipo)&&String(x.proveedor||"").toLowerCase().includes("m2mdataglobal")&&<button title="Sincronizar M2MDataglobal" onClick={()=>sync(x)}><RefreshCw/></button>}{["GPS","AMBOS"].includes(x.tipo)&&!String(x.proveedor||"").toLowerCase().includes("m2mdataglobal")&&<button title="Sincronizar GPS" onClick={()=>sync(x)}><RefreshCw/></button>}<button title="Editar" onClick={()=>setModal({...x,auth_token:""})}><Pencil/></button><button title="Regenerar webhook" onClick={()=>regen(x)}><Webhook/></button></>}{canDelete&&<button title="Desactivar" onClick={()=>remove(x)}><Trash2/></button>}</td></tr>)}</tbody></table></div>}
    {tab==="mapeos"&&<div className="table-wrap"><table><thead><tr><th>Integración</th><th>Identificador externo</th><th>IMEI</th><th>Equipo IT GPS</th><th>Activo</th><th>Estado externo</th><th>Última sincronización</th></tr></thead><tbody>{maps.length===0?<tr><td colSpan="7" className="empty-cell">No hay mapeos todavía. Ejecuta una sincronización GPS o recibe eventos por webhook.</td></tr>:maps.filter(x=>x.estado).map(x=><tr key={x.id}><td><b>{x.integracion}</b><small>{x.proveedor||""}</small></td><td>{x.identificador_externo}</td><td>{x.imei_externo||"—"}</td><td>{x.equipo_imei||"Sin vincular"}</td><td>{x.placa||x.cliente||"—"}</td><td>{x.ultimo_estado||"—"}</td><td>{x.ultima_sincronizacion||"—"}</td></tr>)}</tbody></table></div>}
    {tab==="logs"&&<div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Integración</th><th>Operación</th><th>Resultado</th><th>HTTP</th><th>Duración</th><th>Mensaje</th></tr></thead><tbody>{logs.length===0?<tr><td colSpan="7" className="empty-cell">No hay operaciones registradas.</td></tr>:logs.map(x=><tr key={x.id}><td>{x.fecha}</td><td>{x.integracion}</td><td>{x.operacion}</td><td><span className={`status ${x.resultado==="OK"?"active":"inactive"}`}>{x.resultado}</span></td><td>{x.http_status||"—"}</td><td>{x.duracion_ms||0} ms</td><td>{x.mensaje||"—"}</td></tr>)}</tbody></table></div>}
    {modal&&<Modal title={modal.id?"Editar integración":"Nueva integración"} onClose={()=>setModal(null)} wide><IntegrationForm item={modal} currentUser={currentUser} admin={admin} companies={companies} onClose={()=>setModal(null)} reload={load}/></Modal>}
  </section>;
}

function IntegrationForm({item,currentUser,admin,companies,onClose,reload}){
 const [form,setForm]=useState(item),[saving,setSaving]=useState(false);function u(k,v){setForm(f=>({...f,[k]:v}))}
 async function submit(e){e.preventDefault();if(!form.nombre)return alert("Ingrese el nombre.");if(admin&&!form.empresa_id)return alert("Seleccione la empresa.");setSaving(true);try{const payload={...form,empresa_id:admin?Number(form.empresa_id):currentUser.empresa_id};if(form.id)await api(`/api/integraciones/${form.id}`,{method:"PUT",body:JSON.stringify(payload)});else {const d=await api("/api/integraciones",{method:"POST",body:JSON.stringify(payload)});if(d.webhook_token)alert(`Integración creada. Token webhook:\n\n${d.webhook_token}`)}onClose();reload()}catch(e){alert(e.message)}finally{setSaving(false)}}
 return <form onSubmit={submit} className="asset-form integration-form"><div className="form-section-title">Identidad y alcance</div><div className="form-grid form-grid-3"><label>Nombre <span className="required">*</span><input value={form.nombre||""} onChange={e=>u("nombre",e.target.value)} required/></label><label>Tipo<select value={form.tipo||"GPS"} onChange={e=>{const tipo=e.target.value;setForm(f=>({...f,tipo,proveedor:tipo!=="GPS"&&(!f.proveedor||f.proveedor.toLowerCase().includes("m2mdataglobal"))?"M2MDataglobal":f.proveedor,base_url:tipo!=="GPS"&&(!f.base_url||f.base_url.includes("m2mcenter.app"))?"https://m2mcenter.app/apiclient/v1":f.base_url,auth_tipo:tipo!=="GPS"?"API_KEY":f.auth_tipo,consumo_path:tipo!=="GPS"?"/sims/simList":f.consumo_path}))}}><option>GPS</option><option>M2M</option><option>AMBOS</option></select></label><label>Proveedor<input value={form.proveedor||""} onChange={e=>u("proveedor",e.target.value)} placeholder="Ej. M2MDataglobal"/></label></div>{admin&&<div className="form-grid form-grid-2"><label>Empresa<select value={form.empresa_id||""} onChange={e=>u("empresa_id",e.target.value)} required><option value="">Seleccione...</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label><label>Estado<select value={form.estado??1} onChange={e=>u("estado",Number(e.target.value))}><option value="1">Activo</option><option value="0">Inactivo</option></select></label></div>}
 <div className="form-section-title">Conexión API</div><div className="form-grid form-grid-3"><label>Protocolo<select value={form.protocolo||"REST_JSON"} onChange={e=>u("protocolo",e.target.value)}><option value="REST_JSON">REST JSON</option><option value="WEBHOOK">Webhook</option></select></label><label>URL base<input value={form.base_url||""} onChange={e=>u("base_url",e.target.value)} placeholder="https://proveedor.com/api"/></label><label>Timeout (ms)<input type="number" min="1000" max="60000" value={form.timeout_ms||10000} onChange={e=>u("timeout_ms",Number(e.target.value))}/></label></div><div className="form-grid form-grid-3"><label>Autenticación<select value={form.auth_tipo||"BEARER"} onChange={e=>u("auth_tipo",e.target.value)}><option value="BEARER">Bearer token</option><option value="API_KEY">API Key</option></select></label><label>API Key / Token<input type="password" value={form.auth_token||""} onChange={e=>u("auth_token",e.target.value)} placeholder={form.id?"Dejar vacío para conservar":"Clave privada del proveedor"}/></label><label>Ruta consulta<input value={form.tipo!=="GPS"?"/sims/simList":(form.dispositivos_path||"/devices")} onChange={e=>u(form.tipo!=="GPS"?"consumo_path":"dispositivos_path",e.target.value)} /></label></div><div className="form-grid form-grid-2"><label>Ruta detalle M2M<input value={form.tipo!=="GPS"?"/sims/simDetails/icc/{icc}":(form.consumo_path||"/sim/consumption")} onChange={e=>form.tipo!=="GPS"?null:u("consumo_path",e.target.value)} disabled={form.tipo!=="GPS"}/></label><label>Notas<textarea value={form.notas||""} onChange={e=>u("notas",e.target.value)} maxLength="1000"/></label></div>{form.webhook_token&&<div className="integration-webhook"><b>Webhook de entrada</b><span>{form.webhook_token}</span><small>Endpoint: {window.location.origin.replace(/:\\d+$/,'')}:3001/api/integraciones/webhook/{form.webhook_token}</small></div>}<div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Guardando...":"Guardar integración"}</button></div></form>;
}

function ConsolidacionPage({ currentUser }) {
  const [rows,setRows]=useState([]),[summary,setSummary]=useState({}),[issues,setIssues]=useState([]),[companies,setCompanies]=useState([]);
  const [empresa,setEmpresa]=useState(""),[estado,setEstado]=useState(""),[q,setQ]=useState(""),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const [action,setAction]=useState(null),[catalogs,setCatalogs]=useState({activos:[],equipos:[],sims:[]}),[saving,setSaving]=useState(false);
  const admin=currentUser.rol==="Administrador", canEdit=currentUser.permisos?.includes("consolidacion.editar");
  async function load(){setLoading(true);setError("");try{const qs=empresa?`?empresa_id=${empresa}`:"";const listQs=new URLSearchParams();if(empresa)listQs.set("empresa_id",empresa);if(q)listQs.set("q",q);if(estado)listQs.set("estado",estado);const [a,b,c]=await Promise.all([api(`/api/consolidacion/resumen${qs}`),api(`/api/consolidacion?${listQs}`),api(`/api/consolidacion/inconsistencias${qs}`)]);setSummary(a.resumen||{});setRows(b.rows||[]);setIssues(c.issues||[])}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{if(admin)api("/api/reportes/filtros").then(d=>setCompanies(d.empresas||[])).catch(e=>setError(e.message))},[]);
  useEffect(()=>{load()},[empresa,estado]);
  async function openAction(type,row,empresaId){try{const d=await api(`/api/consolidacion/catalogos${empresaId?`?empresa_id=${empresaId}`:""}`);setCatalogs(d);setAction({...row,type,empresa_id:empresaId||empresa||currentUser.empresa_id})}catch(e){setError(e.message)}}
  async function saveAction(e){e.preventDefault();setSaving(true);setError("");try{const fd=new FormData(e.currentTarget);if(action.type==="equipo-activo"){const equipoId=Number(action.equipo_id)||0;const activoId=Number(fd.get("activo_id"))||0;if(!equipoId||!activoId)throw new Error("Seleccione un equipo GPS y un activo disponible.");await api("/api/consolidacion/relacion/equipo-activo",{method:"PATCH",body:JSON.stringify({equipo_id:equipoId,activo_id:activoId})})}else if(action.type==="sim-equipo"){const simId=Number(action.sim_id)||0;const equipoId=Number(fd.get("equipo_id"))||0;if(!simId||!equipoId)throw new Error("Seleccione una tarjeta SIM y un equipo GPS disponible.");await api("/api/consolidacion/relacion/sim-equipo",{method:"PATCH",body:JSON.stringify({sim_id:simId,equipo_id:equipoId})})}else{throw new Error("Tipo de asignación no reconocido.")}setAction(null);await load()}catch(err){setError(err.message)}finally{setSaving(false)}}
  async function unlink(type,id,label){if(!id)return;const ok=window.confirm(`¿Desvincular ${label}? El registro quedará libre para reutilizarlo.`);if(!ok)return;setSaving(true);setError("");try{await api("/api/consolidacion/desvincular",{method:"PATCH",body:JSON.stringify({tipo:type,id:Number(id)})});await load()}catch(err){setError(err.message)}finally{setSaving(false)}}
  const statusLabel={OPERATIVO:"Operativo",ACTIVO_SIN_GPS:"Activo sin GPS",GPS_SIN_SIM:"GPS sin SIM",GPS_SIN_ACTIVO:"GPS sin activo",SIM_SIN_GPS:"SIM sin GPS"};
  const issueButton=(x)=>{if(!canEdit)return null; if(x.tipo==="ACTIVO_SIN_GPS")return <button className="small primary" onClick={()=>openAction("equipo-activo",{activo_id:x.entidad_id},empresa)}>Asignar GPS</button>;if(x.tipo==="GPS_ACTIVO_INEXISTENTE"||x.tipo==="GPS_SIN_ACTIVO")return <button className="small primary" onClick={()=>openAction("equipo-activo",{equipo_id:x.entidad_id},empresa)}>Asignar activo</button>;if(x.tipo==="GPS_SIN_SIM")return <button className="small primary" onClick={()=>openAction("sim-equipo",{equipo_id:x.entidad_id},empresa)}>Asignar SIM</button>;if(x.tipo==="SIM_GPS_INEXISTENTE"||x.tipo==="SIM_SIN_GPS")return <button className="small primary" onClick={()=>openAction("sim-equipo",{sim_id:x.entidad_id},empresa)}>Asignar GPS</button>;return null};
  return <section className="card"><div className="head"><div><h2>Consolidación operacional</h2><p>Relaciones Cliente → Activo → GPS → SIM, control de integridad y acciones de asignación.</p></div><div className="toolbar-actions"><button className="secondary" onClick={load}>Actualizar</button></div></div>
    {error&&<div className="err">{error}</div>}
    <div className="kpis">{[["Clientes",summary.clientes||0],["Activos",summary.activos||0],["Equipos GPS",summary.equipos||0],["SIM activas",summary.sims||0],["Activos sin GPS",summary.activos_sin_gps||0],["GPS sin activo",summary.gps_sin_activo||0],["SIM sin GPS",summary.sims_sin_gps||0],["Inconsistencias",(summary.gps_empresa_inconsistente||0)+(summary.sim_empresa_inconsistente||0)]].map(([label,value])=><div key={label}><b>{Number(value).toLocaleString("es-CO")}</b><span>{label}</span></div>)}</div>
    <div className="filters"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()} placeholder="Buscar cliente, placa, código, IMEI, ICCID, marca o modelo..."/>{admin&&<select value={empresa} onChange={e=>setEmpresa(e.target.value)}><option value="">Todas las empresas</option>{companies.map(x=><option key={x.id} value={x.id}>{x.nombre} — {x.nit||""}</option>)}</select>}<select value={estado} onChange={e=>setEstado(e.target.value)}><option value="">Todos los estados</option><option value="OPERATIVO">Operativo</option><option value="ACTIVO_SIN_GPS">Activo sin GPS</option><option value="GPS_SIN_SIM">GPS sin SIM</option><option value="GPS_SIN_ACTIVO">GPS sin activo</option><option value="SIM_SIN_GPS">SIM sin GPS</option></select><button className="secondary" onClick={load}>Consultar</button></div>
    <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Activo</th><th>Equipo GPS</th><th>SIM</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{loading?<tr><td colSpan="6">Consultando consolidación...</td></tr>:rows.length?rows.map((r,i)=><tr key={`${r.estado_relacion}-${r.activo_id||r.equipo_id||r.sim_id}-${i}`}><td>{r.cliente||"—"}</td><td>{r.activo_codigo||r.placa?`${r.activo_codigo||""}${r.placa?` · ${r.placa}`:""}`:"—"}</td><td>{r.imei?`${r.equipo_codigo||""}${r.equipo_codigo?" · ":""}${r.imei}`:"—"}{r.marca||r.modelo?<small style={{display:"block",color:"var(--muted)"}}>{[r.marca,r.modelo].filter(Boolean).join(" / ")}</small>:null}</td><td>{r.iccid?`${r.iccid}${r.numero?` · ${r.numero}`:""}`:"—"}</td><td><span className={`consolidation-status ${r.estado_relacion}`}>{statusLabel[r.estado_relacion]||r.estado_relacion}</span></td><td>{canEdit&&<div className="toolbar-actions">{r.estado_relacion==="ACTIVO_SIN_GPS"&&<button className="small primary" onClick={()=>openAction("equipo-activo",{activo_id:r.activo_id},empresa)}>Asignar GPS</button>}{r.estado_relacion==="GPS_SIN_ACTIVO"&&<button className="small primary" onClick={()=>openAction("equipo-activo",{equipo_id:r.equipo_id},empresa)}>Asignar activo</button>}{r.estado_relacion==="GPS_SIN_SIM"&&<button className="small primary" onClick={()=>openAction("sim-equipo",{equipo_id:r.equipo_id},empresa)}>Asignar SIM</button>}{r.estado_relacion==="SIM_SIN_GPS"&&<button className="small primary" onClick={()=>openAction("sim-equipo",{sim_id:r.sim_id},empresa)}>Asignar GPS</button>}{r.equipo_id&&<button className="small secondary" onClick={()=>unlink("equipo-activo",r.equipo_id,"el equipo GPS del activo")}>Desvincular GPS</button>}{r.sim_id&&<button className="small secondary" onClick={()=>unlink("sim-equipo",r.sim_id,"la SIM del equipo GPS")}>Desvincular SIM</button>}</div>}</td></tr>):<tr><td colSpan="6" className="empty-cell">No hay relaciones para los filtros seleccionados.</td></tr>}</tbody></table></div>
    <div className="table-meta">{rows.length.toLocaleString("es-CO")} relación(es) encontradas.</div>
    <div className="panel-heading" style={{marginTop:24}}><div><span className="eyebrow">CONTROL DE INTEGRIDAD</span><h2>Inconsistencias detectadas</h2></div></div>
    <div className="table-wrap"><table><thead><tr><th>Tipo</th><th>Entidad</th><th>ID</th><th>Detalle</th><th>Acción</th></tr></thead><tbody>{issues.length?issues.map((x,i)=><tr key={`${x.entidad}-${x.entidad_id}-${i}`}><td><span className="consolidation-status ISSUE">{x.tipo}</span></td><td>{x.entidad}</td><td>{x.entidad_id}</td><td>{x.detalle}</td><td>{issueButton(x)}</td></tr>):<tr><td colSpan="5" className="empty-cell">No se detectaron inconsistencias para la empresa seleccionada.</td></tr>}</tbody></table></div>
    {action&&<Modal title={action.type==="equipo-activo"?"Asignar equipo GPS al activo":"Asignar tarjeta SIM al equipo GPS"} onClose={()=>setAction(null)}><form onSubmit={saveAction} className="asset-form"><div className="form-section-title">Asignación operacional</div><div className="form-grid"><label>{action.type==="equipo-activo"?"Equipo GPS":"Tarjeta SIM"}<input disabled value={action.type==="equipo-activo"?(catalogs.equipos.find(x=>x.id===action.equipo_id)?.imei||catalogs.equipos.find(x=>x.id===action.equipo_id)?.codigo||"Seleccionado"):(catalogs.sims.find(x=>x.id===action.sim_id)?.iccid||"Seleccionada")}/></label>{action.type==="equipo-activo"?<label>Activo destino<select name="activo_id" defaultValue={action.activo_id||""} required><option value="">Seleccione un activo</option>{catalogs.activos.map(x=><option key={x.id} value={x.id}>{x.placa||x.codigo} — {x.cliente||"Sin cliente"}</option>)}</select></label>:<label>Equipo GPS destino<select name="equipo_id" defaultValue={action.equipo_id||""} required><option value="">Seleccione un equipo</option>{catalogs.equipos.map(x=><option key={x.id} value={x.id}>{x.imei||x.codigo} — {x.activo_codigo||"Sin activo"}</option>)}</select></label>}</div><div className="actions form-actions"><button type="button" className="secondary" onClick={()=>setAction(null)}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Guardando...":"Guardar asignación"}</button></div></form></Modal>}
  </section>;
}

function OperacionGpsPage({ currentUser }) {
  const [rows,setRows]=useState([]),[summary,setSummary]=useState({}),[companies,setCompanies]=useState([]);
  const [empresa,setEmpresa]=useState(""),[q,setQ]=useState(""),[conectividad,setConectividad]=useState(""),[operacional,setOperacional]=useState("");
  const [modal,setModal]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false);
  const admin=currentUser.rol==="Administrador";
  const canEdit=currentUser.permisos.includes("operacion_gps.editar");

  async function load() {
    setLoading(true); setError("");
    try {
      const p=new URLSearchParams();
      if(admin && empresa) p.set("empresa_id",empresa);
      if(q) p.set("q",q);
      if(conectividad) p.set("conectividad",conectividad);
      if(operacional) p.set("operacional",operacional);
      const d=await api(`/api/operacion-gps?${p}`);
      setRows(d.rows||[]); setSummary(d.summary||{});
    } catch(e){setError(e.message)}
    finally{setLoading(false)}
  }
  async function loadCompanies(){
    try { const d=await api("/api/operacion-gps/catalogos"); setCompanies(d.empresas||[]); }
    catch(e){setError(e.message)}
  }
  useEffect(()=>{loadCompanies()},[]);
  useEffect(()=>{load()},[empresa,conectividad,operacional]);

  async function save(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const fd=new FormData(e.currentTarget);
      const body=Object.fromEntries(fd.entries());
      await api(`/api/operacion-gps/${modal.id}`,{method:"PUT",body:JSON.stringify(body)});
      setModal(null); await load();
    } catch(e){setError(e.message)} finally{setSaving(false)}
  }

  return <section className="card">
    <div className="head">
      <div><h2>Operación GPS</h2><p>Estado operacional, conectividad, última comunicación y última posición de los equipos GPS.</p></div>
      <div className="toolbar-actions"><button className="secondary" onClick={load}>Actualizar</button></div>
    </div>
    {error&&<div className="err">{error}</div>}
    <div className="kpis">
      {[["Total GPS",summary.total||0],["Online",summary.online||0],["Offline",summary.offline||0],["Sin comunicación",summary.sin_comunicacion||0],["Con activo",summary.con_activo||0],["Con SIM",summary.con_sim||0],["Mantenimiento",summary.mantenimiento||0],["Fuera de servicio",summary.fuera_servicio||0]].map(([label,value])=><div key={label}><b>{Number(value).toLocaleString("es-CO")}</b><span>{label}</span></div>)}
    </div>
    <div className="filters">
      <input placeholder="Buscar IMEI, código, marca, modelo, placa o cliente..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()}/>
      {admin&&<select value={empresa} onChange={e=>setEmpresa(e.target.value)}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}
      <select value={conectividad} onChange={e=>setConectividad(e.target.value)}><option value="">Conectividad</option><option>Online</option><option>Offline</option><option>Sin comunicación</option></select>
      <select value={operacional} onChange={e=>setOperacional(e.target.value)}><option value="">Estado operacional</option><option>Operativo</option><option>En instalación</option><option>En mantenimiento</option><option>Fuera de servicio</option></select>
      <button className="secondary" onClick={load}>Consultar</button>
    </div>
    <div className="table-wrap"><table><thead><tr><th>Equipo GPS</th><th>Cliente / Activo</th><th>Conectividad</th><th>Estado operacional</th><th>Última comunicación</th><th>Última posición</th><th>SIM</th><th>Acciones</th></tr></thead>
      <tbody>{loading?<tr><td colSpan="8">Consultando operación GPS...</td></tr>:rows.length?rows.map(x=><tr key={x.id}>
        <td><b>{x.imei}</b><small>{[x.marca,x.modelo].filter(Boolean).join(" · ")||x.codigo||"—"}</small></td>
        <td><b>{x.cliente||"Sin cliente"}</b><small>{x.activo_codigo||x.placa||"Sin activo"}</small></td>
        <td><span className={`status ${x.estado_conectividad==="Online"?"active":x.estado_conectividad==="Offline"?"inactive":""}`}>{x.estado_conectividad}</span></td>
        <td>{x.estado_operacional}</td>
        <td>{x.ultima_comunicacion||"—"}</td>
        <td>{x.ultima_latitud!=null&&x.ultima_longitud!=null?`${Number(x.ultima_latitud).toFixed(6)}, ${Number(x.ultima_longitud).toFixed(6)}`:"—"}</td>
        <td>{x.iccid||"—"}</td>
        <td className="row-actions">{canEdit&&<button title="Actualizar operación" onClick={()=>setModal(x)}><Pencil/></button>}</td>
      </tr>):<tr><td colSpan="8" className="empty-cell">No hay equipos GPS para los filtros seleccionados.</td></tr>}</tbody>
    </table></div>
    {modal&&<Modal title={`Operación GPS — ${modal.imei}`} onClose={()=>setModal(null)}>
      <form onSubmit={save} className="asset-form">
        <div className="form-section-title">Estado operacional</div>
        <div className="form-grid form-grid-3">
          <label>Conectividad<select name="estado_conectividad" defaultValue={modal.estado_conectividad||"Sin comunicación"}><option>Online</option><option>Offline</option><option>Sin comunicación</option></select></label>
          <label>Estado operacional<select name="estado_operacional" defaultValue={modal.estado_operacional||"Operativo"}><option>Operativo</option><option>En instalación</option><option>En mantenimiento</option><option>Fuera de servicio</option></select></label>
          <label>Última comunicación<input name="ultima_comunicacion" defaultValue={modal.ultima_comunicacion||""} placeholder="YYYY-MM-DD HH:mm:ss"/></label>
        </div>
        <div className="form-section-title">Última posición</div>
        <div className="form-grid form-grid-3">
          <label>Latitud<input name="ultima_latitud" type="number" step="any" defaultValue={modal.ultima_latitud??""}/></label>
          <label>Longitud<input name="ultima_longitud" type="number" step="any" defaultValue={modal.ultima_longitud??""}/></label>
          <div></div>
        </div>
        <div className="form-section-title">Observaciones operacionales</div>
        <label className="full-field observations-field"><textarea name="observaciones_operacion" maxLength="500" defaultValue={modal.observaciones_operacion||""} placeholder="Observaciones de operación..."/></label>
        <div className="actions form-actions"><button type="button" className="secondary" onClick={()=>setModal(null)}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Guardando...":"Guardar cambios"}</button></div>
      </form>
    </Modal>}
  </section>;
}


function CentroOperacionalPage({ currentUser }) {
  const [rows,setRows]=useState([]),[summary,setSummary]=useState({}),[companies,setCompanies]=useState([]);
  const [empresa,setEmpresa]=useState(""),[q,setQ]=useState(""),[conectividad,setConectividad]=useState(""),[operacional,setOperacional]=useState(""),[relacion,setRelacion]=useState("");
  const [loading,setLoading]=useState(false),[error,setError]=useState(""),[selected,setSelected]=useState(null);
  const admin=currentUser.rol==="Administrador";
  async function load(){
    setLoading(true);setError("");
    try{
      const p=new URLSearchParams();
      if(admin&&empresa)p.set("empresa_id",empresa); if(q)p.set("q",q); if(conectividad)p.set("conectividad",conectividad); if(operacional)p.set("operacional",operacional); if(relacion)p.set("relacion",relacion);
      const d=await api(`/api/operacion-gps?${p}`); setRows(d.rows||[]); setSummary(d.summary||{});
      setSelected(prev=>prev&&d.rows?.find(x=>x.id===prev.id)||null);
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  async function loadCompanies(){try{const d=await api("/api/operacion-gps/catalogos");setCompanies(d.empresas||[])}catch(e){setError(e.message)}}
  useEffect(()=>{loadCompanies()},[]); useEffect(()=>{load()},[empresa,conectividad,operacional,relacion]);
  const cards=[["Total GPS",summary.total||0,"total"],["Online",summary.online||0,"online"],["Offline",summary.offline||0,"offline"],["Sin comunicación",summary.sin_comunicacion||0,"neutral"],["Con activo",summary.con_activo||0,"ok"],["Con SIM",summary.con_sim||0,"sim"],["Mantenimiento",summary.mantenimiento||0,"warn"],["Fuera de servicio",summary.fuera_servicio||0,"danger"]];
  function clearFilters(){
    setEmpresa("");
    setQ("");
    setConectividad("");
    setOperacional("");
    setRelacion("");
  }
  function connectivityClass(value){
    return value==="Online"?"active":value==="Offline"?"inactive":"neutral";
  }
  function operationalClass(value){
    if(value==="Operativo") return "operational-ok";
    if(value==="En mantenimiento") return "operational-warn";
    if(value==="Fuera de servicio") return "operational-danger";
    return "operational-neutral";
  }
  return <section className="card center-ops-page">
    <div className="head"><div><span className="eyebrow">SUPERVISIÓN OPERACIONAL</span><h2>Centro Operacional</h2><p>Vista consolidada de disponibilidad, conectividad y relación operativa de los equipos GPS.</p></div><div className="toolbar-actions"><button className="secondary" onClick={load}>Actualizar</button></div></div>
    {error&&<div className="err">{error}</div>}
    <div className="kpis center-ops-kpis">{cards.map(([label,value,type])=><div key={label} className={`center-ops-kpi ${type}`}><b>{Number(value).toLocaleString("es-CO")}</b><span>{label}</span></div>)}</div>
    <div className="center-ops-toolbar"><div className="center-ops-search"><input placeholder="Buscar IMEI, código, marca, modelo, placa o cliente..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()}/></div>
      {admin&&<select value={empresa} onChange={e=>setEmpresa(e.target.value)}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}
      <select value={conectividad} onChange={e=>setConectividad(e.target.value)}><option value="">Toda conectividad</option><option>Online</option><option>Offline</option><option>Sin comunicación</option></select>
      <select value={operacional} onChange={e=>setOperacional(e.target.value)}><option value="">Todo estado</option><option>Operativo</option><option>En instalación</option><option>En mantenimiento</option><option>Fuera de servicio</option></select>
      <select value={relacion} onChange={e=>setRelacion(e.target.value)}><option value="">Toda relación</option><option value="CON_ACTIVO">Con activo</option><option value="SIN_ACTIVO">Sin activo</option><option value="CON_SIM">Con SIM</option><option value="SIN_SIM">Sin SIM</option></select>
      <button className="secondary" onClick={load}>Consultar</button><button className="clear-filters" onClick={clearFilters}>Limpiar filtros</button>
    </div>
    <div className="center-ops-layout"><div className="table-wrap"><table><thead><tr><th>GPS</th><th>Cliente / Activo</th><th>Conectividad</th><th>Estado</th><th>Última comunicación</th><th>SIM</th><th>Acciones</th></tr></thead>
      <tbody>{loading?<tr><td colSpan="7">Consultando centro operacional...</td></tr>:rows.length?rows.map(x=><tr key={x.id} className={selected?.id===x.id?"row-selected":""} onClick={()=>setSelected(x)}><td><b>{x.imei}</b><small>{[x.marca,x.modelo].filter(Boolean).join(" · ")||x.codigo||"—"}</small></td><td><b>{x.cliente||"Sin cliente"}</b><small>{x.activo_codigo||x.placa||"Sin activo"}</small></td><td><span className={`status ${connectivityClass(x.estado_conectividad)}`}>{x.estado_conectividad}</span></td><td><span className={`center-ops-operational ${operationalClass(x.estado_operacional)}`}>{x.estado_operacional}</span></td><td>{x.ultima_comunicacion||"—"}</td><td>{x.iccid||"Sin SIM"}</td><td className="row-actions"><button className="small secondary" onClick={e=>{e.stopPropagation();setSelected(x)}}>Ver ficha</button></td></tr>):<tr><td colSpan="7" className="empty-cell">No hay equipos para los filtros seleccionados.</td></tr>}</tbody></table></div>
    </div>
    {selected&&<div className="center-ops-detail-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
      <section className="center-ops-detail-modal" role="dialog" aria-modal="true" aria-label={`Ficha operacional ${selected.imei}`}>
        <div className="center-ops-detail-head"><div><span className="eyebrow">FICHA OPERACIONAL</span><h3>{selected.imei}</h3><small>{[selected.marca,selected.modelo].filter(Boolean).join(" · ")||"Equipo GPS"}</small></div><button className="icon-button" onClick={()=>setSelected(null)} title="Cerrar" aria-label="Cerrar ficha"><X/></button></div>
        <div className="center-ops-detail-status"><span className={`status ${connectivityClass(selected.estado_conectividad)}`}>{selected.estado_conectividad}</span><span className={`center-ops-operational ${operationalClass(selected.estado_operacional)}`}>{selected.estado_operacional}</span></div>
        <div className="center-ops-detail-grid">
          <div className="center-ops-detail-section"><b>Relación</b><div className="detail-grid"><div><small>Cliente</small><strong>{selected.cliente||"Sin cliente"}</strong></div><div><small>Activo</small><strong>{selected.activo_codigo||selected.placa||"Sin activo"}</strong></div><div><small>SIM</small><strong>{selected.iccid||"Sin SIM"}</strong></div></div></div>
          <div className="center-ops-detail-section"><b>Última información</b><div className="detail-grid"><div><small>Comunicación</small><strong>{selected.ultima_comunicacion||"—"}</strong></div><div><small>Posición</small><strong>{selected.ultima_latitud!=null&&selected.ultima_longitud!=null?`${Number(selected.ultima_latitud).toFixed(6)}, ${Number(selected.ultima_longitud).toFixed(6)}`:"Sin posición"}</strong></div></div></div>
        </div>
        <div className="center-ops-detail-section"><b>Observaciones</b><p className="center-ops-note">{selected.observaciones_operacion||"Sin observaciones operacionales."}</p></div>
        <div className="center-ops-detail-actions"><button className="secondary" onClick={()=>setSelected(null)}>Cerrar ficha</button></div>
      </section>
    </div>}
  </section>;
}

function DocumentTemplatesPage({ currentUser }) {
  const isAdmin=currentUser?.rol==="Administrador";
  const canCreate=currentUser?.permisos?.includes("plantillas_documentos.crear");
  const canEdit=currentUser?.permisos?.includes("plantillas_documentos.editar");
  const canDelete=currentUser?.permisos?.includes("plantillas_documentos.eliminar");
  const [items,setItems]=useState([]),[companies,setCompanies]=useState([]),[filters,setFilters]=useState({tipo:"",estado:"1",empresa_id:""}),[modal,setModal]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const types=[ ["REPORTE","Reporte"],["COTIZACION","Cotización"],["FACTURA","Factura"],["CONTRATO","Contrato"],["ORDEN_SERVICIO","Orden de servicio"] ];
  const blank={nombre:"",tipo_documento:"REPORTE",descripcion:"",estado:1,predeterminada:0,configuracion:{margen_mm:18,orientacion:"portrait",mostrar_logo:1,mostrar_empresa:1,mostrar_cliente:1,mostrar_titulo:1,mostrar_numero:1,mostrar_fecha:1,mostrar_tabla:1,mostrar_totales:1,mostrar_firma:1,mostrar_legal:1,mostrar_bancarios:1,mostrar_pie:1,fuente:"Arial",tamano_fuente:11}};
  async function load(){setLoading(true);setError("");try{const p=new URLSearchParams();if(filters.tipo)p.set("tipo",filters.tipo);if(filters.estado!=="")p.set("estado",filters.estado);if(isAdmin&&filters.empresa_id)p.set("empresa_id",filters.empresa_id);const d=await api(`/api/plantillas-documentos?${p}`);setItems(d.plantillas||[])}catch(e){setError(e.message)}finally{setLoading(false)}}
  async function loadCatalog(){try{const d=await api("/api/plantillas-documentos/filtros");setCompanies(d.empresas||[])}catch(e){setError(e.message)}}
  useEffect(()=>{loadCatalog();load()},[]); useEffect(()=>{load()},[filters.tipo,filters.estado,filters.empresa_id]);
  async function save(form){try{const payload={...form,empresa_id:isAdmin?Number(filters.empresa_id||currentUser.empresa_id):currentUser.empresa_id};if(modal?.id)await api(`/api/plantillas-documentos/${modal.id}`,{method:"PUT",body:JSON.stringify(payload)});else await api("/api/plantillas-documentos",{method:"POST",body:JSON.stringify(payload)});setModal(null);load()}catch(e){alert(e.message)}}
  async function makeDefault(x){try{await api(`/api/plantillas-documentos/${x.id}/predeterminada`,{method:"PATCH"});load()}catch(e){alert(e.message)}}
  async function remove(x){if(!confirm(`¿Eliminar la plantilla "${x.nombre}"?`))return;try{await api(`/api/plantillas-documentos/${x.id}`,{method:"DELETE"});load()}catch(e){alert(e.message)}}
  function preview(x){window.open(`/api/plantillas-documentos/${x.id}/preview`,"_blank")}
  function Form({item,onClose}){
    const [form,setForm]=useState(item?{...item,configuracion:item.configuracion||{}}:blank);
    const set=(k,v)=>setForm(f=>({...f,[k]:v})); const setCfg=(k,v)=>setForm(f=>({...f,configuracion:{...(f.configuracion||{}),[k]:v}}));
    return <form className="template-form" onSubmit={e=>{e.preventDefault();save(form)}}>
      <div className="form-section-title" id="tpl-general"><span className="section-index">01</span><span><b>General</b><small>Información básica de la plantilla</small></span></div>
      <div className="form-grid form-grid-3"><label>Nombre de plantilla<input value={form.nombre} onChange={e=>set("nombre",e.target.value)} required placeholder="Ej. Estándar corporativa"/></label><label>Tipo de documento<select value={form.tipo_documento} onChange={e=>set("tipo_documento",e.target.value)}>{types.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></label><label>Estado<select value={Number(form.estado)} onChange={e=>set("estado",Number(e.target.value))}><option value="1">Activa</option><option value="0">Inactiva</option></select></label></div>
      <div className="form-grid form-grid-2"><label>Descripción<textarea rows="3" value={form.descripcion||""} onChange={e=>set("descripcion",e.target.value)} placeholder="Uso de la plantilla y alcance..."/></label><label className="template-check"><span>Predeterminada</span><button type="button" className={Number(form.predeterminada)?"toggle on":"toggle"} onClick={()=>set("predeterminada",Number(form.predeterminada)?0:1)}>{Number(form.predeterminada)?"Sí":"No"}</button><small>Solo puede existir una plantilla predeterminada por tipo y empresa.</small></label></div>
      <div className="form-section-title" id="tpl-header"><span className="section-index">02</span><span><b>Encabezado</b><small>Elementos que se mostrarán en la parte superior del documento</small></span></div>
      <div className="template-options"><label className={form.configuracion?.mostrar_logo?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_logo} onChange={e=>setCfg("mostrar_logo",e.target.checked?1:0)}/><span className="template-option-icon">⌁</span><span><b>Mostrar logo</b><small>Incluye el logo de la empresa en el encabezado</small></span><i>✓</i></label><label className={form.configuracion?.mostrar_empresa?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_empresa} onChange={e=>setCfg("mostrar_empresa",e.target.checked?1:0)}/><span className="template-option-icon">▦</span><span><b>Mostrar datos de empresa</b><small>Razón social, NIT, dirección y contacto</small></span><i>✓</i></label><label className={form.configuracion?.mostrar_titulo?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_titulo} onChange={e=>setCfg("mostrar_titulo",e.target.checked?1:0)}/><span className="template-option-icon">T</span><span><b>Mostrar título</b><small>Título del documento personalizable</small></span><i>✓</i></label><label className={form.configuracion?.mostrar_numero?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_numero} onChange={e=>setCfg("mostrar_numero",e.target.checked?1:0)}/><span className="template-option-icon">#</span><span><b>Mostrar numeración</b><small>Número automático del documento</small></span><i>✓</i></label></div>
      <div className="form-section-title" id="tpl-content"><span className="section-index">03</span><span><b>Contenido</b><small>Elementos que formarán el cuerpo del documento</small></span></div>
      <div className="template-options"><label className={form.configuracion?.mostrar_cliente?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_cliente} onChange={e=>setCfg("mostrar_cliente",e.target.checked?1:0)}/><span className="template-option-icon">●</span><span><b>Datos del cliente</b><small>Información del cliente destinatario</small></span><i>✓</i></label><label className={form.configuracion?.mostrar_fecha?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_fecha} onChange={e=>setCfg("mostrar_fecha",e.target.checked?1:0)}/><span className="template-option-icon">□</span><span><b>Fecha</b><small>Fecha de emisión del documento</small></span><i>✓</i></label><label className={form.configuracion?.mostrar_tabla?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_tabla} onChange={e=>setCfg("mostrar_tabla",e.target.checked?1:0)}/><span className="template-option-icon">▤</span><span><b>Tabla de información</b><small>Tabla para ítems, servicios o conceptos</small></span><i>✓</i></label><label className={form.configuracion?.mostrar_totales?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_totales} onChange={e=>setCfg("mostrar_totales",e.target.checked?1:0)}/><span className="template-option-icon">$</span><span><b>Totales</b><small>Subtotal, impuestos, descuentos y total</small></span><i>✓</i></label></div>
      <div className="form-section-title" id="tpl-footer"><span className="section-index">04</span><span><b>Pie y cierre</b><small>Firmas, textos legales y datos de cierre</small></span></div>
      <div className="template-options"><label className={form.configuracion?.mostrar_firma?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_firma} onChange={e=>setCfg("mostrar_firma",e.target.checked?1:0)}/><span className="template-option-icon">✎</span><span><b>Firma</b><small>Espacio para firma y responsable</small></span><i>✓</i></label><label className={form.configuracion?.mostrar_legal?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_legal} onChange={e=>setCfg("mostrar_legal",e.target.checked?1:0)}/><span className="template-option-icon">§</span><span><b>Texto legal</b><small>Cláusulas y leyendas legales</small></span><i>✓</i></label><label className={form.configuracion?.mostrar_bancarios?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_bancarios} onChange={e=>setCfg("mostrar_bancarios",e.target.checked?1:0)}/><span className="template-option-icon">¤</span><span><b>Datos bancarios</b><small>Información de pago de la empresa</small></span><i>✓</i></label><label className={form.configuracion?.mostrar_pie?"selected":""}><input type="checkbox" checked={!!form.configuracion?.mostrar_pie} onChange={e=>setCfg("mostrar_pie",e.target.checked?1:0)}/><span className="template-option-icon">≡</span><span><b>Pie de página</b><small>Información institucional al cierre</small></span><i>✓</i></label></div>
      <div className="form-section-title" id="tpl-style"><span className="section-index">05</span><span><b>Estilo</b><small>Configuración visual y de página</small></span></div>
      <div className="form-grid form-grid-3"><label>Orientación<select value={form.configuracion?.orientacion||"portrait"} onChange={e=>setCfg("orientacion",e.target.value)}><option value="portrait">Vertical</option><option value="landscape">Horizontal</option></select></label><label>Margen (mm)<input type="number" min="5" max="40" value={form.configuracion?.margen_mm??18} onChange={e=>setCfg("margen_mm",Number(e.target.value))}/></label><label>Fuente<select value={form.configuracion?.fuente||"Arial"} onChange={e=>setCfg("fuente",e.target.value)}><option>Arial</option><option>Helvetica</option><option>Verdana</option><option>Tahoma</option></select></label></div>
      <div className="form-section-title" id="tpl-preview"><span className="section-index">06</span><span><b>Vista previa</b><small>Comprueba cómo se aplicará la plantilla</small></span></div>
      <div className="template-preview-note"><b>Vista previa integrada</b><span>Utiliza la marca blanca de la empresa y el Motor Documental 18.2. Los detalles de cada sección se configurarán desde su pestaña correspondiente.</span></div>
      <div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary">Guardar plantilla</button></div>
    </form>;
  }
  return <section className="card templates-page"><div className="head"><div><span className="eyebrow">CONFIGURACIÓN · FASE 18.3</span><h2>Plantillas de documentos</h2><p>Plantillas reutilizables por empresa para reportes, cotizaciones, facturas, contratos y órdenes de servicio.</p></div><div className="toolbar-actions">{canCreate&&<button className="primary" onClick={()=>setModal({})}><Plus/> Nueva plantilla</button>}</div></div>{error&&<div className="err">{error}</div>}<div className="filters"><select value={filters.tipo} onChange={e=>setFilters(f=>({...f,tipo:e.target.value}))}><option value="">Todos los tipos</option>{types.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select><select value={filters.estado} onChange={e=>setFilters(f=>({...f,estado:e.target.value}))}><option value="1">Activas</option><option value="0">Inactivas</option><option value="">Todas</option></select>{isAdmin&&<select value={filters.empresa_id} onChange={e=>setFilters(f=>({...f,empresa_id:e.target.value}))}><option value="">Empresa actual</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre} — {c.nit||""}</option>)}</select>}<button className="secondary" onClick={load}>{loading?"Actualizando...":"Actualizar"}</button></div><div className="table-meta">{items.length} plantilla(s)</div><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Tipo</th>{isAdmin&&<th>Empresa</th>}<th>Estado</th><th>Predeterminada</th><th>Actualización</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan={isAdmin?7:6} className="empty-cell">No hay plantillas.</td></tr>:items.map(x=><tr key={x.id}><td><b>{x.nombre}</b><small>{x.descripcion||""}</small></td><td>{types.find(t=>t[0]===x.tipo_documento)?.[1]||x.tipo_documento}</td>{isAdmin&&<td>{x.empresa}</td>}<td><span className={`status ${x.estado?"active":"inactive"}`}>{x.estado?"Activa":"Inactiva"}</span></td><td>{x.predeterminada?<span className="status active">Sí</span>:<button className="secondary" disabled={!canEdit} onClick={()=>makeDefault(x)}>Hacer predeterminada</button>}</td><td>{x.fecha_actualizacion||x.fecha_creacion}</td><td className="row-actions"><button title="Vista previa" onClick={()=>preview(x)}>Ver</button>{canEdit&&<button title="Editar" onClick={()=>setModal(x)}><Pencil/></button>}{canDelete&&<button title="Eliminar" onClick={()=>remove(x)}><X/></button>}</td></tr>)}</tbody></table></div>{modal&&<Modal wide title={modal.id?"Editar plantilla":"Nueva plantilla"} onClose={()=>setModal(null)} sectionsOverride={[{id:"tpl-general",label:"General"},{id:"tpl-header",label:"Encabezado"},{id:"tpl-content",label:"Contenido"},{id:"tpl-footer",label:"Pie y cierre"},{id:"tpl-style",label:"Estilo"},{id:"tpl-preview",label:"Vista previa"}]}><Form item={modal.id?modal:null} onClose={()=>setModal(null)}/></Modal>}</section>;
}

function CustomReportsPage({ currentUser }){
  const [items,setItems]=useState([]),[companies,setCompanies]=useState([]),[catalog,setCatalog]=useState([]),[empresa,setEmpresa]=useState(""),[modal,setModal]=useState(null),[preview,setPreview]=useState(null),[error,setError]=useState(""),[loading,setLoading]=useState(false);
  const admin=currentUser?.rol==="Administrador";
  const canCreate=currentUser.permisos.includes("reportes_personalizados.crear"),canEdit=currentUser.permisos.includes("reportes_personalizados.editar"),canDelete=currentUser.permisos.includes("reportes_personalizados.eliminar");
  async function loadCatalog(){try{const d=await api("/api/reportes-personalizados/catalogos");setCompanies(d.empresas||[]);setCatalog(d.sources||[])}catch(e){setError(e.message)}}
  async function load(){setLoading(true);setError("");try{const qs=empresa?`?empresa_id=${empresa}`:"";const d=await api(`/api/reportes-personalizados${qs}`);setItems(d.reportes||[])}catch(e){setError(e.message)}finally{setLoading(false)}}
  useEffect(()=>{loadCatalog()},[]); useEffect(()=>{load()},[empresa]);
  async function save(form){try{const payload={...form,empresa_id:admin?Number(empresa||currentUser.empresa_id):currentUser.empresa_id};if(modal?.id)await api(`/api/reportes-personalizados/${modal.id}`,{method:"PUT",body:JSON.stringify(payload)});else await api("/api/reportes-personalizados",{method:"POST",body:JSON.stringify(payload)});setModal(null);load()}catch(e){alert(e.message)}}
  async function toggle(x){try{await api(`/api/reportes-personalizados/${x.id}/estado`,{method:"PATCH",body:JSON.stringify({estado:x.estado?0:1})});load()}catch(e){alert(e.message)}}
  async function remove(x){if(!confirm(`¿Eliminar el reporte "${x.nombre}"?`))return;try{await api(`/api/reportes-personalizados/${x.id}`,{method:"DELETE"});load()}catch(e){alert(e.message)}}
  async function showPreview(x){try{const d=await api(`/api/reportes-personalizados/${x.id}/preview`,{method:"POST",body:"{}"});setPreview(d.reporte)}catch(e){alert(e.message)}}
  function Form({item,onClose}){
    const [form,setForm]=useState({nombre:item?.nombre||"",descripcion:item?.descripcion||"",fuente:item?.fuente||catalog[0]?.id||"",estado:item?.estado??1,configuracion:item?.configuracion||{campos:[],filtros:[],orden:"",direccion:"asc"}});
    const source=catalog.find(x=>x.id===form.fuente); const selected=form.configuracion?.campos||[];
    function setCfg(k,v){setForm(f=>({...f,configuracion:{...f.configuracion,[k]:v}}))}
    function chooseSource(v){const s=catalog.find(x=>x.id===v);setForm(f=>({...f,fuente:v,configuracion:{...f.configuracion,campos:(s?.fields||[]).slice(0,5).map(x=>x.id),orden:s?.fields?.[0]?.id||""}}))}
    function toggleField(id){setCfg("campos",selected.includes(id)?selected.filter(x=>x!==id):[...selected,id])}
    return <form className="custom-report-form" onSubmit={e=>{e.preventDefault();if(!form.nombre.trim())return alert("Ingrese el nombre del reporte");save(form)}}>
      <div className="form-section-title" id="cr-source"><span className="section-index">01</span><span><b>Fuente de datos</b><small>Selecciona el módulo que alimentará el reporte</small></span></div>
      <div className="form-grid form-grid-2"><label>Nombre del reporte<input value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej. Inventario GPS por cliente"/></label><label>Fuente<select value={form.fuente} onChange={e=>chooseSource(e.target.value)}>{catalog.map(x=><option key={x.id} value={x.id}>{x.label}</option>)}</select></label></div>
      <label>Descripción<textarea value={form.descripcion} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Describe el objetivo del reporte" rows="2"/></label>
      <div className="form-section-title" id="cr-fields"><span className="section-index">02</span><span><b>Campos</b><small>Elige las columnas que aparecerán en el reporte</small></span></div>
      <div className="custom-field-grid">{(source?.fields||[]).map(f=><button type="button" key={f.id} className={`custom-field-card ${selected.includes(f.id)?"selected":""}`} onClick={()=>toggleField(f.id)}><span>{selected.includes(f.id)?"✓":"＋"}</span><b>{f.label}</b></button>)}</div>
      <div className="form-section-title" id="cr-filters"><span className="section-index">03</span><span><b>Filtros</b><small>Define condiciones para limitar los resultados</small></span></div>
      <div className="filter-builder"><div className="filter-row"><select><option>Campo</option>{(source?.fields||[]).map(f=><option key={f.id}>{f.label}</option>)}</select><select><option>Igual a</option><option>Contiene</option><option>Empieza por</option><option>Mayor que</option><option>Menor que</option></select><input placeholder="Valor"/><button type="button" className="secondary" onClick={()=>alert("Los filtros avanzados quedarán disponibles en la siguiente iteración.")}>Agregar</button></div><div className="custom-info">Puedes guardar el reporte con los campos seleccionados y añadir condiciones en futuras versiones sin perder la plantilla.</div></div>
      <div className="form-section-title" id="cr-order"><span className="section-index">04</span><span><b>Orden</b><small>Define el orden de presentación</small></span></div>
      <div className="form-grid form-grid-2"><label>Ordenar por<select value={form.configuracion?.orden||""} onChange={e=>setCfg("orden",e.target.value)}><option value="">Sin orden</option>{(source?.fields||[]).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></label><label>Dirección<select value={form.configuracion?.direccion||"asc"} onChange={e=>setCfg("direccion",e.target.value)}><option value="asc">Ascendente</option><option value="desc">Descendente</option></select></label></div>
      <div className="form-section-title" id="cr-design"><span className="section-index">05</span><span><b>Diseño</b><small>Preparación para el Motor Documental</small></span></div>
      <div className="custom-design-note"><b>Plantilla documental</b><span>El reporte utilizará la plantilla predeterminada de tipo Reporte y la marca blanca de la empresa al exportarse mediante el Motor Documental.</span></div>
      <div className="form-section-title" id="cr-preview"><span className="section-index">06</span><span><b>Vista previa</b><small>Guarda el reporte y revisa los datos reales antes de exportar</small></span></div>
      <div className="custom-preview-note">{selected.length?<><b>{selected.length} campo(s) seleccionado(s)</b><span>{selected.map(id=>source?.fields.find(f=>f.id===id)?.label).filter(Boolean).join(" · ")}</span></>:<span>Selecciona al menos un campo.</span>}</div>
      <div className="actions form-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary">Guardar reporte</button></div>
    </form>
  }
  return <section className="card custom-reports-page"><div className="head"><div><span className="eyebrow">INFORMACIÓN · FASE 18.5</span><h2>Reportes personalizados</h2><p>Construye reportes estructurados por empresa, seleccionando fuente, campos y orden de presentación.</p></div><div className="toolbar-actions">{canCreate&&<button className="primary" onClick={()=>setModal({})}><Plus/> Nuevo reporte</button>}</div></div>{error&&<div className="err">{error}</div>}<div className="filters">{admin&&<select value={empresa} onChange={e=>setEmpresa(e.target.value)}><option value="">Empresa actual</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre} — {c.nit||""}</option>)}</select>}<button className="secondary" onClick={load}>{loading?"Actualizando...":"Actualizar"}</button></div><div className="table-meta">{items.length} reporte(s) personalizado(s)</div><div className="table-wrap"><table><thead><tr><th>Nombre</th><th>Fuente</th>{admin&&<th>Empresa</th>}<th>Estado</th><th>Campos</th><th>Acciones</th></tr></thead><tbody>{items.length===0?<tr><td colSpan={admin?6:5} className="empty-cell">No hay reportes personalizados.</td></tr>:items.map(x=>{const s=catalog.find(c=>c.id===x.fuente);const count=(x.configuracion?.campos||[]).length;return <tr key={x.id}><td><b>{x.nombre}</b><small>{x.descripcion||""}</small></td><td>{s?.label||x.fuente}</td>{admin&&<td>{x.empresa}</td>}<td><span className={`status ${x.estado?"active":"inactive"}`}>{x.estado?"Activo":"Inactivo"}</span></td><td>{count}</td><td className="row-actions"><button onClick={()=>showPreview(x)}>Vista previa</button><button onClick={()=>window.open(`/api/exportaciones/personalizado/${x.id}?formato=pdf${empresa?`&empresa_id=${empresa}`:""}`,"_blank")}>PDF</button><button onClick={()=>window.open(`/api/exportaciones/personalizado/${x.id}?formato=xlsx${empresa?`&empresa_id=${empresa}`:""}`,"_blank")}>Excel</button>{canEdit&&<button onClick={()=>setModal(x)}><Pencil/></button>}{canEdit&&<button onClick={()=>toggle(x)}>{x.estado?"Desactivar":"Activar"}</button>}{canDelete&&<button onClick={()=>remove(x)}><X/></button>}</td></tr>})}</tbody></table></div>{modal&&<Modal wide title={modal.id?"Editar reporte personalizado":"Nuevo reporte personalizado"} onClose={()=>setModal(null)} sectionsOverride={[{id:"cr-source",label:"Fuente"},{id:"cr-fields",label:"Campos"},{id:"cr-filters",label:"Filtros"},{id:"cr-order",label:"Orden"},{id:"cr-design",label:"Diseño"},{id:"cr-preview",label:"Vista previa"}]}><Form item={modal.id?modal:null} onClose={()=>setModal(null)}/></Modal>}{preview&&<Modal wide title={`Vista previa · ${preview.nombre}`} onClose={()=>setPreview(null)} sectionsOverride={[{id:"crp-summary",label:"Resumen"},{id:"crp-table",label:"Resultados"}]}><div className="custom-preview"><div id="crp-summary" className="custom-preview-summary"><b>{preview.fuente_nombre}</b><span>{preview.campos.length} columnas · hasta 100 registros de muestra</span></div><div id="crp-table" className="table-wrap"><table><thead><tr>{preview.campos.map(f=><th key={f.id}>{f.label}</th>)}</tr></thead><tbody>{preview.rows.length?preview.rows.map((row,i)=><tr key={i}>{preview.campos.map(f=><td key={f.id}>{row[f.id]??"—"}</td>)}</tr>):<tr><td colSpan={preview.campos.length} className="empty-cell">No hay información para este reporte.</td></tr>}</tbody></table></div></div></Modal>}</section>;
}


function ReportsPage({ currentUser }){
  const [type,setType]=useState("resumen"),[rows,setRows]=useState([]),[summary,setSummary]=useState({}),[companies,setCompanies]=useState([]),[empresa,setEmpresa]=useState(""),[q,setQ]=useState(""),[loading,setLoading]=useState(false),[error,setError]=useState("");
  const reports=[
    ["clientes","Clientes","Maestro de clientes y estado comercial",Users],
    ["activos","Activos","Inventario operativo asociado a clientes",Car],
    ["equipos","Equipos GPS","Equipos, IMEI y activo asociado",Cpu],
    ["sim","Tarjetas SIM","Líneas, operadores y estado de SIM",Smartphone],
    ["m2m","Planes M2M","Planes, capacidad y costo mensual",RadioTower],
    ["consumo","Consumo M2M","Consumo por período y porcentaje utilizado",Activity]
  ];
  const selected=reports.find(x=>x[0]===type);
  async function load(){
    setLoading(true);setError("");
    try{
      const qs=empresa?`?empresa_id=${empresa}`:"";
      if(type==="resumen"){
        const d=await api(`/api/reportes/resumen${qs}`);setSummary(d.resumen||{});setRows([])
      }else{
        const extra=q?(empresa?'&':'?')+`q=${encodeURIComponent(q)}`:"";
        const d=await api(`/api/reportes/${type}${qs}${extra}`);setRows(d.rows||[])
      }
    }catch(e){setError(e.message)}finally{setLoading(false)}
  }
  useEffect(()=>{api("/api/reportes/filtros").then(d=>setCompanies(d.empresas||[])).catch(e=>setError(e.message))},[]);
  useEffect(()=>{load()},[type,empresa]);
  function exportCsv(){if(type!=="resumen")window.open(`/api/reportes/export/${type}${empresa?`?empresa_id=${empresa}`:""}`,"_blank")}
  function previewDocument(){window.open(`/api/documentos/preview${empresa?`?empresa_id=${empresa}`:""}`,"_blank")}
  const kpis=[
    ["Clientes",summary.clientes||0,Users],
    ["Activos",summary.activos||0,Car],
    ["Equipos GPS",summary.equipos||0,Cpu],
    ["Tarjetas SIM",summary.sim||0,Smartphone],
    ["Planes M2M",summary.m2m||0,RadioTower],
    ["Alertas M2M",summary.alertas||0,Activity]
  ];
  return <section className="card reports-standard-page">
    <div className="head reports-hero">
      <div><span className="eyebrow">INFORMACIÓN · FASE 18.4</span><h2>Reportes estándar</h2><p>Consulta información operativa con la identidad de marca de la empresa seleccionada.</p></div>
      <div className="toolbar-actions"><button className="secondary" onClick={previewDocument}>Vista previa documental</button>{type!=="resumen"&&<><button className="secondary" onClick={()=>window.open(`/api/exportaciones/estandar/${type}?formato=pdf${empresa?`&empresa_id=${empresa}`:""}`,"_blank")}>PDF</button><button className="secondary" onClick={()=>window.open(`/api/exportaciones/estandar/${type}?formato=xlsx${empresa?`&empresa_id=${empresa}`:""}`,"_blank")}>Excel</button><button className="secondary" onClick={()=>window.open(`/api/exportaciones/estandar/${type}?formato=csv${empresa?`&empresa_id=${empresa}`:""}`,"_blank")}>CSV</button></>}<button className="secondary" onClick={load}>{loading?"Consultando...":"Actualizar"}</button></div>
    </div>
    {error&&<div className="err">{error}</div>}
    <div className="report-toolbar">
      <label><span>Reporte</span><select value={type} onChange={e=>setType(e.target.value)}><option value="resumen">Resumen ejecutivo</option>{reports.map(x=><option key={x[0]} value={x[0]}>{x[1]}</option>)}</select></label>
      {currentUser?.rol==="Administrador"&&<label><span>Empresa</span><select value={empresa} onChange={e=>setEmpresa(e.target.value)}><option value="">Todas las empresas</option>{companies.map(x=><option key={x.id} value={x.id}>{x.nombre} — {x.nit||""}</option>)}</select></label>}
      {type!=="resumen"&&<label className="report-search"><span>Buscar</span><input placeholder="Código, nombre, IMEI..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&load()}/></label>}
    </div>
    <div className="report-catalog">
      <button className={type==="resumen"?"report-card selected":"report-card"} onClick={()=>setType("resumen")}><span className="report-card-icon"><FileBarChart/></span><span><b>Resumen ejecutivo</b><small>Indicadores generales de operación</small></span></button>
      {reports.map(([id,name,desc,Icon])=><button key={id} className={type===id?"report-card selected":"report-card"} onClick={()=>setType(id)}><span className="report-card-icon"><Icon/></span><span><b>{name}</b><small>{desc}</small></span></button>)}
    </div>
    {type==="resumen"?<>
      <div className="reports-section-title"><div><b>Indicadores de operación</b><span>Estado consolidado de la empresa seleccionada.</span></div></div>
      <div className="report-kpis">{kpis.map(([a,b,Icon])=><div className="report-kpi" key={a}><span className="report-kpi-icon"><Icon/></span><div><b>{Number(b).toLocaleString("es-CO")}</b><span>{a}</span></div></div>)}</div>
    </>:<>
      <div className="reports-section-title"><div><b>{selected?.[1]||"Reporte"}</b><span>{selected?.[2]||"Detalle del reporte seleccionado."}</span></div><span className="report-count">{loading?"Consultando...":`${rows.length.toLocaleString("es-CO")} registro(s)`}</span></div>
      <div className="table-wrap reports-table"><table><thead><tr>{rows.length?Object.keys(rows[0]).map(k=><th key={k}>{k.replaceAll("_"," ")}</th>):<th>Resultado</th>}</tr></thead><tbody>{loading?<tr><td colSpan="20" className="empty-cell">Consultando reporte...</td></tr>:rows.length?rows.map((r,i)=><tr key={i}>{Object.values(r).map((v,j)=><td key={j}>{v??"—"}</td>)}</tr>):<tr><td colSpan="20" className="empty-cell">No hay información para los filtros seleccionados.</td></tr>}</tbody></table></div>
    </>}
    <div className="report-footer-note"><FileBarChart/><span><b>Motor Documental 18.2</b> — Los documentos generados utilizan la marca blanca y la plantilla predeterminada de cada empresa.</span></div>
  </section>;
}

function GestionPage({ currentUser }) {
  const [rows,setRows]=useState([]),[catalogs,setCatalogs]=useState({empresas:[],usuarios:[],clientes:[],activos:[],equipos:[],sims:[]});
  const [summary,setSummary]=useState({total:0,pendientes:0,proceso:0,vencidas:0,completadas:0});
  const [modal,setModal]=useState(null),[error,setError]=useState("");
  const [filters,setFilters]=useState({q:"",estado:"",prioridad:"",empresa_id:""});
  const canCreate=currentUser.permisos.includes("gestion.crear"),canEdit=currentUser.permisos.includes("gestion.editar"),canDelete=currentUser.permisos.includes("gestion.eliminar");
  const admin=currentUser.rol==="Administrador";

  async function load() {
    try {
      const qs=new URLSearchParams(Object.entries(filters).filter(([,v])=>v!==""));
      const [list,sum,cat]=await Promise.all([
        api(`/api/gestion?${qs}`), api(`/api/gestion/resumen?${qs}`),
        api(`/api/gestion/catalogos?empresa_id=${filters.empresa_id||currentUser.empresa_id}`)
      ]);
      setRows(list.rows); setSummary(sum.resumen); setCatalogs(cat);
    } catch(e){setError(e.message);}
  }
  useEffect(()=>{load();},[filters.q,filters.estado,filters.prioridad,filters.empresa_id]);

  function Form({task,onClose}) {
    const [form,setForm]=useState({
      empresa_id:task?.empresa_id||filters.empresa_id||currentUser.empresa_id,
      tipo:task?.tipo||"Tarea",titulo:task?.titulo||"",descripcion:task?.descripcion||"",
      prioridad:task?.prioridad||"Media",estado:task?.estado||"Pendiente",
      cliente_id:task?.cliente_id||"",activo_id:task?.activo_id||"",equipo_id:task?.equipo_id||"",
      sim_id:task?.sim_id||"",responsable_id:task?.responsable_id||"",fecha_limite:task?.fecha_limite||"",
      fecha_inicio:task?.fecha_inicio||"",fecha_completado:task?.fecha_completado||"",observaciones:task?.observaciones||""
    });
    const [localCats,setLocalCats]=useState(catalogs);
    async function changeCompany(v){
      setForm(x=>({...x,empresa_id:v,cliente_id:"",activo_id:"",equipo_id:"",sim_id:"",responsable_id:""}));
      try{setLocalCats(await api(`/api/gestion/catalogos?empresa_id=${v}`));}catch(e){setError(e.message);}
    }
    function up(k,v){setForm(x=>({...x,[k]:v}));}
    async function save(e){
      e.preventDefault();
      try{
        const url=task?`/api/gestion/${task.id}`:"/api/gestion";
        await api(url,{method:task?"PUT":"POST",body:JSON.stringify({...form,empresa_id:Number(form.empresa_id),cliente_id:Number(form.cliente_id)||null,activo_id:Number(form.activo_id)||null,equipo_id:Number(form.equipo_id)||null,sim_id:Number(form.sim_id)||null,responsable_id:Number(form.responsable_id)||null})});
        onClose();await load();
      }catch(err){setError(err.message);}
    }
    return <form onSubmit={save}>
      <div className="form-grid">
        {admin&&<label>Empresa<select value={form.empresa_id} onChange={e=>changeCompany(e.target.value)} required>{localCats.empresas.map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>}
        <label>Tipo<select value={form.tipo} onChange={e=>up("tipo",e.target.value)}><option>Tarea</option><option>Actividad</option><option>Seguimiento</option><option>Pendiente</option><option>Vencimiento</option></select></label>
        <label className="full">Título<input value={form.titulo} onChange={e=>up("titulo",e.target.value)} required maxLength="150"/></label>
        <label>Prioridad<select value={form.prioridad} onChange={e=>up("prioridad",e.target.value)}><option>Baja</option><option>Media</option><option>Alta</option><option>Crítica</option></select></label>
        <label>Estado<select value={form.estado} onChange={e=>up("estado",e.target.value)}><option>Pendiente</option><option>En proceso</option><option>En espera</option><option>Completado</option><option>Cancelado</option></select></label>
        <label>Responsable<select value={form.responsable_id} onChange={e=>up("responsable_id",e.target.value)}><option value="">Sin asignar</option>{localCats.usuarios.map(x=><option key={x.id} value={x.id}>{x.nombre} {x.apellido||""}</option>)}</select></label>
        <label>Fecha límite<input type="date" value={form.fecha_limite} onChange={e=>up("fecha_limite",e.target.value)}/></label>
        <label>Fecha inicio<input type="date" value={form.fecha_inicio} onChange={e=>up("fecha_inicio",e.target.value)}/></label>
        <label>Cliente<select value={form.cliente_id} onChange={e=>up("cliente_id",e.target.value)}><option value="">Sin cliente</option>{localCats.clientes.map(x=><option key={x.id} value={x.id}>{x.nombre} {x.codigo?`— ${x.codigo}`:""}</option>)}</select></label>
        <label>Activo<select value={form.activo_id} onChange={e=>up("activo_id",e.target.value)}><option value="">Sin activo</option>{localCats.activos.map(x=><option key={x.id} value={x.id}>{x.codigo} {x.placa?`— ${x.placa}`:""}</option>)}</select></label>
        <label>Equipo GPS<select value={form.equipo_id} onChange={e=>up("equipo_id",e.target.value)}><option value="">Sin equipo</option>{localCats.equipos.map(x=><option key={x.id} value={x.id}>{x.imei}</option>)}</select></label>
        <label>Tarjeta SIM<select value={form.sim_id} onChange={e=>up("sim_id",e.target.value)}><option value="">Sin SIM</option>{localCats.sims.map(x=><option key={x.id} value={x.id}>{x.iccid}{x.numero?` — ${x.numero}`:""}</option>)}</select></label>
        <label className="full">Descripción<textarea rows="3" value={form.descripcion} onChange={e=>up("descripcion",e.target.value)}/></label>
        <label className="full">Observaciones<textarea rows="2" value={form.observaciones} onChange={e=>up("observaciones",e.target.value)}/></label>
      </div>
      <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" type="submit">Guardar</button></div>
    </form>;
  }

  async function changeStatus(row,status){try{await api(`/api/gestion/${row.id}/estado`,{method:"PATCH",body:JSON.stringify({estado:status})});await load();}catch(e){alert(e.message);}}
  async function remove(row){if(!window.confirm(`¿Eliminar "${row.titulo}"?`))return;try{await api(`/api/gestion/${row.id}`,{method:"DELETE"});await load();}catch(e){alert(e.message);}}

  return <section className="card">
    <div className="head"><div><h2>Gestión</h2><p>Tareas, actividades, seguimientos, pendientes y vencimientos operativos.</p></div>{canCreate&&<button className="primary" onClick={()=>setModal({type:"new"})}><Plus/> Nueva gestión</button>}</div>
    {error&&<div className="err">{error}</div>}
    <div className="kpis">
      <div><b>{summary.total}</b><span>Total</span></div><div><b>{summary.pendientes}</b><span>Pendientes</span></div><div><b>{summary.proceso}</b><span>En proceso</span></div><div><b>{summary.vencidas}</b><span>Vencidas</span></div><div><b>{summary.completadas}</b><span>Completadas</span></div>
    </div>
    <div className="filters">
      <input placeholder="Buscar gestión, cliente, activo, IMEI..." value={filters.q} onChange={e=>setFilters(x=>({...x,q:e.target.value}))}/>
      {admin&&<select value={filters.empresa_id} onChange={e=>setFilters(x=>({...x,empresa_id:e.target.value}))}><option value="">Todas las empresas</option>{catalogs.empresas.map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select>}
      <select value={filters.estado} onChange={e=>setFilters(x=>({...x,estado:e.target.value}))}><option value="">Todos los estados</option><option>Pendiente</option><option>En proceso</option><option>En espera</option><option>Completado</option><option>Cancelado</option></select>
      <select value={filters.prioridad} onChange={e=>setFilters(x=>({...x,prioridad:e.target.value}))}><option value="">Todas las prioridades</option><option>Baja</option><option>Media</option><option>Alta</option><option>Crítica</option></select>
    </div>
    <table><thead><tr><th>Gestión</th><th>Relacionado</th><th>Prioridad</th><th>Estado</th><th>Responsable</th><th>Fecha límite</th><th>Acciones</th></tr></thead>
    <tbody>{rows.map(r=><tr key={r.id}><td><b>{r.titulo}</b><br/><small>{r.tipo}</small></td><td>{r.cliente||"—"}{r.activo&&<><br/>{r.activo}{r.placa?` · ${r.placa}`:""}</>}</td><td>{r.prioridad}</td><td>{r.estado}</td><td>{r.responsable||"Sin asignar"}</td><td>{r.fecha_limite||"—"}</td><td>
      {canEdit&&<button type="button" title="Editar" onClick={()=>setModal({type:"edit",row:r})}><Pencil/></button>}
      {canEdit&&r.estado!=="Completado"&&<button type="button" title="Completar" onClick={()=>changeStatus(r,"Completado")}><Power/></button>}
      {canDelete&&<button type="button" title="Eliminar" onClick={()=>remove(r)}><X/></button>}
    </td></tr>)}</tbody></table>
    {!rows.length&&<p className="empty">No hay registros con los filtros seleccionados.</p>}
    {modal&&<Modal wide title={modal.type==="new"?"Nueva gestión":"Editar gestión"} onClose={()=>setModal(null)}><Form task={modal.row} onClose={()=>setModal(null)}/></Modal>}
  </section>;
}


function bogotaTodayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function CentroFinancieroPage({ currentUser }) {
  const isAdmin = currentUser.rol === "Administrador";
  const operationalToday = bogotaTodayISO();
  const [year, month] = operationalToday.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthStart = `${year}-${String(month).padStart(2,"0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
  const [companies, setCompanies] = useState([]);
  const [filters, setFilters] = useState({ desde: monthStart, hasta: monthEnd, empresa_id: "" });
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const money = v => Number(v || 0).toLocaleString("es-CO", { style:"currency", currency:"COP", maximumFractionDigits:0 });
  const pct = v => `${Number(v || 0).toFixed(1)}%`;

  async function load() {
    setLoading(true); setError("");
    try {
      const q = new URLSearchParams({ desde: filters.desde, hasta: filters.hasta });
      if (isAdmin && filters.empresa_id) q.set("empresa_id", filters.empresa_id);
      setData(await api(`/api/financiero?${q}`));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (isAdmin) api("/api/companies").then(d => setCompanies((d.empresas || []).filter(x => x.estado))).catch(e => setError(e.message));
    load();
  }, []);

  const s = data?.resumen || {};
  const i = data?.indicadores || {};
  const estados = data?.estados || {};
  const agingOrder = ["Por vencer","0–30 días","31–60 días","61–90 días","+90 días"];
  const agingMap = Object.fromEntries((data?.aging || []).map(x => [x.bucket, x]));
  const recaudoTotal = (data?.recaudo || []).reduce((a,x) => a + Number(x.total || 0), 0);
  const maxAging = Math.max(...agingOrder.map(k => Number(agingMap[k]?.total || 0)), 1);
  const maxDaily = Math.max(...(data?.recaudo || []).map(x => Number(x.total || 0)), 1);

  return <section className="card clients-page services-page financial-center">
    <div className="head financial-head">
      <div><span className="eyebrow">ADMINISTRACIÓN FINANCIERA · C9.2</span><h2>Centro Financiero 2.0</h2><p>Centro de control para facturación, recaudo, cartera y vencimientos.</p></div>
      <div className="toolbar-actions"><button className="secondary" onClick={load} disabled={loading}><RefreshCw size={17}/> {loading ? "Actualizando..." : "Actualizar"}</button></div>
    </div>
    {error && <div className="err">{error}</div>}

    <div className="financial-filters filters">
      <label>Desde<input type="date" value={filters.desde} onChange={e=>setFilters(x=>({...x,desde:e.target.value}))}/></label>
      <label>Hasta<input type="date" value={filters.hasta} onChange={e=>setFilters(x=>({...x,hasta:e.target.value}))}/></label>
      {isAdmin && <label>Empresa<select value={filters.empresa_id} onChange={e=>setFilters(x=>({...x,empresa_id:e.target.value}))}><option value="">Todas las empresas</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>}
      <button className="secondary financial-filter-button" onClick={load} disabled={loading}>Aplicar período</button>
    </div>

    <div className="financial-summary-strip">
      <div><span>Período</span><b>{data?.periodo?.desde || filters.desde} → {data?.periodo?.hasta || filters.hasta}</b></div>
      <div><span>Recaudo / facturado</span><b>{pct(i.recaudo_pct)}</b><small>{money(s.cobrado)} de {money(s.facturado)}</small></div>
      <div><span>Factura promedio</span><b>{money(i.factura_promedio)}</b><small>{s.facturas_emitidas || 0} documentos emitidos</small></div>
      <div><span>Cartera vencida</span><b>{pct(i.vencido_pct)}</b><small>{money(s.vencido)} del saldo pendiente</small></div>
    </div>

    <div className="kpis financial-kpis">
      <div className="kpi-card"><div className="kpi-icon"><Receipt size={19}/></div><div><span>Facturado</span><b>{money(s.facturado)}</b><small>{s.facturas_emitidas || 0} factura(s) emitida(s)</small></div></div>
      <div className="kpi-card"><div className="kpi-icon"><CircleDollarSign size={19}/></div><div><span>Recaudado</span><b>{money(s.cobrado)}</b><small>{s.pagos || 0} pago(s) aplicado(s)</small></div></div>
      <div className="kpi-card"><div className="kpi-icon"><Clock3 size={19}/></div><div><span>Por cobrar</span><b>{money(s.por_cobrar)}</b><small>{s.clientes_con_saldo || 0} cliente(s) con saldo</small></div></div>
      <div className="kpi-card financial-kpi-alert"><div className="kpi-icon"><AlertCircle size={19}/></div><div><span>Vencido</span><b>{money(s.vencido)}</b><small>{pct(i.vencido_pct)} de la cartera</small></div></div>
    </div>

    <div className="dashboard-grid financial-grid">
      <section className="card dashboard-panel">
        <div className="panel-heading"><div><span className="eyebrow">CARTERA</span><h2>Antigüedad de saldos</h2></div><strong>{money(s.por_cobrar)}</strong></div>
        <div className="financial-aging">{agingOrder.map(bucket => { const x=agingMap[bucket]||{}; return <div className="aging-row" key={bucket}><div className="aging-label"><b>{bucket}</b><span>{x.cantidad||0} documento(s)</span></div><div className="aging-track"><span style={{width:`${Math.max(2,Number(x.total||0)/maxAging*100)}%`}}/></div><strong>{money(x.total)}</strong></div> })}</div>
      </section>
      <section className="card dashboard-panel">
        <div className="panel-heading"><div><span className="eyebrow">FACTURACIÓN</span><h2>Estado del período</h2></div><span className="financial-period-badge">{statesLabel(estados)}</span></div>
        <div className="financial-status-list"><div><span>Emitidas</span><b>{estados.emitidas||0}</b></div><div><span>Pagadas</span><b>{estados.pagadas||0}</b></div><div><span>Vencidas</span><b>{estados.vencidas||0}</b></div><div><span>Anuladas</span><b>{estados.anuladas||0}</b></div><div className="total"><span>Total documentos</span><b>{estados.total||0}</b></div></div>
      </section>
    </div>

    <div className="dashboard-grid financial-grid">
      <section className="card dashboard-panel">
        <div className="panel-heading"><div><span className="eyebrow">RECAUDO</span><h2>Movimiento diario</h2></div><strong>{money(recaudoTotal)}</strong></div>
        <div className="financial-bars">{(data?.recaudo||[]).slice(-14).map(x=><div className="bar-day" key={x.fecha} title={`${x.fecha}: ${money(x.total)}`}><span style={{height:`${Math.max(4,Number(x.total||0)/maxDaily*100)}%`}}/><small>{String(x.fecha).slice(8)}</small></div>)}</div>
        {!(data?.recaudo||[]).length&&<p className="empty">No hay pagos aplicados en el período seleccionado.</p>}
      </section>
      <section className="card dashboard-panel">
        <div className="panel-heading"><div><span className="eyebrow">PRIORIDAD DE COBRO</span><h2>Clientes con mayor saldo</h2></div><WalletCards size={18}/></div>
        <div className="financial-debtors">{(data?.clientes_mayor_saldo||[]).map((x,idx)=><div key={x.id}><div className="debtor-rank">{String(idx+1).padStart(2,"0")}</div><div className="debtor-info"><b>{x.cliente}</b><small>{x.facturas} factura(s) con saldo</small></div><strong>{money(x.saldo)}</strong></div>)}{!(data?.clientes_mayor_saldo||[]).length&&<p className="empty">No hay clientes con saldo pendiente.</p>}</div>
      </section>
    </div>

    <div className="dashboard-grid financial-grid">
      <section className="card dashboard-panel">
        <div className="panel-heading"><div><span className="eyebrow">ÚLTIMOS MOVIMIENTOS</span><h2>Pagos recientes</h2></div></div>
        <div className="financial-recent">{(data?.pagos_recientes||[]).map(p=><div key={p.id}><div><b>{p.cliente}</b><small>{p.factura} · {p.fecha_pago} · {p.medio_pago}</small></div><strong>{money(p.valor)}</strong></div>)}{!(data?.pagos_recientes||[]).length&&<p className="empty">No hay pagos registrados.</p>}</div>
      </section>
      <section className="card dashboard-panel financial-attention">
        <div className="panel-heading"><div><span className="eyebrow">REQUIERE ATENCIÓN</span><h2>Gestión prioritaria</h2></div><AlertCircle size={18}/></div>
        <div className="attention-list">
          <div><span className="attention-icon"><AlertCircle size={15}/></span><div><b>{money(s.vencido)}</b><small>saldo vencido que requiere gestión</small></div></div>
          <div><span className="attention-icon"><Clock3 size={15}/></span><div><b>{money(s.por_vencer)}</b><small>saldo por vencer</small></div></div>
          <div><span className="attention-icon"><TrendingUp size={15}/></span><div><b>{pct(i.recaudo_pct)}</b><small>proporción recaudada sobre lo facturado</small></div></div>
        </div>
      </section>
    </div>

    <div className="financial-footer-cards"><div><span>Clientes con saldo</span><b>{s.clientes_con_saldo || 0}</b></div><div><span>Por vencer</span><b>{money(s.por_vencer)}</b></div><div><span>Fecha operativa</span><b>{data?.fecha_operativa || operationalToday}</b><small>Zona horaria: {data?.zona_horaria || "America/Bogota"}</small></div></div>
  </section>;
}

function statesLabel(estados){
  const total=Number(estados?.total||0);
  return total ? `${total} documento${total===1?"":"s"}` : "Sin documentos";
}

function ConfiguracionPage({ currentUser }) {
  const isAdmin = currentUser?.rol === "Administrador";
  const canEdit = currentUser?.permisos?.includes("configuracion.editar");
  const [tab,setTab]=useState("general"); const [data,setData]=useState(null); const [companies,setCompanies]=useState([]); const [empresaId,setEmpresaId]=useState(currentUser?.empresa_id||""); const [form,setForm]=useState(null); const [production,setProduction]=useState(null); const [notif,setNotif]=useState(null); const [template,setTemplate]=useState(null); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  async function load(id=empresaId){setLoading(true);setError("");try{const q=id?`?empresa_id=${id}`:"";const d=await api(`/api/configuracion/${q}`);setData(d);setForm({...d.config,marca:{...(d.marca||{})}});if(isAdmin)setCompanies(d.empresas||[]);}catch(e){setError(e.message)}finally{setLoading(false)}}
  async function loadProduction(){try{setProduction(await api(`/api/configuracion/produccion${empresaId?`?empresa_id=${empresaId}`:""}`))}catch(e){setError(e.message)}}
  async function loadNotifications(){try{setNotif(await api(`/api/configuracion/notificaciones${empresaId?`?empresa_id=${empresaId}`:""}`))}catch(e){setError(e.message)}}
  async function saveSmtp(){try{const d=await api("/api/configuracion/notificaciones/smtp",{method:"PUT",body:JSON.stringify({...notif.smtp,empresa_id:empresaId})});setNotif(n=>({...n,smtp:d.smtp}));alert("SMTP guardado correctamente.")}catch(e){alert(e.message)}}
  async function testSmtp(){try{await api("/api/configuracion/notificaciones/smtp/test",{method:"POST",body:JSON.stringify({empresa_id:empresaId})});alert("Conexión SMTP verificada correctamente.")}catch(e){alert(e.message)}}
  async function testEmail(){const to=window.prompt("Correo destinatario para la prueba:",form?.email_remitente||"");if(!to)return;try{await api("/api/configuracion/notificaciones/smtp/test-email",{method:"POST",body:JSON.stringify({empresa_id:empresaId,destinatario:to})});alert("Correo de prueba enviado.")}catch(e){alert(e.message)}}
  async function toggleEvent(ev){try{await api(`/api/configuracion/notificaciones/eventos/${ev.id}`,{method:"PUT",body:JSON.stringify({activo:ev.activo?0:1})});loadNotifications()}catch(e){alert(e.message)}}
  async function saveTemplate(){try{if(template.id) await api(`/api/configuracion/notificaciones/plantillas/${template.id}`,{method:"PUT",body:JSON.stringify({...template,empresa_id:empresaId})}); else await api("/api/configuracion/notificaciones/plantillas",{method:"POST",body:JSON.stringify({...template,empresa_id:empresaId})});setTemplate(null);loadNotifications();}catch(e){alert(e.message)}}
  useEffect(()=>{load()},[]); useEffect(()=>{if(tab==="produccion")loadProduction(); if(tab==="notificaciones")loadNotifications()},[tab,empresaId]);
  const set=(k,v)=>setForm(f=>({...f,[k]:v})); const setMarca=(k,v)=>setForm(f=>({...f,marca:{...(f?.marca||{}),[k]:v}}));
  async function save(){setSaving(true);setError("");try{const d=await api("/api/configuracion",{method:"PUT",body:JSON.stringify({...form,empresa_id:empresaId})});setForm({...d.config,marca:{...(data?.marca||{}),...(form.marca||{})}});await load(empresaId);alert("Configuración guardada correctamente.")}catch(e){setError(e.message)}finally{setSaving(false)}}
  if(loading&&!form)return <div className="card module-loading">Cargando configuración...</div>;
  return <section className="card configuration-page">
    <div className="head"><div><span className="eyebrow">ADMINISTRACIÓN · FASE 29</span><h2>Centro de Configuración</h2><p>Parámetros generales, seguridad y preparación para producción de <b>{data?.empresa?.nombre||currentUser?.empresa}</b>.</p></div><div className="toolbar-actions">{isAdmin&&<select value={empresaId} onChange={e=>{setEmpresaId(e.target.value);load(e.target.value)}}><option value="">Empresa actual</option>{companies.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select>}{canEdit&&tab!=="produccion"&&<button className="primary" onClick={save} disabled={saving}>{saving?<RefreshCw className="spin"/>:<CheckCircle2/>}{saving?"Guardando...":"Guardar cambios"}</button>}</div></div>
    {error&&<div className="err">{error}</div>}
    <div className="config-tabs">{[["general","Empresa y sistema",Building2],["seguridad","Seguridad",ShieldCheck],["notificaciones","Notificaciones",AlertCircle],["produccion","Producción",Server]].map(([k,n,I])=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}><I size={17}/>{n}</button>)}</div>
    {tab==="general"&&<div className="config-grid">
      <section className="config-panel"><div className="panel-heading"><div><span className="eyebrow">IDENTIDAD</span><h3>Empresa y marca</h3></div></div><div className="form-grid form-grid-2"><label>Nombre de aplicación<input value={form?.marca?.nombre_aplicacion||form?.app_nombre||""} onChange={e=>{set("app_nombre",e.target.value);setMarca("nombre_aplicacion",e.target.value)}} /></label><label>Nombre comercial<input value={form?.marca?.nombre_comercial||""} onChange={e=>setMarca("nombre_comercial",e.target.value)}/></label><label>Color principal<input type="text" value={form?.marca?.color_principal||"#0A1E2E"} onChange={e=>setMarca("color_principal",e.target.value)}/></label><label>Color de acento<input type="text" value={form?.marca?.color_acento||"#8CF63C"} onChange={e=>setMarca("color_acento",e.target.value)}/></label><label className="span-2">Encabezado<input value={form?.marca?.encabezado||""} onChange={e=>setMarca("encabezado",e.target.value)} placeholder="Texto institucional para documentos"/></label><label className="span-2">Pie de página<textarea value={form?.marca?.pie_pagina||""} onChange={e=>setMarca("pie_pagina",e.target.value)}/></label></div></section>
      <section className="config-panel"><div className="panel-heading"><div><span className="eyebrow">SISTEMA</span><h3>Regionalización</h3></div></div><div className="form-grid form-grid-2"><label>Zona horaria<select value={form?.zona_horaria||"America/Bogota"} onChange={e=>set("zona_horaria",e.target.value)}><option>America/Bogota</option><option>America/Lima</option><option>America/Mexico_City</option><option>America/New_York</option><option>UTC</option></select></label><label>Moneda<select value={form?.moneda||"COP"} onChange={e=>set("moneda",e.target.value)}><option>COP</option><option>USD</option><option>MXN</option><option>PEN</option><option>EUR</option></select></label><label>Formato de fecha<select value={form?.formato_fecha||"DD/MM/YYYY"} onChange={e=>set("formato_fecha",e.target.value)}><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option><option>MM/DD/YYYY</option></select></label><label>Formato numérico<select value={form?.formato_numerico||"es-CO"} onChange={e=>set("formato_numerico",e.target.value)}><option>es-CO</option><option>en-US</option><option>es-MX</option><option>es-ES</option></select></label><label>Idioma<select value={form?.idioma||"es-CO"} onChange={e=>set("idioma",e.target.value)}><option>es-CO</option><option>es-ES</option><option>en-US</option></select></label></div></section>
    </div>}
    {tab==="seguridad"&&<div className="config-grid">
      <section className="config-panel"><div className="panel-heading"><div><span className="eyebrow">ACCESO</span><h3>Sesiones y protección de acceso</h3></div></div><div className="form-grid form-grid-2"><label>Duración de sesión (minutos)<input type="number" min="15" max="1440" value={form?.session_minutes||480} onChange={e=>set("session_minutes",Number(e.target.value))}/></label><label>Intentos máximos<input type="number" min="3" max="20" value={form?.max_login_attempts||5} onChange={e=>set("max_login_attempts",Number(e.target.value))}/></label><label>Bloqueo (minutos)<input type="number" min="1" max="240" value={form?.lock_minutes||15} onChange={e=>set("lock_minutes",Number(e.target.value))}/></label><label>Límite API / minuto<input type="number" min="30" max="1000" value={form?.api_rate_limit||120} onChange={e=>set("api_rate_limit",Number(e.target.value))}/></label></div><div className="config-note"><ShieldCheck size={18}/><span>Los intentos fallidos se registran por correo + IP y se bloquean temporalmente al alcanzar el límite.</span></div></section>
      <section className="config-panel"><div className="panel-heading"><div><span className="eyebrow">CONTRASEÑAS</span><h3>Política de contraseña</h3></div></div><label>Longitud mínima<input type="number" min="8" max="64" value={form?.password_min_length||8} onChange={e=>set("password_min_length",Number(e.target.value))}/></label><div className="security-checks">{[["password_upper","Mayúscula"],["password_lower","Minúscula"],["password_number","Número"],["password_special","Carácter especial"]].map(([k,n])=><label key={k} className={form?.[k]?"selected":""}><input type="checkbox" checked={!!form?.[k]} onChange={e=>set(k,e.target.checked?1:0)}/><span>{n}</span><b>{form?.[k]?"✓":""}</b></label>)}</div></section>
      <section className="config-panel"><div className="panel-heading"><div><span className="eyebrow">AUDITORÍA</span><h3>Retención y trazabilidad</h3></div></div><label>Retención de auditoría (días)<input type="number" min="30" max="3650" value={form?.audit_retention_days||365} onChange={e=>set("audit_retention_days",Number(e.target.value))}/></label><div className="config-note"><ClipboardList size={18}/><span>Las acciones administrativas y eventos de seguridad continúan registrándose en Auditoría avanzada.</span></div></section>
    </div>}
    {tab==="notificaciones"&&<div className="notification-config"><section className="config-panel"><div className="panel-heading"><div><span className="eyebrow">SMTP POR EMPRESA</span><h3>Servidor de correo</h3><small>Cada empresa administra su propio servidor y remitente.</small></div><div className="toolbar-actions"><button className="secondary" onClick={testSmtp}>Probar conexión</button><button className="secondary" onClick={testEmail}>Enviar prueba</button><button className="primary" onClick={saveSmtp}>Guardar SMTP</button></div></div><div className="form-grid form-grid-3"><label>Servidor SMTP<input value={notif?.smtp?.smtp_host||""} onChange={e=>setNotif(n=>({...n,smtp:{...(n?.smtp||{}),smtp_host:e.target.value}}))} placeholder="smtp.dominio.com"/></label><label>Puerto<input type="number" value={notif?.smtp?.smtp_port||587} onChange={e=>setNotif(n=>({...n,smtp:{...(n?.smtp||{}),smtp_port:Number(e.target.value)}}))}/></label><label>Seguridad<select value={notif?.smtp?.smtp_secure||"starttls"} onChange={e=>setNotif(n=>({...n,smtp:{...(n?.smtp||{}),smtp_secure:e.target.value}}))}><option value="starttls">STARTTLS</option><option value="ssl">SSL/TLS</option><option value="none">Sin cifrado</option></select></label><label>Usuario SMTP<input value={notif?.smtp?.smtp_usuario||""} onChange={e=>setNotif(n=>({...n,smtp:{...(n?.smtp||{}),smtp_usuario:e.target.value}}))}/></label><label>Contraseña SMTP<input type="password" placeholder={notif?.smtp?.smtp_password_configured?"•••••••• (configurada)":"Contraseña"} onChange={e=>setNotif(n=>({...n,smtp:{...(n?.smtp||{}),smtp_password:e.target.value}}))}/></label><label>Remitente<input value={notif?.smtp?.remitente_email||""} onChange={e=>setNotif(n=>({...n,smtp:{...(n?.smtp||{}),remitente_email:e.target.value}}))}/></label><label>Nombre remitente<input value={notif?.smtp?.remitente_nombre||""} onChange={e=>setNotif(n=>({...n,smtp:{...(n?.smtp||{}),remitente_nombre:e.target.value}}))}/></label><label>Responder a<input value={notif?.smtp?.reply_to||""} onChange={e=>setNotif(n=>({...n,smtp:{...(n?.smtp||{}),reply_to:e.target.value}}))}/></label><label className="toggle-row"><span><b>SMTP activo</b><small>Permite envíos automáticos.</small></span><label className="switch"><input type="checkbox" checked={!!notif?.smtp?.activo} onChange={e=>setNotif(n=>({...n,smtp:{...(n?.smtp||{}),activo:e.target.checked?1:0}}))}/><i/></label></label></div></section><section className="config-panel"><div className="panel-heading"><div><span className="eyebrow">EVENTOS AUTOMÁTICOS</span><h3>Qué puede enviar IT GPS APP</h3></div></div><div className="notification-events">{(notif?.eventos||[]).map(ev=><label key={ev.id} className={ev.activo?"selected":""}><span><b>{ev.nombre}</b><small>{ev.descripcion}</small></span><input type="checkbox" checked={!!ev.activo} onChange={()=>toggleEvent(ev)}/></label>)}</div></section><section className="config-panel"><div className="panel-heading"><div><span className="eyebrow">PLANTILLAS</span><h3>Plantillas de correo</h3></div><button className="primary" onClick={()=>setTemplate({evento_codigo:notif?.eventos?.[0]?.codigo||"FACTURA_GENERADA",nombre:"Nueva plantilla",asunto:"",cuerpo_html:"<p>Hola {{cliente}},</p>",predeterminada:0,activo:1})}>Nueva plantilla</button></div><div className="table-wrap"><table><thead><tr><th>Evento</th><th>Nombre</th><th>Asunto</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{(notif?.plantillas||[]).map(t=><tr key={t.id}><td>{notif?.eventos?.find(e=>e.codigo===t.evento_codigo)?.nombre||t.evento_codigo}</td><td><b>{t.nombre}</b></td><td>{t.asunto}</td><td>{t.activo?"Activa":"Inactiva"}</td><td className="row-actions"><button onClick={()=>setTemplate(t)}><Pencil/></button></td></tr>)}{!(notif?.plantillas||[]).length&&<tr><td colSpan="5" className="empty-cell">No hay plantillas personalizadas. Los eventos están listos para configurarse.</td></tr>}</tbody></table></div></section></div>}
    {template&&<Modal wide title={template.id?"Editar plantilla de correo":"Nueva plantilla de correo"} onClose={()=>setTemplate(null)}><div className="form-grid form-grid-2"><label>Evento<select value={template.evento_codigo} onChange={e=>setTemplate(t=>({...t,evento_codigo:e.target.value}))}>{(notif?.eventos||[]).map(e=><option key={e.codigo}>{e.codigo}</option>)}</select></label><label>Nombre<input value={template.nombre||""} onChange={e=>setTemplate(t=>({...t,nombre:e.target.value}))}/></label><label className="span-2">Asunto<input value={template.asunto||""} onChange={e=>setTemplate(t=>({...t,asunto:e.target.value}))} placeholder="Factura {{numero}} - {{empresa}}"/></label><label className="span-2">Cuerpo HTML<textarea rows="12" value={template.cuerpo_html||""} onChange={e=>setTemplate(t=>({...t,cuerpo_html:e.target.value}))}/></label><label className="toggle-row"><span><b>Predeterminada</b></span><input type="checkbox" checked={!!template.predeterminada} onChange={e=>setTemplate(t=>({...t,predeterminada:e.target.checked?1:0}))}/></label><label className="toggle-row"><span><b>Activa</b></span><input type="checkbox" checked={!!template.activo} onChange={e=>setTemplate(t=>({...t,activo:e.target.checked?1:0}))}/></label></div><div className="modal-actions"><button className="secondary" onClick={()=>setTemplate(null)}>Cancelar</button><button className="primary" onClick={saveTemplate}>Guardar plantilla</button></div></Modal>}
    {tab==="produccion"&&<div className="production-wrap"><div className="production-cards"><div className="production-card"><span className={production?.ok?"health ok":"health"}>{production?.ok?"OK":"—"}</span><b>Estado API</b><small>{production?.ok?"Operativa":"Sin diagnóstico"}</small></div><div className="production-card"><span className="health">{production?.latency_ms??"—"} ms</span><b>Latencia DB</b><small>Consulta de integridad</small></div><div className="production-card"><span className="health">{production?.tables??"—"}</span><b>Tablas</b><small>Esquema disponible</small></div><div className="production-card"><span className="health">{production?.integrity||"—"}</span><b>Integridad SQLite</b><small>Última comprobación</small></div></div><section className="config-panel production-detail"><div className="panel-heading"><div><span className="eyebrow">HEALTH CHECK</span><h3>Diagnóstico de producción</h3></div><button className="secondary" onClick={loadProduction}><RefreshCw size={16}/> Actualizar</button></div><div className="production-grid"><div><span>Entorno</span><b>{production?.environment||"—"}</b></div><div><span>Node.js</span><b>{production?.node||"—"}</b></div><div><span>Base de datos</span><b>{production?.database||"—"}</b></div><div><span>Puerto API</span><b>{production?.port||"—"}</b></div><div><span>Usuarios empresa</span><b>{production?.stats?.usuarios??"—"}</b></div><div><span>Clientes empresa</span><b>{production?.stats?.clientes??"—"}</b></div><div><span>Equipos GPS</span><b>{production?.stats?.equipos??"—"}</b></div><div><span>Integraciones activas</span><b>{production?.stats?.integraciones??"—"}</b></div></div><div className="config-note"><DatabaseZap size={18}/><span>Este diagnóstico no modifica datos. Verifica la disponibilidad del esquema y métricas básicas de la empresa seleccionada.</span></div></section></div>}
  </section>;
}

function App() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [section, setSection] = useState("dashboard");
  const [checking, setChecking] = useState(true);
  const [pendingQuote, setPendingQuote] = useState(null);

  useEffect(()=>{
    const h=e=>{const d=e.detail||{};if(!d.prospecto_id)return;setPendingQuote(d);setSection("cotizaciones");setSidebarOpen(false)};
    window.addEventListener("itgps:nueva-cotizacion",h);
    const nav=e=>{const d=e.detail||{};if(d.section){setSection(d.section);setSidebarOpen(false)}};
    window.addEventListener("itgps:navegar",nav);
    return()=>{window.removeEventListener("itgps:nueva-cotizacion",h);window.removeEventListener("itgps:navegar",nav)};
  },[]);

  async function loadSession() {
    try {
      const session = await api("/api/auth/me");
      setUser(session.usuario);

      const [data, assetsData, health] = await Promise.all([
        api("/api/dashboard"),
        api("/api/activos"),
        api("/api/health")
      ]);
      setDashboard({...data, activos: assetsData.activos || [], health});
    } catch {
      setUser(null);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    loadSession();
  }, []);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  if (checking) {
    return <div className="loading">Cargando...</div>;
  }

  if (!user) {
    return <Login onLogin={loadSession} />;
  }

  return (
    <div className="app">
      <aside className={sidebarOpen ? "open" : ""}>
        <strong className="brand">
          <span className="brand-mark">IT</span>
          <span className="brand-copy">IT GPS <i>APP</i><small>Command Center</small></span>
        </strong>

        <div className="sidebar-scroll">
          {[
            ["PRINCIPAL", [["dashboard", "Dashboard", BarChart3]]],
            ["COMERCIAL", [["prospectos", "Prospectos", BriefcaseBusiness], ["flujo_comercial", "Flujo comercial", GitBranch], ["clientes", "Clientes", Users], ["servicios", "Servicios", Package], ["planes", "Planes", Package], ["suscripciones", "Suscripciones", Package], ["renovaciones", "Renovaciones", CalendarClock], ["cotizaciones", "Cotizaciones", FileText], ["facturas", "Facturación", FileText], ["facturacion_recurrente", "Facturación recurrente", Repeat2], ["contratos", "Contratos", FileText]]],
            ["FINANCIERO", [["centro_financiero", "Centro Financiero", TrendingUp], ["cartera", "Cartera", WalletCards]]],
            ["OPERACIÓN", [["activos", "Activos", Car], ["equipos", "Equipos GPS", Cpu], ["sim", "Tarjetas SIM", Smartphone], ["m2m", "Gestión M2M", RadioTower], ["integraciones", "Integraciones GPS / M2M", Plug], ["consolidacion", "Consolidación", GitBranch], ["centro_operacional", "Centro Operacional", LayoutDashboard], ["operacion_gps", "Operación GPS", Activity], ["ordenes_servicio", "Órdenes de servicio", ClipboardList]]],
            ["INFORMACIÓN", [["reportes", "Reportes", FileBarChart], ["reportes_personalizados", "Reportes personalizados", LayoutTemplate]]],
            ["GESTIÓN", [["gestion", "Gestión", ClipboardList]]],
            ["ADMINISTRACIÓN", [["configuracion", "Configuración", Settings], ["usuarios", "Usuarios", UserRound], ["roles", "Roles y permisos", Settings], ["empresas", "Empresas", Building2], ["plantillas_documentos", "Plantillas de documentos", LayoutTemplate], ["auditoria", "Auditoría avanzada", ShieldCheck]]]
          ].map(([group, entries]) => {
            const visible = entries.filter(([key]) => key === "centro_operacional" ? user.permisos.includes("operacion_gps.ver") : key === "flujo_comercial" ? user.permisos.includes("cotizaciones.ver") : user.permisos.includes(`${key}.ver`));
            if (!visible.length) return null;
            return (
              <div className="nav-group" key={group}>
                <div className="nav-group-title">{group}</div>
                {visible.map(([key, name, Icon]) => (
                  <button
                    type="button"
                    className={section === key ? "sel" : ""}
                    onClick={() => { setSection(key); setSidebarOpen(false); }}
                    key={key}
                    title={name}
                  >
                    <Icon /> <span>{name}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>

        <div className="bottom">
          <button
            type="button"
            onClick={() => { setSection("clave"); setSidebarOpen(false); }}
          >
            <KeyRound /> Cambio Clave
          </button>

          <button type="button" onClick={logout}>
            <LogOut /> Cerrar Sesión
          </button>
        </div>
      </aside>
      {sidebarOpen && <button type="button" className="sidebar-overlay" aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} />}

      <main>
        <header>
          <button type="button" className="menu-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Abrir menú"><Menu /></button>
          <span>
            {section === "clave"
              ? "Cambio de contraseña"
              : section === "configuracion"
              ? "Configuración"
              : section === "centro_operacional" ? "Centro Operacional" : menu.find(([key]) => key === section)?.[1] || "Dashboard"}
          </span>

          <div className="header-context">
            <span className="status-dot"></span>
            <span className="header-company">{user.empresa}</span>
            <span className="header-separator">•</span>
            <span>{user.rol}</span>
            <div className="user-chip">
              <span className="avatar">{(user.nombre || "U").charAt(0).toUpperCase()}</span>
              <span>{user.nombre} {user.apellido || ""}</span>
            </div>
          </div>
        </header>

        {section === "flujo_comercial" ? <FlujoComercialPage currentUser={user} /> : section === "centro_operacional" ? <CentroOperacionalPage currentUser={user} /> : section === "operacion_gps" ? <OperacionGpsPage currentUser={user} /> : section === "ordenes_servicio" ? <OrdenesServicioPage currentUser={user} /> : section === "consolidacion" ? <ConsolidacionPage currentUser={user} /> : section === "gestion" ? <GestionPage currentUser={user} /> : section === "reportes" ? <ReportsPage currentUser={user} /> : section === "reportes_personalizados" ? <CustomReportsPage currentUser={user} /> : section === "plantillas_documentos" ? <DocumentTemplatesPage currentUser={user} /> : section === "activos" ? (
          <AssetsPage currentUser={user} />
        ) : section === "equipos" ? <EquipmentPage currentUser={user} /> : section === "sim" ? <SimPage currentUser={user} /> : section === "m2m" ? <M2MPage currentUser={user} /> : section === "integraciones" ? <IntegracionesPage currentUser={user} /> : section === "prospectos" ? (
          <ProspectsPage currentUser={user} />
        ) : section === "clientes" ? (
          <ClientsPage currentUser={user} setSection={setSection} />
        ) : section === "servicios" ? (
          <ServicesPage currentUser={user} />
        ) : section === "planes" ? (
          <PlansPage currentUser={user} />
        ) : section === "suscripciones" ? (
          <SubscriptionsPage currentUser={user} />
        ) : section === "renovaciones" ? (
          <RenewalsPage currentUser={user} />
        ) : section === "cotizaciones" ? (
          <QuotesPage currentUser={user} initialQuote={pendingQuote} onInitialQuoteHandled={()=>setPendingQuote(null)} />
        ) : section === "facturas" ? (
          <InvoicesPage currentUser={user} />
        ) : section === "facturacion_recurrente" ? (
          <FacturacionRecurrentePage currentUser={user} />
        ) : section === "cartera" ? (
          <CarteraPage currentUser={user} />
        ) : section === "centro_financiero" ? (
          <CentroFinancieroPage currentUser={user} />
        ) : section === "contratos" ? (
          <ContractsPage currentUser={user} />
        ) : section === "configuracion" ? (
          <ConfiguracionPage currentUser={user} />
        ) : section === "usuarios" ? (
          <UsersPage currentUser={user} />
        ) : section === "roles" ? (
          <RolesPage />
        ) : section === "empresas" ? (
          <CompaniesPage currentUser={user} />
        ) : section === "auditoria" ? (
          <AuditPage currentUser={user} />
        ) : section === "dashboard" ? (
          <div className="dashboard-page">
            <div className="page-intro">
              <div>
                <span className="eyebrow">CENTRO DE CONTROL</span>
                <h1>Bienvenido, {user.nombre}.</h1>
                <p>Resumen operativo de <b>{user.empresa}</b>.</p>
              </div>
              <div className="live-badge"><span></span> Sistema operativo</div>
            </div>

            <div className="module-dashboard dashboard-v2-overview">
              <div className="module-dashboard-head"><div><span className="eyebrow">RESUMEN OPERATIVO</span><h3>Visión general de IT GPS SAS</h3></div></div>
              <div className="module-dashboard-cards">
                {[
                  ["Clientes",dashboard?.kpis?.clientes,Users,"neutral"],
                  ["Prospectos",dashboard?.kpis?.prospectos,BriefcaseBusiness,"info"],
                  ["Activos",dashboard?.activos?.length,Car,"success"],
                  ["Equipos GPS",dashboard?.kpis?.equipos,Cpu,"success"],
                  ["SIM / M2M",dashboard?.kpis?.sim,Smartphone,"info"]
                ].map(([name,value,Icon,tone])=><button type="button" className={`dashboard-kpi-link ${tone}`} key={name} onClick={()=>setSection(name==="Clientes"?"clientes":name==="Prospectos"?"prospectos":name==="Activos"?"activos":name==="Equipos GPS"?"equipos":"sim")}><Icon/><span>{name}</span><b>{Number(value||0).toLocaleString("es-CO")}</b><small>Ver módulo →</small></button>)}
              </div>
            </div>

            <div className="dashboard-v2-grid">
              <section className="card dashboard-panel">
                <div className="panel-heading"><div><span className="eyebrow">CONTROL</span><h2>Estado de la plataforma</h2></div></div>
                <div className="system-status">
                  <div><span className="status-dot"></span><div><b>Aplicación</b><small>Servicios disponibles</small></div></div>
                  <div><span className="status-dot"></span><div><b>Base de datos</b><small>{dashboard?.health?.database === "postgresql" ? "PostgreSQL operativa" : "Base de datos operativa"}</small></div></div>
                  <div><span className="status-dot"></span><div><b>Seguridad</b><small>Sesión autenticada y permisos aplicados</small></div></div>
                </div>
              </section>

              <section className="card dashboard-panel">
                <div className="panel-heading"><div><span className="eyebrow">ATENCIÓN</span><h2>Requiere atención</h2></div></div>
                <div className="dashboard-attention">
                  <button type="button" onClick={()=>setSection("activos")}><span className="attention-dot warning"></span><div><b>{(dashboard?.activos||[]).filter(x=>x.estado==="En mantenimiento").length}</b><small>Activos en mantenimiento</small></div><ArrowRight/></button>
                  <button type="button" onClick={()=>setSection("equipos")}><span className="attention-dot info"></span><div><b>{(dashboard?.kpis?.equipos||0) - (dashboard?.activos?.length ? Math.min(dashboard.kpis.equipos,dashboard.activos.length) : 0)}</b><small>Equipos GPS pendientes de revisar</small></div><ArrowRight/></button>
                </div>
              </section>
            </div>

            <div className="dashboard-v2-grid lower">
              <section className="card dashboard-panel">
                <div className="panel-heading"><div><span className="eyebrow">OPERACIÓN</span><h2>Acciones rápidas</h2></div></div>
                <div className="quick-actions">
                  {[["clientes","Nuevo cliente",Users],["activos","Nuevo activo",Car],["equipos","Nuevo equipo GPS",Cpu],["sim","Nueva SIM",Smartphone]].filter(([key])=>user.permisos.includes(`${key}.crear`)).map(([key,name,Icon])=><button key={key} type="button" onClick={()=>setSection(key)}><span><Icon size={19}/></span><b>{name}</b><small>Abrir módulo →</small></button>)}
                </div>
              </section>
              <section className="card dashboard-panel">
                <div className="panel-heading"><div><span className="eyebrow">PRÓXIMAMENTE</span><h2>Actividad reciente</h2></div></div>
                <div className="dashboard-empty"><Activity size={20}/><div><b>Actividad centralizada</b><small>Se conectará con Auditoría e historial operacional en la siguiente iteración.</small></div></div>
              </section>
            </div>
          </div>
        ) : (
          <div className="card module-pending">
            <h2>
              {section === "clave"
                ? "Cambio de contraseña"
                : section === "configuracion"
                ? "Configuración"
                : menu.find(([key]) => key === section)?.[1] || section}
            </h2>
            <p>
              Este módulo de IT GPS APP está en preparación. El resto de la plataforma ya está operativo.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
