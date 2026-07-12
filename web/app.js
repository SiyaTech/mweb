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
    alert("Munshiji APK download initiated! If the download does not start automatically, please build the app using 'compile_applet' inside your workspace. Output APK is stored at: /app/build/outputs/apk/debug/app-debug.apk");
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
    const escapedBody = body.replace(/"/g, '\\"');
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
                alert("Copied Google Sheets row to clipboard!");
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

// Initialize Sandbox on page load with default template
window.addEventListener('DOMContentLoaded', () => {
    setPlaygroundTemplate('hdfc_debit');
});
