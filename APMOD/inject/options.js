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
                            text: "AutoFill active",
                            xtype: "menucheckitem",
                            checked: APModFiller.autoFillEnabled === true,
                            checkHandler: function (checkItem, checked) {
                                APModFiller.autoFillEnabled = checked;
                            }
                        }
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
