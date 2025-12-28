// Supabase Client Configuration
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://ueoidpcbanfojffhiani.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlb2lkcGNiYW5mb2pmZmhpYW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Mjc4MjAsImV4cCI6MjA4MjUwMzgyMH0.SPtuyxDnIaIyeEYu0LK_TDORnW7nSG4_LSgFMGFPiYY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check auth state on page load
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event, session)
  
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user)
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  }
})

// Helper function to check if user is logged in
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// Helper function to redirect if not authenticated
export async function requireAuth(redirectTo = '/login.html') {
  const user = await getCurrentUser()
  if (!user) {
    window.location.href = redirectTo
    return null
  }
  return user
}

// Helper function to redirect if authenticated
export async function requireGuest(redirectTo = '/') {
  const user = await getCurrentUser()
  if (user) {
    window.location.href = redirectTo
    return null
  }
  return true
}

// Helper function to check if user is admin
export async function isAdmin() {
  const user = await getCurrentUser()
  if (!user) return false
  
  try {
    // Get user with role from users table
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('Error checking admin role:', error)
      return false
    }
    
    return userData?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin role:', error)
    return false
  }
}

// Helper function to require admin role
export async function requireAdmin(redirectTo = '/') {
  const user = await requireAuth()
  if (!user) return null
  
  const admin = await isAdmin()
  if (!admin) {
    alert('Bạn không có quyền truy cập trang này!')
    window.location.href = redirectTo
    return null
  }
  
  return user
}
