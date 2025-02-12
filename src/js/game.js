/*********************
 * Global Variables
 *********************/
let currentScore = 0;
let timeLeft = 120; // 2 minutes countdown
let gameRunning = false;
let canvas, ctx;
let crab, obstacles = [], boxes = [], bubbles = [];
let selectedAge, selectedLanguage;
let literacyQuestions = [];
let mathsQuestions = [];
// Flag for background scrolling
let isMoving = false;
// Flag to disable key events while modal is active
let modalActive = false;

// Global background music variable (set loop to true)
let bgMusic = new Audio("assets/background_music.mp3");
bgMusic.loop = true;

// The sea floor y-coordinate
const GROUND_LEVEL = 665;

// We'll store the timerInterval ID so we can clear it later
let timerInterval;

// Create Audio objects for sound effects.
const jumpSound = new Audio("assets/jump.mp3");
const bubbleSound = new Audio("assets/bubble.mp3");

/*********************
 * Game Element Classes
 *********************/
class Crab {
  constructor() {
    this.x = 100;
    this.y = GROUND_LEVEL;
    this.width = 120;
    this.height = 86;
    this.dy = 0;
    this.jumping = false;
  }
  draw() {
    let crabImg = new Image();
    crabImg.src = "assets/crab.png";
    ctx.drawImage(crabImg, this.x, this.y, this.width, this.height);
  }
  update() {
    if (this.jumping) {
      this.dy += 0.3; // Lower gravity for a longer air time
      this.y += this.dy;
      if (this.y >= GROUND_LEVEL) {
        this.y = GROUND_LEVEL;
        this.jumping = false;
        this.dy = 0;
      }
    }
  }
  jump() {
    if (!this.jumping) {
      // Play jump sound effect
      jumpSound.currentTime = 0;
      jumpSound.play();
      this.jumping = true;
      this.dy = -16; // Higher jump velocity
    }
  }
}

class Obstacle {
  constructor(x, type) {
    this.x = x;
    this.type = type; // 'rock' or 'seaweed'
    if (type === 'rock') {
      this.width = 85;
      this.height = 58;
      this.y = GROUND_LEVEL;
    } else {
      this.width = 76;
      this.height = 150;
      this.y = GROUND_LEVEL - 60;
    }
  }
  draw() {
    let img = new Image();
    img.src = (this.type === 'rock') ? "assets/rock.png" : "assets/seaweed.png";
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
  }
  update(speed) {
    this.x -= speed;
  }
}

// Updated Box class: boxes are now drawn at 75×75 and numbers are bigger with a drop shadow.
class Box {
  constructor(x, level) {
    this.x = x;
    this.level = level; // 1, 2, or 3
    this.width = 75;
    this.height = 75;
    // Position boxes above the ground; you can adjust the vertical offset if needed.
    this.y = GROUND_LEVEL - 350 + (level - 1) * 20;
  }
  draw() {
    let img = new Image();
    if (this.level === 1) {
      img.src = "assets/box1.png";
    } else if (this.level === 2) {
      img.src = "assets/box2.png";
    } else {
      img.src = "assets/box3.png";
    }
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
    // Draw the level number centered on the box with a drop shadow.
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
    ctx.fillText(this.level, this.x + this.width / 2, this.y + this.height / 2);
    ctx.restore();
  }
  update(speed) {
    this.x -= speed;
  }
}

class Bubble {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 5;
    this.speed = 5;
  }
  draw() {
    let bubbleImg = new Image();
    bubbleImg.src = "assets/bubble.png";
    ctx.drawImage(
      bubbleImg,
      this.x - this.radius,
      this.y - this.radius,
      this.radius * 2,
      this.radius * 2
    );
  }
  update() {
    this.y -= this.speed;
  }
}

/*********************
 * Initialization Functions
 *********************/
function initCanvas() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  // Ensure the canvas gets focus so it receives key events.
  canvas.focus();
}

/*********************
 * Load Questions from JSON Files
 *********************/
function loadQuestions() {
  if (selectedLanguage === "english") {
    fetch("data/english_literacy.json")
      .then(response => response.json())
      .then(data => { literacyQuestions = data; });
    fetch("data/english_maths.json")
      .then(response => response.json())
      .then(data => { mathsQuestions = data; });
  }
}

/*********************
 * Game Loop and Timer
 *********************/
function startGame() {
  // Clear any existing timer before starting a new game.
  clearInterval(timerInterval);
  
  // Reset game state variables.
  currentScore = 0;
  timeLeft = 120;
  crab = new Crab();
  obstacles = [];
  boxes = [];
  bubbles = [];
  gameRunning = true;
  
  loadQuestions(); // Load question data.

  // Start background music.
  bgMusic.currentTime = 0;  // Start from the beginning
  bgMusic.play();
  
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById('timer-display').innerText = "Time: " + timeLeft;
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
  
  gameLoop();
}

function gameLoop() {
  if (!gameRunning) return;
  
  // Clear canvas and draw background.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let bgImg = new Image();
  bgImg.src = "assets/background.png";
  ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  
  crab.update();
  crab.draw();
  
  // Check for collisions between crab and obstacles.
  let collisionDetected = obstacles.some(ob => {
    return (
      crab.x < ob.x + ob.width &&
      crab.x + crab.width > ob.x &&
      crab.y < ob.y + ob.height &&
      crab.y + crab.height > ob.y
    );
  });
  
  const scrollSpeed = 3;
  if (isMoving && !collisionDetected) {
    obstacles.forEach(ob => ob.update(scrollSpeed));
    boxes.forEach(box => box.update(scrollSpeed));
  }
  
  obstacles.forEach((ob, index) => {
    ob.draw();
    if (ob.x + ob.width < 0) {
      obstacles.splice(index, 1);
    }
  });
  
  boxes.forEach((box, index) => {
    box.draw();
    if (box.x + box.width < 0) {
      boxes.splice(index, 1);
    }
  });
  
if (isMoving && !collisionDetected) {
  // Define the minimum horizontal gap (in pixels) you want between obstacles.
  const spawnGap = 250;

  // Find the rightmost obstacle's x position, if any exist.
  let rightmostX = obstacles.length > 0
    ? Math.max(...obstacles.map(ob => ob.x))
    : -Infinity;

  // Only attempt to spawn a new obstacle if either:
  // - There are no obstacles, or
  // - The right edge of the canvas is at least `spawnGap` pixels beyond the rightmost obstacle.
  if (obstacles.length === 0 || (canvas.width - rightmostX > spawnGap)) {
    // Lower the probability to 0.003 to further reduce spawns.
    if (Math.random() < 0.01) {
      let type = Math.random() < 0.5 ? 'rock' : 'seaweed';
      obstacles.push(new Obstacle(canvas.width, type));
    }
  }
  
  // (The box spawning code can remain unchanged or be adjusted similarly.)
  if (boxes.length < 3 && Math.random() < 0.005) {
    const minBoxGap = 100;
    let rightmostBoxEdge = 0;
    if (boxes.length > 0) {
      rightmostBoxEdge = Math.max(...boxes.map(box => box.x + box.width));
    }
    // If there are no boxes or if there's enough gap, spawn a new box.
    if (boxes.length === 0 || (canvas.width - rightmostBoxEdge) >= minBoxGap) {
      let level = Math.floor(Math.random() * 3) + 1;
      boxes.push(new Box(canvas.width, level));
    }
  }
}
  
  // Update bubbles and check for collisions with boxes.
  bubbles.forEach((bubble, bIndex) => {
    bubble.update();
    bubble.draw();
    boxes.forEach((box, boxIndex) => {
      if (
        bubble.x > box.x && bubble.x < box.x + box.width &&
        bubble.y > box.y && bubble.y < box.y + box.height
      ) {
        // When a bubble collides with a box, show the question modal.
        bubbles.splice(bIndex, 1);
        boxes.splice(boxIndex, 1);
        gameRunning = false;
        let questionData = getQuestion(box.level, selectedAge);
        showQuestionModal(questionData);
      }
    });
    if (bubble.y + bubble.radius < 0) {
      bubbles.splice(bIndex, 1);
    }
  });
  
  document.getElementById('score-display').innerText = "Score: " + currentScore;
  
  requestAnimationFrame(gameLoop);
}

/*********************
 * Question Logic
 *********************/
function getQuestion(level, age) {
  let questions = (Math.random() < 0.5) ? literacyQuestions : mathsQuestions;
  let filtered = questions.filter(q => q.age == age && q.level == level);
  if (filtered.length > 0) {
    return filtered[Math.floor(Math.random() * filtered.length)];
  }
  return { question: "No question available", answer: "" };
}

function showQuestionModal(questionData) {
  modalActive = true; // Disable game key events.
  const modal = document.getElementById('question-modal');
  modal.style.display = 'block';
  document.getElementById('question-text').innerText = questionData.question;
  const submitBtn = document.getElementById('submit-answer');
  submitBtn.onclick = function() {
    const userAnswer = document.getElementById('answer-input').value.trim();
    if (userAnswer.toLowerCase() === questionData.answer.toLowerCase()) {
      currentScore += (questionData.level || 1) * 10;
    }
    document.getElementById('answer-input').value = "";
    modal.style.display = 'none';
    modalActive = false; // Re-enable game key events.
    gameRunning = true;
    gameLoop();
  }
}

/*********************
 * End Game and Restart
 *********************/
function endGame() {
  clearInterval(timerInterval);
  gameRunning = false;

  // Stop the background music.
  bgMusic.pause();
  bgMusic.currentTime = 0;

  // Hide the game screen and show the high score screen.
  document.getElementById('game-screen').classList.remove("active");
  document.getElementById('highscore-screen').classList.add("active");
  document.getElementById('final-score').innerText = "Your score: " + currentScore;
}

/*********************
 * Event Listeners for Controls
 *********************/
document.addEventListener('keydown', function(e) {
  // Process key events only when the game screen is active and modal is not active.
  if (!document.getElementById('game-screen').classList.contains('active')) return;
  if (modalActive) return;
  if (e.code === 'Space') {
    if (crab) crab.jump();
  }
  if (e.code === 'ArrowUp') {
    // Play the bubble sound effect.
    bubbleSound.currentTime = 0;
    bubbleSound.play();
    if (crab) bubbles.push(new Bubble(crab.x + crab.width / 4.5, crab.y + crab.height * 0.5));
  }
  if (e.code === 'ArrowRight') {
    isMoving = true;
  }
});

document.addEventListener('keyup', function(e) {
  if (e.code === 'ArrowRight') {
    isMoving = false;
  }
});

/*********************
 * Screen Transitions
 *********************/
document.addEventListener('DOMContentLoaded', function() {
  initCanvas();
  
  // Ensure only the splash screen is active initially.
  document.getElementById('splash-screen').classList.remove("active");
  document.getElementById('instructions-screen').classList.remove("active");
  document.getElementById('game-screen').classList.remove("active");
  document.getElementById('highscore-screen').classList.remove("active");
  
  // Activate only the splash screen.
  document.getElementById('splash-screen').classList.add("active");
  console.log("Splash screen active");
  
  // After 5 seconds, switch to the instructions screen.
  setTimeout(() => {
    console.log("Switching to instructions screen");
    document.getElementById('splash-screen').classList.remove("active");
    document.getElementById('instructions-screen').classList.add("active");
  }, 5000);
  
  // When the Start Game button is clicked, switch to the game screen, set focus on the canvas, and start the game.
  document.getElementById('start-game').addEventListener('click', function() {
    selectedAge = document.getElementById('age-select').value;
    selectedLanguage = document.getElementById('language-select').value;
    document.getElementById('instructions-screen').classList.remove("active");
    document.getElementById('game-screen').classList.add("active");
    // Ensure the canvas gets focus so it can receive key events.
    document.getElementById('game-canvas').focus();
    startGame();
  });
  
  // When the Restart Game button is clicked, fully reload the page
  // so the user can choose different options (age/language) if desired.
  document.getElementById('restart-game').addEventListener('click', function() {
    window.location.reload();
  });
});
