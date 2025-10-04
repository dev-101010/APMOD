// apmod-shift.js
// Single-localStorage entry holding ALL datasets (A–D) in one blob. 
// English comments; no icons in code/comments.

var APModShift = (function () {
  const api = {};

  // --- Defaults ---------------------------------------------------------------
  api.defaults = {
    storageKey  : "APModShift:ALL",     // single localStorage key for all datasets
    dataIndex   : "_localNote",
    columnText  : "Note",
    columnWidth : 180,
    keyFn       : function (rec) {
      // Record key used to map notes; adjust as needed for your data model
      return rec.get("id");
    }
  };

  // --- In-memory state --------------------------------------------------------
  api.activeDataset = null;              // "A" | "B" | "C" | "D" | null
  api.cache = {};                        // points to the current dataset map (by reference)
  api._master = null;                    // { kind, version, datasets: {A:{},B:{},C:{},D:{}} }

  // --- Storage schema ---------------------------------------------------------
  const STORAGE_KIND = "APModShift.Storage";
  const STORAGE_VERSION = 1;

  function _ensureMasterShape(obj) {
    // Normalize any loaded object into our master structure.
    const master = (obj && typeof obj === "object") ? obj : {};
    if (master.kind !== STORAGE_KIND) master.kind = STORAGE_KIND;
    if (typeof master.version !== "number") master.version = STORAGE_VERSION;
    if (!master.datasets || typeof master.datasets !== "object") master.datasets = {};
    ["A","B","C","D"].forEach(ds => {
      if (!master.datasets[ds] || typeof master.datasets[ds] !== "object") master.datasets[ds] = {};
    });
    return master;
  }

  function _loadMaster(storageKey) {
    const key = storageKey || api.defaults.storageKey;
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      api._master = _ensureMasterShape(parsed);
    } catch (e) {
      api._master = _ensureMasterShape(null);
    }
    return api._master;
  }

  function _saveMaster(storageKey) {
    const key = storageKey || api.defaults.storageKey;
    try {
      localStorage.setItem(key, JSON.stringify(api._master || _ensureMasterShape(null)));
    } catch (e) { /* ignore */ }
  }

  function _getDatasetMap(ds) {
    const d = String(ds || "").toUpperCase();
    if (!/^[ABCD]$/.test(d)) return {};
    if (!api._master) _loadMaster();
    if (!api._master.datasets[d]) api._master.datasets[d] = {};
    return api._master.datasets[d];
  }

  function _ensureExtAlertSelectShift() {
    if (typeof Ext !== "undefined" && Ext.Msg && Ext.Msg.alert) {
      Ext.Msg.alert("Select Shift", "Please activate A, B, C, or D first.");
    } else if (typeof alert === "function") {
      alert("Select Shift");
    }
  }

  function _isActive() { return !!api.activeDataset; }

  // --- Init-style public load/save (no params) ---------------------------------
  api.load = function () {
    // load single master blob; do NOT auto-activate a dataset
    _loadMaster(api.defaults.storageKey);
    if (api.activeDataset) {
      // keep pointing cache to the already active dataset, if any
      api.cache = _getDatasetMap(api.activeDataset);
    } else {
      api.cache = {}; // no active selection yet → no UI writes
    }
    return api._master;
  };

  api.save = function () {
    // optional utility; not required for normal use
    _saveMaster(api.defaults.storageKey);
  };

  // --- UI sync ----------------------------------------------------------------
  /** Apply current cache (active dataset) to a store's records (NO-OP if no dataset active). */
  api.refresh = function (store, cfg) {
    if (!store) return;
    if (!_isActive()) return; // no writes without active dataset
    const c = cfg || api.defaults;
    const map = api.cache || {};
    if (typeof store.each !== "function") return;
    try {
      store.each(function(rec){
        const k = c.keyFn(rec);
        if (Object.prototype.hasOwnProperty.call(map, k)) {
          rec.set(c.dataIndex, String(map[k] || ""));
        } else {
          rec.set(c.dataIndex, "");
        }
      });
    } catch (e) { /* swallow */ }
  };

  // --- Internal helpers for grid wiring --------------------------------------
  api._ensureModelField = function (store, dataIndex) {
    const model = store && store.getModel && store.getModel();
    if (!model || !model.fields) return;
    const fields = model.fields;
    if (typeof fields.get === 'function') {
      if (!fields.get(dataIndex)) {
        fields.add(new Ext.data.Field({ name: dataIndex, type: "string", defaultValue: "", persist: false }));
      }
      return;
    }
    if (Array.isArray(fields)) {
      const exists = fields.some(f => f.name === dataIndex);
      if (!exists) {
        fields.push(new Ext.data.Field({ name: dataIndex, type: "string", defaultValue: "", persist: false }));
      }
    }
  };

  // Light store sync: NO tracking of stores, only per-store events
  api._attachStoreSync = function (store, cfg) {
    if (!store || store.__apmodShiftNoteSynced) return;
    store.__apmodShiftNoteSynced = true;
    if (typeof store.on === "function") {
      store.on("load",        function () { api.refresh(store, cfg); });
      store.on("datachanged", function () { api.refresh(store, cfg); });
    }
  };

  api._makeTextColumn = function (cfg) {
    return {
      text: cfg.columnText,
      dataIndex: cfg.dataIndex,
      width: cfg.columnWidth,
      sortable: false,
      menuDisabled: true,
      draggable: false,
      editor: { xtype: "textfield", allowBlank: true, selectOnFocus: true },
      renderer: function (v) { return v == null ? "" : String(v); }
    };
  };

  api._ensureCellEditing = function (grid, cfg) {
    let plugin = grid.findPlugin && grid.findPlugin("cellediting");
    if (!plugin) {
      plugin = Ext.create("Ext.grid.plugin.CellEditing", { clicksToEdit: 1, pluginId: "cellediting" });
      grid.plugins = grid.plugins || [];
      grid.plugins.push(plugin);
      grid.initPlugin && grid.initPlugin(plugin);
    }
    if (!plugin.__apmodShiftBeforeEditBound) {
      plugin.__apmodShiftBeforeEditBound = true;
      plugin.on("beforeedit", function (editor, e) {
        if (!e || !e.column || e.column.dataIndex !== cfg.dataIndex) return false;
        if (!_isActive()) { _ensureExtAlertSelectShift(); return false; }
        return true;
      });
    }
    if (!plugin.__apmodShiftEditBound) {
      plugin.__apmodShiftEditBound = true;
      plugin.on("edit", function (ed, ctx) {
        if (!ctx || !ctx.record) return;
        if (!ctx.column || ctx.column.dataIndex !== cfg.dataIndex) return;
        if (!_isActive()) { _ensureExtAlertSelectShift(); return; }
        // On edit, update cache (active dataset) and save master
        const rec = ctx.record;
        const newVal = String(ctx.value || "");
        rec.set(cfg.dataIndex, newVal);
        rec.commit();
        const k = cfg.keyFn(rec);
        if (newVal) { api.cache[k] = newVal; } else { delete api.cache[k]; }
        _saveMaster(); // persist the single blob
        const store = rec.store;
        if (store) { store.fireEvent && store.fireEvent('datachanged', store); }
      });
    }
  };

  api._insertColumnLeft = function (grid, col) {
    if (grid.headerCt && typeof grid.headerCt.insert === "function") {
      grid.headerCt.insert(0, col);
      grid.getView().refresh();
    } else if (Array.isArray(grid.columns)) {
      grid.columns.unshift(col);
    }
  };

  // --- Public: attach (passive & idempotent) ----------------------------------
  /**
   * Attach a local-only editable text column (left-most) and wire syncing.
   * Builds the column and listeners, but does NOT write/restore data unless a dataset is active.
   * No internal store tracking; the caller can refresh explicitly if needed.
   */
  api.attach = function (grid, options) {
    if (!grid || grid.__apmodShiftAttached) return;
    grid.__apmodShiftAttached = true;

    api.activeDataset = null;
    api.cache = {};

    const cfg = Ext.apply({}, options || {}, api.defaults);
    _loadMaster(cfg.storageKey); // ensure master present

    const store = grid.getStore && grid.getStore();
    if (!store) return;

    api._ensureModelField(store, cfg.dataIndex);
    api._attachStoreSync(store, cfg);

    const col = api._makeTextColumn(cfg);
    api._insertColumnLeft(grid, col);
    api._ensureCellEditing(grid, cfg);

    // No initial writes unless a dataset is active
    api.refresh(store, cfg);
  };

  // --- Dataset activation (no store tracking) ---------------------------------
  /**
   * Activate a dataset. Optionally pass { store } to refresh immediately.
   * If no store is passed, the UI will refresh on the store's next load/datachanged.
   */
  api.setDataset = function (ds, opts) {
    const upper = String(ds || "").trim().toUpperCase();
    if (!/^[ABCD]$/.test(upper)) {
      throw new Error("Unsupported dataset. Use A, B, C, or D.");
    }
    const cfgKey = (opts && opts.storageKey) || api.defaults.storageKey;
    _loadMaster(cfgKey);
    api.activeDataset = upper;
    // Point cache to the live map inside master (mutations update master directly)
    api.cache = _getDatasetMap(upper);

    // Optional immediate refresh for the caller's current store
    const s = opts && opts.store;
    if (s) {
      api.refresh(s, api.defaults);
      const g = s.ownerGrid || null;
      if (g && g.getView && g.getView().refresh) {
        try { g.getView().refresh(); } catch (e) {}
      }
    }
  };

  api.getActiveDataset = function () { return api.activeDataset; };

  // --- Export (always allowed) ------------------------------------------------
  const EXPORT_KIND_SINGLE  = "APModShift.Notes";
  const EXPORT_KIND_BUNDLE  = "APModShift.NotesBundle";
  const EXPORT_VERSION      = 1;

  function _nowTimestamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
  }

  function _safeFileNamePart(s) {
    return String(s || "").replace(/[^a-z0-9_\-\.]+/gi, "_").replace(/^_+|_+$/g, "");
  }

  /** Build payload for current dataset (requires active). */
  api.buildExportPayload = function () {
    if (!api.activeDataset) throw new Error("No dataset active.");
    _loadMaster();
    const data = {};
    const src = _getDatasetMap(api.activeDataset);
    Object.keys(src).forEach(k => data[k] = String(src[k] ?? ""));
    return {
      kind: EXPORT_KIND_SINGLE,
      version: EXPORT_VERSION,
      dataset: api.activeDataset, // informative
      data
    };
  };

  /** Build bundle A–D from single master. */
  api.buildExportBundle = function () {
    _loadMaster();
    const datasets = {};
    ["A","B","C","D"].forEach(ds => {
      const src = _getDatasetMap(ds);
      const data = {};
      Object.keys(src).forEach(k => data[k] = String(src[k] ?? ""));
      datasets[ds] = { data };
    });
    return {
      kind: EXPORT_KIND_BUNDLE,
      version: EXPORT_VERSION,
      baseKey: api.defaults.storageKey,
      datasets
    };
  };

  /** Download ALL datasets (always works). */
  api.exportAllToFile = function () {
    const payload = api.buildExportBundle();
    const json = JSON.stringify(payload, null, 2);
    const keyPart = _safeFileNamePart(api.defaults.storageKey || "APModShift");
    const ts = _nowTimestamp();
    const filename = `${keyPart}_Notes_ALL_${ts}.json`;
    const uri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    const a = document.createElement("a");
    a.setAttribute("href", uri);
    a.setAttribute("download", filename);
    a.click();
  };

  /** Download current dataset (only when active). */
  api.exportCurrentToFile = function () {
    if (!api.activeDataset) { _ensureExtAlertSelectShift(); return; }
    const payload = api.buildExportPayload();
    const json = JSON.stringify(payload, null, 2);
    const keyPart = _safeFileNamePart(api.defaults.storageKey || "APModShift");
    const ts = _nowTimestamp();
    const filename = `${keyPart}_Notes_${payload.dataset}_${ts}.json`;
    const uri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    const a = document.createElement("a");
    a.setAttribute("href", uri);
    a.setAttribute("download", filename);
    a.click();
  };

  // --- Import (universal: always allowed) ------------------------------------
  const IMPORT_KIND_SINGLE = "APModShift.Notes";
  const IMPORT_KIND_BUNDLE = "APModShift.NotesBundle";
  const IMPORT_VERSION_MAX = 1;

  function _extractDatasetFromLegacyStorageKey(sk) {
    // If legacy single-file used keys like "...:DS:A", try to detect the suffix.
    if (!sk || typeof sk !== "string") return null;
    const m = sk.match(/:DS:([ABCD])$/i);
    return m ? m[1].toUpperCase() : null;
  }

  function _normalizeImportedAny(parsed) {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Unsupported file: payload must be an object.");
    }
    // Bundle
    if (parsed.kind === IMPORT_KIND_BUNDLE) {
      if (typeof parsed.version !== "number" || parsed.version > IMPORT_VERSION_MAX) {
        throw new Error("Unsupported file: invalid or newer 'version'.");
      }
      const ds = parsed.datasets;
      if (!ds || typeof ds !== "object" || Array.isArray(ds)) {
        throw new Error("Invalid bundle: 'datasets' must be an object.");
      }
      const cleaned = {};
      Object.keys(ds).forEach(name => {
        const entry = ds[name] || {};
        const data = entry.data || {};
        const norm = {};
        Object.keys(data).forEach(k => { norm[String(k)] = String(data[k] ?? ""); });
        const upper = String(name || "").toUpperCase();
        if (/^[ABCD]$/.test(upper)) cleaned[upper] = norm;
      });
      return { mode: "bundle", datasets: cleaned };
    }
    // Single
    if (parsed.kind === IMPORT_KIND_SINGLE) {
      if (typeof parsed.version !== "number" || parsed.version > IMPORT_VERSION_MAX) {
        throw new Error("Unsupported file: invalid or newer 'version'.");
      }
      const map = {};
      const src = parsed.data || {};
      Object.keys(src).forEach(k => { map[String(k)] = String(src[k] ?? ""); });
      // Prefer explicit dataset field; else try legacy storageKey; else undefined
      const dsFromField = parsed.dataset && /^[ABCD]$/.test(String(parsed.dataset)) ? String(parsed.dataset).toUpperCase() : null;
      const dsFromKey = _extractDatasetFromLegacyStorageKey(parsed.storageKey);
      const ds = dsFromField || dsFromKey || null;
      return { mode: "single", dataset: ds, data: map };
    }
    throw new Error("Unsupported file: unknown 'kind'.");
  }

  /**
   * Always-allowed universal import:
   * - Writes ALL provided datasets into the single master entry.
   * - If a dataset is currently active, you may refresh the caller's store by passing opts.store.
   *   Otherwise UI updates on next store load/datachanged.
   * Options: { merge?: boolean, store?: Ext.data.Store }
   */
  api.importUniversalFromParsed = function (parsed, opts) {
    const o = opts || {};
    _loadMaster(); // ensure master loaded

    const norm = _normalizeImportedAny(parsed);

    if (norm.mode === "bundle") {
      // Write every provided dataset into master
      ["A","B","C","D"].forEach(ds => {
        const incoming = norm.datasets[ds];
        if (!incoming) return;
        if (o.merge === true) {
          api._master.datasets[ds] = Object.assign({}, api._master.datasets[ds] || {}, incoming);
        } else {
          api._master.datasets[ds] = incoming;
        }
      });
    } else {
      // SINGLE: decide which dataset it belongs to
      let targetDS = norm.dataset;
      if (!targetDS) {
        targetDS = api.activeDataset || "A"; // fallback if dataset unknown and no active selection
      }
      if (!/^[ABCD]$/.test(targetDS)) targetDS = "A";
      if (o.merge === true) {
        api._master.datasets[targetDS] = Object.assign({}, api._master.datasets[targetDS] || {}, norm.data);
      } else {
        api._master.datasets[targetDS] = norm.data;
      }
    }

    // Persist master
    _saveMaster();

    // If active dataset exists and a store was provided, refresh it now
    if (api.activeDataset && o.store) {
      api.cache = _getDatasetMap(api.activeDataset);
      api.refresh(o.store, api.defaults);
      const g = o.store.ownerGrid || null;
      if (g && g.getView && g.getView().refresh) {
        try { g.getView().refresh(); } catch (e) {}
      }
    }
  };

  /** File-picker wrapper for universal import. Always allowed. */
  api.importUniversalFromFile = function (opts) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = e => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const parsed = JSON.parse(String(evt.target.result || "null"));
          api.importUniversalFromParsed(parsed, opts || {});
          if (typeof APModPopup !== "undefined" && APModPopup && APModPopup.openPopup) {
            APModPopup.openPopup("Notes imported.");
          } else {
            console.info("APModShift: Notes imported.");
          }
        } catch (err) {
          if (typeof Ext !== "undefined" && Ext.Msg && Ext.Msg.alert) {
            Ext.Msg.alert("Import failed", err && err.message ? String(err.message) : "Invalid JSON or unsupported file.");
          } else if (typeof alert === "function") {
            alert("Import failed");
          }
        }
      };
      reader.readAsText(file, "UTF-8");
    };
    input.click();
  };

  // --- Utilities --------------------------------------------------------------
  /**
   * Clear selection (deactivate dataset). Optional: pass current store to blank visuals immediately.
   */
  api.clearSelection = function (store) {
    api.activeDataset = null;
    api.cache = {};
    if (store && typeof store.each === "function") {
      const c = api.defaults;
      try {
        store.each(function (rec) { rec.set(c.dataIndex, ""); });
      } catch (e) { /* swallow */ }
      const g = store.ownerGrid || null;
      if (g && g.getView && g.getView().refresh) {
        try { g.getView().refresh(); } catch (e) {}
      }
    }
  };

  api.clearAll = function (opts) {
    const key = (opts && opts.storageKey) || api.defaults.storageKey;
    try { localStorage.removeItem(key); } catch (e) {}
    api._master = _ensureMasterShape(null);
    if (api.activeDataset) {
      api.cache = _getDatasetMap(api.activeDataset);
    } else {
      api.cache = {};
    }
  };

  return api;
})();
