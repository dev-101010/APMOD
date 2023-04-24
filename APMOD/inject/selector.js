const APModSelector = {};

APModSelector.load = () => {
	if(typeof Ext === 'undefined' || typeof EAM === 'undefined') return;
	
	APModSelector.injectChecklistGrid();
	APModSelector.injectBox();
}

APModSelector.injectChecklistGrid = () => {
	if (typeof EAM?.view?.common?.grids?.core?.ChecklistGrid === 'undefined') return;
	const CLGclass = EAM.view.common.grids.core.ChecklistGrid;
	
	if(CLGclass.prototype.APModSelectorLateInitComponent == null) {
		CLGclass.prototype.APModSelectorLateInitComponent = CLGclass.prototype.initComponent;
		CLGclass.prototype.initComponent = function() {
			this.APModSelectorLateInitComponent.apply(this,[]);
			this.apModSel = {buttons:{},selector:{list:[],yes:false,comp:false,good:false,all:false,override:false}};
			this.getDataspy().insert(3,APModSelector.getSelectorButtons(this));
			const grid = this;
			if(this.store != null)
				this.store.on("datachanged", APModSelector.dataChanged, this, grid);
		}
	}
}

APModSelector.dataChanged = (target,grid) => {
	const buttons = grid.apModSel.buttons;
	const selector = grid.apModSel.selector = {list:[],yes:false,comp:false,good:false,all:false,override:false};
	
	for(const e of target.data.items) {
		if(e.data.checklisttype == "01") selector.comp = true;
		if(e.data.checklisttype == "02") selector.yes = true;
		if(e.data.checklisttype == "08") selector.good = true;
	}
	
	let i = 0;
	if(selector.comp) i++;
	if(selector.yes) i++;
	if(selector.good) i++;
	if(i > 1) selector.all = true;
	
	for( const button of Object.values(buttons) ) {
		if(button.key == "s_all" && button.xVis != null) button.xVis( selector.all );
		if(button.key == "s_comp" && button.xVis != null) button.xVis( selector.comp );
		if(button.key == "s_yes" && button.xVis != null) button.xVis( selector.yes );
		if(button.key == "s_no" && button.xVis != null) button.xVis( selector.yes );
		if(button.key == "s_good" && button.xVis != null) button.xVis( selector.good );
		if(button.key == "s_poor" && button.xVis != null) button.xVis( selector.good );
		if(button.key == "s_check" && button.xVis != null) button.xVis( selector.comp || selector.yes || selector.good );
	}
}

APModSelector.injectBox = () => {
	if (typeof EAM?.ux?.grid?.row?.Box === 'undefined') return;
	const Bclass = EAM.ux.grid.row.Box;
	
	if(Bclass.prototype.APModSelectorLateInitComponent == null) {
		Bclass.prototype.APModSelectorLateInitComponent = Bclass.prototype.initComponent;
		Bclass.prototype.initComponent = function() {
			this.APModSelectorLateInitComponent.apply(this,[]);
			
			if( this.view?.grid?.apModSel?.selector?.list != null) {
				this.view.grid.apModSel.selector.list.push({ "noBox": this.noBox, "yesBox":this.yesBox, "compBox":this.compBox, "goodBox":this.goodBox, "poorBox":this.poorBox });
			}
			
		}
	}
}

APModSelector.getSelectorButtons = (grid) => {
	return Ext.create('Ext.Container', {
		defaults: { margin: '0 2 0 2' },
		layout: {
			type: 'hbox',
			align: 'stretch',
		},
		items : APModSelector.createItems(grid),
	});
}

APModSelector.createItems = (grid) => {
	const out = [];
	for(const [key,value] of Object.entries(APModSelector.types)){
		out.push(
			{
				xtype: value.type,
				text : value.str,
				grid : grid,
				key : key,
				hidden: true,
				xVis: function(b) { if(b == false && this.hidden == false) this.hide(); if(b == true && this.hidden == true) this.show(); },
				tooltip: value.title,
				listeners: {
					added: function ( target, ownerCt, index ) {target.grid.apModSel.buttons[target.key] = target;},
					click: APModSelector.onClick,
					change: APModSelector.onCheckChanged,
					render: function(c) { if(c.xtype === "checkbox") Ext.create('Ext.tip.ToolTip', { target: c.getEl(), html: c.tooltip }); }
				},
			}
		);
	}
	return out;
}

APModSelector.onCheckChanged = (target, newValue, oldValue) => {
	if(target == null || target.grid?.apModSel?.selector == null) return;
	target.grid.apModSel.selector.override = newValue;
}

APModSelector.onClick = (target) => {
	if(target == null || target.grid?.apModSel?.selector == null) return;
	const key = target.key;
	const selector = target.grid.apModSel.selector;
	const or = selector.override;
	for( const check of selector.list ) {
		
		if( check.compBox?.inputEl?.dom != null && ( key === "s_all" || key === "s_comp" ) ) {
			if( !or && check.compBox.checked )
				continue;
			check.compBox.inputEl.dom.click();
		}
		
		if( check.noBox?.inputEl?.dom != null && /*!check.noBox.checked &&*/  key === "s_no" ) {
			if( !or && (check.yesBox.checked || check.noBox.checked) )
				continue;
			check.noBox.inputEl.dom.click();
		}
		
		if( check.yesBox?.inputEl?.dom != null && /*!check.yesBox.checked &&*/ ( key === "s_all" || key === "s_yes" ) ) {
			if( !or && (check.noBox.checked || check.yesBox.checked) )
				continue;
			check.yesBox.inputEl.dom.click();
		}
		
		if( check.goodBox?.inputEl?.dom != null && /*!check.goodBox.checked &&*/ ( key === "s_all" || key === "s_good" ) ) {
			if( !or && (check.poorBox.checked || check.goodBox.checked) )
				continue;
			check.goodBox.inputEl.dom.click();
		}
		
		if( check.poorBox?.inputEl?.dom != null && /*!check.poorBox.checked &&*/ key === "s_poor" ) {
			if( !or && (check.goodBox.checked || check.poorBox.checked) )
				continue;
			check.poorBox.inputEl.dom.click();
		}
	}
}

APModSelector.types = {
	"s_all" : {"str":"A","type":"button","title":"Check All"},
	"s_comp" : {"str":"C","type":"button","title":"Check Completed"},
	"s_yes" : {"str":"Y","type":"button","title":"Check Yes"},
	"s_no" : {"str":"N","type":"button","title":"Check No"},
	"s_good" : {"str":"G","type":"button","title":"Check Good"},
	"s_poor" : {"str":"P","type":"button","title":"Check Poor"},
	"s_check" : {"str":"X","type":"checkbox","title":"Override"},
};

//window.addEventListener("load", APModSelector.load);
