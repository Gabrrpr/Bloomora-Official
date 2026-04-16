# Live Messaging DB Implementation

**Status:** Ready to implement.

**Information Gathered:**
- Backend WS (ConnectionManager), chats.py routes exist.
- AdminChat.jsx/ChatWidget.jsx static mock data.
- Orders API ready for context (customer recent orders).
- Models: User, Order exist.

**Plan:**
1. **Backend:**
   - Create `models/chat.py` (ChatSession, Message models).
   - `schemas/chat_schemas.py` extend (ConversationOut, MessageOut).
   - `/api/v1/routes/chats.py`: GET conversations, GET/POST messages, WS /ws/chats/{session_id}.
   - Alembic migration.

2. **Frontend:**
   - AdminChat.jsx: fetch conversations, WS connect, order context/modal.
   - ChatWidget.jsx: customer WS, auto-create session with order_id.

3. **DB Schema:**
   - ChatSession: id, customer_id, admin_id (optional), order_id, created_at, status.
   - Message: id, chat_session_id, sender (customer/admin), text, timestamp, read.

**Dependent Files:**
- Backend: models/chat.py, schemas/chat_schemas.py, routes/chats.py, alembic migration.
- Frontend: AdminChat.jsx, ChatWidget.jsx.

**Followup:**
- Run migrations.
- Test customer chat → admin live receive with order context.
- `npm run dev` web, `uvicorn app.main:app --reload`.

**Status:** Backend schemas complete. Ready for routes/chats.py updates.

**Current Progress:**
- [x] models/chat.py (ChatSession, Message)
- [x] models/__init__.py updated
- [x] schemas/chat_schemas.py new schemas
- [x] core/enums.py
- [x] core/__init__.py
- [x] schemas/__init__.py

**Next Steps:**
- [x] Update routes/chats.py imports (ChatSession/Message)
- [ ] Rewrite chats.py endpoints (conversations with ChatSession)
- [ ] Update ConnectionManager for session_id
- [ ] Alembic migration
- [ ] Frontend AdminChat.jsx (API + WS)
- [ ] Frontend ChatWidget.jsx
- [ ] Test & complete

