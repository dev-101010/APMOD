var APModOptions = (function () {
  
  function injectMainToolbar() {
  if (typeof EAM?.view?.common?.MainToolbar === "undefined") return;
  var TBclass = EAM.view.common.MainToolbar;

  if (!TBclass.prototype.APModOptionsOrigInitComponent) {
    TBclass.prototype.APModOptionsOrigInitComponent = TBclass.prototype.initComponent;
    TBclass.prototype.initComponent = function () {
      this.APModOptionsOrigInitComponent.apply(this, arguments);
      this.insert(this.items.length, {
      //iconCls: "x-btn-icon-el x-btn-icon-el-default-toolbar-small toolbarGear", // icon
        iconCls: "toolbarGear", // icon
        menu: [
          // --- Header + separator ---
        { 
          xtype: "component",
          html: "<div style='font-weight:bold;'>APMod</div'"
        },
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
