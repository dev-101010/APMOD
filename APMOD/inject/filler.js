const APModFiller = {};

APModFiller.Popup = null;

APModFiller.load = () => {
	
	if(APModFiller.Popup != null) APModFiller.Popup.remove();

	APModFiller.Popup = document.createElement("div");
	APModFiller.Popup.id = "fillerPopup";
	APModFiller.Popup.classList.add("fillerPopup");
	APModFiller.Popup.label = document.createElement("label");
	APModFiller.Popup.label.style.color = "white";
	APModFiller.Popup.appendChild(APModFiller.Popup.label);

	document.body.appendChild(APModFiller.Popup);
	
	document.addEventListener('click', (e) => {
		const target = e.target;
		
		if(e.ctrlKey && target.tagName == "INPUT" && target.type == "text")
		{
			chrome.runtime.sendMessage( {"event":"getFillerString", "id":target.id, "name":target.name}, APModFiller.getFillerString );
		}
		
		if(e.shiftKey && target.tagName == "INPUT" && target.type == "text")
		{
			chrome.runtime.sendMessage( {"event":"setNewFiller", "key":target.name, "value":target.value}, APModFiller.setNewFiller );
		}
		
	}, false);
}

APModFiller.openPopup = (text) => {
	APModFiller.Popup.label.textContent = text;
	APModFiller.Popup.style.display = "block";
	setTimeout(APModFiller.closePopup,1500);
}

APModFiller.closePopup = () => {
	APModFiller.Popup.style.display = "none";
}

APModFiller.getFillerString = (res) => {
	
	if(res == null || res.event != "getFillerString")
		return;
	
	const id = res.id;
	const value = res.value;
	
	if(typeof value !== 'string' || typeof id !== 'string')
	{
		APModFiller.openPopup("Stored Text not found.");
		return;
	}

	if(value === "")
	{
		APModFiller.openPopup("Stored Text is empty.");
		return;
	}
	
	const target = document.getElementById(id);
	target.value = value;
	APModFiller.openPopup("Stored Text inserted.");
}

APModFiller.setNewFiller = (res) => {
	if(res == null || res.event != "setNewFiller") return;	
	if(res.new === true) APModFiller.openPopup("New Stored Text created.");
	else APModFiller.openPopup("Stored Text updated.");
}

window.addEventListener("load", APModFiller.load);