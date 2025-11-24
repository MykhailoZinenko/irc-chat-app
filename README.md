# IRC Chat Application

A real-time chat application built with AdonisJS (backend) and Vue 3 + Quasar (frontend), featuring channel-based communication, real-time updates via WebSocket, and comprehensive user management.

## Requirements Checklist

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
  - [ ] Logic - **MISSING: No scheduled job implementation**
  - [ ] Visual - **MISSING: No UI indicator for inactive channels**

### 3. Používateľ odosiela správy a príkazy cez "príkazový riadok", ktorý je "fixným" prvkom aplikácie. Používateľ môže odoslať správu v kanáli, ktorého je členom
- Chat Input always on screen
  - [x] Logic - Fixed positioning maintained
  - [x] Visual - Fixed message input at bottom of chat view
- Send messages with Input
  - [ ] Logic - **MISSING: No message API endpoints**
  - [x] Visual - Send button functional (logs to console only)
- Send commands with Input
  - [ ] Logic - **MISSING: No command parsing system**
  - [ ] Visual - **MISSING: No command detection or feedback**

### 4. Vytvorenie komunikačného kanála (channel) cez príkazový riadok
- Create channel with **/join [ChannelName]**
  - [x] Logic - Join endpoint exists (`POST /api/channels/:id/join`)
  - [ ] Visual - **MISSING: No command parser to detect /join**
- Invite to Private channel only by admin with **/invite [Username]**
  - [x] Logic - Invite endpoint exists, admin-only enforced
  - [ ] Visual - **MISSING: No command parser to detect /invite**
- Kick to Private channel only by admin with **/revoke [Username]**
  - [ ] Logic - **MISSING: No revoke/kick endpoint**
  - [ ] Visual - **MISSING: No command parser**
- Join to Public channel with **/join [ChannelName]**. If channel doesn't exist create one
  - [x] Logic - Join endpoint exists for public channels
  - [ ] Visual - **MISSING: Need command parser + auto-create logic**
- Ban to Public channel with **/kick [Username]**. Need to have 3 user vote or 1 admin vote
  - [ ] Logic - **MISSING: No kick/ban system or voting mechanism**
  - [ ] Visual - **MISSING: No UI for kick votes**
- Invite back after ban in Public channels with **/invite [Username]**
  - [ ] Logic - **MISSING: No ban tracking system**
  - [ ] Visual - **MISSING: No UI to reinvite banned users**
- Username and ChannelName are unique
  - [x] Logic - Database unique constraints + validation
  - [x] Visual - Error messages shown for duplicates
- Delete channel only by admin with **/quit**
  - [x] Logic - Delete endpoint exists, admin-only
  - [ ] Visual - **MISSING: No /quit command parser**

### 5. Používateľ môže zrušiť svoje členstvo v kanáli príkazom /cancel, ak tak spraví správca kanála, kanál zaniká
- Leave channel with **/cancel** command
  - [x] Logic - Leave endpoint exists
  - [ ] Visual - **MISSING: No /cancel command parser**
- If admin leaves channel, it deletes
  - [x] Logic - Auto-deletion when last admin leaves
  - [x] Visual - Confirmation shown before leaving

### 6. Správu v kanáli je možné adresovať konkrétnemu používateľovi cez príkaz @nickname
- Message can be addressed to user with **@[Username]**
  - [ ] Logic - **MISSING: No @mention parsing or storage**
  - [ ] Visual - **MISSING: No @mention autocomplete**
- Addressed message will be highlighted for user
  - [ ] Logic - **MISSING: No mention notification system**
  - [ ] Visual - **MISSING: No special styling for mentions**

### 7. Používateľ si môže pozrieť kompletnú históriu správ
- Load messages with Infinite Scroll
  - [ ] Logic - **MISSING: No message history API**
  - [x] Visual - Infinite scroll component exists (uses mock data)

### 8. Používateľ je informovaný o každej novej správe prostredníctvom notifikácie
- Notification will send only if app not visible (use Quasar App Visibility)
  - [ ] Logic - **MISSING: No visibility detection**
  - [ ] Visual - **MISSING: No browser Notification API integration**
- Notification contains sender and part of message
  - [x] Logic - WebSocket events include sender info (for invitations)
  - [ ] Visual - **MISSING: Desktop notifications not implemented**
- Setup to send only addressed messages
  - [ ] Logic - **MISSING: No settings integration**
  - [x] Visual - Settings UI exists but not functional

---

## Implementation Summary

### ✅ Fully Implemented (14/27 features - 52%)
- User registration, login, logout
- Channel list display
- Channel creation (private/public)
- Channel deletion (admin only)
- User invitations with real-time updates
- Leave channel functionality
- Admin role system
- Unique constraints for usernames and channel names

### ⚠️ Partially Implemented (4/27 features - 15%)
- Chat input UI (no backend connection)
- Message history UI (mock data only)
- Real-time notifications (WebSocket only, no desktop)
- Channel join (API exists, no command parser)

### ❌ Not Implemented (9/27 features - 33%)
- Message sending backend
- Command parsing system (/join, /quit, /invite, /cancel, /kick, /revoke)
- @mention system
- Desktop notifications with visibility detection
- 30-day automatic channel deletion
- Kick/ban voting system
- Ban tracking and reinvitation

---