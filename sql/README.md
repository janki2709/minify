# SQL Setup Scripts

This folder contains all database setup scripts for Minify.

---

## 📋 Execution Order

Run these SQL files **in order** in your Supabase SQL Editor:

1. **01_create_tables.sql** - Creates database tables
2. **02_rls_policies.sql** - Sets up Row Level Security policies
3. **03_functions.sql** - Creates database functions
4. **04_triggers.sql** - Creates triggers
5. **05_cron_jobs.sql** - Sets up background cron jobs

---

## 🗂️ File Descriptions

### `01_create_tables.sql`
Creates three main tables:
- `profiles` - User profile information
- `links` - Shortened links
- `reserved_slugs` - Blocked slug names (admin, api, etc.)

### `02_rls_policies.sql`
Sets up Row Level Security (RLS) to ensure:
- Users can only view/edit their own profiles
- Users can only view/edit their own links
- Proper access control for all operations

### `03_functions.sql`
Creates database functions:
- `handle_new_user()` - Automatically creates a profile when user signs up
- `update_updated_at_column()` - Automatically updates timestamps on record changes

### `04_triggers.sql`
Creates triggers that:
- Auto-create profile on user signup
- Auto-update `updated_at` timestamp on profile changes
- Auto-update `updated_at` timestamp on link changes

### `05_cron_jobs.sql`
Sets up two background jobs:
- **Expired Links Cleanup** - Runs daily at 2:00 AM UTC, deletes expired links
- **Account Deletion** - Runs daily at 2:00 AM UTC, hard deletes soft-deleted accounts after 30 days

---

## ⚠️ Important Notes

### Before Running SQL Files:

1. Make sure you have a Supabase project created
2. Enable the `pg_cron` extension if not already enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   ```

### Troubleshooting:

#### Error: "extension pg_cron does not exist"
**Solution:** Enable the extension first:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
```

#### Error: "permission denied for schema cron"
**Solution:** This is normal in some Supabase setups. Cron jobs should still work.

#### Error: "relation already exists"
**Solution:** You're running the scripts again. Either:
- Drop existing tables first (careful, this deletes data!)
- Skip that specific CREATE statement

---

## 🔄 Re-running Scripts

If you need to re-run the setup:

### Drop All Tables (⚠️ THIS DELETES ALL DATA):
```sql
DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS reserved_slugs CASCADE;
```

### Drop Triggers:
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_links_updated_at ON links;
```

### Drop Functions:
```sql
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

### Drop Cron Jobs:
```sql
SELECT cron.unschedule('delete-expired-links');
SELECT cron.unschedule('delete-soft-deleted-accounts');
```

Then re-run all SQL files in order.

---

## ✅ Verification

After running all SQL files, verify everything is set up:

### Check Tables:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected result: `links`, `profiles`, `reserved_slugs`

### Check Triggers:
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

Expected result: 3 triggers

### Check Functions:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

Expected result: 2 functions

### Check Cron Jobs:
```sql
SELECT jobname, schedule, command 
FROM cron.job;
```

Expected result: 2 cron jobs

---

## 📚 Additional Resources

- [Supabase SQL Editor](https://supabase.com/docs/guides/database/sql-editor)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg_cron Documentation](https://github.com/citusdata/pg_cron)

---