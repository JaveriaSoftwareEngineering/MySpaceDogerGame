const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreVal = document.getElementById("score-val");
const uiOverlay = document.getElementById("ui-overlay");
const uiTitle = document.getElementById("ui-title");
const uiSubtitle = document.getElementById("ui-subtitle");
const startBtn = document.getElementById("start-btn");

// Game Settings & State Variables
let score = 0;
let gameActive = false;
let player, asteroids, lasers, coins, particles, stars;
let keys, animationFrameId, spawnIntervalId, coinSpawnIntervalId;

keys = { ArrowLeft: false, ArrowRight: false, KeyA: false, KeyD: false, Space: false };

// Keyboard Listeners
window.addEventListener("keydown", (e) => { 
    if (e.code in keys) keys[e.code] = true; 
    if (e.code === "Space" && gameActive) {
        fireLaser();
    }
});
window.addEventListener("keyup", (e) => { if (e.code in keys) keys[e.code] = false; });
startBtn.addEventListener("click", initGame);

// NEW: Mobile Touch Controls Listeners
const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");
const btnShoot = document.getElementById("btn-shoot");

// Left Arrow Interactions
btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); keys.ArrowLeft = true; });
btnLeft.addEventListener("touchend", (e) => { e.preventDefault(); keys.ArrowLeft = false; });

// Right Arrow Interactions
btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); keys.ArrowRight = true; });
btnRight.addEventListener("touchend", (e) => { e.preventDefault(); keys.ArrowRight = false; });

// Shooting Trigger Interactions
btnShoot.addEventListener("touchstart", (e) => { 
    e.preventDefault(); 
    if (gameActive) fireLaser(); 
});

// Initialize Starfield once at the beginning
stars = [];
for (let i = 0; i < 50; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 1 + 0.5
    });
}

function initGame() {
    score = 0;
    asteroids = [];
    lasers = [];
    coins = [];
    particles = [];
    gameActive = true;
    scoreVal.innerText = score;
    uiOverlay.style.display = "none"; // Hide Menu UI

    player = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 50,
        width: 30,
        height: 30,
        speed: 6
    };

    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(spawnAsteroid, 800);

    if (coinSpawnIntervalId) clearInterval(coinSpawnIntervalId);
    coinSpawnIntervalId = setInterval(spawnCoin, 3000); 

    cancelAnimationFrame(animationFrameId);
    update();
}

function spawnAsteroid() {
    if (!gameActive) return;
    const size = Math.random() * 25 + 15;
    asteroids.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: Math.random() * 3 + 2 + (score * 0.1) 
    });
}

function spawnCoin() {
    if (!gameActive) return;
    const size = 15;
    coins.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        width: size,
        height: size,
        speed: 2
    });
}

function fireLaser() {
    lasers.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        width: 4,
        height: 15,
        speed: 8
    });
}

function createExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            size: Math.random() * 3 + 2,
            alpha: 1,
            color: color
        });
    }
}

function update() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Stars Background Loop
    ctx.fillStyle = "#ffffff";
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Process Movement Inputs
    if (keys.ArrowLeft || keys.KeyA) player.x -= player.speed;
    if (keys.ArrowRight || keys.KeyD) player.x += player.speed;

    if (player.x < 0) player.x = 0;
    if (player.x > canvas.width - player.width) player.x = canvas.width - player.width;

    // Render Neon Ship
    ctx.fillStyle = "#66fcf1";
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Lasers Mechanics
    for (let i = lasers.length - 1; i >= 0; i--) {
        let laser = lasers[i];
        laser.y -= laser.speed;

        ctx.fillStyle = "#45f3ff";
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);

        if (laser.y < 0) {
            lasers.splice(i, 1);
        }
    }

    // Collectibles Setup
    for (let i = coins.length - 1; i >= 0; i--) {
        let coin = coins[i];
        coin.y += coin.speed;

        ctx.fillStyle = "#ffdf00";
        ctx.beginPath();
        ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
        ctx.fill();

        if (player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            
            createExplosion(coin.x + coin.width / 2, coin.y + coin.height / 2, "#ffdf00");
            score += 5; 
            scoreVal.innerText = score;
            coins.splice(i, 1);
            continue;
        }

        if (coin.y > canvas.height) coins.splice(i, 1);
    }

    // Obstacles Management & Game Over
    for (let i = asteroids.length - 1; i >= 0; i--) {
        let ast = asteroids[i];
        ast.y += ast.speed;

        ctx.fillStyle = "#ff4757";
        ctx.fillRect(ast.x, ast.y, ast.width, ast.height);

        // Check Asteroid Laser Collision
        for (let j = lasers.length - 1; j >= 0; j--) {
            let laser = lasers[j];
            if (laser.x < ast.x + ast.width &&
                laser.x + laser.width > ast.x &&
                laser.y < ast.y + ast.height &&
                laser.y + laser.height > ast.y) {
                
                createExplosion(ast.x + ast.width / 2, ast.y + ast.height / 2, "#ff4757");
                score += 1;
                scoreVal.innerText = score;
                asteroids.splice(i, 1);
                lasers.splice(j, 1);
                break;
            }
        }

        // Check Player Collision (Game Over)
        if (player.x < ast.x + ast.width &&
            player.x + player.width > ast.x &&
            player.y < ast.y + ast.height &&
            player.y + player.height > ast.y) {
            
            gameActive = false;
            uiTitle.innerText = "GAME OVER";
            uiSubtitle.innerText = `Final Score: ${score}`;
            uiOverlay.style.display = "flex";
            clearInterval(spawnIntervalId);
            clearInterval(coinSpawnIntervalId);
        }

        if (ast.y > canvas.height) asteroids.splice(i, 1);
    }

    // Render Burst Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.globalAlpha = 1.0; // Reset canvas context alpha transparency
    }

    animationFrameId = requestAnimationFrame(update);
}
