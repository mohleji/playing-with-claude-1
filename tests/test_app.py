import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_index_returns_200(client):
    response = client.get("/")
    assert response.status_code == 200


def test_index_contains_game_links(client):
    response = client.get("/")
    html = response.data.decode()
    assert "/game/tictactoe" in html
    assert "/game/snake" in html


def test_index_contains_game_names(client):
    response = client.get("/")
    html = response.data.decode()
    assert "Tic-Tac-Toe" in html
    assert "Snake" in html


def test_game_tictactoe_returns_200(client):
    response = client.get("/game/tictactoe")
    assert response.status_code == 200


def test_game_snake_returns_200(client):
    response = client.get("/game/snake")
    assert response.status_code == 200


def test_game_hangman_returns_200(client):
    response = client.get("/game/hangman")
    assert response.status_code == 200


def test_index_contains_hangman_link(client):
    response = client.get("/")
    html = response.data.decode()
    assert "/game/hangman" in html


def test_index_contains_hangman_name(client):
    response = client.get("/")
    html = response.data.decode()
    assert "Hangman" in html


def test_game_pingpong_returns_200(client):
    response = client.get("/game/pingpong")
    assert response.status_code == 200


def test_index_contains_pingpong_link(client):
    response = client.get("/")
    html = response.data.decode()
    assert "/game/pingpong" in html


def test_index_contains_pingpong_name(client):
    response = client.get("/")
    html = response.data.decode()
    assert "Ping Pong" in html


def test_game_invalid_slug_returns_404(client):
    response = client.get("/game/doesnotexist")
    assert response.status_code == 404


def test_game_path_traversal_returns_404(client):
    response = client.get("/game/../../etc/passwd")
    assert response.status_code == 404
