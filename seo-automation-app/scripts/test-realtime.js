#!/usr/bin/env node

/**
 * Test real-time subscription functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRealtimeSubscriptions() {
  console.log('🔄 Testing Real-time Subscriptions...\n');

  let subscriptions = [];

  try {
    // Test 1: Subscribe to users table changes
    console.log('📡 Setting up subscription to users table...');
    const usersSubscription = supabase
      .channel('users_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'users' },
        (payload) => {
          console.log('🔔 Users table change detected:', payload);
        }
      )
      .subscribe((status) => {
        console.log(`📊 Users subscription status: ${status}`);
      });

    subscriptions.push(usersSubscription);

    // Test 2: Subscribe to projects table changes (if exists)
    console.log('📡 Setting up subscription to projects table...');
    const projectsSubscription = supabase
      .channel('projects_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('🔔 Projects table change detected:', payload);
        }
      )
      .subscribe((status) => {
        console.log(`📊 Projects subscription status: ${status}`);
      });

    subscriptions.push(projectsSubscription);

    // Test 3: Subscribe to generated_content table changes
    console.log('📡 Setting up subscription to generated_content table...');
    const contentSubscription = supabase
      .channel('content_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'generated_content' },
        (payload) => {
          console.log('🔔 Generated content change detected:', payload);
        }
      )
      .subscribe((status) => {
        console.log(`📊 Content subscription status: ${status}`);
      });

    subscriptions.push(contentSubscription);

    // Wait a bit to let subscriptions establish
    console.log('⏳ Waiting for subscriptions to establish...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test connection status
    console.log('\n🔍 Checking connection status...');
    const connectionStatus = supabase.realtime.connection?.readyState;
    console.log(`Connection ready state: ${connectionStatus}`);
    
    if (connectionStatus === 1) {
      console.log('✅ Real-time connection is OPEN');
    } else {
      console.log('❌ Real-time connection is not open');
    }

    // Test inserting data to trigger real-time events
    console.log('\n🧪 Testing real-time events by inserting test data...');
    
    try {
      // Test inserting into usage_analytics (if table exists)
      const { data: insertData, error: insertError } = await supabase
        .from('usage_analytics')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          action_type: 'content_generation',
          metadata: { test: 'realtime_test' },
          tokens_used: 0,
          success: true,
        })
        .select();

      if (insertError) {
        console.log('⚠️  Could not insert test data:', insertError.message);
      } else {
        console.log('✅ Test data inserted successfully');
        
        // Clean up test data
        if (insertData && insertData[0]) {
          await supabase
            .from('usage_analytics')
            .delete()
            .eq('id', insertData[0].id);
          console.log('🧹 Test data cleaned up');
        }
      }
    } catch (error) {
      console.log('⚠️  Error during test data insertion:', error.message);
    }

    // Wait a bit more to see if events are triggered
    console.log('⏳ Waiting for potential real-time events...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🎉 Real-time subscription test completed!');
    
  } catch (error) {
    console.error('❌ Real-time test failed:', error.message);
  } finally {
    // Clean up subscriptions
    console.log('\n🧹 Cleaning up subscriptions...');
    subscriptions.forEach(sub => {
      if (sub) {
        sub.unsubscribe();
      }
    });
    console.log('✅ Subscriptions cleaned up');
  }
}

if (require.main === module) {
  testRealtimeSubscriptions();
}

module.exports = { testRealtimeSubscriptions };