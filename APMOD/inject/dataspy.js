const APModDataSpy = {Filters:[]};

APModDataSpy.load = () => {
	if(typeof Ext === 'undefined' || typeof EAM === 'undefined') return;
	
	let i = 0;
	APModDataSpy.Filters.push({id:i++,name:"No Filter",sort:null,filters:null});
	for(const filter of APModDataSpy.getDataspyFilter()){
		APModDataSpy.Filters.push({id:i++,name:filter.name,sort:filter.sort,filters:filter.filter});
	}
	
	APModDataSpy.DataSpyStore = Ext.create('Ext.data.Store',{ fields:['id','name','sort','filters'], data: APModDataSpy.Filters });
	
	APModDataSpy.injectCustomControlls();
	APModDataSpy.injectHeaderFilter();
}

APModDataSpy.injectCustomControlls = () => {
	if(typeof EAM?.view?.common?.grids?.core?.Dataspy === 'undefined') return;
	const DSclass = EAM.view.common.grids.core.Dataspy;
	
	if(DSclass.prototype.amodDataSpyLateInitComponent == null) {
		DSclass.prototype.amodDataSpyLateInitComponent = DSclass.prototype.initComponent;
		DSclass.prototype.initComponent = function() {
			this.amodDataSpyLateInitComponent.apply(this,[]);
			if(this.gridURL == "WSJOBS.xmlhttp") {
				const customDataSpy = this.getGrid().customDataSpy = APModDataSpy.getCustomDataSpy(this.getGrid());
				this.insert(2,customDataSpy);
			}
		}
	}
}

APModDataSpy.injectHeaderFilter = () => {
	if(typeof EAM?.view?.common?.grids?.core?.ReadOnlyGrid === 'undefined') return;
	const ROGclass = EAM.view.common.grids.core.ReadOnlyGrid;
	
	const code = "/*----inject CustomDataSpy----*/[a,b]=APModDataSpy.injectBuildHeaderFilter(l,a,b);/*----end----*/";
	ROGclass.prototype.buildHeaderFilter = APModDataSpy.injectCodeInFunction(ROGclass.prototype.buildHeaderFilter,';',code);
}

APModDataSpy.injectCodeInFunction = (cla, behind, code) => {
	if(cla == null || behind == null || code == null) return cla;
	const strCla = cla.toString();
	if(strCla.includes(code)) return cla;
	const pos = strCla.indexOf(behind);
	const strNewBHF = [strCla.slice(0, pos+1), code, strCla.slice(pos)].join('');
	const first = strNewBHF.indexOf('{');
	const last = strNewBHF.lastIndexOf('}');
	const fnStr = strNewBHF.substring(first+1, last); 
	return new Function(fnStr);
}

APModDataSpy.injectBuildHeaderFilter = (l,a,b) => {
	const ds = l.customDataSpy;
	if(ds != null && ds.getSelectedRecord() != null) {
		const rec = ds.getSelectedRecord();
		if(rec.data.sort != null) {
			l.lastSort = {
				ADDON_SORT_ELEMENT_ALIAS_NAME : rec.data.sort.NAME,
				ADDON_SORT_ELEMENT_TYPE : rec.data.sort.TYPE
			}
		}
		if(rec.data.filters != null) {
			for(const filter of rec.data.filters) {
				b['MADDON_FILTER_ALIAS_NAME_' + a] = filter.NAME;
				b['MADDON_FILTER_OPERATOR_' + a] = filter.OPERATOR;
				b['MADDON_FILTER_JOINER_' + a] = filter.JOINER;
				b['MADDON_FILTER_SEQNUM_' + a] = a + '';
				b['MADDON_FILTER_VALUE_' + a] = filter.VALUE;
				b['MADDON_LPAREN_' + a] = filter.LPAREN;
				b['MADDON_RPAREN_' + a] = filter.RPAREN;
				a++;
			}
		}
	}
	return [a,b];
}

APModDataSpy.getCustomDataSpy = (grid) => {
	return Ext.create('Ext.form.ComboBox', {
		store: APModDataSpy.DataSpyStore,
		displayField: 'name',
		valueField: 'id',
		fieldLabel: 'SubDataSpy',
		sort:'sort',
		filter:'filter',
		grid:grid,
		editable: false,
		hideLabel: true,
		value: APModDataSpy.DataSpyStore.data.items[0],
		listeners: { select: (combo, records, eOpts) => {combo.grid.runDataspy(null)} }
	});
}

window.addEventListener("load", APModDataSpy.load);