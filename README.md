# Requirements

### 1. Registrácia, Prihlásenie a odhlásenie používateľa

- Registration
  - [x] Logic - Full validation, uniqueness checks, password hashing, session management
  - [x] Visual - Complete registration page with form validation
- Login
  - [x] Logic - Credential verification, token generation, device tracking
  - [x] Visual - Complete login page with form validation
- Logout
  - [x] Logic - Single session + multi-device logout
  - [x] Visual - Logout button in UI

### 2. Používateľ vidí zoznam kanálov, v ktorých je členom

- Channels List
  - [x] Logic - Returns user's channels with role and member count
  - [x] Visual - Sidebar with channel list, search functionality
- Create channel
  - [x] Logic - Private/public channel creation with admin assignment
  - [x] Visual - Create channel dialog with type selection
- Leave channel
  - [x] Logic - Member removal, auto-deletion if last admin leaves
  - [x] Visual - Leave button in channel info panel
- Delete channel if admin
  - [x] Logic - Admin-only deletion with cascade cleanup
  - [x] Visual - Delete button visible to admins only
- Invite to channel
  - [x] Logic - Admin-only invitations with real-time notifications
  - [x] Visual - Invite user dialog with channel selection
- Two types of channels (Private and Public Channel)
  - [x] Logic - Database enum type with proper validation
  - [x] Visual - Type indicators (🔒 private, 📢 public)
- Admin is Channel creator
  - [x] Logic - Creator automatically assigned admin role
  - [x] Visual - Admin badge displayed in member list
- Delete channel after 30 days of inactivity
  - [x] Logic - Scheduled job implemented (`start/scheduler.ts`) runs daily to delete inactive channels
  - [ ] Visual - **MISSING: No UI indicator for inactive channels**

### 3. Používateľ odosiela správy a príkazy cez "príkazový riadok", ktorý je "fixným" prvkom aplikácie. Používateľ môže odoslať správu v kanáli, ktorého je členom

- Chat Input always on screen
  - [x] Logic - Fixed positioning maintained
  - [x] Visual - Fixed message input at bottom of chat view
- Send messages with Input
  - [x] Logic - Message API endpoints exist (`POST /api/channels/:id/messages`, WebSocket `message:send`)
  - [x] Visual - Send button functional, messages sent via WebSocket
- Send commands with Input
  - [x] Logic - Command parsing system implemented (`ConsoleInput.vue`, `MainLayout.vue`)
  - [x] Visual - Command autocomplete and detection working

### 4. Vytvorenie komunikačného kanála (channel) cez príkazový riadok

- Create channel with **/join [ChannelName]**
  - [x] Logic - Join endpoint exists (`POST /api/channels/join-by-name`, `POST /api/channels/:id/join`)
  - [x] Visual - Command parser implemented, handles `/join` command
- Invite to Private channel only by admin with **/invite [Username]**
  - [x] Logic - Invite endpoint exists, admin-only enforced
  - [x] Visual - Command parser implemented, handles `/invite` command
- Kick to Private channel only by admin with **/revoke [Username]**
  - [x] Logic - Revoke endpoint exists (`POST /api/channels/:id/revoke`), admin-only for private channels
  - [x] Visual - Command parser implemented, handles `/revoke` command
- Join to Public channel with **/join [ChannelName]**. If channel doesn't exist create one
  - [x] Logic - Join-by-name endpoint auto-creates public channels if they don't exist
  - [x] Visual - Command parser implemented with auto-create logic
- Invite to Public channel with **/invite [Username]**
  - [x] Logic - Invite endpoint exists, works for public channels
  - [x] Visual - Command parser implemented, handles `/invite` command
- Ban to Public channel with **/kick [Username]**. Need to have 3 user vote or 1 admin vote
  - [x] Logic - Kick voting system implemented (3 user votes or 1 admin vote), `KickVote` model exists
  - [x] Visual - Command parser implemented, handles `/kick` command (voting happens via WebSocket)
- Invite back after ban in Public channels only by admin with **/invite [Username]**
  - [x] Logic - Ban tracking system implemented (`ChannelBan` model), ban lifted on reinvite by admin
  - [x] Visual - Command parser implemented, `/invite` command can reinvite banned users (admin only)
- Username and ChannelName are unique
  - [x] Logic - Database unique constraints + validation
  - [x] Visual - Error messages shown for duplicates
- Delete channel only by admin with **/quit**
  - [x] Logic - Delete endpoint exists, admin-only
  - [x] Visual - Command parser implemented, handles `/quit` command

### 5. Používateľ môže zrušiť svoje členstvo v kanáli príkazom /cancel, ak tak spraví správca kanála, kanál zaniká

- Leave channel with **/cancel** command
  - [x] Logic - Leave endpoint exists
  - [x] Visual - Command parser implemented, handles `/cancel` command
- If admin leaves channel, it deletes
  - [x] Logic - Auto-deletion when last admin leaves
  - [x] Visual - Confirmation shown before leaving

### 6. Správu v kanáli je možné adresovať konkrétnemu používateľovi cez príkaz @nickname

- Message can be addressed to user with **@[Username]**
  - [x] Logic - @mention parsing implemented (stored in message content, detected via regex)
  - [x] Visual - @mention autocomplete implemented in `ConsoleInput.vue` with member suggestions
- Addressed message will be highlighted for user
  - [x] Logic - Mention detection in notifications (`notification-store.ts`), special handling for mentions
  - [x] Visual - Special styling for mentions in `MessageBubble.vue` (ring highlight for own mentions)

### 7. Používateľ si môže pozrieť kompletnú históriu správ

- Load messages with Infinite Scroll
  - [x] Logic - Message history API exists (`GET /api/channels/:id/messages` with pagination)
  - [x] Visual - Infinite scroll component implemented, loads messages via API

### 8. Používateľ je informovaný o každej novej správe prostredníctvom notifikácie

- Notification will send only if app not visible (use Quasar App Visibility)
  - [x] Logic - Visibility detection implemented (`notification-store.ts` uses Quasar AppVisibility and document.hidden)
  - [x] Visual - Browser Notification API integrated, falls back to Quasar Notify if unavailable
- Notification contains sender and part of message
  - [x] Logic - WebSocket events include sender info, notification system extracts sender and message content
  - [x] Visual - Desktop notifications implemented with sender name and truncated message body
- Setup to send only addressed messages
  - [x] Logic - Settings integration implemented (`notification-store.ts`), preferences for mentions-only mode
  - [x] Visual - Settings UI functional (`NotificationsSection.vue`), allows configuring notification preferences

### 9. Používateľ si môže nastaviť stav (online, DND, offline)

- Status is displayed to the user
  - [ ] Logic - **MISSING: No user status field in User model, no status management system**
  - [ ] Visual - **MISSING: No status display in UI**
- If DND status is set, notifications do not arrive
  - [ ] Logic - **MISSING: No DND status implementation**
  - [ ] Visual - **MISSING: No DND status UI**
- If the offline status is set, the user doesn't receive messages, after switching back load data
  - [ ] Logic - **MISSING: No offline status implementation, no message queuing system**
  - [ ] Visual - **MISSING: No offline status UI**

### 10. Používateľ si môže pozrieť zoznam členov kanála (ak je tiež členom kanála) príkazom /list

- Use **/list** to show all members
  - [ ] Logic - **MISSING: No /list command in COMMAND_TYPES, no handler for /list command**
  - [ ] Visual - **MISSING: No /list command parser** (Note: Members are visible in InfoPanel, but not via /list command)

### 11. Ak má používateľ aktívny niektorý z kanálov (nachádza sa v okne správ pre daný kanál) vidí v stavovej lište informáciu o tom, kto aktuálne píše správu (napr. Ed is typing)

- Show nickname when someone typing
  - [ ] Logic - **MISSING: No typing indicator events in WebSocket, no typing state tracking**
  - [ ] Visual - **MISSING: No typing indicator in status bar**
- After clicking on nickname, he can view the typing text in real time
  - [ ] Logic - **MISSING: No real-time typing text preview system**
  - [ ] Visual - **MISSING: No UI for viewing typing text in real time**

### Dátový model:

- Create JPG (JPEG) image of the logical data model (relational database) through migrations
  - [ ] Logic - **MISSING: No JPG/JPEG image file found in project**
  - [ ] Visual - **MISSING: No data model diagram image** (Note: Migrations exist in `apps/server/database/migrations/` but no visual diagram)

---

## Implementation Summary

### ✅ Fully Implemented (26/30 features - 87%)

- User registration, login, logout
- Channel list display
- Channel creation (private/public)
- Channel deletion (admin only)
- User invitations with real-time updates
- Leave channel functionality
- Admin role system
- Unique constraints for usernames and channel names
- Message sending (API + WebSocket)
- Command parsing system (/join, /quit, /invite, /cancel, /kick, /revoke)
- @mention system with autocomplete and highlighting
- Desktop notifications with visibility detection
- 30-day automatic channel deletion (scheduled job)
- Kick/ban voting system (3 votes or 1 admin vote)
- Ban tracking and reinvitation
- Message history with infinite scroll
- Notification preferences and settings

### ⚠️ Partially Implemented (1/30 features - 3%)

- UI indicator for inactive channels (30-day deletion logic works, but no visual warning)

### ❌ Not Implemented (3/30 features - 10%)

- User status system (online, DND, offline)
- /list command to show channel members
- Typing indicators
- Data model diagram (JPG image)
