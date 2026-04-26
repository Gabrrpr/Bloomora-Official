# TODO: Admin Hero Customization + Default Home Page

## Tasks
- [x] 1. Change default landing page from login to home (App.jsx)
- [x] 2. Create backend model `SiteCustomization` for key-value JSON storage
- [x] 3. Export `SiteCustomization` from models/__init__.py
- [x] 4. Create Pydantic schemas for hero customization
- [x] 5. Create backend API routes for GET/PUT hero slides
- [x] 6. Register new router in main.py
- [x] 7. Add API methods to frontend api.js
- [x] 8. Update HeroCarousel to fetch slides from API with fallback
- [x] 9. Create AdminHero.jsx page for editing hero slides
- [x] 10. Add Hero Section nav item to AdminDashboard sidebar + renderMain
- [x] 11. Run Alembic migration
- [x] 12. Test end-to-end

## Summary
All tasks completed successfully:
- **Default landing page**: Changed from `login` to `home` in `App.jsx`
- **Backend**: New `SiteCustomization` model with `site_customizations` table, public GET `/api/v1/site-customization/hero` endpoint, admin-protected PUT endpoint
- **Frontend**: `HeroCarousel` fetches from API and falls back to hardcoded defaults. New `AdminHero` page lets admins edit all 4 slides (tag, headline, description, CTAs, accent color, background image)
- **Admin Dashboard**: Added "Hero Section" to sidebar navigation
- **Database**: Alembic migration `c6ae078d0501` applied successfully

