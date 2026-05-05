# Fix Address Save Bug
✅ Understand files (addresses.py route/model, Profile.jsx, api.js, main.py) - code looks correct.

## Remaining Steps
- [ ] Check/Run Alembic migrations: `cd apps/backend && alembic current && alembic upgrade head`
- [ ] Test GET addresses: `curl -H \"Authorization: Bearer YOUR_TOKEN\" http://localhost:8000/api/v1/addresses/`
- [ ] Test POST address via curl (get token first)
- [ ] User: Try save address, screenshot Network tab/console error
- [ ] Check DB: `psql/psql -d dbname -c \"SELECT count(*) FROM addresses; SELECT * FROM addresses LIMIT 1;"`
- [ ] If DB empty/table missing: Run migrations
- [ ] Add print logging to create_address if constraint error
- [ ] Test full flow

Next: Run migration check.
