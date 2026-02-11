// Landing Page Peanut JavaScript
import { supabase } from './supabase-client.js'

// Static images for film roll (10 images from img_round folder)
const filmImages = [
    '/assets/img_round/01.jpg',
    '/assets/img_round/02.jpg',
    '/assets/img_round/03.jpg',
    '/assets/img_round/04.jpg',
    '/assets/img_round/05.jpg',
    '/assets/img_round/06.jpg',
    '/assets/img_round/07.jpg',
    '/assets/img_round/08.jpg',
    '/assets/img_round/09.jpg',
    '/assets/img_round/10.jpg'
]

// Wishes data (loaded from Supabase)
let wishes = []

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadApprovedWishes()
    createFilmRoll()
    initEventListeners()
})

// Load approved wishes from Supabase
async function loadApprovedWishes() {
    try {
        const { data: wishesData, error } = await supabase
            .from('wishes')
            .select('id, content, image_url, sticker, users!wishes_user_id_fkey(username)')
            .eq('status', 'approved')
            .eq('type', 'debut')
            .order('created_at', { ascending: false })

        if (error) throw error

        wishes = wishesData || []
        console.log(`Loaded ${wishes.length} approved wishes`)
    } catch (error) {
        console.error('Error loading wishes:', error)
        wishes = []
    }
}

// Check if text contains Korean characters
function hasKorean(text) {
    const koreanRegex = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/
    return koreanRegex.test(text)
}

// Create film roll with 10 static images
function createFilmRoll() {
    const filmRoll = document.getElementById('filmRoll')
    const numFrames = filmImages.length

    // Check if mobile
    const isMobile = window.innerWidth <= 768

    filmImages.forEach((imageSrc, index) => {
        const filmStrip = document.createElement('div')
        filmStrip.className = 'film-strip'

        // Use different animation for mobile
        const animationName = isMobile ? 'rotateFilmMobile' : 'rotateFilm'
        filmStrip.style.animation = `${animationName} 20s linear infinite`
        filmStrip.style.animationDelay = `-${(index * 20) / numFrames}s`

        const filmFrame = document.createElement('div')
        filmFrame.className = 'film-frame'
        filmFrame.dataset.index = index

        const img = document.createElement('img')
        img.src = imageSrc
        img.alt = `Image ${index + 1}`
        img.onerror = function () {
            this.src = '/assets/img/peanut.png'
        }

        filmFrame.appendChild(img)
        filmStrip.appendChild(filmFrame)
        filmRoll.appendChild(filmStrip)
    })

    console.log(`Created film roll with ${numFrames} frames`)
}

// Peanut jump functionality
const peanut = document.getElementById('peanut')
const popupOverlay = document.getElementById('popupOverlay')
const closeBtn = document.getElementById('closeBtn')
let isJumping = false

function jump() {
    if (isJumping) return

    isJumping = true
    peanut.classList.add('jumping')

    // Check which frame is at center after 300ms (peak of jump)
    setTimeout(() => {
        checkCenterFrame()
    }, 300)

    // Reset jump state
    setTimeout(() => {
        peanut.classList.remove('jumping')
        isJumping = false
    }, 600)
}

function checkCenterFrame() {
    const filmStrips = document.querySelectorAll('.film-strip')
    let centerIndex = -1
    let minDistance = Infinity

    filmStrips.forEach((strip, index) => {
        const rect = strip.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const screenCenter = window.innerWidth / 2
        const distance = Math.abs(centerX - screenCenter)

        if (distance < minDistance) {
            minDistance = distance
            centerIndex = index
        }
    })

    // Check if the frame is close enough to center
    // Use smaller tolerance on mobile due to smaller frame size
    const isMobile = window.innerWidth <= 768
    const tolerance = isMobile ? 60 : 100

    if (minDistance < tolerance && centerIndex !== -1) {
        // Show a random wish instead of specific one
        showRandomWish()
    }
}

// Show a random wish from the database
function showRandomWish() {
    if (!wishes || wishes.length === 0) {
        console.error('No wishes loaded from database')
        alert('Chưa có lời chúc nào được duyệt!')
        return
    }

    // Pick a random wish
    const randomIndex = Math.floor(Math.random() * wishes.length)
    const wish = wishes[randomIndex]

    // Set username
    document.getElementById('modal-username').textContent = wish.users?.username || 'Anonymous'

    // Set content - extract message after first colon or use full content
    const contentElement = document.getElementById('modal-content')
    let content = wish.content || ''

    // Try to extract message after "From: username:" pattern
    const colonIndex = content.indexOf(':')
    if (colonIndex !== -1) {
        content = content.substring(colonIndex + 1).trim()
    }

    // Clean up extra line breaks
    content = content.replaceAll("\n\n", "\n")
    contentElement.textContent = content

    // Check if Korean and apply appropriate font
    if (hasKorean(content)) {
        contentElement.classList.remove('my-candy-cake')
        contentElement.classList.add('my-korea-font')
        contentElement.style.fontSize = '2rem'
    } else {
        contentElement.classList.remove('my-candy-cake')
        contentElement.classList.remove('my-korea-font')
        contentElement.style.fontSize = '1.625rem'
    }

    // Show image if available
    const imageContainer = document.getElementById('modal-image-container')
    const imageElement = document.getElementById('modal-image')
    if (wish.image_url) {
        imageElement.src = wish.image_url
        imageContainer.classList.remove('hidden')
    } else {
        imageContainer.classList.add('hidden')
    }

    // Show modal
    popupOverlay.classList.add('active')

    // Scroll to top of content
    const wishContentDisplay = document.getElementById('wish-content-display')
    if (wishContentDisplay) {
        wishContentDisplay.scrollTo({ top: 0, behavior: 'smooth' })
    }
}

function closePopup() {
    popupOverlay.classList.remove('active')
}

// Initialize all event listeners
function initEventListeners() {
    // Peanut click
    peanut.addEventListener('click', jump)

    // Space key
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault()
            jump()
        }
    })

    // Close button
    closeBtn.addEventListener('click', closePopup)

    // Click outside modal
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) {
            closePopup()
        }
    })

    // Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (popupOverlay.classList.contains('active')) {
                closePopup()
            }
        }
    })

    // Handle window resize to update film roll animation
    let resizeTimer
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
            // Recreate film roll with appropriate animation for current screen size
            const filmRoll = document.getElementById('filmRoll')
            filmRoll.innerHTML = ''
            createFilmRoll()
        }, 250)
    })
}
