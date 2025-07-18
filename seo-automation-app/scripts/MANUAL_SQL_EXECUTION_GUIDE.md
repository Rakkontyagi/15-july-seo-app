# Manual SQL Execution Guide for Supabase

## 🎯 Objective
Execute the SQL script to create missing database tables (projects, serp_analysis, competitor_analysis, usage_analytics) in your Supabase database.

## 📍 Database Information
- **Project URL**: https://xpcbyzcaidfukddqniny.supabase.co
- **Dashboard**: https://app.supabase.com/project/xpcbyzcaidfukddqniny
- **SQL File**: `scripts/create-all-tables.sql`

## 🔧 Step-by-Step Instructions

### Step 1: Access Supabase Dashboard
1. Open your browser and navigate to: https://app.supabase.com/project/xpcbyzcaidfukddqniny
2. Log in with your Supabase credentials
3. Ensure you're in the correct project (xpcbyzcaidfukddqniny)

### Step 2: Open SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click "New Query" to create a new SQL query

### Step 3: Copy and Execute SQL
1. Open the file: `scripts/create-all-tables.sql`
2. Copy the entire contents of the file
3. Paste it into the SQL Editor
4. Click "Run" button to execute the SQL

### Step 4: Verify Execution
1. Check for any error messages in the results panel
2. Look for success messages indicating tables were created
3. You should see confirmations for:
   - Extensions enabled
   - Tables created
   - Indexes created
   - Triggers created
   - RLS policies created

## 🔍 Verification Steps

After executing the SQL, verify the setup by running:
```bash
node scripts/verify-database-schema.js
```

Expected output should show:
- ✅ users - exists
- ✅ projects - exists  
- ✅ generated_content - exists
- ✅ serp_analysis - exists
- ✅ competitor_analysis - exists
- ✅ usage_analytics - exists

## 🏗️ What the SQL Creates

### Tables Created:
1. **`projects`** - User project management
2. **`serp_analysis`** - Cached SERP search results
3. **`competitor_analysis`** - Scraped competitor data
4. **`usage_analytics`** - User activity tracking

### Security Features:
- Row Level Security (RLS) enabled on all tables
- User-specific access policies
- Service role administrative access
- Proper authentication checks

### Performance Optimizations:
- Indexes on frequently queried columns
- Expiration timestamps for cache invalidation
- Efficient foreign key relationships

## 🛠️ Troubleshooting

### Common Issues:
1. **Permission Errors**: Ensure you have admin access to the project
2. **Extension Errors**: Extensions may already exist (safe to ignore)
3. **Policy Conflicts**: Existing policies may cause errors (safe to ignore)

### If Manual Execution Fails:
1. Check if you have the correct permissions
2. Verify you're in the right project
3. Try executing the SQL in smaller chunks
4. Contact support if issues persist

## 📋 Post-Execution Checklist
- [ ] All 6 tables exist in database
- [ ] RLS policies are active
- [ ] Indexes are created
- [ ] Triggers are functioning
- [ ] Verification script passes
- [ ] Ready to test API endpoints

## 🔄 Next Steps
Once SQL execution is complete:
1. Run verification script
2. Test health check APIs
3. Test real-time subscriptions
4. Proceed with application testing

---

**Note**: This manual execution is required because Supabase doesn't allow direct SQL execution through the JavaScript client for security reasons. The SQL Editor in the dashboard provides the necessary administrative privileges to create tables and policies.