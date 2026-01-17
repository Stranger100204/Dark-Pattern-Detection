CANCEL_KEYWORDS = ["cancel", "unsubscribe", "stop", "end"]
SUBSCRIBE_KEYWORDS = ["subscribe", "start", "trial", "buy", "upgrade"]
MANAGE_KEYWORDS = ["manage", "billing", "preferences", "settings"]
SUPPORT_KEYWORDS = ["contact", "support", "help", "email", "call"]


def keyword_match(text, keywords):
    text = text.lower()
    return any(k in text for k in keywords)


def detect_forced_continuity(elements):
    subscribe_visible = False
    cancel_present = False
    cancel_visible = False
    euphemism_present = False
    support_only_cancel = False

    for el in elements:
        text = (el.get("text") or "").lower()
        visible = el.get("visible", False)

        if keyword_match(text, SUBSCRIBE_KEYWORDS) and visible:
            subscribe_visible = True

        if keyword_match(text, CANCEL_KEYWORDS):
            cancel_present = True
            if visible:
                cancel_visible = True

        if keyword_match(text, MANAGE_KEYWORDS):
            euphemism_present = True

        if keyword_match(text, SUPPORT_KEYWORDS):
            support_only_cancel = True

    risk_score = 0.0
    reasons = []

    if subscribe_visible:
        risk_score += 0.3

    if not cancel_present:
        risk_score += 0.3
        reasons.append("No cancel option found")

    elif cancel_present and not cancel_visible:
        risk_score += 0.2
        reasons.append("Cancel option hidden")

    if euphemism_present and not cancel_present:
        risk_score += 0.1
        reasons.append("Euphemistic management options instead of cancel")

    if support_only_cancel:
        risk_score += 0.2
        reasons.append("Cancellation requires contacting support")

    risk_score = min(risk_score, 1.0)

    return {
        "forced_continuity": risk_score >= 0.6,
        "risk_score": round(risk_score, 2),
        "signals": {
            "subscribe_visible": subscribe_visible,
            "cancel_present": cancel_present,
            "cancel_visible": cancel_visible,
            "euphemism_present": euphemism_present,
            "support_only_cancel": support_only_cancel
        },
        "reasons": reasons
    }