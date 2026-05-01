# TODO: Move vases from products table to vases table in Supabase

## Task Summary
Move vases from hardcoded data in VasesPage.jsx to be fetched from the vases table in Supabase database.

## Steps to Complete:

### Step 1: Update Vase Model
- [ ] Add missing fields to Vase model: original_price, rating, reviews, ribbon, category

### Step 2: Create Database Migration
- [ ] Create alembic migration to add new columns to vases table

### Step 3: Update Seed Script
- [ ] Modify seed_products.py to also create Vase records in vases table

### Step 4: Add API Endpoint
- [ ] Add new /vases endpoints in products.py or create vases.py route

### Step 5: Update Frontend
- [ ] Update VasesPage.jsx to fetch from API instead of hardcoded data

### Step 6: Test and Verify
- [ ] Run migration to apply schema changes
- [ ] Run seed script to populate vases table
- [ ] Test API returns correct data
- [ ] Verify frontend displays vases correctly
