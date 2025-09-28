const APModDataSpy = {
	popup: null,
    popupWo: null,
	gridURLs: ["WSJOBS.xmlhttp","EWSUSR.LST.xmlhttp"]
};

APModDataSpy.load = () => {
	if (typeof Ext === 'undefined' || typeof EAM === 'undefined') return;

	EAM.APModDataSpy = APModDataSpy;
	APModDataSpy.login = "UNKNOWN";
	if(EAM?.AppData?._appData?.installParams?.user != null)
	{
		const mail = EAM.AppData._appData.installParams.user;
		if(mail != null && mail.includes("@"))
		{
			APModDataSpy.login = mail.split("@")[0];
		}
	}

	Ext.data.Store.prototype.dsGetData = function(){
	  const arr = [];
	  this.data.items.forEach(({data})=>{
	    if (data.name === 'No Filter') return;
	    const { name, sort, filter, field } = data; // pick only used props
	    arr.push({ name, sort, filter, field });
	  });
	  return arr;
	};

    APModDataSpy.injectMainToolbar();
	APModDataSpy.injectDataspy();
	APModDataSpy.injectReadOnlyGrid();
}

APModDataSpy.external_EUPBS1_reset = () => {
    if(typeof vColNo !== 'undefined')
        vColNo = 0;
    if(typeof vColNoCode !== 'undefined')
        vColNoCode = 0;
}

APModDataSpy.loadFilter = (grid) => {
	const gridURL = grid.gridURL;
	
	if(gridURL == null || typeof gridURL !== 'string' || gridURL.length <= 0) {
		const out = [];
		out.unshift({
			name: "No Filter",
			sort: [],
			filter: [],
			field: []
		});
		return Ext.create('Ext.data.Store', { fields: ['name', 'sort', 'filter', 'field'], data: out } );
	}

	const lStorage = JSON.parse(localStorage.getItem("APModDataSpy"));
	
	let storage = null;
	if(lStorage != null && typeof lStorage === 'object' && lStorage[gridURL] != null && typeof lStorage[gridURL] === 'object')
		storage = lStorage[gridURL];

	let def = null;
	if(APModDataSpyDefaultData != null && typeof APModDataSpyDefaultData === 'object' && APModDataSpyDefaultData[gridURL] != null && typeof APModDataSpyDefaultData[gridURL] === 'object')
		def = APModDataSpyDefaultData[gridURL];

	let out = null;

	if (storage != null && Array.isArray(storage))
		out = Ext.clone(storage);
	else if (def != null &&  Array.isArray(def))
		out = Ext.clone(def);
	else
		out = [];

	out.unshift({
		name: "No Filter",
		sort: [],
		filter: [],
		field: []
	});
	
	return Ext.create('Ext.data.Store', { fields: ['name', 'sort', 'filter', 'field'], data: out } );
}

APModDataSpy.injectDataspy = (dsStore) => {
	if (typeof EAM?.view?.common?.grids?.core?.Dataspy === 'undefined') return;
	const DSclass = EAM.view.common.grids.core.Dataspy;

	if (DSclass.prototype.apmodDataSpyOrigInitComponent == null) {
		DSclass.prototype.apmodDataSpyOrigInitComponent = DSclass.prototype.initComponent;
		DSclass.prototype.initComponent = function() {
			this.apmodDataSpyOrigInitComponent.apply(this, []);
			//console.log(this.getGrid().gridURL);
			if (APModDataSpy.gridURLs.includes(this.gridURL)) {
				const grid = this.getGrid();
				grid.apModStore = APModDataSpy.loadFilter(grid);
				const customDataSpyCombo = grid.customDataSpyCombo = APModDataSpy.getCustomDataSpy(grid);
				const customDataSpyEdit = APModDataSpy.getDataSpyEditButton(grid);
				this.insert(2, customDataSpyCombo);
				this.insert(3, customDataSpyEdit);
			}
		}
	}
}

APModDataSpy.injectReadOnlyGrid = () => {
	if (typeof EAM?.view?.common?.grids?.core?.ReadOnlyGrid === 'undefined') return;
	const ROGclass = EAM.view.common.grids.core.ReadOnlyGrid;

	const code1 = "/*----inject CustomDataSpy----*/[a,b]=EAM.APModDataSpy.injectBuildHeaderFilter(l,a,b);/*----end----*/";
	ROGclass.prototype.buildHeaderFilter = APModDataSpy.injectCodeInFunction(ROGclass.prototype.buildHeaderFilter, 1, code1, []);

	const code2 = "/*----inject CustomDataSpy----*/f=EAM.APModDataSpy.injectGetVisibleFieldsAndReorder(b,f);/*----end----*/";
	ROGclass.prototype.getVisibleFieldsAndReorder = APModDataSpy.injectCodeInFunction(ROGclass.prototype.getVisibleFieldsAndReorder, 3, code2, ['f']);
	
	ROGclass.prototype.exportToCSV = function(){APModDataSpy.exportToCSV(this)};
	
	if (ROGclass.prototype.apmodReadOnlyGridOrigInitComponent == null) {
		ROGclass.prototype.apmodReadOnlyGridOrigInitComponent = ROGclass.prototype.initComponent;
		ROGclass.prototype.initComponent = function() {
			this.apmodReadOnlyGridOrigInitComponent.apply(this, []);
			if (APModDataSpy.gridURLs.includes(this.gridURL)) {
				const list = this.getDockedItems('toolbar[dock="bottom"]');
				if(list.length > 0) {
					const botToolbar = this.getDockedItems('toolbar[dock="bottom"]')[0];
					if(botToolbar != null && botToolbar.items != null) {
						const pos = botToolbar.items.length;
						const gridToCsvButton = APModDataSpy.getGridToCsvButton(this);
						botToolbar.insert(pos,gridToCsvButton);
					}
				}
			}
		}
	}
}

APModDataSpy.injectCodeInFunction = (fn, behind, code, param) => {
	if (fn == null || behind == null || code == null) return fn;
	const strFn = fn.toString();
	if (strFn.includes(code)) return fn;
	const pos = APModDataSpy.sIndexOf(strFn, ';', behind),
		strNewFn = [strFn.slice(0, pos), code, strFn.slice(pos)].join('');
	const first = strNewFn.indexOf('{'),
		last = strNewFn.lastIndexOf('}');
	return new Function(param, strNewFn.substring(first + 1, last));
}

APModDataSpy.sIndexOf = function(strFn, find, count) {
	if (typeof find !== "string" || find.length < 1 || typeof count !== "number" || count < 1) return 0;
	let c = 1;
	for (let i = 0; i < strFn.length; i++) {
		if (strFn[i] === find && count === c++) return i + 1;
	}
	return 0;
}

APModDataSpy.injectGetVisibleFieldsAndReorder = (b, f) => {
	b.originalGridFields = Ext.clone(f);
	const dsCombo = b.customDataSpyCombo;
	if (dsCombo != null && dsCombo.getSelectedRecord() != null) {
		const rec = dsCombo.getSelectedRecord();
		if (rec.data.field != null && typeof rec.data.field === 'object' && Array.isArray(rec.data.field) && rec.data.field.length > 0) {
			for (const key in f) {
				const found = rec.data.field.find(element => element.NAME == f[key].name);
				if (found != null) {
					f[key].visible = "+";
					f[key].order = rec.data.field.indexOf(found);
					f[key].width = found.WIDTH || f[key].width;
				} else {
					f[key].visible = "-";
				}
			}
		}
	}
	return f;
}

APModDataSpy.injectBuildHeaderFilter = (l, a, b) => {
	const dsCombo = l.customDataSpyCombo;
	if (dsCombo != null && dsCombo.getSelectedRecord() != null) {
		const rec = dsCombo.getSelectedRecord();
		if (rec.data.sort != null && typeof rec.data.sort === 'object' && Array.isArray(rec.data.sort) && rec.data.sort.length > 0) {
			l.lastSort = {
				ADDON_SORT_ELEMENT_ALIAS_NAME: rec.data.sort[0].NAME,
				ADDON_SORT_ELEMENT_TYPE: rec.data.sort[0].TYPE
			}
		}
		if (rec.data.filter != null && typeof rec.data.filter === 'object' && Array.isArray(rec.data.filter) && rec.data.filter.length > 0) {
			b['MADDON_LPAREN_' + a] = true;
			b['MADDON_RPAREN_' + a] = false;
			b['MADDON_FILTER_SEQNUM_' + a] = a + '';
			b['MADDON_FILTER_OPERATOR_' + a] = 'NOT EMPTY';
			b['MADDON_FILTER_JOINER_' + a] = 'AND';
			b['MADDON_FILTER_VALUE_' + a] = '';
			b['MADDON_FILTER_ALIAS_NAME_' + a] = 'organization';
			a++;
			
			for (const filter of rec.data.filter) {
				let value = filter.VALUE.toString();
				if(value.startsWith('#')) {
					value = APModDataSpy.onFunction(value);
				}
				b['MADDON_FILTER_ALIAS_NAME_' + a] = filter.NAME;
				b['MADDON_FILTER_OPERATOR_' + a] = filter.OPERATOR;
				b['MADDON_FILTER_JOINER_' + a] = filter.JOINER;
				b['MADDON_FILTER_SEQNUM_' + a] = a + '';
				b['MADDON_FILTER_VALUE_' + a] = value;
				b['MADDON_LPAREN_' + a] = filter.LPAREN;
				b['MADDON_RPAREN_' + a] = filter.RPAREN;
				a++;
			}
			b['MADDON_FILTER_JOINER_' + (a - 1)] = 'AND';

			b['MADDON_LPAREN_' + a] = false;
			b['MADDON_RPAREN_' + a] = true;
			b['MADDON_FILTER_SEQNUM_' + a] = a + '';
			b['MADDON_FILTER_OPERATOR_' + a] = 'NOT EMPTY';
			b['MADDON_FILTER_JOINER_' + a] = 'AND';
			b['MADDON_FILTER_VALUE_' + a] = '';
			b['MADDON_FILTER_ALIAS_NAME_' + a] = 'organization';
			a++;
		}
	}
	return [a, b];
}

APModDataSpy.onFunction = (value) => {
	if(value.startsWith('#DATE')) {
		return  APModDataSpy.onDate(value);
	}
    if(value.startsWith('#HOUR')) {
		return  APModDataSpy.onHour(value);
	}
	if(value.startsWith('#LOGIN')) {
		return  APModDataSpy.login;
	}
    if(value.startsWith('#TICKETWO')) {
        return APModDataSpy.onTicketWo(value);
    }
	return value;
}

APModDataSpy.injectMainToolbar = () => {
	if (typeof EAM?.view?.common?.MainToolbar === 'undefined') return;
	const TBclass = EAM.view.common.MainToolbar;
	if (TBclass.prototype.APModDataSpyOrigInitComponent == null) {
		TBclass.prototype.APModDataSpyOrigInitComponent = TBclass.prototype.initComponent;
		TBclass.prototype.initComponent = function() {
			this.APModDataSpyOrigInitComponent.apply(this, []);
            if(typeof GM_getValue != 'undefined') {
                this.insert(this.items.length, APModDataSpy.createCopyWoButton());
            }
		}
	}
}

APModDataSpy.createCopyWoButton = () => {
	return Ext.create('Ext.Button', {
		text: '📋',
		tooltip: "CopyWo Menu",
		handler: function() {
			if (APModDataSpy.popupWo == null) {
                APModDataSpy.popupWo = APModDataSpy.createCopyWoPopupPanel()
				if (APModDataSpy.popupWo != null) APModDataSpy.popupWo.show();
			}
		}
	});
}

APModDataSpy.createCopyWoPopupPanel = () => {
    const clipEnabled = GM_getValue( "copyWoClipboardEnabled", true );
    const woEnabled = GM_getValue( "copyWoArrayEnabled", true );

	return Ext.create('Ext.window.Window', {
		title: 'CopyWO Options',
		width: 200,
		height: 200,
		minWidth: 200,
		minHeight: 200,
		modal: true,
		closable: false,
		maximizable: false,
		name: "CopyWoWindow",
		layout: {
            type: 'vbox',
            align: 'left'
        },
		padding: '10 10 10 10',
		items: [/*{
            xtype: 'checkboxfield',
            boxLabel : 'Copy WO to Clipboard',
            value: clipEnabled,
            listeners: {
                change:    function (cb, newValue, oldValue, eOpts) {
                    GM_setValue( "copyWoClipboardEnabled", newValue );
                }
            }
        },{
            xtype: 'checkboxfield',
            boxLabel : 'Copy WO To APM List',
            value: woEnabled,
            listeners: {
                change:    function (cb, newValue, oldValue, eOpts) {
                    GM_setValue( "copyWoArrayEnabled", newValue );
                }
            }
        },*/{
            xtype: 'button',
            text : 'Clear APM WO List',
            handler: function() {
                GM_setValue( "copyWoArray", "[]" );
            }
        }],
		dockedItems: [{
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
					flex: 1
				},
				{
					minWidth: 80,
					text: 'Close',
					xtype: 'button',
					handler: function() {
						APModDataSpy.popupWo.destroy();
						APModDataSpy.popupWo = null;
					},
				}, {
					xtype: 'tbspacer',
					flex: 1
				}
			],
		}],
	});
}


APModDataSpy.onTicketWo = (s) => {
	const array = s.split(' ');
    let outArray = [];

	if(typeof GM_getValue !== 'undefined') {
        const data = GM_getValue( "copyWoArray", "[]" );
        outArray = JSON.parse(data);
    }

	if (array.length > 0 && array[1]) {
        const num = parseInt(array[1],10);
        let idx = num - 1;
        idx = idx >= 0 ? idx : 0;
		return (typeof outArray[idx] === 'undefined' ? 0 : outArray[idx]);
	}

	return (typeof outArray[0] === 'undefined' ? 0 : outArray[0]);
}

APModDataSpy.onDate = (s) => {
	const array = s.split(' ');
	const today = new Date();
	
	if(array.length == 1) {
		return APModDataSpy.DateFormat(today);
	}
	
	if (array.length == 2) {
		if(array[1] == "H") {
			return APModDataSpy.DateTimeFormat(today);
		}
		if(array[1] == "D") {
			return APModDataSpy.DateFormat(today);
		}
		if(array[1] == "W") {
			const week = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7 - today.getDay());
			return APModDataSpy.DateFormat(week);
		}
		if(array[1] == "M") {
			const month = new Date(today.getFullYear(), today.getMonth() + 1, 0);
			return APModDataSpy.DateFormat(month);
		}
		if(array[1] == "Y") {
			const year = new Date(today.getFullYear() + 1, 1, 0);
			return APModDataSpy.DateFormat(year);
		}
	}
	
	if (array.length == 3 && ( array[2].startsWith('+') || array[2].startsWith('-') ) ) {
		const num = parseInt(array[2]);
		if(array[1] == "H" && typeof num === "number" && Number.isFinite(num)) {
			const hours = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours() + num, today.getMinutes(), today.getSeconds());
			return APModDataSpy.DateTimeFormat(hours);
		}
		if(array[1] == "D" && typeof num === "number" && Number.isFinite(num)) {
			const days = new Date(today.getFullYear(), today.getMonth(), today.getDate() + num);
			return APModDataSpy.DateFormat(days);
		}
		if(array[1] == "W" && typeof num === "number" && Number.isFinite(num)) {
			const weeks = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7 + (7 * num) - today.getDay());
			return APModDataSpy.DateFormat(weeks);
		}
		if(array[1] == "M" && typeof num === "number" && Number.isFinite(num)) {
			const months = new Date(today.getFullYear(), today.getMonth() + 1 + num, 0);
			return APModDataSpy.DateFormat(months);
		}
		if(array[1] == "Y" && typeof num === "number" && Number.isFinite(num)) {
			const years = new Date(today.getFullYear() + 1 + num, 0, 0);
			return APModDataSpy.DateFormat(years);
		}
	}
	
	return APModDataSpy.DateFormat(new Date(0,0,1));
}

APModDataSpy.onHour = (s) => {
	const array = s.split(' ');
	const today = new Date();

	if(array.length == 1) {
		return APModDataSpy.DateTimeFormat(today);
	}

	if (array.length == 2) {
        const hours = Number.parseInt(array[1]);
		if(typeof hours === "number" && Number.isFinite(hours)) {
            today.setHours(today.getHours() + hours);
			return APModDataSpy.DateTimeFormat(today);
		}
	}

	return APModDataSpy.DateTimeFormat(new Date(0,0,1));
}

APModDataSpy.DateFormat = (date) => {
	return Ext.Date.format(date, 'd-M-Y');
}

APModDataSpy.DateTimeFormat = (date) => {
	return Ext.Date.format(date, 'd-M-Y H:i:s');
}

APModDataSpy.getCustomDataSpy = (grid) => {
	return Ext.create('Ext.form.ComboBox', {
		store: grid.apModStore,
		displayField: 'name',
		valueField: 'name',
		fieldLabel: 'SubDataSpy',
		sort: 'sort', //evtl entfernen
		field: 'field',//evtl entfernen
		filter: 'filter',//evtl entfernen
		grid: grid,
		editable: false,
		hideLabel: true,
		value: (grid.apModStore.getAt(0) && grid.apModStore.getAt(0).get('name')) || 'No Filter',
		listeners: {
			select: (combo, records, eOpts) => {
				APModDataSpy.external_EUPBS1_reset();
				combo.grid.refreshGridFields(combo.grid.originalGridFields);
				combo.grid.runDataspy(null);
			}
		}
	});
}

APModDataSpy.getDataSpyEditButton = (grid) => {
	return Ext.create('Ext.Button', {
		text: "Edit",
		tooltip: "Edit Dataspy",
		handler: function() {
			if (APModDataSpy.popup == null) {
				APModDataSpy.popup = APModDataSpy.createPopupPanel(grid,null)
				if (APModDataSpy.popup != null) APModDataSpy.popup.show();
			}
		}
	});
}

APModDataSpy.getGridToCsvButton = (grid) => {
	return Ext.create('Ext.Button', {
		text: "⇩",
		tooltip: "Download CSV",
		handler: function() {
			grid.exportToCSV();
		}
	});
}

APModDataSpy.createPopupPanel = (grid,data) => {

	let newData = data;
	let selRec = null;

	const dsCombo = grid.customDataSpyCombo;
	if (dsCombo != null && dsCombo.getSelectedRecord() != null) {
		selRec = dsCombo.getSelectedRecord();
	} else {
		console.error("Selected Record not found!");
		return;
	}

	let newRec = true;
	if (typeof selRec.data.name === 'string' && selRec.data.name.length > 0 && selRec.data.name != "No Filter" && newData == null)
		newRec = false;

	if (newRec && newData == null)
		newData = APModDataSpy.defaultFilter;

	const filterStore = Ext.create('Ext.data.Store', {
		fields: ['NAME', 'OPERATOR', 'JOINER', 'VALUE', 'LPAREN', 'RPAREN'],
		data: newRec ? newData.filter : selRec.data.filter
	});

	const sortStore = Ext.create('Ext.data.Store', {
		fields: ['NAME', 'TYPE'],
		data: newRec ? newData.sort : selRec.data.sort
	});

	const fieldStore = Ext.create('Ext.data.Store', {
		fields: ['NAME', 'WIDTH'],
		data: newRec ? newData.field : selRec.data.field
	});

	const gridFields = Ext.clone(grid.originalGridFields);
	const filterAliasStore = Ext.create('Ext.data.Store', {
		fields: ['name', 'label'],
		data: gridFields.sort((a, b) => a.label.localeCompare(b.label))
	});
	
	const filterValueStore = Ext.create('Ext.data.Store', {
		fields: ['typ', 'value'],
		data: APModDataSpy.filterValues
	});

	const posList = [];
	const max = newRec ? selRec.store.data.length + 1 : selRec.store.data.length;
	for (let i = 1; i < max; i++) {
		posList.push({
			value: i,
			label: (i + 1).toString()
		});
	}

	const posStore = Ext.create('Ext.data.Store', {
		fields: ['value', 'label'],
		data: posList
	});

	const pos = newRec ? selRec.store.data.length : selRec.store.indexOf(selRec);

	let dsChangeName = newRec ? APModDataSpy.getNewName(grid,newData.name || "New Filter") : selRec.data.name;

	return Ext.create('Ext.window.Window', {
		title: 'Dataspy Edit',
		width: 900,
		height: 600,
		minWidth: 900,
		minHeight: 600,
		modal: true,
		closable: false,
		maximizable: false,
		layout: 'fit',
		padding: '10 10 10 10',
		items: [{
			xtype: 'tabpanel',
			activeTab: 0,
			style: {
				'border': '1px solid LightGray'
			},
			layout: 'fit',
			defaults: {
				autoHeight: true,
				bodyStyle: 'padding:10px'
			},
			items: [{
				title: 'Filter',
				layout: 'fit',
				tabConfig: {
					flex: 1,
					style: {
						'text-align': 'center'
					},
				},
				items: [APModDataSpy.filterPanel(filterStore, filterAliasStore, filterValueStore)],
			}, {
				title: 'Sort',
				layout: 'fit',
				tabConfig: {
					flex: 1,
					style: {
						'text-align': 'center'
					},
				},
				items: [APModDataSpy.sortPanel(sortStore, filterAliasStore)],
			}, {
				title: 'Fields',
				layout: 'fit',
				tabConfig: {
					flex: 1,
					style: {
						'text-align': 'center'
					},
				},
				items: [APModDataSpy.fieldPanel(fieldStore, filterAliasStore)],
			}]
		}],
		dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				ui: 'header',
				defaults: {
					margin: '0 2 0 2'
				},
				padding: '0 10 0 10',
				items: [{
					xtype: 'label',
					name: 'DataSpyName',
					text: dsChangeName,
					cls: 'DataSpyEditNameFont'
				}, {
					xtype: 'button',
					name: 'DataSpyNameEdit',
					text: '✎',
					handler: function() {
						Ext.Msg.prompt("Change Filter Name", "Enter new Filter Name:", function(btnText, sInput) {
							if (btnText === 'ok') {
								dsChangeName = APModDataSpy.getNewName(grid,sInput);
								const label = this.up('toolbar').down('label[name="DataSpyName"]');
								label.setText(dsChangeName);
							}
						}, this, false, APModDataSpy.popup.down('label[name="DataSpyName"]').text);
					}
				}, {
					xtype: 'tbspacer',
					flex: 1
				}, {
					xtype: 'label',
					name: 'posLabel',
					text: "Pos:",
				}, {
					xtype: 'combobox',
					name: 'PositionComboBox',
					displayField: 'label',
					valueField: 'value',
					maxWidth: 60,
					editable: false,
					store: posStore,
					value: pos
				}, {
					text: 'Options',                      
					menu: {
						xtype: 'menu',                          
						items: [
							{
								text: 'Save Backup'
							}, {
								text: 'Load Backup'
							}
						]                          
					}
				}
				]
			},
			{
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
					minWidth: 80,
					text: 'New',
					xtype: 'button',
					handler: function() {
						APModDataSpy.popup.disable();
						new Ext.util.DelayedTask(function() {
							APModDataSpy.popup.destroy();
							APModDataSpy.popup = null;
							APModDataSpy.popup = APModDataSpy.createPopupPanel(grid,APModDataSpy.defaultFilter);
							APModDataSpy.popup.show();
						}).delay(200);
					},
				}, {
					minWidth: 80,
					text: 'Copy',
					xtype: 'button',
					disabled: newRec,
					handler: function() {
						const newEnty = {
							name: dsChangeName + " (copy)",
							filter: filterStore.dsGetData(),
							sort: sortStore.dsGetData(),
							field: fieldStore.dsGetData()
						};
						APModDataSpy.popup.disable();
						new Ext.util.DelayedTask(function() {
							APModDataSpy.popup.destroy();
							APModDataSpy.popup = null;
							APModDataSpy.popup = APModDataSpy.createPopupPanel(grid,newEnty);
							APModDataSpy.popup.show();
						}).delay(200);;
					},
				}, {
					minWidth: 80,
					text: 'Delete',
					xtype: 'button',
					disabled: newRec,
					handler: function() {
						if (!newRec) {
							Ext.Msg.show({
								 title:'Delete filter?',
								 msg : 'Are you sure you want to delete this filter?',
								 buttons: Ext.Msg.YESNO,
								 fn : function(button){
									if (button === 'yes'){
										dsCombo.store.remove(selRec);
										APModDataSpy.popup.disable();
										APModDataSpy.saveFilterToLocalStorage(grid,dsCombo.store.dsGetData());
										new Ext.util.DelayedTask(function() {
											APModDataSpy.popup.destroy();
											APModDataSpy.popup = null;
											dsCombo.select("No Filter");
											const record = dsCombo.getStore().findRecord('name', "No Filter");
											dsCombo.fireEvent('select', dsCombo, [record]);
										}).delay(200);
									}
								 }
							});
						}
					},
				}, {
					xtype: 'tbspacer',
					flex: 1
				}, {
					minWidth: 80,
					text: 'Save',
					xtype: 'button',
					handler: function() {
						const posCombo = APModDataSpy.popup.down('combobox[name="PositionComboBox"]');
						const newPos = posCombo.getSelectedRecord().data.value;
						const newEntry = {
							name: dsChangeName,
							filter: filterStore.dsGetData(),
							sort: sortStore.dsGetData(),
							field: fieldStore.dsGetData()
						};

						const arr = [];
						for (const entry of newEntry.filter) {
							if (entry.LPAREN) arr.push("(");
							if (entry.RPAREN) arr.push(")");
						}
						if (!APModDataSpy.bracketTest(arr)) {
							Ext.Msg.alert('Error', 'Filter braces wrong.');
							return;
						}

						if (newEntry.filter.length > 0) {
							const entry = newEntry.filter[newEntry.filter.length - 1]
							entry["JOINER"] = "AND";
						}

						if (!newRec) {
							dsCombo.store.remove(selRec);
						}
						dsCombo.store.insert(newPos, newEntry);

						APModDataSpy.popup.disable();
						APModDataSpy.saveFilterToLocalStorage(grid,dsCombo.store.dsGetData());
						new Ext.util.DelayedTask(function() {
							APModDataSpy.popup.destroy();
							APModDataSpy.popup = null;
							dsCombo.select(dsChangeName);
							const record = dsCombo.getStore().findRecord('name', dsChangeName);
							dsCombo.fireEvent('select', dsCombo, [record]);
						}).delay(200);
					},
				}, {
					minWidth: 80,
					text: 'Close',
					xtype: 'button',
					handler: function() {
						APModDataSpy.popup.destroy();
						APModDataSpy.popup = null;
					},
				}, {
					xtype: 'tbspacer',
					flex: 1
				}, {
					minWidth: 80,
					text: 'Export',
					xtype: 'button',
					handler: function() {
						const newEntry = {
							name: dsChangeName,
							filter: filterStore.dsGetData(),
							sort: sortStore.dsGetData(),
							field: fieldStore.dsGetData()
						};

						const arr = [];
						for (const entry of newEntry.filter) {
							if (entry.LPAREN) arr.push("(");
							if (entry.RPAREN) arr.push(")");
						}
						if (!APModDataSpy.bracketTest(arr)) {
							Ext.Msg.alert('Error', 'Filter braces wrong.');
							return;
						}

						if (newEntry.filter.length > 0) {
							const entry = newEntry.filter[newEntry.filter.length - 1]
							entry["JOINER"] = "AND";
						}

						APModDataSpy.exportToJsonFile(newEntry);
					},
				}, {
					minWidth: 80,
					text: 'Import',
					xtype: 'button',
					handler: function() {
						APModDataSpy.importJsonToNew(grid);
					},
				},	{
					minWidth: 80,
					text: 'Web Filter',
					xtype: 'button',
					handler: function() {
						APModDataSpy.importWebJsonToNew(grid);
					},
				}]
			}
		]
	});
}

APModDataSpy.filterPanel = (filterStore, filterAliasStore, filterValueStore) => {
	return Ext.create('Ext.Panel', {
		name: "FilterPanel",
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
				xtype: 'button',
				handler: function() {
					const grid = this.up('panel[name="FilterPanel"]').down('gridpanel[name="filterGridPanel"]')
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
				xtype: 'button',
				handler: function() {
					const grid = this.up('panel[name="FilterPanel"]').down('gridpanel[name="filterGridPanel"]')
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
					const grid = this.up('panel[name="FilterPanel"]').down('gridpanel[name="filterGridPanel"]')
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
					const grid = this.up('panel[name="FilterPanel"]').down('gridpanel[name="filterGridPanel"]')
					const selectedRecord = grid.getSelectionModel().getSelection()[0];
					const row = grid.store.indexOf(selectedRecord);
					const target = row >= 0 ? row : grid.store.data.length;
					grid.store.insert(target, {
						LPAREN: false,
						NAME: 'workordernum',
						OPERATOR: 'CONTAINS',
						VALUE: 100000000,
						JOINER: 'AND',
						RPAREN: false
					});
				},
			}]
		}, {
			xtype: 'gridpanel',
			name: "filterGridPanel",
			selType: 'rowmodel',
			plugins: [
				Ext.create('Ext.grid.plugin.CellEditing', {
					clicksToEdit: 1
				})
			],
			flex: 1,
			height: '100%',
			store: filterStore,
			columns: [
				{
					xtype: 'rownumberer',
					name: "FilterRowNumber",
					sortable: false,
					menuDisabled: true,
					locked: true,
					align: 'center',
					tdCls: 'x-grid-cell-row-numberer-ov'
				},
				{
					xtype: 'checkcolumn',
					header: 'Left Brace',
					dataIndex: 'LPAREN',
					sortable: false,
					menuDisabled: true,
					maxWidth: 90,
					minWidth: 90,
					flex: 1,
					align: 'center'
				},
				{
					header: 'Field Name',
					dataIndex: 'NAME',
					sortable: false,
					menuDisabled: true,
					flex: 1,
					editor: {
						xtype: 'combobox',
						displayField: 'label',
						valueField: 'name',
						store: filterAliasStore,
						editable: true,
						forceSelection: true,
						anyMatch: true,
						queryMode: 'local',
					},
					align: 'center'
				},
				{
					header: 'Operator',
					dataIndex: 'OPERATOR',
					sortable: false,
					menuDisabled: true,
					maxWidth: 120,
					minWidth: 120,
					flex: 1,
					editor: {
						xtype: 'combobox',
						store: ['CONTAINS', 'NOTCONTAINS', 'IS EMPTY', 'NOT EMPTY', 'BEGINS', 'ENDS', '<', '>', '<=', '>=', '=', '!='],
						editable: true,
						forceSelection: true,
						anyMatch: true,
						queryMode: 'local',
					},
					align: 'center'
				},
				{
					header: 'Value',
					dataIndex: 'VALUE',
					sortable: false,
					menuDisabled: true,
					flex: 1,
					renderer: function(value, metadata, record) {
						value = value?value:"";
						APModDataSpy.tooltipRenderer(value, metadata, record);
						return value;
					},
					align: 'center',
					editor: {
						xtype: 'combobox',
						editable: true,
						forceSelection: false,
						store: filterValueStore,
						displayField: 'value',
						valueField: 'value',
						listeners:{
							select: function(comp,record,index) {
								if(comp.getValue() == "&nbsp;") comp.setValue("");
							},
							expand:function(combo){
								if(combo.up().context?.record?.data?.NAME != null) {
									const name = combo.up().context.record.data.NAME;
									combo.store.clearFilter();
									combo.store.filterBy(function(rec){
										return rec.data.typ == name || rec.data.typ == "*";
									});
								}
							}
						}
					}
				},
				{
					header: 'Joiner',
					dataIndex: 'JOINER',
					sortable: false,
					menuDisabled: true,
					flex: 1,
					maxWidth: 90,
					minWidth: 90,
					editor: {
						xtype: 'combobox',
						store: ['AND', 'OR'],
						editable: true,
						forceSelection: true,
						anyMatch: true,
						queryMode: 'local',
					},
					align: 'center'
				},
				{
					xtype: 'checkcolumn',
					header: 'Right Brace',
					dataIndex: 'RPAREN',
					sortable: false,
					menuDisabled: true,
					flex: 1,
					maxWidth: 90,
					minWidth: 90,
					align: 'center'
				}
			],
		}]
	});
}

APModDataSpy.tooltipRenderer = (value, metaData) => {
	let v = value.toString();
	let text = value.toString();
	if(v.startsWith('#')) {
		text = APModDataSpy.onFunction(v);
	}
	metaData.tdAttr = 'data-qtip="' + text + '"';
}

APModDataSpy.sortPanel = (sortStore, filterAliasStore) => {
	return Ext.create('Ext.Panel', {
		name: "SortPanel",
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
					const grid = this.up('panel[name="SortPanel"]').down('gridpanel[name="sortGridPanel"]')
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
					const grid = this.up('panel[name="SortPanel"]').down('gridpanel[name="sortGridPanel"]')
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
				disabled: true,
				xtype: 'button',
				handler: function() {
					const grid = this.up('panel[name="SortPanel"]').down('gridpanel[name="sortGridPanel"]')
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
				disabled: true,
				xtype: 'button',
				handler: function() {
					const grid = this.up('panel[name="SortPanel"]').down('gridpanel[name="sortGridPanel"]')
					const selectedRecord = grid.getSelectionModel().getSelection()[0];
					const row = grid.store.indexOf(selectedRecord);
					const target = row >= 0 ? row : grid.store.data.length;
					grid.store.insert(target, {
						NAME: 'schedstartdate',
						TYPE: 'ASC'
					});
				},
			}]
		}, {
			xtype: 'gridpanel',
			name: "sortGridPanel",
			selType: 'rowmodel',
			plugins: [
				Ext.create('Ext.grid.plugin.CellEditing', {
					clicksToEdit: 1
				})
			],
			layout: 'fit',
			flex: 1,
			height: '100%',
			store: sortStore,
			columns: [{
					xtype: 'rownumberer',
					sortable: false,
					menuDisabled: true,
					locked: true,
					align: 'center',
					tdCls: 'x-grid-cell-row-numberer-ov'
				},
				{
					header: 'Field Name',
					dataIndex: 'NAME',
					sortable: false,
					menuDisabled: true,
					flex: 1,
					editor: {
						xtype: 'combobox',
						displayField: 'label',
						valueField: 'name',
						store: filterAliasStore,
						editable: true,
						forceSelection: true,
						anyMatch: true,
						queryMode: 'local',
					},
					align: 'center'
				},
				{
					header: 'Type',
					dataIndex: 'TYPE',
					sortable: false,
					menuDisabled: true,
					flex: 1,
					editor: {
						xtype: 'combobox',
						store: ['ASC', 'DESC'],
						editable: true,
						forceSelection: true,
						anyMatch: true,
						queryMode: 'local',
					},
					align: 'center'
				}
			],
		}]
	});
}

APModDataSpy.fieldPanel = (fieldStore, filterAliasStore) => {
	return Ext.create('Ext.Panel', {
		name: "FieldPanel",
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
				xtype: 'button',
				handler: function() {
					const grid = this.up('panel[name="FieldPanel"]').down('gridpanel[name="fieldGridPanel"]')
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
				xtype: 'button',
				handler: function() {
					const grid = this.up('panel[name="FieldPanel"]').down('gridpanel[name="fieldGridPanel"]')
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
					const grid = this.up('panel[name="FieldPanel"]').down('gridpanel[name="fieldGridPanel"]')
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
					const grid = this.up('panel[name="FieldPanel"]').down('gridpanel[name="fieldGridPanel"]')
					const selectedRecord = grid.getSelectionModel().getSelection()[0];
					const row = grid.store.indexOf(selectedRecord);
					const target = row >= 0 ? row : grid.store.data.length;
					grid.store.insert(target, {
						NAME: 'workordernum',
						WIDTH: 300
					});
				},
			}]
		}, {
			xtype: 'gridpanel',
			name: "fieldGridPanel",
			selType: 'rowmodel',
			plugins: [
				Ext.create('Ext.grid.plugin.CellEditing', {
					clicksToEdit: 1
				})
			],
			layout: 'fit',
			flex: 1,
			height: '100%',
			store: fieldStore,
			columns: [{
					xtype: 'rownumberer',
					sortable: false,
					menuDisabled: true,
					locked: true,
					align: 'center',
					tdCls: 'x-grid-cell-row-numberer-ov'
				},
				{

					header: 'Field Name',
					dataIndex: 'NAME',
					sortable: false,
					menuDisabled: true,
					flex: 1,
					editor: {
						xtype: 'combobox',
						displayField: 'label',
						valueField: 'name',
						store: filterAliasStore,
						editable: true,
						forceSelection: true,
						anyMatch: true,
						queryMode: 'local',
					},
					align: 'center'
				},
				{
					header: 'Width',
					dataIndex: 'WIDTH',
					sortable: false,
					menuDisabled: true,
					flex: 1,
					editor: {
						xtype: 'textfield',
						maskRe: /[0-9]/,
						maxLength: 3
					},
					align: 'center'
				}
			],
		}]
	});
}

APModDataSpy.getNewName = (grid,name) => {
	let n = name;
	if (n == null || typeof n !== 'string') n = "New Filter";
	n = n.trim();
	if (n.length < 1 || n == "No Filter") n = "New Filter";
	if (grid.apModStore.dsGetData().filter(f => f.name == n).length > 0)
		return APModDataSpy.getNewName(grid,n + " (new)");
	else
		return n;
}

APModDataSpy.exportToJsonFile = (inp) => {
	if (typeof inp !== 'object') return;

	let dataStr = JSON.stringify(inp);
	let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

	let exportFileDefaultName = inp.name + '.json';

	let linkElement = document.createElement('a');
	linkElement.setAttribute('href', dataUri);
	linkElement.setAttribute('download', exportFileDefaultName);
	linkElement.click();
}

APModDataSpy.importJsonToNew = (grid) => {
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
				if (test != null && typeof test === 'object' && typeof test.field === 'object' && typeof test.filter === 'object' && typeof test.sort === 'object')
					data = test;
				else
					throw new Error();
			} catch (ignore) {
				alert('Ungültige Datei.');
			}

			if (data != null) {
				APModDataSpy.popup.disable();
				new Ext.util.DelayedTask(function() {
					APModDataSpy.popup.destroy();
					APModDataSpy.popup = null;
					APModDataSpy.popup = APModDataSpy.createPopupPanel(grid,data);
					APModDataSpy.popup.show();
				}).delay(200);
			}
		}
	}
	input.click();
}

APModDataSpy.importWebJsonToNew = (grid) => {
	window.open("https://github.com/dev-101010/APMOD-Filter", '_blank').focus();
	//https://api.github.com/repos/dev-101010/APMOD-Filter/contents
}

APModDataSpy.defaultFilter = {
	filter: [{
		LPAREN: false,
		NAME: 'workordernum',
		OPERATOR: 'CONTAINS',
		VALUE: 100000000,
		JOINER: 'AND',
		RPAREN: false
	}],
	sort: [{
		NAME: 'schedstartdate',
		TYPE: 'ASC'
	}],
	field: [{
			"NAME": "workordernum",
			"WIDTH": "100"
		}, {
			"NAME": "workorderstatus_display",
			"WIDTH": "100"
		},
		{
			"NAME": "equipment",
			"WIDTH": "200"
		}, {
			"NAME": "equipmentdesc",
			"WIDTH": "400"
		},
		{
			"NAME": "shift",
			"WIDTH": "100"
		}, {
			"NAME": "schedstartdate",
			"WIDTH": "100"
		},
		{
			"NAME": "assignedto",
			"WIDTH": "100"
		}, {
			"NAME": "description",
			"WIDTH": "600"
		}
	],
};

APModDataSpy.saveFilterToLocalStorage = (grid,filter) => {
	const gridURL = grid.gridURL;
	if(gridURL == null || typeof gridURL !== 'string' || gridURL.length <= 0) return;
	
	let lStorage = JSON.parse(localStorage.getItem("APModDataSpy"));
	if(lStorage == null || typeof lStorage !== 'object' || Array.isArray(lStorage)) {
		lStorage = {};
	}
	lStorage[gridURL] = filter;
	
	localStorage.setItem("APModDataSpy", JSON.stringify(lStorage));
}

APModDataSpy.bracketTest = (entries) => {
	const bracketPairs = {'[': ']','{': '}','(': ')'},
		closingBrackets = new Set(Object.values(bracketPairs)),
		open = [];

	for (const entry of entries) {
		if (closingBrackets.has(entry)) {
			if (entry === open[open.length - 1]) open.pop();
			else return false;
		}
		if (entry in bracketPairs) open.push(bracketPairs[entry]);
	}
	return open.length === 0;
}

APModDataSpy.exportToCSV = function(grid){
  if(!grid || !grid.columnManager) return;
  const cols = grid.columnManager.columns.filter(c => c.dataIndex && c.isVisible && c.isVisible());
  const rows = grid.getStore().getRange(); // respects filters/sort
  if(!cols.length || !rows.length) return;

  function esc(v){
    const s = (v == null ? '' : String(v));
    return '"' + s.replace(/"/g,'""') + '"';
  }

  let out = '';
  // header
  out += cols.map(c=>esc(c.text)).join(';') + '\r\n';
  // data
  rows.forEach(rec=>{
    out += cols.map(c=>esc(rec.get(c.dataIndex))).join(';') + '\r\n';
  });

  const blob = new Blob([out], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'grid.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

APModDataSpy.filterValues = [
{"typ":"*","value":"&nbsp;"},
{"typ":"workorderstatus","value":"R"},
{"typ":"workorderstatus","value":"IP"},
{"typ":"workorderstatus","value":"C"},
{"typ":"workorderstatus","value":"CANC"},
{"typ":"workordertype","value":"PM"},
{"typ":"workordertype","value":"SC"},
{"typ":"workordertype","value":"FPM"},
{"typ":"workordertype","value":"PR"},
{"typ":"workordertype","value":"BRKD"},
{"typ":"workordertype","value":"CM"},
{"typ":"equipment","value":"AR.ZONE.2"},
{"typ":"equipment","value":"AR.ZONE.3"},
{"typ":"equipment","value":"BLDG"},
{"typ":"equipment","value":"CBM"},
{"typ":"equipmentdesc","value":"pakivaa02"},
{"typ":"equipmentdesc","value":"pakivaa03"},
{"typ":"shift","value":"DS41"},
{"typ":"shift","value":"DS42"},
{"typ":"shift","value":"DS43"},
{"typ":"shift","value":"DS4A"},
{"typ":"shift","value":"DS4B"},
{"typ":"shift","value":"DS4C"},
{"typ":"schedstartdate","value":"#DATE"},
{"typ":"schedstartdate","value":"#DATE H +1"},
{"typ":"schedstartdate","value":"#DATE W"},
{"typ":"schedstartdate","value":"#DATE D +7"},
{"typ":"schedstartdate","value":"#DATE W +1"},
{"typ":"schedstartdate","value":"#HOUR +1"},
{"typ":"schedenddate","value":"#DATE"},
{"typ":"schedenddate","value":"#DATE H +1"},
{"typ":"schedenddate","value":"#DATE W"},
{"typ":"schedenddate","value":"#DATE D +7"},
{"typ":"schedenddate","value":"#DATE W +1"},
{"typ":"schedenddate","value":"#HOUR +1"},
{"typ":"datereported","value":"#DATE"},
{"typ":"datereported","value":"#DATE H +1"},
{"typ":"datereported","value":"#DATE W"},
{"typ":"datereported","value":"#DATE D +7"},
{"typ":"datereported","value":"#DATE W +1"},
{"typ":"datereported","value":"#HOUR +1"},
{"typ":"assignedto","value":"#LOGIN"},
{"typ":"workordernum","value":"#TICKETWO 1"},
{"typ":"workordernum","value":"#TICKETWO 2"},
{"typ":"workordernum","value":"#TICKETWO 3"},
{"typ":"workordernum","value":"#TICKETWO 4"},
{"typ":"workordernum","value":"#TICKETWO 5"},
{"typ":"workordernum","value":"#TICKETWO 6"},
{"typ":"workordernum","value":"#TICKETWO 7"},
{"typ":"workordernum","value":"#TICKETWO 8"},
{"typ":"workordernum","value":"#TICKETWO 9"},
{"typ":"workordernum","value":"#TICKETWO 10"}
];

//window.addEventListener("load", APModDataSpy.load);








