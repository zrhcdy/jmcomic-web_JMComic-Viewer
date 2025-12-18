import appState from "./store/appState.js";
import { generateToken } from "./api/crypto.js";
import { updateIndexPage } from "./views/index.js";
import { updateLatestPage } from "./views/latest.js";
import { updateSearchInput, updateSearchPage } from "./views/search.js";
import { updateChapterPage } from "./views/chapter.js";
import { updateCollectPage } from "./views/collect.js";
import { checkInternet } from "./api/request.js";
import { updateSettingPage } from "./views/setting.js";
import { getSetting } from "./store/getSetting.js";

checkInternet();

appState.serverInfo = {
    Server: ['www.cdnmhwscc.vip', 'www.cdnmhws.cc', 'www.cdnblackmyth.club', 'www.cdnuc.vip'],
    imgServer: ["cdn-msp3.18comic.vip","cdn-msp.jm18c-twie.club", "cdn-msp.jmapiproxy1.cc", "cdn-msp.jmapiproxy2.cc"],
    usingImgServerIndex: 0,
};
appState.currentKey = Math.floor(Date.now() / 1000);
appState.accessToken = generateToken(appState.currentKey);
const setting=getSetting()
if(setting['reading-mode']==='paper'){
    document.documentElement.classList.add('paper-mode')
}else if(setting['reading-mode']==='yellow-paper'){
    document.documentElement.classList.add('yellow-paper-mode')
}
if (
    location.pathname.includes("/index.html") ||
    location.pathname === "/"
) {
    updateIndexPage();
} else if (location.pathname.includes("/latest.html")) {
    updateLatestPage();
} else if (location.pathname.includes("/search.html")) {
    updateSearchPage();
} else if (location.pathname.includes("/chapter.html")) {
    updateChapterPage();
} else if (location.pathname.includes("/collect.html")) {
    updateCollectPage();
} else if (location.pathname.includes("/setting.html")) {
    updateSettingPage();
}
updateSearchInput()

