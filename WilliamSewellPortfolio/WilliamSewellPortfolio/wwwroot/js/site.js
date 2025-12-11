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