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
      return rec.get("laborid") || rec.get("id") || rec.internalId;
    }
  };

  // --- In-memory cache --------------------------------------------------------
  api.cache = {};   // { recordKey: "note string" }
  api._loadedKey = null;

  /** Load once from localStorage into in-memory cache. */
  api.load = function (storageKey) {
    const key = storageKey || api.defaults.storageKey;
    api._loadedKey = key;
    try {
      const raw = localStorage.getItem(key);
      api.cache = raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) {
      api.cache = {};
    }
  };

  /** Persist in-memory cache back to localStorage. */
  api.save = function (storageKey) {
    const key = storageKey || api._loadedKey || api.defaults.storageKey;
    try {
      localStorage.setItem(key, JSON.stringify(api.cache || {}));
    } catch (e) { /* ignore */ }
  };

  /** Apply current cache to a store's records. */
  api.refresh = function (store, cfg) {
    if (!store) return;
    const c = cfg || api.defaults;
    const map = api.cache || {};
    store.each(function(rec){
      const k = c.keyFn(rec);
      if (Object.prototype.hasOwnProperty.call(map, k)) {
        rec.set(c.dataIndex, String(map[k] || ""));
      }
    });
  };

  // --- Internal helpers -------------------------------------------------------
  api._ensureModelField = function (store, dataIndex) {
  const model = store && store.getModel && store.getModel();
  if (!model || !model.fields) return;
  const fields = model.fields;
  // Modern ExtJS: fields is a MixedCollection with .get()
  if (typeof fields.get === 'function') {
    if (!fields.get(dataIndex)) {
      fields.add(new Ext.data.Field({
        name: dataIndex,
        type: "string",
        defaultValue: "",
        persist: false
      }));
    }
  }
  // Fallback: if fields is an array (older/extremely custom)
  else if (Array.isArray(fields)) {
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

    // On every remote load, restore from in-memory cache (no storage read here)
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
                return e && e.column && e.column.dataIndex === cfg.dataIndex;
            });
        }
        if (!plugin.__apmodShiftEditBound) {
            plugin.__apmodShiftEditBound = true;
            plugin.on("edit", function (ed, ctx) {
                if (!ctx || !ctx.record) return;
                if (!ctx.column || ctx.column.dataIndex !== cfg.dataIndex) return;
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
                api.save(cfg.storageKey);
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

  // --- Public method ----------------------------------------------------------
  /**
   * Attach a local-only editable text column (left-most) and wire syncing.
   * Requires api.load(...) to have run once earlier, or falls back to defaults.
   *
   * @param {Ext.grid.Panel} grid
   * @param {Object} [options] { storageKey, dataIndex, columnText, columnWidth, keyFn }
   */
  api.attach = function (grid, options) {
    if (!grid || grid.__apmodShiftAttached) return;
    grid.__apmodShiftAttached = true;

    const cfg = Ext.apply({}, options || {}, api.defaults);

    // If user did not call load() yet, do it once with current key.
    if (!api._loadedKey) api.load(cfg.storageKey);

    const store = grid.getStore && grid.getStore();
    if (!store) return;

    api._ensureModelField(store, cfg.dataIndex);
    api._attachStoreSync(store, cfg);

    const col = api._makeTextColumn(cfg);
    api._insertColumnLeft(grid, col);

    api._ensureCellEditing(grid, cfg);

    // Initial apply of cache to already-loaded data (if any)
    api.refresh(store, cfg);
  };

  // ---- Export / Import helpers ------------------------------------------------
  const EXPORT_KIND = "APModShift.Notes";
  const EXPORT_VERSION = 1;

  function _nowTimestamp() {
    // yyyy-mm-dd_HH-MM-SS
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm   = pad(d.getMonth() + 1);
    const dd   = pad(d.getDate());
    const HH   = pad(d.getHours());
    const MM   = pad(d.getMinutes());
    const SS   = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd}_${HH}-${MM}-${SS}`;
  }

  function _safeFileNamePart(s) {
    return String(s || "")
      .replace(/[^a-z0-9_\-\.]+/gi, "_")
      .replace(/^_+|_+$/g, "");
  }

  /** Build typed export payload from current in-memory cache. */
  api.buildExportPayload = function (opts) {
    const key = (opts && opts.storageKey) || api._loadedKey || api.defaults.storageKey;
    const data = {};
    // Copy only string values
    const src = api.cache || {};
    Object.keys(src).forEach(k => { data[k] = String(src[k] == null ? "" : src[k]); });
    return { kind: EXPORT_KIND, version: EXPORT_VERSION, storageKey: key, data };
  };

  /** Trigger a file download with a timestamped filename. */
  api.exportToFile = function (opts) {
    const payload = api.buildExportPayload(opts);
    const json = JSON.stringify(payload, null, 2);
    const keyPart = _safeFileNamePart(payload.storageKey || "APModShift");
    const ts = _nowTimestamp();
    const filename = `apmod-shift-notes_${keyPart}_${ts}.json`;
    const uri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    const a = document.createElement("a");
    a.setAttribute("href", uri);
    a.setAttribute("download", filename);
    a.click();
  };

  /** Normalize various accepted import formats to a plain { key: note } map. */
  function _normalizeImportedData(parsed) {
    // Preferred typed object
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      if (parsed.kind === EXPORT_KIND && Array.isArray(parsed.data) === false && typeof parsed.data === "object") {
        return { map: parsed.data, storageKey: parsed.storageKey || null };
      }
      // Legacy plain object { key: "note", ... }
      const isPlain = Object.keys(parsed).every(k => typeof parsed[k] === "string");
      if (isPlain) return { map: parsed, storageKey: null };
    }
    // Legacy array of pairs or array of objects
    if (Array.isArray(parsed)) {
      const out = {};
      parsed.forEach(it => {
        if (Array.isArray(it) && it.length >= 2) {
          out[String(it[0])] = String(it[1] == null ? "" : it[1]);
        } else if (it && typeof it === "object" && "key" in it) {
          out[String(it.key)] = String(it.value == null ? "" : it.value);
        }
      });
      return { map: out, storageKey: null };
    }
    throw new Error("Unrecognized file format");
  }

  /**
   * Import from a parsed JSON value (already JSON.parse'd).
   * Merges or replaces cache (default: replace = true). Saves and optionally refreshes a store.
   */
  api.importFromParsed = function (parsed, opts) {
    const o = opts || {};
    const normalized = _normalizeImportedData(parsed);
    const targetKey = o.storageKey || normalized.storageKey || api._loadedKey || api.defaults.storageKey;

    // Ensure cache belongs to the active key
    if (!api._loadedKey || api._loadedKey !== targetKey) {
      api.load(targetKey);
    }

    const incoming = normalized.map || {};
    if (o.merge === true) {
      // merge: override incoming keys, keep others
      api.cache = Object.assign({}, api.cache || {}, incoming);
    } else {
      // replace
      api.cache = incoming;
    }
    api.save(targetKey);

    // Optionally refresh a store to push values into records
    const store = o.store;
    if (store) {
      api.refresh(store, Ext.apply({}, { storageKey: targetKey }, api.defaults));
    }
  };

  /**
   * Open a file picker, parse, validate, import, save, and refresh.
   * Options: { storageKey?, store?, merge? }
   */
  api.importFromFile = function (opts) {
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
          api.importFromParsed(parsed, opts || {});
          if (window.APModPopup) APModPopup.openPopup("Notes imported (saved).");
        } catch (err) {
          Ext && Ext.Msg && Ext.Msg.alert ? Ext.Msg.alert("Import failed", "Invalid JSON or unsupported file.") : alert("Import failed.");
        }
      };
      reader.readAsText(file, "UTF-8");
    };
    input.click();
  };
  
  return api;
})();
