var APModOptions = (function () {

    const options = {
        priorityEnabled : true,
        autoFillEnabled : true,
    };

    // Helper: get ISO week number using LOCAL time
    function getISOWeekLocal(d) {
        // Work with a copy at local midnight to avoid time parts
        const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const dayNum = date.getDay() || 7; // Sunday -> 7
        // Move to Thursday of the current week (ISO anchor)
        date.setDate(date.getDate() + 4 - dayNum);
        const yearStart = new Date(date.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    } 

    function injectMainToolbar() {
        if (typeof EAM?.view?.common?.MainToolbar === "undefined") return;
        var TBclass = EAM.view.common.MainToolbar;

        const kw = getISOWeekLocal(new Date());
        this.insert(this.items.length - 1, {
            xtype: "tbtext",
            text: `KW ${kw}`
        });

        if (!TBclass.prototype.APModOptionsOrigInitComponent) {
            TBclass.prototype.APModOptionsOrigInitComponent = TBclass.prototype.initComponent;
            TBclass.prototype.initComponent = function () {
                this.APModOptionsOrigInitComponent.apply(this, arguments);

                this.insert(this.items.length, {
                    iconCls: "toolbarGear",
                    menu: [
                        {
                            text: `APMod ${GM_info?.script?.version || ''}`,
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
