// Authentication handlers
import { supabase } from './supabase-client.js'

// Show/hide password toggle
export function initPasswordToggle() {
  const toggleButtons = document.querySelectorAll('[data-password-toggle]')
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetId = this.getAttribute('data-password-toggle')
      const input = document.getElementById(targetId)
      const icon = this.querySelector('.material-symbols-outlined')
      
      if (input.type === 'password') {
        input.type = 'text'
        icon.textContent = 'visibility_off'
      } else {
        input.type = 'password'
        icon.textContent = 'visibility'
      }
    })
  })
}

// Show error message
export function showError(elementId, message) {
  const element = document.getElementById(elementId)
  if (element) {
    element.textContent = message
    element.classList.remove('hidden')
  }
}

// Clear error messages
export function clearErrors() {
  const errors = document.querySelectorAll('[id$="-error"]')
  errors.forEach(error => {
    error.textContent = ''
    error.classList.add('hidden')
  })
}

// Login function
export async function handleLogin(email, password) {
  try {
    clearErrors()
    
    // Validate
    if (!email || !password) {
      showError('form-error', 'Vui lòng nhập email và mật khẩu')
      return false
    }
    
    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    })
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        showError('form-error', 'Email hoặc mật khẩu không đúng')
      } else if (error.message.includes('Email not confirmed')) {
        showError('form-error', 'Vui lòng xác nhận email trước khi đăng nhập')
      } else {
        showError('form-error', error.message)
      }
      return false
    }
    
    // Check user status in public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('status, username')
      .eq('id', data.user.id)
      .single()
    
    if (userError) {
      console.error('Error fetching user data:', userError)
    }
    
    if (userData) {
      if (userData.status === 'blocked') {
        await supabase.auth.signOut()
        showError('form-error', 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.')
        return false
      }
      if (userData.status === 'suspended') {
        await supabase.auth.signOut()
        showError('form-error', 'Tài khoản của bạn đã bị tạm khóa.')
        return false
      }
    }
    
    // Success - redirect to home
    window.location.href = '/'
    return true
    
  } catch (error) {
    console.error('Login error:', error)
    showError('form-error', 'Có lỗi xảy ra. Vui lòng thử lại.')
    return false
  }
}

// Register function
export async function handleRegister(email, password, confirmPassword, username) {
  try {
    clearErrors()
    
    // Validate
    if (!email || !password || !username) {
      showError('form-error', 'Vui lòng điền đầy đủ thông tin')
      return false
    }
    
    if (password !== confirmPassword) {
      showError('form-error', 'Mật khẩu xác nhận không khớp')
      return false
    }
    
    if (password.length < 6) {
      showError('form-error', 'Mật khẩu phải có ít nhất 6 ký tự')
      return false
    }
    
    // Validate username
    if (username.length < 3 || username.length > 20) {
      showError('form-error', 'Tên người dùng phải có 3-20 ký tự')
      return false
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError('form-error', 'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới')
      return false
    }
    
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username.trim())
      .single()
    
    if (existingUser) {
      showError('form-error', 'Tên người dùng đã tồn tại')
      return false
    }
    
    // Sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          username: username.trim(),
        },
      },
    })
    
    if (error) {
      if (error.message.includes('User already registered')) {
        showError('form-error', 'Email đã được đăng ký')
      } else {
        showError('form-error', error.message)
      }
      return false
    }
    
    // Success message
    alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.')
    window.location.href = '/login.html'
    return true
    
  } catch (error) {
    console.error('Register error:', error)
    showError('form-error', 'Có lỗi xảy ra. Vui lòng thử lại.')
    return false
  }
}

// Logout function
export async function handleLogout() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
      return false
    }
    window.location.href = '/login.html'
    return true
  } catch (error) {
    console.error('Logout error:', error)
    return false
  }
}

// OAuth login
export async function handleOAuthLogin(provider) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider, // 'google', 'twitter', 'discord'
      options: {
        redirectTo: window.location.origin + '/index.html'
      }
    })
    
    if (error) {
      console.error('OAuth error:', error)
      showError('form-error', 'Đăng nhập thất bại')
      return false
    }
    
    return true
  } catch (error) {
    console.error('OAuth error:', error)
    return false
  }
}
