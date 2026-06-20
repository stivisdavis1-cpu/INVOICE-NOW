import { createClient } from './client'

export async function uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
  const supabase = createClient()
  
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) {
    console.error('Error uploading file:', error)
    return null
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  
  // Prevent Next.js deadlock by avoiding localhost API route calls in proxy-image
  let publicUrl = data.publicUrl;
  if (publicUrl.includes('/api/db')) {
     const realUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qnqyvaverroxgpmjbdxr.supabase.co';
     publicUrl = publicUrl.replace(/^https?:\/\/[^\/]+\/api\/db/, realUrl);
  }
  
  return publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    console.error('Error deleting file:', error)
    return false
  }
  return true
}
