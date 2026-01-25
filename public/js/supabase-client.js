// Supabase Client Configuration
// import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
import {supabase_custom} from "./supabase-custom.js"
console.log(supabase_custom)
const { createClient } = supabase_custom;

const supabaseUrl = 'https://ueoidpcbanfojffhiani.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlb2lkcGNiYW5mb2pmZmhpYW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Mjc4MjAsImV4cCI6MjA4MjUwMzgyMH0.SPtuyxDnIaIyeEYu0LK_TDORnW7nSG4_LSgFMGFPiYY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check auth state on page load and sync OAuth data
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state changed:', event, session)
  
  if (event === 'SIGNED_IN' && session?.user) {
    console.log('User signed in:', session.user)
    
    // Sync OAuth avatar if available
    if (session.user.user_metadata?.avatar_url) {
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id, avatar_url')
          .eq('id', session.user.id)
          .single()
        
        // Update avatar if user doesn't have one
        if (existingUser && (!existingUser.avatar_url || existingUser.avatar_url === '')) {
          await supabase
            .from('users')
            .update({ 
              avatar_url: session.user.user_metadata.avatar_url,
              updated_at: new Date().toISOString()
            })
            .eq('id', session.user.id)
        }
      } catch (error) {
        console.error('Error syncing OAuth avatar:', error)
      }
    }
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
