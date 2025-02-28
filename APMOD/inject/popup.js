const APModPopup = {timeOut:null};

APModPopup.load = () => {
	
	if(APModPopup.Popup != null) APModPopup.Popup.remove();

	APModPopup.Popup = document.createElement("div");
	APModPopup.Popup.id = "fillerPopup";
	APModPopup.Popup.classList.add("fillerPopup");

	APModPopup.Popup.header = document.createElement("h2");
   	APModPopup.Popup.header.innerText = "APMOD";
   	APModPopup.Popup.header.style.color = "black";
   	APModPopup.Popup.appendChild(APModPopup.Popup.header);
	
	APModPopup.Popup.label = document.createElement("label");
	APModPopup.Popup.label.style.color = "white";
	APModPopup.Popup.appendChild(APModPopup.Popup.label);

	document.body.appendChild(APModPopup.Popup);
}

APModPopup.openPopup = (text) => {
	APModPopup.Popup.label.innerHTML = text;
	APModPopup.Popup.style.display = "flex";
        if(APModPopup.timeOut) {
	    clearTimeout(APModPopup.timeOut);
        }
	APModPopup.timeOut = setTimeout(APModPopup.closePopup,1500);
}

APModPopup.closePopup = () => {
	APModPopup.Popup.style.display = "none";
}

//window.addEventListener("load", APModPopup.load);
