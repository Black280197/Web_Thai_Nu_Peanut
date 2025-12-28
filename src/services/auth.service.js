/**
 * Authentication Service
 * Xử lý tất cả logic liên quan đến đăng nhập, đăng ký, xác thực
 */

import { supabase } from '../config/supabase.js'

class AuthService {
  /**
   * Đăng nhập với email và password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{user, session, error}>}
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (error) throw error

      // Lấy thông tin user từ bảng users
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (!userError && userData) {
          // Kiểm tra trạng thái tài khoản
          if (userData.status === 'blocked') {
            await this.signOut()
            throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin.')
          }
          if (userData.status === 'suspended') {
            await this.signOut()
            throw new Error('Tài khoản của bạn đang bị tạm ngưng.')
          }

          return {
            user: userData,
            session: data.session,
            error: null
          }
        }
      }

      return { user: data.user, session: data.session, error: null }
    } catch (error) {
      console.error('Login error:', error)
      return { user: null, session: null, error: error.message }
    }
  }

  /**
   * Đăng ký tài khoản mới
   * @param {string} email 
   * @param {string} password 
   * @param {string} username 
   * @returns {Promise<{user, error}>}
   */
  async signUp(email, password, username) {
    try {
      // Kiểm tra username đã tồn tại chưa
      const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username.trim())
        .single()

      if (existingUser) {
        throw new Error('Tên người dùng đã tồn tại')
      }

      // Tạo tài khoản auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim()
          },
          emailRedirectTo: `${window.location.origin}/verify-email.html`
        }
      })

      if (error) throw error

      // Tạo record trong bảng users
      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: email.trim(),
              username: username.trim(),
              role: 'member',
              status: 'active'
            }
          ])

        if (insertError) throw insertError
      }

      return { user: data.user, error: null }
    } catch (error) {
      console.error('Signup error:', error)
      return { user: null, error: error.message }
    }
  }

  /**
   * Đăng xuất
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear local storage
      localStorage.removeItem('user')
      localStorage.removeItem('session')
      
      return { error: null }
    } catch (error) {
      console.error('Signout error:', error)
      return { error: error.message }
    }
  }

  /**
   * Gửi email reset password
   * @param {string} email 
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password.html`
      })

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: error.message }
    }
  }

  /**
   * Cập nhật mật khẩu mới
   * @param {string} newPassword 
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Update password error:', error)
      return { error: error.message }
    }
  }

  /**
   * Đăng nhập với OAuth (Google, Twitter, Discord)
   * @param {string} provider - 'google' | 'twitter' | 'discord'
   */
  async signInWithOAuth(provider) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth-callback.html`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('OAuth error:', error)
      return { data: null, error: error.message }
    }
  }

  /**
   * Lấy thông tin user hiện tại
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) throw error
      if (!user) return { user: null, error: null }

      // Lấy thông tin chi tiết từ bảng users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError) throw userError

      return { user: userData, error: null }
    } catch (error) {
      console.error('Get current user error:', error)
      return { user: null, error: error.message }
    }
  }

  /**
   * Lấy session hiện tại
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { session, error: null }
    } catch (error) {
      console.error('Get session error:', error)
      return { session: null, error: error.message }
    }
  }

  /**
   * Kiểm tra xem user đã đăng nhập chưa
   */
  async isAuthenticated() {
    const { session } = await this.getSession()
    return !!session
  }

  /**
   * Xác minh email (sau khi click link trong email)
   */
  async verifyEmail(token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Verify email error:', error)
      return { data: null, error: error.message }
    }
  }
}

// Export singleton instance
export const authService = new AuthService()
