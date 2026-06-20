import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const fileContent = fs.readFileSync('dummy.png');
  const { data, error } = await supabase.storage.from('assets').upload('logos/test.png', fileContent, { upsert: true });
  if (error) {
    console.error('Upload Error:', error);
  } else {
    console.log('Upload Success:', data);
    const { data: pubData } = supabase.storage.from('assets').getPublicUrl('logos/test.png');
    console.log('Public URL:', pubData.publicUrl);
  }
}

test();
