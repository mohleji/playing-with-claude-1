import os

from flask import Flask, render_template, abort

app = Flask(__name__)

VALID_GAMES = {'tictactoe', 'snake', 'hangman'}


@app.route("/")
def index() -> str:
    games = [
        {
            "name": "Tic-Tac-Toe",
            "slug": "tictactoe",
            "description": "Classic two-player strategy game",
            "icon": "tictactoe.svg",
        },
        {
            "name": "Snake",
            "slug": "snake",
            "description": "Guide the snake and eat to grow",
            "icon": "snake.svg",
        },
        {
            "name": "Hangman",
            "slug": "hangman",
            "description": "Guess the hidden word letter by letter",
            "icon": "hangman.svg",
        },
    ]
    return render_template("index.html", games=games)


@app.route("/game/<slug>")
def game(slug: str) -> str:
    if slug not in VALID_GAMES:
        abort(404)
    return render_template(f"{slug}.html")


if __name__ == "__main__":
    app.run(debug=True, port=int(os.environ.get("PORT", 5001)))
