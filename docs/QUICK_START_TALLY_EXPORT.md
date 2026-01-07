# Quick Start: Tally Export Feature

## ⚡ 30-Second Overview

Extract invoice data → Click button → Download XML → Import to Tally → Done! ✅

---

## 🎯 User Flow

```
1. Upload Invoices
   ↓
2. AI Extracts Data
   ↓
3. Review Results
   ↓
4. Click "Export to Accounting Software"
   ↓
5. Select "Tally Prime"
   ↓
6. Configure Ledgers (30 seconds)
   ↓
7. Preview Vouchers
   ↓
8. Download XML
   ↓
9. Import to Tally Prime
   ↓
10. ✅ All vouchers posted!
```

---

## 🚀 How to Test

### Test in 5 Minutes:

1. **Login**: http://localhost:5173/login
   - Email: `demo@rappa.ai`
   - Password: `Demo123456`

2. **Upload Test Invoices**:
   - Go to "Upload" page
   - Select template: "Indian Invoice" or "Purchase Invoice"
   - Upload 2-3 sample invoices
   - Wait for extraction (~30 seconds)

3. **Open Job Results**:
   - Click on completed job
   - View extracted data

4. **Export to Tally**:
   - Click "Download" button (top right)
   - Click "Export to Accounting Software"
   - Modal opens with 3-step wizard

5. **Step 1 - Select Tally**:
   - Shows "Tally Prime" option
   - Shows validation status
   - Click on Tally Prime card

6. **Step 2 - Configure**:
   - Voucher Type: "Purchase"
   - Party Ledger: "Sundry Creditors"
   - CGST/SGST/IGST ledgers
   - Click "Preview"

7. **Step 3 - Download**:
   - See preview of vouchers
   - Click "Download Export"
   - File downloads: `tally_export_123.xml`

8. **Import to Tally** (if you have Tally installed):
   - Open Tally Prime
   - Gateway of Tally → Import → Vouchers
   - Select the XML file
   - Vouchers imported! ✅

---

## 📁 Key Files to Know

### Backend:
- **Tally Exporter**: `backend/app/services/accounting/tally_exporter.py`
- **API Endpoints**: `backend/app/api/accounting_export.py`
- **Router Registration**: `backend/app/main.py:269`

### Frontend:
- **Export Modal**: `frontend/src/components/accounting/AccountingExportModal.jsx`
- **API Service**: `frontend/src/services/api.js` (lines 631-716)
- **Job Results**: `frontend/src/pages/JobResults.jsx` (lines 368-374, 712-719)

---

## 🔧 Configuration Options

### Voucher Types:
- **Purchase** - For purchase invoices (most common)
- **Sales** - For sales invoices
- **Payment** - For payment vouchers
- **Receipt** - For receipt vouchers

### Default Ledger Mappings:
```javascript
{
  "party": "Sundry Creditors",     // For suppliers
  "purchase": "Purchase",           // Purchase account
  "sales": "Sales",                 // Sales account
  "cgst": "CGST Payable",          // Central GST
  "sgst": "SGST Payable",          // State GST
  "igst": "IGST Payable"           // Integrated GST
}
```

---

## 🐛 Troubleshooting

### Error: "Failed to load supported software"
**Fix**: Backend server not running. Restart backend.

### Error: "Data validation failed"
**Fix**: Missing required fields. Ensure job has `invoice_date`, `invoice_number`, `total_amount`.

### Error: "Job must be completed before export"
**Fix**: Wait for job to finish processing. Status must be "completed".

### Error: Modal doesn't open
**Fix**: Check browser console for errors. Ensure frontend is running.

---

## 📊 Sample Data Structure

### What Gets Exported:

```json
{
  "voucher_type": "Purchase",
  "date": "20240115",
  "party_name": "ABC Suppliers",
  "voucher_number": "INV001",
  "ledger_entries": [
    {
      "ledger_name": "Sundry Creditors",
      "amount": -59000.00,
      "is_party_ledger": true
    },
    {
      "ledger_name": "Purchase",
      "amount": 50000.00
    },
    {
      "ledger_name": "CGST Payable",
      "amount": 4500.00
    },
    {
      "ledger_name": "SGST Payable",
      "amount": 4500.00
    }
  ]
}
```

---

## 🎬 Demo Talking Points

1. **The Problem**:
   - "Manual Tally entry takes 5-10 minutes per invoice"
   - "High error rate, especially with GST amounts"
   - "100 invoices = 10 hours of boring work"

2. **The Solution**:
   - "AI extracts all data automatically"
   - "One-click export to Tally XML"
   - "Import 100 invoices in 30 seconds"

3. **The Value**:
   - "90% time savings"
   - "Near-zero errors"
   - "Perfect GST compliance"
   - "Focus on business, not data entry"

---

## 🔗 API Endpoints

### Base URL: `http://localhost:8001/api/v1`

```
GET    /accounting-export/supported-software
GET    /accounting-export/{software}/config
POST   /accounting-export/validate
POST   /accounting-export/preview
POST   /accounting-export/generate
```

---

## ✅ Testing Checklist

- [ ] Backend server running on port 8001
- [ ] Frontend running on port 5173
- [ ] Can login with demo account
- [ ] Can upload invoices
- [ ] Job completes successfully
- [ ] "Export to Accounting Software" button visible
- [ ] Modal opens when clicked
- [ ] Tally Prime shows in Step 1
- [ ] Can configure settings in Step 2
- [ ] Preview shows in Step 3
- [ ] Download works
- [ ] XML file is valid
- [ ] (Optional) Import to Tally works

---

## 🎉 Success!

If you can complete the 5-minute test above, the integration is working! 🚀

**Next**: Try with real invoices, import to real Tally, show to your boss! 💪
