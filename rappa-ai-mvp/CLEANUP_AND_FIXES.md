# Code Cleanup and Image Processing Fixes

**Date:** January 3, 2026
**Issues Addressed:**
1. Remove unwanted YOLO and v1_legacy code
2. Fix merged invoice processing issue
3. Clean up unused dependencies

---

## Issue 1: Unwanted Code Found

### YOLO References (Unused)
**Files with YOLO code:**
- `app/config.py` - Lines 174-179 (YOLO config)
- `app/services/extraction_service.py` - Lines 31, 50-70 (YOLO detector methods)

**Problem:** These reference `v1_legacy/services/yolo_detector.py` which doesn't exist

**Action:** Remove all YOLO-related code

---

### V1 Legacy Imports (Non-existent)
**Files with v1_legacy imports:**
- `app/services/extraction_service.py` - 7 imports from v1_legacy

**Problem:** v1_legacy directory doesn't exist, causing potential import errors

**Action:** Remove or refactor these services

---

### Unused Dependencies
**Currently in requirements.txt but NOT used:**
- `pdf2image==1.17.0` - Not imported anywhere
- `pdfplumber==0.10.3` - Not imported anywhere
- `onnxruntime==1.16.3` - Not imported (needed for YOLO)
- `transliterate==1.10.2` - Not imported anywhere
- `indic-transliteration==2.3.75` - Not imported anywhere

**Action:** Remove from requirements.txt

---

## Issue 2: Merged Invoice Processing Problem

### Scenario
**User Action:** Merged 2 invoices into 1 PDF and uploaded
**Expected:** Extract data from BOTH invoices
**Actual:** Only got data from 1st invoice

### Root Cause Analysis

```
Merged PDF (2 invoices, 2-4 pages total)
    ↓
PDF Classifier: IMAGE_LIGHT (≤2 images per page)
    ↓
document_processor.py: Calls render_all_pages_to_images()
    ↓
Gemini Vision API: Receives ALL pages (2-4 images)
    ↓
Problem: Gemini tries to extract ONE document from MULTIPLE invoices
    ↓
Result: Returns data from first invoice only
```

### Why 46-Page Sale Deed Worked
```
46-page PDF (single document)
    ↓
PDF Classifier: IMAGE_HEAVY (>2 images)
    ↓
Uses OCR instead of Gemini Vision
    ↓
Extracts ALL text from ALL pages
    ↓
Sends combined text to Gemini Text API
    ↓
Success: Returns complete document data
```

### Current Limitations
1. **No page limit** for Gemini Vision API calls
2. **No per-document separation** for merged PDFs
3. **Gemini Vision API limits:**
   - Recommended: 1-5 images per request
   - Maximum: 10 images (unofficial)
   - Token limit: ~1M tokens (images count towards this)

### Solution Strategy

**Option A: Add Page Limit for Vision API** (Quick Fix)
- Limit Gemini Vision to first 10 pages only
- Add warning for documents >10 pages
- Prevents API errors and timeouts

**Option B: Intelligent Document Separation** (Better, but complex)
- Detect multiple invoices in merged PDF
- Process each invoice separately
- Combine results
- More accurate for batch uploads

**Option C: Force OCR for Multi-Invoice** (Hybrid)
- If PDF has repeating patterns (multiple invoices), use OCR
- Add heuristic detection for merged documents
- Fallback to OCR when unsure

**Recommended:** Start with Option A (quick fix), then implement Option C

---

## Fixes to Implement

### Fix 1: Remove YOLO Code

**File: `app/config.py`**
Remove lines 174-179:
```python
# YOLO Table Detection
YOLO_MODEL_PATH: str = Field(...)
YOLO_CONF_THRESHOLD: float = Field(...)
```

**File: `app/services/extraction_service.py`**
Remove:
- Line 31: `self._yolo_detector = None`
- Lines 50-70: `_get_yolo_detector()` method
- All YOLO imports and references

---

### Fix 2: Clean Up Dependencies

**File: `requirements.txt`**
Remove these lines:
```
pdf2image==1.17.0
pdfplumber==0.10.3
onnxruntime==1.16.3
transliterate==1.10.2
indic-transliteration==2.3.75
```

Keep only:
```
PyMuPDF==1.26.7  # Actually used for PDF processing
google-generativeai==0.8.5  # Actually used for Gemini API
```

---

### Fix 3: Add Page Limit for Gemini Vision

**File: `app/config.py`**
Add new setting:
```python
# Vision API Limits
MAX_VISION_IMAGES: int = Field(
    default=10,
    description="Maximum images to send to Gemini Vision API per request"
)
```

**File: `app/services/document_processor.py`**
Update line 62 to limit pages:
```python
# Before
page_images = self.pdf_classifier.render_all_pages_to_images(pdf_path, dpi=250)

# After
page_images = self.pdf_classifier.render_all_pages_to_images(
    pdf_path,
    dpi=250,
    max_pages=10  # Limit for Gemini Vision
)
logger.warning(f"Document has {page_count} pages. Processing first 10 for Vision API.")
```

**File: `app/services/pdf_classifier.py`**
Update `render_all_pages_to_images()` method:
```python
def render_all_pages_to_images(
    self,
    pdf_path: Path,
    dpi: int = 250,
    max_pages: Optional[int] = None
) -> List[Image.Image]:
    """Render PDF pages to images with optional page limit."""
    doc = fitz.open(pdf_path)
    images = []

    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)

    # Limit pages if specified
    total_pages = len(doc)
    pages_to_process = min(total_pages, max_pages) if max_pages else total_pages

    if max_pages and total_pages > max_pages:
        logger.warning(
            f"Document has {total_pages} pages. "
            f"Processing first {max_pages} for Vision API."
        )

    for page_num in range(pages_to_process):
        page = doc[page_num]
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        images.append(img)

    doc.close()

    logger.info(f"Rendered {len(images)} pages at {dpi} DPI")

    return images
```

**File: `app/services/gemini_service.py`**
Add validation in `extract_fields_from_images()`:
```python
def extract_fields_from_images(
    self,
    images: List[Image.Image],
    text_context: Optional[str] = None
) -> Dict[str, Any]:
    # Add image count check
    if len(images) > 10:
        logger.warning(
            f"Received {len(images)} images. "
            "Gemini Vision API works best with 1-10 images. "
            "Consider using OCR for documents with many pages."
        )
        # Process only first 10 images
        images = images[:10]

    logger.info(f"Extracting fields from {len(images)} images using Gemini Vision")

    # ... rest of method
```

---

### Fix 4: Better Document Type Detection

**File: `app/services/pdf_classifier.py`**
Update `IMAGE_LIGHT` threshold:
```python
# Current logic
elif image_count <= 2:
    pdf_type = PDFType.IMAGE_LIGHT

# Better logic (avoid Gemini Vision for merged docs)
elif image_count <= 2 and page_count <= 5:
    # Only use Vision API for small documents (≤5 pages)
    pdf_type = PDFType.IMAGE_LIGHT
else:
    # Use OCR for anything larger
    pdf_type = PDFType.IMAGE_HEAVY
```

This ensures merged invoices (2+ pages) use OCR instead of Vision API.

---

## Expected Results After Fixes

### Scenario 1: Single Invoice (2 pages)
- Classified as: IMAGE_LIGHT
- Method: Gemini Vision API
- Pages processed: 2 (all)
- ✅ Works correctly

### Scenario 2: Merged 2 Invoices (4 pages)
- **Before:** IMAGE_LIGHT → Vision API → Only 1st invoice extracted
- **After:** IMAGE_HEAVY → OCR + Gemini Text → Both invoices extracted
- ✅ Fixed

### Scenario 3: 46-Page Sale Deed
- Classified as: IMAGE_HEAVY
- Method: OCR + Gemini Text
- Pages processed: All 46
- ✅ Already works

### Scenario 4: 100-Page Document
- Classified as: IMAGE_HEAVY
- Method: OCR + Gemini Text
- Pages processed: First 25 (MAX_OCR_PAGES limit)
- ⚠️ Warning shown to user

---

## Testing Checklist

After implementing fixes:

- [ ] Test single 2-page invoice
- [ ] Test merged 2 invoices (4 pages total)
- [ ] Test merged 3 invoices (6 pages total)
- [ ] Test 10-page document
- [ ] Test 20-page document
- [ ] Test 46-page sale deed (regression test)
- [ ] Verify no YOLO import errors
- [ ] Verify unused packages removed
- [ ] Check logs for warnings

---

## Implementation Priority

1. **High Priority** (Do immediately):
   - Remove YOLO code (prevents errors)
   - Add page limit to Gemini Vision (fixes merged invoice issue)
   - Update IMAGE_LIGHT threshold (prevents future issues)

2. **Medium Priority** (Do soon):
   - Clean up unused dependencies
   - Add image count warnings

3. **Low Priority** (Nice to have):
   - Add user-facing warning for large documents
   - Implement intelligent document separation (future feature)

---

## Notes for Future

### Gemini API Limits
- **Vision API:** Best with 1-5 images, max ~10 images
- **Text API:** Can handle very long text (1M tokens)
- **Context Window:** Gemini 2.0 Flash = 1M tokens
- **Rate Limits:** 1000 requests/minute (check current tier)

### PDF Processing Strategy
```
Document Type         | Pages | Method       | API Used
---------------------|-------|--------------|------------------
Single Invoice       | 1-2   | Vision       | Gemini Vision
Small Document       | 3-5   | Vision       | Gemini Vision
Medium Document      | 6-25  | OCR → Text   | Gemini Text
Large Document       | 26+   | OCR → Text   | Gemini Text (first 25)
Merged Invoices      | Any   | OCR → Text   | Gemini Text
```

---

**End of Document**
