let timerInterval = null;
let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let isRunning = false;
let currentMode = 'focus';
let isEditingTimer = false;
let wakeLock = null;

const timerDisplay = document.getElementById('timerDisplay');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const presetOptions = document.querySelectorAll('.preset-option');
const modeBtns = document.querySelectorAll('.mode-btn');

function updateDisplay() {
    if (!isEditingTimer) {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Handle custom time input
timerDisplay.addEventListener('focus', () => {
    if (!isRunning) {
        isEditingTimer = true;
        timerDisplay.classList.add('editing');
        // Select all text for easy editing
        const range = document.createRange();
        range.selectNodeContents(timerDisplay);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
});

timerDisplay.addEventListener('blur', () => {
    isEditingTimer = false;
    timerDisplay.classList.remove('editing');
    parseCustomTime();
});

timerDisplay.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        timerDisplay.blur();
    }
    // Only allow numbers, colon, and control keys
    if (!/[\d:]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
        e.preventDefault();
    }
});

timerDisplay.addEventListener('input', () => {
    // Limit input length
    if (timerDisplay.textContent.length > 5) {
        timerDisplay.textContent = timerDisplay.textContent.substring(0, 5);
        // Move cursor to end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(timerDisplay);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
});

function parseCustomTime() {
    const input = timerDisplay.textContent.trim();
    const parts = input.split(':');
    
    let minutes = 0;
    let seconds = 0;

    if (parts.length === 2) {
        minutes = parseInt(parts[0]) || 0;
        seconds = parseInt(parts[1]) || 0;
    } else if (parts.length === 1) {
        minutes = parseInt(parts[0]) || 0;
    }

    // Validate and cap the values
    minutes = Math.max(0, Math.min(999, minutes));
    seconds = Math.max(0, Math.min(59, seconds));

    totalSeconds = (minutes * 60) + seconds;
    remainingSeconds = totalSeconds;

    // Update display with formatted time
    updateDisplay();

    // Clear preset selections
    presetOptions.forEach(opt => {
        opt.querySelector('.preset-checkbox').checked = false;
        opt.classList.remove('selected');
    });
}

// Wake Lock functions
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock acquired - screen will stay awake');
            
            // Re-acquire wake lock if it's released (e.g., tab visibility change)
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released');
            });
        }
    } catch (err) {
        console.log('Wake Lock error:', err);
    }
}

async function releaseWakeLock() {
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
            wakeLock = null;
            console.log('Wake Lock released - screen can sleep');
        } catch (err) {
            console.log('Wake Lock release error:', err);
        }
    }
}

function startTimer() {
    if (isRunning) return;
    
    // Prevent editing while running
    timerDisplay.contentEditable = 'false';
    timerDisplay.style.cursor = 'default';
    
    isRunning = true;
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'inline-block';

    // Request wake lock to keep screen awake
    requestWakeLock();

    timerInterval = setInterval(() => {
        if (remainingSeconds > 0) {
            remainingSeconds--;
            updateDisplay();
        } else {
            stopTimer();
            playSound();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    
    // Re-enable editing
    timerDisplay.contentEditable = 'true';
    timerDisplay.style.cursor = 'pointer';
    
    // Release wake lock when paused
    releaseWakeLock();
}

function stopTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
    
    // Re-enable editing
    timerDisplay.contentEditable = 'true';
    timerDisplay.style.cursor = 'pointer';
    
    // Release wake lock when stopped
    releaseWakeLock();
}

function resetTimer() {
    stopTimer();
    remainingSeconds = totalSeconds;
    updateDisplay();
}

function playSound() {
    // Audio notification when timer completes
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi+D0fPTgjMGHm7A7+OZUQ0PVqzn7K1aHQs9mNr0zHksB');
    audio.play().catch(() => {});
}

// Preset selection
presetOptions.forEach(option => {
    const checkbox = option.querySelector('.preset-checkbox');
    
    option.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
            checkbox.checked = !checkbox.checked;
        }
        
        // Uncheck other presets
        presetOptions.forEach(opt => {
            if (opt !== option) {
                opt.querySelector('.preset-checkbox').checked = false;
                opt.classList.remove('selected');
            }
        });

        if (checkbox.checked) {
            option.classList.add('selected');
            const minutes = parseInt(option.dataset.minutes);
            totalSeconds = minutes * 60;
            remainingSeconds = totalSeconds;
            updateDisplay();
            resetTimer();
        } else {
            option.classList.remove('selected');
        }
    });
});

// Mode selection
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        
        // Reset timer when changing modes
        resetTimer();
        
        // Clear preset selections
        presetOptions.forEach(opt => {
            opt.querySelector('.preset-checkbox').checked = false;
            opt.classList.remove('selected');
        });
        
        // Set default times based on mode
        if (currentMode === 'focus') {
            totalSeconds = 25 * 60;
        } else if (currentMode === 'short-break') {
            totalSeconds = 5 * 60;
        } else {
            totalSeconds = 15 * 60;
        }
        
        remainingSeconds = totalSeconds;
        updateDisplay();
    });
});

// Control buttons
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    } else if (e.code === 'Escape') {
        resetTimer();
    }
});

// Initialize
updateDisplay();

// Re-acquire wake lock when page becomes visible again (if timer is running)
document.addEventListener('visibilitychange', async () => {
    if (!document.hidden && isRunning && wakeLock === null) {
        await requestWakeLock();
    }
});

// ===== YouTube Player Functionality =====
let player;
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;
let isVideoVisible = true;

const youtubeContainer = document.getElementById('youtubeContainer');
const youtubeHeader = document.getElementById('youtubeHeader');
const youtubeContent = document.getElementById('youtubeContent');
const youtubeSearch = document.getElementById('youtubeSearch');
const toggleVideoBtn = document.getElementById('toggleVideoBtn');
const closeYoutubeBtn = document.getElementById('closeYoutubeBtn');
const youtubeToggle = document.getElementById('youtubeToggle');

// YouTube toggle button functionality
youtubeToggle.addEventListener('click', () => {
    if (youtubeContainer.style.display === 'none') {
        youtubeContainer.style.display = 'block';
        youtubeToggle.classList.add('active');
    } else {
        youtubeContainer.style.display = 'none';
        youtubeToggle.classList.remove('active');
        if (player && player.pauseVideo) {
            player.pauseVideo();
        }
    }
});

// Start with YouTube player visible and toggle button active
youtubeToggle.classList.add('active');

// YouTube API ready callback
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '225',
        width: '400',
        videoId: 'Jvgx5HHJ0qw', // Default: Gentle Rain Sounds
        playerVars: {
            'autoplay': 0,
            'controls': 1,
            'modestbranding': 1,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady(event) {
    console.log('YouTube player ready');
}

// Extract video ID from YouTube URL or use direct ID
function extractVideoId(input) {
    if (!input) return null;
    
    // Remove any whitespace
    input = input.trim();
    
    const patterns = [
        // Standard watch URL
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
        // Shortened youtu.be URL
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        // Embed URL
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        // Direct video ID (11 characters)
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (let pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[1]) {
            console.log('Extracted video ID:', match[1]);
            return match[1];
        }
    }
    
    console.log('Could not extract video ID from:', input);
    return null;
}

// Load video from search input
youtubeSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const input = youtubeSearch.value.trim();
        const videoId = extractVideoId(input);
        
        if (videoId) {
            if (player && typeof player.loadVideoById === 'function') {
                player.loadVideoById(videoId);
                youtubeSearch.value = '';
            } else {
                // If player isn't ready, recreate it with new video
                console.log('Loading video:', videoId);
                const playerElement = document.getElementById('player');
                playerElement.innerHTML = '';
                player = new YT.Player('player', {
                    height: '225',
                    width: '400',
                    videoId: videoId,
                    playerVars: {
                        'autoplay': 1,
                        'controls': 1,
                        'modestbranding': 1,
                        'rel': 0
                    }
                });
                youtubeSearch.value = '';
            }
        } else {
            alert('Please enter a valid YouTube URL or video ID\n\nExamples:\n- https://www.youtube.com/watch?v=jfKfPfyJRdk\n- https://youtu.be/jfKfPfyJRdk\n- jfKfPfyJRdk');
        }
    }
});

// Toggle video visibility
toggleVideoBtn.addEventListener('click', () => {
    isVideoVisible = !isVideoVisible;
    
    if (isVideoVisible) {
        youtubeContent.classList.remove('hidden');
        toggleVideoBtn.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
            </svg>
        `;
    } else {
        youtubeContent.classList.add('hidden');
        toggleVideoBtn.innerHTML = `
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
            </svg>
        `;
    }
});

// Close YouTube player
closeYoutubeBtn.addEventListener('click', () => {
    youtubeContainer.style.display = 'none';
    youtubeToggle.classList.remove('active');
    if (player && player.pauseVideo) {
        player.pauseVideo();
    }
});

// Drag functionality
youtubeHeader.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

// Touch events for mobile
youtubeHeader.addEventListener('touchstart', dragStart);
document.addEventListener('touchmove', drag);
document.addEventListener('touchend', dragEnd);

function dragStart(e) {
    if (e.type === "touchstart") {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
    } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }

    if (e.target === youtubeHeader || youtubeHeader.contains(e.target)) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();

        if (e.type === "touchmove") {
            currentX = e.touches[0].clientX - initialX;
            currentY = e.touches[0].clientY - initialY;
        } else {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, youtubeContainer);
    }
}

function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
}

// Make onYouTubeIframeAPIReady global
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
