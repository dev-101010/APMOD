const APModFiller = {
    popup: null,
    store: {},
    popup2: null,
    store2: []
};

APModFiller.load = () => {
    if (typeof Ext === 'undefined' || typeof EAM === 'undefined') return;

    document.addEventListener('click', APModFiller.inputClick, false);

    Ext.data.Store.prototype.fiGetData = function(){
	  const arr = [];
	  this.data.items.forEach(({data: recordData})=>{
	    const { field, data, depth, title } = recordData; // pick only used props
	    arr.push({ field, data, depth, title });
	  });
	  return arr;
	};

    APModFiller.injectMainToolbar();
    APModFiller.injectRecordView();
    APModFiller.injectListDetailView();
    APModFiller.injectComment();

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
    const value = v;
    const name = target.name;

    if( value != null && typeof value === 'string' && value.length > 0 ) {

        const entries = apModData.filter((instance, index) => {
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
                    // Helper: show alias dia...
