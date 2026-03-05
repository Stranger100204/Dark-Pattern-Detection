function extractElements() {

    const elements = [];
    const selectors = ["button","a","input","h1","h2","h3","p"];

    selectors.forEach(selector => {

        document.querySelectorAll(selector).forEach(el => {

            const text =
                el.innerText ||
                el.value ||
                el.getAttribute("aria-label") ||
                el.getAttribute("title") ||
                "";

            const visible =
                el.offsetParent !== null &&
                window.getComputedStyle(el).visibility !== "hidden";

            elements.push({
                type: selector,
                text: text.trim().toLowerCase(),
                visible: visible,
                attributes: {
                    id: el.id || "",
                    class: el.className || ""
                }
            });

        });

    });

    return elements;
}


// Run analysis after page loads
function runDetection() {

    const elements = extractElements();

    const result = detectForcedContinuity(elements, window.location.href);

    window.darkPatternResult = result;

    console.log("Dark Pattern Detector Result:", result);

}


// Run once initially
setTimeout(runDetection, 2000);


// Watch for dynamic page updates (Spotify, Netflix, etc.)
const observer = new MutationObserver(() => {

    runDetection();

});

observer.observe(document.body, {
    childList: true,
    subtree: true
});