import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data: routines, error: err1 } = await supabase.from('routines').select('*').limit(1);
  console.log('Routines:', routines, err1);
  const { data: classes, error: err2 } = await supabase.from('classes').select('*').limit(1);
  console.log('Classes:', classes, err2);
}
run();
