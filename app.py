from flask import Flask, render_template, abort

app = Flask(__name__)

VALID_GAMES = {'tictactoe', 'snake'}


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
    ]
    return render_template("index.html", games=games)


@app.route("/game/<slug>")
def game(slug: str) -> str:
    if slug not in VALID_GAMES:
        abort(404)
    return render_template(f"{slug}.html")


if __name__ == "__main__":
    app.run(debug=True, port=5001)
