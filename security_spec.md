# Security Specification - Anatomy Examination System

## Data Invariants
- A `CustomPlate` must have at least one term (if pinned).
- An `ExamSessionRecord` must have `totalScore` equal to the sum of scores in its `answers`.
- All shared data must be created by an authenticated user.

## The "Dirty Dozen" Payloads (Denial Tests)
1. **Unauthenticated Create**: Attempting to create a `CustomPlate` without being signed in.
2. **Identity Spoofing**: Attempting to set `updatedBy` to a different UID than the requester.
3. **Shadow Fields**: Adding an `isAdmin: true` field to a `GlobalSettings` update.
4. **Huge Payload**: Attempting to upload a `CustomPlate` with 5000 terms (Denial of Wallet).
5. **Invalid ID**: Using a path variable with non-alphanumeric characters (e.g., `/plates/!!!`).
6. **Type Mismatch**: Sending a boolean for `title`.
7. **Negative Score**: Sending a -1 score in `ExamSessionRecord`.
8. **Orphaned Write**: Updating `GlobalSettings` without a timestamp.
9. **Roster Hijacking**: Deleting a student entry by a user who didn't create the environment (if we had ownership, but here it's shared, so we just check auth).
10. **State Shortcutting**: Skipping the `startedAt` field in history.
11. **PII Leak**: Unauthenticated read of the `roster` collection.
12. **Query Scrape**: Unauthenticated list request to `history`.

## Security Assertion
All collections (`plates`, `customTerms`, `roster`, `history`, `settings`) are strictly locked to authenticated users. Every write is validated against a schema blueprint to prevent malformed data or shadow fields.
