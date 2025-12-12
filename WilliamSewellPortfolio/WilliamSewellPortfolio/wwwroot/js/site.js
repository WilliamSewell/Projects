// Conway's Game of Life Project Demo
document.addEventListener('DOMContentLoaded', function () {
    const canvas = document.getElementById('gameOfLife');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const startBtn = document.getElementById('golStartBtn');
    const clearBtn = document.getElementById('golClearBtn');
    const randomBtn = document.getElementById('golRandomBtn');

    if (!startBtn || !clearBtn || !randomBtn) return;

    // Use dimensions defined in HTML for initial setup
    let width = canvas.width;
    let height = canvas.height;

    // Grid parameters
    const cellSize = 10;
    let cols, rows;
    let grid, nextGrid;
    let isRunning = false;
    let animationId = null;

    function initCanvas() {
        // Recalculate dimensions based on the actual rendered size (within the box)
        width = canvas.clientWidth;
        height = canvas.clientHeight;

        // Update canvas attributes to match client size for proper rendering scale
        canvas.width = width;
        canvas.height = height;

        cols = Math.floor(width / cellSize);
        rows = Math.floor(height / cellSize);

        grid = createGrid();
        nextGrid = createGrid();

        draw();
    }

    function createGrid() {
        const arr = new Array(cols);
        for (let i = 0; i < cols; i++) {
            arr[i] = new Array(rows).fill(0);
        }
        return arr;
    }

    function countNeighbors(x, y) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                const col = (x + i + cols) % cols;
                const row = (y + j + rows) % rows;
                count += grid[col][row];
            }
        }
        return count;
    }

    function updateGrid() {
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                const neighbors = countNeighbors(x, y);
                const current = grid[x][y];
                if (current === 1 && (neighbors < 2 || neighbors > 3)) {
                    nextGrid[x][y] = 0;
                } else if (current === 0 && neighbors === 3) {
                    nextGrid[x][y] = 1;
                } else {
                    nextGrid[x][y] = current;
                }
            }
        }
        [grid, nextGrid] = [nextGrid, grid];
    }

    function draw() {
        // Clear the canvas area
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * cellSize, 0);
            ctx.lineTo(x * cellSize, height);
            ctx.stroke();
        }
        for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellSize);
            ctx.lineTo(width, y * cellSize);
            ctx.stroke();
        }

        // Draw cells
        for (let x = 0; x < cols; x++) {
            for (let y = 0; y < rows; y++) {
                if (grid[x][y] === 1) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
                }
            }
        }
    }

    let lastUpdate = 0;
    function animate(timestamp) {
        if (!isRunning) return;

        // Update every 150ms
        if (timestamp - lastUpdate > 150) {
            updateGrid();
            draw();
            lastUpdate = timestamp;
        }
        animationId = requestAnimationFrame(animate);
    }

    function toggleCell(x, y) {
        if (x >= 0 && x < cols && y >= 0 && y < rows) {
            grid[x][y] = grid[x][y] === 1 ? 0 : 1;
            draw();
        }
    }

    // Click to toggle cells
    canvas.addEventListener('click', (e) => {
        if (isRunning) return; // Don't allow editing while running

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const gridX = Math.floor(mouseX / cellSize);
        const gridY = Math.floor(mouseY / cellSize);

        toggleCell(gridX, gridY);
    });

    // Start/Stop button
    startBtn.addEventListener('click', () => {
        isRunning = !isRunning;
        if (isRunning) {
            startBtn.textContent = 'Stop';
            lastUpdate = 0;
            animationId = requestAnimationFrame(animate);
        } else {
            startBtn.textContent = 'Start';
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        }
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
        if (isRunning) {
            isRunning = false;
            startBtn.textContent = 'Start';
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        }
        grid = createGrid();
        draw();
    });

    // Random button
    randomBtn.addEventListener('click', () => {
        if (isRunning) {
            isRunning = false;
            startBtn.textContent = 'Start';
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        }
        grid = createGrid();
        // Add random cells (about 20% density)
        for (let i = 0; i < cols * rows * 0.2; i++) {
            const x = Math.floor(Math.random() * cols);
            const y = Math.floor(Math.random() * rows);
            grid[x][y] = 1;
        }
        draw();
    });

    // Handle resizing
    window.addEventListener('resize', initCanvas);

    // Change cursor to pointer when hovering over canvas
    canvas.style.cursor = 'pointer';

    initCanvas();
});

// Light Ball Animation
class LightBall {
    constructor(canvas, radius = 8) {
        this.canvas = canvas;
        this.radius = radius;
        this.glowRadius = radius * 4; // Increased glow slightly

        // Physics properties
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.speed = 2; // Faster speed for better collision demos
    }

    update() {
        const margin = 20; // Matches the -20px offset in CSS so ball is on border
        const minX = margin;
        const minY = margin;
        const maxX = this.canvas.width - margin;
        const maxY = this.canvas.height - margin;
        const cornerThreshold = this.speed + 1; // Tolerance for hitting a corner

        // 1. Move
        this.x += this.vx;
        this.y += this.vy;

        // 2. Snap to Rail (Fixes drifting inside)
        // If moving Horizontal, lock Y. If moving Vertical, lock X.
        if (Math.abs(this.vx) > 0) {
            // We are moving horizontally, are we on Top or Bottom rail?
            const distToTop = Math.abs(this.y - minY);
            const distToBottom = Math.abs(this.y - maxY);
            if (distToTop < distToBottom) this.y = minY;
            else this.y = maxY;
        } else if (Math.abs(this.vy) > 0) {
            // We are moving vertically, are we on Left or Right rail?
            const distToLeft = Math.abs(this.x - minX);
            const distToRight = Math.abs(this.x - maxX);
            if (distToLeft < distToRight) this.x = minX;
            else this.x = maxX;
        }

        // 3. Corner Logic
        // We determine the turn based on arrival direction to support both CW and CCW motion

        // Check bounds and snap to corners if we overshot
        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;
        if (this.y < minY) this.y = minY;
        if (this.y > maxY) this.y = maxY;

        // Top-Left Corner
        if (this.x <= minX + cornerThreshold && this.y <= minY + cornerThreshold) {
            if (this.vx < 0) { // Arrived from Right -> Turn Down (CCW path)
                this.vx = 0; this.vy = this.speed;
                this.x = minX; this.y = minY; // Hard snap
            } else if (this.vy < 0) { // Arrived from Bottom -> Turn Right (CW path)
                this.vx = this.speed; this.vy = 0;
                this.x = minX; this.y = minY;
            }
        }
        // Top-Right Corner
        else if (this.x >= maxX - cornerThreshold && this.y <= minY + cornerThreshold) {
            if (this.vx > 0) { // Arrived from Left -> Turn Down (CW path)
                this.vx = 0; this.vy = this.speed;
                this.x = maxX; this.y = minY;
            } else if (this.vy < 0) { // Arrived from Bottom -> Turn Left (CCW path)
                this.vx = -this.speed; this.vy = 0;
                this.x = maxX; this.y = minY;
            }
        }
        // Bottom-Right Corner
        else if (this.x >= maxX - cornerThreshold && this.y >= maxY - cornerThreshold) {
            if (this.vy > 0) { // Arrived from Top -> Turn Left (CW path)
                this.vx = -this.speed; this.vy = 0;
                this.x = maxX; this.y = maxY;
            } else if (this.vx > 0) { // Arrived from Left -> Turn Up (CCW path)
                this.vx = 0; this.vy = -this.speed;
                this.x = maxX; this.y = maxY;
            }
        }
        // Bottom-Left Corner
        else if (this.x <= minX + cornerThreshold && this.y >= maxY - cornerThreshold) {
            if (this.vx < 0) { // Arrived from Right -> Turn Up (CW path)
                this.vx = 0; this.vy = -this.speed;
                this.x = minX; this.y = maxY;
            } else if (this.vy > 0) { // Arrived from Top -> Turn Right (CCW path)
                this.vx = this.speed; this.vy = 0;
                this.x = minX; this.y = maxY;
            }
        }
    }

    draw(ctx) {
        // Outer glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.glowRadius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.glowRadius, this.y - this.glowRadius, this.glowRadius * 2, this.glowRadius * 2);

        // Core
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
    }

    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        // Use a slightly larger distance for collision to prevent visual overlap before bounce
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + other.radius + 10);
    }

    collide(other) {
        // Reverse directions
        this.vx *= -1;
        this.vy *= -1;
        other.vx *= -1;
        other.vy *= -1;

        // Separation logic to prevent sticky collisions
        // We push them apart along their current movement vector
        // Since they are restricted to axes, we can just push back 
        // a few pixels based on their NEW velocity
        this.x += this.vx * 2;
        this.y += this.vy * 2;
        other.x += other.vx * 2;
        other.y += other.vy * 2;
    }
}

function initHeroAnimation() {
    const heroBox = document.getElementById('heroBox');
    const canvas = document.getElementById('heroCanvas');

    if (!heroBox || !canvas) return;

    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        const box = heroBox.getBoundingClientRect();
        // Match the CSS calculations: width + 40px
        canvas.width = box.width + 40;
        canvas.height = box.height + 40;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const ball1 = new LightBall(canvas);
    const ball2 = new LightBall(canvas);
    const balls = [ball1, ball2];

    // --- SETUP STARTING POSITIONS ---

    const margin = 20;

    // Ball 1: Start Top-Left, Go Right (Clockwise)
    ball1.x = margin;
    ball1.y = margin;
    ball1.vx = ball1.speed;
    ball1.vy = 0;

    // Ball 2: Start Bottom-Right, Go Left (Counter-Clockwise)
    // Note: Bottom-Right going Left is moving along the bottom edge towards bottom-left.
    // This is actually following the border in a Clockwise manner? 
    // Let's re-verify: Top-Right -> Bottom-Right -> Bottom-Left -> Top-Left is CW.
    // So Bottom-Right going Left is CW.
    // To be opposite, Ball 2 should be Bottom-Right going Up (CCW) OR Top-Right going Left (CCW).

    // Let's set them on a collision course on the perimeter.
    // Ball 1: Top-Left -> moving Right
    // Ball 2: Top-Right -> moving Left
    // They will smash head-on on the top bar.
    ball2.x = canvas.width - margin;
    ball2.y = margin;
    ball2.vx = -ball2.speed;
    ball2.vy = 0;

    // Animation Loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Update physics
        balls.forEach(ball => ball.update());

        // Check collision
        if (ball1.checkCollision(ball2)) {
            ball1.collide(ball2);
        }

        // Draw
        balls.forEach(ball => ball.draw(ctx));

        requestAnimationFrame(animate);
    }

    animate();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroAnimation);
} else {
    initHeroAnimation();
}