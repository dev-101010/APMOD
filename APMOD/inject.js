const scriptList = ["inject/selector.js","inject/dataspy.js","inject/dataspyfilter.js","inject/filler.js","inject/shift.js","inject/popup.js","inject/radialmenu.js","inject/load.js"];
const cssList = ["inject/style.css","inject/radialmenu.css"];

for(const scipt of scriptList) {
	var s = document.createElement('script');
	s.src = chrome.runtime.getURL(scipt);
	s.type='text/javascript';
	(document.head||document.documentElement).appendChild(s);
}

for(const css of cssList) {
	var link = document.createElement( "link" );
	link.href = chrome.runtime.getURL(css);
	link.type = "text/css";
	link.rel = "stylesheet";
	(document.head||document.documentElement).appendChild(link);

}
