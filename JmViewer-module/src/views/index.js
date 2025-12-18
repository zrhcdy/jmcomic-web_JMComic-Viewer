import { getPromotionContent } from "../api/request.js";
import appState from "../store/appState.js";
import { createComicPromotionHTML } from "./promotion.js";
import { createBookItemObserver } from "../dom/observer.js";

export async function updateIndexPage() {
    const promotionContent = await getPromotionContent();
    const mainElement = document.querySelector(".main");
    mainElement.innerHTML = promotionContent
        .map((promotion) => createComicPromotionHTML(promotion))
        .join("");
    const promotionElements = document.querySelectorAll(".comic-promote");
    const observer = createBookItemObserver()
    promotionElements.forEach((element) => {
        addPromotionEvent(element, observer);
    });
}
function addPromotionEvent(element, observer) {
    let currentLeft = 0;
    let itemCount = 15;
    const scrollBarInner = element.querySelector(".bar-inner");
    const nextButton = element.querySelector(".next-btn");
    const innerElement = element.querySelector(".inner");
    for (let item of innerElement.children) {
        observer.observe(item);
    }
    nextButton.addEventListener("click", () => {
        if (currentLeft === itemCount - 1) return;
        currentLeft++;
        innerElement.style.transform = `translateX(-${currentLeft * 300}px)`;
        scrollBarInner.style.marginLeft =
            currentLeft * ((1 / itemCount) * 100) + "%";
    });
    scrollBarInner.style.width = (1 / itemCount) * 100 + "%";
    let startX = 0;
    let startY = 0;
    let deltaX = 0;
    let isMouseDown = false;
    let isHorizontalDrag = false;
    let clickStartTime = 0;

    /**
     * 鼠标按下事件处理函数
     * @param {MouseEvent} event 鼠标事件
     */
    function onMouseDown(event) {
        startX = event.pageX;
        innerElement.style.transition = "none";
        scrollBarInner.style.transition = "none";
        isMouseDown = true;
        event.preventDefault();
        clickStartTime = Date.now();
    }

    /**
     * 鼠标移动事件处理函数
     * @param {MouseEvent} event 鼠标事件
     */
    function onMouseMove(event) {
        if (!isMouseDown) return;
        event.preventDefault();
        deltaX = event.pageX - startX;
        let x=currentLeft * 300 - deltaX
        if(x<0)x=0
        if(x>(itemCount-1)*300)x=(itemCount-1)*300
        innerElement.style.transform = `translateX(-${
            x
        }px)`;
        scrollBarInner.style.marginLeft =
            (currentLeft - deltaX / 300) * ((1 / itemCount) * 100) + "%";
    }

    /**
     * 鼠标抬起事件处理函数
     * @param {MouseEvent} event 鼠标事件
     */
    function onMouseUp(event) {
        if (!isMouseDown) return;
        isMouseDown = false;
        innerElement.style.transition = null;
        scrollBarInner.style.transition = null;
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                currentLeft -= Math.ceil(deltaX / 300);
            } else {
                currentLeft -= Math.floor(deltaX / 300);
            }
            if (currentLeft > itemCount - 1) currentLeft = itemCount - 1;
            else if (currentLeft < 0) currentLeft = 0;
        }
        if (Math.abs(deltaX) < 5 && Date.now() - clickStartTime < 200) {
            let targetElement = event.target;
            if (targetElement.classList.contains('book-item')) {
                open("./chapter.html?cid=" + targetElement.dataset.cid);
            }
        }
        innerElement.style.transform = `translateX(-${currentLeft * 300}px)`;
        scrollBarInner.style.marginLeft =
            currentLeft * ((1 / itemCount) * 100) + "%";
        deltaX = 0;
        startX = 0;
    }

    /**
     * 触摸开始事件处理函数
     * @param {TouchEvent} event 触摸事件
     */
    function onTouchDown(event) {
        startX = event.touches[0].pageX;
        startY = event.touches[0].pageY;
        innerElement.style.transition = "none";
        scrollBarInner.style.transition = "none";
        isMouseDown = true;
        innerElement.addEventListener(
            "touchmove",
            (e) => {
                if (
                    Math.abs(e.touches[0].pageX - startX) >
                    Math.abs(e.touches[0].pageY - startY)
                ) {
                    isHorizontalDrag = true;
                } else {
                    isMouseDown = false;
                    innerElement.style.transition = null;
                    scrollBarInner.style.transition = null;
                }
            },
            { once: true, passive: true }
        );
        clickStartTime = Date.now();
    }

    /**
     * 触摸移动事件处理函数
     * @param {TouchEvent} event 触摸事件
     */
    function onTouchMove(event) {
        if (!isMouseDown) return;
        if (isHorizontalDrag) {
            event.preventDefault();
        }
        deltaX = event.touches[0].pageX - startX;
        let x=currentLeft * 300 - deltaX
        if(x<0)x=0
        if(x>(itemCount-1)*300)x=(itemCount-1)*300
        innerElement.style.transform = `translateX(-${
            x
        }px)`;
        scrollBarInner.style.marginLeft =
            (currentLeft - deltaX / 300) * ((1 / itemCount) * 100) + "%";
    }

    /**
     * 触摸结束事件处理函数
     * @param {TouchEvent} event 触摸事件
     */
    function onTouchUp(event) {
        if (!isMouseDown) return;
        isMouseDown = false;
        innerElement.style.transition = null;
        scrollBarInner.style.transition = null;
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                currentLeft -= Math.ceil(deltaX / 300);
            } else {
                currentLeft -= Math.floor(deltaX / 300);
            }
            if (currentLeft > itemCount - 1) currentLeft = itemCount - 1;
            else if (currentLeft < 0) currentLeft = 0;
        }
        if (Math.abs(deltaX) < 5 && Date.now() - clickStartTime < 200) {
            let targetElement = event.target;
            if (targetElement.classList.contains('book-item')) {
                open("./chapter.html?cid=" + targetElement.dataset.cid);
            }
        }
        innerElement.style.transform = `translateX(-${currentLeft * 300}px)`;
        scrollBarInner.style.marginLeft =
            currentLeft * ((1 / itemCount) * 100) + "%";
        deltaX = 0;
        startX = 0;
    }

    innerElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    innerElement.addEventListener("touchstart", onTouchDown, {
        passive: true,
    });
    innerElement.addEventListener("touchmove", onTouchMove, {
        cancelable: false,
    });
    innerElement.addEventListener("touchend", onTouchUp, {
        passive: true,
    });
}
