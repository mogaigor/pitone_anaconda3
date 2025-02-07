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
let gap = 200; // Distanza tra i tubi
let score = 0;
let highScore = 0;  // Nuova variabile per il miglior punteggio
let isGameStarted = false;  // Variabile per controllare se il gioco è iniziato

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

    // Se l'array pipes è vuoto o il tubo precedente ha raggiunto una certa posizione
    if (pipes.length === 0 || pipes[pipes.length - 1].x <= canvas.width - SPAWN_RATE) {
        let pipeHeight = Math.floor(Math.random() * (canvas.height - gap));
        pipes.push({
            x: canvas.width,
            top: pipeHeight,
            bottom: pipeHeight + gap
        });
    }

    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x -= 2; // Spostamento dei tubi

        // Rimuove i tubi che sono usciti dallo schermo
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
            score++;
        }

        // Verifica la collisione
        if (
            pipes[i].x < 50 + birdWidth && pipes[i].x + pipeWidth > 50 // Se l'uccellino è vicino ai tubi orizzontalmente
        ) {
            if (birdY < pipes[i].top || birdY + birdHeight > pipes[i].bottom) { // Se l'uccellino è fuori dai limiti del buco
                gameOver();
            }
        }
    }
}

// Funzione per disegnare l'uccellino
function drawBird() {
    ctx.fillStyle = 'yellow';
    ctx.fillRect(50, birdY, birdWidth, birdHeight);
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
    ctx.fillText('Best Score: ' + highScore, canvas.width - 150, 30);  // Visualizza il miglior punteggio
}

// Funzione per gestire il Game Over
function gameOver() {
    isGameOver = true;
    document.getElementById('gameOverMessage').style.display = 'block';
    
    // Aggiorna il miglior punteggio se il punteggio attuale è maggiore
    if (score > highScore) {
        highScore = score;
    }

    // Visualizza il miglior punteggio
    document.getElementById('bestScore').textContent = 'Miglior punteggio: ' + highScore;

    // Invia il punteggio al server quando il gioco termina
    sendScoreToServer(score);
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
    document.getElementById('startMessage').style.display = 'block'; // Mostra il messaggio di "Premi spazio per iniziare"
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
        getHighScores(); // Recupera e visualizza la classifica
    })
    .catch((error) => console.error('Error:', error));
}

// Funzione per ottenere i punteggi più alti dal server
function getHighScores() {
    fetch('http://localhost:5000/get_high_scores')
        .then(response => response.json())
        .then(data => {
            displayHighScores(data);
        })
        .catch((error) => console.error('Error:', error));
}

// Funzione per visualizzare i punteggi più alti
function displayHighScores(scores) {
    let highScoresList = document.getElementById('highScoresList');
    highScoresList.innerHTML = ''; // Pulisce la lista precedente

    scores.forEach((score, index) => {
        let li = document.createElement('li');
        li.textContent = `#${index + 1}: ${score.score} points`;
        highScoresList.appendChild(li);
    });
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
    document.getElementById('startMessage').style.display = 'block'; // Mostra il messaggio di inizio
    document.getElementById('bestScore').textContent = 'Miglior punteggio: ' + highScore;
};
