const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Costanti del gioco
const GRAVITY = 0.6;
const FLAP = -8;  // Salto meno alto
const SPAWN_RATE = 90; // Frequenza dei tubi (in ms)

// Variabili del gioco
let birdY = canvas.height / 2;
let birdVelocity = 0;
let birdWidth = 30;
let birdHeight = 30;
let isFlapping = false;
let isGameOver = false;
let pipes = [];
let pipeWidth = 50;
let gap = 200; // Distanza tra i tubi (iniziale)
let score = 0;
let highScore = 0;  // Nuova variabile per il miglior punteggio
let isGameStarted = false;  // Variabile per controllare se il gioco è iniziato

// Carica l'immagine dell'uccellino
const birdImage = new Image();
birdImage.src = 'uccello.png'; // Assicurati che l'immagine uccello.png sia nella stessa cartella del codice

// Carica la gif "loser.gif"
const loserGif = new Image();
loserGif.src = 'loser.gif'; // Assicurati che la gif loser.gif sia nella stessa cartella del codice

// Gestire il movimento dell'uccellino
document.addEventListener('keydown', function (e) {
    if (e.code === 'Space' && !isGameStarted) {
        // Avvia il gioco premendo la barra spaziatrice
        isGameStarted = true;
        document.getElementById('startMessage').style.display = 'none'; // Rimuove il messaggio di avvio
        updateGame();
    }

    if (e.code === 'Space' && !isGameOver && isGameStarted) {
        // Fai saltare l'uccellino solo quando il gioco è in corso
        isFlapping = true;
    }

    if (e.code === 'KeyR' && isGameOver) {
        // Resetta il gioco quando il gioco è finito e premi R
        restartGame();
    }
});

// Funzione per aggiornare la posizione dell'uccellino
function updateBird() {
    if (isFlapping) {
        birdVelocity = FLAP;
        isFlapping = false;
    }
    birdVelocity += GRAVITY;
    birdY += birdVelocity;

    // Limita il movimento dell'uccellino ai bordi
    if (birdY < 0) birdY = 0;
    if (birdY > canvas.height - birdHeight) {
        birdY = canvas.height - birdHeight;
        gameOver();
    }
}

// Funzione per creare e muovere i tubi
function updatePipes() {
    if (isGameOver) return;

    if (pipes.length === 0 || pipes[pipes.length - 1].x <= canvas.width - SPAWN_RATE) {
        let previousPipe = pipes[pipes.length - 1];

        let newTopHeight;
        if (previousPipe) {
            newTopHeight = Math.floor(previousPipe.top + (Math.random() * 60 - 30)); 
            newTopHeight = Math.max(50, Math.min(newTopHeight, canvas.height - gap - 50)); 
        } else {
            newTopHeight = Math.floor(Math.random() * (canvas.height - gap - 100) + 50);
        }

        let newBottomHeight = newTopHeight + gap;

        pipes.push({
            x: canvas.width,
            top: newTopHeight,
            bottom: newBottomHeight
        });
    }

    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x -= 2; 

        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
            score++;
        }

        if (pipes[i].x < 50 + birdWidth && pipes[i].x + pipeWidth > 50) {
            if (birdY < pipes[i].top || birdY + birdHeight > pipes[i].bottom) { 
                gameOver();
            }
        }
    }
}

// Funzione per disegnare l'uccellino
function drawBird() {
    ctx.drawImage(birdImage, 50, birdY, birdWidth, birdHeight); 
}

// Funzione per disegnare i tubi
function drawPipes() {
    ctx.fillStyle = 'green';
    for (let i = 0; i < pipes.length; i++) {
        ctx.fillRect(pipes[i].x, 0, pipeWidth, pipes[i].top);
        ctx.fillRect(pipes[i].x, pipes[i].bottom, pipeWidth, canvas.height - pipes[i].bottom);
    }
}

// Funzione per disegnare il punteggio
function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText('Score: ' + score, 10, 30);
    ctx.fillText('Best Score: ' + highScore, canvas.width - 150, 30); 
}

// Funzione per gestire il Game Over
function gameOver() {
    isGameOver = true;
    document.getElementById('gameOverMessage').style.display = 'block';
    
    if (score > highScore) {
        highScore = score;
        sendScoreToServer(highScore);
    }

    document.getElementById('bestScore').textContent = 'Miglior punteggio: ' + highScore;

    // Visualizza la gif di game over
    drawLoserGif();
}

// Funzione per disegnare la gif di game over
function drawLoserGif() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Pulisce il canvas
    ctx.drawImage(loserGif, 0, 0, canvas.width, canvas.height); // Disegna la gif che occupa tutto il canvas
}

// Funzione per resettare il gioco
function restartGame() {
    birdY = canvas.height / 2;
    birdVelocity = 0;
    pipes = [];
    score = 0;
    isGameOver = false;
    isGameStarted = false;
    document.getElementById('gameOverMessage').style.display = 'none';
    document.getElementById('startMessage').style.display = 'block'; 
}

// Funzione per inviare il punteggio al server
function sendScoreToServer(score) {
    fetch('http://localhost:5000/submit_score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ score: score })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Score saved:', data);
        getHighScore();
    })
    .catch((error) => console.error('Error:', error));
}

// Funzione per aggiornare il gioco
function updateGame() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateBird();
    updatePipes();
    drawBird();
    drawPipes();
    drawScore();

    requestAnimationFrame(updateGame);
}

// Inizializza il gioco
window.onload = function() {
    birdImage.onload = function() {
        getHighScore(); 
        displayHighScore(); 
        document.getElementById('startMessage').style.display = 'block';
    };
};
