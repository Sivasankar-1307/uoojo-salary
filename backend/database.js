const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_PUBLISHABLE_KEY is missing from environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Connected to Supabase database successfully.');

module.exports = supabase;
