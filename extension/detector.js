function detectForcedContinuity(elements, url){

    let subscribe = 0;
    let cancel = 0;

    elements.forEach(el => {

        const text = el.text || "";

        if(text.includes("subscribe") || text.includes("premium")){
            subscribe++;
        }

        if(text.includes("cancel") || text.includes("unsubscribe")){
            cancel++;
        }

    });

    let signals = {
        subscription_visible: subscribe > 0,
        cancel_not_visible: cancel === 0
    };

    return {
        pattern: "Forced Continuity",
        severity: subscribe > cancel ? "Moderate" : "Low",
        risk_percentage: subscribe > cancel ? 40 : 10,
        signals: signals
    };
}