# Chore Bank

A private family site. Kids check off daily chores, add notes and extra chores, and send them for approval. A parent approves, sets the pay for each chore, and manages each kid's bank: balance, deposits, withdrawals and automatic interest.

## Setup
1. Supabase: run `sql/chorebank.sql` once in the SQL Editor.
2. Vercel environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Optional: `CHOREBANK_SECRET` (signs logins; defaults to the service key).
3. Open the site and create the parent PIN, then set each kid's PIN in the Parent area.

## Files
- `public/chorebank.html` is the whole page.
- `app/api/chores/route.js` is the API.
- `lib/chorebank.js` holds the logic: PIN logins, approvals, the bank ledger and interest.
