var APModOptions = (function () {
  
  function injectMainToolbar() {
  if (typeof EAM?.view?.common?.MainToolbar === "undefined") return;
  var TBclass = EAM.view.common.MainToolbar;

  if (!TBclass.prototype.APModOptionsOrigInitComponent) {
    TBclass.prototype.APModOptionsOrigInitComponent = TBclass.prototype.initComponent;
    TBclass.prototype.initComponent = function () {
      this.APModOptionsOrigInitComponent.apply(this, arguments);
      this.insert(this.items.length, {
        text: "⚙️",
        icon: null, iconCls: null, // text-only
        menu: [
          // --- Header + separator ---
        { xtype: "menuitem", text: "APMod", disabled: true, // acts as header
          style: "font-weight:bold;cursor:default;" },
        "-",
          { text: "Filler Manager", icon: null, iconCls: null, hideOnClick: true,
            handler: function(){ 
              APModFiller.showFillerSettings(); 
            } 
          },
          { text: "CopyWo Options", icon: null, iconCls: null, hideOnClick: true,
            handler: function(){ 
              APModDataSpy.showCopyWoOptions();
            } 
          },
          { text: "Priority Settings", icon: null, iconCls: null, hideOnClick: true,
            handler: function(){ 
              APModFiller.openPriorityWindow(); 
            } 
          },
          { text: "AutoFill Manager", icon: null, iconCls: null, hideOnClick: true,
            handler: function(){ 
              APModFiller.openAutoFillWindow(); 
            } 
          },
        ]
      });
    };
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
