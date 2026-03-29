const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

// Standard Tetris shapes
const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    J: [[2,0,0],[2,2,2],[0,0,0]],
    L: [[0,0,3],[3,3,3],[0,0,0]],
    O: [[4,4],[4,4]],
    S: [[0,5,5],[5,5,0],[0,0,0]],
    T: [[0,6,0],[6,6,6],[0,0,0]],
    Z: [[7,7,0],[0,7,7],[0,0,0]]
};

// Colors for blocks
const COLORS = [
    null,
    '#0DC2FF', // I
    '#3877FF', // J
    '#FF8E0D', // L
    '#FFE138', // O
    '#0DFF72', // S
    '#FF0D72', // T
    '#F538FF'  // Z
];

// Game state
let board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
let score = 0, level = 1, linesCleared = 0;
let dropCounter = 0;
let dropInterval = 300; // fast start
let lastTime = 0;
let isTouching = false; // for mobile hold
let mobileSpeedMultiplier = 3;

// Player
const player = {
    pos: {x: 3, y: 0},
    matrix: createPiece(randomShape())
};

function createPiece(type){
    return SHAPES[type];
}

function randomShape(){
    const keys = Object.keys(SHAPES);
    return keys[Math.floor(Math.random()*keys.length)];
}

// Draw a block
function drawBlock(x,y,value){
    if(value){
        ctx.fillStyle = COLORS[value];
        ctx.fillRect(x,y,1,1);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.05;
        ctx.strokeRect(x,y,1,1);
    }
}

// Draw the board and current piece
function draw(){
    ctx.clearRect(0,0,COLS,ROWS);
    board.forEach((row,y)=>{
        row.forEach((value,x)=>{
            drawBlock(x,y,value);
        });
    });
    player.matrix.forEach((row,y)=>{
        row.forEach((value,x)=>{
            if(value) drawBlock(x + player.pos.x, y + player.pos.y, value);
        });
    });
}

// Merge piece into board
function merge(){
    player.matrix.forEach((row,y)=>{
        row.forEach((value,x)=>{
            if(value) board[y + player.pos.y][x + player.pos.x] = value;
        });
    });
}

// Check collision
function collide(){
    const m = player.matrix;
    const o = player.pos;
    for(let y=0;y<m.length;y++){
        for(let x=0;x<m[y].length;x++){
            if(m[y][x] && (board[y+o.y] && board[y+o.y][x+o.x])!==0){
                return true;
            }
        }
    }
    return false;
}

// Clear completed rows
function sweep(){
    let rowCount = 0;
    outer: for(let y=board.length-1; y>=0; y--){
        for(let x=0; x<COLS; x++){
            if(board[y][x] === 0) continue outer;
        }
        rowCount++;
        // flash animation
        for(let i=0;i<6;i++){
            setTimeout(()=>{
                board[y].forEach((_,x)=>board[y][x] = i%2 ? 0 : 8);
            }, i*50);
        }
        const row = board.splice(y,1)[0].fill(0);
        board.unshift(row);
        y++;
    }
    if(rowCount){
        score += rowCount * 100;
        linesCleared += rowCount;
        if(linesCleared % 10 === 0) level++;
        dropInterval = Math.max(50, 300 - (level-1)*30);
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        document.getElementById('lines').textContent = linesCleared;
    }
}

// Rotate piece
function rotate(dir){
    const m = player.matrix;
    for(let y=0;y<m.length;y++){
        for(let x=0;x<y;x++){
            [m[x][y], m[y][x]] = [m[y][x], m[x][y]];
        }
    }
    if(dir>0) m.forEach(row=>row.reverse());
    else m.reverse();
}

// Drop piece
function playerDrop(speedMultiplier = 1){
    for(let i=0;i<speedMultiplier;i++){
        player.pos.y++;
        if(collide()){
            player.pos.y--;
            merge();
            resetPlayer();
            sweep();
            break;
        }
    }
    dropCounter=0;
}

// Reset player
function resetPlayer(){
    player.matrix = createPiece(randomShape());
    player.pos.y = 0;
    player.pos.x = Math.floor(COLS/2) - Math.floor(player.matrix[0].length/2);
    if(collide()){
        board.forEach(row=>row.fill(0));
        score=0; level=1; linesCleared=0;
        dropInterval=300;
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        document.getElementById('lines').textContent = linesCleared;
        alert("Game Over! Alfons resets the board.");
    }
}

// Move piece
function playerMove(dir){
    player.pos.x += dir;
    if(collide()) player.pos.x -= dir;
}

// Game loop
function update(time=0){
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    // mobile fast drop
    const speed = isTouching ? mobileSpeedMultiplier : 1;

    if(dropCounter > dropInterval/speed) playerDrop(speed);

    draw();
    requestAnimationFrame(update);
}

// Keyboard controls for desktop
document.addEventListener('keydown', e=>{
    if(e.key==='ArrowLeft') playerMove(-1);
    if(e.key==='ArrowRight') playerMove(1);
    if(e.key==='ArrowDown') playerDrop();
    if(e.key==='ArrowUp') rotate(1);
});

// Mobile touch controls
canvas.addEventListener('touchstart', e=>{
    e.preventDefault();
    isTouching = true;
    rotate(1); // tap = rotate
});

canvas.addEventListener('touchend', e=>{
    e.preventDefault();
    isTouching = false; // release = normal speed
});

// Start game
update();