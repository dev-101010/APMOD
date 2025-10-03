// apmod-shift.js
// Local text column for remote-loaded/remote-sorted grids (e.g., Shift Report Book Labor)
// English comments; no icons in code/comments.

var APModShift = (function () {
  const api = {};

  // --- Defaults (can be overridden in attach options) -------------------------
  api.defaults = {
    storageKey  : "APModShift",
    dataIndex   : "_localNote",
    columnText  : "Note",
    columnWidth : 180,
    keyFn       : function (rec) {
      // Record key used to map notes; adjust as needed for your data model
      return rec.get("laborid") || rec.get("id") || rec.internalId;
    }
  };

  // --- Multi-dataset state (A/B/C/D) -----------------------------------------
  api.activeDataset = null; // "A" | "B" | "C" | "D" | null
  api._attachedStores = new Set();
  api._attachedGrids  = new Set();

  function _ensureExtAlertSelectShift() {
    if (typeof Ext !== "undefined" && Ext.Msg && Ext.Msg.alert) {
      Ext.Msg.alert("Select Shift", "Please activate A, B, C, or D first.");
    } else if (typeof alert === "function") {
      alert("Select Shift");
    }
  }

  function _isActive() { return !!api.activeDataset; }

  function _datasetKey(baseKey, ds) {
    const root = baseKey || api.defaults.storageKey;
    return `${root}:DS:${ds}`;
  }

  // --- In-memory cache --------------------------------------------------------
  api.cache = {};   // { recordKey: "note string" }
  api._loadedKey = null;

  /** Load once from localStorage into in-memory cache (for current active dataset). */
  api.load = function (storageKey) {
    const key = storageKey || api._loadedKey || api.defaults.storageKey;
    api._loadedKey = key;
    try {
      const raw = localStorage.getItem(key);
      api.cache = raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) {
      api.cache = {};
    }
  };

  /** Persist in-memory cache back to localStorage (for current active dataset). */
  api.save = function (storageKey) {
    const key = storageKey || api._loadedKey || api.defaults.storageKey;
    try {
      localStorage.setItem(key, JSON.stringify(api.cache || {}));
    } catch (e) { /* ignore */ }
  };

  /** Apply current cache to a store's records (NO-OP if no dataset active). */
  api.refresh = function (store, cfg) {
    if (!store) return;
    if (!_isActive()) return; // Do not write values until a dataset is active
    const c = cfg || api.defaults;
    const map = api.cache || {};
    store.each(function(rec){
      const k = c.keyFn(rec);
      if (Object.prototype.hasOwnProperty.call(map, k)) {
        rec.set(c.dataIndex, String(map[k] || ""));
      } else {
        rec.set(c.dataIndex, "");
      }
    });
  };

  // --- Internal helpers -------------------------------------------------------
  api._ensureModelField = function (store, dataIndex) {
    const model = store && store.getModel && store.getModel();
    if (!model || !model.fields) return;
    const fields = model.fields;

    // MixedCollection case
    if (typeof fields.get === 'function') {
      if (!fields.get(dataIndex)) {
        fields.add(new Ext.data.Field({
          name: dataIndex,
          type: "string",
          defaultValue: "",
          persist: false
        }));
      }
      return;
    }

    // Array fallback case
    if (Array.isArray(fields)) {
      const exists = fields.some(f => f.name === dataIndex);
      if (!exists) {
        fields.push(new Ext.data.Field({
          name: dataIndex,
          type: "string",
          defaultValue: "",
          persist: false
        }));
      }
    }
  };

  api._attachStoreSync = function (store, cfg) {
    if (!store || store.__apmodShiftNoteSynced) return;
    store.__apmodShiftNoteSynced = true;

    try { api._attachedStores.add(store); } catch (e) {}

    // On every datachanged, attempt to restore from in-memory cache — only if active
    store.on("datachanged", function () {
      api.refresh(store, cfg);
    });
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
        // Only allow editing of our column *and* only when a dataset is active
        if (!e || !e.column || e.column.dataIndex !== cfg.dataIndex) return false;
        if (!_isActive()) {
          _ensureExtAlertSelectShift();
          return false;
        }
        return true;
      });
    }
    if (!plugin.__apmodShiftEditBound) {
      plugin.__apmodShiftEditBound = true;
      plugin.on("edit", function (ed, ctx) {
        if (!ctx || !ctx.record) return;
        if (!ctx.column || ctx.column.dataIndex !== cfg.dataIndex) return;
        if (!_isActive()) {
          _ensureExtAlertSelectShift();
          return;
        }
        // Update cache and persist once
        const rec = ctx.record;
        const newVal = String(ctx.value || "");
        rec.set(cfg.dataIndex, newVal);
        rec.commit();
        const k = cfg.keyFn(rec);
        if (newVal) {
          api.cache[k] = newVal;
        } else {
          delete api.cache[k];
        }
        api.save(api._loadedKey);
        const store = rec.store;
        if (store) {
          store.fireEvent('datachanged', store);
        }
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

  function _trackGrid(grid) {
    try { api._attachedGrids.add(grid); } catch (e) {}
  }

  // --- Public: attach ---------------------------------------------------------
  /**
   * Attach a local-only editable text column (left-most) and wire syncing.
   * Builds the column and listeners, but does NOT write/restore data unless a dataset is active.
   *
   * @param {Ext.grid.Panel} grid
   * @param {Object} [options] { storageKey, dataIndex, columnText, columnWidth, keyFn }
   */
  api.attach = function (grid, options) {
    if (!grid || grid.__apmodShiftAttached) return;
    grid.__apmodShiftAttached = true;

    const cfg = Ext.apply({}, options || {}, api.defaults);

    const store = grid.getStore && grid.getStore();
    if (!store) return;

    api._ensureModelField(store, cfg.dataIndex);
    api._attachStoreSync(store, cfg);

    const col = api._makeTextColumn(cfg);
    api._insertColumnLeft(grid, col);
    api._ensureCellEditing(grid, cfg);
    _trackGrid(grid);

    // No initial writes unless a dataset is active
    api.refresh(store, cfg);
  };

  // --- Dataset activation -----------------------------------------------------
  /**
   * Activate one of the four datasets: "A", "B", "C", or "D".
   * Loads the corresponding storage key and refreshes all attached stores/grids.
   */
  api.setDataset = function (ds, opts) {
    const upper = String(ds || "").trim().toUpperCase();
    if (!/^[ABCD]$/.test(upper)) {
      throw new Error("Unsupported dataset. Use A, B, C, or D.");
    }
    const baseKey = (opts && opts.storageKey) || api.defaults.storageKey;
    const dsKey = _datasetKey(baseKey, upper);
    api.activeDataset = upper;
    api._loadedKey = dsKey;
    api.load(dsKey);

    // Refresh all attached stores/grids so values appear immediately
    api._attachedStores.forEach(function (store) {
      api.refresh(store, api.defaults);
      const grid = store.ownerGrid || null;
      if (grid && grid.getView && grid.getView().refresh) {
        grid.getView().refresh();
      }
    });
    api._attachedGrids.forEach(function (grid) {
      try { grid.getView && grid.getView().refresh && grid.getView().refresh(); } catch (e) {}
    });
  };

  api.activateA = function (opts) { api.setDataset("A", opts); };
  api.activateB = function (opts) { api.setDataset("B", opts); };
  api.activateC = function (opts) { api.setDataset("C", opts); };
  api.activateD = function (opts) { api.setDataset("D", opts); };
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

  function _loadCacheForKey(storageKey) {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { return {}; }
  }

  /** Build typed export payload for the CURRENT dataset (requires active). */
  api.buildExportPayload = function (opts) {
    if (!api.activeDataset) throw new Error("No dataset active.");
    const baseKey = (opts && opts.storageKey) || api.defaults.storageKey;
    const dsKey   = _datasetKey(baseKey, api.activeDataset);
    const data    = {};
    const src     = api.cache || {};
    Object.keys(src).forEach(k => data[k] = String(src[k] ?? ""));
    return { kind: EXPORT_KIND_SINGLE, version: EXPORT_VERSION, storageKey: dsKey, data };
  };

  /** Build a bundle containing A, B, C, D — always allowed. */
  api.buildExportBundle = function (opts) {
    const baseKey = (opts && opts.storageKey) || api.defaults.storageKey;
    const dsList  = ["A","B","C","D"];
    const datasets = {};
    dsList.forEach(ds => {
      const key   = _datasetKey(baseKey, ds);
      const cache = _loadCacheForKey(key);
      const data  = {};
      Object.keys(cache).forEach(k => data[k] = String(cache[k] ?? ""));
      datasets[ds] = { storageKey: key, data };
    });
    return { kind: EXPORT_KIND_BUNDLE, version: EXPORT_VERSION, baseKey, datasets };
  };

  /** File download for the ALL-datasets bundle — always works. */
  api.exportAllToFile = function (opts) {
    const payload = api.buildExportBundle(opts);
    const json = JSON.stringify(payload, null, 2);
    const keyPart = _safeFileNamePart(payload.baseKey || "APModShift");
    const ts = _nowTimestamp();
    const filename = `${keyPart}_Notes_ALL_${ts}.json`;
    const uri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    const a = document.createElement("a");
    a.setAttribute("href", uri);
    a.setAttribute("download", filename);
    a.click();
  };

  /** Optional: keep the per-dataset export (only when active). */
  api.exportCurrentToFile = function (opts) {
    if (!api.activeDataset) {
      _ensureExtAlertSelectShift();
      return;
    }
    const payload = api.buildExportPayload(opts);
    const json = JSON.stringify(payload, null, 2);
    const keyPart = _safeFileNamePart(payload.storageKey || "APModShift");
    const ts = _nowTimestamp();
    const filename = `${keyPart}_Notes_${ts}.json`;
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

  function _saveCacheForKey(storageKey, map, merge) {
    const incoming = map || {};
    if (merge === true) {
      const prev = _loadCacheForKey(storageKey);
      const merged = Object.assign({}, prev, incoming);
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } else {
      localStorage.setItem(storageKey, JSON.stringify(incoming));
    }
  }

  // Accept both single and bundle payloads
  function _normalizeImportedAny(parsed) {
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Unsupported file: payload must be an object.");
    }
    // Bundle path
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
        cleaned[name] = { storageKey: entry.storageKey || null, data: norm };
      });
      return { mode: "bundle", baseKey: parsed.baseKey || null, datasets: cleaned };
    }
    // Single path
    if (parsed.kind === IMPORT_KIND_SINGLE) {
      if (typeof parsed.version !== "number" || parsed.version > IMPORT_VERSION_MAX) {
        throw new Error("Unsupported file: invalid or newer 'version'.");
      }
      const map = {};
      const src = parsed.data || {};
      Object.keys(src).forEach(k => { map[String(k)] = String(src[k] ?? ""); });
      return { mode: "single", storageKey: parsed.storageKey || null, data: map };
    }
    throw new Error("Unsupported file: unknown 'kind'.");
  }

  /**
   * Universal parsed import:
   * - Always allowed.
   * - Writes all provided datasets to localStorage (no UI constraints).
   * - If a dataset is currently active, immediately applies it to the UI.
   * Options: { storageKey?: string, merge?: boolean, applyToUI?: boolean }
   */
  api.importUniversalFromParsed = function (parsed, opts) {
    const o = opts || {};
    const norm = _normalizeImportedAny(parsed);
    const baseKey = (o.storageKey || api.defaults.storageKey);

    if (norm.mode === "bundle") {
      // 1) Write ALL datasets to storage
      Object.keys(norm.datasets).forEach(ds => {
        const entry = norm.datasets[ds];
        const key = entry.storageKey || _datasetKey(baseKey, ds);
        _saveCacheForKey(key, entry.data, o.merge === true);
      });
    } else {
      // SINGLE: write to provided storageKey; if none, prefer active dataset, else fallback to A
      let targetKey = norm.storageKey;
      if (!targetKey) {
        if (api.activeDataset) targetKey = _datasetKey(baseKey, api.activeDataset);
        else                   targetKey = _datasetKey(baseKey, "A");
      }
      _saveCacheForKey(targetKey, norm.data, o.merge === true);
    }

    // 2) If there is an active dataset and UI application is desired, apply it now
    if (api.activeDataset && o.applyToUI !== false) {
      const activeKey = _datasetKey(baseKey, api.activeDataset);
      api._loadedKey = activeKey;
      api.load(activeKey);
      // Push values into records (UI write)
      api._attachedStores.forEach(function (s) { api.refresh(s, api.defaults); });
    }
  };

  /**
   * Universal file import:
   * - Always allowed.
   * - Loads all data to storage; applies active dataset to UI if present.
   * Options: { storageKey?: string, merge?: boolean, applyToUI?: boolean }
   */
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

  // Public convenience: clear all datasets (optional utility)
  api.clearAll = function (opts) {
    const baseKey = (opts && opts.storageKey) || api.defaults.storageKey;
    ["A","B","C","D"].forEach(ds => {
      try { localStorage.removeItem(_datasetKey(baseKey, ds)); } catch (e) {}
    });
    // Do not touch UI unless active dataset is cleared explicitly by caller
  };

  return api;
})();
