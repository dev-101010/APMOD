const APModFillerWorker = {};

APModFillerWorker.FillerData = {};
APModFillerWorker.TableBuild = [];

APModFillerWorker.msgInc = (req, sender, sendResponse) => {
	
	chrome.storage.local.get(['FillerData','TableBuild']).then(res => {
		
		if(res.FillerData != null && typeof res.FillerData === 'object') {
			APModFillerWorker.FillerData = res.FillerData;
		} else {
			APModFillerWorker.FillerData = {};
		}
		
		if(res.TableBuild != null && typeof res.TableBuild === 'object') {
			APModFillerWorker.TableBuild = res.TableBuild;
		} else {
			APModFillerWorker.TableBuild = APModFillerWorker.default_build;
		}
		
		APModFillerWorker.filter(req, sender, sendResponse);
		
		const FillerData = APModFillerWorker.FillerData;
		const TableBuild = APModFillerWorker.TableBuild;
		chrome.storage.local.set({FillerData,TableBuild});
		
	});
	
	return true; //Needed to go Async!!!!
}

APModFillerWorker.filter = ( req, sender, sendResponse ) => {
	let ev = "";
	if(req != null || typeof req.event === 'string')
		ev = req.event;

	switch(ev)
	{
		case "getFillerData":
			APModFillerWorker.getFillerData( req, sender, sendResponse );
		break;
		case "getFillerString":
			APModFillerWorker.getFillerString( req, sender, sendResponse );
		break;
		case "setFillerData":
			APModFillerWorker.setFillerData( req, sender, sendResponse );
		break;
		case "getTableBuild":
			APModFillerWorker.getTableBuild( req, sender, sendResponse );
		break;
		case "setTableBuild":
			APModFillerWorker.setTableBuild( req, sender, sendResponse );
		break;
		case "setNewFiller":
			APModFillerWorker.setNewFiller( req, sender, sendResponse );
		break;
		default:
			sendResponse({"event":ev,"status":"Error"});
		break;
	}
}

APModFillerWorker.getFillerString = ( req, sender, sendResponse ) => {

	if(APModFillerWorker.FillerData[req.name] != null) {

		let present = false;
		for(const item of APModFillerWorker.TableBuild)
		{
			if(item.key == req.name)
				present = true;
		}
		if(!present) delete APModFillerWorker.FillerData[req.name];

	}

	let value = APModFillerWorker.FillerData[req.name];
	
	sendResponse({"event":"getFillerString", "value":value, "id":req.id,"status":"OK"});
}

APModFillerWorker.getFillerData = ( req, sender, sendResponse ) => {
	sendResponse({"event":"getFillerData", "data":APModFillerWorker.FillerData,"status":"OK"});
}

APModFillerWorker.getTableBuild = ( req, sender, sendResponse ) => {
	sendResponse({"event":"getTableBuild", "data":APModFillerWorker.TableBuild,"status":"OK"});
}

APModFillerWorker.setTableBuild = ( req, sender, sendResponse ) => {
	
	APModFillerWorker.TableBuild = req.data;
	const TableBuild = APModFillerWorker.TableBuild;
	chrome.storage.local.set({TableBuild});
	sendResponse({"event":"setTableBuild", "data":APModFillerWorker.TableBuild,"status":"OK"});
}

APModFillerWorker.setNewFiller = ( req, sender, sendResponse ) => {
	
	let present = false;
	for(const item of APModFillerWorker.TableBuild)
	{
		if(item.key == req.key)
			present = true;
	}
	if(!present) APModFillerWorker.TableBuild.push({"key":req.key,"name":req.key});
	
	APModFillerWorker.FillerData[req.key] = req.value;
	const FillerData = APModFillerWorker.FillerData;
	const TableBuild = APModFillerWorker.TableBuild;
	chrome.storage.local.set({FillerData,TableBuild});
	
	if(present)
		sendResponse({"event":"setNewFiller","new":false,"status":"OK"});
	else
		sendResponse({"event":"setNewFiller","new":true,"status":"OK"});
}

APModFillerWorker.setFillerData = ( req, sender, sendResponse ) => {
	APModFillerWorker.FillerData[req.id] = req.value;
	const FillerData = APModFillerWorker.FillerData;
	chrome.storage.local.set({FillerData});
	sendResponse({"event":"setFillerData","status":"OK"});
}

APModFillerWorker.default_build = [{"key":"employee","name":"Employee"},{"key":"hrswork","name":"Hours"},{"key":"udfchar13","name":"Execution"},{"key":"udfchar24","name":"Safety"}];

chrome.runtime.onMessage.addListener(APModFillerWorker.msgInc);
