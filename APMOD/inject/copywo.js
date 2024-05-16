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
            link.addEventListener('click', function(e) {
                APModCopyWo.copy(woNumber);
            });
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
    navigator.clipboard.writeText(woNumber);
	if(APModPopup) APModPopup.openPopup("Copied:" + woNumber);

    if(typeof GM_getValue !== 'undefined') {
        const data = GM_getValue( "copyWoArray", "[]" );
        const array = JSON.parse(data);
        const index = array.indexOf(woNumber);
        if (index !== -1) {
            array.splice(index, 1);
        }
        array.unshift(woNumber);
	if(array.lenght > 100) array.pop();
        GM_setValue( "copyWoArray", JSON.stringify(array) );
    }
  };
