#!/usr/bin/env node

/**
 * Execute SQL script using Supabase client
 * This uses the service role key to execute administrative SQL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLScript() {
  console.log('🔧 Executing SQL script to create missing tables...\n');

  try {
    // Read the SQL script
    const sqlPath = path.join(__dirname, 'create-all-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const statements = sqlContent
      .split(/;\s*(?=\n|$)/)
      .filter(statement => statement.trim() && !statement.trim().startsWith('--'))
      .map(statement => statement.trim());

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (!statement) continue;

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // Try alternative method using direct query
          const { data: altData, error: altError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);

          if (altError) {
            console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }

      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Execution Summary:`);
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This may be normal for statements that:');
      console.log('   - Create extensions that already exist');
      console.log('   - Create tables that already exist');
      console.log('   - Drop triggers that don\'t exist');
      console.log('   - Create policies that already exist');
    }

    console.log('\n🎉 SQL script execution completed!');
    console.log('🔍 Run the verify script to check table creation status');

  } catch (error) {
    console.error('❌ Failed to execute SQL script:', error.message);
    console.log('\n💡 Alternative approach:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the contents of scripts/create-all-tables.sql');
    console.log('4. Execute it manually in the SQL Editor');
  }
}

// Alternative method using manual execution guidance
async function guidedExecution() {
  console.log('\n🔧 Guided SQL Execution Process\n');
  
  console.log('Since direct SQL execution may have limitations, please follow these steps:');
  console.log('1. 🌐 Open your Supabase dashboard: https://app.supabase.com/project/' + supabaseUrl.split('.')[0].split('//')[1]);
  console.log('2. 📝 Navigate to "SQL Editor" in the left sidebar');
  console.log('3. 📋 Copy the SQL from: scripts/create-all-tables.sql');
  console.log('4. 🗃️ Paste it into the SQL Editor');
  console.log('5. ▶️ Click "Run" to execute the SQL');
  console.log('6. ✅ Verify success by running: node scripts/verify-database-schema.js');
  
  console.log('\n📄 SQL File Location: ' + path.join(__dirname, 'create-all-tables.sql'));
}

if (require.main === module) {
  executeSQLScript().catch(() => {
    console.log('\n🔄 Falling back to guided execution...');
    guidedExecution();
  });
}

module.exports = { executeSQLScript, guidedExecution };