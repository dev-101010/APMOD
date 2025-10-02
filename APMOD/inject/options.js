var APModOptions = (function () {
  var COLUMNS = 3;
  var _patched = false; // ensure idempotent injection

  function createMenu() {
    return Ext.create("Ext.menu.Menu", {
      layout: { type: "table", columns: COLUMNS },
      showSeparator: false,
      defaults: { icon: null, iconCls: null, plain: true },
      items: [
        // Section: Filler
        { xtype: "menuitem", text: "Filler", disabled: true, icon: null, iconCls: null },
        { xtype: "menuitem", text: "Priority Settings", hideOnClick: true,
          handler: function(){ APModFiller.openPriorityWindow(); } },
        { xtype: "menuitem", text: "AutoFill Manager", hideOnClick: true,
          handler: function(){ APModFiller.openAutoFillWindow(); } },

        // Add more fixed items or sections here if needed
        // { xtype: "menuseparator" },
        // { xtype: "menuitem", text: "Mappings", disabled: true },
        // { xtype: "menuitem", text: "Open Mappings", hideOnClick: true,
        //   handler: function(){ APModMappings.openMappingsWindow(); } },
      ]
    });
  }

  function createDropdown() {
    return Ext.create("Ext.button.Button", {
      text: "APMod",
      icon: null,
      iconCls: null,
      arrowAlign: "right",
      menuAlign: "tr-br?",
      menu: createMenu()
    });
  }

  function injectMainToolbar() {
    if (typeof EAM?.view?.common?.MainToolbar === "undefined") return;
    var TBclass = EAM.view.common.MainToolbar;
    if (_patched) return; // already patched
    if (!TBclass.prototype.APModOptionsOrigInitComponent) {
      TBclass.prototype.APModOptionsOrigInitComponent = TBclass.prototype.initComponent;
      TBclass.prototype.initComponent = function () {
        this.APModOptionsOrigInitComponent.apply(this, arguments);
        this.insert(this.items.length, createDropdown());
      };
      _patched = true;
    }
  }

  // Public API
  function load() {
    injectMainToolbar();
  }

  return {
    load: load
  };
})();
