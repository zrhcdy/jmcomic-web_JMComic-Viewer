import { getSearchResults } from "../api/request.js";
import { createBookItemObserver } from "../dom/observer.js";
import { infinityScroll } from "./image.js";
import { createBookItemsHTML } from "./promotion.js";
export function updateSearchInput() {
    const searchButton = document.querySelector(".search");
    searchButton.addEventListener("click", () => {
        searchButton.style.display = "none";
        searchInput.parentNode.parentNode.style.display = "block";
        searchInput.focus();
        searchInput.parentNode.parentNode.classList.add("search-box-ani");
    });
    const searchInput = document.querySelector(".search-box input");
    searchInput.parentNode.addEventListener("submit", (event) => {
        event.preventDefault();
        const searchQuery = searchInput.value;
        if (searchQuery === "") return;
        if (Number.isInteger(+searchQuery) && searchQuery >= 10) {
            location.href = "./chapter.html?cid=" + searchQuery;
        } else {
            location.href = "./search.html?wd=" + searchQuery.replace(" ", "");
        }
    });
}
export async function updateSearchPage() {
    const searchQuery = new URLSearchParams(location.search).get("wd");
    if (!searchQuery) {
        location.href = "./index.html";
    }

    // 获取第一页搜索结果
    const searchResults = await getSearchResults(searchQuery, 1);
    const searchResultsElement = document.querySelector(".comics-result");
    const noMoreEle = searchResultsElement.nextElementSibling;
    searchResultsElement.innerHTML = createBookItemsHTML(searchResults.content);
    const observer = createBookItemObserver();
    const resultLength = 80;
    searchResultsElement.addEventListener("click", (event) => {
        if (event.target.classList.contains('book-item')) {
            open("./chapter.html?cid=" + event.target.dataset.cid);
        }
    });
    if (searchResults.content.length < resultLength) {
        for (let item of searchResultsElement.querySelectorAll(".b-waiting")) {
            observer.observe(item);
        }
        noMoreEle.style.display = "block";
        return;
    }
    infinityScroll(
        observer,
        searchResultsElement,
        async (currentPage, removeScrollEvent) => {
            const result = await getSearchResults(searchQuery, currentPage);
            searchResultsElement.innerHTML += createBookItemsHTML(
                result.content
            );
            if (result.content.length < resultLength) {
                removeScrollEvent();
                noMoreEle.style.display = "block";
            }
        }
    );
}
