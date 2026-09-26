import 'dotenv/config';
import { supabase } from './configs/supabase.js';

const { data, error } = await supabase.from('products').select('*').limit(5);

if (error) {
  console.error('Error fetching products:', error);
} else {
  console.log('Products:', data);
}