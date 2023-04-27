const APModDataSpy = {
	popup: null
};

APModDataSpy.load = () => {
	if (typeof Ext === 'undefined' || typeof EAM === 'undefined') return;
	EAM.APModDataSpy = APModDataSpy;

	Ext.data.Store.prototype.dsGetData = function() {
		const arr = [];
		for (const item of this.data.items) {
			if (item.data.name == "No Filter") continue;
			delete item.data.id;
			arr.push(item.data);
		}
		return arr;
	}

	APModDataSpy.injectDataspy();
	APModDataSpy.injectReadOnlyGrid();
}

APModDataSpy.loadFilter = (grid) => {
	const gridURL = grid.gridURL;
	
	if(gridURL == null || typeof gridURL !== 'string' || gridURL.length <= 0)
		return Ext.create('Ext.data.Store', { field: ['name', 'sort', 'filter', 'field'], data: [] } );

	const lStorage = JSON.parse(localStorage.getItem("APModDataSpy"));
	
	//start - remove after intigation to: const storage = lStorage[gridURL];
	let storage = [];
	if(lStorage != null && typeof lStorage === 'object' && Array.isArray(lStorage)) {
		storage = lStorage;
		APModDataSpy.saveFilterToLocalStorage(grid,storage);
		console.log("----------Storage new format!------------");
	}
	else {
		storage = lStorage[gridURL];
	}
	//end - remove after intigation to: const storage = lStorage[gridURL];

	const def = APModDataSpyDefaultData[gridURL];

	let out = null;

	if (storage != null && typeof storage === 'object' && Array.isArray(storage))
		out = storage;
	else if (def != null && typeof def === 'object' && Array.isArray(def))
		out = def;
	else
		out = [];

	out.unshift({
		name: "No Filter",
		sort: [],
		filter: [],
		field: []
	});
	
	return Ext.create('Ext.data.Store', {
		field: ['name', 'sort', 'filter', 'field'],
		data: out
	});
}

APModDataSpy.injectDataspy = (dsStore) => {
	if (typeof EAM?.view?.common?.grids?.core?.Dataspy === 'undefined') return;
	const DSclass = EAM.view.common.grids.core.Dataspy;

	if (DSclass.prototype.apmodDataSpyOrigInitComponent == null) {
		DSclass.prototype.apmodDataSpyOrigInitComponent = DSclass.prototype.initComponent;
		DSclass.prototype.initComponent = function() {
			this.apmodDataSpyOrigInitComponent.apply(this, []);
			if (this.gridURL == "WSJOBS.xmlhttp") {
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
			if (this.gridURL == "WSJOBS.xmlhttp") {
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
	const pos = strFn.sIndexOf(';', behind),
		strNewFn = [strFn.slice(0, pos), code, strFn.slice(pos)].join('');
	const first = strNewFn.indexOf('{'),
		last = strNewFn.lastIndexOf('}');
	return new Function(param, strNewFn.substring(first + 1, last));
}

String.prototype.sIndexOf = function(find, count) {
	if (typeof find !== "string" || find.length < 1 || typeof count !== "number" || count < 1) return 0;
	let c = 1;
	for (let i = 0; i < this.length; i++) {
		if (this[i] === find && count === c++) return i + 1;
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
				b['MADDON_FILTER_ALIAS_NAME_' + a] = filter.NAME;
				b['MADDON_FILTER_OPERATOR_' + a] = filter.OPERATOR;
				b['MADDON_FILTER_JOINER_' + a] = filter.JOINER;
				b['MADDON_FILTER_SEQNUM_' + a] = a + '';
				b['MADDON_FILTER_VALUE_' + a] = filter.VALUE;
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

APModDataSpy.getCustomDataSpy = (grid) => {
	return Ext.create('Ext.form.ComboBox', {
		store: grid.apModStore,
		displayField: 'name',
		valueField: 'name',
		fieldLabel: 'SubDataSpy',
		sort: 'sort',
		field: 'field',
		filter: 'filter',
		grid: grid,
		editable: false,
		hideLabel: true,
		value: grid.apModStore.data.items[0],
		listeners: {
			select: (combo, records, eOpts) => {
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
		field: ['NAME', 'OPERATOR', 'JOINER', 'VALUE', 'LPAREN', 'RPAREN'],
		data: newRec ? newData.filter : selRec.data.filter
	});

	const sortStore = Ext.create('Ext.data.Store', {
		field: ['NAME', 'TYPE'],
		data: newRec ? newData.sort : selRec.data.sort
	});

	const fieldStore = Ext.create('Ext.data.Store', {
		field: ['NAME', 'WIDTH'],
		data: newRec ? newData.field : selRec.data.field
	});

	//const gridFields = Ext.clone(grid.originalGridFields).filter(field => field.filterable == "+");
	const gridFields = Ext.clone(grid.originalGridFields);
	const filterAliasStore = Ext.create('Ext.data.Store', {
		field: ['name', 'label'],
		data: gridFields.sort((a, b) => a.label.localeCompare(b.label))
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
		field: ['value', 'label'],
		data: posList
	});

	const pos = newRec ? selRec.store.data.length : selRec.store.indexOf(selRec);

	let dsChangeName = newRec ? APModDataSpy.getNewName(grid,newData.name || "New Filter") : selRec.data.name;

	const fullDataSet = dsCombo.store.dsGetData();

	return new Ext.create('Ext.window.Window', {
		title: 'Dataspy Edit',
		width: 900,
		height: 600,
		minWidth: 900,
		minHeight: 600,
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
				items: [APModDataSpy.filterPanel(filterStore, filterAliasStore)],
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
				}]
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
							dsCombo.store.remove(selRec);
							APModDataSpy.popup.disable();
							APModDataSpy.saveFilterToLocalStorage(grid,dsCombo.store.dsGetData());
							new Ext.util.DelayedTask(function() {
								APModDataSpy.popup.destroy();
								APModDataSpy.popup = null;
								dsCombo.select("No Filter");
								const record = dsCombo.getStore().findRecord('value', "No Filter");
								dsCombo.fireEvent('select', dsCombo, [record]);
							}).delay(200);
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
							const record = dsCombo.getStore().findRecord('value', dsChangeName);
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
				}]
			}
		]
	});
}

APModDataSpy.filterPanel = (filterStore, filterAliasStore) => {
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
					if (row >= 0)
						grid.store.removeAt(row);
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
			columns: [{
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
					editor: {
						xtype: 'textfield',
					},
					align: 'center'
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
					if (row >= 0)
						grid.store.removeAt(row);
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
					if (row >= 0)
						grid.store.removeAt(row);
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

APModDataSpy.exportToCSV = (grid) => {
	let text = "";
	const separator = ";";
	
	if(grid == null || grid.columnManager == null) return;
	
	const columns = grid.columnManager.columns;
	const columnsCount = columns.length;
	
	const rows = grid.store.data.items;
	const rowsCount = rows.length;
	
	if(columnsCount <= 0 || rowsCount <= 0) return;
	
	//Columns
	for (let i = 0; i < columnsCount; i++) {
		text += columns[i].text + separator;
	}
	text = text.substring(0, text.length-1);
	text += "\r";
	
	//Row
	for (let i = 0; i < rowsCount; i++) {
		const row = rows[i].data;
		for (let j = 0; j<columnsCount; j++) {
			const value = row[columns[j].dataIndex];
			text += "\"" + value + "\"" + separator;
		}
		text = text.substring(0, text.length-1);
		text += "\r";
	}
	
	if(text == null || typeof text !== 'string' || text.length <= 0) return;

	const csvData = new Blob([text], { type: 'text/csv' }); 
	const csvUrl = URL.createObjectURL(csvData);
	const element = document.createElement("a");
	element.setAttribute("href",csvUrl);
	element.setAttribute("download", "grid.csv");
	element.style.display = "none";
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}

//window.addEventListener("load", APModDataSpy.load);
