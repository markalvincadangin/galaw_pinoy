// Game elements
let video, canvas, ctx;
let statusText, timerText, startBtn, actionBtn, selectionSection, gameSection;

// Game state
let detector = null;
let gameRunning = false;
let startTime = 0;
let elapsed = 0;
let speed = 4000;
let zoneTimeout = null;
let killZones = [];
let positionOffset = 0;

// Initialize elements
function initElements() {
  video = document.getElementById("video");
  canvas = document.getElementById("overlay");
  if (canvas) {
    ctx = canvas.getContext("2d");
  }
  statusText = document.getElementById("status");
  timerText = document.getElementById("timer");
  startBtn = document.getElementById("patinteroStartBtn");
  actionBtn = document.getElementById("patinteroActionBtn");
  selectionSection = document.getElementById("patintero-selection");
  gameSection = document.getElementById("game-section");
  
  console.log('Patintero elements initialized:', {
    video: !!video,
    canvas: !!canvas,
    startBtn: !!startBtn,
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

// Load detector
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

// Start game handler
async function handleStartGame() {
  try {
    console.log('=== STARTING PATINTERO ===');
    
    if (!selectionSection || !gameSection || !statusText) {
      throw new Error('Game elements not found');
    }
    
    selectionSection.style.display = "none";
    gameSection.style.display = "block";
    document.body.classList.add("game-active");
    document.body.style.overflow = "hidden";
    
    statusText.textContent = "Initializing camera...";
    await setupCamera();
    
    statusText.textContent = "Loading pose detection...";
    await loadDetector();
    
    statusText.textContent = "Step back. Full body must be visible.";
    waitForFullBody();
    
  } catch (error) {
    console.error('Start error:', error);
    if (statusText) statusText.textContent = "Error: " + error.message;
    alert("Error: " + error.message);
    
    if (selectionSection) selectionSection.style.display = "block";
    if (gameSection) gameSection.style.display = "none";
    document.body.classList.remove("game-active");
    document.body.style.overflow = "";
  }
}

// Wait for full body
async function waitForFullBody() {
  if (!detector || !video || !canvas) {
    requestAnimationFrame(waitForFullBody);
    return;
  }
  
  try {
    const poses = await detector.estimatePoses(video);
    drawPoseIndicator(poses);
    
    if (poses.length === 0) {
      requestAnimationFrame(waitForFullBody);
      return;
    }

    const kp = poses[0].keypoints;
    const leftShoulder = kp.find(k => k.name === "left_shoulder");
    const rightShoulder = kp.find(k => k.name === "right_shoulder");
    const ankle = kp.find(k => k.name === "left_ankle");

    if (!leftShoulder || !rightShoulder || !ankle) {
      requestAnimationFrame(waitForFullBody);
      return;
    }

    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    if (ankle.y - shoulderY > canvas.height * 0.5) {
      startCountdown();
    } else {
      requestAnimationFrame(waitForFullBody);
    }
  } catch (error) {
    console.error('Wait error:', error);
    requestAnimationFrame(waitForFullBody);
  }
}

// Countdown
function startCountdown() {
  if (!statusText) return;
  
  let count = 5;
  statusText.textContent = `Starting in ${count}...`;

  const cd = setInterval(() => {
    count--;
    if (count > 0) {
      if (statusText) statusText.textContent = `Starting in ${count}...`;
    } else {
      clearInterval(cd);
      startGame();
    }
  }, 1000);
}

// Start game
function startGame() {
  if (!statusText || !timerText) return;
  
  gameRunning = true;
  startTime = Date.now();
  statusText.textContent = "SURVIVE!";
  loop();
  spawnZones();
}

// Game loop
async function loop() {
  if (!gameRunning) return;

  try {
    if (!detector || !video || !canvas || !ctx) {
      requestAnimationFrame(loop);
      return;
    }

    const poses = await detector.estimatePoses(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoseIndicator(poses);

    elapsed = Math.floor((Date.now() - startTime) / 1000);
    if (timerText) timerText.textContent = elapsed;
  } catch (error) {
    console.error('Loop error:', error);
  }

  requestAnimationFrame(loop);
}

// Draw pose indicator
function drawPoseIndicator(poses) {
  if (!ctx || !canvas) return;
  
  if (poses && poses.length > 0) {
    const kp = poses[0].keypoints;
    const leftShoulder = kp.find(k => k.name === "left_shoulder");
    const rightShoulder = kp.find(k => k.name === "right_shoulder");
    const nose = kp.find(k => k.name === "nose");

    let centerX, centerY;
    if (leftShoulder && rightShoulder) {
      centerX = (leftShoulder.x + rightShoulder.x) / 2;
      centerY = (leftShoulder.y + rightShoulder.y) / 2;
    } else if (nose) {
      centerX = nose.x;
      centerY = nose.y;
    } else {
      return;
    }

    const adjustedX = centerX + positionOffset;
    const dotRadius = 15;

    ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
    ctx.beginPath();
    ctx.arc(adjustedX, centerY, dotRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(adjustedX - 20, centerY);
    ctx.lineTo(adjustedX + 20, centerY);
    ctx.moveTo(adjustedX, centerY - 20);
    ctx.lineTo(adjustedX, centerY + 20);
    ctx.stroke();

    if (gameRunning) {
      const canvasRect = canvas.getBoundingClientRect();
      for (const zone of killZones) {
        if (!zone || !zone.parentElement) continue;
        
        const rect = zone.getBoundingClientRect();
        const left = rect.left - canvasRect.left;
        const top = rect.top - canvasRect.top;
        const width = rect.width;
        const height = rect.height;

        ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.strokeRect(left, top, width, height);

        if (rect.height >= canvas.height * 0.95) {
          checkCollision(adjustedX, centerY, dotRadius);
        }
      }
    }
  }
}

// Spawn zones
function spawnZones() {
  if (!gameRunning) return;

  clearZones();

  const thirds = [
    { left: 0, width: window.innerWidth / 3 },
    { left: window.innerWidth / 3, width: window.innerWidth / 3 },
    { left: (window.innerWidth / 3) * 2, width: window.innerWidth / 3 }
  ];

  const safeIndex = Math.floor(Math.random() * 3);

  thirds.forEach((zone, i) => {
    if (i !== safeIndex) {
      const div = document.createElement("div");
      div.className = "kill-zone";
      div.style.left = zone.left + "px";
      div.style.width = zone.width + "px";
      div.style.animationDuration = speed + "ms";
      div.style.position = "absolute";
      div.style.bottom = "0";
      
      if (gameSection) {
        gameSection.appendChild(div);
      }
      killZones.push(div);
    }
  });

  speed = Math.max(400, speed - 120);
  zoneTimeout = setTimeout(spawnZones, speed + 800);
}

// Clear zones
function clearZones() {
  killZones.forEach(z => {
    if (z && z.parentElement) {
      z.remove();
    }
  });
  killZones = [];
}

// Check collision
function checkCollision(x, y, dotRadius) {
  if (!canvas || killZones.length === 0) return;
  
  const canvasRect = canvas.getBoundingClientRect();
  for (const zone of killZones) {
    if (!zone || !zone.parentElement) continue;
    
    const rect = zone.getBoundingClientRect();
    const left = rect.left - canvasRect.left;
    const top = rect.top - canvasRect.top;
    const right = left + rect.width;
    const bottom = top + rect.height;

    if (rect.height < canvas.height * 0.95) continue;

    const inHorizontal = x >= (left + dotRadius) && x <= (right - dotRadius);
    const inVertical = y >= (top + dotRadius) && y <= (bottom - dotRadius);

    if (inHorizontal && inVertical) {
      endGame();
      break;
    }
  }
}

// End game
function endGame() {
  gameRunning = false;
  if (zoneTimeout) clearTimeout(zoneTimeout);
  clearZones();

  if (statusText) {
    statusText.textContent = `CAUGHT! Time Survived: ${elapsed}s`;
  }

  if (video && video.srcObject) {
    const tracks = video.srcObject.getTracks();
    tracks.forEach(track => track.stop());
  }

  setTimeout(() => {
    document.body.classList.remove("game-active");
    document.body.style.overflow = "";
    location.reload();
  }, 3000);
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
  
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleStartGame();
    });
  }
}

// Run initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
