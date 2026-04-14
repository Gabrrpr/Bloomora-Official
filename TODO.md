# Task: Fix Backend ImportError + Add Watermark Feature (Updated)

## Progress
- [x] Step 1: Edit apps/backend/app/schemas/customization.py to add PriceBreakdownItem and PriceBreakdown models  
- [x] Step 2: Verify uvicorn starts: cd apps/backend && python -m uvicorn app.main:app --reload

## Remaining Steps for Watermark Feature
- [x] Step 3a: Update requirements.txt → add Pillow + supabase (if missing). Run `cd apps/backend && pip install -r requirements.txt`
- [x] Step 3b: Update app/core/config.py → add SUPABASE_BUCKET = \"arrangements\"

- [x] Step 3c: Edit app/services/pollinations_service.py → implement download/watermark/upload logic (use httpx/PIL/supabase client)
- [x] Step 3d: Fix tests/test_ai_service.py → make runnable or skip
- [ ] Step 3e: Test endpoint POST /api/v1/customization/check-and-generate (curl or Swagger)
- [ ] Step 4: Complete → verify watermarked images in Supabase, update this TODO

**Next**: Test endpoint. Run:
```
cd apps/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
Open http://localhost:8000/docs → POST /api/v1/customization/check-and-generate
Check Supabase for watermarked PNGs.

