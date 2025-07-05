// Undangan Pernikahan JavaScript - Maroon Art Theme
class MaroonArtInvitation {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 10;
        this.isPlaying = false;
        this.invitationOpened = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        
        this.init();
    }
    
    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupMusic();
        this.handleGuestName();
        this.showLoader();
        this.preloadImages();
        
        // Hide loader after 3 seconds
        setTimeout(() => {
            this.hideLoader();
        }, 3000);
    }
    
    setupElements() {
        // Main elements
        this.loader = document.getElementById('loader');
        this.music = document.getElementById('music');
        this.btnMusic = document.getElementById('btnMusic');
        this.canvas = document.querySelector('.canvas');
        this.satuMomen = document.getElementById('satuMomen');
        
        // Slides and navigation
        this.slides = document.querySelectorAll('.satumomen_slide');
        this.menu = document.getElementById('smMenu');
        this.menuItems = document.querySelectorAll('.satumomen_menu_item');
        
        // Buttons
        this.btnOpenInvitation = document.querySelector('.btn-open-invitation');
        this.btnRsvp = document.querySelector('.btn-rsvp');
        this.btnGift = document.querySelector('.btn-gift');
        
        // Modal elements
        this.rsvpModal = document.getElementById('rsvpModal');
        this.modalClose = document.querySelector('.modal-close');
        this.rsvpForm = document.getElementById('rsvpForm');
        
        // Gift elements
        this.giftContainer = document.querySelector('.gift-container');
        
        // Guest name
        this.guestNameSlot = document.getElementById('guestNameSlot');
    }
    
    setupEventListeners() {
        // Open invitation button
        if (this.btnOpenInvitation) {
            this.btnOpenInvitation.addEventListener('click', (e) => {
                e.preventDefault();
                this.openInvitation();
            });
        }
        
        // Music control
        if (this.btnMusic) {
            this.btnMusic.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMusic();
            });
        }
        
        // RSVP button
        if (this.btnRsvp) {
            this.btnRsvp.addEventListener('click', (e) => {
                e.preventDefault();
                this.openRsvpModal();
            });
        }
        
        // Gift button
        if (this.btnGift) {
            this.btnGift.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleGiftDetails();
            });
        }
        
        // Menu navigation
        this.menuItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.invitationOpened) {
                    this.goToSlide(index);
                    this.updateActiveMenuItem(index);
                }
            });
        });
        
        // Modal events
        if (this.modalClose) {
            this.modalClose.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeRsvpModal();
            });
        }
        
        // RSVP form submission
        if (this.rsvpForm) {
            this.rsvpForm.addEventListener('submit', (e) => {
                this.handleRsvpSubmission(e);
            });
        }
        
        // Close modal when clicking outside
        if (this.rsvpModal) {
            this.rsvpModal.addEventListener('click', (e) => {
                if (e.target === this.rsvpModal) {
                    this.closeRsvpModal();
                }
            });
        }
        
        // Touch events for swipe
        this.setupTouchEvents();
        
        // Keyboard events
        this.setupKeyboardEvents();
        
        // Window events
        this.setupWindowEvents();
        
        // Prevent context menu on images
        document.addEventListener('contextmenu', (e) => {
            if (e.target.tagName === 'IMG') {
                e.preventDefault();
            }
        });
    }
    
    setupTouchEvents() {
        const container = document.getElementById('workspace-container');
        if (!container) return;
        
        container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        container.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe();
        }, { passive: true });
    }
    
    handleSwipe() {
        const threshold = 50;
        const diff = this.touchStartX - this.touchEndX;
        
        if (Math.abs(diff) > threshold && this.invitationOpened) {
            if (diff > 0) {
                // Swipe left - next slide
                this.nextSlide();
            } else {
                // Swipe right - previous slide
                this.previousSlide();
            }
        }
    }
    
    setupKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.invitationOpened) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousSlide();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextSlide();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.closeRsvpModal();
                    break;
                case ' ':
                    e.preventDefault();
                    this.toggleMusic();
                    break;
            }
        });
    }
    
    setupWindowEvents() {
        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (this.isPlaying && this.music) {
                    this.music.pause();
                    this.wasPlayingBeforeHidden = true;
                }
            } else {
                if (this.wasPlayingBeforeHidden && this.music) {
                    this.playMusic();
                    this.wasPlayingBeforeHidden = false;
                }
            }
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.slide !== undefined) {
                this.goToSlide(e.state.slide);
                this.updateActiveMenuItem(e.state.slide);
            }
        });
        
        // Handle resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    setupMusic() {
        if (!this.music) return;
        
        this.music.volume = 0.3;
        this.music.loop = true;
        
        this.music.addEventListener('canplaythrough', () => {
            console.log('Music loaded successfully');
        });
        
        this.music.addEventListener('error', (e) => {
            console.log('Music failed to load:', e);
        });
        
        this.music.addEventListener('play', () => {
            this.isPlaying = true;
            this.updateMusicButton();
        });
        
        this.music.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updateMusicButton();
        });
    }
    
    handleGuestName() {
        // Get guest name from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const guestName = urlParams.get('to') || urlParams.get('guest') || 'Nama Tamu';
        
        if (this.guestNameSlot) {
            this.guestNameSlot.textContent = guestName;
        }
        
        // Update RSVP form if exists
        const rsvpNameInput = document.getElementById('rsvpName');
        if (rsvpNameInput && guestName !== 'Nama Tamu') {
            rsvpNameInput.value = guestName;
        }
        
        // Update data attribute
        if (this.satuMomen) {
            this.satuMomen.setAttribute('data-guest', guestName);
        }
    }
    
    showLoader() {
        if (this.loader) {
            this.loader.style.display = 'flex';
            this.loader.style.opacity = '1';
        }
    }
    
    hideLoader() {
        if (this.loader) {
            this.loader.style.opacity = '0';
            setTimeout(() => {
                this.loader.style.display = 'none';
            }, 500);
        }
    }
    
    openInvitation() {
        this.invitationOpened = true;
        
        // Remove not-open class from canvas
        if (this.canvas) {
            this.canvas.classList.remove('not-open');
        }
        
        // Show navigation menu
        this.showNavigationMenu();
        
        // Go to first slide after cover
        this.goToSlide(1);
        this.updateActiveMenuItem(1);
        
        // Start playing music
        setTimeout(() => {
            this.playMusic();
        }, 500);
        
        // Add body class for styling
        document.body.classList.add('invitation-opened');
        
        // Update URL
        this.updateURL(1);
    }
    
    showNavigationMenu() {
        if (this.menu) {
            this.menu.style.display = 'block';
            setTimeout(() => {
                this.menu.style.opacity = '1';
            }, 100);
        }
    }
    
    goToSlide(slideIndex) {
        if (slideIndex < 0 || slideIndex >= this.totalSlides) return;
        
        // Remove active class from current slide
        if (this.slides[this.currentSlide]) {
            this.slides[this.currentSlide].classList.remove('active');
        }
        
        // Set new current slide
        this.currentSlide = slideIndex;
        
        // Add active class to new slide
        if (this.slides[this.currentSlide]) {
            this.slides[this.currentSlide].classList.add('active');
        }
        
        // Trigger slide animations
        this.triggerSlideAnimations();
        
        // Update URL
        this.updateURL(slideIndex);
    }
    
    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
            this.updateActiveMenuItem(this.currentSlide);
        }
    }
    
    previousSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
            this.updateActiveMenuItem(this.currentSlide);
        }
    }
    
    updateActiveMenuItem(index) {
        // Remove active class from all menu items
        this.menuItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current menu item
        if (this.menuItems[index]) {
            this.menuItems[index].classList.add('active');
        }
    }
    
    triggerSlideAnimations() {
        const currentSlideElement = this.slides[this.currentSlide];
        if (!currentSlideElement) return;
        
        // Find all animated elements in current slide
        const animatedElements = currentSlideElement.querySelectorAll('[class*="animate__"]');
        
        // Reset and trigger animations
        animatedElements.forEach((element, index) => {
            const animationClasses = Array.from(element.classList).filter(cls => cls.startsWith('animate__'));
            
            // Remove animation classes
            animationClasses.forEach(cls => element.classList.remove(cls));
            
            // Re-add animation classes with delay
            setTimeout(() => {
                animationClasses.forEach(cls => element.classList.add(cls));
            }, index * 100);
        });
    }
    
    toggleMusic() {
        if (this.isPlaying) {
            this.pauseMusic();
        } else {
            this.playMusic();
        }
    }
    
    playMusic() {
        if (!this.music) return;
        
        const playPromise = this.music.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.updateMusicButton();
            }).catch(error => {
                console.log('Autoplay prevented:', error);
                this.isPlaying = false;
                this.updateMusicButton();
            });
        }
    }
    
    pauseMusic() {
        if (this.music) {
            this.music.pause();
            this.isPlaying = false;
            this.updateMusicButton();
        }
    }
    
    updateMusicButton() {
        if (!this.btnMusic) return;
        
        if (this.isPlaying) {
            this.btnMusic.classList.add('playing');
            this.btnMusic.title = 'Pause Music';
        } else {
            this.btnMusic.classList.remove('playing');
            this.btnMusic.title = 'Play Music';
        }
    }
    
    openRsvpModal() {
        if (this.rsvpModal) {
            this.rsvpModal.style.display = 'block';
            this.rsvpModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            setTimeout(() => {
                const firstInput = this.rsvpModal.querySelector('input, select, textarea');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 300);
        }
    }
    
    closeRsvpModal() {
        if (this.rsvpModal) {
            this.rsvpModal.classList.remove('show');
            setTimeout(() => {
                this.rsvpModal.style.display = 'none';
                document.body.style.overflow = '';
            }, 150);
        }
    }
    
    handleRsvpSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(this.rsvpForm);
        const rsvpData = {
            name: document.getElementById('rsvpName')?.value || '',
            attendance: document.getElementById('rsvpAttendance')?.value || '',
            guests: document.getElementById('rsvpGuests')?.value || 1,
            message: document.getElementById('rsvpMessage')?.value || '',
            timestamp: new Date().toISOString()
        };
        
        // Validate required fields
        if (!rsvpData.name || !rsvpData.attendance) {
            this.showNotification('Mohon lengkapi semua field yang wajib diisi', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = this.rsvpForm.querySelector('.btn-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Mengirim...';
        submitBtn.disabled = true;
        
        // Simulate form submission
        setTimeout(() => {
            this.processRsvpSubmission(rsvpData);
            submitBtn.textContent = 'Terkirim!';
            
            setTimeout(() => {
                this.closeRsvpModal();
                this.showThankYouMessage();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                this.rsvpForm.reset();
            }, 1000);
        }, 1500);
    }
    
    processRsvpSubmission(data) {
        // Store in localStorage for demo purposes
        try {
            const existingRsvps = JSON.parse(localStorage.getItem('wedding_rsvps') || '[]');
            existingRsvps.push(data);
            localStorage.setItem('wedding_rsvps', JSON.stringify(existingRsvps));
            console.log('RSVP submitted:', data);
        } catch (error) {
            console.error('Error saving RSVP:', error);
        }
    }
    
    showThankYouMessage() {
        this.showNotification('Terima kasih! Konfirmasi kehadiran Anda telah terkirim.', 'success');
    }
    
    toggleGiftDetails() {
        if (!this.giftContainer) return;
        
        const isVisible = this.giftContainer.style.display === 'block';
        
        if (isVisible) {
            this.giftContainer.style.display = 'none';
            this.giftContainer.classList.remove('show');
            if (this.btnGift) {
                this.btnGift.textContent = '💰 Cashless';
            }
        } else {
            this.giftContainer.style.display = 'block';
            this.giftContainer.classList.add('show');
            if (this.btnGift) {
                this.btnGift.textContent = '❌ Tutup';
            }
        }
    }
    
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notif => notif.remove());
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : 'var(--inv-accent)'};
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            z-index: 3000;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            animation: slideInDown 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.3s ease-in';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    updateURL(slideIndex) {
        const urlParams = new URLSearchParams(window.location.search);
        const guestParam = urlParams.get('to') || urlParams.get('guest');
        
        let newUrl = `${window.location.pathname}`;
        const params = new URLSearchParams();
        
        if (slideIndex > 0) {
            params.set('slide', slideIndex.toString());
        }
        
        if (guestParam) {
            params.set('to', guestParam);
        }
        
        if (params.toString()) {
            newUrl += '?' + params.toString();
        }
        
        history.pushState({ slide: slideIndex }, '', newUrl);
    }
    
    handleResize() {
        // Handle responsive adjustments if needed
        const width = window.innerWidth;
        if (width < 480) {
            // Mobile adjustments
            document.body.classList.add('mobile-view');
        } else {
            document.body.classList.remove('mobile-view');
        }
    }
    
    preloadImages() {
        const imageUrls = [
            'media/bg.webp',
            'media/tl.webp',
            'media/tr.webp',
            'media/bm.webp',
            'media/bl-2.webp',
            'media/br-2.webp',
            'media/gunungan.webp',
            'media/tl-2.webp',
            'media/tr-2.webp',
            'media/bl-1.webp',
            'media/bl-3.webp',
            'media/br-1.webp',
            'media/br-3.webp',
            'media/sinta.webp',
            'media/rama.webp',
            'media/27897-gallery-1672939613.png',
            'media/301467-gallery-rNpYuhv9jd.png',
            'media/301467-gallery-FMgCPTNp2h.png',
            'media/female-1-1687991981.webp',
            'media/male-1-1687991959.webp',
            'media/bca-logo.png',
            'media/mandiri-logo.png'
        ];
        
        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }
    
    // Initialize from URL parameters
    initFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const slideParam = urlParams.get('slide');
        
        if (slideParam) {
            const slideIndex = parseInt(slideParam);
            if (!isNaN(slideIndex) && slideIndex > 0 && slideIndex < this.totalSlides) {
                // Auto-open invitation and go to specific slide
                setTimeout(() => {
                    this.openInvitation();
                    setTimeout(() => {
                        this.goToSlide(slideIndex);
                        this.updateActiveMenuItem(slideIndex);
                    }, 500);
                }, 1000);
            }
        }
    }
    
    // Performance monitoring
    measurePerformance() {
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
                console.log(`Page load time: ${loadTime}ms`);
                
                // Track performance
                this.trackEvent('performance', {
                    load_time: loadTime,
                    user_agent: navigator.userAgent
                });
            });
        }
    }
    
    // Analytics tracking
    trackEvent(eventName, eventData = {}) {
        // Replace with actual analytics implementation
        console.log('Event tracked:', eventName, eventData);
        
        // Example for Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
    }
    
    // Error handling
    handleError(error, context = '') {
        console.error('Error in MaroonArtInvitation:', context, error);
        
        // Track errors
        this.trackEvent('error', {
            message: error.message,
            context: context,
            user_agent: navigator.userAgent
        });
    }
}

// Utility functions
function addAnimationStyles() {
    if (document.getElementById('animation-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'animation-styles';
    style.textContent = `
        @keyframes slideInDown {
            from {
                transform: translate(-50%, -100%);
                opacity: 0;
            }
            to {
                transform: translate(-50%, 0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutUp {
            from {
                transform: translate(-50%, 0);
                opacity: 1;
            }
            to {
                transform: translate(-50%, -100%);
                opacity: 0;
            }
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .ripple-effect {
            position: relative;
            overflow: hidden;
        }
        
        .ripple-effect::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.4);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
        }
        
        .ripple-effect:active::before {
            width: 300px;
            height: 300px;
        }
    `;
    document.head.appendChild(style);
}

function addRippleEffect() {
    const buttons = document.querySelectorAll('button, .btn, .satumomen_menu_item');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
                z-index: 1;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// Lazy loading implementation
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => imageObserver.observe(img));
    }
}

// Social sharing functionality
function setupSocialSharing() {
    const shareData = {
        title: 'Undangan Pernikahan - Maroon Art',
        text: 'Kami mengundang Anda untuk hadir di pernikahan kami',
        url: window.location.href
    };
    
    if (navigator.share) {
        // Create share button if Web Share API is supported
        const shareButton = document.createElement('button');
        shareButton.className = 'btn-float';
        shareButton.innerHTML = `
            <svg width="28" height="28" fill="currentColor" viewBox="0 0 256 256">
                <path d="M229.66,109.66l-48,48a8,8,0,0,1-11.32-11.32L204.69,112H165a88,88,0,0,0-85.23,66,8,8,0,0,1-15.5-4A103.94,103.94,0,0,1,165,96h39.71L170.34,61.66a8,8,0,0,1,11.32-11.32l48,48A8,8,0,0,1,229.66,109.66Z"/>
            </svg>
        `;
        shareButton.title = 'Bagikan Undangan';
        
        shareButton.addEventListener('click', async () => {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing:', err);
            }
        });
        
        const floatingActions = document.querySelector('.floating-action');
        if (floatingActions) {
            floatingActions.insertBefore(shareButton, floatingActions.firstChild);
        }
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Add animation styles
        addAnimationStyles();
        
        // Create main app instance
        const app = new MaroonArtInvitation();
        
        // Initialize additional features
        addRippleEffect();
        setupLazyLoading();
        setupSocialSharing();
        
        // Initialize from URL if needed
        app.initFromURL();
        
        // Start performance monitoring
        app.measurePerformance();
        
        // Track page view
        app.trackEvent('page_view', {
            page_title: document.title,
            page_location: window.location.href,
            user_agent: navigator.userAgent
        });
        
        // Make app globally accessible for debugging
        window.maroonArtApp = app;
        
        console.log('Maroon Art Wedding Invitation initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize wedding invitation:', error);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.maroonArtApp && window.maroonArtApp.music) {
        window.maroonArtApp.music.pause();
    }
});

// Prevent zoom on mobile devices
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
});

document.addEventListener('gestureend', function(e) {
    e.preventDefault();
});

// Disable pinch zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Handle double-tap zoom
document.addEventListener('touchmove', function(e) {
    if (e.scale !== 1) {
        e.preventDefault();
    }
}, { passive: false });

// Service Worker registration (if needed)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}