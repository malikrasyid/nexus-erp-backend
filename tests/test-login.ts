import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

async function getToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin1@example.com',
    password: 'qwer1234',
  });

  if (error) {
    console.error('Login Failed:', error.message);
    return;
  }

  console.log('--- YOUR ACCESS TOKEN ---');
  console.log(data.session?.access_token);
  console.log('-------------------------');
}

getToken();