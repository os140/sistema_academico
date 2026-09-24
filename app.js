document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "sistema_academico_v1";

  const defaultState = {
    docentes: [
      { id: 1, nombre: "Ing jenny ximena", fotoUrl: "" },
      { id: 2, nombre: "Lic. Sofía Mendoza", fotoUrl: "" },
      { id: 3, nombre: "Mtro. Carlos Reyes", fotoUrl: "" }
    ],
    materias: [
      { id: 1, nombre: "Cálculo Diferencial", cuatrimestre: "1", docenteId: 1, materiales: [] },
      { id: 2, nombre: "Comunicación Oral", cuatrimestre: "1", docenteId: 2, materiales: [] },
      { id: 3, nombre: "Programación", cuatrimestre: "1", docenteId: 3, materiales: [] },
      { id: 4, nombre: "Álgebra Lineal", cuatrimestre: "2", docenteId: 1, materiales: [] },
      { id: 5, nombre: "Bases de Datos", cuatrimestre: "3", docenteId: 3, materiales: [] }
    ]
  };

  const $ = (selector) => document.querySelector(selector);

  const views = {
    docentes: $("#view-docentes"),
    materias: $("#view-materias")
  };

  const docenteModal = $("#docenteModal");
  const materiaModal = $("#materiaModal");
  const docenteFotoInput = $("#docenteFotoInput");
  const docenteFotoPreview = $("#docenteFotoPreview");
 // ...existing code...

const materiaArchivoInput = $("#materiaArchivoInput");

function renderMaterialesInline(materia) {
  const materiales = materia?.materiales || [];

  if (!materiales.length) {
    return `
      <div class="materiales-inline">
        <div class="materiales-inline-header">Materiales</div>
        <div class="materiales-list">
          <div class="material-item">
            <span class="material-item-name">No hay materiales para esta materia.</span>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="materiales-inline">
      <div class="materiales-inline-header">Materiales</div>
      <div class="materiales-list">
        ${materiales.map((m) => `
          <div class="material-item">
            <span class="material-item-name">${m.name}</span>
            <div class="material-actions">
              <button type="button" class="material-btn" data-open-material="${m.id}">Descargar</button>
              <button type="button" class="material-btn danger" data-remove-material="${m.id}">Quitar</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderMaterias() {
  const countEl = $("#materiasCount");
  const listEl = $("#materiasList");
  if (!countEl || !listEl) return;

  countEl.textContent = String(state.materias.length);

  const rows = state.materias.map((m) => {
    const docente = getDocenteById(m.docenteId);
    const docenteNombre = docente ? docente.nombre : "Sin docente";
    const docenteFoto = getDocenteFoto(m.docenteId);

    return `
      <tr class="material-row">
        <td>${m.nombre}</td>
        <td><span class="badge">${m.cuatrimestre}</span></td>
        <td>
          <div class="docente-inline">
            <img class="avatar-sm" src="${docenteFoto}" alt="Foto de ${docenteNombre}" />
            <span>${docenteNombre}</span>
          </div>
        </td>
        <td>
          <div class="row-actions">
            <button type="button" class="link" data-edit-materia="${m.id}">Editar</button>
            <button type="button" class="link danger" data-del-materia="${m.id}">Eliminar</button>
          </div>
        </td>
      </tr>
      <tr class="materiales-row">
        <td colspan="4">
          ${renderMaterialesInline(m)}
        </td>
      </tr>
    `;
  }).join("");

  listEl.innerHTML = rows || `<tr><td colspan="4">No hay materias.</td></tr>`;
}

function openMateriaForm(mode, id = null) {
  const title = $("#materiaModalTitle");
  const idInput = $("#materiaId");
  const nombreInput = $("#materiaNombre");
  const cuatriInput = $("#materiaCuatrimestre");
  const docenteInput = $("#materiaDocente");
  const list = $("#materiaMaterialesList");

  if (title) title.textContent = mode === "edit" ? "EDITAR MATERIA" : "AGREGAR MATERIA";
  if (idInput) idInput.value = id || "";

  const materia = state.materias.find((m) => m.id === id);

  if (nombreInput) nombreInput.value = materia ? materia.nombre : "";
  if (cuatriInput) cuatriInput.value = materia ? materia.cuatrimestre : "";
  if (docenteInput) docenteInput.value = materia ? String(materia.docenteId) : "";

  if (list) {
    const materiales = materia?.materiales || [];
    list.innerHTML = materiales.length
      ? materiales.map((m) => `
          <div class="materia-file">
            <span class="materia-file-name">${m.name}</span>
            <div class="materia-file-actions">
              <button type="button" class="file-btn" data-open-material="${m.id}">Descargar</button>
              <button type="button" class="file-btn danger" data-remove-material="${m.id}">Quitar</button>
            </div>
          </div>
        `).join("")
      : "<p>No hay materiales agregados.</p>";
  }

  openModal(materiaModal);
}

function getFileExtension(name) {
  const parts = String(name || "").split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function addFilesToCurrentMateria(files) {
  const materiaId = Number($("#materiaId").value || 0);
  const materia = state.materias.find((m) => m.id === materiaId);

  if (!materia) return;

  const fileArray = Array.from(files || []);
  if (!fileArray.length) return;

  const attachments = await Promise.all(fileArray.map(async (file) => {
    const url = await fileToDataURL(file);

    return {
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type || "application/octet-stream",
      url,
      extension: getFileExtension(file.name)
    };
  }));

  materia.materiales = [...(materia.materiales || []), ...attachments];
  renderAll();
  openMateriaForm("edit", materia.id);
}

function removeMaterialFromCurrentMateria(id) {
  const materiaId = Number($("#materiaId").value || 0);
  const materia = state.materias.find((m) => m.id === materiaId);

  if (!materia) return;

  materia.materiales = (materia.materiales || []).filter((m) => m.id !== id);
  renderAll();
  openMateriaForm("edit", materia.id);
}

function openMaterial(id) {
  const allMaterials = state.materias.flatMap((m) => m.materiales || []);
  const material = allMaterials.find((m) => m.id === id);

  if (!material) return;

  const link = document.createElement("a");
  link.href = material.url;
  link.download = material.name || "archivo";
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

if (materiaArchivoInput) {
  materiaArchivoInput.addEventListener("change", async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    await addFilesToCurrentMateria(files);
    e.target.value = "";
  });
}

$("#materiaForm")?.addEventListener("submit", (e) => {
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
      docenteId,
      materiales: []
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

  const editMateria = e.target.closest("[data-edit-materia]");
  if (editMateria) {
    openMateriaForm("edit", Number(editMateria.dataset.editMateria));
    return;
  }

  const delMateria = e.target.closest("[data-del-materia]");
  if (delMateria) {
    const materia = state.materias.find((m) => m.id === Number(delMateria.dataset.delMateria));
    if (!materia) return;

    if (!confirm(`¿Eliminar la materia "${materia.nombre}"?`)) return;

    state.materias = state.materias.filter((m) => m.id !== Number(delMateria.dataset.delMateria));
    renderAll();
    return;
  }

  const openMaterialBtn = e.target.closest("[data-open-material]");
  if (openMaterialBtn) {
    openMaterial(Number(openMaterialBtn.dataset.openMaterial));
    return;
  }

  const removeMaterialBtn = e.target.closest("[data-remove-material]");
  if (removeMaterialBtn) {
    removeMaterialFromCurrentMateria(Number(removeMaterialBtn.dataset.removeMaterial));
  }
});
// ...existing code...
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(docenteModal);
      closeModal(materiaModal);
    }
  });

  renderAll();
  switchTab("docentes");
});
