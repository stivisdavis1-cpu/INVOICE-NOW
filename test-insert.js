import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000/api/db',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'fake-anon-key'
)

async function test() {
  const { data, error } = await supabase.from('invoices').insert({
    number: 'FAC-2026-999',
    type: 'invoice',
    client_id: '123e4567-e89b-12d3-a456-426614174000',
    issue_date: '2026-06-20',
    due_date: '2026-06-20',
    status: 'draft',
    company_id: '123e4567-e89b-12d3-a456-426614174000'
  }).select()
  console.log('Invoice insert result:', data, error)
}
test()
