chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {

    const patternEl = document.getElementById("pattern");
    const severityEl = document.getElementById("severity");
    const riskEl = document.getElementById("risk");
    const signalsEl = document.getElementById("signals");

    const url = tabs[0].url;

    if (url.startsWith("chrome://")) {
        patternEl.textContent = "Unavailable";
        severityEl.textContent = "--";
        riskEl.textContent = "--";
        signalsEl.innerHTML = "<li>Cannot analyze Chrome pages</li>";
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {

            const elements = extractElements();

            const result = detectForcedContinuity(elements, window.location.href);

            return result;

        }
    }, (results) => {

        if (!results || !results[0] || !results[0].result) {
            patternEl.textContent = "Unavailable";
            severityEl.textContent = "--";
            riskEl.textContent = "--";
            signalsEl.innerHTML = "<li>No detection results</li>";
            return;
        }

        const data = results[0].result;

        patternEl.textContent = data.pattern;
        severityEl.textContent = data.severity;
        riskEl.textContent = data.risk_percentage + "%";

        signalsEl.innerHTML = "";

        Object.keys(data.signals).forEach(sig => {
            if (data.signals[sig]) {

                const li = document.createElement("li");
                li.textContent =
                sig.replace(/_/g, " ")
                    .replace(/\b\w/g, c => c.toUpperCase());

                signalsEl.appendChild(li);

            }
        });

    });

});