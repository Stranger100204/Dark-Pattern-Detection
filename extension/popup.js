// ── SIGNAL → HUMAN READABLE DESCRIPTIONS ──
const SIGNAL_DESCRIPTIONS = {
    subscription_visible: {
        text: "Subscription push is aggressive",
        severity: "moderate"
    },
    cancel_not_visible: {
        text: "No cancel option found on this page",
        severity: "critical"
    },
    cancel_hidden: {
        text: "Cancel option exists but is hidden",
        severity: "high"
    },
    support_only_cancel: {
        text: "You can only cancel by contacting support",
        severity: "high"
    },
    euphemism_used: {
        text: 'Cancel is buried under "Manage Plan" or "Settings"',
        severity: "moderate"
    },
    cta_asymmetry: {
        text: "Many subscribe buttons, no visible cancel",
        severity: "high"
    },
    confirmshaming: {
        text: "Decline button uses guilt language to stop you",
        severity: "high"
    }
};

// ── SIGNAL → ACTIONABLE ADVICE ──
const SIGNAL_ACTIONS = {
    support_only_cancel: [
        'Search: "how to cancel [site name]"',
        "Ask your bank to block future charges"
    ],
    cancel_not_visible: [
        "Try: Account → Subscription → Cancel",
        "Try: Settings → Billing → Cancel Plan"
    ],
    cancel_hidden: [
        'Look under "Manage Plan" or "Preferences"',
        "Try: Account → Manage Subscription"
    ],
    euphemism_used: [
        'Look for "Manage Plan" — cancel is hidden there',
        "Check Settings and Billing sections carefully"
    ],
    cta_asymmetry: [
        "Check cancellation policy before signing up",
        "Screenshot your subscription confirmation"
    ],
    confirmshaming: [
        "Ignore the guilt language — declining is your right",
        "The dismissive button still works — click it"
    ],
    subscription_visible: [
        "Read the fine print before starting any trial",
        "Set a calendar reminder before trial ends"
    ]
};

// ── UTILITIES ──
function severityClass(severity) {
    return (severity || "low").toLowerCase();
}

function timeAgo(isoString) {
    if (!isoString) return "Unknown";
    const diff = Date.now() - new Date(isoString).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

function buildSignals(signals) {
    const ul = document.getElementById("signals");
    ul.innerHTML = "";

    let hasSignals = false;

    Object.keys(signals).forEach(key => {
        if (!signals[key]) return;
        hasSignals = true;

        const desc = SIGNAL_DESCRIPTIONS[key];
        if (!desc) return;

        const li = document.createElement("li");
        li.className = "signal";
        li.innerHTML = `
            <span class="signal-dot dot-${desc.severity}"></span>
            <span>${desc.text}</span>
        `;
        ul.appendChild(li);
    });

    if (!hasSignals) {
        ul.innerHTML = `<li class="no-detection">No manipulation signals found</li>`;
    }
}

function buildActions(signals) {
    const ul = document.getElementById("actions-list");
    ul.innerHTML = "";

    const seen = new Set();

    Object.keys(signals).forEach(key => {
        if (!signals[key]) return;
        const actions = SIGNAL_ACTIONS[key] || [];
        actions.forEach(action => {
            if (seen.has(action)) return;
            seen.add(action);

            const li = document.createElement("li");
            li.className = "action";
            li.innerHTML = `
                <span class="action-arrow">→</span>
                <span>${action}</span>
            `;
            ul.appendChild(li);
        });
    });

    if (seen.size === 0) {
        ul.innerHTML = `<li class="no-detection">No actions needed</li>`;
    }
}

function buildMemory(domain, currentScore, currentSeverity) {
    chrome.storage.local.get(["siteDatabase"], function (data) {
        const db = data.siteDatabase || {};
        const prev = db[domain];
        const memoryEl = document.getElementById("memory-content");

        if (!prev || !prev.lastChecked) {
            memoryEl.innerHTML = `
                <span class="memory-first">First time analyzing this site</span>
            `;
            return;
        }

        memoryEl.innerHTML = `
            <div class="memory-row">
                <span>Last checked</span>
                <span class="memory-val">${timeAgo(prev.lastChecked)}</span>
            </div>
            <div class="memory-row">
                <span>Previous score</span>
                <span class="memory-val">${prev.score}% — ${prev.severity}</span>
            </div>
        `;
    });
}

function renderResult(data, domain) {
    const sev = severityClass(data.severity);

    // Header domain
    document.getElementById("header-domain").textContent = domain;

    // Pattern + severity badge
    document.getElementById("pattern").textContent = data.pattern;
    const badgeEl = document.getElementById("severity");
    badgeEl.textContent = data.severity;
    badgeEl.className = `badge badge-${sev}`;

    // Risk % + color + bar
    const riskEl = document.getElementById("risk");
    riskEl.textContent = data.risk_percentage + "%";
    riskEl.className = `risk-percentage color-${sev}`;

    const barFill = document.getElementById("bar-fill");
    barFill.style.width = data.risk_percentage + "%";
    barFill.className = `bar-fill bar-${sev}`;

    // Signals
    buildSignals(data.signals);

    // Actions
    buildActions(data.signals);

    // Site memory
    buildMemory(domain, data.risk_percentage, data.severity);
}

// ── MAIN ──
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

    const patternEl = document.getElementById("pattern");
    const url = tabs[0].url;
    const domain = new URL(url).hostname;

    if (url.startsWith("chrome://")) {
        patternEl.textContent = "Unavailable";
        document.getElementById("signals").innerHTML =
            "<li>Cannot analyze Chrome pages</li>";
        return;
    }

    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
            if (window.darkPatternResult) return window.darkPatternResult;
            const elements = extractElements();
            return detectForcedContinuity(elements, window.location.href);
        }
    }, (results) => {

        if (!results || !results[0] || !results[0].result) {
            patternEl.textContent = "Unavailable";
            document.getElementById("signals").innerHTML =
                "<li>No detection results</li>";
            return;
        }

        renderResult(results[0].result, domain);
    });
});