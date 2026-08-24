# LEAD EMAIL DELIVERY HARDENING — TASKS

- `[x]` 1. Install nodemailer as production dependency
- `[x]` 2. Read and audit current `server/api/send-lead.post.ts`
- `[x]` 3. Read `nuxt.config.ts` runtimeConfig for SMTP vars
- `[x]` 4. Create `server/utils/emailService.ts`
- `[x]` 5. Refactor `server/api/send-lead.post.ts` (remove old Edge Function, integrate Nodemailer, durable state)
- `[x]` 6. Update `nuxt.config.ts` with `leadNotificationEmail`
- `[x]` 7. Update `.env.example` with SMTP documentation
- `[x]` 8. Create `test-lead-email.mjs` (all mock-based)
- `[/]` 9. Run `npx nuxi build`
- `[ ]` 10. Run `test-lead-email.mjs`
- `[ ]` 11. Run `test-admin-v2.mjs`
- `[ ]` 12. Run `test-phase-a.mjs`
- `[ ]` 13. Run `seo-validate-03c.mjs`
- `[ ]` 14. Create `docs/LEAD_EMAIL_DELIVERY_IMPLEMENTATION.md`
- `[ ]` 15. Present final report
