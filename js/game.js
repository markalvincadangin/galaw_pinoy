import * as poseDetection from "https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection";
import * as tf from "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("game-status");
const scoreText = document.getElementById("score");
const gameTitle = document.getElementById("game-title");
const gameSection = document.getElementById("game-section");

let detector;
let currentGame = null;
let baselineY = null;
let score = 0;

// Setup webcam
async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise(resolve => {
      video.onloadedmetadata = () => resolve(video);
    });
  } catch (err) {
    console.error("Webcam access denied:", err);
    statusText.textContent = "Error accessing webcam. Allow camera to play.";
  }
}

// Load pose detector
async function loadDetector() {
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: "lightning" }
  );
}

// Start selected game
export async function startGame(game) {
  currentGame = game;
  baselineY = null; // Reset baseline for each game
  score = 0;
  scoreText.textContent = score;

  gameSection.style.display = "block";
  gameTitle.textContent = game.replace(/([A-Z])/g, ' $1').trim();
  statusText.textContent = "Get ready!";

  await setupCamera();
  video.play();

  if (!detector) await loadDetector();
  detectPose();
}

// Detect pose continuously
async function detectPose() {
  if (!detector) return;

  const poses = await detector.estimatePoses(video);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (poses.length > 0) {
    const keypoints = poses[0].keypoints;
    drawKeypoints(keypoints);

    if (currentGame === "luksongBaka" || currentGame === "luksongTinik") {
      handleJump(keypoints);
    } else if (currentGame === "patintero") {
      handleSideStep(keypoints);
    } else if (currentGame === "piko") {
      handleHop(keypoints);
    }
  }

  requestAnimationFrame(detectPose);
}

// Draw keypoints
function drawKeypoints(keypoints) {
  keypoints.forEach(kp => {
    ctx.beginPath();
    ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
  });
}

// Game detection logic
function handleJump(keypoints) {
  const nose = keypoints.find(k => k.name === "nose");
  if (!nose) return;

  if (!baselineY) baselineY = nose.y;

  if (baselineY - nose.y > 60) {
    score++;
    scoreText.textContent = score;
    statusText.textContent = "Jump detected!";
    baselineY = nose.y;
  }
}

function handleSideStep(keypoints) {
  const hip = keypoints.find(k => k.name === "left_hip");
  if (!hip) return;

  if (hip.x < canvas.width / 3) {
    statusText.textContent = "Move Left!";
    score++;
    scoreText.textContent = score;
  } else if (hip.x > canvas.width * 2 / 3) {
    statusText.textContent = "Move Right!";
    score++;
    scoreText.textContent = score;
  }
}

function handleHop(keypoints) {
  const leftAnkle = keypoints.find(k => k.name === "left_ankle");
  const rightAnkle = keypoints.find(k => k.name === "right_ankle");
  if (!leftAnkle || !rightAnkle) return;

  if (!baselineY) baselineY = (leftAnkle.y + rightAnkle.y) / 2;

  const avgY = (leftAnkle.y + rightAnkle.y) / 2;

  if (baselineY - avgY > 50) {
    score++;
    scoreText.textContent = score;
    statusText.textContent = "Hop detected!";
    baselineY = avgY;
  }
}

// Make startGame accessible to HTML buttons
window.startGame = startGame;
