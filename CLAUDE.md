# CLAUDE.md — Project Guidelines

## Project Overview
A Python (Flask) web app serving browser-based games. The landing page lists available games; each game runs client-side in vanilla HTML/CSS/JavaScript.

## Tech Stack
- **Backend:** Python 3.11+, Flask
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Games:** HTML5 Canvas / DOM-based, no external JS frameworks

## Code Standards

### Python
- Follow PEP 8 for formatting and naming conventions
- Use type hints for function signatures
- Keep Flask routes thin — no business logic in route handlers
- Use f-strings for string formatting
- Maximum line length: 120 characters

### JavaScript
- Use `const` by default, `let` when reassignment is needed, never `var`
- Use strict equality (`===` / `!==`)
- Name functions and variables in camelCase, classes in PascalCase
- Keep game logic separated from rendering logic
- Use `requestAnimationFrame` for game loops (not `setInterval`)
- Add keyboard event cleanup on page unload

### HTML / CSS
- Use semantic HTML elements (`<main>`, `<section>`, `<nav>`, etc.)
- Use CSS custom properties (variables) for theming (colors, spacing)
- Mobile-responsive design using flexbox/grid
- BEM-style class naming: `.block__element--modifier`

## Testing

### Python Tests
- Use `pytest` as the test runner
- Place tests in a `tests/` directory, mirroring source structure
- Name test files `test_<module>.py`
- Test each route returns correct status codes and templates
- Run: `pytest tests/ -v`

### JavaScript Tests
- Each game should have a corresponding test file in `static/js/tests/`
- Test core game logic (win conditions, collision detection, scoring)
- Keep tests independent of DOM/rendering where possible

### General Testing Principles
- Write tests for business logic and edge cases, not trivial getters/setters
- Each test should test one behavior
- Use descriptive test names: `test_<what>_<condition>_<expected>`
- Aim for tests that are fast, isolated, and deterministic

## Git Workflow
- `main` branch contains stable, reviewed code
- Feature branches: `feature/<game-name>` or `feature/<description>`
- Write clear commit messages: imperative mood, explain "why" not "what"
- One logical change per commit
- All features go through pull requests with review before merging

## Project Structure
```
playing-with-claude-1/
├── CLAUDE.md
├── app.py                  # Flask application
├── requirements.txt        # Python dependencies
├── tests/                  # Python tests
│   └── test_app.py
├── static/
│   ├── css/
│   │   └── style.css       # Shared styles
│   ├── js/
│   │   ├── tictactoe.js    # Tic-tac-toe game
│   │   ├── snake.js        # Snake game
│   │   └── tests/          # JS game tests
│   └── images/             # Game icons and assets
└── templates/
    ├── index.html           # Landing page
    ├── tictactoe.html       # Tic-tac-toe page
    └── snake.html           # Snake page
```

## Running the App
```bash
pip install -r requirements.txt
python app.py
# Open http://localhost:5000
```
