
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const W = 420;
const H = 650;
const GROUND = 45;

const $ = id => document.getElementById(id);

let bird;
let pipes = [];
let coins = [];
let particles = [];

let score = 0;
let collectedCoins = 0;
let best = Number(localStorage.getItem("flappyBest")) || 0;

let frame = 0;
let running = false;
let started = false;
let animationId;

const gravity = 0.38;
const jumpPower = -7.2;
const pipeWidth = 65;
const pipeGap = 170;
const pipeSpeed = 2.7;

$("best").textContent = best;

// Първоначално състояние
function resetGame() {
    bird = {
        x: 105,
        y: 300,
        velocity: 0,
        radius: 15,
        rotation: 0
    };

    pipes = [];
    coins = [];
    particles = [];

    score = 0;
    collectedCoins = 0;
    frame = 0;

    updateHUD();
}

// HUD
function updateHUD() {
    $("score").textContent = score;
    $("coins").textContent = collectedCoins;
    $("best").textContent = best;
}

// Стартиране
function startGame() {
    resetGame();

    running = true;
    started = true;

    $("menu").classList.add("hidden");
    $("gameOver").classList.add("hidden");

    flap();
}

// Скачане
function flap() {
    if (!running) return;

    bird.velocity = jumpPower;

    createParticles(
        bird.x - 10,
        bird.y + 5,
        "#ffffff",
        3
    );
}

// Край на играта
function endGame() {
    if (!running) return;

    running = false;

    if (score > best) {
        best = score;
        localStorage.setItem("flappyBest", best);
    }

    updateHUD();

    $("finalScore").textContent = score;
    $("finalCoins").textContent = collectedCoins;
    $("finalBest").textContent = best;

    $("gameOver").classList.remove("hidden");
}

// Създаване на препятствия и монети
function createPipe() {
    const top = 105 + Math.random() * 270;
    const bottom = top + pipeGap;

    pipes.push({
        x: W,
        top: top,
        bottom: bottom,
        scored: false
    });

    // Монета в пролуката
    coins.push({
        x: W + pipeWidth / 2,
        y: top + pipeGap / 2,
        radius: 12,
        collected: false,
        rotation: Math.random() * Math.PI
    });
}

// Частици
function createParticles(x, y, color, amount) {
    for (let i = 0; i < amount; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 30 + Math.random() * 20,
            size: 2 + Math.random() * 4,
            color
        });
    }
}

function updateParticles() {
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.vy += 0.05;
    });

    particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = Math.min(1, p.life / 25);
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
}

// Фон
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);

    gradient.addColorStop(0, "#48b9f2");
    gradient.addColorStop(0.65, "#91dcf5");
    gradient.addColorStop(1, "#d4f6ff");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Слънце
    const sunGlow = ctx.createRadialGradient(
        325, 120, 5,
        325, 120, 85
    );

    sunGlow.addColorStop(0, "#fff9c6aa");
    sunGlow.addColorStop(1, "#fff9c600");

    ctx.fillStyle = sunGlow;
    ctx.fillRect(230, 25, 190, 190);

    ctx.fillStyle = "#fff4b9";
    ctx.beginPath();
    ctx.arc(325, 120, 27, 0, Math.PI * 2);
    ctx.fill();

    // Облаци
    ctx.fillStyle = "#ffffff99";

    for (let i = 0; i < 5; i++) {
        let x = (
            i * 120 - frame * 0.35 + 600
        ) % 550 - 60;

        let y = 100 + (i % 3) * 115;

        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.arc(x + 27, y - 12, 29, 0, Math.PI * 2);
        ctx.arc(x + 55, y, 22, 0, Math.PI * 2);
        ctx.fill();
    }

    // Далечни хълмове
    ctx.fillStyle = "#8dd7a5";

    ctx.beginPath();
    ctx.moveTo(0, H - GROUND);
    ctx.quadraticCurveTo(90, 460, 180, H - GROUND);
    ctx.quadraticCurveTo(300, 465, 420, H - GROUND);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    // Земя
    ctx.fillStyle = "#54c943";
    ctx.fillRect(0, H - GROUND, W, GROUND);

    ctx.fillStyle = "#a7ef69";
    ctx.fillRect(0, H - GROUND, W, 8);

    ctx.fillStyle = "#d7b779";
    ctx.fillRect(0, H - GROUND + 8, W, GROUND - 8);

    // Декорации на земята
    for (let i = 0; i < 14; i++) {
        const x = (
            i * 40 - frame * 2 + 4200
        ) % 420;

        ctx.fillStyle = "#bc995d";
        ctx.fillRect(x, H - 24, 13, 5);
    }
}

// Рисуване на тръбите
function drawPipes() {
    pipes.forEach(pipe => {
        // Горна тръба
        drawSinglePipe(
            pipe.x,
            0,
            pipe.top,
            true
        );

        // Долна тръба
        drawSinglePipe(
            pipe.x,
            pipe.bottom,
            H - GROUND - pipe.bottom,
            false
        );
    });
}

function drawSinglePipe(x, y, height, isTop) {
    if (height <= 0) return;

    const gradient = ctx.createLinearGradient(
        x, 0, x + pipeWidth, 0
    );

    gradient.addColorStop(0, "#168d35");
    gradient.addColorStop(0.25, "#4be35c");
    gradient.addColorStop(0.55, "#2bbd47");
    gradient.addColorStop(1, "#117b30");

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, pipeWidth, height);

    // Светъл кант
    ctx.fillStyle = "#9bff7c";
    ctx.fillRect(x + 8, y, 7, height);

    ctx.fillStyle = "#176e2c";
    ctx.fillRect(x + pipeWidth - 7, y, 7, height);

    // Край на тръбата
    const capHeight = 22;
    const capY = isTop ? y + height - capHeight : y;

    ctx.fillStyle = "#219c3c";
    ctx.fillRect(x - 5, capY, pipeWidth + 10, capHeight);

    ctx.fillStyle = "#74f06c";
    ctx.fillRect(x - 5, capY, pipeWidth + 10, 5);

    ctx.strokeStyle = "#11682b";
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 5, capY, pipeWidth + 10, capHeight);
}

// Златни монети
function drawCoins() {
    coins.forEach(coin => {
        if (coin.collected) return;

        coin.rotation += 0.045;

        const scale = Math.max(
            0.18,
            Math.abs(Math.cos(coin.rotation))
        );

        ctx.save();

        ctx.translate(coin.x, coin.y);
        ctx.scale(scale, 1);

        // Светлина около монетата
        ctx.shadowBlur = 23;
        ctx.shadowColor = "#ffcf32";

        // Външен кръг
        const gold = ctx.createLinearGradient(0, -14, 0, 14);

        gold.addColorStop(0, "#fff5a1");
        gold.addColorStop(0.35, "#ffdf38");
        gold.addColorStop(1, "#e99a00");

        ctx.fillStyle = gold;

        ctx.beginPath();
        ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#fff2a0";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Символ
        ctx.fillStyle = "#a96a00";
        ctx.font = "bold 15px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 1);

        ctx.restore();
    });
}

// Птица
function drawBird() {
    ctx.save();

    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    // Сянка
    ctx.fillStyle = "#00000020";
    ctx.beginPath();
    ctx.ellipse(0, 20, 17, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Тяло
    const body = ctx.createLinearGradient(-10, -15, 10, 18);

    body.addColorStop(0, "#fff17a");
    body.addColorStop(1, "#ffb522");

    ctx.fillStyle = body;

    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#e59b19";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Крило
    ctx.fillStyle = "#ff9e27";

    ctx.beginPath();
    ctx.ellipse(-9, 5, 10, 7, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Око
    ctx.fillStyle = "white";

    ctx.beginPath();
    ctx.arc(9, -7, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#20233a";

    ctx.beginPath();
    ctx.arc(11, -7, 3, 0, Math.PI * 2);
    ctx.fill();

    // Клюн
    ctx.fillStyle = "#ff7625";

    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(29, 4);
    ctx.lineTo(16, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

// Проверка на сблъсък
function checkCollision() {
    const r = bird.radius;

    if (
        bird.y - r < 0 ||
        bird.y + r > H - GROUND
    ) {
        endGame();
        return;
    }

    for (const pipe of pipes) {
        const insideX =
            bird.x + r > pipe.x - 5 &&
            bird.x - r < pipe.x + pipeWidth + 5;

        if (
            insideX &&
            (
                bird.y - r < pipe.top ||
                bird.y + r > pipe.bottom
            )
        ) {
            endGame();
            return;
        }
    }
}

// Събиране на монети
function collectCoins() {
    coins.forEach(coin => {
        if (coin.collected) return;

        const dx = bird.x - coin.x;
        const dy = bird.y - coin.y;

        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bird.radius + coin.radius) {
            coin.collected = true;

            collectedCoins++;
            score += 5;

            updateHUD();

            createParticles(
                coin.x,
                coin.y,
                "#ffdc38",
                18
            );
        }
    });

    coins = coins.filter(
        coin => !coin.collected && coin.x > -30
    );
}

// Основна логика
function update() {
    if (!running) return;

    frame++;

    // Физика
    bird.velocity += gravity;
    bird.y += bird.velocity;

    bird.rotation = Math.min(
        Math.max(bird.velocity * 0.06, -0.5),
        0.9
    );

    // Нови препятствия
    if (frame % 105 === 0) {
        createPipe();
    }

    // Движение на тръбите
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;

        // Точка за премината тръба
        if (
            !pipe.scored &&
            pipe.x + pipeWidth < bird.x
        ) {
            pipe.scored = true;
            score++;

            updateHUD();
        }
    });

    pipes = pipes.filter(
        pipe => pipe.x + pipeWidth > 0
    );

    updateParticles();

    checkCollision();

    if (running) {
        collectCoins();
    }
}

// Рисуване
function draw() {
    drawBackground();
    drawPipes();
    drawCoins();
    drawParticles();
    drawBird();
}

// Главен цикъл
function loop() {
    update();
    draw();

    animationId = requestAnimationFrame(loop);
}

// Управление с клавиатура
document.addEventListener("keydown", e => {
    if (
        e.code === "Space" ||
        e.code === "ArrowUp"
    ) {
        e.preventDefault();

        if (e.repeat) return;

        if (!started) {
            startGame();
        } else {
            flap();
        }
    }
});

// Мишка и телефон
canvas.addEventListener("pointerdown", () => {
    if (running) flap();
});

// Бутони
$("start").addEventListener("click", startGame);
$("restart").addEventListener("click", startGame);

// Начален екран
resetGame();

bird.y = 300;
draw();

loop();
