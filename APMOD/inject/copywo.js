const APModCopyWo = {
	observer:null
};

APModCopyWo.load = () => {
	if (window.location.hostname !== 't.corp.amazon.com') return;

	APModCopyWo.observer = new MutationObserver((rec) => {
      const comments = document.querySelectorAll(".plain-text-display");

      if (comments == null) return;

      for (let e of comments) {
        if (
          e.innerText.includes(
            "Work order is created for this ticket with EAM(APM) work order number:"
          )
        ) {
          const b = document.getElementById("APModCopyWoButton");
          if (!b) {
            const array = e.innerHTML.split(" ");
            const woNumber = array.pop();
            e.innerHTML = e.innerHTML.replace(woNumber, "");

	    const link = e.appendChild(document.createElement("button"));
            link.id = "APModCopyWoButton";
            link.textContent = woNumber;
            link.type="button";
            link.style.cursor = 'pointer';
            link.style["background-color"] = 'transparent';
            link.style["color"] = 'inherit';
            link.style["margin-block"] = 0;
            link.style["margin-inline"] = 0;
            link.style["padding-block"] = 0;
            link.style["padding-inline"] = 0;
            link.style["font-family"] = 'inherit';
            link.style["font-size"] = '100%';
            link.style["line-height"] = 1.15;
            link.style["border-block"] = 0;
            link.style["border-inline"] = 0;
            link.style["border-block-end"] = "1px dashed currentColor";
            link.style.marginRight = '10px';
            link.addEventListener('click', function(e) {
                APModCopyWo.copy(woNumber);
            });
            const link2 = e.appendChild(document.createElement("button"));
            link2.type="button";
            link2.textContent = "➽";
            link2.style.cursor = 'pointer';
            link2.style["background-color"] = 'transparent';
            link2.style["color"] = 'inherit';
            link2.style["margin-block"] = 0;
            link2.style["margin-inline"] = 0;
            link2.style["padding-block"] = 0;
            link2.style["padding-inline"] = 0;
            link2.style["font-family"] = 'inherit';
            link2.style["font-size"] = '100%';
            link2.style["line-height"] = 1.15;
            link2.style["border-block"] = 0;
            link2.style["border-inline"] = 0;
            link2.style.marginLeft = '10px';
            link2.addEventListener("click", ()=>{
                window.open("https://eu1.eam.hxgnsmartcloud.com/web/base/logindisp?tenant=AMAZONRMEEU_PRD&FROMEMAIL=YES&SYSTEM_FUNCTION_NAME=WSJOBS&USER_FUNCTION_NAME=WSJOBS&workordernum="+woNumber, '_blank');
            });
		  
          }
        }
      }
    });

    window.addEventListener("beforeunload", (event) => {
      if (APModCopyWo.observer) APModCopyWo.observer.disconnect();
    });

    APModCopyWo.observer.observe(document.querySelector("body"), {
      childList: true,
      subtree: true,
    });
};

APModCopyWo.copy = (woNumber) => {
    let popupText = "";
    if(typeof GM_getValue !== 'undefined') {
        const clipEnabled = GM_getValue( "copyWoClipboardEnabled", true );
        const woEnabled = GM_getValue( "copyWoArrayEnabled", true );

        if(clipEnabled) {
            navigator.clipboard.writeText(woNumber);
            popupText += woNumber+" set to Clipboard.";
        }

        if(woEnabled) {
            const data = GM_getValue( "copyWoArray", "[]" );
            const array = JSON.parse(data);
            const index = array.indexOf(woNumber);
            if (index !== -1) {
                array.splice(index, 1);
            }
            array.unshift(woNumber);
            if(array.lenght > 100) array.pop();
            GM_setValue( "copyWoArray", JSON.stringify(array) );
            if(popupText !== "") {
                popupText += "<br>"+woNumber+" added to APM WO List.";
            }
            else {
                popupText = woNumber+" added to APM WO List.";
            }
        }
    } else {
        navigator.clipboard.writeText(woNumber);
        popupText += woNumber+" set to Clipboard.";
    }
    if(APModPopup && popupText !== "")
        APModPopup.openPopup(popupText);
  };
