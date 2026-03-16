// ---------------- KEYWORD DEFINITIONS ----------------

const STRONG_CANCEL = [
"cancel subscription",
"cancel membership",
"unsubscribe",
"end subscription",
"cancel premium"
];

const WEAK_CANCEL = ["cancel"];

const SUBSCRIBE_KEYWORDS = [
"subscribe","start","trial",
"buy","upgrade","premium",
"get","try","join"
];

const MANAGE_KEYWORDS = ["manage","billing","preferences","settings"];

const SUPPORT_KEYWORDS = ["contact","support","help","email","call"];

const PRICING_KEYWORDS = ["pricing","plan","billing","payment","subscription"];

const TRANSPARENCY_KEYWORDS = [
"cancel anytime",
"cancel at any time",
"no commitment",
"no cancellation fee",
"easy to cancel"
];


// ---------------- SIGNAL WEIGHTS ----------------

const SIGNAL_WEIGHTS = {
subscription_visible: 2,
cancel_not_visible: 3,
cancel_hidden: 2,
support_only_cancel: 2,
euphemism_used: 1,
cta_asymmetry: 2
};


// ---------------- UTILITY FUNCTIONS ----------------

function keywordMatch(text, keywords){
return keywords.some(k => text.includes(k));
}


function calculateScore(signals){

let score = 0;

for (const key in signals){
if(signals[key]){
score += SIGNAL_WEIGHTS[key] || 0;
}
}

return score;

}


function classifySeverity(score){

if(score >= 10) return "Critical";
if(score >= 7) return "High";
if(score >= 4) return "Moderate";

return "Low";

}


// ---------------- MAIN DETECTOR ----------------

function detectForcedContinuity(elements, url){

const ACCOUNT_INDICATORS = ["account","billing","subscription","settings","dashboard"];
const MARKETING_INDICATORS = ["pricing","plans","premium","upgrade"];

let pageType = "unknown";

const lowerURL = url.toLowerCase();

if(ACCOUNT_INDICATORS.some(k => lowerURL.includes(k))){
pageType = "account";
}
else if(MARKETING_INDICATORS.some(k => lowerURL.includes(k))){
pageType = "marketing";
}


let subscribeVisible = false;
let cancelPresent = false;
let cancelVisible = false;
let euphemismPresent = false;
let supportOnlyCancel = false;
let subscriptionContext = false;

let subscriptionCtaCount = 0;
let cancelCtaCount = 0;

let transparencyPresent = false;


elements.forEach(el => {

const text = (el.text || "").toLowerCase();
const visible = el.visible;

const elementId = (el.attributes?.id || "").toLowerCase();
const elementClass = (el.attributes?.class || "").toLowerCase();


if(keywordMatch(text, TRANSPARENCY_KEYWORDS)){
transparencyPresent = true;
}


// SUBSCRIPTION DETECTION

if(keywordMatch(text, SUBSCRIBE_KEYWORDS)){

subscriptionContext = true;

if(visible){
subscribeVisible = true;
subscriptionCtaCount++;
}

}

if(keywordMatch(text, PRICING_KEYWORDS)){
subscriptionContext = true;
}


// STRONG CANCEL DETECTION

if(keywordMatch(text, STRONG_CANCEL)){

cancelPresent = true;

if(visible){
cancelVisible = true;
cancelCtaCount++;
}

}


// WEAK CANCEL DETECTION

else if(keywordMatch(text, WEAK_CANCEL)){

if(subscriptionContext && visible){

if(!elementId.includes("filter") &&
!elementClass.includes("cookie") &&
!elementClass.includes("close")){

cancelPresent = true;
cancelVisible = true;
cancelCtaCount++;

}

}

}


// EUPHEMISM DETECTION

if(keywordMatch(text, MANAGE_KEYWORDS)){
euphemismPresent = true;
}


// SUPPORT FLOW DETECTION

if(keywordMatch(text, SUPPORT_KEYWORDS) && subscriptionContext && !cancelPresent){
supportOnlyCancel = true;
}

});


// ---------------- SIGNAL ACTIVATION ----------------

let signals = {
subscription_visible:false,
cancel_not_visible:false,
cancel_hidden:false,
support_only_cancel:false,
euphemism_used:false,
cta_asymmetry:false
};

let reasons = [];


if(subscriptionContext){

if(subscribeVisible){
signals.subscription_visible = true;
reasons.push("Subscription CTA visible");
}


if(!cancelPresent && pageType === "account"){
signals.cancel_not_visible = true;
reasons.push("No cancel option found on account page");
}

else if(cancelPresent && !cancelVisible){
signals.cancel_hidden = true;
reasons.push("Cancel option hidden");
}


if(euphemismPresent && !cancelPresent){
signals.euphemism_used = true;
reasons.push("Euphemistic management options instead of cancel");
}


if(supportOnlyCancel){
signals.support_only_cancel = true;
reasons.push("Cancellation requires contacting support");
}


if(subscriptionCtaCount > 0){

const ratio = subscriptionCtaCount / Math.max(cancelCtaCount,1);

if(ratio >= 3){

signals.cta_asymmetry = true;

reasons.push(
`High subscription-to-cancel ratio (${subscriptionCtaCount}:${cancelCtaCount})`
);

}

}

}


// ---------------- SCORING ----------------

let rawScore = calculateScore(signals);

if(transparencyPresent){
rawScore = Math.max(rawScore - 2,0);
reasons.push("Cancellation transparency language detected");
}


const maxScore = Object.values(SIGNAL_WEIGHTS).reduce((a,b)=>a+b,0);

const riskPercentage = Math.round((rawScore/maxScore)*100);


const severity = classifySeverity(rawScore);


return {

pattern:"Forced Continuity",
risk_score_raw:rawScore,
risk_percentage:riskPercentage,
severity:severity,
subscription_context:subscriptionContext,
page_type:pageType,
max_score:maxScore,
signals:signals,
reasons:reasons,
cta_metrics:{
subscription_cta_count:subscriptionCtaCount,
cancel_cta_count:cancelCtaCount
}

};

}