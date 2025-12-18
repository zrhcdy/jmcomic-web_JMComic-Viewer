import { decryptData } from "../api/crypto.js";
import { getComicAlbum ,getComicChapter, retryFetch} from "../api/request.js";
import appState from "../store/appState.js";
import { getSetting, setSetting } from "../store/getSetting.js";
import { debounce } from "../utils/debounce.js";
import { convertToEnglishNumber } from "../utils/format.js";
import { cutImage } from "./image.js";
export function updateChapterPage() {
    const comicId = new URLSearchParams(location.search).get("cid");
    if (!Number.isInteger(+comicId) && comicId >= 10) {
        alert("comic-id格式错误！！！");
        location.href = "./index.html";
    }
    // 获取漫画专辑信息
    getComicAlbum(comicId).then((comicInfo) => {
        console.log(comicInfo);
        setComicInfo(comicInfo);
    });
    // 获取漫画章节信息
    getComicChapter(comicId).then((chapter) => {
        console.log(chapter);
        setComicImages(comicId, chapter.images);
    });
    window.addEventListener("resize", debounce(setChapterTop, 200));
}
const chapterEle=document.querySelector(".chapter");
function setChapterTop() {
    let top = -chapterEle.offsetHeight + innerHeight - 200;
    chapterEle.style.top = (top < 50 ? top : 50) + "px";
}
function setComicInfo(comicInfo) {
    document.querySelector(
        ".comic-bg"
    ).style.backgroundImage = `url(https://${appState.serverInfo.Server[0]}/media/albums/${comicInfo.id}_3x4.jpg)`;
    const coverImageElement = document.querySelector(".cover img");
    coverImageElement.src = `https://${appState.serverInfo.Server[0]}/media/albums/${comicInfo.id}_3x4.jpg`;
    coverImageElement.title = comicInfo.description;
    const titleElement = document.querySelector(".title span");
    titleElement.textContent = comicInfo.name;
    titleElement.title = comicInfo.name;
    document.querySelector(".like span").innerText = `${convertToEnglishNumber(
        comicInfo.likes
    )}`;
    document.querySelector(".like i").innerText = `(${Math.floor(
        ((comicInfo.likes ? comicInfo.likes : 0) /
            (+comicInfo.total_views ? comicInfo.total_views : 1)) *
            100
    )}%)`;
    document.querySelector(".view span").innerText = convertToEnglishNumber(
        comicInfo.total_views
    );
    document.querySelector(".comic-id").textContent = "——" + comicInfo.id;
    const authorNameDom=document.querySelector(".author")
    authorNameDom.innerHTML = `创作者：${comicInfo.author.map(name=>`<a href="./search.html?wd=${name}">${name}</a>`).join(" & ")}`
    document.querySelector(".tags").innerHTML = comicInfo.tags
        .concat(comicInfo.actors)
        .map((tag) => (tag ? `<a class='tag' href="./search.html?wd=${tag}">${tag}</a>` : ""))
        .join("");
    const seriesElement = document.querySelector(".series");
    if (comicInfo.series.length) {
        seriesElement.parentNode.style.display = "block";
        seriesElement.innerHTML = comicInfo.series
            .map(
                (item, index) =>
                    `<div class="series-item" data-id="${item.id}">第${
                        index + 1
                    }部</div>`
            )
            .join("");
        const activeEle =
            seriesElement.children[
                comicInfo.series.findIndex((i) => i.id == comicInfo.id)
            ];
        activeEle.classList.add("active");
        seriesElement.scroll({
            left: activeEle.offsetLeft - seriesElement.offsetWidth / 2,
            behavior: "smooth",
        });
        seriesElement.addEventListener("click", (e) => {
            if (e.target.className === "series-item") {
                location.href = "./chapter.html?cid=" + e.target.dataset.id;
            }
        });
    }
    document.querySelector(".read").addEventListener("click", () => {
        document.querySelector(".imgs-view").scrollIntoView({
            behavior: "smooth",
        });
    });
    const loading = document.querySelector(".loading-container");
    loading.style.display = "none";

    const collectBtn = document.querySelector(".collect");
    const storage = JSON.parse(localStorage.getItem("collect") || "[]");
    if (storage.findIndex((c) => c.id === comicInfo.id) > -1) {
        collectBtn.classList.add("isCollect");
    }
    collectBtn.addEventListener("click", () => {
        const index = storage.findIndex((c) => c.id === comicInfo.id);
        if (index > -1) {
            collectBtn.classList.remove("isCollect");
            storage.splice(index, 1);
        } else {
            collectBtn.classList.add("isCollect");
            storage.push({
                id: comicInfo.id,
                name: comicInfo.name,
                author: comicInfo.author.join(" "),
            });
        }
        localStorage.setItem("collect", JSON.stringify(storage));
    });
    document.querySelector(
        ".forum h2"
    ).textContent = `评论(${convertToEnglishNumber(comicInfo.comment_total)})`;
    let currentForumPage = 1;
    const loadMoreButton = document.querySelector(".load-more-c");
    loadMoreButton.addEventListener("click", () => {
        loadMoreButton.style.display = "none";
        loadForumComments(comicInfo.id, ++currentForumPage).then(() => {
            loadMoreButton.style.display = "block";
        });
    });
    loadForumComments(comicInfo.id, 1);
    const foldForumBtn = document.querySelector(".fold-forum-btn");
    const forumDom = document.querySelector(".forum");
    foldForumBtn.addEventListener('click',()=>{
        if(forumDom.classList.contains('unfold')){
            foldForumBtn.textContent='展开更多'
            forumDom.classList.remove('unfold')
            window.scrollTo({
                top:forumDom.offsetTop+100,
                behavior:'smooth'
            })
        }else{
            foldForumBtn.textContent='折叠'
            forumDom.classList.add('unfold')
        }
    })
}
function setComicImages(comicId, images) {
    addToggleSeverEvent()
    const imagesContainer = document.querySelector(".comic-imgs");
    const imagesNumberEle = document.querySelector(".imgs-num");
    const imagesLoadNumberEle = document.querySelector(".imgs-loaded-num");
    const controlCanvas = document.querySelector(".control-inner canvas");
    const controlBar = document.querySelector(".control-bar");
    const controlIndex = controlBar.children[0];
    const ctx = controlCanvas.getContext("2d");
    const maxRequestCount = getMaxRequestCount();
    let loadingImgCount = 0;
    let loadedImgCount = 0;
    const waitingImgs = [];
    const maxWaitingCount = 3;
    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            if (entry.target.height > 0) {
                resizeObserver.unobserve(entry.target);
                let imageElement = entry.target.parentNode;
                imageElement.style.height = entry.target.height + "px";
                imageElement.ontransitionend = () => {
                    imageElement.ontransitionend = null;
                    imageElement.style.height = null;
                };
            }
        }
    });
    const intersectionObserver = new IntersectionObserver(
        (entries) => {
            for (let entry of entries) {
                if (entry.isIntersecting) {
                    const index = +entry.target.dataset.index + 1;
                    controlBar.style.top = (index / DomCount) * 100 + "%";
                    controlIndex.textContent = index;
                    if (entry.target.dataset.isIntersected) continue;
                    entry.target.dataset.isIntersected = "true";
                    const imgDom = entry.target.children[1];
                    const imgBg = entry.target.children[0];
                    if (loadingImgCount >= maxRequestCount) {
                        imgBg.textContent = "排队中...";
                        waitingImgs.unshift(entry.target);
                        if (waitingImgs.length > maxWaitingCount) {
                            const ele = waitingImgs.pop();
                            ele.dataset.isIntersected = "";
                        }
                    } else {
                        _loadImg(entry.target);
                    }

                    imgDom.onload = () => {
                        loadedImgCount++;
                        loadingImgCount--;
                        imagesLoadNumberEle.textContent = `${loadedImgCount}(${(
                            (loadedImgCount / DomCount) *
                            100
                        ).toFixed(2)}%)`;
                        resizeObserver.unobserve(imgDom);
                        entry.target.style.height = null
                        if (comicId >= 220980 && !/.gif/.test(images[index])) {
                            const page = images[index - 1].substring(0, 5);
                            entry.target.append(
                                cutImage(imgDom, comicId, page)
                            );
                            imgDom.remove();
                        }else{
                            imgDom.style.filter='none'
                        }

                        imgBg.remove();
                        _drawImgLoadEnd(index - 1);
                        const waitingImg = waitingImgs.pop();
                        if (!waitingImg) return;
                        _loadImg(waitingImg);
                    };
                    imgDom.onerror = () => {
                        loadingImgCount--;
                        entry.target.classList.add("error-img");
                        _drawImgLoadError(index - 1);
                        entry.target.addEventListener(
                            "click",
                            () => {
                                imgDom.src = `https://${appState.serverInfo.imgServer[appState.serverInfo.usingImgServerIndex]}${entry.target.dataset.pathName}`;
                                imgBg.textContent = "加载中...";
                                entry.target.classList.remove("error-img");
                                entry.target.style.height='500px'
                            },
                            {
                                once: true,
                            }
                        );
                        imgBg.textContent = "错误(点击重试)";
                    };
                }
            }
        },
        {
            rootMargin: "50px",
        }
    );
    const DomCount = images.length;
    const oneFrame = 10;
    let curCount = 0;

    imagesNumberEle.textContent = DomCount;
    function _loadImg(imgContainer) {
        const imgDom = imgContainer.children[1];
        const imgBg = imgContainer.children[0];
        imgBg.textContent = "加载中...";
        resizeObserver.observe(imgDom);
        imgDom.src = `https://${appState.serverInfo.imgServer[appState.serverInfo.usingImgServerIndex]}${imgContainer.dataset.pathName}`;
        loadingImgCount++;
    }
    function _set() {
        for (let i = 0; i < oneFrame; i++) {
            const imgContainer = document.createElement("div");
            const imgBg = document.createElement("div");
            const imgDom = new Image();
            imgContainer.className = "image";
            imgContainer.style.height = "500px";
            imgContainer.dataset.pathName = `/media/photos/${comicId}/${images[curCount]}`;
            imgContainer.dataset.index = curCount;
            intersectionObserver.observe(imgContainer);
            imgBg.className = "image-bg";
            imgBg.textContent = curCount + 1;
            imgContainer.append(imgBg, imgDom);
            imagesContainer.append(imgContainer);
            curCount++;

            if (curCount === DomCount) return;
        }
        if (curCount < DomCount) requestAnimationFrame(_set);
    }
    const chunkHeight = controlCanvas.height / DomCount;

    function _drawImgLoadEnd(index) {
        ctx.fillStyle = "#db547c";
        ctx.fillRect(
            0,
            Math.floor(index * chunkHeight),
            controlCanvas.width,
            Math.ceil(chunkHeight)
        );
    }
    function _drawImgLoadError(index) {
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(
            0,
            Math.floor(index * chunkHeight),
            controlCanvas.width,
            Math.ceil(chunkHeight)
        );
    }
    let elementTop = 0;
    let touchY = 0;
    function dragStart(y) {
        controlIndex.classList.add("draging");
        let progress = y / controlCanvas.offsetHeight;
        controlIndex.textContent = Math.ceil(progress * (DomCount - 1)) + 1;
        controlBar.style.top = progress * 100 + "%";
    }
    function draging(y) {
        if (y < 0) y = 0;
        else if (y > controlCanvas.offsetHeight) y = controlCanvas.offsetHeight;
        let progress = y / controlCanvas.offsetHeight;
        controlIndex.textContent = Math.ceil(progress * (DomCount - 1)) + 1;
        controlBar.style.top = progress * 100 + "%";
    }
    function dragEnd(y) {
        controlIndex.classList.remove("draging");
        if (y < 0) y = 0;
        else if (y > controlCanvas.offsetHeight) y = controlCanvas.offsetHeight;
        let progress = y / controlCanvas.offsetHeight;
        const ele =
            imagesContainer.children[Math.ceil(progress * (DomCount - 1))];
        if (ele) ele.scrollIntoView();
    }
    function onMouseMove(e) {
        draging(e.clientY - elementTop);
    }
    function onMouseUp(e) {
        dragEnd(e.clientY - elementTop);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    }
    controlCanvas.addEventListener("mousedown", (e) => {
        elementTop = controlCanvas.getBoundingClientRect().top;
        dragStart(e.layerY);
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    });
    controlCanvas.addEventListener(
        "touchstart",
        (e) => {
            elementTop = controlCanvas.getBoundingClientRect().top;
            touchY = e.touches[0].clientY - elementTop;
            dragStart(touchY);
            e.preventDefault();
        },
        {
            passive: false,
        }
    );
    controlCanvas.addEventListener(
        "touchmove",
        (e) => {
            touchY = e.touches[0].clientY - elementTop;
            draging(touchY);
        },
        {
            passive: false,
        }
    );
    controlCanvas.addEventListener("touchend", (e) => {
        dragEnd(touchY);
    });
    _set();
}
async function loadForumComments(albumId, page) {
    const forumResponse = await retryFetch(
        `https://${appState.serverInfo.Server[0]}/forum?page=${page}&mode=manhua&aid=${albumId}`,
        {
            headers: {
                token: appState.accessToken.token,
                tokenParam: appState.accessToken.tokenParam,
            },
            redirect: "follow",
        },
        3
    );
    const forumData = await forumResponse.json();
    const commentList = decryptData(appState.currentKey, forumData.data).list;
    document.querySelector(".forum-inner").innerHTML += commentList
        .map((comment) => {
            if (comment.photo === "nopic-Male.gif") {
                comment.photo = "./images/default.jpeg";
            } else {
                comment.photo = `https://${appState.serverInfo.Server[0]}/media/users/${comment.photo}`;
            }
            return `
        <div class="f-item">
            <div class="user-msg">
                <div class="user-img">
                    <img src="${comment.photo}" alt="">
                </div>
                <div class="user-name">${comment.username}</div>
            </div>
            <div class="f-text">${comment.content}</div>
        </div>
        `;
        })
        .join("");
    setChapterTop();
}
function getMaxRequestCount() {
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    if (currentHour <= 3) {
        return 1;
    } else if (currentHour >= 21) {
        return 1;
    } else if (currentHour >= 18) {
        return 3;
    }
    return 5;
}
function addToggleSeverEvent(){
    const toggleSeverDom=document.querySelector('.toggle-server')
    const severMenuDom=toggleSeverDom.querySelector('.server-menu')
    const toggleSeverDomText=toggleSeverDom.querySelector('span')
    const setting=getSetting()
    
    // const severItemDoms=document.querySelectorAll('.sever-item')
    for(let i=0;i<appState.serverInfo.imgServer.length;i++){
        const severItemDom=document.createElement('a')
        severItemDom.className='sever-item'
        severItemDom.textContent=`线路${i+1}`
        severMenuDom.appendChild(severItemDom)
        severItemDom.addEventListener('click',()=>{
            appState.serverInfo.usingImgServerIndex=i
            toggleSeverDomText.textContent=`线路${i+1}`
            setting['img-server']=i.toString()
            setSetting(setting)
        })
    }
    appState.serverInfo.usingImgServerIndex=setting['img-server']
    toggleSeverDomText.textContent=`线路${parseInt(setting['img-server'])+1}`
}