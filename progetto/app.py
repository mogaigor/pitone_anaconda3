from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)

# Funzione per connettersi al database
def get_db_connection():
    conn = sqlite3.connect('flappybird.db')
    conn.row_factory = sqlite3.Row
    return conn

# Inizializzare il database
def init_db():
    conn = get_db_connection()
    conn.execute('''CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        score INTEGER
    )''')
    conn.commit()
    conn.close()

# Endpoint per salvare il punteggio
@app.route('/submit_score', methods=['POST'])
def submit_score():
    score = request.json.get('score')

    if score is None:
        return jsonify({"error": "Missing score"}), 400

    conn = get_db_connection()
    conn.execute('INSERT INTO scores (score) VALUES (?)', (score,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Score saved successfully!"}), 200

# Endpoint per ottenere il miglior punte
