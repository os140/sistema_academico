const STORAGE_KEY = "sistema_academico_v1";

const defaultState = {
  docentes: [
    { id: 1, nombre: "Dra. Mariana Solís", fotoUrl: "" },
    { id: 2, nombre: "Mtro. Carlos Reyes", fotoUrl: "" },
    { id: 3, nombre: "Lic. Sofía Mendoza", fotoUrl: "" }
  ],
  materias: [
    { id: 1, nombre: "Cálculo Diferencial", cuatrimestre: "Q1", docenteId: 1 },
    { id: 2, nombre: "Comunicación Oral", cuatrimestre: "Q1", docenteId: 3 },
    { id: 3, nombre: "Programación Básica", cuatrimestre: "Q1", docenteId: 2 },
    { id: 4, nombre: "Álgebra Lineal", cuatrimestre: "Q2", docenteId: 1 },
    { id: 5, nombre: "Bases de Datos", cuatrimestre: "Q3", docenteId: 2 }
  ]
};

let state = loadState();

const $ = (selector) => document.querySelector(selector);

const views = {
  docentes: $("#view-docentes"),
  materias: $("#view-materias")
};

const docenteModal = $("#docenteModal");
const materiaModal = $("#materiaModal");

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(defaultState);

  try {
    const parsed = JSON.parse(raw);
    return {
      docentes: Array.isArray(parsed.docentes) ? parsed.docentes : [],
      materias: Array.isArray(parsed.materias) ? parsed.materias : []
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextId(items) {
  return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function avatarSvg(name) {
  const colors = ["#16388b", "#1f7a4d", "#7a1731", "#4d5bd1", "#2f6f9f"];
  const firstChar = name?.charCodeAt(0) || 65;
  const color = colors[(name.length + firstChar) % colors.length];
  const text = initials(name);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <rect width="64" height="64" rx="32" fill="${color}"/>
      <text x="32" y="39" font-family="Arial" font-size="22" text-anchor="middle" fill="white" font-weight="700">${text}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getDocenteName(id) {
  const docente = state.docentes.find((d) => d.id === Number(id));
  return docente ? docente.nombre : "Sin docente";
}

function getMateriasCount(docenteId) {
  return state.materias.filter((m) => m.docenteId === docenteId).length;
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function switchTab(tab) {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  views.docentes.classList.toggle("hidden", tab !== "docentes");
  views.materias.classList.toggle("hidden", tab !== "materias");
}

function renderDocentes() {
  $("#docentesCount").textContent = state.docentes.length;

  const html = state.docentes.map((d) => {
    const count = getMateriasCount(d.id);
    const foto = d.fotoUrl && d.fotoUrl.trim() ? d.fotoUrl : avatarSvg(d.nombre);

    return `
      <div class="card">
        <div class="card-main">
          <img class="avatar" src="${foto}" alt="Foto de ${d.nombre}">
          <div class="card-text">
            <strong>${d.nombre}</strong>
            <small>${count} materia${count === 1 ? "" : "s"}</small>
          </div>
        </div>
        <div class="card-actions">
          <button class="mini edit" title="Editar" data-edit-docente="${d.id}">✎</button>
          <button class="mini del" title="Eliminar" data-del-docente="${d.id}">×</button>
        </div>
      </div>
    `;
  }).join("");

  $("#docentesList").innerHTML = html || "<p>No hay docentes.</p>";
}

function renderMateriaOptions() {
  $("#materiaDocente").innerHTML = `
    <option value="">Seleccione docente</option>
    ${state.docentes.map((d) => `<option value="${d.id}">${d.nombre}</option>`).join("")}
  `;
}

function renderMaterias() {
  $("#materiasCount").textContent = state.materias.length;

  const rows = state.materias.map((m) => `
    <tr>
      <td>${m.nombre}</td>
      <td><span class="badge">${m.cuatrimestre}</span></td>
      <td>${getDocenteName(m.docenteId)}</td>
      <td>
        <div class="row-actions">
          <button class="link" data-edit-materia="${m.id}">Editar</button>
          <button class="link danger" data-del-materia="${m.id}">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("");

  $("#materiasList").innerHTML = rows || `<tr><td colspan="4">No hay materias.</td></tr>`;
}

function renderAll() {
  renderDocentes();
  renderMateriaOptions();
  renderMaterias();
  saveState();
}

function openDocenteForm(mode, id = null) {
  $("#docenteModalTitle").textContent = mode === "edit" ? "EDITAR DOCENTE" : "AGREGAR DOCENTE";
  $("#docenteId").value = id || "";

  const docente = state.docentes.find((d) => d.id === id);
  $("#docenteNombre").value = docente ? docente.nombre : "";
  $("#docenteFoto").value = docente ? docente.fotoUrl : "";

  openModal(docenteModal);
}

function openMateriaForm(mode, id = null) {
  $("#materiaModalTitle").textContent = mode === "edit" ? "EDITAR MATERIA" : "AGREGAR MATERIA";
  $("#materiaId").value = id || "";

  const materia = state.materias.find((m) => m.id === id);
  $("#materiaNombre").value = materia ? materia.nombre : "";
  $("#materiaCuatrimestre").value = materia ? materia.cuatrimestre : "";
  $("#materiaDocente").value = materia ? String(materia.docenteId) : "";

  openModal(materiaModal);
}

function deleteDocente(id) {
  const docente = state.docentes.find((d) => d.id === id);
  if (!docente) return;

  if (!confirm(`¿Eliminar a ${docente.nombre}?`)) return;

  state.docentes = state.docentes.filter((d) => d.id !== id);
  state.materias = state.materias.filter((m) => m.docenteId !== id);

  renderAll();
}

function deleteMateria(id) {
  const materia = state.materias.find((m) => m.id === id);
  if (!materia) return;

  if (!confirm(`¿Eliminar la materia "${materia.nombre}"?`)) return;

  state.materias = state.materias.filter((m) => m.id !== id);

  renderAll();
}

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

$("#btnAddDocente").addEventListener("click", () => openDocenteForm("create"));
$("#btnAddMateria").addEventListener("click", () => openMateriaForm("create"));

$("#docenteForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const id = $("#docenteId").value ? Number($("#docenteId").value) : null;
  const nombre = $("#docenteNombre").value.trim();
  const fotoUrl = $("#docenteFoto").value.trim();

  if (!nombre) return;

  if (id) {
    const docente = state.docentes.find((d) => d.id === id);
    if (docente) {
      docente.nombre = nombre;
      docente.fotoUrl = fotoUrl;
    }
  } else {
    state.docentes.push({
      id: nextId(state.docentes),
      nombre,
      fotoUrl
    });
  }

  closeModal(docenteModal);
  renderAll();
});

$("#materiaForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const id = $("#materiaId").value ? Number($("#materiaId").value) : null;
  const nombre = $("#materiaNombre").value.trim();
  const cuatrimestre = $("#materiaCuatrimestre").value.trim();
  const docenteId = Number($("#materiaDocente").value);

  if (!nombre || !cuatrimestre || !docenteId) return;

  if (id) {
    const materia = state.materias.find((m) => m.id === id);
    if (materia) {
      materia.nombre = nombre;
      materia.cuatrimestre = cuatrimestre;
      materia.docenteId = docenteId;
    }
  } else {
    state.materias.push({
      id: nextId(state.materias),
      nombre,
      cuatrimestre,
      docenteId
    });
  }

  closeModal(materiaModal);
  renderAll();
});

document.addEventListener("click", (e) => {
  const closeTarget = e.target.closest("[data-close]");
  if (closeTarget) {
    closeModal(document.getElementById(closeTarget.dataset.close));
    return;
  }

  const editDocente = e.target.closest("[data-edit-docente]");
  if (editDocente) {
    openDocenteForm("edit", Number(editDocente.dataset.editDocente));
    return;
  }

  const delDocente = e.target.closest("[data-del-docente]");
  if (delDocente) {
    deleteDocente(Number(delDocente.dataset.delDocente));
    return;
  }

  const editMateria = e.target.closest("[data-edit-materia]");
  if (editMateria) {
    openMateriaForm("edit", Number(editMateria.dataset.editMateria));
    return;
  }

  const delMateria = e.target.closest("[data-del-materia]");
  if (delMateria) {
    deleteMateria(Number(delMateria.dataset.delMateria));
    return;
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal(docenteModal);
    closeModal(materiaModal);
  }
});

renderAll();
switchTab("docentes");
