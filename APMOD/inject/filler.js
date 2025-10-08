const APModFiller = {
    popup: null,
    store: {},
    popup2: null,
    store2: [],
	autoFillEnabled: true
};

APModFiller.load = () => {
    if (typeof Ext === 'undefined' || typeof EAM === 'undefined') return;

    document.addEventListener('click', APModFiller.inputClick, false);

    Ext.data.Store.prototype.fiGetData = function () {
        const arr = [];
        this.data.items.forEach(({data: recordData}) => {
            const {field, data, depth, title} = recordData; // pick only used props
            arr.push({field, data, depth, title});
        });
        return arr;
    };

    //APModFiller.injectMainToolbar();
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

APModFiller.buttonClick = (cmp, e, fields) => {

    const x = e.clientX;
    const y = e.clientY;

    if (!e.shiftKey && !e.altKey) {
        APModFiller.getRad(cmp, x, y, fields);
    }

    if (e.shiftKey && !e.ctrlKey && !e.altKey) {
        APModFiller.overRad(cmp, x, y, fields);
    }

    if (e.altKey && e.ctrlKey && !e.shiftKey) {
        APModFiller.delRad(cmp, x, y, null);
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

    if (APModFiller.popup2) APModFiller.popup2.style.display = "none";
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
                    APModFiller.store2.unshift({type: "text", content: textToCopy, timestamp: Date.now()});
                    if (APModFiller.store2.length > APModFiller.store.settings.copyEntries) APModFiller.store2.pop();
                    localStorage.setItem("APModCopy", JSON.stringify({"history": APModFiller.store2}));
                    if(APModPopup) APModPopup.openPopup("Kopiert: " + textToCopy);
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

        const item = new ClipboardItem({"image/png": blob});

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
    if (APModFiller.store2.length > 0) {
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

APModFiller.getRad = (target, x, y, apModFields) => {
    const apModData = Ext.clone(APModFiller.store.data);

    const entries = apModData.filter((instance, index) => {
        return instance.field === target.name;
    });

    if (entries.length == 1) {
        if (apModFields != null && entries[0].data != null && typeof entries[0].data === 'string') {
            const values = entries[0].data.split('|');
            let i = 0;
            for (const field of apModFields) {
                let value = values[i];
                if (value.startsWith('#')) {
                    value = APModDataSpy.onFunction(value);
                }
                field.setValue(value != null ? value : "");
                i++;
            }
            APModPopup.openPopup("Values inserted.");
        } else {
            let value = entries[0].data;
            if (value.startsWith('#')) {
                value = APModDataSpy.onFunction(value);
            }
            target.focus();
            target.value = value != null ? value : "";
            APModPopup.openPopup("Value inserted.");
        }
    } else if (entries.length > 1) {

        const entriesByDepthArray = [];
        for (let entry of entries) {
            if (entry.depth == null || entry.depth < 0 || entry.depth > 9) entry.depth = 0;
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
            onClick: function (input, type, item) {
                if (input) {
                    if (apModFields != null && item.data != null && typeof item.data === 'string') {
                        const values = item.data.split('|');
                        let i = 0;
                        for (const field of apModFields) {
                            let value = values[i];
                            if (value.startsWith('#')) {
                                value = APModDataSpy.onFunction(value);
                            }
                            field.setValue(value != null ? value : "");
                            i++;
                        }
                        APModPopup.openPopup("Values inserted.");
                    } else {
                        let value = item.data;
                        if (value.startsWith('#')) {
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

APModFiller.overRad = (target, x, y, apModFields) => {
    const apModData = Ext.clone(APModFiller.store.data);

    let v = "";
    if (apModFields != null) {
        for (const field of apModFields) {
            v += "|" + field.value;
        }
        v = v.length > 0 ? v.substring(1) : "";
    } else {
        v = target.value;
    }
    const value = v;
    const name = target.name;

    if (value != null && typeof value === 'string' && value.length > 0) {

        const entries = apModData.filter((instance, index) => {
            instance.oId = index;
            return instance.field === name;
        });

        if (entries.length >= 1) {

            const entriesByDepthArray = [];
            for (const entry of entries) {
                if (entry.depth == null || entry.depth < 0 || entry.depth > 9) entry.depth = 0;
                if (entriesByDepthArray[entry.depth] == null) entriesByDepthArray[entry.depth] = [];
                entriesByDepthArray[entry.depth].push(entry);
            }
            for (let i = 0; i < entriesByDepthArray.length; i++) {
                if (entriesByDepthArray[i] == null || !Array.isArray(entriesByDepthArray[i])) entriesByDepthArray[i] = [];
            }
            for (const entry of entriesByDepthArray) {
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
                onClick: function (input, type, item) {
                    // Helper: show alias dialog, then save
                    const askAndSave = (saveFn, defaultAlias) => {
                        Ext.Msg.prompt(
                            'Alias',
                            'Optional: set an alias for this entry',
                            function (btn, text) {
                                if (btn !== 'ok') return;
                                const title = (text && text.trim().length > 0) ? text.trim() : defaultAlias;
                                saveFn(title);
                            },
                            this,
                            false,                 // multiline false → single-line alias
                            defaultAlias           // default value in the input
                        );
                    };

                    if (item.oId === -1) {
                        // NEW entry → default alias is the preview
                        const defaultAlias = (value && value.length) ? value : "Alias";
                        askAndSave(function (title) {
                            APModFiller.store.data.push({
                                field: name,
                                data: value,
                                title: title,
                                depth: item.depth,
                            });
                            APModFiller.save();
                            APModPopup.openPopup("Value added.");
                        }, defaultAlias);
                    } else {
                        // OVERRIDE → default to existing title, fall back to preview
                        const defaultAlias = (item.title && item.title.length) ? item.title : (item.data && item.data.length) ? item.data : "Alias";
                        askAndSave(function (title) {
                            APModFiller.store.data[item.oId] = {
                                field: name,
                                data: value,
                                title: title,
                                depth: item.depth,
                            };
                            APModFiller.save();
                            APModPopup.openPopup("Value overridden.");
                        }, defaultAlias);
                    }
                }
            }).open();
        } else {
            // FIRST ENTRY
            const defaultAlias = (value && value.length) ? value : "Alias";
            Ext.Msg.prompt(
                'Alias',
                'Optional: set an alias for this entry',
                function (btn, text) {
                    if (btn !== 'ok') return;
                    const title = (text && text.trim().length > 0) ? text.trim() : defaultAlias;
                    APModFiller.store.data.push({
                        field: name,
                        data: value,
                        title: title,
                        depth: 0,
                    });
                    APModFiller.save();
                    APModPopup.openPopup("Value stored.");
                },
                this,
                false,
                defaultAlias
            );
        }
    } else {
        APModPopup.openPopup("Field is empty.");
    }
}

APModFiller.delRad = (target, x, y, apModFields) => {
    const apModData = Ext.clone(APModFiller.store.data);
    const entries = apModData.filter((instance, index) => {
        instance.oId = index;
        return instance.field === target.name;
    });
    if (entries.length > 0) {

        const entriesByDepthArray = [];
        for (let entry of entries) {
            if (entry.depth == null || entry.depth < 0 || entry.depth > 9) entry.depth = 0;
            if (entriesByDepthArray[entry.depth] == null) entriesByDepthArray[entry.depth] = [];
            entriesByDepthArray[entry.depth].push(entry);
        }
        for (let i = 0; i < entriesByDepthArray.length; i++) {
            if (entriesByDepthArray[i] == null || !Array.isArray(entriesByDepthArray[i])) entriesByDepthArray[i] = [];
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
            onClick: function (input, type, item) {
                APModFiller.store.data.splice(item.oId, 1);
                APModFiller.save();
                APModPopup.openPopup("Entry deleted.");
            }
        }).open();
    } else APModPopup.openPopup("No entry found.");
}

APModFiller.injectRecordView = () => {
  if (typeof EAM.view?.common?.RecordView === 'undefined') return;
  const RVclass = EAM.view.common.RecordView;

  // --- Patch beforeSave (only for WSJOBS.HDR). Keep original under apmodFillerOrigBeforeSave.
  if (RVclass.prototype.apmodFillerOrigBeforeSave == null) {
    RVclass.prototype.apmodFillerOrigBeforeSave = RVclass.prototype.beforeSave;

    RVclass.prototype.beforeSave = function(a) {
      // Guard: restrict to WSJOBS.HDR only
      if (this.tabURL !== "WSJOBS.HDR") {
        return RVclass.prototype.apmodFillerOrigBeforeSave.call(this, a);
      }

      const form = this.getForm();

      // Helpers for 7.7: check writability and write safely
      const isDisabled = (fld) =>
        typeof fld.isDisabled === 'function' ? fld.isDisabled() : !!fld.disabled;
      const isReadOnly = (fld) =>
        typeof fld.isReadOnly === 'function' ? fld.isReadOnly() : !!fld.readOnly;
      const isWritable = (fld) => fld && !isDisabled(fld) && !isReadOnly(fld);

      const writeIfWritable = (fld, val) => {
        if (!isWritable(fld)) return false;
        fld.setValue?.(val);
        fld.clearInvalid?.();
        const record = form.getRecord?.();
        if (record && fld.name) record.set(fld.name, val);
        return true;
      };

      // Apply type === "save" rules (same style as your original)
	if(APModFiller.autoFillEnabled) {
      const autoFillSave = (APModFiller.store.autoFill || []).filter(aF => aF.type === "save");
      for (const aFS of autoFillSave) {
        const field = form.findField ? form.findField(aFS.field) : null;
        if (!field) continue;

        if (aFS.status === "always") {
          const val = APModDataSpy.onFunction(aFS.value);
          writeIfWritable(field, val);
        } else {
          const cur = field.getValue?.();
          if (cur == null || String(cur).trim() === '') {
            const val = APModDataSpy.onFunction(aFS.value);
            writeIfWritable(field, val);
          }
        }
      }
	}

      // Optional: priority handling on save (respect disabled/readOnly)
      const combo = form.findField ? form.findField('priority') : null;
      if (combo && isWritable(combo)) {
        const data = APModFiller.store.priority?.[combo.getValue?.()];
        if (data && data.switchTo) {
          writeIfWritable(combo, data.switchTo);
        }
        if (typeof combo.updateDurationLabel === 'function') combo.updateDurationLabel();
      }

      // Pass through to original beforeSave
      return RVclass.prototype.apmodFillerOrigBeforeSave.call(this, a);
    };
  }

  // --- Patch initPageLayout. Keep original under apmodFillerOrigInitPageLayout.
  if (RVclass.prototype.apmodFillerOrigInitPageLayout == null) {
    RVclass.prototype.apmodFillerOrigInitPageLayout = RVclass.prototype.initPageLayout;

    RVclass.prototype.initPageLayout = function(c, e, b) {
      this.apmodFillerOrigInitPageLayout.apply(this, [c, e, b]);

      // Act only on WSJOBS.HDR
      if (this.tabURL !== "WSJOBS.HDR") return;

      const form = this.getForm();
      if (!form) return;

      // Patch loadRecord ONCE per form instance. We must use a classic function to keep correct "this".
      if (!form.__apmodPatchedLoadRecord && typeof form.loadRecord === 'function') {
        form.__apmodPatchedLoadRecord = true;
        // Wrap once, keep original
		const origLoadRecord = form.loadRecord;
		
		form.loadRecord = function (...args) {
		  // Let Ext populate the fields first
		  const res = origLoadRecord.apply(this, args);
		
		  const runAfterIdle = () => {
		    if (this.destroyed || this.isDestroyed?.()) return;
		
		    // Helper that safely writes only into writable fields
		    const writeIfWritable = (field, value) => {
		      // In Ext 7.7 these reflect current state after bindings/layout
		      const disabled = typeof field.isDisabled === 'function' ? field.isDisabled() : !!field.disabled;
		      const readOnly = typeof field.isReadOnly === 'function' ? field.isReadOnly() : !!field.readOnly;
		      if (disabled || readOnly) return;
		
		      field.setValue?.(value);
		      field.clearInvalid?.();
		
		      const rec = this.getRecord?.();
		      if (rec && field.name) rec.set(field.name, value);
		    };

			  if(APModFiller.autoFillEnabled) {
			    // Apply type === "load" rules
			    const autoFillLoad = (APModFiller.store.autoFill || []).filter(aF => aF.type === "load");
			    for (const aFL of autoFillLoad) {
			      const field = this.findField ? this.findField(aFL.field) : null;
			      if (!field) continue;
			
			      if (aFL.status === "always") {
			        const val = APModDataSpy.onFunction(aFL.value);
			        writeIfWritable(field, val);
			      } else {
			        const cur = field.getValue?.();
			        if (cur == null || String(cur).trim() === '') {
			          const val = APModDataSpy.onFunction(aFL.value);
			          writeIfWritable(field, val);
			        }
			      }
			    }
			  }
		
		    // Optional: priority handling (also respect disabled/readOnly)
		    const combo = this.findField?.('priority');
		    if (combo) {
		      const disabled = typeof combo.isDisabled === 'function' ? combo.isDisabled() : !!combo.disabled;
		      const readOnly = typeof combo.isReadOnly === 'function' ? combo.isReadOnly() : !!combo.readOnly;
		
		      if (!disabled && !readOnly) {
		        const data = APModFiller.store.priority?.[combo.getValue()];
		        if (data && data.switchTo) {
		          combo.setValue(data.switchTo);
		          const rec = this.getRecord?.();
		          if (rec) rec.set('priority', data.switchTo);
		          combo.clearInvalid?.();
		        }
		        typeof combo.updateDurationLabel === 'function' && combo.updateDurationLabel();
		      }
		    }
		  };
		
		  // Ext 7.7: 'idle' fires after layouts, bindings, and disable/readOnly propagation
		  Ext.GlobalEvents.on('idle', runAfterIdle, this, { single: true });
		
		  // Keep original return
		  return res;
		};
      }

      // ------------- existing buttons -------------
      const problemcode = form.findField('problemcode');
      const failurecode = form.findField('failurecode');
      const causecode   = form.findField('causecode');

      if (problemcode && failurecode && causecode) {
        const parent = causecode.ownerCt;
        if (parent?.items?.keys) {
          const pos = parent.items.keys.indexOf(causecode.id) + 1;
          parent.insert(pos, {
            xtype: 'button',
            name: 'apModCloseCodes',
            text: 'Fill Close Codes',
            margin: '0 0 0 150',
            listeners: {
              click: function(cmp, e) {
                APModFiller.buttonClick(cmp, e, [problemcode, failurecode, causecode]);
              }
            }
          });
        }
      }

      const URL = "https://eu1.eam.hxgnsmartcloud.com/web/base/logindisp?tenant=AMAZONRMEEU_PRD&FROMEMAIL=YES&SYSTEM_FUNCTION_NAME=WSJOBS&USER_FUNCTION_NAME=WSJOBS&workordernum=";
      const description = form.findField('description');
      const workorder   = form.findField('workordernum');

      if (description && workorder) {
        const parent = description.ownerCt;
        if (parent?.items?.keys) {
          const pos = parent.items.keys.indexOf(description.id) + 1;
          parent.insert(pos, {
            xtype: 'button',
            name: 'apModCopyWO',
            text: '©',
            margin: '0 0 0 20',
            tooltip: 'Copy APM WO link',
            listeners: {
              click: function() {
                const woNumber = workorder.getValue() ?? "";
                navigator.clipboard.writeText(URL + woNumber);
                if (APModPopup) APModPopup.openPopup("WO direct link saved to Clipboard.");
              }
            }
          });
        }
      }

      // ------------- combo UI -------------
      const combo = form.findField("priority");
      if (combo && combo.ownerCt && !combo.apmUiWired) {
        combo.apmUiWired = true;

        const parent = combo.ownerCt;
        const insertIndex = parent.items.indexOf
          ? parent.items.indexOf(combo) + 1
          : (parent.items.keys ? parent.items.keys.indexOf(combo.id) + 1 : null);

        const labelItemId = combo.getId() + '-apModPriorityOverdueLabel';
        let label = parent.down('#' + labelItemId);
        if (!label && insertIndex != null) {
          label = parent.insert(insertIndex, {
            xtype: 'displayfield',
            itemId: labelItemId,
            value: '',
            margin: '0 0 0 150'
          });
        }

        function updateLabel() {
          if (!label) return;
          const data = APModFiller.store.priority[combo.getValue()];
          label.setValue(data.label || "");
        }
        combo.updateDurationLabel = updateLabel;

        if (!combo.apmSetValuePatched) {
          combo.apmSetValuePatched = true;

          const origSetValue = combo.setValue;
          combo.setValue = function() {
            const res = origSetValue.apply(this, arguments);
            if (typeof this.updateDurationLabel === 'function') this.updateDurationLabel();
            return res;
          };

          if (combo.clearValue) {
            const origClearValue = combo.clearValue;
            combo.clearValue = function() {
              const res = origClearValue.apply(this, arguments);
              if (typeof this.updateDurationLabel === 'function') this.updateDurationLabel();
              return res;
            };
          }

          if (combo.reset) {
            const origReset = combo.reset;
            combo.reset = function() {
              const res = origReset.apply(this, arguments);
              if (typeof this.updateDurationLabel === 'function') this.updateDurationLabel();
              return res;
            };
          }

          if (combo.setRawValue) {
            const origSetRaw = combo.setRawValue;
            combo.setRawValue = function() {
              const res = origSetRaw.apply(this, arguments);
              if (typeof this.updateDurationLabel === 'function') this.updateDurationLabel();
              return res;
            };
          }
        }
      }
    };
  }
};

APModFiller.injectListDetailView = () => {
    if (typeof EAM.view?.common?.ListDetailView === 'undefined') return;
    const RVclass = EAM.view.common.ListDetailView;

    if (RVclass.prototype.apmodFillerOrigInitPageLayout == null) {
        RVclass.prototype.apmodFillerOrigInitPageLayout = RVclass.prototype.initPageLayout;
        RVclass.prototype.initPageLayout = function (c, e, b) {
            this.apmodFillerOrigInitPageLayout.apply(this, [c, e, b]);
            const a = this;
            if (this.tabURL == "WSJOBS.BOO") {
                const employee = a.getForm().findField('employee');
                const octype = a.getForm().findField('octype');
                const hrswork = a.getForm().findField('hrswork');
                const datework = a.getForm().findField('datework');
                const booactivity = a.getForm().findField('booactivity');
                if (employee != null && octype != null && hrswork != null && datework != null && booactivity != null) {
                    const parent = hrswork.ownerCt;
                    if (parent?.items?.keys != null) {
                        const pos = parent.items.keys.indexOf(hrswork.id) + 1;
                        parent.insert(pos, {
                            xtype: 'button',
                            name: 'apModFillTime',
                            text: 'Fill Time',
                            margin: '0 0 0 150',
                            listeners: {
                                click: function (cmp, e) {
                                    const fields = [hrswork, employee];
                                    if (!e.shiftKey && !e.altKey) {
                                        if (!booactivity.value) {
                                            booactivity.setValue(booactivity.store.data.last());
                                            booactivity.fireEvent('select', booactivity, booactivity.store.data.last().data.display, null, true);
                                        }
                                        if (!octype.value) {
                                            octype.setValue("N");
                                        }
                                        if (!datework.value) {
                                            datework.setValue(APModDataSpy.onFunction("#DATE"));
                                        }
                                        APModFiller.buttonClick(cmp, e, fields);
                                    } else {
                                        APModFiller.buttonClick(cmp, e, fields);
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
                if (partcode != null && transactionquantity != null && activity != null && availableqty != null) {
                    const parent = availableqty.ownerCt;
                    if (parent?.items?.keys != null) {
                        const pos = parent.items.keys.indexOf(availableqty.id) + 1;
                        parent.insert(pos, {
                            xtype: 'button',
                            name: 'apModFillPart',
                            text: 'Fill Part',
                            margin: '0 0 0 150',
                            listeners: {
                                click: function (cmp, e) {
                                    const fields = [partcode, transactionquantity];
                                    if (!e.shiftKey && !e.altKey) {
                                        if (!activity.value) {
                                            activity.setValue(activity.store.data.last());
                                            activity.fireEvent('select', activity, activity.store.data.last().data.display, null, true);
                                        }
                                        APModFiller.buttonClick(cmp, e, fields);
                                    } else {
                                        APModFiller.buttonClick(cmp, e, fields);
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

APModFiller.injectComment = () => {
    if (!Ext?.ClassManager) return;

    var TARGET_ITEM_ID = "commentWindow"; // <-- your unique itemId
    var Cls = Ext.ClassManager.get('Ext.window.Window');
    if (!Cls) return;

    Ext.override(Cls, {
        // run after the original initComponent
        initComponent: Ext.Function.createSequence(
            Cls.prototype.initComponent,
            function () {
                // guard: only for the exact target window
                if (this.itemId !== TARGET_ITEM_ID || this.__apmod_inited) return;
                const field = this.down("uxhtmleditor");
                this.__apmod_inited = true; // idempotency
                var fbar = this.getDockedItems && this.getDockedItems('toolbar[dock="bottom"]')[0];
                if (fbar) {
                    fbar.insert(0, {
                        text: 'Fill', name: 'apModFillComment', margin: '0 0 0 10',
                        listeners: {
                            click: function (cmp, e) {
                                if (field) {
                                    APModFiller.buttonClick(cmp, e, [field], true);
                                }
                            },
                        },
                    });
                }
            }
        )
    });
}

APModFiller.showFillerSettings = () => {
    if (APModFiller.popup == null) {
        APModFiller.popup = APModFiller.createPopupPanel(APModFiller.store)
        if (APModFiller.popup != null) APModFiller.popup.show();
    } else {
        if (APModFiller.popup != null) APModFiller.popup.show();
    }
}

/** Opens a window to edit APModFiller.store.priority (object as key->config). */
APModFiller.openPriorityWindow = function() {
  // fixed, hardcoded code list
  const fixedCodes = ["1", "2", "3", "4", "5"];

  // source object (may or may not contain entries for all codes)
  const src = APModFiller.store.priority || {};

  // build rows for all fixed codes
  const rows = fixedCodes.map(code => ({
    code,
    switchTo: (src[code] && src[code].switchTo) || "",
    label: (src[code] && src[code].label) || ""
  }));

  // grid store
  const store = new Ext.data.Store({
    fields: ["code","switchTo","label"],
    data: rows
  });

  // switchTo options: show "—" for empty but store "" as value
  const codeOptionsStore = new Ext.data.Store({
    fields: ["val","label"],
    data: [{ val: "", label: "—" }].concat(
      fixedCodes.map(v => ({ val: v, label: v }))
    )
  });

  // use CellEditing (no row update/cancel popup)
  const cellEditor = Ext.create("Ext.grid.plugin.CellEditing", { clicksToEdit: 1 });

  // helper renderer: empty value -> "—"
  function renderSwitchTo(v){
    const rec = codeOptionsStore.findRecord("val", v, 0, false, true, true);
    return rec ? rec.get("label") : (v || "—");
  }

  // the grid (no sorting, no header menus)
  const grid = Ext.create("Ext.grid.Panel", {
    border: true,
    flex: 1,
    store,
    columns: [
      { text: "Code", dataIndex: "code", flex: 1, sortable: false, menuDisabled: true },
      { 
        text: "Switch To",
        dataIndex: "switchTo",
        flex: 1,
        sortable: false,
        menuDisabled: true,
        editor: {
          xtype: "combo",
          queryMode: "local",
          store: codeOptionsStore,
          displayField: "label", // "—" for empty
          valueField: "val",     // store ""
          forceSelection: true,
          editable: false,
          allowBlank: true,
          triggerAction: "all",
          minChars: 0
        },
        renderer: renderSwitchTo
      },
      { 
        text: "Label",
        dataIndex: "label",
        flex: 2,
        sortable: false,
        menuDisabled: true,
        editor: { xtype: "textfield", allowBlank: true }
      }
    ],
    sortableColumns: false,
    enableColumnMove: false,
    enableColumnHide: false,
    selModel: "rowmodel",
    plugins: [ cellEditor ]
  });

  // bottom docked toolbar with centered Save/Close
  const bottomBar = {
    xtype: "toolbar",
    dock: "bottom",
    layout: { pack: "center" },
    items: [
      {
        text: "Save",
        handler: function(){
          // persist all fixed codes
          const out = {};
          store.each(function(r){
            const code = String(r.get("code"));
            out[code] = {
              switchTo: String(r.get("switchTo")||"").trim(), // "" when "—" shown
              label: String(r.get("label")||"").trim()
            };
          });
          APModFiller.store.priority = out;
          APModFiller.save();
          if (APModPopup) APModPopup.openPopup("Priority saved.");
        }
      },
      { xtype: "tbspacer", width: 24 },
      { text: "Close", handler: function(){ win.close(); } }
    ]
  };

  const mainPanel = Ext.create("Ext.panel.Panel", {
    layout: { type: "hbox", align: "stretch" },
    items: [ grid ],
    dockedItems: [ bottomBar ]
  });

  const win = Ext.create("Ext.window.Window", {
    title: "Priority Settings",
    modal: true,
    width: 900,
	height: 600,
	minWidth: 900,
	minHeight: 600,
	closable: false,
	maximizable: false,
    layout: "fit",
	padding: '10 10 10 10',
    items: [ mainPanel ]
  });

  win.show();
};

/** Opens a window to edit APModFiller.store.autoFill (type/status/field/value). */
// APModFiller.openAutoFillWindow: CellEditing (no row update/cancel popup), left text-icons, bottom dock with centered Save/Close and right-aligned Import/Export
APModFiller.openAutoFillWindow = function() {
  // --- typed payload metadata for import/export ---
  const AUTO_KIND = "APModFiller.AutoFill";
  const AUTO_VERSION = 1;

  // --- Friendly labels while keeping internal values ---
  const TYPE_OPTS   = [["save",  "On save"], ["load",  "On load"]];
  const STATUS_OPTS = [["always","Always"],  ["empty", "Field is empty"]];

  const TYPE_LABEL   = { save: "On save",  load: "On load" };
  const STATUS_LABEL = { always: "Always", empty: "Field is empty" };

  const typeStore = new Ext.data.ArrayStore({ fields: ["value","label"], data: TYPE_OPTS });
  const statusStore = new Ext.data.ArrayStore({ fields: ["value","label"], data: STATUS_OPTS });

  const data = (APModFiller.store.autoFill || []).map(r => ({
    type: r.type || "save",
    status: r.status || "empty",
    field: r.field || "",
    value: r.value != null ? r.value : ""
  }));

  const store = new Ext.data.Store({
    fields: ["type","status","field","value"],
    data
  });

  function doSave() {
    const arr = [];
    store.each(function(r){
      const type = r.get("type") || "save";
      const status = r.get("status") || "empty";
      const field = String(r.get("field") || "").trim();
      const value = r.get("value");
      if (!field) return;
      arr.push({ type, status, field, value });
    });
    APModFiller.store.autoFill = arr;
    APModFiller.save();
    if (APModPopup) APModPopup.openPopup("AutoFill saved.");
  }

  // Build typed export object (keeps your existing AUTO_KIND/AUTO_VERSION)
function buildExportObject() {
  const items = [];
  store.each(function(r){
    items.push({
      type:  r.get("type"),
      status:r.get("status"),
      field: r.get("field"),
      value: r.get("value")
    });
  });
  return { kind: AUTO_KIND, version: AUTO_VERSION, data: items };
}

// Export filename: APModAutofill_YYYY-MM-DD_HH-MM-SS.json
function doExport() {
  try {
    const payload = buildExportObject();
    const json = JSON.stringify(payload, null, 2);

    const ts = (() => {
      const d = new Date();
      const pad = n => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_` +
             `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
    })();

    const uri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    const a = document.createElement("a");
    a.setAttribute("href", uri);
    a.setAttribute("download", `APModAutofill_${ts}.json`);
    a.click();
    if (APModPopup) APModPopup.openPopup("Exported.");
  } catch (err) {
    if (Ext && Ext.Msg && Ext.Msg.alert) {
      Ext.Msg.alert("Export failed", err && err.message ? String(err.message) : "Unexpected error during export.");
    }
  }
}

// Strict typed import (no legacy arrays).
function doImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(String(evt.target.result || "null"));
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Unsupported file: payload must be an object.");
        }
        if (parsed.kind !== AUTO_KIND) {
          throw new Error("Unsupported file: wrong 'kind'.");
        }
        if (typeof parsed.version !== "number" || parsed.version > AUTO_VERSION) {
          throw new Error("Unsupported file: invalid or newer 'version'.");
        }
        if (!Array.isArray(parsed.data)) {
          throw new Error("Invalid payload: 'data' must be an array.");
        }

        // Normalize and load into grid store
        const arr = parsed.data.map(r => ({
          type:   (r && r.type)   || "save",
          status: (r && r.status) || "empty",
          field:  (r && r.field)  || "",
          value:  (r && r.value) != null ? r.value : ""
        }));
        store.loadData(arr);

        if (APModPopup) APModPopup.openPopup("Imported (not saved yet).");
      } catch (e) {
        Ext.Msg.alert("Import failed", e && e.message ? String(e.message) : "Invalid JSON or unsupported file.");
      }
    };
    reader.readAsText(file, "UTF-8");
  };
  input.click();
}

  // Use CellEditing to avoid row update/cancel confirmation
  const cellEditor = Ext.create("Ext.grid.plugin.CellEditing", { clicksToEdit: 1 });

  const grid = Ext.create("Ext.grid.Panel", {
    border: true,
    flex: 1,
    store,
    columns: [
      {
        text: "When to autofill?",
        dataIndex: "type",
        width: 170,
        tooltip: "Choose when the rule should apply",
        editor: {
          xtype: "combo",
          queryMode: "local",
          editable: false,
          forceSelection: true,
          triggerAction: "all",
          store: typeStore,
          valueField: "value",
          displayField: "label"
        },
        renderer: function(v){ return TYPE_LABEL[v] || v; }
      },
      {
        text: "Only autofill if",
        dataIndex: "status",
        width: 180,
        tooltip: "Condition for applying the value",
        editor: {
          xtype: "combo",
          queryMode: "local",
          editable: false,
          forceSelection: true,
          triggerAction: "all",
          store: statusStore,
          valueField: "value",
          displayField: "label"
        },
        renderer: function(v){ return STATUS_LABEL[v] || v; }
      },
      { text: "Field", dataIndex: "field", flex: 1, editor: { xtype: "textfield" } },
      { text: "Value", dataIndex: "value", flex: 1, editor: { xtype: "textfield" } }
    ],
    selModel: "rowmodel",
    plugins: [ cellEditor ],
    // Sorting is desired -> keep default sortable columns & header menus
  });

  // Left vertical text-icon buttons: compact size
  const leftControls = {
    xtype: "container",
    width: 40,
    layout: { type: "vbox" },
    defaults: {
      margin: "2 0 2 0",
    },
    items: [
      {
        xtype: 'button',
        width: 28,
		height: 28,
        text: "+",
        handler: function(){
          const rec = store.add({ type:"save", status:"empty", field:"", value:"" })[0];
          cellEditor.startEdit(rec, 0);
        }
      },
      {
        xtype: 'button',
        width: 28,
		height: 28,
        text: "🗑",
        ariaLabel: "Delete",
        handler: function(){
          const sel = grid.getSelectionModel().getSelection();
          if (sel && sel.length) store.remove(sel);
        }
      }
    ]
  };

  // Bottom docked toolbar split into thirds:
  // [ left (spacer) ] [ center (Save/Close centered) ] [ right (Import/Export right-aligned) ]
  const bottomBar = {
    xtype: "toolbar",
    dock: "bottom",
    layout: { type: "hbox", align: "middle" },
    items: [
      // Left third (spacer)
      { xtype: "container", flex: 1 },
      // Middle third (center group)
      {
        xtype: "container",
        flex: 1,
        layout: { type: "hbox", pack: "center" },
        items: [
          { xtype: "button", text: "Save", handler: doSave },
          { xtype: "tbspacer", width: 24 },
          { xtype: "button", text: "Close", handler: function(){ win.close(); } }
        ]
      },
      // Right third (Import/Export aligned to right)
      {
        xtype: "container",
        flex: 1,
        layout: { type: "hbox", pack: "end" },
        items: [
          { xtype: "button", text: "Import", handler: doImport },
          { xtype: "tbspacer", width: 8 },
          { xtype: "button", text: "Export", handler: doExport }
        ]
      }
    ]
  };

  // Main panel: left controls + grid
  const mainPanel = Ext.create("Ext.panel.Panel", {
    layout: { type: "hbox", align: "fit" },
    items: [ leftControls, grid ],
    dockedItems: [ bottomBar ]
  });

  const win = Ext.create("Ext.window.Window", {
    title: "AutoFill Manager",
    modal: true,
    width: 900,
	height: 600,
	minWidth: 900,
	minHeight: 600,
	closable: false,
	maximizable: false,
    layout: "fit",
	padding: '10 10 10 10',
    items: [ mainPanel ]
  });

  win.show();
};

APModFiller.createPopupPanel = (store) => {
    const fillerStore = Ext.create('Ext.data.Store', {
        fields: ['field', 'depth', 'data', 'title'],
        data: store.data,
    });
    fillerStore.sort('field', 'ASC');

    return new Ext.create('Ext.window.Window', {
        title: 'Filler Manager',
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
                {xtype: 'tbspacer', width: 50},
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
                {xtype: 'tbspacer', width: 50},
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
        }, {
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
            }, {
                xtype: 'tbspacer',
                minWidth: 80,
                maxWidth: 80,
            }, {
                xtype: 'tbspacer',
                flex: 1
            }, {
                minWidth: 80,
                text: 'Save',
                xtype: 'button',
                handler: function () {
                    const wSTF = this.up('window[name="FillerWindow"]').down('textfield[name="wheelSizeTextField"]');
                    const fSTF = this.up('window[name="FillerWindow"]').down('textfield[name="fontSizeTextField"]');
                    const cpTF = this.up('window[name="FillerWindow"]').down('textfield[name="copyEntriesTextField"]');
                    APModFiller.store.settings.copyEntries = typeof cpTF.value === 'string' && cpTF.value > 0 ? parseInt(cpTF.value) : 30;
                    APModFiller.store.settings.wheelSize = typeof wSTF.value === 'string' && wSTF.value > 0 ? parseInt(wSTF.value) : 200;
                    APModFiller.store.settings.fontSize = typeof fSTF.value === 'string' && fSTF.value > 0 ? parseInt(fSTF.value) : 38;
                    APModFiller.store.data = fillerStore.fiGetData();
                    APModFiller.save();
                    APModFiller.popup.destroy();
                    APModFiller.popup = null;
                },
            },
                {
                    minWidth: 80,
                    text: 'Close',
                    xtype: 'button',
                    handler: function () {
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
                    handler: function () {
                        APModFiller.exportToJsonFile(fillerStore.fiGetData());
                    },
                }, {
                    minWidth: 80,
                    text: 'Import',
                    xtype: 'button',
                    handler: function () {
                        APModFiller.importJsonToNew(fillerStore.fiGetData());
                    },
                }
            ],
        }],
    });
}

// Strict typed export with timestamped filename: APModFiller_YYYY-MM-DD_HH-MM-SS.json
APModFiller.exportToJsonFile = (data) => {
  try {
    if (!Array.isArray(data)) {
      throw new Error("Export data must be an array.");
    }

    // normalize items (defensive)
    const items = data.map((it) => {
      const o = it && typeof it === "object" ? it : {};
      return {
        field: String(o.field || ""),
        data:  typeof o.data === "string" ? o.data : String(o.data ?? ""),
        depth: (typeof o.depth === "number" && o.depth >= 0 && o.depth <= 9) ? o.depth : 0,
        title: typeof o.title === "string" ? o.title : (o.data ? String(o.data) : "")
      };
    });

    const payload = {
      kind: "APModFiller.Data",
      version: 1,
      data: items
    };

    // local timestamp helper (no globals)
    const ts = (() => {
      const d = new Date();
      const pad = n => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_` +
             `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
    })();

    const json = JSON.stringify(payload, null, 2);
    const uri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    const a = document.createElement("a");
    a.setAttribute("href", uri);
    a.setAttribute("download", `APModFiller_${ts}.json`);
    a.click();

    if (APModPopup) APModPopup.openPopup("Exported.");
  } catch (err) {
    if (Ext && Ext.Msg && Ext.Msg.alert) {
      Ext.Msg.alert("Export failed", err && err.message ? String(err.message) : "Unexpected error during export.");
    }
  }
};

// Strict typed import. Only accepts { kind:"APModFiller.Data", version<=1, data:[...] }.
// Merges unique entries (same field+data) into the provided apModData. Rebuilds the popup as before.
APModFiller.importJsonToNew = (apModData) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = readerEvent => {
      try {
        const content = String(readerEvent.target.result || "");
        const parsed = JSON.parse(content);

        // strict typed header
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Unsupported file: payload must be an object.");
        }
        if (parsed.kind !== "APModFiller.Data") {
          throw new Error("Unsupported file: wrong 'kind'.");
        }
        if (typeof parsed.version !== "number" || parsed.version > 1) {
          throw new Error("Unsupported file: invalid or newer 'version'.");
        }
        if (!Array.isArray(parsed.data)) {
          throw new Error("Invalid payload: 'data' must be an array.");
        }

        // normalize
        const incoming = parsed.data.map((it) => {
          const o = it && typeof it === "object" ? it : {};
          return {
            field: String(o.field || ""),
            data:  typeof o.data === "string" ? o.data : String(o.data ?? ""),
            depth: (typeof o.depth === "number" && o.depth >= 0 && o.depth <= 9) ? o.depth : 0,
            title: typeof o.title === "string" ? o.title : (o.data ? String(o.data) : "")
          };
        });

        if (!Array.isArray(apModData)) {
          throw new Error("Target list is not an array.");
        }

        // merge by (field+data)
        for (const entry of incoming) {
          if (apModData.find(e => e.field == entry.field && e.data == entry.data)) continue;
          apModData.push(entry);
        }

        // rebuild popup (same flow as your original)
        const out = Ext.clone(APModFiller.store);
        out.data = apModData;

        if (APModFiller.popup && APModFiller.popup.disable) {
          APModFiller.popup.disable();
        }

        new Ext.util.DelayedTask(function () {
          if (APModFiller.popup) {
            try { APModFiller.popup.destroy(); } catch (ignore) {}
            APModFiller.popup = null;
          }
          APModFiller.popup = APModFiller.createPopupPanel(out);
          if (APModFiller.popup) APModFiller.popup.show();
          if (APModPopup) APModPopup.openPopup("Imported.");
        }).delay(200);

      } catch (err) {
        if (Ext && Ext.Msg && Ext.Msg.alert) {
          Ext.Msg.alert("Import failed", err && err.message ? String(err.message) : "Invalid JSON or unsupported file.");
        } else {
          alert("Import failed");
        }
      }
    };
  };
  input.click();
};

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
                handler: function () {
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
                handler: function () {
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
                handler: function () {
                    const grid = this.up('panel[name="FillerPanel"]').down('gridpanel[name="fillerGridPanel"]')
                    const selectedRecord = grid.getSelectionModel().getSelection()[0];
                    const row = grid.store.indexOf(selectedRecord);
                    if (row >= 0) {
                        Ext.Msg.show({
                            title: 'Delete row?',
                            msg: 'Are you sure you want to delete row ' + (row + 1) + '?',
                            buttons: Ext.Msg.YESNO,
                            fn: function (button) {
                                if (button === 'yes') {
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
                handler: function () {
                    const grid = this.up('panel[name="FillerPanel"]').down('gridpanel[name="fillerGridPanel"]')
                    const selectedRecord = grid.getSelectionModel().getSelection()[0];
                    grid.store.add({
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
    "depth": 0,
},
    {
        "field": "hrswork",
        "data": "1",
        "title": "",
        "depth": 0,
    },
    {
        "field": "udfchar13",
        "data": "EXDN",
        "title": "",
        "depth": 0,
    },
    {
        "field": "udfchar24",
        "data": "no",
        "title": "",
        "depth": 0,
    },
    {
        "field": "datework",
        "data": "#DATE",
        "title": "Today",
        "depth": 0
    }
];

APModFiller.store.priority = {
    1: {switchTo: "", label: "1 day"},
    2: {switchTo: "", label: "3 days"},
    3: {switchTo: "4", label: "don't use"},
    4: {switchTo: "", label: "30 days"},
    5: {switchTo: "", label: "30 days"}
}

APModFiller.store.autoFill = [
    {type: "save", status: "empty", field: "assignedto", value: "#LOGIN"},
    {type: "save", status: "empty", field: "shift", value: ""},
    {type: "load", status: "empty", field: "condition", value: "EXNB"},
    {type: "load", status: "empty", field: "savety", value: "NO"},
]

APModFiller.store.settings = {"wheelSize": 200, "fontSize": 38, "copyEntries": 30};

APModFiller.save = () => {
    localStorage.setItem("APModFiller", JSON.stringify(APModFiller.store));
}

//window.addEventListener("load", APModFiller.load);




























