import CryptoJS from "../crypto/crypto.js";
import appState from "../store/appState.js";
import { calculateMD5, decryptData } from "./crypto.js";

export function checkInternet() {
    if (!navigator.onLine) {
        alert("没有互联网连接！！");
        throw new Error("not online");
    }
}

export async function retryFetch(...args) {
    let tryCount = args.pop();
    try {
        const resp = await fetch(...args);
        return resp;
    } catch (error) {
        if (tryCount <= 0) throw new Error(error);
        return retryFetch(...args, tryCount - 1);
    }
}


// console.log((text));
export async function getCurrentApi() {
    const resp=await retryFetch('https://rup4a04-c01.tos-ap-southeast-1.bytepluses.com/newsvr-2025.txt',1)
    const text=await resp.text()
    
    const dynamicKey = calculateMD5('diosfjckwpqpdfjkvnqQjsik');
    const decryptedData = CryptoJS.AES.decrypt(
        text,
        CryptoJS.enc.Utf8.parse(dynamicKey),
        { mode: CryptoJS.mode.ECB }
    );
    return JSON.parse(decryptedData.toString(CryptoJS.enc.Utf8));
};

export async function getSearchResults(searchQuery, page) {
    const searchResponse = await retryFetch(
        `https://${appState.serverInfo.Server[0]}/search?search_query=${searchQuery}&o=mv&page=${page}`,
        {
            headers: {
                token: appState.accessToken.token,
                tokenParam: appState.accessToken.tokenParam,
            },
            redirect: "follow",
        },
        6
    );
    const searchData = await searchResponse.json();
    return decryptData(appState.currentKey, searchData.data);
}
export async function getLatestContent(page) {
    const latestResponse = await retryFetch(
        `https://${appState.serverInfo.Server[0]}/latest?page=${page}`,
        {
            headers: {
                token: appState.accessToken.token,
                tokenParam: appState.accessToken.tokenParam,
            },
            redirect: "follow",
        },
        6
    );
    const latestData = await latestResponse.json();
    return decryptData(appState.currentKey, latestData.data);
}
export async function getPromotionContent() {
    let cache = localStorage.getItem("promoteCache");
    if (cache) {
        cache = JSON.parse(cache);
        if (cache.date === new Date().toDateString()) {
            return cache.data;
        }
    }
    const promotionResponse = await retryFetch(
        `https://${appState.serverInfo.Server[0]}/promote?page=1`,
        {
            headers: {
                token: appState.accessToken.token,
                tokenParam: appState.accessToken.tokenParam,
            },
            redirect: "follow",
        },
        6
    );
    const promotionData = await promotionResponse.json();
    const data = decryptData(appState.currentKey, promotionData.data);
    localStorage.setItem(
        "promoteCache",
        JSON.stringify({
            date: new Date().toDateString(),
            data,
        })
    );
    console.log(data);
    
    return data;
}
export async function getComicAlbum(comicId) {
    const albumResponse = await retryFetch(
        `https://${appState.serverInfo.Server[0]}/album?id=${comicId}`,
        {
            headers: {
                token: appState.accessToken.token,
                tokenParam: appState.accessToken.tokenParam,
            },
            redirect: "follow",
        },
        6
    );
    const albumData = await albumResponse.json();
    return decryptData(appState.currentKey, albumData.data);
}
export async function getComicChapter(comicId) {
    const chapterResponse = await retryFetch(
        `https://${appState.serverInfo.Server[0]}/chapter?id=${comicId}`,
        {
            headers: {
                token: appState.accessToken.token,
                tokenParam: appState.accessToken.tokenParam,
            },
            redirect: "follow",
        },
        6
    );
    const chapterData = await chapterResponse.json();
    return decryptData(appState.currentKey, chapterData.data);
}