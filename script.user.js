// ==UserScript==
// @name         APMod
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Modding APM
// @author       dev-101010
// @match        https://eam.eu1.inforcloudsuite.com/*
// @icon         https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/icon.png
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @resource     STYLE1 https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/style.css
// @resource     STYLE2 https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/radialmenu.css
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/selector.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/dataspy.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/dataspyfilter.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/filler.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/popup.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/radialmenu.js
// ==/UserScript==

/* globals APModPopup, APModDataSpy, APModFiller, APModSelector */

GM_addStyle (GM_getResourceText("STYLE1"));
GM_addStyle (GM_getResourceText("STYLE2"));

window.addEventListener("load", APModPopup.load);
window.addEventListener("load", APModDataSpy.load);
window.addEventListener("load", APModFiller.load);
window.addEventListener("load", APModSelector.load);
