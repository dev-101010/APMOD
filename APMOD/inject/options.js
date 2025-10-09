var APModOptions = (function () {

    const options = {
        priorityEnabled : true,
        autoFillEnabled : true,
    };
    

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
                                var url = "https://github.com/dev-101010/APMOD";
                                try {
                                    var win = window.open(url, "_blank");
                                    if (!win) {
                                        window.location.href = url;
                                    }
                                } catch (e) {
                                    window.location.href = url;
                                }
                            }
                        },
                        "-",
                        {
                            text: "Filler Manager",
                            hideOnClick: true,
                            handler: function () {
                                APModFiller.showFillerSettings();
                            }
                        },
                        {
                            text: "CopyWo Options",
                            hideOnClick: true,
                            handler: function () {
                                APModDataSpy.showCopyWoOptions();
                            }
                        },
                        {
                            text: "Priority Settings",
                            hideOnClick: true,
                            handler: function () {
                                APModFiller.openPriorityWindow();
                            }
                        },
                        {
                            text: "AutoFill Manager",
                            hideOnClick: true,
                            handler: function () {
                                APModFiller.openAutoFillWindow();
                            }
                        },
                        "-",
                        {
                            text: "AutoFill Active",
                            xtype: "menucheckitem",
                            checked: options.autoFillEnabled === true,
                            checkHandler: function (checkItem, checked) {
                                options.autoFillEnabled = checked;
                                saveLocal();
                            }
                        },
                        {
                            text: "Priority Active",
                            xtype: "menucheckitem",
                            checked: options.priorityEnabled === true,
                            checkHandler: function (checkItem, checked) {
                                options.priorityEnabled = checked;
                                saveLocal();
                            }
                        }
                    ]
                });
            };
        }
    }

    // Public API
    function load() {
        loadLocal();
        injectMainToolbar();
    }

    function saveLocal() {
        localStorage.setItem("APModOptions", JSON.stringify(options));
    }

    function loadLocal() {
        // Safe parse: avoid JSON.parse(null) and malformed data issues
        var raw = localStorage.getItem("APModOptions");
        if (!raw) return;
        try {
            var opt = JSON.parse(raw);
            if (opt && typeof opt === "object") {
                Object.assign(options, opt);
            }
        } catch (e) {
            // clear or ignore invalid data
            localStorage.removeItem("APModOptions");
        }
    }

    return {
        load: load,
        options: options
    };
})();
