const APModCopyWo = {
	mark:false,
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
          if (!APModCopyWo.mark) {
            const array = e.innerHTML.split(" ");
            const woNumber = array.pop();
            APModCopyWo.mark = true;

            const link = document.createElement('a');
            link.href = '#';
            link.innerText = woNumber;
		link.style.cursor = 'pointer';
            link.onclick = () => {
              APModCopyWo.copy(woNumber);
              return false;
            };
            e.innerHTML = e.innerHTML.replace(woNumber, link.outerHTML);
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
	const array = JSON.parse(GM.getValue( "copyWoArray", "[]" ));
	const index = array.indexOf(woNumber);
        if (index !== -1) {
            array.splice(index, 1);
        }
        array.unshift(woNumber);
	GM.setValue( "copyWoArray", JSON.stringify(array) );
  };
