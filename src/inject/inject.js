function getExpandButtons(container, processed) {
    return Array.from(container?.querySelectorAll(".k-hierarchy-cell > a") ?? [])
        .filter(({ style }) => style.display !== "none")
        .filter((button) => processed.indexOf(button) === -1);
}

function expandAllInnerSections(container) {
    let processed = [];

    let buttons = getExpandButtons(container, processed);
    while (buttons.length > 0) {
        for (const button of buttons) {
            button.click();
            button.click();
        }

        processed = [...processed, ...buttons];
        buttons = getExpandButtons(container, processed);
    }

    return processed;
}

function extractItems(container) {
    return Array.from(container?.querySelectorAll(':scope > td > div > table > tbody[role="rowgroup"] > tr.k-master-row') ?? []).reduce(
        (result, element) => {
            const [nameElement, valueElement] = element.querySelectorAll('td[role="gridcell"]');

            if (nameElement) {
                const children = element.nextElementSibling?.classList.contains("k-detail-row")
                    ? extractItems(element.nextElementSibling)
                    : [];

                if (Object.keys(children).length > 0) {
                    return { ...result, [nameElement.innerText]: children };
                } else if (children.length === 0 && valueElement) {
                    return { ...result, [nameElement.innerText]: valueElement.innerText };
                }
            }

            return result;
        },
        {}
    );
}

function copyClick(target) {
    if (target) {
        const row = target.closest(".k-master-row");

        const expandButton = row?.querySelector(".k-hierarchy-cell > a");
        expandButton?.click();
        expandButton?.click();

        const detailsContainer = row?.nextElementSibling;

        expandAllInnerSections(detailsContainer);

        return extractItems(detailsContainer);
    } else {
        return {};
    }
}

function copyShortClick(event) {
    const { customDimensions, details } = copyClick(event?.target);
    const text = JSON.stringify({ customDimensions, details }, null, 4);

    console.log("Copied", text);
    parent.postMessage({ copy: text }, "*");
}

function copyFullClick(event) {
    const result = copyClick(event?.target);
    const text = JSON.stringify(result, null, 4);

    console.log("Copied", text);
    parent.postMessage({ copy: text }, "*");
}

chrome.extension.sendMessage({}, function (response) {
    const readyStateCheckInterval = setInterval(function () {
        const root = document.querySelector("#discover-app-container");
        if (document.readyState === "complete" && root) {
            clearInterval(readyStateCheckInterval);
            const root = document.querySelector("#discover-app-container");
            const observer = new MutationObserver((mutationsList, observer) => {
                const items = document.querySelectorAll(
                    "#results-view-content div.k-grid-content > table[role='treegrid'] > tbody > tr.k-master-row > td:nth-child(2)"
                );
                if (items) {
                    for (const cell of items) {
                        if (cell.innerHTML.indexOf("<a") === -1) {
                            const buttonFull = document.createElement("a");
                            buttonFull.href = "javascript:;";
                            buttonFull.classList.add("copy-button");
                            buttonFull.tabIndex = -1;
                            buttonFull.innerText = "Copy full";
                            buttonFull.addEventListener("click", copyFullClick);
                            cell.appendChild(buttonFull);

                            const buttonShort = document.createElement("a");
                            buttonShort.href = "javascript:;";
                            buttonShort.classList.add("copy-button");
                            buttonShort.tabIndex = -1;
                            buttonShort.innerText = "Copy short";
                            buttonShort.addEventListener("click", copyShortClick);
                            cell.appendChild(buttonShort);
                        }
                    }
                }
            });
            observer.observe(root, { subtree: true, childList: true });
        }
    }, 300);
});
