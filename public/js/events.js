// Events page initialization
import { getCurrentUser, isAdmin, supabase } from './supabase-client.js'
import { handleLogout } from './auth.js'

let currentUser = null
let currentEventId = null

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
async function loadEvents() {
  const container = document.getElementById('events-container')
  const loadingState = document.getElementById('loading-state')
  const emptyState = document.getElementById('empty-state')

  try {
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        author:author_id (username)
      `)
      .eq('status', 'published')
      .eq('event_type', 'official')
      .order('published_at', { ascending: false })

    if (error) throw error

    loadingState?.classList.add('hidden')

    if (!events || events.length === 0) {
      emptyState?.classList.remove('hidden')
      return
    }

    // Get like and comment counts
    const eventIds = events.map(e => e.id)
    const { likeCounts, commentCounts } = await getEventCounts(eventIds)

    container.innerHTML = events.map(event => {
      const publishedDate = new Date(event.published_at || event.created_at).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      const excerpt = event.excerpt || event.content.substring(0, 150) + '...'
      const likeCount = likeCounts[event.id] || 0
      const commentCount = commentCounts[event.id] || 0

      return `
        <article class="group bg-white/5 backdrop-blur-md border border-pink-300/20 rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(236,72,153,0.3)]">
          ${event.image_url ? `
            <div class="relative h-48 overflow-hidden">
              <img src="${event.image_url}" alt="${event.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
          ` : ''}
          <div class="p-6">
            <div class="flex items-center gap-2 text-xs text-pink-100/50 mb-3">
              <span class="material-symbols-outlined text-sm">calendar_today</span>
              <time datetime="${event.published_at}">${publishedDate}</time>
              <span class="mx-2">•</span>
              <span class="material-symbols-outlined text-sm">person</span>
              <span>${event.author?.username || 'Admin'}</span>
            </div>
            <h2 class="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
              ${event.title}
            </h2>
            <p class="text-pink-100/70 text-sm mb-4 line-clamp-3">
              ${excerpt}
            </p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4 text-sm text-pink-100/60">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">favorite</span>
                  ${likeCount}
                </span>
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm">comment</span>
                  ${commentCount}
                </span>
              </div>
              <button onclick="window.viewEvent('${event.id}')" class="inline-flex items-center gap-2 text-primary hover:text-primary-hover font-semibold text-sm group/btn">
                <span>Read more</span>
                <span class="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        </article>
      `
    }).join('')

  } catch (error) {
    console.error('Error loading events:', error)
    loadingState?.classList.add('hidden')
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined text-6xl text-red-400 mb-4">error</span>
        <p class="text-xl text-pink-100/70">Failed to load events</p>
      </div>
    `
  }
}

// View event detail in modal
window.viewEvent = async function (eventId) {
  currentEventId = eventId
  const modal = document.getElementById('event-modal')
  const modalTitle = document.getElementById('modal-title')
  const modalMeta = document.getElementById('modal-meta')
  const modalContent = document.getElementById('modal-content')
  const modalImageDiv = document.getElementById('modal-image')
  const modalImg = document.getElementById('modal-img')

  try {
    // Fetch event details
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        author:author_id (username)
      `)
      .eq('id', eventId)
      .single()

    if (error) throw error

    // Populate modal
    if (/<[a-z][\s\S]*>/i.test(event.title)) {
      modalTitle.innerHTML = event.title;
    } else {
      modalTitle.textContent = event.title;
    }

    const publishedDate = new Date(event.published_at || event.created_at).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    modalMeta.innerHTML = `
      <span class="flex items-center gap-1">
        <span class="material-symbols-outlined text-sm">calendar_today</span>
        <time datetime="${event.published_at}">${publishedDate}</time>
      </span>
      <span>•</span>
      <span class="flex items-center gap-1">
        <span class="material-symbols-outlined text-sm">person</span>
        <span>${event.author?.username || 'Admin'}</span>
      </span>
    `

    // Show image if exists
    if (event.image_url) {
      modalImg.src = event.image_url
      modalImg.alt = event.title
      modalImageDiv.classList.remove('hidden')
    } else {
      modalImageDiv.classList.add('hidden')
    }

    // Handle HTML content or plain text with line breaks
    let contentHtml = event.content;

    if (/<[a-z][\s\S]*>/i.test(contentHtml)) {
      modalContent.innerHTML = contentHtml;
    } else {
      contentHtml = event.content
        .split('\n')
        .map(para => para.trim())
        .filter(para => para.length > 0)
        .map(para => `<p class="mb-4 text-pink-100/80 leading-relaxed">${para}</p>`)
        .join('');

      modalContent.innerHTML = contentHtml;
    }

    // Load likes and comments
    await loadEventLikes(eventId)
    await loadEventComments(eventId)

    // Setup user avatar
    if (currentUser) {
      const userAvatar = document.getElementById('user-avatar')
      if (userAvatar) {
        userAvatar.innerHTML = getDefaultAvatar(currentUser.user_metadata?.username || currentUser.email)
      }
    }

    // Show modal
    modal.classList.remove('hidden')

  } catch (error) {
    console.error('Error loading event:', error)
    alert('Failed to load event details')
  }
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
      likeBtn.dataset.eventId = eventId
      likeBtn.dataset.liked = userLiked.toString()

      const heartIcon = likeBtn.querySelector('.material-symbols-outlined')
      if (heartIcon) {
        heartIcon.textContent = userLiked ? 'favorite' : 'favorite_border'
      }

      likeBtn.classList.toggle('liked', userLiked)
      likeCountEl.textContent = likeCount.toString()
    }

  } catch (error) {
    console.error('Error loading likes:', error)
  }
}

async function loadEventComments(eventId) {
  try {
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        user:user_id (username, email)
      `)
      .eq('target_type', 'event')
      .eq('target_id', eventId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })

    if (error) throw error

    const commentsList = document.getElementById('comments-list')
    const commentCountEl = document.getElementById('modal-comment-count')

    if (commentCountEl) {
      commentCountEl.textContent = `${comments.length} bình luận`
    }

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

    // Load like counts for comments
    const commentIds = comments.map(c => c.id)
    const { data: commentLikes } = await supabase
      .from('likes')
      .select('target_id, user_id')
      .eq('target_type', 'comment')
      .in('target_id', commentIds)

    const commentLikeCounts = {}
    const userCommentLikes = new Set()

    if (commentLikes) {
      commentLikes.forEach(like => {
        commentLikeCounts[like.target_id] = (commentLikeCounts[like.target_id] || 0) + 1
        if (currentUser && like.user_id === currentUser.id) {
          userCommentLikes.add(like.target_id)
        }
      })
    }

    // Check if current user is admin
    const userIsAdmin = currentUser ? await isAdmin() : false

    commentsList.innerHTML = comments.map(comment => {
      const timeAgo = getTimeAgo(comment.created_at)
      const username = comment.user?.username || comment.user?.email || 'Anonymous'
      const likeCount = commentLikeCounts[comment.id] || 0
      const isLiked = userCommentLikes.has(comment.id)

      return `
        <div class="comment-item" data-comment-id="${comment.id}">
          <div class="flex gap-3">
            <div class="comment-avatar">
              ${getDefaultAvatar(username)}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-white text-sm">${username}</span>
                <span class="text-xs text-pink-100/50">${timeAgo}</span>
              </div>
              <p class="text-pink-100/80 text-sm mb-2">${comment.content}</p>
              <div class="flex items-center gap-3">
                <button onclick="toggleCommentLike('${comment.id}')" class="like-button flex items-center gap-1 text-xs text-pink-100/60 hover:text-primary transition-colors ${isLiked ? 'liked' : ''}">
                  <span class="material-symbols-outlined text-sm">${isLiked ? 'favorite' : 'favorite_border'}</span>
                  <span>${likeCount}</span>
                </button>
                ${userIsAdmin ? `
                  <button onclick="deleteComment('${comment.id}')" class="delete-comment-btn flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 transition-colors">
                    <span class="material-symbols-outlined text-sm">delete</span>
                    <span>Delete</span>
                  </button>
                ` : ''}
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

// Delete comment (admin only)
async function deleteComment(commentId) {
  if (!currentUser || !(await isAdmin())) {
    alert('Bạn không có quyền xóa bình luận này!')
    return
  }

  if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
    return
  }

  try {
    const { error } = await supabase
      .from('comments')
      .update({ status: 'deleted' })
      .eq('id', commentId)

    if (error) throw error

    // Remove comment from DOM
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`)
    if (commentElement) {
      commentElement.remove()
    }

    // Reload comments to update count
    await loadEventComments(currentEventId)

  } catch (error) {
    console.error('Error deleting comment:', error)
    alert('An error occurred while deleting the comment. Please try again!')
  }
}

// Toggle comment like
async function toggleCommentLike(commentId) {
  if (!currentUser) {
    alert('You need to log in to like a comment!')
    return
  }

  try {
    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .single()

    if (existingLike) {
      // Unlike
      await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)
    } else {
      // Like
      await supabase
        .from('likes')
        .insert({
          user_id: currentUser.id,
          target_type: 'comment',
          target_id: commentId
        })
    }

    // Reload comments to update counts
    await loadEventComments(currentEventId)

  } catch (error) {
    console.error('Error toggling comment like:', error)
  }
}

// Toggle event like
async function toggleEventLike() {
  if (!currentUser) {
    alert('You need to log in to like the event!')
    return
  }

  const likeBtn = document.getElementById('modal-like-btn')
  if (!likeBtn) return

  const eventId = likeBtn.dataset.eventId
  const isLiked = likeBtn.dataset.liked === 'true'

  try {
    likeBtn.disabled = true

    if (isLiked) {
      // Unlike
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('target_type', 'event')
        .eq('target_id', eventId)
    } else {
      // Like
      await supabase
        .from('likes')
        .insert({
          user_id: currentUser.id,
          target_type: 'event',
          target_id: eventId
        })
    }

    // Reload likes to update count
    await loadEventLikes(eventId)

    // Add heart animation
    const heartIcon = likeBtn.querySelector('.material-symbols-outlined')
    if (heartIcon && !isLiked) {
      heartIcon.classList.add('like-animation')
      setTimeout(() => {
        heartIcon.classList.remove('like-animation')
      }, 400)
    }

  } catch (error) {
    console.error('Error toggling like:', error)
  } finally {
    likeBtn.disabled = false
  }
}

// Submit comment
async function submitComment() {
  if (!currentUser) {
    alert('You need to log in to comment!')
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

    await supabase
      .from('comments')
      .insert({
        user_id: currentUser.id,
        target_type: 'event',
        target_id: currentEventId,
        content: content,
        status: 'active'
      })

    input.value = ''
    await loadEventComments(currentEventId)

  } catch (error) {
    console.error('Error submitting comment:', error)
  } finally {
    submitBtn.disabled = false
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
  })

  // Click outside to close
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal?.classList.add('hidden')
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
    if (e.target.closest('.like-button')) {
      const commentId = e.target.closest('.like-button').getAttribute('onclick').match(/'([^']+)'/)[1]
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

  if (diffInSeconds < 60) return `${diffInSeconds} giây trước`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`

  return new Date(dateString).toLocaleDateString('vi-VN')
}

// Open image fullscreen
window.openImageFullscreen = function (imageSrc) {
  const modal = document.getElementById('image-fullscreen-modal')
  const img = document.getElementById('fullscreen-img')

  if (modal && img) {
    img.src = imageSrc
    modal.classList.remove('hidden')
  }
}

// Close image fullscreen
window.closeImageFullscreen = function () {
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
    if (usernameStrong) usernameStrong.textContent = currentUser.user_metadata?.username || currentUser.email

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

  // Setup modal
  setupModal()

  // Load events
  await loadEvents()
}

// Make toggleCommentLike globally available
window.toggleCommentLike = toggleCommentLike
window.deleteComment = deleteComment

init()