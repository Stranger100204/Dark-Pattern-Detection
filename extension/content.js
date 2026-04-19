let bannerDismissed = false;

function extractElements() {

    const elements = [];
    const selectors = ["button", "a", "input", "h1", "h2", "h3", "p"];

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

function getPageContext() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();

    // Blocklist — sites that are just search engines or news
    const NON_SUBSCRIPTION_DOMAINS = [
        'google.com', 'bing.com', 'yahoo.com',
        'reddit.com', 'wikipedia.org', 'youtube.com'
    ];

    if (NON_SUBSCRIPTION_DOMAINS.some(d => hostname.includes(d))) {
        return 'excluded';
    }

    if (url.includes('account') || url.includes('billing') ||
        url.includes('subscription') || url.includes('plan')) {
        return 'account_page';
    }
    if (url.includes('signup') || url.includes('register') ||
        url.includes('trial') || url.includes('pricing')) {
        return 'signup_page';
    }
    return 'general_page';
}

function showWarningBanner(result) {
    if (bannerDismissed) return;

    // Don't show duplicate banners
    if (document.getElementById('dp-warning-banner')) return;

    const pageContext = getPageContext();

    // Dont run on excluded domains
    if (pageContext === 'excluded') return;

    // Only banner on relevant pages
    if (pageContext === 'general_page' &&
        result.severity !== 'High' &&
        result.severity !== 'Critical'
    ) return;

    const colors = {
        Critical: '#dc2626',
        High: '#ea580c',
        Moderate: '#ca8a04',
        Low: '#16a34a'
    };

    const color = colors[result.severity] || '#64748b';

    const banner = document.createElement('div');
    banner.id = 'dp-warning-banner';
    banner.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%;
        background: ${color};
        color: white;
        padding: 10px 16px;
        font-size: 13px;
        font-family: Arial, sans-serif;
        z-index: 2147483647;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        box-sizing: border-box;
    `;

    banner.innerHTML = `
        <span>
            ⚠️ <strong>Dark Pattern Detected</strong> —
            ${result.severity} Risk (${result.risk_percentage}%)
            · Click extension icon for details
        </span>
        <button id="dp-close-btn"
            style="background:none; border:none; color:white;
                   font-size:16px; cursor:pointer; padding:0 4px;">
            ✕
        </button>
    `;

    document.body.prepend(banner);
    document.getElementById('dp-close-btn').addEventListener('click', function () {
        bannerDismissed = true;
        document.getElementById('dp-warning-banner').remove();
    });
}

// Run analysis after page loads
function runDetection() {

    const elements = extractElements();
    const result = detectForcedContinuity(elements, window.location.href);

    // Store result globally for popup to read
    window.darkPatternResult = result;

    // Save to chrome.storage for site memory
    const domain = window.location.hostname;
    chrome.storage.local.get(['siteDatabase'], function (data) {
        const db = data.siteDatabase || {};
        db[domain] = {
            score: result.risk_percentage,
            severity: result.severity,
            signals: result.signals,
            reasons: result.reasons,
            lastChecked: new Date().toISOString()
        };
        chrome.storage.local.set({ siteDatabase: db });
    });

    // Show banner if risky
    if (result.risk_percentage >= 40) {
        showWarningBanner(result);
    }

    console.log("Dark Pattern Detector:", result);
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