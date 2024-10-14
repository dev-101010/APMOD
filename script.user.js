// ==UserScript==
// @name         APMod
// @namespace    https://github.com/dev-101010/APMOD/
// @version      1.2.9
// @description  APMod fügt Filter und Ausfüllhilfen in APM ein welche die Arbeit erleichtern.
// @author       dev-101010
// @match        https://eu1.eam.hxgnsmartcloud.com/*
// @match        https://t.corp.amazon.com/*
// @icon         https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/icon.png
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_getValue
// @grant        GM_setValue
// @resource     STYLE1 https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/style.css
// @resource     STYLE2 https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/radialmenu.css
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/copywo.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/selector.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/dataspy.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/dataspyfilter.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/filler.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/popup.js
// @require      https://raw.githubusercontent.com/dev-101010/APMOD/main/APMOD/inject/radialmenu.js
// ==/UserScript==

/* globals APModPopup, APModDataSpy, APModFiller, APModSelector, APModCopyWo */

GM_addStyle (GM_getResourceText("STYLE1"));
GM_addStyle (GM_getResourceText("STYLE2"));

window.addEventListener("load", ()=> {
    if(APModPopup!=null)APModPopup.load();
    if(APModDataSpy!=null)APModDataSpy.load();
    if(APModFiller!=null)APModFiller.load();
    if(APModSelector!=null)APModSelector.load();
    if(APModCopyWo!=null)APModCopyWo.load();
});
