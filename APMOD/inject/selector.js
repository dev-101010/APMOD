const APModSelector = {};

APModSelector.load = () => {
	if(typeof Ext === 'undefined' || typeof EAM === 'undefined') return;
	
	APModSelector.injectCustomControlls();
}

APModSelector.injectCustomControlls = () => {
	if(typeof EAM?.view?.common?.grids?.core?.Dataspy === 'undefined') return;
	const DSclass = EAM.view.common.grids.core.Dataspy;
	
	if(DSclass.prototype.acynLateInitComponent == null) {
		DSclass.prototype.acynLateInitComponent = DSclass.prototype.initComponent;
		DSclass.prototype.initComponent = function() {
			this.acynLateInitComponent.apply(this,[]);
			if(this.gridURL == "WSJOBS.ACK.xmlhttp") {
				const acynButtons = this.getGrid().acynButtons = APModSelector.getAcynButtons(this.getGrid());
				this.insert(2,acynButtons);
			}
		}
	}
}

APModSelector.getAcynButtons = (grid) => {
		return Ext.create('Ext.Container', {
			defaults: {
				margin: '0 2 0 2'
			},
			items : [
				{
					xtype: 'button',
					text : 'A',
					id : "s_all",
					grid : grid,
					listeners: { click: APModSelector.onClick }
				},
				{
					xtype: 'button',
					text : 'C',
					id : "s_comp",
					grid : grid,
					listeners: { click: APModSelector.onClick }
				},
				{
					xtype: 'button',
					text : 'Y',
					id : "s_yes",
					grid : grid,
					listeners: { click: APModSelector.onClick }
				},
				{
					xtype: 'button',
					text : 'N',
					id : "s_no",
					grid : grid,
					listeners: { click: APModSelector.onClick }
				}
			]
		});
	}

APModSelector.onClick = (target) => {
	const type = target.id;
	const checklistgrid = target.grid.el.dom;
	
	console.log("acyn check " + type);
	
	const inputs = checklistgrid.getElementsByTagName("input");
	for (const input of inputs){
		if (input.type == 'checkbox' && !input.checked)
		{
			const txt = input.labels[0].innerText;
			if(txt != "" && APModSelector.types[type].labels.includes(txt))
				input.click();
		}
	}
}

APModSelector.types = {
	"s_all" : {"str":"A","title":"Check All","labels":["Completed:","Yes:","Abgeschlossen:","Ja:"]},
	"s_comp" : {"str":"C","title":"Check Completed","labels":["Completed:","Abgeschlossen:"]},
	"s_yes" : {"str":"Y","title":"Check Yes","labels":["Yes:","Ja:"]},
	"s_no" : {"str":"N","title":"Check No","labels":["No:","Nein:"]}
};

window.addEventListener("load", APModSelector.load);
