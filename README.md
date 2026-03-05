# Dark Pattern Detection System

AI-based system to detect manipulative **Dark Patterns** in web interfaces.

## Project Status
🚧 Core detection system implemented  
🚧 Chrome Extension prototype completed  
🚧 Forced Continuity detection working  

## Overview

This project analyzes website UI elements to detect manipulative design patterns that make it easy for users to subscribe but difficult to cancel.

Currently, the system focuses on detecting the **Forced Continuity** dark pattern.

## Features

- Webpage UI extraction using Playwright
- Detection of subscription manipulation patterns
- Risk scoring system for dark pattern likelihood
- CLI-based analysis report
- Chrome Extension for real-time detection

## Dark Pattern Detected

### Forced Continuity

Occurs when:
- Subscribing is easy
- Cancelling is difficult or hidden

Examples include:
- Hidden cancel buttons
- Support-only cancellation
- Misleading labels like *Manage Plan*
- Excessive subscription prompts

## Project Structure

```
Dark-Pattern-Detection
│
├ app/
├ crawler/
├ features/
├ models/
│
├ extension/
│   ├ manifest.json
│   ├ content.js
│   ├ detector.js
│   ├ popup.html
│   ├ popup.css
│   └ popup.js
│
├ README.md
└ requirements.txt
```

## Technologies Used

- Python
- Playwright
- JavaScript
- Chrome Extension API
- DOM Analysis

## Future Work

- Detect additional dark patterns
- Improve detection accuracy
- Highlight manipulative UI elements on webpages
- Multi-page flow analysis

---
