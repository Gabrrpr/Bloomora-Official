# TODO: Customization Module Enhancements

## Current State
- `DescribeArrangement.jsx` — fully connected to backend, calls `check_and_generate`, shows materials used, price breakdown, availability checks, alternatives
- `MixAndMatch.jsx` — purely frontend hardcoded, NO backend connection, shows fake hardcoded result at the end
- `PollinationsService` — generates images with a basic prompt
- Backend `check_and_generate` — already checks inventory, limits, generates image, returns price breakdown

## Required Enhancements

### 1. Connect MixAndMatch to Backend API
- Fetch real products by category from `/api/v1/products/`
- Replace hardcoded `SIZES`, `TYPES`, `FOCAL_FLOWERS`, `FILLERS` with real DB products mapped by category
- On completion, call `POST /api/v1/customization/check-and-generate` with selected materials
- Show actual AI-generated image, real price breakdown, real availability status
- Handle unavailable items with alternatives (same as DescribeArrangement)

### 2. Enhanced Pollinations Prompt for Consistency
- Improve prompt template for more consistent output format
- Add florist-executable instructions (specific flower counts, real-world achievable arrangements)
- Enforce pure white background, studio lighting, photorealistic style
- Include material quantities explicitly in prompt
- Add negative prompts to avoid illustrations, fantasy elements, impossible combinations

### 3. Real-Time Availability Indicators in Frontend
- Show stock status badges on product cards ("In Stock", "Low Stock", "Out of Stock")
- Disable out-of-stock items from selection
- Show real prices from database

### 4. Accurate Price Breakdown
- Ensure frontend uses actual DB prices (already partially done in DescribeArrangement)
- Show exact products used in the generated image
- Allow adding generated arrangement to cart with correct pricing

## Plan
1. Enhance `PollinationsService` prompt template for consistency and florist executability
2. Update `MixAndMatch.jsx` to fetch real products and connect to `check_and_generate` API
3. Add stock status indicators on product selection cards
4. Ensure price breakdown accuracy across both customization flows
5. Add generated image + price breakdown display to MixAndMatch completion state

