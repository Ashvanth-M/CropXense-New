/**
 * CropXense — Execute Schema, RLS, Storage against Supabase.
 * Run with: node supabase/execute-schema.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yqolllbkscvabgsqwjrn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runSQL(label, filePath) {
  console.log(`\n>>> Executing ${label}...`);
  const sql = readFileSync(filePath, 'utf-8');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  let success = 0;
  let errors = 0;
  
  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      if (error) {
        // Try direct query approach
        const { error: err2 } = await supabase.from('_exec').select().throwOnError();
        console.log(`  ⚠ Statement warning: ${error.message.slice(0, 80)}`);
        errors++;
      } else {
        success++;
      }
    } catch (e) {
      // Expected — rpc may not exist. We'll handle this below.
      errors++;
    }
  }
  
  console.log(`  ${label}: ${success} succeeded, ${errors} had issues`);
}

// Since we can't execute raw SQL via the JS client directly,
// let's check if tables exist by querying them
async function checkTables() {
  const tables = ['profiles', 'farms', 'crop_scans', 'crop_health_cases', 'advisories',
                  'follow_ups', 'expert_reviews', 'officer_visits', 'pest_traps', 
                  'weather_observations', 'sensors', 'farmer_feedback'];
  
  console.log('\n=== Checking table existence ===');
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(0);
    if (error) {
      console.log(`  ✗ ${table}: ${error.message}`);
    } else {
      console.log(`  ✓ ${table}: exists`);
    }
  }
}

// Check storage
async function checkStorage() {
  console.log('\n=== Checking storage ===');
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.log(`  ✗ Storage error: ${error.message}`);
  } else {
    const bucket = data?.find(b => b.id === 'crop-scans');
    if (bucket) {
      console.log('  ✓ crop-scans bucket exists');
    } else {
      console.log('  ✗ crop-scans bucket not found');
      // Try to create it
      const { error: createErr } = await supabase.storage.createBucket('crop-scans', { public: true });
      if (createErr) {
        console.log(`  ✗ Could not create bucket: ${createErr.message}`);
      } else {
        console.log('  ✓ crop-scans bucket created');
      }
    }
  }
}

async function main() {
  console.log('CropXense Supabase Schema Setup');
  console.log('================================');
  console.log(`URL: ${SUPABASE_URL}`);
  
  // Note: The Supabase JS client cannot execute raw SQL.
  // The schema.sql, rls.sql, and storage.sql must be executed
  // through the Supabase Dashboard SQL Editor.
  //
  // This script can:
  // 1. Check which tables exist
  // 2. Create the storage bucket
  // 3. Verify the setup
  
  await checkTables();
  await checkStorage();
  
  console.log('\n================================');
  console.log('IMPORTANT: Run these SQL files in the Supabase Dashboard SQL Editor:');
  console.log('1. supabase/schema.sql');
  console.log('2. supabase/rls.sql');
  console.log('3. supabase/storage.sql');
  console.log('================================');
}

main().catch(console.error);
