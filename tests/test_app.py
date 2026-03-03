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
