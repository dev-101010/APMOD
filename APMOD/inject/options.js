var APModOptions = (function () {
  var COLUMNS = 4;
  var _patched = false; // ensure idempotent injection

  function createMenu() {
    return Ext.create("Ext.menu.Menu", {
      showSeparator: false,
      defaults: { icon: null, iconCls: null, plain: true },
      items: [
        { xtype: "menuitem", text: "Priority Settings", hideOnClick: true,
          handler: function(){ APModDataSpy.showFillerSettings(); } },
        { xtype: "menuitem", text: "Filler Manager", hideOnClick: true,
          handler: function(){ APModDataSpy.showCopyWoOptions(); } },
        { xtype: "menuitem", text: "Priority Settings", hideOnClick: true,
          handler: function(){ APModFiller.openPriorityWindow(); } },
        { xtype: "menuitem", text: "AutoFill Manager", hideOnClick: true,
          handler: function(){ APModFiller.openAutoFillWindow(); } },
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
      this.insert(this.items.length, {
        text: "Menu",
        icon: null, iconCls: null, // text-only
        menu: [
          { text: "Option 1", icon: null, iconCls: null, hideOnClick: true,
            handler: function(){ 
              // call your function here:
              APModFiller.openPriorityWindow(); 
            } 
          },
          { text: "Option 2", icon: null, iconCls: null, hideOnClick: true,
            handler: function(){ 
              APModFiller.openAutoFillWindow(); 
            } 
          }
        ]
      });
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
