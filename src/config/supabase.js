/**
 * Supabase Client Configuration
 * Khởi tạo kết nối với Supabase backend
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Lấy config từ .env hoặc sử dụng trực tiếp
const supabaseUrl = 'https://ueoidpcbanfojffhiani.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlb2lkcGNiYW5mb2pmZmhpYW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Mjc4MjAsImV4cCI6MjA4MjUwMzgyMH0.xH5vZq0F7sGJp3TqA8LnPJXvR8N-2lqV9xQ5cTYZ8Jw'

// Tạo Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function để kiểm tra connection
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count')
    if (error) throw error
    console.log('✅ Supabase connected successfully')
    return true
  } catch (error) {
    console.error('❌ Supabase connection error:', error)
    return false
  }
}
