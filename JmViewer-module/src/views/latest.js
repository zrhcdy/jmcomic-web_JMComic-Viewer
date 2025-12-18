import { getLatestContent } from "../api/request.js";
import { createBookItemsHTML } from "./promotion.js";
import { createBookItemObserver } from "../dom/observer.js";
import { infinityScroll } from "./image.js"; // 假设无限滚动逻辑也抽出到 image.js

export async function updateLatestPage() {
    const latestContent = await getLatestContent(1);
    const latestComicsElement = document.querySelector(".comics-latest");
    latestComicsElement.innerHTML = createBookItemsHTML(latestContent);
    const observer = createBookItemObserver()
    infinityScroll(observer, latestComicsElement, async (currentPage) => {
        const newLatestContent = await getLatestContent(currentPage);
        latestComicsElement.innerHTML += createBookItemsHTML(newLatestContent);
    });

    latestComicsElement.addEventListener("click", (event) => {
        if (event.target.classList.contains('book-item')) {
            open("./chapter.html?cid=" + event.target.dataset.cid);
        }
    });
}