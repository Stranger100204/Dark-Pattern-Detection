# -------------------- KEYWORD DEFINITIONS --------------------

STRONG_CANCEL = [
    "cancel subscription",
    "cancel membership",
    "unsubscribe",
    "end subscription",
    "cancel premium"
]

WEAK_CANCEL = ["cancel"]

SUBSCRIBE_KEYWORDS = [
    "subscribe", "start", "trial",
    "buy", "upgrade", "premium",
    "get", "try", "join"
]

MANAGE_KEYWORDS = ["manage", "billing", "preferences", "settings"]

SUPPORT_KEYWORDS = ["contact", "support", "help", "email", "call"]

PRICING_KEYWORDS = ["pricing", "plan", "billing", "payment", "subscription"]

TRANSPARENCY_KEYWORDS = [
    "cancel anytime",
    "cancel at any time",
    "no commitment",
    "no cancellation fee",
    "easy to cancel"
]


# -------------------- UTILITY FUNCTION --------------------

def keyword_match(text, keywords):
    return any(k in text for k in keywords)


# -------------------- SCORING CONFIG --------------------

SIGNAL_WEIGHTS = {
    "subscription_visible": 2,
    "cancel_not_visible": 3,
    "cancel_hidden": 2,
    "support_only_cancel": 2,
    "euphemism_used": 1,
    "cta_asymmetry": 2
}


def calculate_score(signals):
    score = 0
    for key, active in signals.items():
        if active:
            score += SIGNAL_WEIGHTS.get(key, 0)
    return score

def classify_severity(score):
    if score >= 10:
        return "Critical"
    elif score >= 7:
        return "High"
    elif score >= 4:
        return "Moderate"
    else:
        return "Low"

# -------------------- MAIN DETECTION FUNCTION --------------------

def detect_forced_continuity(elements, url):
    ACCOUNT_INDICATORS = ["account", "billing", "subscription", "settings", "dashboard"]
    MARKETING_INDICATORS = ["pricing", "plans", "premium", "upgrade"]

    page_type = "unknown"

    if any(k in url.lower() for k in ACCOUNT_INDICATORS):
        page_type = "account"
    elif any(k in url.lower() for k in MARKETING_INDICATORS):
        page_type = "marketing"

    subscribe_visible = False
    cancel_present = False
    cancel_visible = False
    euphemism_present = False
    support_only_cancel = False
    subscription_context = False

    subscription_cta_count = 0
    cancel_cta_count = 0
    transparency_present = False

    for el in elements:
        text = (el.get("text") or "").lower()
        visible = el.get("visible", False)

        element_id = (el.get("attributes", {}).get("id") or "").lower()
        element_class = (el.get("attributes", {}).get("class") or "").lower()

        if keyword_match(text, TRANSPARENCY_KEYWORDS):
            transparency_present = True
            
        # ---------------- SUBSCRIPTION DETECTION ----------------
        if keyword_match(text, SUBSCRIBE_KEYWORDS):
            subscription_context = True
            if visible:
                subscribe_visible = True
                subscription_cta_count += 1

        if keyword_match(text, PRICING_KEYWORDS):
            subscription_context = True

        # ---------------- STRONG CANCEL DETECTION ----------------
        if keyword_match(text, STRONG_CANCEL):
            cancel_present = True
            if visible:
                cancel_visible = True
                cancel_cta_count += 1

        # ---------------- WEAK CANCEL DETECTION ----------------
        elif keyword_match(text, WEAK_CANCEL):

            if subscription_context and visible:

                # Ignore cookie/filter/modal noise
                if "filter" not in element_id and \
                   "cookie" not in element_class and \
                   "close" not in element_class:

                    cancel_present = True
                    cancel_visible = True
                    cancel_cta_count += 1

        # ---------------- EUPHEMISM DETECTION ----------------
        if keyword_match(text, MANAGE_KEYWORDS):
            euphemism_present = True

        # ---------------- SUPPORT-ONLY FLOW DETECTION ----------------
        if keyword_match(text, SUPPORT_KEYWORDS) and subscription_context and not cancel_present:
            support_only_cancel = True

    # ---------------- SIGNAL ACTIVATION ----------------

    signals = {
        "subscription_visible": False,
        "cancel_not_visible": False,
        "cancel_hidden": False,
        "support_only_cancel": False,
        "euphemism_used": False,
        "cta_asymmetry": False
    }

    reasons = []

    if subscription_context:

        if subscribe_visible:
            signals["subscription_visible"] = True
            reasons.append("Subscription CTA visible")

        if not cancel_present and page_type == "account":
            signals["cancel_not_visible"] = True
            reasons.append("No cancel option found on account page")

        elif cancel_present and not cancel_visible:
            signals["cancel_hidden"] = True
            reasons.append("Cancel option hidden")

        if euphemism_present and not cancel_present:
            signals["euphemism_used"] = True
            reasons.append("Euphemistic management options instead of cancel")

        if support_only_cancel:
            signals["support_only_cancel"] = True
            reasons.append("Cancellation requires contacting support")

        if subscription_cta_count > 0:
            ratio = subscription_cta_count / max(cancel_cta_count, 1)

            if ratio >= 3:
                signals["cta_asymmetry"] = True
                reasons.append(
                    f"High subscription-to-cancel ratio ({subscription_cta_count}:{cancel_cta_count})"
                )

    # ---------------- SCORING ----------------

    raw_score = calculate_score(signals)
    # Reduce score if cancellation transparency is clearly stated
    if transparency_present:
        raw_score = max(raw_score - 2, 0)
        reasons.append("Cancellation transparency language detected")

    max_score = sum(SIGNAL_WEIGHTS.values())
    risk_percentage = round((raw_score / max_score) * 100, 2)
    severity = classify_severity(raw_score)

    return {
        "pattern": "Forced Continuity",
        "risk_score_raw": raw_score,
        "risk_percentage": risk_percentage,
        "severity": severity,
        "subscription_context": subscription_context,
        "page_type": page_type,
        "max_score": max_score,
        "signals": signals,
        "reasons": reasons,
        "cta_metrics": {
            "subscription_cta_count": subscription_cta_count,
            "cancel_cta_count": cancel_cta_count
        }
    }