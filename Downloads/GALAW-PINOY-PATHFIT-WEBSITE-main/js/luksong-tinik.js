// Game elements
let video, canvas, ctx;
let statusText, scoreText, levelText, timerText, gameSection, actionBtn;

// Game state
let detector = null;
let score = 0;
let level = 0;
let hurdleY = 0;
let gameState = "idle"; // idle | ready | countdown | playing | paused | over
let cooldown = false;
let timer = 60;
let timerInterval = null;
const maxLevels = 5;
let poseDetectionRunning = false;

// Initialize elements
function initElements() {
  video = document.getElementById("video");
  canvas = document.getElementById("overlay");
  if (canvas) {
    ctx = canvas.getContext("2d");
  }
  statusText = document.getElementById("game-status");
  scoreText = document.getElementById("score");
  levelText = document.getElementById("level");
  timerText = document.getElementById("timer");
  gameSection = document.getElementById("game-section");
  actionBtn = document.getElementById("action-btn");
  
  console.log('Elements initialized:', {
    video: !!video,
    canvas: !!canvas,
    ctx: !!ctx,
    statusText: !!statusText,
    gameSection: !!gameSection
  });
}

// Setup camera
async function setupCamera() {
  if (!video) throw new Error('Video element not found');
  
  try {
    console.log('Requesting camera...');
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' } 
    });
    
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    
    return new Promise((resolve, reject) => {
      const onLoaded = () => {
        console.log('Video loaded');
        resizeCanvas();
        video.play()
          .then(() => {
            console.log('Video playing');
            resolve();
          })
          .catch(reject);
      };
      
      if (video.readyState >= 2) {
        onLoaded();
      } else {
        video.addEventListener('loadedmetadata', onLoaded, { once: true });
        video.addEventListener('error', () => reject(new Error('Video error')), { once: true });
      }
      
      setTimeout(() => {
        if (video.readyState < 2) {
          reject(new Error('Video timeout'));
        }
      }, 10000);
    });
  } catch (error) {
    console.error('Camera error:', error);
    if (error.name === 'NotAllowedError') {
      throw new Error('Camera access denied. Please allow camera and refresh.');
    }
    throw new Error('Camera error: ' + error.message);
  }
}

// Resize canvas
function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// Load pose detector
async function loadDetector() {
  if (!window.poseDetection) {
    throw new Error('Pose detection library not loaded. Please refresh.');
  }
  
  try {
    console.log('Loading detector...');
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
    );
    console.log('Detector loaded');
  } catch (error) {
    console.error('Detector error:', error);
    throw new Error('Failed to load pose detection. Please refresh.');
  }
}

// Start game
async function startGame() {
  try {
    console.log('=== STARTING GAME ===');
    
    const gameSelection = document.getElementById("game-selection");
    if (gameSelection) gameSelection.style.display = "none";
    if (gameSection) {
      gameSection.style.display = "block";
      document.body.classList.add('game-active');
      document.body.style.overflow = 'hidden';
    }

    // Reset game state
    score = 0;
    level = 0;
    hurdleY = 0;
    gameState = "ready";
    cooldown = false;
    timer = 60;
    
    if (scoreText) scoreText.textContent = score;
    if (levelText) levelText.textContent = level;
    if (timerText) timerText.textContent = timer;
    if (statusText) statusText.textContent = "Initializing camera...";
    if (actionBtn) actionBtn.style.display = "none";

    // Setup camera
    await setupCamera();
    if (statusText) statusText.textContent = "Loading pose detection...";
    
    // Load detector
    await loadDetector();
    
    if (statusText) statusText.textContent = "Step back. Full body must be visible.";
    if (actionBtn) {
      actionBtn.style.display = "block";
      actionBtn.textContent = "START";
    }
    
    // Start pose detection
    console.log('Starting pose detection loop');
    poseDetectionRunning = true;
    detectPose();
    
  } catch (error) {
    console.error('Game start error:', error);
    if (statusText) statusText.textContent = "Error: " + error.message;
    alert("Error: " + error.message);
    
    // Reset UI
    const gameSelection = document.getElementById("game-selection");
    if (gameSelection) gameSelection.style.display = "block";
    if (gameSection) gameSection.style.display = "none";
    document.body.classList.remove('game-active');
    document.body.style.overflow = '';
  }
}

// Handle action button
function handleAction() {
  if (gameState === "ready" || gameState === "paused") {
    startCountdown();
  }
}

// Countdown
function startCountdown() {
  gameState = "countdown";
  if (actionBtn) actionBtn.style.display = "none";

  let count = 3;
  if (statusText) statusText.textContent = `Starting in ${count}...`;

  const timerCount = setInterval(() => {
    count--;
    if (count > 0) {
      if (statusText) statusText.textContent = `Starting in ${count}...`;
    } else {
      clearInterval(timerCount);
      startLevel();
    }
  }, 1000);
}

// Start level
function startLevel() {
  gameState = "playing";
  if (statusText) statusText.textContent = "JUMP!";
  cooldown = false;

  if (level === 0 && canvas) {
    hurdleY = canvas.height * 0.8;
  }

  startGameTimer();
}

// Game timer
function startGameTimer() {
  timer = 60;
  if (timerText) timerText.textContent = timer;
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timer--;
    if (timerText) timerText.textContent = timer;
    if (timer <= 0) endGame();
  }, 1000);
}

// Pose detection loop
async function detectPose() {
  if (!poseDetectionRunning) return;
  
  if (!detector || !video || !canvas || !ctx) {
    requestAnimationFrame(detectPose);
    return;
  }

  try {
    if (video.readyState < 2) {
      requestAnimationFrame(detectPose);
      return;
    }

    const poses = await detector.estimatePoses(video);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "playing" || gameState === "paused") {
      drawHurdle();
    }

    if (poses.length > 0 && gameState === "playing") {
      const keypoints = poses[0].keypoints;
      checkJump(keypoints);
      drawKneeIndicators(keypoints);
    }
  } catch (error) {
    console.error('Pose error:', error);
  }

  requestAnimationFrame(detectPose);
}

// Check jump
function checkJump(keypoints) {
  if (cooldown) return;

  const leftKnee = keypoints.find(k => k.name === "left_knee");
  const rightKnee = keypoints.find(k => k.name === "right_knee");
  const nose = keypoints.find(k => k.name === "nose");

  if (!leftKnee || !rightKnee || !nose) return;

  const kneesAbove = leftKnee.y < hurdleY && rightKnee.y < hurdleY;
  const torsoAbove = nose.y < hurdleY - 40;

  if (kneesAbove && torsoAbove) {
    levelClear();
  } else if (nose.y > hurdleY + 80) {
    endGame();
  }
}

// Level clear
function levelClear() {
  cooldown = true;
  score++;
  level++;
  if (scoreText) scoreText.textContent = score;
  if (levelText) levelText.textContent = level;

  if (level >= maxLevels) {
    endGame();
    return;
  }

  if (statusText) statusText.textContent = "Level Cleared! Press CONTINUE";
  gameState = "paused";
  if (actionBtn) {
    actionBtn.style.display = "block";
    actionBtn.textContent = "CONTINUE";
  }

  hurdleY -= 100;
  if (canvas) {
    const minHeight = canvas.height * 0.25;
    if (hurdleY < minHeight) hurdleY = minHeight;
  }

  setTimeout(() => { cooldown = false; }, 500);
}

// Draw hurdle
function drawHurdle() {
  if (!ctx || !canvas) return;
  
  ctx.beginPath();
  ctx.moveTo(0, hurdleY);
  ctx.lineTo(canvas.width, hurdleY);
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 6;
  ctx.stroke();
}

// Draw knee indicators
function drawKneeIndicators(keypoints) {
  if (!ctx || !keypoints) return;
  
  const leftKnee = keypoints.find(k => k.name === "left_knee");
  const rightKnee = keypoints.find(k => k.name === "right_knee");
  if (!leftKnee || !rightKnee) return;

  [leftKnee, rightKnee].forEach(knee => {
    ctx.beginPath();
    ctx.moveTo(knee.x, knee.y);
    ctx.lineTo(knee.x, hurdleY);
    ctx.strokeStyle = "rgba(0, 255, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(knee.x, knee.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#00ff00";
    ctx.fill();
    
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

// End game
function endGame() {
  gameState = "over";
  poseDetectionRunning = false;
  if (statusText) statusText.textContent = "Game Over!";
  if (actionBtn) actionBtn.style.display = "none";
  if (timerInterval) clearInterval(timerInterval);

  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
  }

  setTimeout(() => {
    document.body.classList.remove("game-active");
    document.body.style.overflow = "";
    alert(`Game Over!\nScore: ${score}\nLevel: ${level}`);
    location.reload();
  }, 800);
}

// Window resize
window.addEventListener('resize', () => {
  if (gameSection && gameSection.style.display === 'block') {
    resizeCanvas();
  }
});

// Initialize
function initialize() {
  initElements();
  
  if (!video || !canvas || !ctx) {
    console.error('Missing game elements');
    return;
  }
  
  if (gameSection) {
    gameSection.style.display = 'none';
  }
  
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      startGame();
    });
  }
}

// Make functions global
window.startGame = startGame;
window.handleAction = handleAction;

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
