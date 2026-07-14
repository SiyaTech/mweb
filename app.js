// Munshiji Website Interactive Sandbox & Core UI Logic

// 1. Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const menuIcon = document.getElementById('menuIcon');

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        if (mobileMenu.classList.contains('hidden')) {
            // Hamburger icon
            menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
        } else {
            // Close icon
            menuIcon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
        }
    });
}

// Close mobile menu on clicking any link
document.querySelectorAll('#mobileMenu a').forEach(link => {
    link.addEventListener('click', () => {
        if (mobileMenu) {
            mobileMenu.classList.add('hidden');
            if (menuIcon) {
                menuIcon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
            }
        }
    });
});


// 2. Integration Tab Switching
function switchIntegrationTab(tabKey) {
    const btnWebhook = document.getElementById('tabBtn_webhook');
    const btnSheets = document.getElementById('tabBtn_sheets');
    const contentWebhook = document.getElementById('tabContent_webhook');
    const contentSheets = document.getElementById('tabContent_sheets');

    if (tabKey === 'webhook') {
        // Highlight Webhook button
        btnWebhook.className = "w-full p-4 text-left rounded-xl bg-brand-card border border-brand-blue/40 flex items-center gap-3 transition-all";
        btnSheets.className = "w-full p-4 text-left rounded-xl bg-brand-dark border border-brand-border hover:bg-brand-card/30 flex items-center gap-3 transition-all";
        
        // Show Webhook content
        contentWebhook.classList.remove('hidden');
        contentSheets.classList.add('hidden');
    } else if (tabKey === 'sheets') {
        // Highlight Sheets button
        btnWebhook.className = "w-full p-4 text-left rounded-xl bg-brand-dark border border-brand-border hover:bg-brand-card/30 flex items-center gap-3 transition-all";
        btnSheets.className = "w-full p-4 text-left rounded-xl bg-brand-card border border-brand-accent/40 flex items-center gap-3 transition-all";
        
        // Show Sheets content
        contentWebhook.classList.add('hidden');
        contentSheets.classList.remove('hidden');
    }
}


// 3. Download APK action
function downloadApkPlaceholder() {
    const notice = document.getElementById('downloadNotice');
    if (notice) {
        notice.classList.remove('opacity-0');
        notice.classList.add('opacity-100');
        
        // Hide notice after 8 seconds
        setTimeout(() => {
            notice.classList.remove('opacity-100');
            notice.classList.add('opacity-0');
        }, 8000);
    }
    
    // Simulate real file download if running locally or show confirmation
    const msg = alertMessages[currentLanguage] || alertMessages['en'];
    alert(msg);
}


// 4. Parser Sandbox Engine
const smsTemplates = {
    hdfc_debit: {
        body: "Your a/c no. XX1234 has been debited by Rs 100.00 on 11-07-26 by info UPI-Swiggy-Swiggy-@hdfc. Ref no 619283749281. If not done by you, report to bank.",
        sender: "AD-HDFCBK"
    },
    sbi_credit: {
        body: "Rs 5,000.00 received in your a/c XX5432 on 11-07-26 from John Doe. Ref: 219803120934. - State Bank of India.",
        sender: "AD-SBIBNK"
    },
    phonepe_spent: {
        body: "₹450.00 paid towards Swiggy Restaurant on PhonePe from account ending XX9012. Ref: UPI891029381029. Help: ppe.to/h",
        sender: "AX-PHONEPE"
    },
    creditcard_spent: {
        body: "Spent ₹2,500.00 on Credit Card ending 4321 on 10-07-26 at AMZN-IN. Txn: 7812903. Limit available: Rs 97,500.00.",
        sender: "AD-HDFCBK"
    },
    amazon_purchase: {
        body: "Dear Customer, your txn of Rs 1,299.00 on Amazon Pay ICICI Card ending 8812 was successful on 09-07-26. Ref: 9812739281.",
        sender: "VK-ICICIB"
    },
    mutual_fund_deposit: {
        body: "Your mutual fund SIP of ₹10,000.00 was credited to Nippon Growth Fund on 11-07-26 via OTM AutoDebit. Ref: MF-SIP-9012384.",
        sender: "AD-NIPPON"
    }
};

const categoryIcons = {
    "Salary": "💰",
    "Dining": "🍔",
    "Shopping": "🛍️",
    "Investment": "📈",
    "Transfer": "💸",
    "Others": "📁"
};

// Real-time UI binding
const smsInput = document.getElementById('smsInput');
const senderInput = document.getElementById('senderInput');
const deviceInput = document.getElementById('deviceInput');
const charCount = document.getElementById('charCount');

const outAmount = document.getElementById('outAmount');
const outTypeBadge = document.getElementById('outTypeBadge');
const outBank = document.getElementById('outBank');
const outAccount = document.getElementById('outAccount');
const outRef = document.getElementById('outRef');
const outCategory = document.getElementById('outCategory');
const outCatIcon = document.getElementById('outCatIcon');
const outSheetRow = document.getElementById('outSheetRow');

function setPlaygroundTemplate(key) {
    if (smsTemplates[key]) {
        if (smsInput) smsInput.value = smsTemplates[key].body;
        if (senderInput) senderInput.value = smsTemplates[key].sender;
        parseAndRender();
    }
}

function clearSmsInput() {
    if (smsInput) {
        smsInput.value = "";
        parseAndRender();
    }
}

// Regex extraction logic
function parseSms(body, sender, device) {
    const lowerBody = body.toLowerCase();
    
    // 1. Amount Extraction
    // Match Rs, Rs., RS, INR, ₹ followed by optional spaces and numbers with commas/dots
    let amount = 0.0;
    const amountRegexes = [
        /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
        /debited\s*(?:by|of)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /credited\s*(?:by|of)?\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /spent\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /txn of\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i
    ];
    
    for (let regex of amountRegexes) {
        const match = body.match(regex);
        if (match) {
            const rawAmt = match[1].replace(/,/g, '');
            amount = parseFloat(rawAmt);
            if (!isNaN(amount)) break;
        }
    }

    // 2. Transaction Type Extraction
    let type = "DEBIT"; // Default to debit as it's more common
    if (
        lowerBody.includes("credited") ||
        lowerBody.includes("received") ||
        lowerBody.includes("deposited") ||
        lowerBody.includes("refunded") ||
        lowerBody.includes("added to") ||
        lowerBody.includes("cr a/c")
    ) {
        type = "CREDIT";
    } else if (
        lowerBody.includes("debited") ||
        lowerBody.includes("withdrawn") ||
        lowerBody.includes("spent") ||
        lowerBody.includes("paid") ||
        lowerBody.includes("declined") ||
        lowerBody.includes("dr a/c")
    ) {
        type = "DEBIT";
    }

    // 3. Bank Extraction
    let bank = "Unknown Bank";
    const senderClean = (sender || "").toUpperCase();
    if (senderClean.includes("HDFC")) bank = "HDFC Bank";
    else if (senderClean.includes("SBI") || lowerBody.includes("state bank")) bank = "SBI Bank";
    else if (senderClean.includes("ICICI")) bank = "ICICI Bank";
    else if (senderClean.includes("AXIS")) bank = "Axis Bank";
    else if (senderClean.includes("PNB")) bank = "Punjab National Bank";
    else if (senderClean.includes("PHONEPE") || lowerBody.includes("phonepe")) bank = "PhonePe Wallet";
    else if (senderClean.includes("PAYTM")) bank = "Paytm Wallet";
    else if (senderClean.includes("NIPPON")) bank = "Nippon Mutual Fund";
    else {
        // Fallback checks in body
        if (lowerBody.includes("hdfc")) bank = "HDFC Bank";
        else if (lowerBody.includes("sbi") || lowerBody.includes("state bank")) bank = "SBI Bank";
        else if (lowerBody.includes("icici")) bank = "ICICI Bank";
        else if (lowerBody.includes("axis")) bank = "Axis Bank";
    }

    // 4. Account Extraction
    let account = "A/c XX----";
    const acRegexes = [
        /(?:a\/c|account|card|ending)\s*(?:no\.?|in)?\s*(?:ending)?\s*(?:in|with)?\s*([x*]*\d{4})/i,
        /a\/c\s*([x*]*\d{2,4})/i,
        /card ending\s*(\d{4})/i,
        /ending\s*(\d{4})/i
    ];
    
    for (let regex of acRegexes) {
        const match = body.match(regex);
        if (match) {
            account = `A/c XX${match[1].replace(/[x*]/gi, '')}`;
            break;
        }
    }

    // 5. Reference No Extraction
    let refNo = "N/A";
    const refRegexes = [
        /(?:ref\.?\s*no|ref|txn|transaction|utr|id)\s*(?:is|no\.?|:)?\s*([a-zA-Z0-9-]{6,16})/i,
        /ref\s*([a-zA-Z0-9-]{6,16})/i,
        /txn:\s*([0-9]{6,16})/i
    ];

    for (let regex of refRegexes) {
        const match = body.match(regex);
        if (match) {
            refNo = match[1];
            break;
        }
    }

    // 6. Category Extraction
    let category = "Others";
    if (lowerBody.includes("salary") || lowerBody.includes("co-founder") || lowerBody.includes("earning")) {
        category = "Salary";
    } else if (lowerBody.includes("swiggy") || lowerBody.includes("zomato") || lowerBody.includes("restaurant") || lowerBody.includes("dine") || lowerBody.includes("food")) {
        category = "Dining";
    } else if (lowerBody.includes("amazon") || lowerBody.includes("flipkart") || lowerBody.includes("shop") || lowerBody.includes("myntra") || lowerBody.includes("purchased")) {
        category = "Shopping";
    } else if (lowerBody.includes("mutual fund") || lowerBody.includes("sip") || lowerBody.includes("investment") || lowerBody.includes("groww") || lowerBody.includes("zerodha") || lowerBody.includes("stock")) {
        category = "Investment";
    } else if (lowerBody.includes("sent") || lowerBody.includes("transfer") || lowerBody.includes("withdrawn") || lowerBody.includes("atm")) {
        category = "Transfer";
    }

    return {
        amount,
        type,
        bank,
        account,
        refNo,
        category
    };
}

function parseAndRender() {
    const body = smsInput ? smsInput.value : "";
    const sender = senderInput ? senderInput.value : "AD-HDFCBK";
    const device = deviceInput ? deviceInput.value : "Admin-PO1";
    
    // Update char counter
    if (charCount) {
        charCount.innerText = `${body.length} chars`;
    }

    if (!body.trim()) {
        if (outAmount) outAmount.innerText = "₹0.00";
        if (outTypeBadge) {
            outTypeBadge.className = "inline-block px-2.5 py-1 text-xs font-bold font-mono rounded-lg tracking-wider bg-slate-800 text-slate-400";
            outTypeBadge.innerText = "WAITING...";
        }
        if (outBank) outBank.innerText = "Unknown Bank";
        if (outAccount) outAccount.innerText = "A/c XX----";
        if (outRef) outRef.innerText = "N/A";
        if (outCategory) outCategory.innerText = "Others";
        if (outCatIcon) outCatIcon.innerText = "📁";
        if (outSheetRow) outSheetRow.innerText = '"Date/Time", "HDFCBK", "Body Text", "Device", "0.00", "DEBIT", "Others"';
        return;
    }

    const result = parseSms(body, sender, device);

    // Format Amount
    if (outAmount) {
        outAmount.innerText = `₹${result.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Render Type Badge
    if (outTypeBadge) {
        if (result.type === "CREDIT") {
            outTypeBadge.className = "inline-block px-2.5 py-1 text-xs font-bold font-mono rounded-lg tracking-wider bg-brand-green/20 text-brand-green border border-brand-green/30";
            outTypeBadge.innerText = "CREDIT";
        } else {
            outTypeBadge.className = "inline-block px-2.5 py-1 text-xs font-bold font-mono rounded-lg tracking-wider bg-brand-red/20 text-brand-red border border-brand-red/30";
            outTypeBadge.innerText = "DEBIT";
        }
    }

    // Bank
    if (outBank) outBank.innerText = result.bank;

    // Account
    if (outAccount) outAccount.innerText = result.account;

    // Ref
    if (outRef) outRef.innerText = result.refNo;

    // Category
    if (outCategory) outCategory.innerText = result.category;
    if (outCatIcon) outCatIcon.innerText = categoryIcons[result.category] || "📁";

    // Google Sheets Row
    const now = new Date();
    const dateTimeStr = now.toISOString().replace('T', ' ').substring(0, 19);
    
    // Escape double quotes inside the raw body
    const escapedBody = body.replace(/"/g, '\"');
    const sheetData = [
        dateTimeStr,
        sender.toUpperCase(),
        escapedBody,
        device,
        result.amount.toFixed(2),
        result.type,
        result.category
    ];

    if (outSheetRow) {
        outSheetRow.innerText = sheetData.map(item => `"${item}"`).join(', ');
    }
}

function copySheetRow() {
    if (outSheetRow) {
        const rowText = `[${outSheetRow.innerText}]`;
        navigator.clipboard.writeText(rowText)
            .then(() => {
                const msg = copyRowMessages[currentLanguage] || copyRowMessages['en'];
                alert(msg);
            })
            .catch(err => {
                console.error("Clipboard copy failed: ", err);
            });
    }
}

// Bind event listeners for direct inputs
if (smsInput) smsInput.addEventListener('input', parseAndRender);
if (senderInput) senderInput.addEventListener('input', parseAndRender);
if (deviceInput) deviceInput.addEventListener('input', parseAndRender);

// Multi-language translation dictionaries and engine
let currentLanguage = 'en';

const alertMessages = {
    en: "Munshiji App Package (APK) download has been initiated successfully! Please check your device notifications or downloads folder. Version 2.0.0 is optimized for secure, offline-first ledger syncing.",
    hi: "मुंशीजी ऐप पैकेज (APK) डाउनलोड सफलतापूर्वक शुरू हो गया है! कृपया अपने डिवाइस के नोटिफिकेशन या डाउनलोड फ़ोल्डर की जांच करें। संस्करण 2.0.0 को सुरक्षित, ऑफलाइन-फर्स्ट बहीखाता सिंक के लिए अनुकूलित किया गया है।",
    gu: "મુન્શીજી એપ્લિકેશન પેકેજ (APK) ડાઉનલોડ સફળતાપૂર્વક શરૂ થઈ ગયું છે! કૃપા કરીને તમારા ઉપકરણની સૂચનાઓ અથવા ડાઉનલોડ્સ ફોલ્ડર તપાસો. સંસ્કરણ 2.0.0 ને સુરક્ષિત, ઓફલાઇન-ફર્સ્ટ લેજર સિંકિંગ માટે અનુકૂળ કરવામાં આવ્યું છે."
};

const copyRowMessages = {
    en: "Copied Google Sheets row to clipboard!",
    hi: "गूगल शीट्स पंक्ति को क्लिपबोर्ड पर कॉपी किया गया!",
    gu: "ગૂગલ શીટ્સ પંક્તિ ક્લિપબોર્ડ પર કોપી કરી!"
};

const translations = {
    en: {
        app_title: "Munshiji (मुंशीजी)",
        app_subtitle: "Automate Your Business Ledger Directly From Android SMS Alerts",
        nav_features: "Features",
        nav_demo: "Interactive Demo",
        nav_how_it_works: "How It Works",
        nav_integrations: "Integrations",
        nav_setup_guide: "Setup Guide",
        nav_download_apk: "Download APK",
        mobile_lang_label: "Language",
        hero_badge_text: "Now with Automated Record Safeguards",
        hero_title_1: "Automate Your Ledger",
        hero_title_2: "Directly From SMS Alerts",
        hero_desc: "Munshiji (मुंशीजी) runs quietly on your Android device, securely organizing official bank payment alerts into a clean ledger, and automatically updating your personal <strong class='text-white hover:text-brand-accent transition-colors'>Google Sheets</strong> or <strong class='text-white hover:text-brand-accent transition-colors'>Store Ledger</strong> in real-time.",
        hero_download_btn_text: "Download APK (v2.0)",
        hero_sandbox_btn_text: "Try Sandbox Organizer",
        trust_signal_1: "<strong class="text-white">100% On-Device</strong> Privacy",
        trust_signal_2: "<strong class="text-white">Zero Cloud Storage</strong> Your data stays yours",
        trust_signal_3: "<strong class="text-white">Direct Google Link</strong> No middle servers",
        demo_title: "Interactive <span class="text-brand-accent">SMS Organizer</span> Sandbox",
        demo_desc: "Simulate or select a bank alert below to see how Munshiji automatically organizes transaction details in a split second and structures it as a beautiful ledger row.",
        demo_template_label: "Select a Standard Bank Alert Template",
        demo_custom_sms_label: "Custom Payment Alert Body",
        demo_clear_btn: "Clear",
        demo_sender_label: "Sender ID",
        demo_device_label: "Device Tag (Optional)",
        out_engine_title: "Munshiji Organizer Output",
        out_status_success: "LOCAL CLASSIFICATION ACTIVE",
        out_amount_label: "Identified Amount",
        out_type_label: "Payment Direction",
        out_bank_label: "Identified Bank",
        out_account_label: "Identified Account/Card",
        out_ref_label: "Payment Reference (Ref No)",
        out_category_label: "Category",
        out_sheet_row_title: "Ledger Sheet Representation",
        out_copy_row_btn: "Copy Row Text",
        features_title: "Designed for <span class="text-brand-blue">Business Privacy</span>, Built for <span class="text-brand-accent">Ease of Use</span>",
        features_desc: "Say goodbye to manual data typing. Munshiji runs automatically, organizes records directly on your device, and keeps your accounting up-to-date.",
        feat_1_title: "Automated Record Safeguard",
        feat_1_desc: "Accidentally modified a sheet? No problem. Munshiji continuously verifies your records and automatically ensures every transaction is securely and accurately logged, preventing manual bookkeeping mistakes.",
        feat_2_title: "Double-Entry Prevention",
        feat_2_desc: "Carriers or banks sometimes send duplicate text alerts for a single payment. Munshiji intelligently filters out redundant messages to keep your ledger perfectly clean and clutter-free.",
        feat_3_title: "Custom System Integration",
        feat_3_desc: "Perfect for larger stores or custom workflows. Direct ledger updates allow you to easily link Munshiji with your existing systems and keep your shop records synced in real-time.",
        feat_4_title: "Secure Local Processing",
        feat_4_desc: "Your finances are private. All data organization is processed entirely on your phone. Munshiji never uploads your messages, credit card numbers, or passwords to third-party cloud servers.",
        feat_5_title: "Multi-Counter Shop Sync",
        feat_5_desc: "Great for retail shops with multiple registers. Consolidate financial alerts across multiple counters or team phones into a single centralized spreadsheet effortlessly.",
        feat_6_title: "Direct Google Link",
        feat_6_desc: "Connects securely using official Google Sign-In services. Your passwords are never accessed, shared, or requested by the application, ensuring maximum peace of mind.",
        how_title: "How Munshiji <span class="text-brand-accent">Simplifies</span> Your Bookkeeping",
        how_desc: "Four simple steps completed in milliseconds, entirely behind the scenes.",
        how_step1_title: "Payment Alert Received",
        how_step1_desc: "Your Android device receives an official business payment text notification from your bank (e.g., HDFCBK).",
        how_step2_title: "Smart Local Formatting",
        how_step2_desc: "Munshiji immediately formats the alert, identifying the exact amount, bank, account, and reference code in a split second.",
        how_step3_title: "Direct Ledger Update",
        how_step3_desc: "The app updates your private spreadsheet. If you are offline, it queues the record and updates it automatically the moment you connect.",
        how_step4_title: "Real-Time Shop Dashboard",
        how_step4_desc: "Review sales and daily insights on your sheet or the app dashboard anytime, keeping you informed and in full control.",
        integ_title: "Flexible Options for <span class="text-brand-blue">Modern Shops</span> & Admins",
        integ_desc: "Munshiji is built to be flexible. Whether you want to maintain a clean Google Sheet, sync with automated systems, or track multiple counters, we have you covered.",
        integ_tab_webhook_title: "Automated Store Sync",
        integ_tab_webhook_desc: "Receive transaction updates directly on your system",
        integ_tab_sheets_title: "Recommended Sheet Layout",
        integ_tab_sheets_desc: "Recommended columns for organized business records",
        sheets_sim_notice: "* Enable "Simulation Mode" in the settings to test logs locally without a live Google Sheets connection.",
        guide_title: "Quick Start & <span class="text-brand-accent">Setup Guide</span>",
        guide_desc: "Configure Munshiji in less than two minutes with our step-by-step instructions.",
        guide_step1_title: "1. Install & Grant Permissions",
        guide_step1_desc: "Download and install the Munshiji app package. When prompted, grant the <strong>SMS permissions</strong> so the app can detect and organize incoming transaction texts automatically.",
        guide_step1_req: "System Requirement: Android 8.0+",
        guide_step2_title: "2. Link Google Spreadsheet",
        guide_step2_desc: "Create a new Google Sheet. Copy the long ID string from the browser URL: <br/><code class="text-brand-accent font-mono text-[10px] break-all">/d/&lt;Spreadsheet_ID&gt;/edit</code>. <br/>Paste this ID in the <strong>Spreadsheet ID</strong> field in the app Settings tab.",
        guide_step2_req: "Secure Official Google Sign-In",
        guide_step3_title: "3. Verify & Run",
        guide_step3_desc: "Tap the <strong>"Run Diagnostics"</strong> button in settings to verify connections. Send a test transaction SMS to verify that the sheet updates automatically!",
        guide_step3_req: "Self-Check Diagnostic Status Included",
        cta_title: "Ready to Automate Your Bookkeeping?",
        cta_desc: "Download the Munshiji app now, host your private business ledger on Google Sheets, and never forget an expense again.",
        cta_download_btn_text: "Download App Package",
        cta_manual_btn_text: "📄 Read User Manual",
        footer_sub: "Secure On-Device SMS Business Ledger",
        footer_copyright: "&copy; 2026 Munshiji Development Team. All rights reserved.",
        faq_title: "Frequently Asked <span class="text-brand-accent">Questions</span>",
        faq_desc: "Got questions? We have answers. Find out how Munshiji simplifies and safeguards your bookkeeping.",
        faq_q1: "🔒 Is my financial text data sent to third-party servers?",
        faq_a1: "Absolutely not. Munshiji is engineered to run 100% on-device. All message processing happens locally on your Android phone. The app connects directly to Google Sheets using official secure API methods, keeping your data strictly private.",
        faq_q2: "📱 Which devices are supported, and does it require Root?",
        faq_a2: "Munshiji supports any Android device running Android 8.0 or above. It does NOT require root access or complex tools. It operates as a standard, secure application with regular SMS permissions, which you can easily grant during setup.",
        faq_q3: "🔄 What should I do if my transactions are not updating?",
        faq_a3: "Follow these simple steps: (1) Ensure your device has active network coverage. (2) Tap the Run Diagnostics button in settings to verify Google Sheets connection. (3) Confirm your Spreadsheet ID is copied correctly. (4) Disable battery saving optimization for Munshiji to allow continuous updates.",
        changelog_title: "Product <span class="text-brand-accent">Changelog</span>",
        changelog_desc: "Track the updates, bug fixes, and feature enhancements designed to keep your ledger running smoothly.",
        changelog_v200_badge: "LATEST RELEASE",
        changelog_v200_title: "v2.0.0 — Automated Ledger Update",
        changelog_v200_feat1: "<strong>Automated Record Safeguard</strong> ensures all spreadsheet records stay synchronized.",
        changelog_v200_feat2: "<strong>Double-Entry Prevention</strong> filters out duplicate bank alerts instantly.",
        changelog_v200_feat3: "Full multi-language translation support for English, Hindi, and Gujarati.",
        changelog_v120_badge: "STABLE UPDATE",
        changelog_v120_title: "v1.2.0 — Multi-Register Sync",
        changelog_v120_feat1: "<strong>Automated Store Sync</strong> sends records directly to custom systems.",
        changelog_v120_feat2: "<strong>Multi-Counter Support</strong> synchronizes billing records across phones.",
        changelog_v120_feat3: "Integrated Diagnostic Tool for easy connectivity and setup verification.",
        changelog_v100_badge: "INITIAL RELEASE",
        changelog_v100_title: "v1.0.0 — Launch Release",
        changelog_v100_feat1: "Robust local processing of incoming transaction text alerts.",
        changelog_v100_feat2: "Direct Google Sheets logging integration.",
        demo_simulate_btn: "Simulate SMS Arrival & Organize",
        sim_notif_time: "just now",
        mobile_theme_label: "Theme Contrast",
        mobile_theme_btn: "Toggle Light Mode",
        integ_tab_flow_title: "Automatic Store Sync Process",
        integ_tab_flow_status: "Secure Local Direct Link",
        integ_tab_flow_desc: "Whenever a business payment alert is received, Munshiji processes it locally in milliseconds and immediately updates your central ledger:",
        integ_flow_title: "Real-Time Instant Update",
        integ_flow_step1: "📩 Alert Received",
        integ_flow_step2: "⚙️ Local Organizer",
        integ_flow_step3: "📊 Ledger Updated",
        integ_flow_note: "Connect your billing desk, online systems, or registers easily to log sales and expenses without a single keypress error.",
        integ_flow_footer: "* Supports all major bank alerts, SMS gateways, and local ledger storage."
    },
    hi: {
        app_title: "Munshiji (मुंशीजी)",
        app_subtitle: "एंड्रॉयड SMS से अपना बिजनेस बहीखाता स्वचालित करें",
        nav_features: "विशेषताएं",
        nav_demo: "इंटरैक्टिव डेमो",
        nav_how_it_works: "यह कैसे काम करता है",
        nav_integrations: "एकीकरण",
        nav_setup_guide: "सेटअप गाइड",
        nav_download_apk: "APK डाउनलोड",
        mobile_lang_label: "भाषा",
        hero_badge_text: "अब स्वतः रिकॉर्ड सुरक्षा और बहीखाता संरक्षण के साथ",
        hero_title_1: "अपना बहीखाता स्वचालित करें",
        hero_title_2: "सीधे SMS अलर्ट के माध्यम से",
        hero_desc: "मुंशीजी (Munshiji) आपके एंड्रॉयड डिवाइस पर सुरक्षित रूप से बैंक पेमेंट संदेशों को एक व्यवस्थित बहीखाते में बदलता है, और स्वतः आपकी व्यक्तिगत <strong class="text-white hover:text-brand-accent transition-colors">Google Sheets</strong> या <strong class="text-white hover:text-brand-accent transition-colors">स्टोर बहीखाते</strong> में अपडेट करता है।",
        hero_download_btn_text: "APK डाउनलोड (v2.0)",
        hero_sandbox_btn_text: "सैंडबॉक्स ऑर्गेनाइज़र आजमाएं",
        trust_signal_1: "<strong class="text-white">100% ऑन-डिवाइस</strong> गोपनीयता",
        trust_signal_2: "<strong class="text-white">शून्य क्लाउड स्टोरेज</strong> आपका डेटा केवल आपका है",
        trust_signal_3: "<strong class="text-white">सीधा गूगल लिंक</strong> कोई अन्य सर्वर नहीं",
        demo_title: "Interactive <span class="text-brand-accent">SMS Organizer</span> Sandbox",
        demo_desc: "नीचे दिए गए पेमेंट संदेश का अनुकरण करें या चुनें ताकि आप देख सकें कि मुंशीजी कैसे स्वतः रिकॉर्ड को बहीखाता पंक्ति में बदलता है।",
        demo_template_label: "एक मानक बैंक अलर्ट टेम्पलेट चुनें",
        demo_custom_sms_label: "कस्टम पेमेंट संदेश",
        demo_clear_btn: "साफ़ करें",
        demo_sender_label: "प्रेषक (Sender) ID",
        demo_device_label: "डिवाइस टैग (वैकल्पिक)",
        out_engine_title: "मुंशीजी ऑर्गेनाइज़र आउटपुट",
        out_status_success: "स्थानीय वर्गीकरण सक्रिय",
        out_amount_label: "पहचाना गया मूल्य",
        out_type_label: "भुगतान की दिशा",
        out_bank_label: "पहचाना गया बैंक",
        out_account_label: "पहचाना गया खाता/कार्ड",
        out_ref_label: "लेनदेन संदर्भ संख्या (Ref No)",
        out_category_label: "वर्गीकरण",
        out_sheet_row_title: "बहीखाता शीट पंक्ति प्रतिनिधित्व",
        out_copy_row_btn: "पंक्ति कॉपी करें",
        features_title: "बिजनेस प्राइवेसी के लिए <span class="text-brand-blue">सुरक्षित</span>, उपयोग में <span class="text-brand-accent">बेहद आसान</span>",
        features_desc: "मैनुअल बहीखाता लिखने के झंझट से मुक्ति। मुंशीजी स्वचालित रूप से चलता है, सीधे आपके डिवाइस पर रिकॉर्ड व्यवस्थित रखता है, और बहीखाता अपडेट रखता है।",
        feat_1_title: "स्वतः रिकॉर्ड सुरक्षा",
        feat_1_desc: "गलती से शीट बदल गई? कोई बात नहीं। मुंशीजी आपके रिकॉर्ड की निरंतर पुष्टि करता है और यह सुनिश्चित करता है कि हर भुगतान सही तरीके से दर्ज हो, जिससे बहीखाते में गलतियों की कोई गुंजाइश नहीं रहती।",
        feat_2_title: "द्वि-प्रविष्टि से सुरक्षा",
        feat_2_desc: "बैंक या टेलीकॉम कंपनियां कभी-कभी एक ही भुगतान के लिए दो बार संदेश भेज देती हैं। मुंशीजी समझदारी से अतिरिक्त संदेशों को फ़िल्टर करता है ताकि आपका बहीखाता बिल्कुल सही और साफ रहे।",
        feat_3_title: "कस्टम सिस्टम एकीकरण",
        feat_3_desc: "बड़ी दुकानों या कस्टम कार्यों के लिए उत्तम। मुंशीजी सीधे बहीखाता अपडेट प्रदान करता है जिससे आप अपनी मौजूदा प्रणालियों को आसानी से लिंक रख सकते हैं।",
        feat_4_title: "सुरक्षित स्थानीय प्रोसेसिंग",
        feat_4_desc: "का वित्तीय डेटा आपका निजी मामला है। पूरा रिकॉर्ड विश्लेषण केवल आपके फोन पर होता है। मुंशीजी कभी भी आपके संदेश, पासवर्ड या कार्ड विवरण तीसरे पक्ष के सर्वर पर नहीं भेजता।",
        feat_5_title: "मल्टी-काउंटर शॉप सिंक",
        feat_5_desc: "कई काउंटरों वाले खुदरा स्टोर के लिए आदर्श। बहीखाता अपडेट को कई काउंटरों या टीम फोन से एक ही मुख्य स्प्रेडशीट में आसानी से एकत्रित करें।",
        feat_6_title: "सीधा गूगल लिंक",
        feat_6_desc: "आधिकारिक Google साइन-इन सेवाओं के माध्यम से सुरक्षित रूप से जुड़ता है। आपका पासवर्ड ऐप द्वारा कभी भी नहीं मांगा जाता और न ही देखा जाता है, जिससे पूरी निश्चिंतता मिलती है।",
        how_title: "मुंशीजी बहीखाते को कैसे <span class="text-brand-accent">आसान</span> बनाता है",
        how_desc: "चार आसान चरण, मिलीसेकंड में पूरे होते हैं, पृष्ठभूमि में बिना किसी रुकावट के।",
        how_step1_title: "पेमेंट अलर्ट प्राप्त हुआ",
        how_step1_desc: "आपके एंड्रॉयड फोन पर बैंक (जैसे HDFCBK) से भुगतान का संस्थागत संदेश आता है।",
        how_step2_title: "स्मार्ट लोकल फॉर्मेटिंग",
        how_step2_desc: "मुंशीजी तुरंत जानकारी को व्यवस्थित करता है, और राशि, बैंक, खाता एवं संदर्भ संख्या को एक सेकंड से भी कम समय में पहचान लेता है।",
        how_step3_title: "सीधा बहीखाता अपडेट",
        how_step3_desc: "ऐप आपकी निजी स्प्रेडशीट अपडेट करता है। यदि इंटरनेट बंद है, तो यह रिकॉर्ड सुरक्षित रखता है और ऑनलाइन आते ही तुरंत सिंक कर देता है।",
        how_step4_title: "वास्तविक समय शॉप डैशबोर्ड",
        how_step4_desc: "अपनी बिक्री और दैनिक रिकॉर्ड की जांच सीधे अपनी गूगल शीट या ऐप डैशबोर्ड पर कभी भी करें, और अपने बिजनेस पर पूरा नियंत्रण रखें।",
        integ_title: "आधुनिक दुकानों और एडमिन के लिए <span class="text-brand-blue">लचीले</span> विकल्प",
        integ_desc: "मुंशीजी को लचीला बनाया गया है। चाहे आप एक स्वच्छ गूगल शीट रखना चाहते हों, स्वचालित प्रणालियों से सिंक करना चाहते हों, या विभिन्न काउंटरों को प्रबंधित करना चाहते हों, हम हर जगह आपके साथ हैं।",
        integ_tab_webhook_title: "स्वचालित स्टोर सिंक",
        integ_tab_webhook_desc: "सीधे अपने सिस्टम पर पेमेंट अपडेट प्राप्त करें",
        integ_tab_sheets_title: "अनुशंसित शीट लेआउट",
        integ_tab_sheets_desc: "व्यवस्थित व्यावसायिक रिकॉर्ड के लिए अनुशंसित कॉलम",
        sheets_sim_notice: "* गूगल कनेक्शन के बिना स्थानीय स्तर पर सिंक का परीक्षण करने के लिए सेटिंग्स में "सिमुलेशन मोड" सक्षम करें।",
        guide_title: "त्वरित शुरुआत और <span class="text-brand-accent">सेटअप गाइड</span>",
        guide_desc: "हमारे स्टेप-बाय-स्टेप निर्देशों के साथ दो मिनट से भी कम समय में मुंशीजी को कॉन्फ़िगर करें।",
        guide_step1_title: "1. इंस्टॉल और अनुमतियां दें",
        guide_step1_desc: "मुंशीजी ऐप पैकेज डाउनलोड करें और इंस्टॉल करें। पूछे जाने पर, <strong>SMS अनुमतियां</strong> दें ताकि ऐप आने वाले भुगतानों को स्वतः ढूंढ और व्यवस्थित कर सके।",
        guide_step1_req: "सिस्टम आवश्यकता: एंड्रॉइड 8.0+",
        guide_step2_title: "2. गूगल स्प्रेडशीट लिंक करें",
        guide_step2_desc: "ब्राउज़र पर गूगल शीट्स खोलें और नई शीट बनाएं। URL से अक्षरों की लंबी श्रृंखला कॉपी करें: <br/><code class="text-brand-accent font-mono text-[10px] break-all">/d/&lt;Spreadsheet_ID&gt;/edit</code>। <br/>इस ID को ऐप सेटिंग्स टैब में <strong>स्प्रेडशीट ID</strong> फ़ील्ड में पेस्ट करें।",
        guide_step2_req: "सुरक्षित आधिकारिक Google साइन-इन",
        guide_step3_title: "3. सत्यापित करें और शुरू करें",
        guide_step3_desc: "कनेक्शन सत्यापित करने के लिए सेटिंग्स में <strong>"डायग्नोस्टिक्स चलाएं"</strong> बटन पर टैप करें। सिंक सुनिश्चित करने के लिए टेस्ट पेमेंट SMS भेजकर देखें!",
        guide_step3_req: "स्व-जांच डायग्नोस्टिक्स स्थिति शामिल है",
        cta_title: "अपना बहीखाता स्वचालित करने के लिए तैयार हैं?",
        cta_desc: "अभी मुंशीजी ऐप डाउनलोड करें, गूगल शीट्स पर अपना निजी व्यावसायिक बहीखाता सुरक्षित करें और कभी कोई खर्च न भूलें।",
        cta_download_btn_text: "ऐप पैकेज डाउनलोड करें",
        cta_manual_btn_text: "📄 उपयोगकर्ता गाइड पढ़ें",
        footer_sub: "सुरक्षित ऑन-डिवाइस SMS व्यावसायिक बहीखाता",
        footer_copyright: "&copy; 2026 मुंशीजी विकास टीम। सर्वाधिकार सुरक्षित।",
        faq_title: "अक्सर पूछे जाने वाले <span class="text-brand-accent">प्रश्न (FAQ)</span>",
        faq_desc: "कोई प्रश्न है? हमारे पास जवाब हैं। जानें कि मुंशीजी आपके बहीखाते को कैसे सुरक्षित और सरल रखता है।",
        faq_q1: "🔒 क्या मेरा वित्तीय SMS डेटा तीसरे पक्ष के सर्वर पर भेजा जाता है?",
        faq_a1: "बिल्कुल नहीं। मुंशीजी 100% ऑन-डिवाइस मॉडल पर बनाया गया है। संदेशों का विश्लेषण और बहीखाता प्रबंधन सीधे आपके एंड्रॉइड फोन पर होता है। यह ऐप आपकी सुरक्षा बनाए रखने के लिए सीधे गूगल शीट्स से स्थानीय रूप से संग्रहीत सुरक्षित क्रेडेंशियल्स का उपयोग करके कनेक्ट होता है।",
        faq_q2: "📱 कौन से डिवाइस समर्थित हैं, और क्या इसके लिए रूट (Root) की आवश्यकता है?",
        faq_a2: "मुंशीजी एंड्रॉइड 8.0 या उससे ऊपर के संस्करण पर चलने वाले किसी भी एंड्रॉइड डिवाइस का समर्थन करता है। इसके लिए रूट एक्सेस या जटिल डेवलपर टूल्स की आवश्यकता नहीं है। यह सामान्य SMS अनुमतियों के साथ एक मानक सुरक्षित ऐप के रूप में काम करता है जिसे आप सेटअप के दौरान आसानी से दे सकते हैं।",
        faq_q3: "🔄 यदि मेरे लेनदेन अपडेट नहीं हो रहे हैं तो मुझे क्या करना चाहिए?",
        faq_a3: "इन आसान चरणों का पालन करें: (1) सुनिश्चित करें कि आपके डिवाइस में सक्रिय नेटवर्क कवरेज है। (2) सिंक स्थिति की जांच करने के लिए सेटिंग्स में 'डायग्नोस्टिक्स चलाएं' बटन पर टैप करें। (3) सुनिश्चित करें कि स्प्रेडशीट ID सही ढंग से कॉपी की गई है। (4) लगातार अपडेट जारी रखने के लिए मुंशीजी के लिए बैकग्राउंड बैटरी ऑप्टिमाइज़ेशन अक्षम करें।",
        changelog_title: "उत्पाद <span class="text-brand-accent">चेंजलॉग</span>",
        changelog_desc: "अपने बहीखाते को सुचारू रूप से चलाने के लिए नवीनतम अपडेट, बग फिक्स और सुविधाओं का ट्रैक रखें।",
        changelog_v200_badge: "नवीनतम रिलीज़",
        changelog_v200_title: "v2.0.0 — स्वतः बहीखाता रिकॉर्ड सुरक्षा",
        changelog_v200_feat1: "<strong>स्वतः रिकॉर्ड सुरक्षा</strong> सुनिश्चित करता है कि सभी स्प्रेडशीट रिकॉर्ड सिंक रहें।",
        changelog_v200_feat2: "<strong>द्वि-प्रविष्टि से सुरक्षा</strong> अनावश्यक डुप्लीकेट संदेशों को तुरंत फ़िल्टर करती है।",
        changelog_v200_feat3: "अंग्रेजी, हिंदी और गुजराती भाषाओं के लिए पूर्ण बहुभाषी समर्थन।",
        changelog_v120_badge: "स्थिर अपडेट",
        changelog_v120_title: "v1.2.0 — मल्टी-काउंटर सिंक",
        changelog_v120_feat1: "<strong>स्वचालित स्टोर सिंक</strong> रिकॉर्ड सीधे आपके सिस्टम पर भेजता है।",
        changelog_v120_feat2: "विभिन्न फोन पर बिलिंग विवरण सिंक करने के लिए <strong>मल्टी-काउंटर समर्थन</strong>।",
        changelog_v120_feat3: "आसान सेटअप और कनेक्टिविटी सत्यापन के लिए एकीकृत डायग्नोस्टिक टूल।",
        changelog_v100_badge: "प्रारंभिक रिलीज़",
        changelog_v100_title: "v1.0.0 — लॉन्च प्रकाशन",
        changelog_v100_feat1: "आने वाले पेमेंट SMS संदेशों की मजबूत ऑन-डिवाइस प्रोसेसिंग।",
        changelog_v100_feat2: "सीधा गूगल शीट्स लॉगिंग एकीकरण।",
        demo_simulate_btn: "SMS आगमन और पार्स का अनुकरण करें",
        sim_notif_time: "अभी",
        mobile_theme_label: "थीम कंट्रास्ट",
        mobile_theme_btn: "लाइट मोड बदलें",
        integ_tab_flow_title: "स्वचालित स्टोर सिंक प्रक्रिया",
        integ_tab_flow_status: "सुरक्षित स्थानीय सीधी लिंक",
        integ_tab_flow_desc: "जब भी व्यावसायिक भुगतान अलर्ट प्राप्त होता है, तो मुंशीजी उसे स्थानीय रूप से मिलीसेकंड में प्रोसेस करता है और तुरंत आपके केंद्रीय बहीखाते को अपडेट करता है:",
        integ_flow_title: "वास्तविक समय त्वरित अपडेट",
        integ_flow_step1: "📩 अलर्ट प्राप्त हुआ",
        integ_flow_step2: "⚙️ स्थानीय ऑर्गेनाइज़र",
        integ_flow_step3: "📊 बहीखाता अपडेट हुआ",
        integ_flow_note: "बिना किसी कीप्रेस गलती के बिक्री और खर्च की जानकारी दर्ज करने के लिए अपने बिलिंग डेस्क, ऑनलाइन सिस्टम या रजिस्टर को आसानी से कनेक्ट करें।",
        integ_flow_footer: "* सभी प्रमुख बैंक अलर्ट, SMS गेटवे और स्थानीय बहीखाता भंडारण का समर्थन करता है।"
    },
    gu: {
        app_title: "Munshiji (મુન્શીજી)",
        app_subtitle: "સીધા એન્ડ્રોઇડ SMS થી ગૂગલ શીટ્સ બુકકીપિંગ આપમેળે કરો",
        nav_features: "વિશેષતાઓ",
        nav_demo: "ઇન્ટરેક્ટિવ ડેમો",
        nav_how_it_works: "તે કેવી રીતે કાર્ય કરે છે",
        nav_integrations: "એકીકરણ (Integrations)",
        nav_setup_guide: "સેટઅપ ગાઇડ",
        nav_download_apk: "APK ડાઉનલોડ કરો",
        mobile_lang_label: "ભાષા (Language)",
        hero_badge_text: "હવે સ્વચાલિત બહીખાતા અપડેટ અને સેલ્ફ-હીલિંગ સુરક્ષા સાથે",
        hero_title_1: "તમારા બહીખાતાને આપમેળે કરો",
        hero_title_2: "સીધા SMS દ્વારા",
        hero_desc: "મુન્શીજી (Munshiji) તમારા એન્ડ્રોઇડ ઉપકરણ પર શાંતિથી ચાલે છે, સુરક્ષિત રીતે સત્તાવાર બેંક ચૂકવણી સંદેશાઓને વ્યવસ્થિત ખાતાવહીમાં ગોઠવે છે અને વાસ્તવિક સમયમાં તેમને તમારા વ્યક્તિગત <strong class="text-white hover:text-brand-accent transition-colors">Google Sheets</strong> અથવા <strong class="text-white hover:text-brand-accent transition-colors">સ્ટોર બહીખાતા</strong> માં સિંક કરે છે.",
        hero_download_btn_text: "APK ડાઉનલોડ કરો (v2.0)",
        hero_sandbox_btn_text: "સેન્ડબોક્સ ઓર્ગેનાઇઝર અજમાવો",
        trust_signal_1: "<strong class="text-white">100% ઓન-ડિવાઇસ</strong> ગોપનીયતા",
        trust_signal_2: "<strong class="text-white">શૂન્ય ક્લાઉડ સ્ટોરેજ</strong> તમારો ડેટા ફક્ત તમારો જ છે",
        trust_signal_3: "<strong class="text-white">સીધી ગૂગલ લિંક</strong> કોઈ અન્ય સર્વર નહિ",
        demo_title: "ઇન્ટરેક્ટિવ <span class="text-brand-accent">SMS ઓર્ગેનાઇઝર</span> સેન્ડબોક્સ",
        demo_desc: "નીચે આપેલ ચૂકવણી સંદેશનું અનુકરણ કરો અથવા પસંદ કરો જેથી તમે જોઈ શકો કે મુન્શીજી કેવી રીતે સ્વચાલિત રીતે રેકોર્ડને બહીખાતા પંક્તિમાં ફેરવે છે.",
        demo_template_label: "એક પ્રમાણભૂત SMS ટેમ્પલેટ પસંદ કરો",
        demo_custom_sms_label: "કસ્ટમ ચૂકવણી સંદેશ",
        demo_clear_btn: "સાફ કરો",
        demo_sender_label: "મોકલનાર (Sender) ID",
        demo_device_label: "ઉપકરણ ટેગ (વૈકલ્પિક)",
        out_engine_title: "મુન્શીજી ઓર્ગેનાઇઝર આઉટપુટ",
        out_status_success: "સ્થાનિક વર્ગીકરણ સક્રિય",
        out_amount_label: "ઓળખાયેલ મૂલ્ય",
        out_type_label: "ચુકવણીની દિશા",
        out_bank_label: "ઓળખાયેલ બેંક",
        out_account_label: "ઓળખાયેલ ખાતું/કાર્ડ",
        out_ref_label: "ચૂકવણી સંદર્ભ (Ref No)",
        out_category_label: "વર્ગીકરણ",
        out_sheet_row_title: "બહીખાતા શીટ પંક્તિ પ્રસ્તુતિ",
        out_copy_row_btn: "પંક્તિ નકલ કરો",
        features_title: "વ્યવસાયિક ગોપનીયતા માટે <span class="text-brand-blue">સુરક્ષિત</span>, ઉપયોગમાં <span class="text-brand-accent">ખૂબ સરળ</span>",
        features_desc: "હાથથી બહીખાતું લખવાની ઝંઝટમાંથી મુક્તિ. મુન્શીજી સ્વચાલિત રીતે ચાલે છે, સીધા તમારા ફોન પર રેકોર્ડ સુરક્ષિત રાખે છે, અને બહીખાતું અપડેટ રાખે છે.",
        feat_1_title: "સ્વચાલિત રેકોર્ડ સુરક્ષા",
        feat_1_desc: "ભૂલથી સ્પ્રેડશીટ પંક્તિ બદલાઈ ગઈ? કોઈ સમસ્યા નથી. મુન્શીજી તમારા રેકોર્ડની સતત પુષ્ટિ કરે છે અને ખાતરી કરે છે કે દરેક ચુકવણી યોગ્ય રીતે નોંધાયેલી રહે, જેથી ખાતાવહીમાં ભૂલની કોઈ સંભાવના રહેતી નથી.",
        feat_2_title: "બેવડી એન્ટ્રી અટકાવવી",
        feat_2_desc: "બેંક અથવા ટેલિકોમ કંપનીઓ ક્યારેક એક જ ચુકવણી માટે બે વાર સંદેશ મોકલી દે છે. મુન્શીજી સમજદારીથી વધારાના સંદેશાઓને ફિલ્ટર કરે છે જેથી તમારી ખાતાવહી એકદમ સચોટ અને સ્વચ્છ રહે.",
        feat_3_title: "કસ્ટમ સિસ્ટમ એકીકરણ",
        feat_3_desc: "મોટી દુકાનો અથવા કસ્ટમ કાર્યો માટે શ્રેષ્ઠ. મુન્શીજી સીધા જ ખાતાવહી અપડેટ પ્રદાન કરે છે જેથી તમે તમારી વર્તમાન સિસ્ટમોને સરળતાથી લિંક રાખી શકો.",
        feat_4_title: "સુરક્ષિત સ્થાનિક પ્રોસેસિંગ",
        feat_4_desc: "તમારો નાણાકીય ડેટા તમારી ખાનગી બાબત છે. તમામ રેકોર્ડ વિશ્લેષણ ફક્ત તમારા ફોન પર જ થાય છે. મુન્શીજી ક્યારેય તમારા સંદેશા, પાસવર્ડ અથવા કાર્ડની વિગતો તૃતીય-પક્ષ સર્વર પર મોકલતું નથી.",
        feat_5_title: "મલ્ટી-કાઉન્ટર શોપ સિંક",
        feat_5_desc: "ઘણા કાઉન્ટરવાળા રિટેલ સ્ટોર્સ માટે આદર્શ. બહુવિધ કાઉન્ટર્સ અથવા ટીમના ફોનથી એક જ મુખ્ય સ્પ્રેડશીટમાં સરળતાથી બધી વિગતો એકત્રિત કરો.",
        feat_6_title: "સીધી ગૂગલ લિંક",
        feat_6_desc: "સત્તાવાર ગૂગલ સાઇન-ઇન સેવાઓ દ્વારા સુરક્ષિત રીતે જોડાય છે. તમારો પાસવર્ડ એપ દ્વારા ક્યારેય માંગવામાં આવતો નથી અથવા જોવામાં આવતો નથી, જેથી સંપૂર્ણ શાંતિ રહે છે.",
        how_title: "મુન્શીજી બહીખાતાને કેવી રીતે <span class="text-brand-accent">સરળ</span> બનાવે છે",
        how_desc: "ચાર સરળ પગલાં, મિલીસેકન્ડમાં પૂર્ણ થાય છે, પૃષ્ઠભૂમિમાં કોઈપણ દખલ વિના.",
        how_step1_title: "ચૂકવણી સંદેશ પ્રાપ્ત થયો",
        how_step1_desc: "તમારા એન્ડ્રોઇડ ફોન પર બેંક (જેમ કે HDFCBK) તરફથી ચૂકવણીનો સત્તાવાર સંદેશ આવે છે.",
        how_step2_title: "સ્માર્ટ લોકલ ફોર્મેટિંગ",
        how_step2_desc: "મુન્શીજી તરત જ માહિતીને વ્યવસ્થિત કરે છે, અને રકમ, બેંક, ખાતું તેમજ સંદર્ભ નંબરને એક સેકન્ડથી પણ ઓછા સમયમાં ઓળખી લે છે.",
        how_step3_title: "સીધું બહીખાતું અપડેટ",
        how_step3_desc: "એપ તમારી ખાનગી સ્પ્રેડશીટ અપડેટ કરે છે. જો ઇન્ટરનેટ બંધ હોય, તો તે રેકોર્ડ સુરક્ષિત રાખે છે અને ઓનલાઇન આવતાની સાથે જ તરત જ સિંક કરી દે છે.",
        how_step4_title: "રીઅલ-ટાઇમ શોપ ડેશબોર્ડ",
        how_step4_desc: "તમારા વેચાણ અને દૈનિક રેકોર્ડ્સ સીધા તમારી ગૂગલ શીટ અથવા એપ્લિકેશન ડેશબોર્ડ પર ગમે ત્યારે જુઓ અને તમારા વ્યવસાય પર સંપૂર્ણ નિયંત્રણ રાખો.",
        integ_title: "આધુનિક દુકાનો માટે <span class="text-brand-blue">સરળ</span> વિકલ્પો",
        integ_desc: "મુન્શીજીને અનુકૂળ બનાવવામાં આવ્યું છે. ભલે તમે ગૂગલ શીટ્સ રાખવા માંગતા હોવ, સ્વચાલિત સિસ્ટમો સાથે સિંક કરવા માંગતા હોવ કે બહુવિધ કાઉન્ટર્સને ટ્રૅક કરવા માંગતા હોવ, અમે બધું સરળ બનાવ્યું છે.",
        integ_tab_webhook_title: "સ્વચાલિત સ્ટોર સિંક",
        integ_tab_webhook_desc: "વ્યવહારના અપડેટ સીધા તમારા સિસ્ટમ પર મેળવો",
        integ_tab_sheets_title: "ભલામણ કરેલ શીટ લેઆઉટ",
        integ_tab_sheets_desc: "વ્યવસ્થિત વ્યાપારી રેકોર્ડ્સ માટે ભલામણ કરેલ કૉલમ",
        sheets_sim_notice: "* ગૂગલ કનેક્શન વિના સ્થાનિક સ્તરે સિંકનું પરીક્ષણ કરવા માટે સેટિંગ્સમાં "સિમ્યુલેશન મોડ" સક્ષમ કરો.",
        guide_title: "ઝડપી શરૂઆત અને <span class="text-brand-accent">સેટઅપ માર્ગદર્શિકા</span>",
        guide_desc: "અમારા સ્ટેપ-બાય-સ્ટેપ સૂચનાઓ સાથે બે મિનિટથી ઓછા સમયમાં મુન્શીજીને ગોઠવો.",
        guide_step1_title: "1. ઇન્સ્ટોલ અને પરવાનગીઓ આપો",
        guide_step1_desc: "મુન્શીજી એપ પેકેજ ડાઉનલોડ કરો અને ઇન્સ્ટોલ કરો. જ્યારે પૂછવામાં આવે ત્યારે, <strong>SMS પરવાનગીઓ</strong> આપો જેથી એપ આવનારા વ્યવહારોને આપમેળે શોધી અને રેકોર્ડ કરી શકે.",
        guide_step1_req: "સિસ્ટમ આવશ્યકતા: એન્ડ્રોઇડ 8.0+",
        guide_step2_title: "2. ગૂગલ સ્પ્રેડશીટ લિંક કરો",
        guide_step2_desc: "બ્રાઉઝર પર ગૂગલ શીટ્સ ખોલો અને નવી શીટ બનાવો. URL માંથી અક્ષરોની લાંબી શ્રેણી નકલ કરો: <br/><code class="text-brand-accent font-mono text-[10px] break-all">/d/&lt;Spreadsheet_ID&gt;/edit</code>. <br/>આ ID ને એપ્લિકેશન સેટિંગ્સ ટેબમાં <strong>સ્પ્રેડશીટ ID</strong> ફીલ્ડમાં પેસ્ટ કરો.",
        guide_step2_req: "Secure Official Google Sign-In",
        guide_step3_title: "3. ચકાસો અને શરૂ કરો",
        guide_step3_desc: "કનેક્શન ચકાસવા માટે સેટિંગ્સમાં <strong>"ડાયગ્નોસ્ટિક્સ ચલાવો"</strong> બટન પર ટેપ કરો. સિંકની ખાતરી કરવા માટે ટેસ્ટ વ્યવહાર SMS મોકલીને તપાસો!",
        guide_step3_req: "સ્વ-તપાસ ડાયગ્નોસ્ટિક્સ સ્થિતિ શામેલ છે",
        cta_title: "તમારા બુકકીપિંગને આપમેળે કરવા માટે તૈયાર છો?",
        cta_desc: "હમણાં જ મુન્શીજી એપ ડાઉનલોડ કરો, ગૂગલ શીટ્સ પર તમારું khાનગી વ્યાપારી ખાતાવહી સુરક્ષિત કરો અને ક્યારેય કોઈ ખર્ચ ભૂલશો નહીં.",
        cta_download_btn_text: "એપ પેકેજ ડાઉનલોડ કરો",
        cta_manual_btn_text: "📄 વપરાશકર્તા માર્ગદર્શિકા વાંચો",
        footer_sub: "સુરક્ષિત ક્લાયન્ટ-સાઇડ SMS એકાઉન્ટિંગ બહીખાતું",
        footer_copyright: "&copy; 2026 મુન્શીજી વિકાસ ટીમ। ખાનગી સ્થાનિક સેન્ડબોક્સ લાયસન્સ હેઠળ મુક્ત. સર્વાધિકાર સુરક્ષિત.",
        faq_title: "વારંવાર પૂછાતા <span class="text-brand-accent">પ્રશ્નો (FAQ)</span>",
        faq_desc: "કોઈ પ્રશ્ન છે? અમારી પાસે જવાબો છે. જાણો કેવી રીતે મુન્શીજી તમારા બુકકીપિંગને સુરક્ષિત રાખે છે.",
        faq_q1: "🔒 શું મારો નાણાકીય SMS ડેટા તૃતીય-પક્ષ સર્વર પર મોકલવામાં આવે છે?",
        faq_a1: "બિલકુલ નહીં. મુન્શીજી ૧૦०% ઓફલાઇન-ફર્સ્ટ, ક્લાયન્ટ-સાઇડ મોડેલ પર બનાવવામાં આવ્યું છે. તમામ વ્યવહાર વિશ્લેષણ અને ખાતાવહી કામગીરી સીધા તમારા એન્ડ્રોઇડ ફોન પર થાય છે. આ એપ્લિકેશન તમારી સુરક્ષા જાળવવા માટે સીધા ગુગલ શીટ્સ સાથે સ્થાનિક રીતે સંગ્રહિત સુરક્ષિત API નો ઉપયોગ કરીને કનેક્ટ થાય છે.",
        faq_q2: "📱 કયા ઉપકરણો સપોર્ટેડ છે, અને શું તેના માટે રૂટ (Root) ની જરૂર છે?",
        faq_a2: "મુન્શીજી એન્ડ્રોઇડ 8.0 અથવા તેથી વધુ સંસ્કરણ પર ચાલતા કોઈપણ એન્ડ્રોઇડ ઉપકરણને સપોર્ટ કરે છે. તેના માટે રૂટ એક્સેસ કે જટિલ સાધનોની જરૂર નથી. તે સામાન્ય SMS પરવાનગીઓ સાથે પ્રમાણભૂત સુરક્ષિત એપ્લિકેશન તરીકે કાર્ય કરે છે જેને તમે સેટઅપ દરમિયાન સરળતાથી આપી શકો છો.",
        faq_q3: "🔄 જો મારા વ્યવહારો સિંક ન થઈ રહ્યા હોય તો મારે શું કરવું જોઈએ?",
        faq_a3: "આ સરળ પગલાં અનુસરો: (૧) ખાતરી કરો કે તમારા ઉપકરણમાં સક્રિય નેટવર્ક કવરેજ છે. (૨) સિંક સ્થિતિ ચકાસવા માટે સેટિંગ્સમાં 'ડાયગ્નોસ્ટિક્સ ચલાવો' બટન પર ટેપ કરો. (૩) ખાતરી કરો કે સ્પ્રેડશીટ ID યોગ્ય રીતે કોપી કરવામાં આવી છે. (૪) સળંગ અપડેટ ચાલુ રાખવા માટે મુન્શીજી માટે બેકગ્રાઉન્ડ બેટરી ઓપ્ટિમાઇઝેશન અક્ષમ કરો.",
        changelog_title: "પ્રોડક્ટ <span class="text-brand-accent">ચેન્જલોગ</span>",
        changelog_desc: "તમારા બહીખાતાને સરળ રીતે ચલાવવા માટે નવીનતમ અપડેટ્સ, બગ ફિક્સ અને સુવિધાઓનો ટ્રૅક રાખો.",
        changelog_v200_badge: "નવીનતમ રીલીઝ",
        changelog_v200_title: "v2.0.0 — સ્વચાલિત બહીખાતાની સુરક્ષા",
        changelog_v200_feat1: "<strong>સ્વચાલિત રેકોર્ડ સુરક્ષા</strong> ખાતરી કરે છે કે બધા સ્પ્રેડશીટ રેકોર્ડ્સ સિંક્રનાઇઝ રહે.",
        changelog_v200_feat2: "<strong>બેવડી એન્ટ્રી અટકાવવી</strong> નકામા ડુપ્લિકેટ બેંક સંદેશાઓનેય તરત જ ફિલ્ટર કરે છે.",
        changelog_v200_feat3: "અંગ્રેજી, હિન્દી અને ગુજરાતી ભાષાઓ માટે સંપૂર્ણ બહુભાષી સપોર્ટ.",
        changelog_v120_badge: "સ્થિર અપડેટ",
        changelog_v120_title: "v1.2.0 — મલ્ટી-રજિસ્ટર સિંક",
        changelog_v120_feat1: "<strong>સ્વચાલિત સ્ટોર સિંક</strong> રેકોર્ડ સીધા કસ્ટમ સિસ્ટમ્સ પર મોકલે છે.",
        changelog_v120_feat2: "બહુવિધ ફોન્સ પર બિલિંગ વિગતો સિંક્રનાઇઝ કરવા માટે <strong>મલ્ટી-કાઉન્ટર સપોર્ટ</strong>.",
        changelog_v120_feat3: "સરળ સેટઅપ અને કનેક્ટિવિટી ચકાસણી માટે સંકલિત ડાયગ્નોસ્ટિક ટૂલ.",
        changelog_v100_badge: "પ્રારંભિક રીલીઝ",
        changelog_v100_title: "v1.0.0 — લોન્ચ પ્રકાશન",
        changelog_v100_feat1: "આવનારા પેમેન્ટ SMS સંદેશાઓની મજબૂત ઓન-ડિવાઇસ પ્રોસેસિંગ.",
        changelog_v100_feat2: "સીડું ગૂગલ શીટ્સ લોગીંગ એકીકરણ.",
        demo_simulate_btn: "SMS આગમન અને પાર્સનું અનુકરણ કરો",
        sim_notif_time: "હમણાં જ",
        mobile_theme_label: "થીમ કોન્ટ્રાસ્ટ",
        mobile_theme_btn: "લાઇટ મોડ બદલો",
        integ_tab_flow_title: "સ્વચાલિત સ્ટોર સિંક પ્રક્રિયા",
        integ_tab_flow_status: "સુરક્ષિત સ્થાનિક સીધી લિંક",
        integ_tab_flow_desc: "જ્યારે પણ વ્યવસાય ચૂકવણી ચેતવણી પ્રાપ્ત થાય છે, ત્યારે મુન્શીજી તેને સ્થાનિક રીતે મિલીસેકન્ડમાં પ્રોસેસ કરે છે અને તરત જ તમારા કેન્દ્રીય બહીખાતાને અપડેટ કરે છે:",
        integ_flow_title: "વાસ્તવિક સમય ત્વરિત અપડેટ",
        integ_flow_step1: "📩 એલર્ટ પ્રાપ્ત થયું",
        integ_flow_step2: "⚙️ સ્થાનિક ઓર્ગેનાઇઝર",
        integ_flow_step3: "📊 બહીખાતું અપડેટ થયું",
        integ_flow_note: "એક भी कीप्रेस गलती के बिना बिक्री और खर्च की जानकारी दर्ज करने के लिए अपने बिलिंग डेस्क, ऑनलाइन सिस्टम या रजिस्टर को आसानी से कनेक्ट करें।",
        integ_flow_footer: "* सभी प्रमुख बैंक अलर्ट, SMS गेटवे और स्थानीय बहीखाता भंडारण का समर्थन करता है।"
    }
};

function applyLanguage(lang) {
    const dict = translations[lang];
    if (!dict) return;
    
    currentLanguage = lang;
    localStorage.setItem('munshiji_lang', lang);
    
    // Update dropdown inputs
    const langSelect = document.getElementById('langSelect');
    const langSelectMobile = document.getElementById('langSelectMobile');
    if (langSelect) langSelect.value = lang;
    if (langSelectMobile) langSelectMobile.value = lang;
    
    // Iterate and translate all data-i18n components
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            if (['P', 'SPAN', 'STRONG', 'H1', 'H2', 'H3', 'A'].includes(el.tagName)) {
                el.innerHTML = dict[key];
            } else {
                el.innerText = dict[key];
            }
        }
    });
}

// Bind language selector elements
const langSelect = document.getElementById('langSelect');
const langSelectMobile = document.getElementById('langSelectMobile');

if (langSelect) {
    langSelect.addEventListener('change', (e) => {
        applyLanguage(e.target.value);
    });
}

if (langSelectMobile) {
    langSelectMobile.addEventListener('change', (e) => {
        applyLanguage(e.target.value);
    });
}

// Initialize Sandbox on page load with default template and restore lang
window.addEventListener('DOMContentLoaded', () => {
    setPlaygroundTemplate('hdfc_debit');
    
    const savedLang = localStorage.getItem('munshiji_lang') || 'en';
    applyLanguage(savedLang);

    // Initialize Theme and contrast options
    initTheme();

    // Bind Sandbox Simulate button if it exists
    const simulateBtn = document.getElementById('simulateSmsBtn');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', runSmsSimulation);
    }
});

// Theme Button Labels for Languages
const themeButtonLabels = {
    en: { light: 'Toggle Dark Mode', dark: 'Toggle Light Mode' },
    hi: { light: 'डार्क मोड बदलें', dark: 'लाइट मोड बदलें' },
    gu: { light: 'ડાર્ક મોડ બદલો', dark: 'લાઇટ મોડ બદલો' }
};

// Theme Toggle Engine (Dark / Light Theme Contrast)
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleMobile = document.getElementById('themeToggleMobile');
    const themeIconSun = document.getElementById('themeIconSun');
    const themeIconMoon = document.getElementById('themeIconMoon');
    const themeTextMobile = document.getElementById('themeTextMobile');

    function applyTheme(theme) {
        const lang = localStorage.getItem('munshiji_lang') || 'en';
        const labels = themeButtonLabels[lang] || themeButtonLabels['en'];

        if (theme === 'light') {
            document.documentElement.classList.add('light-theme');
            if (themeIconSun) themeIconSun.classList.add('hidden');
            if (themeIconMoon) themeIconMoon.classList.remove('hidden');
            if (themeTextMobile) themeTextMobile.innerText = labels.light;
        } else {
            document.documentElement.classList.remove('light-theme');
            if (themeIconSun) themeIconSun.classList.remove('hidden');
            if (themeIconMoon) themeIconMoon.classList.add('hidden');
            if (themeTextMobile) themeTextMobile.innerText = labels.dark;
        }
        localStorage.setItem('munshiji_theme', theme);
    }

    // Toggle click listeners
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isLight = document.documentElement.classList.contains('light-theme');
            applyTheme(isLight ? 'dark' : 'light');
        });
    }

    if (themeToggleMobile) {
        themeToggleMobile.addEventListener('click', () => {
            const isLight = document.documentElement.classList.contains('light-theme');
            applyTheme(isLight ? 'dark' : 'light');
        });
    }

    // Wrap language switcher to update theme button text appropriately
    const originalApplyLang = applyLanguage;
    applyLanguage = function(lang) {
        originalApplyLang(lang);
        const activeTheme = localStorage.getItem('munshiji_theme') || 'dark';
        const labels = themeButtonLabels[lang] || themeButtonLabels['en'];
        if (themeTextMobile) {
            themeTextMobile.innerText = activeTheme === 'light' ? labels.light : labels.dark;
        }
    };

    // Initialize with stored theme or default dark mode
    const storedTheme = localStorage.getItem('munshiji_theme') || 'dark';
    applyTheme(storedTheme);
}

// Interactive SMS Arrival Simulation
let isSimulationRunning = false;

function runSmsSimulation() {
    if (isSimulationRunning) return;
    isSimulationRunning = true;

    const simulateBtn = document.getElementById('simulateSmsBtn');
    const simNotif = document.getElementById('simNotification');
    const simNotifText = document.getElementById('simNotificationText');
    const smsInput = document.getElementById('smsInput');
    const senderInput = document.getElementById('senderInput');
    const deviceInput = document.getElementById('deviceInput');

    // Disable button during simulation animation
    if (simulateBtn) {
        simulateBtn.disabled = true;
        simulateBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Simulated message content
    const sender = 'AD-HDFCBK';
    const device = 'Simulated-Phone';
    const body = 'Alert: Your HDFC Bank a/c XX4321 was debited by Rs. 12,500.00 on 14-07-26 for Amazon Order. Ref: 489201. Available balance is Rs. 43,150.00.';
    
    if (simNotifText) {
        simNotifText.innerText = body;
    }

    // 1. Slide down the simulated notification banner
    if (simNotif) {
        simNotif.classList.remove('-translate-y-full');
        simNotif.classList.add('translate-y-0');
    }

    // 2. Keep banner visible, then slide it back up and type the SMS
    setTimeout(() => {
        if (simNotif) {
            simNotif.classList.remove('translate-y-0');
            simNotif.classList.add('-translate-y-full');
        }

        // Setup immediate inputs
        if (senderInput) senderInput.value = sender;
        if (deviceInput) deviceInput.value = device;
        if (smsInput) smsInput.value = '';

        // Type the message body character-by-character
        let charIndex = 0;
        const typingInterval = setInterval(() => {
            if (smsInput && charIndex < body.length) {
                smsInput.value += body[charIndex];
                charIndex++;
                
                // Triggers parser state update reactively as typing occurs
                parseAndRender();
                smsInput.scrollTop = smsInput.scrollHeight;
            } else {
                clearInterval(typingInterval);
                finishSimulation();
            }
        }, 20); // Fast typing pace for seamless feel

    }, 2000);

    function finishSimulation() {
        // Highlight output widgets with a warm pulse glow to direct focus to parsed results
        const outFields = [
            document.getElementById('outAmount'),
            document.getElementById('outTypeBadge'),
            document.getElementById('outBank'),
            document.getElementById('outAccount'),
            document.getElementById('outRef'),
            document.getElementById('outCategory')
        ];

        outFields.forEach(el => {
            if (el) {
                el.classList.add('ring-4', 'ring-brand-accent/50', 'shadow-[0_0_20px_rgba(245,158,11,0.4)]', 'scale-105', 'transition-all', 'duration-300');
            }
        });

        // Spawn a high-fidelity visual toast indicating sync complete
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-10 right-10 z-50 bg-[#0c0e17] border-2 border-brand-green/50 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce';
        toast.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green text-sm font-bold">
                ✓
            </div>
            <div>
                <strong class="text-white text-xs block font-mono">Sync Complete</strong>
                <span class="text-slate-400 text-[10px]">Appended 1 row to Google Sheets</span>
            </div>
        `;
        document.body.appendChild(toast);

        // Reset visual feedback after a brief period
        setTimeout(() => {
            outFields.forEach(el => {
                if (el) {
                    el.classList.remove('ring-4', 'ring-brand-accent/50', 'shadow-[0_0_20px_rgba(245,158,11,0.4)]', 'scale-105');
                }
            });
            
            toast.remove();

            // Re-enable simulated action button
            if (simulateBtn) {
                simulateBtn.disabled = false;
                simulateBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
            isSimulationRunning = false;
        }, 3500);
    }
}
