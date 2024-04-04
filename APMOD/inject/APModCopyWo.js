const APModCopyWo = {
	mark:false,
	observer:null
};

APModCopyWo.load = () => {
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
	
  };
