document.addEventListener("DOMContentLoaded", () => {
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

  const $ = (selector) => document.querySelector(selector);

  const views = {
    docentes: $("#view-docentes"),
    materias: $("#view-materias")
  };

  const docenteModal = $("#docenteModal");
  const materiaModal = $("#materiaModal");
  const docenteFotoInput = $("#docenteFotoInput");
  const docenteFotoPreview = $("#docenteFotoPreview");

  let state = loadState();

  function cloneDefault() {
    return JSON.parse(JSON.stringify(defaultState));
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefault();

    try {
      const parsed = JSON.parse(raw);
      return {
        docentes: Array.isArray(parsed.docentes) ? parsed.docentes : [],
        materias: Array.isArray(parsed.materias) ? parsed.materias : []
      };
    } catch {
      return cloneDefault();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function nextId(items) {
    return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  }

  function initials(name) {
    return String(name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  }

  function avatarSvg(name) {
    const safeName = String(name || "Docente");
    const colors = ["#16388b", "#1f7a4d", "#7a1731", "#4d5bd1", "#2f6f9f"];
    const firstChar = safeName.charCodeAt(0) || 65;
    const color = colors[(safeName.length + firstChar) % colors.length];
    const text = initials(safeName) || "D";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
        <rect width="64" height="64" rx="32" fill="${color}"/>
        <text x="32" y="39" font-family="Arial" font-size="22" text-anchor="middle" fill="white" font-weight="700">${text}</text>
      </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function getDocenteById(id) {
    return state.docentes.find((d) => d.id === Number(id)) || null;
  }

  function getDocenteFoto(id) {
    const docente = getDocenteById(id);
    if (!docente) return avatarSvg("Sin docente");
    return docente.fotoUrl && docente.fotoUrl.trim() ? docente.fotoUrl : avatarSvg(docente.nombre);
  }

  function getMateriasCount(docenteId) {
    return state.materias.filter((m) => m.docenteId === docenteId).length;
  }

  function openModal(modal) {
    if (modal) modal.classList.remove("hidden");
  }

  function closeModal(modal) {
    if (modal) modal.classList.add("hidden");
  }

  function switchTab(tab) {
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    if (views.docentes) views.docentes.classList.toggle("hidden", tab !== "docentes");
    if (views.materias) views.materias.classList.toggle("hidden", tab !== "materias");
  }

  function updateDocentePreview(src) {
    if (!docenteFotoPreview) return;
    if (!src) {
      docenteFotoPreview.src = "";
      docenteFotoPreview.classList.add("hidden");
      return;
    }
    docenteFotoPreview.src = src;
    docenteFotoPreview.classList.remove("hidden");
  }

  async function resizeImageToDataURL(file, maxSize = 320, quality = 0.8) {
    const imageBitmap = await createImageBitmap(file);
    const ratio = Math.min(maxSize / imageBitmap.width, maxSize / imageBitmap.height, 1);
    const width = Math.max(1, Math.round(imageBitmap.width * ratio));
    const height = Math.max(1, Math.round(imageBitmap.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
  }

  function renderDocentes() {
    const countEl = $("#docentesCount");
    const listEl = $("#docentesList");
    if (!countEl || !listEl) return;

    countEl.textContent = String(state.docentes.length);

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
            <button type="button" class="mini edit" title="Editar" data-edit-docente="${d.id}">✎</button>
            <button type="button" class="mini del" title="Eliminar" data-del-docente="${d.id}">×</button>
          </div>
        </div>
      `;
    }).join("");

    listEl.innerHTML = html || "<p>No hay docentes.</p>";
  }

  function renderMateriaOptions() {
    const select = $("#materiaDocente");
    if (!select) return;

    select.innerHTML = `
      <option value="">Seleccione docente</option>
      ${state.docentes.map((d) => `<option value="${d.id}">${d.nombre}</option>`).join("")}
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
        <tr>
          <td>${m.nombre}</td>
          <td><span class="badge">${m.cuatrimestre}</span></td>
          <td>
            <div class="docente-inline">
              <img class="avatar-sm" src="${docenteFoto}" alt="Foto de ${docenteNombre}">
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
      `;
    }).join("");

    listEl.innerHTML = rows || `<tr><td colspan="4">No hay materias.</td></tr>`;
  }

  function renderAll() {
    renderDocentes();
    renderMateriaOptions();
    renderMaterias();
    saveState();
  }

  function openDocenteForm(mode, id = null) {
    const title = $("#docenteModalTitle");
    const idInput = $("#docenteId");
    const nombreInput = $("#docenteNombre");
    const fotoInput = $("#docenteFoto");

    if (title) title.textContent = mode === "edit" ? "EDITAR DOCENTE" : "AGREGAR DOCENTE";
    if (idInput) idInput.value = id || "";

    const docente = state.docentes.find((d) => d.id === id);
    const fotoActual = docente ? (docente.fotoUrl || "") : "";

    if (nombreInput) nombreInput.value = docente ? docente.nombre : "";
    if (fotoInput) fotoInput.value = fotoActual;
    if (docenteFotoInput) docenteFotoInput.value = "";

    updateDocentePreview(fotoActual);
    openModal(docenteModal);
  }

  function openMateriaForm(mode, id = null) {
    const title = $("#materiaModalTitle");
    const idInput = $("#materiaId");
    const nombreInput = $("#materiaNombre");
    const cuatriInput = $("#materiaCuatrimestre");
    const docenteInput = $("#materiaDocente");

    if (title) title.textContent = mode === "edit" ? "EDITAR MATERIA" : "AGREGAR MATERIA";
    if (idInput) idInput.value = id || "";

    const materia = state.materias.find((m) => m.id === id);

    if (nombreInput) nombreInput.value = materia ? materia.nombre : "";
    if (cuatriInput) cuatriInput.value = materia ? materia.cuatrimestre : "";
    if (docenteInput) docenteInput.value = materia ? String(materia.docenteId) : "";

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

  $("#btnAddDocente")?.addEventListener("click", () => openDocenteForm("create"));
  $("#btnAddMateria")?.addEventListener("click", () => openMateriaForm("create"));

  if (docenteFotoInput) {
    docenteFotoInput.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const reducedDataUrl = await resizeImageToDataURL(file, 320, 0.8);
        const fotoInput = $("#docenteFoto");
        if (fotoInput) fotoInput.value = reducedDataUrl;
        updateDocentePreview(reducedDataUrl);
      } catch {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          const fotoInput = $("#docenteFoto");
          if (fotoInput) fotoInput.value = result;
          updateDocentePreview(result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  $("#docenteForm")?.addEventListener("submit", (e) => {
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
});
