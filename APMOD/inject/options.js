var APModOptions = (function () {

    const options = {
        priorityEnabled : true,
        autoFillEnabled : true,
    };

    // Clean ISO week (local time)
    function getISOWeekLocal(d = new Date()) {
      const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      x.setDate(x.getDate() + 4 - (x.getDay() || 7)); // to ISO-Thursday
      const y = new Date(x.getFullYear(), 0, 1);
      return Math.ceil((((x - y) / 86400000) + 1) / 7);
    }
    
    // Localized date string (browser locale) with weekday short
    function formatDateLocal(d = new Date()) {
      const locale = (Array.isArray(navigator.languages) && navigator.languages.length) ? navigator.languages : undefined;
      return new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).format(d);
    }

    function injectMainToolbar() {
        if (typeof EAM?.view?.common?.MainToolbar === "undefined") return;
        var TBclass = EAM.view.common.MainToolbar;

        const dateStr = formatDateLocal();
        const kw = getISOWeekLocal();
        this.insert(this.items.length-1, { xtype: "tbtext", text: `${dateStr} – KW ${kw}` });

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
