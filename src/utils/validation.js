/**
 * Validation Utilities
 * Các hàm validate form input
 */

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * Yêu cầu: Tối thiểu 6 ký tự
 * @param {string} password 
 * @returns {{isValid: boolean, message: string}}
 */
export function validatePassword(password) {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: 'Mật khẩu phải có ít nhất 6 ký tự'
    }
  }

  // Optional: Thêm các yêu cầu mạnh hơn
  // if (!/[A-Z]/.test(password)) {
  //   return {
  //     isValid: false,
  //     message: 'Mật khẩu phải có ít nhất 1 chữ in hoa'
  //   }
  // }

  return {
    isValid: true,
    message: 'Mật khẩu hợp lệ'
  }
}

/**
 * Validate username
 * Yêu cầu: 3-20 ký tự, chỉ chữ cái, số và underscore
 * @param {string} username 
 * @returns {{isValid: boolean, message: string}}
 */
export function validateUsername(username) {
  if (!username || username.length < 3) {
    return {
      isValid: false,
      message: 'Tên người dùng phải có ít nhất 3 ký tự'
    }
  }

  if (username.length > 20) {
    return {
      isValid: false,
      message: 'Tên người dùng không được quá 20 ký tự'
    }
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      message: 'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới'
    }
  }

  return {
    isValid: true,
    message: 'Tên người dùng hợp lệ'
  }
}

/**
 * Hiển thị error message trên form
 * @param {string} elementId 
 * @param {string} message 
 */
export function showError(elementId, message) {
  const element = document.getElementById(elementId)
  if (!element) return

  // Tạo hoặc cập nhật error message
  let errorDiv = element.nextElementSibling
  if (!errorDiv || !errorDiv.classList.contains('error-message')) {
    errorDiv = document.createElement('div')
    errorDiv.className = 'error-message text-red-500 text-sm mt-1 ml-2'
    element.parentNode.insertBefore(errorDiv, element.nextSibling)
  }

  errorDiv.textContent = message
  element.classList.add('border-red-500')
}

/**
 * Xóa error message
 * @param {string} elementId 
 */
export function clearError(elementId) {
  const element = document.getElementById(elementId)
  if (!element) return

  const errorDiv = element.nextElementSibling
  if (errorDiv && errorDiv.classList.contains('error-message')) {
    errorDiv.remove()
  }

  element.classList.remove('border-red-500')
}

/**
 * Hiển thị toast notification
 * @param {string} message 
 * @param {string} type - 'success' | 'error' | 'info'
 */
export function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${
    type === 'success' ? 'bg-green-500' :
    type === 'error' ? 'bg-red-500' :
    'bg-blue-500'
  } text-white font-medium`
  
  toast.textContent = message
  document.body.appendChild(toast)

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full')
  }, 100)

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full')
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 3000)
}
