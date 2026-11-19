# Security Specification — ArabiPrompt Cloud Library & Admin Visitor Counter

## 1. Data Invariants
1. **Admin Isolation**: Only verified administrators (`adwwaw@gmail.com` or UIDs present in `/admins/{uid}` with `email_verified == true`) can read, list, or delete documents in `/visits` or `/admins`.
2. **Write-Only Telemetry for Visitors**: Unauthenticated or standard visitors can ONLY create a strictly schema-validated `/visits/{visitId}` record containing non-PII session metadata (`visitorHash`, `dateKey`, `lang`, `path`, `createdAt == request.time`). They can never `get`, `list`, `update`, or `delete` any `/visits` document.
3. **Immutable Visit Logs**: Visit documents cannot be updated by anyone (`allow update: if false`), preserving counter integrity.
4. **No Self-Assigned Roles**: Non-admins cannot write to `/admins/{adminId}`, and `/users/{userId}` profiles strictly forbid any `role` or `isAdmin` field, preventing privilege escalation.
5. **Strict User PII & Library Ownership**:
   - `/users/{userId}` (`UserProfile`) is strictly private to the verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`) or verified admin (`get` only). No user can `list` `/users`.
   - `/users/{userId}/prompts/{promptId}` (`SavedPrompt`) and `/users/{userId}/sequences/{sequenceId}` (`SavedSequence`) are strictly owner-only for `get`, `list`, `create`, `update`, and `delete`, requiring both path ownership (`request.auth.uid == userId`) and document ownership (`resource.data.uid == request.auth.uid`).
6. **Immutable Ownership & Timestamps**:
   - `uid` must equal `request.auth.uid` on create and remain strictly immutable on update (`incoming().uid == existing().uid`).
   - `createdAt` must equal `request.time` on create and remain immutable on update; `updatedAt` must equal `request.time` on create and update.
7. **Path, Type & Size Hardening**: All document IDs (`adminId`, `visitId`, `userId`, `promptId`, `sequenceId`) must pass `isValidId()` (`^[a-zA-Z0-9_\-]+$`, `<= 128` chars), and every string, list, map, and enum enforces strict type and size bounds (`scenes.size() <= 30`, bounded text lengths).

## 2. Adversarial "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. Anonymous user reads `/visits`, `/users`, `/users/{uid}/prompts`, or `/users/{uid}/sequences` -> Denied.
2. Signed-in User A reads or lists User B's `/users/{uidB}/prompts` or `/users/{uidB}/sequences` -> Denied.
3. Signed-in User A creates a prompt under `/users/{uidA}/prompts/{id}` with spoofed `uid: uidB` -> Denied (`incoming().uid == request.auth.uid`).
4. Signed-in user attempts to inject `role: "admin"` into `/users/{uid}` -> Denied by `keys().hasOnly(...)`.
5. Signed-in non-admin user creates `/admins/{uid}` to promote themselves -> Denied.
6. Unverified email user (`email_verified: false`) attempts to read or write `/users/{uid}/prompts` -> Denied (`isVerifiedUser()`).
7. User updates `/users/{uid}/prompts/{id}` to mutate `createdAt` or `uid` -> Denied by immutability & `affectedKeys().hasOnly(...)`.
8. User creates `/users/{uid}/sequences/{id}` with 100 scenes in `scenes` list -> Denied by `scenes.size() <= 30`.
9. User creates `/users/{uid}/prompts/{id}` with 50KB `prompt` payload or ghost field `{ extra: 1 }` -> Denied by `.size() <= 20000` and `keys().hasOnly(...)`.
10. Visitor creates `/visits/{visitId}` with client-forged timestamp (`createdAt` != `request.time`) -> Denied.
11. User updates `/users/{uid}/prompts/{id}` with client-forged `updatedAt != request.time` -> Denied.
12. Attacker injects oversized or invalid path ID (`promptId = "../../etc/passwd"` or 500 chars) -> Denied by `isValidId()`.
