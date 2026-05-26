# TODO

## Bouquet category -> sidebar sub-items (DB-driven)
- [ ] Backend: update `GET /products/categories/hierarchy` to be dynamic (read from `products.category`).
- [ ] Define parsing rules for `Product.category` to derive hierarchy where `bouquet` is heading and subtype becomes items (supports `bouquet:rose`, `bouquet/rose`, `bouquet-rose`).
- [ ] Frontend: fix `Shop.jsx` to properly store/load `categoryHierarchy` state and use it for sidebar.
- [ ] Frontend: add filtering logic so selecting `bouquet` sidebar items filters products by parsed bouquet subtype.
- [ ] Navbar: ensure clicking Shop mega-menu submenu sets `localStorage.bloomora_active_category` to the submenu param (so `Shop.jsx` reads the correct selection).
- [ ] Test: verify
  - Shop -> Bouquet heading shows rose/sunflower/tulips
  - Clicking rose shows only rose bouquet products
  - Existing categories still work
- [ ] Run build/lint for `apps/web` and start backend if needed.

