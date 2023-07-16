const APModFiller = {
	popup: null,
	store: {},
};

APModFiller.load = () => {
	if (typeof Ext === 'undefined' || typeof EAM === 'undefined') return;

	document.addEventListener('click', APModFiller.inputClick, false);

	APModFiller.injectMainToolbar();
	APModFiller.injectRecordView();

	const storage = JSON.parse(localStorage.getItem("APModFiller"));
	if (storage != null && typeof storage === 'object' && Array.isArray(storage.data))
		APModFiller.store = storage;
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

	if (e.ctrlKey && !e.altKey && target.tagName == "INPUT" && target.type == "text") {
		APModFiller.getRad(target,x,y,null);
	}

	if (e.shiftKey && target.tagName == "INPUT" && target.type == "text") {
		APModFiller.overRad(target,x,y,null);
	}
	
	if (e.altKey && e.ctrlKey && target.tagName == "INPUT" && target.type == "text") {
		APModFiller.delRad(target,x,y,null);
	}
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
				field.inputEl.dom.value = values[i] != null ? values[i] : "";
				i++;
			}
			APModPopup.openPopup("Values inserted.");
		} else {
			target.value = entries[0].data;
			APModPopup.openPopup("Value inserted.");
		}
	} else if (entries.length > 1) {
		
		const entriesByDepthArray = [];
		for(entry of entries)
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
							field.inputEl.dom.value = values[i] != null ? values[i] : "";
							i++;
						}
						APModPopup.openPopup("Values inserted.");
					} else {
						input.value = item.data;
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
		for(entry of entries)
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
					if(parent?.items?.keys? != null) {
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
				for(entry of data) {
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
					if (row >= 0)
						grid.store.removeAt(row);
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
		"data": "login",
		"title": "",
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
];

APModFiller.store.settings = {"wheelSize":200,"fontSize":38};

APModFiller.save = () => {
	localStorage.setItem("APModFiller", JSON.stringify(APModFiller.store));
}

//window.addEventListener("load", APModFiller.load);
