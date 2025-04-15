/**
 * Snake Game with Risk Analysis
 * Tracks player behavior to analyze risk profile
 */
document.addEventListener('DOMContentLoaded', () => {
    // Canvas and context setup
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Game elements
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const gameOverlay = document.getElementById('game-overlay');
    const scoreDisplay = document.getElementById('score');
    const timeDisplay = document.getElementById('time');
    
    // Metrics display elements
    const metricTurns = document.getElementById('metric-turns');
    const metricWall = document.getElementById('metric-wall');
    const metricRisky = document.getElementById('metric-risky');
    const metricMisses = document.getElementById('metric-misses');
    const metricDecision = document.getElementById('metric-decision');
    
    // Game configuration
    const CELL_SIZE = 20;
    const GRID_WIDTH = Math.floor(canvas.width / CELL_SIZE);
    const GRID_HEIGHT = Math.floor(canvas.height / CELL_SIZE);
    const GAME_SPEED = 100; // ms between moves
    const WALL_PROXIMITY_THRESHOLD = 2; // cells from wall to count as "close"
    const BODY_PROXIMITY_THRESHOLD = 2; // cells from body to count as "risky"
    
    // Game state
    let snake = [];
    let direction = 'right';
    let nextDirection = 'right';
    let food = null;
    let score = 0;
    let gameTimer = null;
    let gameActive = false;
    let gameStartTime = 0;
    let lastMoveTime = 0;
    let gameMetrics = {
        unnecessaryTurns: 0,
        wallProximityFrames: 0,
        totalFrames: 0,
        riskyBodyMovements: 0,
        nearMisses: 0,
        decisionTimes: [],
        lastKeyPressTime: 0,
        lastDirection: null
    };
    
    // Colors
    const colors = {
        background: '#111218',
        snake: '#28a745',
        snakeHead: '#217a38',
        food: '#dc3545',
        grid: '#1a1c25'
    };
    
    // Initialize game board
    function initGame() {
        // Reset game state
        snake = [
            {x: 5, y: 10},
            {x: 4, y: 10},
            {x: 3, y: 10}
        ];
        direction = 'right';
        nextDirection = 'right';
        score = 0;
        gameMetrics = {
            unnecessaryTurns: 0,
            wallProximityFrames: 0,
            totalFrames: 0,
            riskyBodyMovements: 0,
            nearMisses: 0,
            decisionTimes: [],
            lastKeyPressTime: Date.now(),
            lastDirection: 'right'
        };
        
        // Generate initial food
        generateFood();
        
        // Update displays
        scoreDisplay.textContent = score;
        timeDisplay.textContent = '0';
        updateMetricsDisplay();
        
        // Set game start time
        gameStartTime = Date.now();
        lastMoveTime = gameStartTime;
    }
    
    // Generate food at random position (not on snake)
    function generateFood() {
        let x, y;
        do {
            x = Math.floor(Math.random() * GRID_WIDTH);
            y = Math.floor(Math.random() * GRID_HEIGHT);
        } while (snake.some(segment => segment.x === x && segment.y === y));
        
        food = { x, y };
    }
    
    // Draw the game elements
    function draw() {
        // Clear canvas
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid (optional)
        drawGrid();
        
        // Draw snake
        drawSnake();
        
        // Draw food
        drawFood();
    }
    
    // Draw the grid lines
    function drawGrid() {
        ctx.strokeStyle = colors.grid;
        ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }
    
    // Draw the snake
    function drawSnake() {
        snake.forEach((segment, index) => {
            // Different color for head
            ctx.fillStyle = index === 0 ? colors.snakeHead : colors.snake;
            
            // Draw the segment
            ctx.fillRect(
                segment.x * CELL_SIZE, 
                segment.y * CELL_SIZE, 
                CELL_SIZE, 
                CELL_SIZE
            );
            
            // Add a border to make segments more visible
            ctx.strokeStyle = colors.background;
            ctx.lineWidth = 1;
            ctx.strokeRect(
                segment.x * CELL_SIZE, 
                segment.y * CELL_SIZE, 
                CELL_SIZE, 
                CELL_SIZE
            );
        });
    }
    
    // Draw the food
    function drawFood() {
        if (!food) return;
        
        // Draw a circle for food
        ctx.fillStyle = colors.food;
        const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 - 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Update game state
    function update() {
        // Apply the next direction
        direction = nextDirection;
        
        // Calculate new head position
        const head = { ...snake[0] };
        
        switch (direction) {
            case 'up':
                head.y -= 1;
                break;
            case 'down':
                head.y += 1;
                break;
            case 'left':
                head.x -= 1;
                break;
            case 'right':
                head.x += 1;
                break;
        }
        
        // Check for collisions
        if (
            // Wall collision
            head.x < 0 || head.x >= GRID_WIDTH || 
            head.y < 0 || head.y >= GRID_HEIGHT ||
            // Self collision
            snake.some(segment => segment.x === head.x && segment.y === head.y)
        ) {
            endGame();
            return;
        }
        
        // Add new head to snake
        snake.unshift(head);
        
        // Check if food is eaten
        if (head.x === food.x && head.y === food.y) {
            // Increase score
            score += 10;
            scoreDisplay.textContent = score;
            
            // Generate new food
            generateFood();
        } else {
            // Remove tail if no food eaten
            snake.pop();
        }
        
        // Update game metrics
        updateGameMetrics();
        
        // Update timers
        const currentTime = Date.now();
        const gameTimeSeconds = Math.floor((currentTime - gameStartTime) / 1000);
        timeDisplay.textContent = gameTimeSeconds;
        
        // Calculate time since last move
        lastMoveTime = currentTime;
    }
    
    // Update metrics for risk analysis
    function updateGameMetrics() {
        // Increment total frames counter
        gameMetrics.totalFrames++;
        
        // Check wall proximity
        const head = snake[0];
        const isNearWall = 
            head.x <= WALL_PROXIMITY_THRESHOLD || 
            head.x >= GRID_WIDTH - WALL_PROXIMITY_THRESHOLD - 1 ||
            head.y <= WALL_PROXIMITY_THRESHOLD || 
            head.y >= GRID_HEIGHT - WALL_PROXIMITY_THRESHOLD - 1;
            
        if (isNearWall) {
            gameMetrics.wallProximityFrames++;
        }
        
        // Check for risky movements near body
        let nearMiss = false;
        let riskyMove = false;
        
        // Skip the head and the first body segment
        for (let i = 2; i < snake.length; i++) {
            const segment = snake[i];
            const distance = Math.abs(head.x - segment.x) + Math.abs(head.y - segment.y);
            
            // Very close to body (near miss)
            if (distance <= 1) {
                nearMiss = true;
            } 
            // Close to body (risky)
            else if (distance <= BODY_PROXIMITY_THRESHOLD) {
                riskyMove = true;
            }
        }
        
        if (nearMiss) {
            gameMetrics.nearMisses++;
        }
        
        if (riskyMove) {
            gameMetrics.riskyBodyMovements++;
        }
        
        // Update metrics display
        updateMetricsDisplay();
    }
    
    // Update the metrics display elements
    function updateMetricsDisplay() {
        // Calculate wall proximity percentage
        const wallProximityPercentage = gameMetrics.totalFrames > 0 
            ? Math.round((gameMetrics.wallProximityFrames / gameMetrics.totalFrames) * 100) 
            : 0;
            
        // Calculate average decision time
        const avgDecisionTime = gameMetrics.decisionTimes.length > 0
            ? Math.round(gameMetrics.decisionTimes.reduce((sum, time) => sum + time, 0) / gameMetrics.decisionTimes.length)
            : 0;
            
        // Update display elements
        metricTurns.textContent = gameMetrics.unnecessaryTurns;
        metricWall.textContent = `${wallProximityPercentage}%`;
        metricRisky.textContent = gameMetrics.riskyBodyMovements;
        metricMisses.textContent = gameMetrics.nearMisses;
        metricDecision.textContent = `${avgDecisionTime}ms`;
    }
    
    // Game loop
    function gameLoop() {
        if (!gameActive) return;
        
        update();
        draw();
    }
    
    // Start the game
    function startGame() {
        if (gameActive) return;
        
        // Initialize game
        initGame();
        gameActive = true;
        
        // Hide overlay completely
        gameOverlay.style.display = 'none';
        
        // Enable restart button
        restartButton.disabled = false;
        
        // Start game loop
        gameTimer = setInterval(gameLoop, GAME_SPEED);
        
        // Reset risk profile display
        document.getElementById('risk-profile-details').classList.add('d-none');
        document.getElementById('risk-profile-content').classList.remove('d-none');
        document.getElementById('risk-loading').classList.add('d-none');
        document.getElementById('risk-meter-fill').style.width = '0%';
        
        // Draw the game immediately to make board visible
        draw();
    }
    
    // End the game
    function endGame() {
        if (!gameActive) return;
        
        // Stop game loop
        clearInterval(gameTimer);
        gameActive = false;
        
        // Calculate final metrics
        const finalMetrics = calculateFinalMetrics();
        
        // Show game over overlay with custom message
        gameOverlay.style.display = 'flex';
        gameOverlay.innerHTML = `
            <h2>Game Over</h2>
            <p>Your Score: ${score}</p>
            <p>Time Played: ${Math.floor((Date.now() - gameStartTime) / 1000)}s</p>
            <button id="analyze-button" class="btn btn-primary mb-2">Analyze My Risk Profile</button>
            <button id="play-again-button" class="btn btn-secondary">Play Again</button>
        `;
        
        // Add event listeners to the new buttons
        document.getElementById('analyze-button').addEventListener('click', () => {
            analyzeGameplay(finalMetrics);
        });
        
        document.getElementById('play-again-button').addEventListener('click', startGame);
    }
    
    // Calculate final metrics for analysis
    function calculateFinalMetrics() {
        const gameDuration = Math.floor((Date.now() - gameStartTime) / 1000);
        const wallProximityPercentage = gameMetrics.totalFrames > 0 
            ? Math.round((gameMetrics.wallProximityFrames / gameMetrics.totalFrames) * 100) 
            : 0;
        const avgDecisionTime = gameMetrics.decisionTimes.length > 0
            ? Math.round(gameMetrics.decisionTimes.reduce((sum, time) => sum + time, 0) / gameMetrics.decisionTimes.length)
            : 0;
            
        return {
            score,
            gameDuration,
            unnecessaryTurns: gameMetrics.unnecessaryTurns,
            wallProximityPercentage,
            riskyBodyMovements: gameMetrics.riskyBodyMovements,
            nearMisses: gameMetrics.nearMisses,
            avgDecisionTime
        };
    }
    
    // Send gameplay data to backend for analysis
    function analyzeGameplay(metrics) {
        // Show loading spinner
        document.getElementById('risk-profile-content').classList.add('d-none');
        document.getElementById('risk-loading').classList.remove('d-none');
        
        // Make API request to backend
        fetch('/analyze_gameplay', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ metrics })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update risk meter and display analysis
                displayRiskProfile(data.riskProfile);
            } else {
                // Show error
                alert('Error analyzing gameplay: ' + data.error);
                document.getElementById('risk-profile-content').classList.remove('d-none');
                document.getElementById('risk-loading').classList.add('d-none');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error connecting to server. Please try again.');
            document.getElementById('risk-profile-content').classList.remove('d-none');
            document.getElementById('risk-loading').classList.add('d-none');
        });
    }
    
    // Event listeners for game controls
    function setupEventListeners() {
        // Start button
        startButton.addEventListener('click', startGame);
        
        // Restart button
        restartButton.addEventListener('click', startGame);
        
        // Keyboard controls
        document.addEventListener('keydown', event => {
            if (!gameActive) return;
            
            // Record time for decision time metric
            const currentTime = Date.now();
            if (gameMetrics.lastKeyPressTime > 0) {
                const decisionTime = currentTime - gameMetrics.lastKeyPressTime;
                gameMetrics.decisionTimes.push(decisionTime);
            }
            gameMetrics.lastKeyPressTime = currentTime;
            
            // Previous direction before change
            const previousDirection = nextDirection;
            
            // Handle direction changes
            switch (event.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (direction !== 'down') {
                        nextDirection = 'up';
                    }
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (direction !== 'up') {
                        nextDirection = 'down';
                    }
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (direction !== 'right') {
                        nextDirection = 'left';
                    }
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (direction !== 'left') {
                        nextDirection = 'right';
                    }
                    break;
            }
            
            // Check for unnecessary turns (changing direction when not needed)
            if (previousDirection !== nextDirection) {
                // Check if the player is changing direction unnecessarily
                // (turning when there's a clear path ahead)
                const head = snake[0];
                let unnecessaryTurn = false;
                
                // Check if turning when there's no obstacle ahead
                if (previousDirection === 'right' && head.x < GRID_WIDTH - 3) {
                    unnecessaryTurn = true;
                } else if (previousDirection === 'left' && head.x > 2) {
                    unnecessaryTurn = true;
                } else if (previousDirection === 'up' && head.y > 2) {
                    unnecessaryTurn = true;
                } else if (previousDirection === 'down' && head.y < GRID_HEIGHT - 3) {
                    unnecessaryTurn = true;
                }
                
                // Check if food is straight ahead
                if (unnecessaryTurn) {
                    if (previousDirection === 'right' && food && food.y === head.y && food.x > head.x) {
                        unnecessaryTurn = false;
                    } else if (previousDirection === 'left' && food && food.y === head.y && food.x < head.x) {
                        unnecessaryTurn = false;
                    } else if (previousDirection === 'up' && food && food.x === head.x && food.y < head.y) {
                        unnecessaryTurn = false;
                    } else if (previousDirection === 'down' && food && food.x === head.x && food.y > head.y) {
                        unnecessaryTurn = false;
                    }
                }
                
                // Increment counter if the turn is unnecessary
                if (unnecessaryTurn) {
                    gameMetrics.unnecessaryTurns++;
                    updateMetricsDisplay();
                }
            }
        });
    }

    // Initialize the game
    function init() {
        // Draw initial state
        draw();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Initialize the game
    init();
});
