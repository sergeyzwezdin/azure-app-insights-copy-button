chrome.extension.sendMessage({}, function (response) {
    const readyStateCheckInterval = setInterval(function () {
        if (document.readyState === "complete") {
            clearInterval(readyStateCheckInterval);

            window.addEventListener(
                "message",
                function (event) {
                    if (event.data.copy) {
                        navigator.clipboard.writeText(event.data.copy);
                    }
                },
                false
            );
        }
    }, 5);
});
