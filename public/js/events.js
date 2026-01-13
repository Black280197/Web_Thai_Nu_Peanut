// Events page initialization
import { getCurrentUser, isAdmin, supabase } from './supabase-client.js'
import { handleLogout } from './auth.js'

let currentUser = null
let currentEventId = null
let currentTab = 'official'

// Load like and comment counts for events
async function getEventCounts(eventIds) {
  try {
    const [likesResponse, commentsResponse] = await Promise.all([
      supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'event')
        .in('target_id', eventIds),
      supabase
        .from('comments')
        .select('target_id')
        .eq('target_type', 'event')
        .eq('status', 'active')
        .in('target_id', eventIds)
    ])
    
    const likeCounts = {}
    const commentCounts = {}
    
    if (likesResponse.data) {
      likesResponse.data.forEach(like => {
        likeCounts[like.target_id] = (likeCounts[like.target_id] || 0) + 1
      })
    }
    
    if (commentsResponse.data) {
      commentsResponse.data.forEach(comment => {
        commentCounts[comment.target_id] = (commentCounts[comment.target_id] || 0) + 1
      })
    }
    
    return { likeCounts, commentCounts }
  } catch (error) {
    console.error('Error loading counts:', error)
    return { likeCounts: {}, commentCounts: {} }
  }
}

// Load and display events
async function loadEvents(type = 'official') {
  const container = document.getElementById(type === 'official' ? 'events-container' : 'fan-events-container')
  const loadingState = document.getElementById('loading-state')
  const emptyState = document.getElementById('empty-state')
  
  // Show loading
  if (loadingState) loadingState.classList.remove('hidden')
  
  try {
    // Get events based on type
    let query = supabase.from('events').select('*')
    
    if (type === 'official') {
      query = query.eq('status', 'published').eq('event_type', 'official')
    } else {
      query = query.in('status', ['published', 'approved']).eq('event_type', 'fan')
    }
    
    const { data: events, error } = await query.order('event_date', { ascending: false })
    
    if (error) throw error
    
    loadingState?.classList.add('hidden')
    
    if (!events || events.length === 0) {
      emptyState?.classList.remove('hidden')
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <span class="material-symbols-outlined text-6xl text-pink-100/30 mb-4 block">event_note</span>
          <p class="text-xl text-pink-100/70 mb-2">Chưa có sự kiện nào</p>
          <p class="text-sm text-pink-100/50">Hãy quay lại sau để xem cập nhật mới!</p>
        </div>
      `
      return
    }
    
    // Get like and comment counts
    const eventIds = events.map(e => e.id)
    const { likeCounts, commentCounts } = await getEventCounts(eventIds)
    
    container.innerHTML = events.map(event => {
      const eventDate = new Date(event.event_date || event.created_at).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      
      const excerpt = event.description || (event.content ? event.content.substring(0, 150) + '...' : 'Không có mô tả')
      const likeCount = likeCounts[event.id] || 0
      const commentCount = commentCounts[event.id] || 0
      
      // Add status badge for fan events
      const statusBadge = type === 'fan' && event.status === 'approved' ? 
        '<span class="absolute top-2 right-2 px-2 py-1 bg-green-500/80 text-white text-xs rounded-full">Đã duyệt</span>' : ''
      
      return `
        <article class="event-card group bg-white/5 backdrop-blur-md border border-pink-300/20 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 cursor-pointer relative" data-event-id="${event.id}">
          ${statusBadge}
          ${event.image_url ? `
            <div class="relative h-48 overflow-hidden">
              <img src="${event.image_url}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
          ` : ''}
          <div class="p-6">
            <div class="flex items-center gap-2 text-xs text-pink-100/50 mb-3">
              <span class="material-symbols-outlined text-sm">calendar_today</span>
              <time datetime="${event.event_date || event.created_at}">${eventDate}</time>
            </div>
            <h2 class="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors duration-300">${event.title}</h2>
            <p class="text-pink-100/80 text-sm leading-relaxed mb-4">${excerpt}</p>
            
            <div class="flex items-center justify-between text-sm text-pink-100/60">
              <div class="flex items-center gap-4">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-pink-400">favorite</span>
                  ${likeCount}
                </span>
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-blue-400">chat_bubble</span>
                  ${commentCount}
                </span>
              </div>
              <span class="text-primary font-medium group-hover:underline">Đọc thêm →</span>
            </div>
          </div>
        </article>
      `
    }).join('')
    
    // Add click handlers
    container.querySelectorAll('.event-card').forEach(card => {
      card.addEventListener('click', () => {
        const eventId = card.dataset.eventId
        const event = events.find(e => e.id === eventId)
        if (event) openEventModal(event)
      })
    })
    
  } catch (error) {
    console.error('Error loading events:', error)
    loadingState?.classList.add('hidden')
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <span class="material-symbols-outlined text-6xl text-red-400 mb-4 block">error</span>
          <h3 class="text-xl text-white mb-2">Không thể tải sự kiện</h3>
          <p class="text-pink-100/60 mb-4">Có lỗi xảy ra khi tải danh sách sự kiện</p>
          <button onclick="location.reload()" class="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors">
            Thử lại
          </button>
        </div>
      `
    }
  }
}

// Switch between tabs
function switchTab(tabType) {
  currentTab = tabType
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'))
  document.getElementById(`${tabType}-tab`).classList.add('active')
  
  // Show/hide tab content
  document.getElementById('official-events-tab').classList.toggle('hidden', tabType !== 'official')
  document.getElementById('fan-events-tab').classList.toggle('hidden', tabType !== 'fan')
  
  // Show/hide create post section for fan tab
  const createSection = document.getElementById('create-post-section')
  if (createSection) {
    createSection.classList.toggle('hidden', tabType !== 'fan' || !currentUser)
  }
  
  // Load appropriate events
  loadEvents(tabType)
}

// Create new fan post
async function createFanPost(postData) {
  if (!currentUser) {
    alert('Bạn cần đăng nhập để tạo bài viết!')
    return false
  }
  
  try {
    const { error } = await supabase
      .from('events')
      .insert({
        title: postData.title,
        content: postData.content,
        description: postData.description,
        image_url: postData.image_url,
        event_type: 'fan',
        status: 'draft',
        author_id: currentUser.id,
        created_by: currentUser.id,
        event_date: new Date().toISOString()
      })
    
    if (error) throw error
    
    return true
  } catch (error) {
    console.error('Error creating post:', error)
    return false
  }
}

// Setup create post modal
function setupCreatePostModal() {
  const modal = document.getElementById('create-post-modal')
  const createBtn = document.getElementById('create-post-btn')
  const closeBtn = document.getElementById('close-create-modal')
  const cancelBtn = document.getElementById('cancel-post')
  const form = document.getElementById('create-post-form')
  
  // Open modal
  createBtn?.addEventListener('click', () => {
    if (!currentUser) {
      alert('Bạn cần đăng nhập để tạo bài viết!')
      return
    }
    modal?.classList.remove('hidden')
  })
  
  // Close modal
  const closeModal = () => {
    modal?.classList.add('hidden')
    form?.reset()
  }
  
  closeBtn?.addEventListener('click', closeModal)
  cancelBtn?.addEventListener('click', closeModal)
  
  // Click outside to close
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })
  
  // Submit form
  form?.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const submitBtn = document.getElementById('submit-post')
    const originalText = submitBtn.textContent
    
    submitBtn.disabled = true
    submitBtn.textContent = 'Đang đăng...'
    
    const postData = {
      title: document.getElementById('post-title').value.trim(),
      content: document.getElementById('post-content').value.trim(),
      description: document.getElementById('post-description').value.trim(),
      image_url: document.getElementById('post-image').value.trim()
    }
    
    if (!postData.title || !postData.content) {
      alert('Vui lòng điền đầy đủ tiêu đề và nội dung!')
      submitBtn.disabled = false
      submitBtn.textContent = originalText
      return
    }
    
    const success = await createFanPost(postData)
    
    if (success) {
      alert('Bài viết đã được tạo và đang chờ admin duyệt!')
      closeModal()
      if (currentTab === 'fan') {
        loadEvents('fan')
      }
    } else {
      alert('Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại!')
    }
    
    submitBtn.disabled = false
    submitBtn.textContent = originalText
  })
}

// Open event modal
async function openEventModal(event) {
  currentEventId = event.id
  
  const modal = document.getElementById('event-modal')
  const title = document.getElementById('modal-title')
  const meta = document.getElementById('modal-meta')
  const content = document.getElementById('modal-content')
  const image = document.getElementById('modal-image')
  const img = document.getElementById('modal-img')
  
  if (!modal) return
  
  // Set content
  if (title) title.textContent = event.title
  if (content) content.innerHTML = event.content || event.description || ''
  
  // Set meta info
  const eventDate = new Date(event.event_date || event.created_at).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  if (meta) {
    meta.innerHTML = `
      <span class="flex items-center gap-1">
        <span class="material-symbols-outlined text-sm">calendar_today</span>
        ${eventDate}
      </span>
    `
  }
  
  // Set image
  if (event.image_url && img && image) {
    img.src = event.image_url
    img.alt = event.title
    image.classList.remove('hidden')
  } else if (image) {
    image.classList.add('hidden')
  }
  
  // Load likes and comments
  await loadEventLikes(event.id)
  await loadEventComments(event.id)
  
  // Setup user avatar
  if (currentUser) {
    const userAvatar = document.getElementById('user-avatar')
    if (userAvatar) {
      const username = currentUser.user_metadata?.username || currentUser.email
      userAvatar.textContent = username.charAt(0).toUpperCase()
    }
  }
  
  modal.classList.remove('hidden')
}

// Load event likes
async function loadEventLikes(eventId) {
  try {
    // Get total like count
    const { data: likes, error } = await supabase
      .from('likes')
      .select('*')
      .eq('target_type', 'event')
      .eq('target_id', eventId)
    
    if (error) throw error
    
    const likeCount = likes ? likes.length : 0
    const userLiked = currentUser ? likes.some(like => like.user_id === currentUser.id) : false
    
    // Update UI
    const likeBtn = document.getElementById('modal-like-btn')
    const likeCountEl = document.getElementById('modal-like-count')
    
    if (likeBtn && likeCountEl) {
      const icon = likeBtn.querySelector('.material-symbols-outlined')
      
      likeBtn.dataset.eventId = eventId
      likeBtn.dataset.liked = userLiked.toString()
      likeCountEl.textContent = likeCount
      
      if (userLiked) {
        likeBtn.classList.add('liked')
        if (icon) icon.textContent = 'favorite'
      } else {
        likeBtn.classList.remove('liked')
        if (icon) icon.textContent = 'favorite_border'
      }
    }
    
  } catch (error) {
    console.error('Error loading likes:', error)
  }
}

// Load event comments
async function loadEventComments(eventId) {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        users!comments_user_id_fkey(username, avatar_url)
      `)
      .eq('target_type', 'event')
      .eq('target_id', eventId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    const commentCount = comments ? comments.length : 0
    const commentCountEl = document.getElementById('modal-comment-count')
    if (commentCountEl) {
      commentCountEl.textContent = `${commentCount} bình luận`
    }
    
    const commentsList = document.getElementById('comments-list')
    if (!commentsList) return
    
    if (!comments || comments.length === 0) {
      commentsList.innerHTML = `
        <div class="text-center py-4 text-pink-100/50">
          <span class="material-symbols-outlined text-2xl mb-2 block">chat_bubble_outline</span>
          <p>Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        </div>
      `
      return
    }
    
    commentsList.innerHTML = comments.map(comment => {
      const user = comment.users || {}
      const avatar = user.avatar_url || getDefaultAvatar(user.username)
      const timeAgo = getTimeAgo(comment.created_at)
      
      return `
        <div class="comment-item">
          <div class="flex gap-3">
            <div class="comment-avatar">
              ${avatar.startsWith('http') ? 
                `<img src="${avatar}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` :
                avatar
              }
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-white font-medium text-sm">${user.username || 'Anonymous'}</span>
                <span class="text-pink-100/50 text-xs">${timeAgo}</span>
              </div>
              <p class="text-pink-100/90 text-sm leading-relaxed mb-2">${comment.content}</p>
              <div class="flex items-center gap-2">
                <button class="comment-like-btn text-xs text-pink-100/60 hover:text-pink-400 transition-colors" data-comment-id="${comment.id}">
                  <span class="material-symbols-outlined text-sm mr-1">favorite_border</span>
                  <span class="comment-like-count">0</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `
    }).join('')
    
  } catch (error) {
    console.error('Error loading comments:', error)
  }
}

// Toggle comment like
async function toggleCommentLike(commentId) {
  if (!currentUser) {
    alert('Bạn cần đăng nhập để thích bình luận!')
    return
  }
  
  try {
    // Check if user already liked this comment
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }
    
    const commentLikeBtn = document.querySelector(`[data-comment-id="${commentId}"]`)
    const likeCountEl = commentLikeBtn?.querySelector('.comment-like-count')
    let currentCount = parseInt(likeCountEl?.textContent || '0')
    
    if (existingLike) {
      // Remove like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)
      
      if (error) throw error
      
      commentLikeBtn?.classList.remove('liked')
      if (likeCountEl) likeCountEl.textContent = Math.max(0, currentCount - 1)
    } else {
      // Add like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: currentUser.id,
          target_type: 'comment',
          target_id: commentId
        })
      
      if (error) throw error
      
      commentLikeBtn?.classList.add('liked')
      if (likeCountEl) likeCountEl.textContent = currentCount + 1
    }
    
  } catch (error) {
    console.error('Error toggling comment like:', error)
    alert('Có lỗi xảy ra khi thích bình luận!')
  }
}

// Toggle event like
async function toggleEventLike() {
  if (!currentUser) {
    alert('Bạn cần đăng nhập để thả tim!')
    return
  }

  const likeBtn = document.getElementById('modal-like-btn')
  if (!likeBtn) return
  
  const eventId = likeBtn.dataset.eventId
  const isLiked = likeBtn.dataset.liked === 'true'

  try {
    likeBtn.disabled = true
    likeBtn.classList.add('like-animation')

    const icon = likeBtn.querySelector('.material-symbols-outlined')
    const countElement = document.getElementById('modal-like-count')
    const currentCount = parseInt(countElement?.textContent || '0')

    if (isLiked) {
      // Remove like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('target_type', 'event')
        .eq('target_id', eventId)

      if (error) throw error

      likeBtn.classList.remove('liked')
      likeBtn.dataset.liked = 'false'
      if (icon) icon.textContent = 'favorite_border'
      if (countElement) countElement.textContent = Math.max(0, currentCount - 1)

    } else {
      // Add like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: currentUser.id,
          target_type: 'event',
          target_id: eventId
        })

      if (error) throw error

      likeBtn.classList.add('liked')
      likeBtn.dataset.liked = 'true'
      if (icon) icon.textContent = 'favorite'
      if (countElement) countElement.textContent = currentCount + 1
    }

  } catch (error) {
    console.error('Error toggling like:', error)
    alert('Có lỗi xảy ra khi thả tim. Vui lòng thử lại!')
  } finally {
    likeBtn.disabled = false
    setTimeout(() => {
      likeBtn.classList.remove('like-animation')
    }, 400)
  }
}

// Submit comment
async function submitComment() {
  if (!currentUser) {
    alert('Bạn cần đăng nhập để bình luận!')
    return
  }

  const input = document.getElementById('comment-input')
  const submitBtn = document.getElementById('comment-submit')
  
  if (!input || !submitBtn) return
  
  const content = input.value.trim()

  if (!content) {
    alert('Vui lòng nhập nội dung bình luận!')
    return
  }

  try {
    submitBtn.disabled = true
    submitBtn.innerHTML = '<span class="animate-spin">⏳</span>'

    const { error } = await supabase
      .from('comments')
      .insert({
        user_id: currentUser.id,
        target_type: 'event',
        target_id: currentEventId,
        content: content
      })

    if (error) throw error

    input.value = ''
    await loadEventComments(currentEventId)

  } catch (error) {
    console.error('Error submitting comment:', error)
    alert('Có lỗi xảy ra khi gửi bình luận. Vui lòng thử lại!')
  } finally {
    submitBtn.disabled = false
    submitBtn.innerHTML = '<span class="material-symbols-outlined">send</span>'
  }
}

// Setup modal
function setupModal() {
  const modal = document.getElementById('event-modal')
  const closeBtn = document.getElementById('close-modal')
  const likeBtn = document.getElementById('modal-like-btn')
  const submitBtn = document.getElementById('comment-submit')
  
  // Close modal
  closeBtn?.addEventListener('click', () => {
    modal?.classList.add('hidden')
    currentEventId = null
  })
  
  // Click outside to close
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden')
      currentEventId = null
    }
  })
  
  // Like button
  likeBtn?.addEventListener('click', toggleEventLike)
  
  // Submit comment
  submitBtn?.addEventListener('click', submitComment)
  
  // Enter key to submit comment
  const commentInput = document.getElementById('comment-input')
  commentInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitComment()
    }
  })
  
  // Setup comment like handlers (delegated event handling)
  const commentsContainer = document.getElementById('comments-list')
  commentsContainer?.addEventListener('click', (e) => {
    if (e.target.closest('.comment-like-btn')) {
      const commentId = e.target.closest('.comment-like-btn').dataset.commentId
      toggleCommentLike(commentId)
    }
  })
}

// Helper functions
function getDefaultAvatar(username) {
  const colors = ['#FF69B4', '#9370DB', '#00CED1', '#FF6347', '#32CD32']
  const initial = username ? username.charAt(0).toUpperCase() : '?'
  const color = colors[username ? username.charCodeAt(0) % colors.length : 0]
  
  return `
    <div style="
      width: 100%; 
      height: 100%; 
      background: ${color}; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
    ">${initial}</div>
  `
}

function getTimeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now - date) / 1000)
  
  if (diffInSeconds < 60) return 'Vừa xong'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`
  
  return new Date(dateString).toLocaleDateString('vi-VN')
}

// Open image fullscreen
window.openImageFullscreen = function(imageSrc) {
  const modal = document.getElementById('image-fullscreen-modal')
  const img = document.getElementById('fullscreen-img')
  
  if (modal && img) {
    img.src = imageSrc
    modal.classList.remove('hidden')
  }
}

// Close image fullscreen
window.closeImageFullscreen = function() {
  const modal = document.getElementById('image-fullscreen-modal')
  if (modal) {
    modal.classList.add('hidden')
  }
}

// Initialize page
async function init() {
  currentUser = await getCurrentUser()
  
  const loginButton = document.getElementById('login-button')
  const userSection = document.getElementById('user-section')
  const logoutButton = document.getElementById('logout-button')
  const adminNavLink = document.getElementById('admin-nav-link')
  const adminNavLinkMobile = document.getElementById('admin-nav-link-mobile')
  
  if (currentUser) {
    // Show user section
    userSection?.classList.remove('hidden')
    const usernameStrong = userSection?.querySelector('strong')
    if (usernameStrong) {
      usernameStrong.textContent = currentUser.user_metadata?.username || currentUser.email
    }
    
    // Check if admin
    if (await isAdmin()) {
      adminNavLink?.classList.remove('hidden')
      adminNavLinkMobile?.classList.remove('hidden')
    }
  } else {
    // Show login button
    loginButton?.classList.remove('hidden')
  }
  
  // Handle login button
  loginButton?.addEventListener('click', () => {
    window.location.href = '/login.html'
  })
  
  // Handle logout
  logoutButton?.addEventListener('click', async () => {
    await handleLogout()
    window.location.href = '/'
  })
  
  // Setup tab system
  document.getElementById('official-tab')?.addEventListener('click', () => switchTab('official'))
  document.getElementById('fan-tab')?.addEventListener('click', () => switchTab('fan'))
  
  // Show/hide create post section based on user login and tab
  const createSection = document.getElementById('create-post-section')
  if (createSection && currentUser) {
    createSection.classList.toggle('hidden', currentTab !== 'fan')
  }
  
  // Setup modals
  setupModal()
  setupCreatePostModal()
  
  // Load initial content
  await loadEvents('official')
}
init()
