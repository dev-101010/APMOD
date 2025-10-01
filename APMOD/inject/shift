// apmod-shift.js
// Local text column for remote-loaded/remote-sorted grids (e.g., Shift Report Book Labor)
// English comments; no icons in code/comments.

var APModShift = (function () {
  // Public API object
  const api = {};

  // --- Defaults (can be overridden in attach options) -------------------------
  api.defaults = {
    storageKey  : "apmod.shift.localNotes",
    dataIndex   : "_localNote",          // local-only model field
    columnText  : "Note",
    columnWidth : 180,
    // Choose a stable business key. Adjust to your dataset if needed.
    keyFn       : function (rec) {
      return rec.get("laborid") || rec.get("id") || rec.internalId;
    }
  };

  // --- Internal helpers (kept inside the object) ------------------------------
  api._loadMap = function (storageKey) {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}") || {}; }
    catch (e) { return {}; }
  };

  api._saveMap = function (storageKey, map) {
    try { localStorage.setItem(storageKey, JSON.stringify(map || {})); }
    catch (e) {}
  };

  api._ensureModelField = function (store, dataIndex) {
    const model = store && store.getModel && store.getModel();
    if (!model) return;
    if (!model.prototype.fields.get(dataIndex)) {
      model.prototype.fields.add(new Ext.data.Field({
        name: dataIndex,
        type: "string",
        defaultValue: "",
        persist: false // never write to server
      }));
    }
  };

  api._attachStoreSync = function (store, cfg) {
    if (!store || store.__apmodShiftNoteSynced) return;
    store.__apmodShiftNoteSynced = true;

    store.on("load", function (s, records) {
      const map = api._loadMap(cfg.storageKey);
      Ext.Array.forEach(records, function (rec) {
        const k = cfg.keyFn(rec);
        if (Object.prototype.hasOwnProperty.call(map, k)) {
          rec.set(cfg.dataIndex, String(map[k] || ""));
        }
      });
    });
  };

  api._makeTextColumn = function (cfg) {
    return {
      text: cfg.columnText,
      dataIndex: cfg.dataIndex,
      width: cfg.columnWidth,
      sortable: false,        // prevent remote sorting via this column
      menuDisabled: true,     // hide header menu
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
        const rec = ctx.record;
        const k = cfg.keyFn(rec);
        const map = api._loadMap(cfg.storageKey);
        const val = String(rec.get(cfg.dataIndex) || "");
        if (val) map[k] = val; else delete map[k];
        api._saveMap(cfg.storageKey, map);
      });
    }
  };

  api._insertColumnLeft = function (grid, col) {
    if (grid.headerCt && typeof grid.headerCt.insert === "function") {
      grid.headerCt.insert(0, col);
      grid.getView().refresh();
    } else if (Array.isArray(grid.columns)) {
      // If used before render: push into columns array
      grid.columns.unshift(col);
    }
  };

  // --- Public method ----------------------------------------------------------
  /**
   * Attach a local-only editable text column at the left-most position.
   * Not affected by remote sorting; values are stored locally.
   *
   * @param {Ext.grid.Panel} grid
   * @param {Object} [options] Optional overrides:
   *   - storageKey  : string
   *   - dataIndex   : string
   *   - columnText  : string
   *   - columnWidth : number
   *   - keyFn       : function(record) -> string
   */
  api.attach = function (grid, options) {
    if (!grid || grid.__apmodShiftAttached) return;
    grid.__apmodShiftAttached = true;

    const cfg = Ext.apply({}, options || {}, api.defaults);

    const store = grid.getStore && grid.getStore();
    if (!store) return;

    // 1) Model field (local-only)
    api._ensureModelField(store, cfg.dataIndex);

    // 2) Restore values after each remote load
    api._attachStoreSync(store, cfg);

    // 3) Insert the column at index 0
    const col = api._makeTextColumn(cfg);
    api._insertColumnLeft(grid, col);

    // 4) Enable cell editing only for this column and persist on edit
    api._ensureCellEditing(grid, cfg);
  };

  return api;
})();
