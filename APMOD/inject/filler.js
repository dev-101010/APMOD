const APModFiller = {
    popup: null,
    store: {},
    popup2: null,
    store2: []
};

APModFiller.load = () => {
    if (typeof Ext === 'undefined' || typeof EAM === 'undefined') return;

    document.addEventListener('click', APModFiller.inputClick, false);

    APModFiller.injectMainToolbar();
    APModFiller.injectRecordView();
    APModFiller.injectListDetailView();

    const storage = JSON.parse(localStorage.getItem("APModFiller"));
    if (storage != null && typeof storage === 'object' && Array.isArray(storage.data))
        Object.assign(APModFiller.store, storage);

    const storage2 = JSON.parse(localStorage.getItem("APModCopy"));
    if (storage2 != null && typeof storage2 === 'object' && Array.isArray(storage2.history))
        Object.assign(APModFiller.store2, storage2.history);
}

APModFiller.buttonClick = (cmp,e,fields) => {

    const x = e.clientX;
    const y = e.clientY;

    if (!e.shiftKey && !e.altKey) {
        APModFiller.getRad(cmp,x,y,fields);
    }

    if (e.shiftKey && !e.ctrlKey && !e.altKey) {
        APModFiller.overRad(cmp,x,y,fields);
    }

    if (e.altKey && e.ctrlKey && !e.shiftKey) {
        APModFiller.delRad(cmp,x,y,null);
    }
}

APModFiller.inputClick = (e) => {
    const target = e.target;
    const x = e.clientX;
    const y = e.clientY;

    if (e.ctrlKey && !e.altKey && ((target.tagName == "INPUT" && target.type == "text") || target.type == "textarea")) {
        APModFiller.getRad(target, x, y, null);
    }

    if (e.shiftKey && ((target.tagName == "INPUT" && target.type == "text") || target.type == "textarea")) {
        APModFiller.overRad(target, x, y, null);
    }

    if (e.altKey && e.ctrlKey && ((target.tagName == "INPUT" && target.type == "text") || target.type == "textarea")) {
        APModFiller.delRad(target, x, y, null);
    }

    if(APModFiller.popup2) APModFiller.popup2.style.display = "none";
    if (!e.ctrlKey && e.altKey && ((target.tagName == "INPUT" && target.type == "text") || target.type == "textarea")) {
        const storage2 = JSON.parse(localStorage.getItem("APModCopy"));
        if (storage2 != null && typeof storage2 === 'object' && Array.isArray(storage2.history))
            APModFiller.store2 = storage2.history;
        APModFiller.showContextMenu(e, target);
    }

    if (!e.ctrlKey && e.altKey) {
        const targetClass = "x-grid-cell-inner";
        let parentWithClass = target.classList.contains(targetClass) ? target : target.closest("." + targetClass);

        if (parentWithClass) {
            let img = parentWithClass.querySelector("img");
            if (img) {
                APModFiller.copyImageToClipboard(img);
            } else {
                const textToCopy = parentWithClass.innerText.trim();
                if (textToCopy) {
                    navigator.clipboard.writeText(textToCopy);
                    APModFiller.store2.unshift({ type: "text", content: textToCopy, timestamp: Date.now() });
                    if (APModFiller.store2.length > APModFiller.store.settings.copyEntries) APModFiller.store2.pop();
                    localStorage.setItem("APModCopy", JSON.stringify({"history":APModFiller.store2}));
                    APModPopup.openPopup("Kopiert: " + textToCopy);
                }
            }
        }
    }
};

APModFiller.copyImageToClipboard = (img) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    canvas.toBlob(blob => {
        if (!blob) {
            APModPopup.openPopup("Fehler beim Kopieren des Bildes.");
            return;
        }

        const item = new ClipboardItem({ "image/png": blob });

        navigator.clipboard.write([item])
            .then(() => {
            APModPopup.openPopup("Bild kopiert!");
        })
            .catch(err => {
            console.error("Fehler beim Kopieren des Bildes:", err);
            APModPopup.openPopup("Fehler beim Kopieren.");
        });
    }, "image/png");
};

APModFiller.showContextMenu = (event, inputElement) => {
    if (!APModFiller.popup2) {
        APModFiller.popup2 = document.createElement("ul");
        APModFiller.popup2.id = "APModCopyMenu";
        APModFiller.popup2.style.position = "absolute";
        APModFiller.popup2.style.background = "#fff";
        APModFiller.popup2.style.border = "1px solid #ccc";
        APModFiller.popup2.style.padding = "5px";
        APModFiller.popup2.style.boxShadow = "2px 2px 10px rgba(0,0,0,0.2)";
        APModFiller.popup2.style.listStyle = "none";
        APModFiller.popup2.style.zIndex = "1000";
        APModFiller.popup2.style.maxHeight = "200px";
        APModFiller.popup2.style.overflowY = "auto";
        document.body.appendChild(APModFiller.popup2);
    }

    APModFiller.popup2.innerHTML = "";
    if(APModFiller.store2.length > 0) {
        APModFiller.store2.forEach((item, key, arr) => {
            APModFiller.addContextLine(inputElement, item, Object.is(arr.length - 1, key))
        });

        APModFiller.popup2.style.left = `${event.pageX}px`;
        APModFiller.popup2.style.top = `${event.pageY}px`;
        APModFiller.popup2.style.display = "block";
    } else {
        APModFiller.popup2.style.display = "none";
        APModPopup.openPopup("Copy history empty.");
    }
}

APModFiller.addContextLine = (ele, item, last) => {
    let timestamp = document.createElement("span");
    timestamp.style.display = "block";
    timestamp.style.fontSize = "10px";
    timestamp.style.padding = "5px";
    timestamp.style.color = "#666";
    const timeDiff = Math.floor((Date.now() - item.timestamp) / 1000);
    if (timeDiff < 3600) {
        timestamp.textContent = `${Math.floor(timeDiff / 60)} m`;
    } else if (timeDiff < 86400) {
        timestamp.textContent = `${Math.floor(timeDiff / 3600)} h`;
    } else {
        timestamp.textContent = `${Math.floor(timeDiff / 86400)} d`;
    }
    let cont = document.createElement("span");
    cont.style.padding = "5px";
    cont.textContent = item.content.length > 27 ? item.content.substring(0, 27) + "..." : item.content;

    let li = document.createElement("li");
    li.title = item.content;
    li.style.display = "flex";
    li.style.cursor = "pointer";
    if (!last) li.style.borderBottom = "1px solid #ddd";
    li.addEventListener("click", () => {
        ele.value += item.content;
        APModFiller.popup2.style.display = "none";
        APModPopup.openPopup("Value inserted.");
    });
    li.addEventListener("mouseover", () => {
        li.style.background = "#dddddd";
    });
    li.addEventListener("mouseout", () => {
        li.style.background = "transparent";
    });

    li.appendChild(timestamp);
    li.appendChild(cont);
    APModFiller.popup2.appendChild(li);
}

APModFiller.getRad = (target,x,y,apModFields) => {
    const apModData = Ext.clone(APModFiller.store.data);

    const entries = apModData.filter((instance, index) => {
        instance.title = instance.title != null && typeof instance.title === 'string' && instance.title.length > 0 ? instance.title : instance.data;
        return instance.field === target.name;
    });

    if (entries.length == 1) {
        if(apModFields != null && entries[0].data != null && typeof entries[0].data === 'string') {
            const values = entries[0].data.split('|');
            let i = 0;
            for(const field of apModFields) {
                let value = values[i];
                if(value.startsWith('#')) {
                    value = APModDataSpy.onFunction(value);
                }
                field.setValue( value != null ? value : "" );
                i++;
            }
            APModPopup.openPopup("Values inserted.");
        } else {
            let value = entries[0].data;
            if(value.startsWith('#')) {
                value = APModDataSpy.onFunction(value);
            }
            target.focus();
            target.value = value != null ? value : "";
            APModPopup.openPopup("Value inserted.");
        }
    } else if (entries.length > 1) {

        const entriesByDepthArray = [];
        for(let entry of entries)
        {
            if(entry.depth == null || entry.depth < 0 || entry.depth > 9 ) entry.depth = 0;
            if (entriesByDepthArray[entry.depth] == null) entriesByDepthArray[entry.depth] = [];
            entriesByDepthArray[entry.depth].push(entry);
        }

        new RadialMenu({
            parent: document.body,
            posX: x,
            posY: y,
            size: APModFiller.store.settings.wheelSize || 200,
            textSize: APModFiller.store.settings.fontSize || 38,
            closeOnClick: true,
            type: "get",
            allItems: entriesByDepthArray.filter(n => n),
            target: target,
            onClick: function(input,type,item) {
                if(input) {
                    if(apModFields != null && item.data != null && typeof item.data === 'string') {
                        const values = item.data.split('|');
                        let i = 0;
                        for(const field of apModFields) {
                            let value = values[i];
                            if(value.startsWith('#')) {
                                value = APModDataSpy.onFunction(value);
                            }
                            field.setValue( value != null ? value : "" );
                            i++;
                        }
                        APModPopup.openPopup("Values inserted.");
                    } else {
                        let value = item.data;
                        if(value.startsWith('#')) {
                            value = APModDataSpy.onFunction(value);
                        }
                        input.focus();
                        input.value = value != null ? value : "";
                        APModPopup.openPopup("Value inserted.");
                    }
                }
            }
        }).open();
    } else {
        APModPopup.openPopup("No entry found.");
    }
}

APModFiller.overRad = (target,x,y,apModFields) => {
    const apModData = Ext.clone(APModFiller.store.data);

    let v = "";
    if(apModFields != null) {
        for(const field of apModFields) {
            v += "|" + field.value;
        }
        v = v.length > 0 ? v.substring(1) : "";
    } else {
        v = target.value;
    }
    const value = v.replace(/[\r\n\t'"]+/g," ");
    const name = target.name;

    if( value != null && typeof value === 'string' && value.length > 0 ) {

        const entries = apModData.filter((instance, index) => {
            instance.title = instance.title != null && typeof instance.title === 'string' && instance.title.length > 0 ? instance.title : instance.data;
            instance.oId = index;
            return instance.field === name;
        });

        if (entries.length >= 1) {

            const entriesByDepthArray = [];
            for(const entry of entries) {
                if(entry.depth == null || entry.depth < 0 || entry.depth > 9 ) entry.depth = 0;
                if (entriesByDepthArray[entry.depth] == null) entriesByDepthArray[entry.depth] = [];
                entriesByDepthArray[entry.depth].push(entry);
            }
            for(let i = 0; i < entriesByDepthArray.length; i++){
                if(entriesByDepthArray[i] == null || !Array.isArray(entriesByDepthArray[i])) entriesByDepthArray[i] = [];
            }
            for(const entry of entriesByDepthArray) {
                const i = entriesByDepthArray.indexOf(entry);
                entry.push({"field": "", "data": "", "title": "TO NEW", "oId": -1, "depth": i});
            }
            const l = entriesByDepthArray.length;
            if (entriesByDepthArray[l] == null) entriesByDepthArray[l] = [];
            entriesByDepthArray[l].push({"field": "", "data": "", "title": "TO NEW", "oId": -1, "depth": l});

            new RadialMenu({
                parent: document.body,
                posX: x,
                posY: y,
                size: APModFiller.store.settings.wheelSize || 200,
                textSize: APModFiller.store.settings.fontSize || 38,
                closeOnClick: true,
                type: "over",
                allItems: entriesByDepthArray,
                target: target,
                onClick: function(input,type,item) {
                    if(item.oId === -1) {
                        APModFiller.store.data.push({
                            "field": name,
                            "data": value,
                            "title": "",
                            "depth": item.depth,
                        });
                        APModFiller.save();
                        APModPopup.openPopup("Value added.");
                    } else {
                        APModFiller.store.data[item.oId] = {
                            "field": name,
                            "data": value,
                            "title": "",
                            "depth": item.depth,
                        }
                        APModFiller.save();
                        APModPopup.openPopup("Value overridden.");
                    }
                }
            }).open();
        }

        if (entries.length < 1) {

            APModFiller.store.data.push({
                "field": name,
                "data": value,
                "title": "",
                "depth": 0,
            });
            APModFiller.save();
            APModPopup.openPopup("Value stored.");
        }
    } else { APModPopup.openPopup("Field is empty."); }
}

APModFiller.delRad = (target,x,y,apModFields) => {
    const apModData = Ext.clone(APModFiller.store.data);
    const entries = apModData.filter((instance, index) => {
        instance.oId = index;
        instance.title = instance.title != null && typeof instance.title === 'string' && instance.title.length > 0 ? instance.title : instance.data;
        return instance.field === target.name;
    });
    if (entries.length > 0 ) {

        const entriesByDepthArray = [];
        for(let entry of entries)
        {
            if(entry.depth == null || entry.depth < 0 || entry.depth > 9 ) entry.depth = 0;
            if (entriesByDepthArray[entry.depth] == null) entriesByDepthArray[entry.depth] = [];
            entriesByDepthArray[entry.depth].push(entry);
        }
        for(let i = 0; i < entriesByDepthArray.length; i++){
            if(entriesByDepthArray[i] == null || !Array.isArray(entriesByDepthArray[i])) entriesByDepthArray[i] = [];
        }

        new RadialMenu({
            parent: document.body,
            posX: x,
            posY: y,
            size: APModFiller.store.settings.wheelSize || 200,
            textSize: APModFiller.store.settings.fontSize || 38,
            closeOnClick: true,
            type: "del",
            allItems: entriesByDepthArray,
            target: target,
            onClick: function(input,type,item) {
                APModFiller.store.data.splice(item.oId, 1);
                APModFiller.save();
                APModPopup.openPopup("Entry deleted.");
            }
        }).open();
    } else APModPopup.openPopup("No entry found.");
}

APModFiller.injectMainToolbar = () => {
    if (typeof EAM?.view?.common?.MainToolbar === 'undefined') return;
    const TBclass = EAM.view.common.MainToolbar;
    if (TBclass.prototype.APModFillerOrigInitComponent == null) {
        TBclass.prototype.APModFillerOrigInitComponent = TBclass.prototype.initComponent;
        TBclass.prototype.initComponent = function() {
            this.APModFillerOrigInitComponent.apply(this, []);
            this.insert(this.items.length, APModFiller.createFillerButton());
        }
    }
}

APModFiller.injectRecordView = () => {
    if (typeof EAM.view?.common?.RecordView === 'undefined') return;
    const RVclass = EAM.view.common.RecordView;

    if (RVclass.prototype.amodFillerOrigInitPageLayout == null) {
        RVclass.prototype.amodFillerOrigInitPageLayout = RVclass.prototype.initPageLayout;
        RVclass.prototype.initPageLayout = function(c, e, b) {
            this.amodFillerOrigInitPageLayout.apply(this, [c, e, b]);
            const a = this;
            if (this.tabURL == "WSJOBS.HDR") {
                const problemcode = a.getForm().findField('problemcode');
                const failurecode = a.getForm().findField('failurecode');
                const causecode = a.getForm().findField('causecode');
                if(problemcode != null && failurecode != null && causecode != null) {
                    const parent = causecode.ownerCt;
                    if(parent?.items?.keys != null) {
                        const pos = parent.items.keys.indexOf(causecode.id) + 1;
                        parent.insert(pos,{
                            xtype: 'button',
                            name: 'apModCloseCodes',
                            text: 'Fill Close Codes',
                            margin: '0 0 0 150',
                            listeners: {
                                click: function(cmp,e) {
                                    const fields = [ problemcode, failurecode, causecode ];
                                    APModFiller.buttonClick(cmp,e,fields);
                                },
                            },
                        });
                    }
                }
                const URL = "https://eu1.eam.hxgnsmartcloud.com/web/base/logindisp?tenant=AMAZONRMEEU_PRD&FROMEMAIL=YES&SYSTEM_FUNCTION_NAME=WSJOBS&USER_FUNCTION_NAME=WSJOBS&workordernum=";
                const description = a.getForm().findField('description');
                const workorder = a.getForm().findField('workordernum');
                if(description != null && workorder != null) {
                    const parent = description.ownerCt;
                    if(parent?.items?.keys != null) {
                        const pos = parent.items.keys.indexOf(description.id) + 1;
                        parent.insert(pos,{
                            xtype: 'button',
                            name: 'apModCopyWO',
                            text: '©',
                            margin: '0 0 0 20',
                            tooltip: 'Copy APM WO link',
                            listeners: {
                                click: function(cmp,e) {
                                    const woNumber = workorder.value ?? "";
                                    navigator.clipboard.writeText(URL+woNumber);
                                    if(APModPopup)
                                        APModPopup.openPopup("WO direct link saved to Clipboard.");
                                },
                            },
                        });
                    }
                }
            }
        }
    }
}

APModFiller.injectListDetailView = () => {
    if (typeof EAM.view?.common?.ListDetailView === 'undefined') return;
    const RVclass = EAM.view.common.ListDetailView;

    if (RVclass.prototype.amodFillerOrigInitPageLayout == null) {
        RVclass.prototype.amodFillerOrigInitPageLayout = RVclass.prototype.initPageLayout;
        RVclass.prototype.initPageLayout = function(c, e, b) {
            this.amodFillerOrigInitPageLayout.apply(this, [c, e, b]);
            const a = this;
            if (this.tabURL == "WSJOBS.BOO") {
                const employee = a.getForm().findField('employee');
                const octype = a.getForm().findField('octype');
                const hrswork = a.getForm().findField('hrswork');
                const datework = a.getForm().findField('datework');
                const booactivity = a.getForm().findField('booactivity');
                if(employee != null && octype != null && hrswork != null && datework != null && booactivity != null) {
                    const parent = hrswork.ownerCt;
                    if(parent?.items?.keys != null) {
                        const pos = parent.items.keys.indexOf(hrswork.id) + 1;
                        parent.insert(pos,{
                            xtype: 'button',
                            name: 'apModFillTime',
                            text: 'Fill Time',
                            margin: '0 0 0 150',
                            listeners: {
                                click: function(cmp,e) {
                                    const fields = [hrswork, employee];
                                    if (!e.shiftKey && !e.altKey) {
                                        if(!booactivity.value) {
                                            booactivity.setValue(booactivity.store.data.last());
                                            booactivity.fireEvent('select', booactivity, booactivity.store.data.last().data.display, null, true);
                                        }
                                        if(!octype.value) {
                                            octype.setValue("N");
                                        }
                                        if(!datework.value) {
                                            datework.setValue(APModDataSpy.onFunction("#DATE"));
                                        }
                                        APModFiller.buttonClick(cmp,e,fields);
                                    } else {
                                        APModFiller.buttonClick(cmp,e,fields);
                                    }
                                },
                            },
                        });
                    }
                }
            }
            if (this.tabURL == "WSJOBS.PAR") {
                const partcode = a.getForm().findField('partcode');
                const transactionquantity = a.getForm().findField('transactionquantity');
                const activity = a.getForm().findField('activity');
                const availableqty = a.getForm().findField('availableqty');
                if(partcode != null && transactionquantity != null && activity != null && availableqty != null) {
                    const parent = availableqty.ownerCt;
                    if(parent?.items?.keys != null) {
                        const pos = parent.items.keys.indexOf(availableqty.id) + 1;
                        parent.insert(pos,{
                            xtype: 'button',
                            name: 'apModFillPart',
                            text: 'Fill Part',
                            margin: '0 0 0 150',
                            listeners: {
                                click: function(cmp,e) {
                                    const fields = [partcode, transactionquantity];
                                    if (!e.shiftKey && !e.altKey) {
                                        if(!activity.value) {
                                            activity.setValue(activity.store.data.last());
                                            activity.fireEvent('select', activity, activity.store.data.last().data.display, null, true);
                                        }
                                        APModFiller.buttonClick(cmp,e,fields);
                                    } else {
                                        APModFiller.buttonClick(cmp,e,fields);
                                    }
                                },
                            },
                        });
                    }
                }
            }
        }
    }
}

APModFiller.createFillerButton = () => {
    return Ext.create('Ext.Button', {
        text: '✎',
        tooltip: "Filler Menu",
        handler: function() {
            if (APModFiller.popup == null) {
                APModFiller.popup = APModFiller.createPopupPanel(APModFiller.store)
                if (APModFiller.popup != null) APModFiller.popup.show();
            }
        }
    });
}

APModFiller.createPopupPanel = (store) => {
    const fillerStore = Ext.create('Ext.data.Store', {
        field: ['field', 'depth', 'data', 'title'],
        data: store.data,
    });
    fillerStore.sort('field', 'ASC');

    return new Ext.create('Ext.window.Window', {
        title: 'Filler Options',
        width: 900,
        height: 600,
        minWidth: 600,
        minHeight: 300,
        modal: true,
        closable: false,
        maximizable: false,
        name: "FillerWindow",
        layout: 'fit',
        padding: '10 10 10 10',
        items: [APModFiller.fillerPanel(fillerStore)],
        dockedItems: [{
            xtype: 'toolbar',
            dock: 'top',
            ui: 'header',
            defaults: {
                margin: '0 2 0 2'
            },
            layout: {
                pack: 'end'
            },
            items: [
                {
                    xtype: 'label',
                    text: 'Copy entries:',
                },
                {
                    minWidth: 40,
                    maxWidth: 40,
                    name: "copyEntriesTextField",
                    xtype: 'textfield',
                    value: store.settings.copyEntries,
                    maskRe: /[0-9]/,
                    maxLength: 3
                },
                { xtype: 'tbspacer', width: 50 },
                {
                    xtype: 'label',
                    text: 'Wheel Size:',
                },
                {
                    minWidth: 40,
                    maxWidth: 40,
                    name: "wheelSizeTextField",
                    xtype: 'textfield',
                    value: store.settings.wheelSize,
                    maskRe: /[0-9]/,
                    maxLength: 3
                },
                {
                    xtype: 'label',
                    text: 'px',
                },
                { xtype: 'tbspacer', width: 50 },
                {
                    xtype: 'label',
                    text: 'Text Size:',
                },
                {
                    minWidth: 40,
                    maxWidth: 40,
                    name: "fontSizeTextField",
                    xtype: 'textfield',
                    value: store.settings.fontSize,
                    maskRe: /[0-9]/,
                    maxLength: 3
                },
                {
                    xtype: 'label',
                    text: '%',
                },
            ],
        },{
            xtype: 'toolbar',
            dock: 'bottom',
            ui: 'footer',
            defaults: {
                margin: '0 2 0 2'
            },
            layout: {
                pack: 'center'
            },
            items: [{
                xtype: 'tbspacer',
                minWidth: 80,
                maxWidth: 80,
            },{
                xtype: 'tbspacer',
                minWidth: 80,
                maxWidth: 80,
            },{
                xtype: 'tbspacer',
                flex: 1
            },{
                minWidth: 80,
                text: 'Save',
                xtype: 'button',
                handler: function() {
                    const wSTF= this.up('window[name="FillerWindow"]').down('textfield[name="wheelSizeTextField"]');
                    const fSTF = this.up('window[name="FillerWindow"]').down('textfield[name="fontSizeTextField"]');
                    const cpTF = this.up('window[name="FillerWindow"]').down('textfield[name="copyEntriesTextField"]');
                    APModFiller.store.settings.copyEntries = typeof cpTF.value === 'string' && cpTF.value > 0 ? parseInt(cpTF.value) : 30;
                    APModFiller.store.settings.wheelSize = typeof wSTF.value === 'string' && wSTF.value > 0 ? parseInt(wSTF.value) : 200;
                    APModFiller.store.settings.fontSize = typeof fSTF.value === 'string' && fSTF.value > 0 ? parseInt(fSTF.value) : 38;
                    APModFiller.store.data = fillerStore.dsGetData();
                    APModFiller.save();
                    APModFiller.popup.destroy();
                    APModFiller.popup = null;
                },
            },
                    {
                        minWidth: 80,
                        text: 'Close',
                        xtype: 'button',
                        handler: function() {
                            APModFiller.popup.destroy();
                            APModFiller.popup = null;
                        },
                    }, {
                        xtype: 'tbspacer',
                        flex: 1
                    }, {
                        minWidth: 80,
                        text: 'Export',
                        xtype: 'button',
                        handler: function() {
                            APModFiller.exportToJsonFile(fillerStore.dsGetData());
                        },
                    }, {
                        minWidth: 80,
                        text: 'Import',
                        xtype: 'button',
                        handler: function() {
                            APModFiller.importJsonToNew(fillerStore.dsGetData());
                        },
                    }
                   ],
        }],
    });
}

APModFiller.exportToJsonFile = (data) => {
    if (typeof data !== 'object') return;

    let dataStr = JSON.stringify(data);
    let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    let exportFileDefaultName = 'filler.json';

    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

APModFiller.importJsonToNew = (apModData) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = readerEvent => {
            const content = readerEvent.target.result;
            let data = null;
            try {
                const test = JSON.parse(content);
                if (test != null && typeof test === 'object' && Array.isArray(test) && test[0] != null && test[0]["field"] != null && test[0]["data"] != null )
                    data = test;
                else
                    throw new Error();
            } catch (ignore) {
                alert('Ungültige Datei.');
            }

            if (data != null && apModData != null && Array.isArray(data) && Array.isArray(apModData) ) {
                for(let entry of data) {
                    if(apModData.find(e => e.field == entry.field && e.data == entry.data) != null) continue;
                    apModData.push(entry);
                }
                const out = Ext.clone(APModFiller.store);
                out.data = apModData;
                APModFiller.popup.disable();
                new Ext.util.DelayedTask(function() {
                    APModFiller.popup.destroy();
                    APModFiller.popup = null;
                    APModFiller.popup = APModFiller.createPopupPanel(out);
                    if (APModFiller.popup != null) APModFiller.popup.show();
                }).delay(200);
            }
        }
    }
    input.click();
}

APModFiller.fillerPanel = (fillerStore) => {
    return Ext.create('Ext.Panel', {
        name: "FillerPanel",
        layout: {
            type: 'hbox',
            layout: 'fit'
        },
        items: [{
            xtype: 'panel',
            flex: 1,
            maxWidth: 40,
            layout: 'vbox',
            defaults: {
                margin: '2 0 2 0'
            },
            items: [{
                width: 28,
                height: 28,
                text: '↑',
                disabled: true,
                xtype: 'button',
                handler: function() {
                    const grid = this.up('panel[name="FillerPanel"]').down('gridpanel[name="fillerGridPanel"]')
                    const selectedRecord = grid.getSelectionModel().getSelection()[0];
                    const row = grid.store.indexOf(selectedRecord);
                    if (row > 0) {
                        grid.store.removeAt(row);
                        grid.store.insert(row - 1, selectedRecord);
                    }
                },
            }, {
                width: 28,
                height: 28,
                text: '↓',
                disabled: true,
                xtype: 'button',
                handler: function() {
                    const grid = this.up('panel[name="FillerPanel"]').down('gridpanel[name="fillerGridPanel"]')
                    const selectedRecord = grid.getSelectionModel().getSelection()[0];
                    const row = grid.store.indexOf(selectedRecord);
                    if (row < grid.store.data.length - 1) {
                        grid.store.removeAt(row);
                        grid.store.insert(row + 1, selectedRecord);
                    }
                },
            }, {
                width: 28,
                height: 28,
                text: '🗑',
                xtype: 'button',
                handler: function() {
                    const grid = this.up('panel[name="FillerPanel"]').down('gridpanel[name="fillerGridPanel"]')
                    const selectedRecord = grid.getSelectionModel().getSelection()[0];
                    const row = grid.store.indexOf(selectedRecord);
                    if (row >= 0) {
                        Ext.Msg.show({
                            title:'Delete row?',
                            msg : 'Are you sure you want to delete row '+(row+1)+'?',
                            buttons: Ext.Msg.YESNO,
                            fn : function(button){
                                if (button === 'yes'){
                                    grid.store.removeAt(row);
                                }
                            }
                        });
                    }
                },
            }, {
                width: 28,
                height: 28,
                text: '+',
                xtype: 'button',
                handler: function() {
                    const grid = this.up('panel[name="FillerPanel"]').down('gridpanel[name="fillerGridPanel"]')
                    const selectedRecord = grid.getSelectionModel().getSelection()[0];
                    grid.store.add( {
                        field: selectedRecord ? selectedRecord.data.field : "",
                        data: "",
                        title: '',
                    });
                },
            }]
        }, {
            xtype: 'gridpanel',
            name: "fillerGridPanel",
            selType: 'rowmodel',
            plugins: [
                Ext.create('Ext.grid.plugin.CellEditing', {
                    clicksToEdit: 1
                })
            ],
            flex: 1,
            height: '100%',
            store: fillerStore,
            columns: [{
                xtype: 'rownumberer',
                sortable: false,
                menuDisabled: true,
                locked: true,
                align: 'center',
                tdCls: 'x-grid-cell-row-numberer-ov'
            },
                      {
                          header: 'Field',
                          dataIndex: 'field',
                          sortable: false,
                          menuDisabled: true,
                          flex: 1,
                          editor: {
                              xtype: 'textfield',
                          },
                          align: 'center',
                      },
                      {
                          header: 'Data',
                          dataIndex: 'data',
                          sortable: false,
                          menuDisabled: true,
                          flex: 1,
                          editor: {
                              xtype: 'textfield',
                          },
                          align: 'center',
                      },
                      {
                          header: 'Depth 0-9',
                          dataIndex: 'depth',
                          maxWidth: 80,
                          sortable: false,
                          menuDisabled: true,
                          flex: 1,
                          editor: {
                              xtype: 'textfield',
                              maskRe: /[0-9]/,
                              maxLength: 1,
                          },
                          align: 'center',
                      },
                      {
                          header: 'Alias',
                          dataIndex: 'title',
                          sortable: false,
                          menuDisabled: true,
                          flex: 1,
                          editor: {
                              xtype: 'textfield',
                          },
                          align: 'center',
                      }
                     ],
        }]
    });
}

APModFiller.store.data = [{
    "field": "employee",
    "data": "#LOGIN",
    "title": "Me",
    "depth":0,
},
                          {
                              "field": "hrswork",
                              "data": "1",
                              "title": "",
                              "depth":0,
                          },
                          {
                              "field": "udfchar13",
                              "data": "EXDN",
                              "title": "",
                              "depth":0,
                          },
                          {
                              "field": "udfchar24",
                              "data": "no",
                              "title": "",
                              "depth":0,
                          },
                          {
                              "field":"datework",
                              "data":"#DATE",
                              "title":"Today",
                              "depth":0
                          }
                         ];

APModFiller.store.settings = {"wheelSize":200,"fontSize":38,"copyEntries":30};

APModFiller.save = () => {
    localStorage.setItem("APModFiller", JSON.stringify(APModFiller.store));
}

//window.addEventListener("load", APModFiller.load);
