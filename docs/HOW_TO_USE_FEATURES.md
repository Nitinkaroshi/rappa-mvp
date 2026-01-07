# How to Use All Features - User Guide

**Last Updated**: January 4, 2026

---

## Understanding the View System

Your application has **4 different views** that you can switch between using the **"Select View"** button in the top navigation:

### View Options:

1. **📄 Full View** (Default)
   - **Left Side**: Document viewer
   - **Right Side**: Editable fields with custom field entry
   - **Purpose**: Edit extracted data and add custom fields
   - **Toggle**: Switch between List view and Grid view

2. **📋 Data Only View**
   - Shows only extracted fields (no document)
   - **Checkbox Selection**: Click "Select Fields" to enable selective export
   - **Purpose**: Review data and select fields for export

3. **🖼️ Document + Fields View**
   - **Left Side**: Document viewer
   - **Right Side**: Read-only field display
   - **Purpose**: View document alongside extracted data

4. **📊 Document + Tables View**
   - **Left Side**: Document viewer
   - **Right Side**: Table data view
   - **Purpose**: Work with table/invoice line items

---

## How to Edit Extracted Fields

### Method 1: Full View (Recommended)

1. Click **"Select View"** button (top navigation)
2. Choose **"📄 Full View"**
3. On the right side, you'll see the **FieldsEditor** component
4. Click the **Edit (✏️) icon** next to any field
5. Modify the value
6. Click **Save (✓) icon** to save OR **Cancel (✗) icon** to discard
7. Click **"Save All Changes"** button at the top when done

### Method 2: Grid View (Alternative)

1. In Full View, click the **"Grid"** button (top navigation)
2. You'll see a spreadsheet-like view
3. Click any cell to edit directly
4. Changes save automatically on blur

---

## How to Add Custom Fields

### Step-by-Step:

1. Go to **Full View** (📄 Full View)
2. Scroll to the bottom of the Fields Editor
3. Click the **"+ Add Custom Field"** button
4. Enter:
   - **Field Name**: Name of your custom field
   - **Field Value**: The value
   - **Field Type**: Choose text, number, date, etc.
5. Click **"Add Field"**
6. The field is added to the **"Custom Fields"** section
7. Click **"Save All Changes"** at the top to persist

### Custom Field Features:
- ✅ Add unlimited custom fields
- ✅ Edit custom field values
- ✅ Delete custom fields (trash icon)
- ✅ Export with standard fields

---

## How to Use Selective Field Export

### Step-by-Step:

1. Click **"Select View"** → Choose **"📋 Data Only View"**
2. Click the **"Select Fields"** button in the header
3. **Checkbox selection appears** on each field
4. Choose fields using:
   - **Select All** - Check all fields
   - **Deselect All** - Uncheck all fields
   - **High Confidence (95%+)** - Auto-select only high-confidence fields
   - **Required Fields** - Auto-select only required fields
   - **Manual Selection** - Click individual checkboxes

5. Selected count shows in the badge (e.g., "15 selected")
6. Click **"Export"** button
7. Choose:
   - **Export Selected (CSV)** - Only selected fields
   - **Export Selected (Tally)** - Tally format with selected fields
   - OR choose regular export for all fields

### Visual Feedback:
- Selected fields get **indigo blue highlight** on the left border
- Background changes to light blue when selected

---

## How to Understand Validation Warnings

### What are Validation Warnings?

The system automatically validates Indian document formats and shows warnings when data doesn't match expected patterns.

### Supported Validations:

1. **Mobile Number** - 10 digits starting with 6-9 (9XXXXXXXXX)
2. **PAN Card** - ABCDE1234F format
3. **Aadhar Number** - 12 digits (XXXXXXXXXXXX)
4. **GSTIN** - 15 characters
5. **Email** - Valid email format
6. **Pincode** - 6 digits (XXXXXX)
7. **IFSC Code** - 11 characters (ABCD0123456)
8. **HSN Code** - 4-8 digits
9. **Currency** - Indian Rupee format (₹X,XXX.XX)
10. **Date** - DD/MM/YYYY or DD-MM-YYYY

### Where to See Warnings:

1. **Header Badge**: Shows total error count (e.g., "3 format errors")
2. **Field Level**: Orange gradient box appears below invalid fields
3. **Error Details**:
   - Shows error message
   - Shows expected format
   - Example: "Expected: 9XXXXXXXXX"

### How to Fix:

1. Look for **orange warning boxes** below fields
2. Read the error message
3. See the expected format
4. Edit the field value to match the format
5. Save changes
6. Warning disappears on next load

---

## How to Use Color-Coded Confidence

### Understanding Confidence Levels:

The system shows extraction confidence with color-coded badges:

- **🟢 Green (95-100%)** - High confidence, trust this data
- **🟡 Yellow (90-95%)** - Medium confidence, might want to verify
- **🔴 Red (<90%)** - Low confidence, definitely verify

### Where You See Confidence:

1. **Document Header** - Large confidence indicator for overall extraction
2. **Individual Fields** - Small badge next to each field value
3. **Hover Effect** - Hover to see exact percentage

### Visual Features:

- **Pulsing Dot** - Animated indicator for visual appeal
- **Gradient Background** - Color-matched gradient backgrounds
- **Hover Animation** - Slight scale effect on hover

### How to Use:

1. **Quick Scan**: Look for red/yellow badges - those need verification
2. **Export by Confidence**: Use "High Confidence (95%+)" selection preset
3. **Quality Assurance**: Focus verification efforts on low-confidence fields

---

## Complete Workflow Example

### Scenario: Processing an Invoice

1. **Upload** (Upload page)
   - Select invoice PDF
   - Upload to system
   - Wait for processing (real-time status updates)

2. **Review** (Data Only View)
   - Check extraction quality
   - Look for validation warnings (orange boxes)
   - Note low-confidence fields (red/yellow badges)

3. **Edit** (Full View)
   - Switch to Full View
   - Edit any incorrect values
   - Fix validation errors
   - Add custom fields if needed (e.g., "Purchase Order Number")
   - Save all changes

4. **Export** (Data Only View)
   - Switch to Data Only View
   - Click "Select Fields"
   - Choose "High Confidence (95%+)" to auto-select reliable fields
   - Manually add any corrected fields
   - Export Selected (CSV) or Export Selected (Tally)

5. **Done!**
   - Downloaded file contains only selected, verified fields
   - Ready for import into accounting system

---

## View Selection Guide

### When to Use Each View:

| View | Best For | Key Feature |
|------|----------|-------------|
| **Full View** | Editing data, adding custom fields | Inline editing + custom fields |
| **Data Only** | Selecting fields for export | Checkbox selection |
| **Document + Fields** | Verifying extraction against document | Side-by-side comparison |
| **Document + Tables** | Working with invoice line items | Table data view |

---

## Common Questions

### Q: Why can't I see checkboxes?
**A**: You're not in the right view.
- Go to **"Select View"** → **"📋 Data Only View"**
- Click **"Select Fields"** button
- Checkboxes will appear

### Q: How do I edit a field value?
**A**: You need to be in Full View.
- Click **"Select View"** → **"📄 Full View"**
- Click the **Edit (✏️) icon** next to the field
- Make changes
- Click **Save (✓)**

### Q: Where did the custom field entry go?
**A**: It's in the Full View.
- Click **"Select View"** → **"📄 Full View"**
- Scroll to the bottom
- Click **"+ Add Custom Field"**

### Q: How do I export only certain fields?
**A**: Use selective export.
- Go to **"📋 Data Only View"**
- Click **"Select Fields"**
- Check the fields you want
- Click **Export** → **"Export Selected (CSV)"**

### Q: What do the orange boxes mean?
**A**: Validation warnings.
- Orange box = Field value doesn't match expected format
- Read the error message
- Fix the value in Full View
- Warning will disappear

### Q: What do the colored badges mean?
**A**: Confidence levels.
- 🟢 Green = High confidence (95-100%)
- 🟡 Yellow = Medium confidence (90-95%)
- 🔴 Red = Low confidence (<90%)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Esc** | Close modals/cancel editing |
| **Enter** | Save field (when editing) |
| **Tab** | Move to next field (in Grid view) |

---

## Tips & Tricks

### 🎯 Efficiency Tips:

1. **Use Quick Presets**: Don't manually select 50 fields - use "High Confidence (95%+)" preset
2. **Fix Before Export**: Correct validation errors before exporting to avoid data issues
3. **Grid View for Bulk Editing**: Use Grid view when editing many fields quickly
4. **Custom Fields for Missing Data**: Add custom fields for data that wasn't extracted
5. **Confidence as Quality Check**: Sort by confidence to prioritize verification

### ⚡ Speed Tips:

1. **Default View**: Set your most-used view as default
2. **Keyboard Navigation**: Use Tab key in Grid view
3. **Batch Processing**: Process multiple documents, then review all in Data Only view
4. **Export Presets**: Create standard export selections for common use cases

---

## Troubleshooting

### Issue: "I can't find the edit button"
- **Solution**: Make sure you're in **Full View**, not Data Only view

### Issue: "Checkboxes aren't appearing"
- **Solution**: Click the **"Select Fields"** button in Data Only view header

### Issue: "My custom field disappeared"
- **Solution**: You didn't click **"Save All Changes"** - custom fields are only saved when you click save

### Issue: "Validation warning won't go away"
- **Solution**: The value still doesn't match the format. Check the expected format and fix the value exactly

### Issue: "Export is including all fields, not just selected"
- **Solution**: Make sure you clicked **"Export Selected (CSV)"** not **"Export as CSV"**

---

## Summary of Key Locations

### To Edit Fields:
📍 **Full View** → Click Edit icon → Modify → Save

### To Add Custom Fields:
📍 **Full View** → Scroll down → "+ Add Custom Field"

### To Select Fields for Export:
📍 **Data Only View** → "Select Fields" → Check boxes → Export Selected

### To See Validation Warnings:
📍 **Any view** → Look for orange boxes below fields

### To Check Confidence:
📍 **Any view** → Look for colored badges (🟢🟡🔴)

---

**Need Help?** Check the demo video or contact support!
