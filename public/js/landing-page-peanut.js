// Landing Page Peanut JavaScript
import { supabase } from './supabase-client.js'

// Static images for film roll (10 images from img_round folder)
const filmImages = [
    '/assets/img_round/01.png',
    // '/assets/img_round/02.png',
    '/assets/img_round/03.png',
    '/assets/img_round/04.png',
    '/assets/img_round/05.png',
    '/assets/img_round/06.png',
    '/assets/img_round/07.png',
    '/assets/img_round/08.png',
    '/assets/img_round/09.png',
    '/assets/img_round/10.png',
    '/assets/img_round/11.png',
    '/assets/img_round/12.png',
    '/assets/img_round/13.png',
    '/assets/img_round/14.png',
    '/assets/img_round/15.png',
    '/assets/img_round/16.png',
    '/assets/img_round/17.png',
    '/assets/img_round/18.png',
    '/assets/img_round/19.png',
    '/assets/img_round/20.png',
    '/assets/img_round/21.png',
    '/assets/img_round/22.png',
    '/assets/img_round/23.png',
    '/assets/img_round/24.png',
    '/assets/img_round/25.png',
    '/assets/img_round/26.png',
    '/assets/img_round/27.png',
    '/assets/img_round/28.png',
    '/assets/img_round/29.png',
    '/assets/img_round/30.png',
    '/assets/img_round/31.png',
    '/assets/img_round/32.png',
    '/assets/img_round/33.png',
    '/assets/img_round/34.png',
    '/assets/img_round/35.png',
    '/assets/img_round/36.png',
    '/assets/img_round/37.png',
    '/assets/img_round/38.png',
    '/assets/img_round/39.png',
    '/assets/img_round/40.png',
    // '/assets/img_round/41.png',
    // '/assets/img_round/42.png',
    // '/assets/img_round/43.png',
    // '/assets/img_round/44.png',
    // '/assets/img_round/45.png',
    // '/assets/img_round/46.png',
    // '/assets/img_round/47.png',
    // '/assets/img_round/48.png',
    // '/assets/img_round/49.png',
]

// Peanut animation frames
const runFrames = [
    '/assets/img_run/run 1.png',
    '/assets/img_run/run 2.png',
    '/assets/img_run/run 3.png',
    '/assets/img_run/run 4.png',
    '/assets/img_run/run 5.png',
    '/assets/img_run/run 6.png',
    '/assets/img_run/run 7.png',
    '/assets/img_run/run 8.png'
]

const jumpFrames = [
    '/assets/img_run/jump1.png',
    '/assets/img_run/jump2.png',
    '/assets/img_run/jump3.png',
    '/assets/img_run/jump4.png',
    '/assets/img_run/jump5.png'
]

// Wishes data (loaded from Supabase)
let wishes = []
let currentFrame = 0
let runAnimationInterval = null
let isJumping = false

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    await loadApprovedWishes()
    createFilmRoll()
    createFlowerStrip()
    startRunningAnimation()
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

// Start peanut running animation
function startRunningAnimation() {
    const peanutImg = document.querySelector('.peanut img')
    let frameIndex = 0

    runAnimationInterval = setInterval(() => {
        if (!isJumping) {
            peanutImg.src = runFrames[frameIndex]
            frameIndex = (frameIndex + 1) % runFrames.length
        }
    }, 100) // Change frame every 100ms
}

// Create film roll with 10 static images
function createFilmRoll() {
    const filmRoll = document.getElementById('filmRoll')
    const numFrames = filmImages.length

    // Create images twice for seamless scrolling
    const allImages = [...filmImages, ...filmImages, ...filmImages, ...filmImages, ...filmImages, ...filmImages, ...filmImages, ...filmImages, ...filmImages, ...filmImages]

    allImages.forEach((imageSrc, index) => {
        const filmStrip = document.createElement('div')
        filmStrip.className = 'film-strip'

        const filmFrame = document.createElement('div')
        filmFrame.className = 'film-frame'
        filmFrame.dataset.index = index % numFrames

        const img = document.createElement('img')
        img.src = imageSrc
        img.alt = `Image ${(index % numFrames) + 1}`
        img.onerror = function () {
            this.src = '/assets/img/peanut.png'
        }

        filmFrame.appendChild(img)
        filmStrip.appendChild(filmFrame)
        filmRoll.appendChild(filmStrip)
    })

    console.log(`Created film roll with ${allImages.length} frames for seamless scrolling`)
}

// Create infinite scrolling flower strip with random spacing
function createFlowerStrip() {
    const strip = document.getElementById('flowerStrip')
    strip.innerHTML = ''

    const isMobile = window.innerWidth <= 768
    const numFlowers = 25

    // Generate random gap/size data once, then duplicate for seamless loop
    const flowerData = Array.from({ length: numFlowers }, () => ({
        gap: 115 + Math.random() * 160,   // 75–235 px random gap
        size: isMobile
            ? 30 + Math.random() * 14   // 30–44 px on mobile
            : 42 + Math.random() * 20   // 42–62 px on desktop
    }))

    // Render twice (identical seed) so translateX(-50%) loops seamlessly
    for (let pass = 0; pass < 2; pass++) {
        flowerData.forEach(({ gap, size }) => {
            const item = document.createElement('div')
            item.className = 'flower-item'
            item.style.marginLeft = gap + 'px'

            const img = document.createElement('img')
            img.src = '/assets/img/flower.png'
            img.alt = 'flower'
            img.style.width = size + 'px'
            img.style.height = size + 'px'
            img.onerror = function () { this.style.display = 'none' }

            item.appendChild(img)
            strip.appendChild(item)
        })
    }
}

// Check if peanut bounding box overlaps any flower image element
function checkFlowerCollision() {
    const peanutEl = document.getElementById('peanut')
    const peanutRect = peanutEl.getBoundingClientRect()

    // Shrink hitbox slightly for a felt-fair collision
    const hitbox = {
        left: peanutRect.left + peanutRect.width * 0.2,
        right: peanutRect.right - peanutRect.width * 0.2,
        top: peanutRect.top + peanutRect.height * 0.1,
        bottom: peanutRect.bottom
    }

    const flowers = document.querySelectorAll('.flower-item img')
    for (const flower of flowers) {
        const r = flower.getBoundingClientRect()
        if (r.width === 0) continue // hidden/errored image
        const overlap =
            hitbox.right > r.left &&
            hitbox.left < r.right &&
            hitbox.bottom > r.top &&
            hitbox.top < r.bottom
        if (overlap) return true
    }
    return false
}

// Peanut jump functionality
const peanut = document.getElementById('peanut')
const popupOverlay = document.getElementById('popupOverlay')
const closeBtn = document.getElementById('closeBtn')

function jump() {
    if (isJumping) return

    isJumping = true
    const peanutImg = document.querySelector('.peanut img')
    peanut.classList.add('jumping')

    // Animate through jump frames
    let frameIndex = 0
    const jumpFrameDuration = 120

    const jumpAnimationInterval = setInterval(() => {
        if (frameIndex < jumpFrames.length) {
            peanutImg.src = jumpFrames[frameIndex]
            frameIndex++
        } else {
            clearInterval(jumpAnimationInterval)
        }
    }, jumpFrameDuration)

    // Poll for flower collision during the jump (every 40 ms)
    let collisionFired = false
    const collisionChecker = setInterval(() => {
        if (collisionFired) return
        if (checkFlowerCollision()) {
            collisionFired = true
            clearInterval(collisionChecker)
            showRandomWish()
        }
    }, 40)

    // Reset jump state after animation completes
    setTimeout(() => {
        peanut.classList.remove('jumping')
        isJumping = false
        clearInterval(collisionChecker)
    }, 620)
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

    // Handle window resize to update film roll and flower strip
    let resizeTimer
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(() => {
            const filmRoll = document.getElementById('filmRoll')
            filmRoll.innerHTML = ''
            createFilmRoll()
            createFlowerStrip()
        }, 250)
    })
}
