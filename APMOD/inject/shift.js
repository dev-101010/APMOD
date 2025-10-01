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

  return api;
})();
