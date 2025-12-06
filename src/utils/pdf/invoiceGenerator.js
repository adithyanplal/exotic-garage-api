const puppeteer = require('puppeteer');
const QRCode = require('qrcode'); // Library for QR code generation
const path = require('path');
const fs = require('fs');
const ftp = require("basic-ftp");

// Ultimate Professional Color Palette
const PRIMARY_COLOR = '#212529'; // Near-Black/Deep Charcoal
const SECONDARY_COLOR = '#495057'; // Dark Grey for subheadings
const LIGHT_GREY = '#e9ecef'; // Very Light Grey for subtle shading/dividers
const ACCENT_COLOR = PRIMARY_COLOR; // Monochromatic accent
const GST_RATE = 0.18; // 18% GST as used in the UI component

// Helper function for safe data access
function safe(str, fallback = '') {
    return (str ?? fallback).toString();
}

/**
 * Utility function to convert date from YYYY-MM-DD (input field format) to DD-MM-YYYY.
 * @param {string} dateString - Date string in YYYY-MM-DD format.
 * @returns {string} Formatted date string or original string if parsing fails.
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-'); 
    if (parts.length === 3) {
        // parts[0] = YYYY, parts[1] = MM, parts[2] = DD
        return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
    }
    return dateString;
}

/**
 * Generates the HTML content for the invoice.
 * @param {object} data - Processed invoice data.
 * @param {string} qrCodeDataUrl - Base64 data URL for the QR code image.
 * @returns {string} The complete HTML string.
 */
function getInvoiceHtml(data, qrCodeDataUrl) {
    const { 
        customer, items, payment, subtotal, gstAmount, discount, 
        netBalance, paidAmount, balanceDue, logoPath
    } = data;
    
    // 1. Items List
    const itemsHtml = (items || []).map(item => {
        // Apply date formatting to warranty fields
        const formattedWarranty = (item.warrantyFrom && item.warrantyTo) 
            ? `<br><small style="color: ${SECONDARY_COLOR};">Warranty: ${formatDate(safe(item.warrantyFrom))} to ${formatDate(safe(item.warrantyTo))}</small>` 
            : '';
        
        // Use item.name and item.description for the service description column
        const serviceDescription = `
            ${safe(item.name)}
            ${item.description ? `<br><small style="color: ${SECONDARY_COLOR};">${safe(item.description)}</small>` : ''}
            ${formattedWarranty}
        `;
        const lineTotal = Number(item.qty || 1) * Number(item.price || 0);

        return `
            <tr>
                <td>${serviceDescription}</td>
                <td class="numeric col-qty">${Number(item.qty || 1).toFixed(0)}</td>
                <td class="numeric col-price">₹${Number(item.price || 0).toFixed(2)}</td>
                <td class="numeric col-amount">₹${lineTotal.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    // 2. GST Line (conditional based on UI's 'taxable' state)
    const gstHtml = payment.taxable 
        ? `<tr class="sub-line"><td>GST (${(GST_RATE * 100).toFixed(0)}%):</td><td class="numeric">₹${gstAmount.toFixed(2)}</td></tr>`
        : '';
        
    // 3. Main HTML Template with Tighter Styling
    return `
<html>
<head>
    <meta charset="utf-8" />
    <style>
        /* Base Styling */
        @page { margin: 25mm; } 
        body { 
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            font-size: 11px; 
            color: ${PRIMARY_COLOR};
            line-height: 1.5;
        }
        .container { padding: 0; }
        
        /* --- HEADER ALIGNMENT FOCUS --- */
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 25px;
            border-bottom: 2px solid ${PRIMARY_COLOR}; 
            padding-bottom: 10px;
        }
        .header .title { padding-left: 0; }
        .header .title h2 { 
            font-size: 26px;
            margin: 0; 
            font-weight: 300; 
            color: ${PRIMARY_COLOR}; 
            letter-spacing: 2.5px;
            text-transform: uppercase;
        }
        .subtitle { 
            font-size: 10px; 
            margin-top: 3px;
            color: ${SECONDARY_COLOR}; 
            font-weight: 400; 
            letter-spacing: 1px;
        }
        /* Consolidated Address Block */
        .address { 
            font-size: 9px; 
            line-height: 1.4;
            color: ${SECONDARY_COLOR}; 
            margin-top: 5px;
        }
        
        /* QR Code & Logo Styling */
        .header-logo-container {
            display: flex;
            align-items: center;
            gap: 15px; /* Space between logo and QR */
        }
        .logo-img { 
            width: 70px;
            height: 70px; 
            object-fit: contain; 
        }
        .qr-code {
            width: 70px;
            height: 70px;
            flex-shrink: 0;
            border: 1px solid ${LIGHT_GREY};
        }
        .qr-code img { width: 100%; height: 100%; }

        /* Info Section (Customer & Order) */
        .section-info { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0 25px 0;
            padding: 0;
            font-size: 11px; 
            line-height: 1.6;
        }
        .info-box { width: 48%; }
        .info-box strong { 
            color: ${SECONDARY_COLOR}; 
            font-weight: 600;
            display: block; 
            padding-bottom: 2px;
            margin-bottom: 5px;
            text-transform: uppercase;
            font-size: 10px;
        }
        .customer-name { 
            font-weight: 700; 
            color: ${PRIMARY_COLOR}; 
            font-size: 12px;
        }
        .invoice-number {
            font-size:14px; 
            font-weight:700; 
            color:${PRIMARY_COLOR}; 
            letter-spacing: 0.5px;
            display: inline-block;
            margin-top: 5px;
            border-bottom: 1px solid ${SECONDARY_COLOR};
        }

        /* Items Table */
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 8px 10px; font-size: 11px; line-height: 1.4; border: none; }
        .items-table { margin-top: 15px; }
        
        .items-table thead th { 
            background-color: ${LIGHT_GREY}; 
            color: ${PRIMARY_COLOR};
            font-weight: 700; 
            text-transform: uppercase;
            border-bottom: 1px solid ${PRIMARY_COLOR};
            border-top: 1px solid ${PRIMARY_COLOR};
        }
        .items-table tbody tr { border-bottom: 1px solid #f1f1f1; } 
        .items-table tbody tr:last-child { border-bottom: 2px solid ${PRIMARY_COLOR}; } 
        
        .numeric { text-align: right; }
        .col-qty { width: 10%; }
        .col-price { width: 15%; }
        .col-amount { width: 20%; font-weight: 600; } 
        
        /* Totals Table */
        .totals-table { 
            float: right; 
            width: 45%; 
            margin-top: 30px;
            border: 1px solid ${LIGHT_GREY};
            background-color: #fff;
        }
        .totals-table td:first-child { width: 60%; } /* Control label width */
        .totals-table td { 
            padding: 8px 12px; 
            border-top: 1px solid ${LIGHT_GREY}; 
            font-weight: 500;
        }
        .totals-table tr:first-child td { border-top: none; }
        
        /* Highlighted Totals */
        .totals-table tr:nth-child(${payment.taxable ? '4' : '3'}) td, 
        .totals-table tr:nth-child(${payment.taxable ? '6' : '5'}) td { 
            background-color: ${PRIMARY_COLOR}; 
            font-weight: 800; 
            color: white; 
            text-transform: uppercase;
            padding: 10px 12px;
        }
        
        /* Footer Elements */
        .remarks-section { 
            margin-top: 30px; 
            padding: 15px 0; 
            clear: both;
            font-size: 10px;
            color: #555;
            border-top: 1px solid ${LIGHT_GREY};
        }
        .signature-section { 
            margin-top: 60px;
            text-align: right;
            font-size: 10px;
        }
        .signature-section div {
            width: 45%;
            float: right;
            border-top: 1px solid ${PRIMARY_COLOR};
            padding-top: 5px;
            margin-right: 5px;
        }
        .disclaimer {
            font-size: 8px;
            color: ${SECONDARY_COLOR};
            margin-top: 20px;
            text-align: center;
            clear: both;
        }
    </style>
</head>
<body>
<div class="container">

    <div class="header">
        <div class="title">
            <h2>EXOTIC GARAGE ANCHAL</h2>
            <div class="subtitle">Luxury Care For Your Wheels</div>
            <div class="address">
                Near Shri Alappan Nada Temple, Alayamon, Anchal, Pin 691306, Kollam Kerala | Ph: 9747333493, 9188112664
            </div>
        </div>
        <div class="header-logo-container">
          
            <div>
                <img src="${logoPath}" alt="Logo" class="logo-img" style="border-radius:50%">
            </div>
        </div>
    </div>

    <div class="section-info">
        <div class="info-box">
            <strong>BILLED TO</strong>
            <span class="customer-name">${safe(customer.name)}</span><br/>
            ${safe(customer.address)}<br/>
            Phone: ${safe(customer.phone)}<br/>
            Email: ${safe(customer.email)}
        </div>
        <div class="info-box" style="text-align:right;">
            <strong>INVOICE</strong>
            <span class="invoice-number">${safe(customer.invoiceNo)}</span><br/>
            Vehicle No: ${safe(customer.vehicleNo)}<br/>
            Date Issued: ${formatDate(safe(customer.date))}<br/>
            Payment Method: ${safe(payment.method)}
        </div>
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="text-align: left;">SERVICE DESCRIPTION</th>
                <th class="col-qty">QTY</th>
                <th class="col-price">UNIT PRICE</th>
                <th class="col-amount">AMOUNT (₹)</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHtml}
        </tbody>
    </table>

    <table class="totals-table">
        <tbody>
            <tr><td>Subtotal</td><td class="numeric">₹${subtotal.toFixed(2)}</td></tr>
            ${gstHtml}
            <tr><td>Discount</td><td class="numeric">₹${discount.toFixed(2)}</td></tr>
            <tr><td><strong>NET AMOUNT</strong></td><td class="numeric">₹${netBalance.toFixed(2)}</td></tr>
            <tr><td>Paid Amount</td><td class="numeric">₹${paidAmount.toFixed(2)}</td></tr>
            <tr><td><strong>BALANCE DUE</strong></td><td class="numeric">₹${balanceDue.toFixed(2)}</td></tr>
        </tbody>
    </table>
    
    <div class="remarks-section">
        <strong>NOTES:</strong> Paid via ${safe(payment.method)}. ${payment.taxable ? 'GST applied.' : 'GST not applied.'}
    </div>
    
    <div class="signature-section">
        <div>
            <p>Authorized Signature<br>For EXOTIC GARAGE ANCHAL </p>
        </div>
    </div>
    
    <div class="disclaimer">
        <p>This document constitutes a professional services invoice. Thank you for your business.</p>
    </div>

</div>
</body>
</html>
`;
}


/**
 * Generates an invoice PDF with ultimate professional and premium styling,
 * using the data structure from the React 'Sales' component.
 * @param {object} inputData - The data required for the invoice (customer, items, payment).
 * @returns {Promise<string>} The file path of the generated PDF.
 */
// ============ HOSTINGER UPLOAD FUNCTION ============

async function uploadToHostinger(localFilePath, remoteFileName) {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    try {
        await client.access({
             host: "ftp.exoticgarage.in",            // Hostinger FTP host
            port: 21,                        // FTP port
            user: "u351746020.exoticgarage.in", // FTP username
            password: "1O$e/JNV8TQ&j2K$",    // FTP password
            secure: false           
        });

        const remotePath = `/public_html/erp/invoices/${remoteFileName}`;

        await client.uploadFrom(localFilePath, remotePath);

        console.log("Uploaded:", remoteFileName);

        return {
            filePath: localFilePath,
            publicUrl: `https://exoticgarage.in/erp/invoices/${remoteFileName}`
        };

    } catch (err) {
        console.error("FTP Upload Failed:", err);
        throw err;

    } finally {
        client.close();
    }
}


// ============ MAIN GENERATION + UPLOAD FUNCTION ============
async function generateInvoicePDF(inputData) {
    const { customer, items, payment } = inputData;

    // Calculations
    const subtotal = items.reduce((sum, i) => sum + (Number(i.qty || 0) * Number(i.price || 0)), 0);
    const gstAmount = payment.taxable ? subtotal * GST_RATE : 0;
    const grandTotal = subtotal + gstAmount;
    const discount = 0;
    const netBalance = grandTotal - discount;
    const paidAmount = Number(payment.paidAmount || 0);
    const balanceDue = netBalance - paidAmount;

    // Output directory
    const invoicesDir = path.join(__dirname, '../../invoices');
    if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });

    // Filename
    const safeInvoiceNo = safe(customer.invoiceNo || 'NA').replace(/[\\/]/g, '-');
    const safeCustomerName = safe(customer.name || 'Customer').replace(/\s+/g, '_');
    const fileName = `Invoice-${safeCustomerName}-${safeInvoiceNo}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    // QR Code
    const qrCodeContent = `Invoice: ${safeInvoiceNo} | Net: ₹${netBalance.toFixed(2)} | Due: ₹${balanceDue.toFixed(2)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeContent, { margin: 1, width: 70 });

    // Logo
    const logoPath = "https://exoticgarage.in/erp/assets/constants/exotic-garage-logo.png";

    const data = {
        customer, items, payment, subtotal, gstAmount, discount,
        netBalance, paidAmount, balanceDue, logoPath
    };

    const html = getInvoiceHtml(data, qrCodeDataUrl);

    // Puppeteer PDF
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        await page.pdf({
            path: filePath,
            format: 'A4',
            printBackground: true,
            margin: { top: "15mm", bottom: "15mm", left: "15mm", right: "15mm" }
        });

        console.log("PDF Generated:", filePath);

    } catch (err) {
        console.error("PDF Error:", err);
        throw err;

    } finally {
        if (browser) await browser.close();
    }

    // --- UPLOAD TO HOSTINGER ---
    const publicUrl = await uploadToHostinger(filePath, fileName);

    return { filePath, publicUrl };
}

module.exports = { generateInvoicePDF };