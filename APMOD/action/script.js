const APModFillerAction = {};

APModFillerAction.FillerData = {};
APModFillerAction.TableBuild = [];
APModFillerAction.Box = null;

APModFillerAction.load = () => {
	chrome.runtime.sendMessage( {"event":"getTableBuild"}, APModFillerAction.getTableBuild );
}

APModFillerAction.getFillerData = (res) => {
	if(res == null || res.event !== "getFillerData")
		return;

		APModFillerAction.FillerData = res.data;
		APModFillerAction.tableCreate();
}

APModFillerAction.getTableBuild = (res) => {
	if(res == null || res.event !== "getTableBuild")
		return;

		APModFillerAction.TableBuild = res.data;

	chrome.runtime.sendMessage( {"event":"getFillerData"}, APModFillerAction.getFillerData);
}

APModFillerAction.setTableBuild = (res) => {
	if(res == null || res.event !== "setTableBuild")
		return;

		APModFillerAction.TableBuild = res.data;

	chrome.runtime.sendMessage( {"event":"getTableBuild"}, APModFillerAction.getTableBuild);
}

APModFillerAction.setFillerData = (res) => {}

APModFillerAction.tableCreate = () => {

	const body = document.body;

	if(APModFillerAction.Box != null)
	APModFillerAction.Box.remove();
	APModFillerAction.Box = document.createElement("div");
	APModFillerAction.Box.classList.add('container');
	
	const table = document.createElement("table");

	const tblBody = document.createElement("tbody");
	
	if(APModFillerAction.TableBuild.length > 0) {

		for (const [idx, build] of APModFillerAction.TableBuild.entries()) {

			const row = document.createElement("tr");

			const tdName = document.createElement("td");
			const tdInput = document.createElement("td");
			const tdRename = document.createElement("td");
			const tdDelete = document.createElement("td");
			const tdUp = document.createElement("td");
			const tdDown = document.createElement("td");
			
			const label = document.createTextNode(build.name);
			label.title="Name";
			
			const textview = document.createElement("INPUT");
			textview.setAttribute("type", "text");
			textview.id = build.key;
			textview.title="Value";
			textview.addEventListener('input', APModFillerAction.inputHandler);
			textview.value = APModFillerAction.FillerData[build.key] || "";
			
			const butRename = document.createElement("button");
			butRename.idx = idx;
			butRename.title="Rename";
			butRename.key = build.key;
			butRename.cmd = "rename";
			butRename.textContent = "✎";
			butRename.addEventListener('click', APModFillerAction.buttonHandler);
			
			const butDelete = document.createElement("button");
			butDelete.idx = idx;
			butDelete.title="Delete";
			butDelete.key = build.key;
			butDelete.cmd = "delete";
			butDelete.textContent = "❌";
			butDelete.addEventListener('click', APModFillerAction.buttonHandler);
			
			const butUp = document.createElement("button");
			butUp.idx = idx;
			butUp.title="Move Up";
			butUp.key = build.key;
			butUp.cmd = "up";
			butUp.textContent = "⏫";
			butUp.addEventListener('click', APModFillerAction.buttonHandler);
			
			const butDown = document.createElement("button");
			butDown.idx = idx;
			butDown.title="Move Down";
			butDown.key = build.key;
			butDown.cmd = "down";
			butDown.textContent = "⏬";
			butDown.addEventListener('click', APModFillerAction.buttonHandler);
			
			tdName.appendChild(label);
			tdInput.appendChild(textview);
			tdRename.appendChild(butRename);
			tdDelete.appendChild(butDelete);
			tdUp.appendChild(butUp);
			tdDown.appendChild(butDown);
			
			row.appendChild(tdName);
			row.appendChild(tdInput);
			row.appendChild(tdRename);
			row.appendChild(tdDelete);
			row.appendChild(tdUp);
			row.appendChild(tdDown);

			tblBody.appendChild(row);
			
		}

		table.appendChild(tblBody);

		APModFillerAction.Box.appendChild(table);
		
		let b1 = document.createElement("div");
		let b2 = document.createElement("div");
		let info1 = document.createTextNode("Ctrl+LeftMouse to insert a saved value.");
		let info2 = document.createTextNode("Shift+LeftMouse to create/update a saved value.");
		b1.appendChild(info1);
		b2.appendChild(info2);
		APModFillerAction.Box.appendChild(b1);
		APModFillerAction.Box.appendChild(b2);
	
	} else {
		let berr = document.createElement("div");
		let err = document.createTextNode("Error, Service Worker not active. Click again.");
		berr.appendChild(err);
		APModFillerAction.Box.appendChild(berr);
	}
	
	body.appendChild(APModFillerAction.Box);
}

APModFillerAction.buttonHandler = (e) => {
	const cmd = e.target.cmd;
	const idx = e.target.idx;
	switch(cmd)
	{
		case "rename":
			APModFillerAction.TableBuild[idx].name = APModFillerAction.NamePopup(APModFillerAction.TableBuild[idx].name,APModFillerAction.TableBuild[idx].key);
		break;
		case "delete":
			confirm("Are you sure deleting '"+APModFillerAction.TableBuild[idx].name+"'?") ? APModFillerAction.TableBuild.splice(idx, 1) : null;
		break;
		case "up":
			APModFillerAction.TableBuild.moveItem(idx,-1);
		break;
		case "down":
			APModFillerAction.TableBuild.moveItem(idx,1);
		break;
	}
	chrome.runtime.sendMessage( {"event":"setTableBuild","data":APModFillerAction.TableBuild}, APModFillerAction.setTableBuild );
}

APModFillerAction.inputHandler = (e) => {
	const id = e.target.id;
	const value = e.target.value;
	if(APModFillerAction.FillerData[id] != value)
		chrome.runtime.sendMessage({"event":"setFillerData","id":id,"value":value}, APModFillerAction.setFillerData);
}

APModFillerAction.NamePopup = (oldName,key) => {
    const name = prompt("Enter new name.",(typeof oldName === 'string' && oldName.length > 0) ? oldName : key );
	return (typeof name === 'string' && name.length > 0) ? name : oldName;
}



Array.prototype.moveItem = function(fromIndex,direction) {
	const toIndex = fromIndex + direction;
	if(toIndex < 0 || toIndex >= this.length) return;
	this.splice(toIndex, 0, this.splice(fromIndex, 1)[0]);
};

window.addEventListener("load", APModFillerAction.load);
