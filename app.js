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
        materias: Array.isArray(parsed.materias)
          ? parsed.materias.map((m) => ({
              ...m,
              materiales: Array.isArray(m.materiales) ? m.materiales : []
            }))
          : []
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

  function hideDocenteUrlField() {
    const urlInput = $("#docenteFoto");
    if (urlInput) {
      const label = urlInput.closest("label");
      if (label) label.style.display = "none";
      urlInput.style.display = "none";
      urlInput.value = "";
    }
  }

  function ensureDocenteUploadUI() {
    hideDocenteUrlField();

    let input = $("#docenteFotoInput");
    if (!input) {
      input = document.createElement("input");
      input.type = "file";
      input.id = "docenteFotoInput";
      input.accept = "image/*";
      input.hidden = true;
      $("#docenteForm").appendChild(input);
    }

    let uploadWrap = $("#docenteFotoUploadWrap");
    if (!uploadWrap) {
      uploadWrap = document.createElement("div");
      uploadWrap.id = "docenteFotoUploadWrap";
      uploadWrap.style.display = "flex";
      uploadWrap.style.flexDirection = "column";
      uploadWrap.style.alignItems = "center";
      uploadWrap.style.gap = "8px";
      uploadWrap.style.margin = "4px 0 10px";

      const preview = document.createElement("img");
      preview.id = "docenteFotoPreview";
      preview.alt = "Vista previa del docente";
      preview.style.width = "90px";
      preview.style.height = "90px";
      preview.style.objectFit = "cover";
      preview.style.borderRadius = "50%";
      preview.style.border = "2px solid #2146a3";
      preview.style.background = "#eef3ff";
      preview.style.display = "none";
      preview.classList.add("photo-preview");

      const label = document.createElement("label");
      label.htmlFor = "docenteFotoInput";
      label.textContent = "Subir foto del docente";
      label.style.cursor = "pointer";
      label.style.color = "#2146a3";
      label.style.fontWeight = "700";
      label.style.fontSize = "12px";
      label.style.textDecoration = "underline";

      const fileName = document.createElement("span");
      fileName.id = "docenteFotoName";
      fileName.style.fontSize = "11px";
      fileName.style.color = "#444";
      fileName.textContent = "";

      uploadWrap.appendChild(preview);
      uploadWrap.appendChild(label);
      uploadWrap.appendChild(fileName);

      const actions = $("#docenteForm .actions");
      if (actions) {
        actions.parentNode.insertBefore(uploadWrap, actions);
      } else {
        $("#docenteForm").appendChild(uploadWrap);
      }
    }
  }

  function updateDocentePreview(src) {
    const preview = $("#docenteFotoPreview");
    const fileName = $("#docenteFotoName");
    if (preview) {
      if (!src) {
        preview.src = "";
        preview.style.display = "none";
      } else {
        preview.src = src;
        preview.style.display = "block";
      }
    }
    if (fileName) {
      fileName.textContent = src ? "Foto seleccionada" : "";
    }
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
            <img class="avatar" src="${foto}" alt="Foto de ${d.nombre}" />
            <div class="card-text">
              <strong>${d.nombre}</strong>
              <small>${count} materia${count === 1 ? "" : "s"}</small>
            </div>
          </div>
          <div class="card-actions">
            <button type="button" class="mini edit" data-edit-docente="${d.id}" title="Editar">✎</button>
            <button type="button" class="mini del" data-del-docente="${d.id}" title="Eliminar">×</button>
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
                <button type="button" class="material-btn" data-open-material="${m.id}">Abrir</button>
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
    const fotoHidden = $("#docenteFoto");

    if (title) title.textContent = mode === "edit" ? "EDITAR DOCENTE" : "AGREGAR DOCENTE";
    if (idInput) idInput.value = id || "";

    const docente = state.docentes.find((d) => d.id === id);

    if (nombreInput) nombreInput.value = docente ? docente.nombre : "";
    if (fotoHidden) fotoHidden.value = docente ? (docente.fotoUrl || "") : "";

    const input = $("#docenteFotoInput");
    if (input) input.value = "";

    updateDocentePreview(docente ? (docente.fotoUrl || "") : "");

    openModal(docenteModal);
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
                <button type="button" class="file-btn" data-open-material="${m.id}">Abrir</button>
                <button type="button" class="file-btn danger" data-remove-material="${m.id}">Quitar</button>
              </div>
            </div>
          `).join("")
        : "<p>No hay materiales agregados.</p>";
    }

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

    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${material.name}</title>
            <style>
              body { margin: 0; background: #f3f6ff; }
              iframe { width: 100vw; height: 100vh; border: 0; }
            </style>
          </head>
          <body>
            <iframe src="${material.url}" title="${material.name}"></iframe>
          </body>
        </html>
      `);
    } else {
      window.open(material.url, "_blank");
    }
  }

  function bindDocenteFileInput() {
    const fileInput = $("#docenteFotoInput");
    if (!fileInput) return;

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const hiddenFoto = $("#docenteFoto");
        if (hiddenFoto) hiddenFoto.value = result;

        const fileName = $("#docenteFotoName");
        if (fileName) fileName.textContent = file.name;

        updateDocentePreview(result);
      };
      reader.readAsDataURL(file);
    });
  }

  $("#btnAddDocente")?.addEventListener("click", () => openDocenteForm("create"));
  $("#btnAddMateria")?.addEventListener("click", () => openMateriaForm("create"));

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
        docenteId,
        materiales: []
      });
    }

    closeModal(materiaModal);
    renderAll();
  });

  $("#materiaArchivoInput")?.addEventListener("change", async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    await addFilesToCurrentMateria(files);
    e.target.value = "";
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

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal(docenteModal);
      closeModal(materiaModal);
    }
  });

  ensureDocenteUploadUI();
  bindDocenteFileInput();
  renderAll();
  switchTab("docentes");
});
