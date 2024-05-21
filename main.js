// Get the canvas element and its 2D context
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let frames = 0; // Initialize the frame counter
const DEGREE = Math.PI / 180; // Convert degrees to radians

// Load the bird images for different states
const birdImages = {
    upflap: new Image(),
    midflap: new Image(),
    downflap: new Image()
};

// Set the sources for the bird images
birdImages.upflap.src = "/assets/bluebird-upflap.png";
birdImages.midflap.src = "/assets/bluebird-midflap.png";
birdImages.downflap.src = "/assets/bluebird-downflap.png";

// Load the "Get Ready" and "Game Over" images
const getReadyImage = new Image();
getReadyImage.src = "/assets/message.png";

const gameOverImage = new Image();
gameOverImage.src = "/assets/gameover.jpg";

// Load the ground image
const groundImage = new Image();
groundImage.src = "/assets/sol.png";

// Load the background image
const backgroundImage = new Image();
backgroundImage.src = "/assets/background-day.jpg";

// Load the pipe image
const pipeImage = new Image();
pipeImage.src = "/assets/pipe-green.png";

// Load the digit images
const digits = [];
for (let i = 0; i <= 9; i++) {
    digits[i] = new Image();
    digits[i].src = `/nombres/${i}.png`;
}

// Object to manage the score
const score = {
    value: 0,
    best: parseInt(localStorage.getItem("bestScore")) || 0,
    draw: function() {
        let scoreStr = this.value.toString();
        let totalWidth = scoreStr.length * digits[0].width; // Total width of the score
        let x = (canvas.width - totalWidth) / 2; // Center positioning

        for (let i = 0; i < scoreStr.length; i++) {
            let digit = parseInt(scoreStr[i]);
            ctx.drawImage(digits[digit], x, 50); // Position the digits at the top center
            x += digits[digit].width; // Move right for the next digit
        }
    },
    showGameOver: function() {
        // Update the scores in the HTML score table
        document.getElementById("currentScore").textContent = this.value;
        document.getElementById("bestScore").textContent = this.best;

        // Get the position of the "Game Over" image
        const gameOverRect = {
            x: (canvas.width - gameOverImage.width) / 2,
            y: (canvas.height - gameOverImage.height) / 2,
            width: gameOverImage.width,
            height: gameOverImage.height
        };

        // Position the score table just below the "Game Over" image
        const scoreboard = document.getElementById("scoreboard");
        scoreboard.style.left = `${gameOverRect.x + gameOverRect.width / 2}px`;
        scoreboard.style.top = `${gameOverRect.y + gameOverRect.height + 10}px`;
        scoreboard.style.transform = "translateX(-50%)";

        // Show the score table
        scoreboard.style.display = "block";
    },
    hideGameOver: function() {
        // Hide the score table
        document.getElementById("scoreboard").style.display = "none";
    },
    reset: function() {
        if (this.value > this.best) {
            this.best = this.value;
            localStorage.setItem("bestScore", this.best);
        }
        this.value = 0;
    }
}

// Game state object
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
}

// Game control with the space bar
document.addEventListener("keydown", function(evt){
    if(evt.code === "Space"){
        switch(state.current){
            case state.getReady:
                state.current = state.game;
                break;
            case state.game:
                bird.flap();
                break;
            case state.over:
                state.current = state.getReady;
                bird.reset();
                pipes.reset();
                score.reset();
                score.hideGameOver();
                break;
        }
    }
});

// Object representing the bird
const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 34,
    height: 24,
    gravity: 0.1, // Reduce gravity
    jump: 4, // Adjust jump height
    speed: 0,
    rotation: 0,
    frame: 0,
    image: birdImages.midflap,
    
    draw: function(){
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
        ctx.restore();
    },
    
    flap: function(){
        this.speed = -this.jump;
        this.image = birdImages.upflap;
    },
    
    update: function(){
        if(state.current === state.getReady){
            this.y = canvas.height / 2;
            this.rotation = 0;
            this.image = birdImages.midflap;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;
            
            // Check if the bird goes off the top of the screen
            if(this.y - this.height / 2 <= 0){
                this.y = this.height / 2;
                if(state.current === state.game){
                    state.current = state.over;
                    score.showGameOver();
                }
            }
            
            // Check if the bird touches the ground
            if(this.y + this.height / 2 >= canvas.height - 40){
                this.y = canvas.height - 40 - this.height / 2;
                if(state.current === state.game){
                    state.current = state.over;
                    score.showGameOver();
                }
            }

            // Collision detection with pipes
            for(let i = 0; i < pipes.position.length; i++){
                let p = pipes.position[i];
                
                let topPipeYPos = p.y;
                let bottomPipeYPos = p.y + pipes.height + pipes.gap;
                
                if(this.x + this.width / 2 > p.x && this.x - this.width / 2 < p.x + pipes.width && 
                   (this.y + this.height / 2 > topPipeYPos && this.y - this.height / 2 < topPipeYPos + pipes.height || 
                    this.y + this.height / 2 > bottomPipeYPos && this.y - this.height / 2 < bottomPipeYPos + pipes.height)){
                    state.current = state.over;
                    score.showGameOver();
                }

                // Check if the bird passes a pipe without going through
                if(p.x + pipes.width < this.x && p.x + pipes.width + pipes.dx > this.x){
                    if(this.y < topPipeYPos + pipes.height || this.y > bottomPipeYPos){
                        state.current = state.over;
                        score.showGameOver();
                    }
                }
                
                // Check if the bird passes between the pipes
                if (p.x + pipes.width === this.x) {
                    score.value++;
                }
            }
            
            if(this.speed >= this.jump){
                this.rotation = 90 * DEGREE;
                this.image = birdImages.downflap;
            } else if (this.speed >= 0){
                this.rotation = 0;
                this.image = birdImages.midflap;
            } else {
                this.rotation = -25 * DEGREE;
                this.image = birdImages.upflap;
            }
        }
    },
    
    reset: function(){
        this.speed = 0;
        this.y = canvas.height / 2;
        this.image = birdImages.midflap;
    }
}

// Representing the pipes
const pipes = {
    position: [],
    
    width: 50,
    height: canvas.height / 2,
    gap: 150, // Increase the gap between pipes
    maxYPos: -150,
    dx: 2,
    
    draw: function(){
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            
            let topYPos = p.y;
            let bottomYPos = p.y + this.height + this.gap;
            
            ctx.drawImage(pipeImage, p.x, topYPos, this.width, this.height);
            ctx.drawImage(pipeImage, p.x, bottomYPos, this.width, this.height);
        }
    },
    
    update: function(){
        if(state.current !== state.game) return;
        
        if(frames % 150 === 0){
            this.position.push({
                x: canvas.width,
                y: this.maxYPos * (Math.random() + 1)
            });
        }
        
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];
            
            p.x -= this.dx;
            
            if(p.x + this.width <= 0){
                this.position.shift();
            }
        }
    },
    
    reset: function(){
        this.position = [];
    }
}

// Foreground
const fg = {
    x: 0,
    y: canvas.height - 40,
    width: canvas.width,
    height: 40,
    dx: 1.5, // Slow down the ground speed
    draw: function(){
        ctx.drawImage(groundImage, this.x, this.y, this.width, this.height);
        ctx.drawImage(groundImage, this.x + this.width, this.y, this.width, this.height);
    },
    
    update: function(){
        if(state.current === state.game){
            this.x = (this.x - this.dx) % (this.width / 2);
        }
    }
}

// Draw all game elements
function draw(){
    ctx.fillStyle = "#70c5ce";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height); // Draw the background first
    bird.draw();
    pipes.draw();
    fg.draw();
    
    if(state.current === state.getReady){
        ctx.drawImage(getReadyImage, (canvas.width - getReadyImage.width) / 2, (canvas.height - getReadyImage.height) / 2);
    }
    
    if(state.current === state.over){
        ctx.drawImage(gameOverImage, (canvas.width - gameOverImage.width) / 2, (canvas.height - gameOverImage.height) / 2);
    }
    
    if(state.current === state.game){
        score.draw();
    }
}

// Update all game elements
function update(){
    bird.update();
    pipes.update();
    fg.update();
}

// Main game loop
function loop(){
    update();
    draw();
    frames++;
    
    requestAnimationFrame(loop);
}
loop(); // Game loop
