var APModOptions = (function () {
  
  function injectMainToolbar() {
  if (typeof EAM?.view?.common?.MainToolbar === "undefined") return;
  var TBclass = EAM.view.common.MainToolbar;

  if (!TBclass.prototype.APModOptionsOrigInitComponent) {
    TBclass.prototype.APModOptionsOrigInitComponent = TBclass.prototype.initComponent;
    TBclass.prototype.initComponent = function () {
      this.APModOptionsOrigInitComponent.apply(this, arguments);
      this.insert(this.items.length, {
        iconCls: "toolbarGear",
        menu: [
        {
          text: "APMod",
          hideOnClick: true,
          handler: function () {
            // Use a central place to store the URL (override elsewhere if you like)
            var url = "https://github.com/dev-101010/APMOD";
            try {
              var win = window.open(url, "_blank");
              if (!win) {
                // Fallback if popup blocked
                window.location.href = url;
              }
            } catch (e) {
              window.location.href = url;
            }
          }
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
