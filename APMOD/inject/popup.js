const APModPopup = {};

APModPopup.load = () => {
	
	if(APModPopup.Popup != null) APModPopup.Popup.remove();

	APModPopup.Popup = document.createElement("div");
	APModPopup.Popup.id = "fillerPopup";
	APModPopup.Popup.classList.add("fillerPopup");
	APModPopup.Popup.label = document.createElement("label");
	APModPopup.Popup.label.style.color = "white";
	APModPopup.Popup.appendChild(APModPopup.Popup.label);

	document.body.appendChild(APModPopup.Popup);
}

APModPopup.openPopup = (text) => {
	APModPopup.Popup.label.textContent = text;
	APModPopup.Popup.style.display = "block";
	setTimeout(APModPopup.closePopup,1500);
}

APModPopup.closePopup = () => {
	APModPopup.Popup.style.display = "none";
}

//window.addEventListener("load", APModPopup.load);
