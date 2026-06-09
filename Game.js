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

// Listeners for UI interaction and keys
window.addEventListener("keydown", (e) => { 
    if (e.code in keys) keys[e.code] = true; 
    // Handle single press shooting to prevent continuous laser streams
    if (e.code === "Space" && gameActive) {
        fireLaser();
    }
});
window.addEventListener("keyup", (e) => { if (e.code in keys) keys[e.code] = false; });
startBtn.addEventListener("click", initGame);

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

    // Clean execution loop setups
    if (spawnIntervalId) clearInterval(spawnIntervalId);
    spawnIntervalId = setInterval(spawnAsteroid, 800);

    if (coinSpawnIntervalId) clearInterval(coinSpawnIntervalId);
    coinSpawnIntervalId = setInterval(spawnCoin, 3000); // Spawn a coin every 3 seconds

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
        speed: Math.random() * 3 + 2 + (score * 0.1) // Dynamically escalates speed
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

    // Clear graphics frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Process and Render Background Stars
    ctx.fillStyle = "#ffffff";
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    // Process Smooth Player Motion
    if (keys.ArrowLeft || keys.KeyA) player.x -= player.speed;
    if (keys.ArrowRight || keys.KeyD) player.x += player.speed;

    // Clamp Player inside the Canvas borders
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

    // 2. Process Lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
        let laser = lasers[i];
        laser.y -= laser.speed;

        ctx.fillStyle = "#45f3ff";
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);

        // Delete off-screen lasers
        if (laser.y < 0) {
            lasers.splice(i, 1);
        }
    }

    // 3. Process Collectible Coins
    for (let i = coins.length - 1; i >= 0; i--) {
        let coin = coins[i];
        coin.y += coin.speed;

        // Draw Gold Coin (Circle)
        ctx.fillStyle = "#ffdf00";
        ctx.beginPath();
        ctx.arc(coin.x + coin.width/2, coin.y + coin.height/2, coin.width/2, 0, Math.PI * 2);
        ctx.fill();

        // Check Coin Collection
        if (player.x < coin.x + coin.width &&
            player.x + player.width > coin.x &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            
            createExplosion(coin.x + coin.width / 2, coin.y + coin.height / 2, "#ffdf00");
            score += 5; // Bonus points
            scoreVal.innerText = score;
            coins.splice(i, 1);
            continue;
        }

        if (coin.y > canvas.height) coins.splice(i, 1);
    }

    // 4. Iterate and Process Obstacles
    for (let i = asteroids.length - 1; i >= 0; i--) {
        let ast = asteroids[i];
        ast.y += ast.speed;

        // Draw Asteroid
        ctx.fillStyle = "#ff4a4a";
        ctx.fillRect(ast.x, ast.y, ast.width, ast.height);

        // Check if Laser hits Asteroid
        let asteroidDestroyed = false;
        for (let j = lasers.length - 1; j >= 0; j--) {
            let laser = lasers[j];
            if (laser.x < ast.x + ast.width &&
                laser.x + laser.width > ast.x &&
                laser.y < ast.y + ast.height &&
                laser.y + laser.height > ast.y) {
                
                createExplosion(ast.x + ast.width / 2, ast.y + ast.height / 2, "#ff4a4a");
                asteroids.splice(i, 1);
                lasers.splice(j, 1);
                score += 2; // Extra points for shooting down risks
                scoreVal.innerText = score;
                asteroidDestroyed = true;
                break;
            }
        }

        if (asteroidDestroyed) continue;

        // Standard Player Collision Detection
        if (player.x < ast.x + ast.width &&
            player.x + player.width > ast.x &&
            player.y < ast.y + ast.height &&
            player.y + player.height > ast.y) {
            createExplosion(player.x + player.width / 2, player.y + player.height / 2, "#66fcf1");
            endGame();
            return;
        }

        // Clean arrays and increment point updates safely
        if (ast.y > canvas.height) {
            asteroids.splice(i, 1);
            score++;
            scoreVal.innerText = score;
        }
    }

    // 5. Process Visual Explosion Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;

        if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
    }

    animationFrameId = requestAnimationFrame(update);
}

function endGame() {
    gameActive = false;
    clearInterval(spawnIntervalId);
    clearInterval(coinSpawnIntervalId);
    cancelAnimationFrame(animationFrameId);
    
    // Revamp State Elements on UI Overlays
    uiTitle.innerText = "GAME OVER";
    uiTitle.style.color = "#ff4a4a";
    uiSubtitle.innerText = `Final Score: ${score}`;
    startBtn.innerText = "TRY AGAIN";
    uiOverlay.style.display = "flex"; // Return interactive menu
}
