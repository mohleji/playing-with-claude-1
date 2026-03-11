(() => {
    const STORAGE_KEY = 'arcade-theme';
    const root = document.documentElement;

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.textContent = theme === 'light' ? '🌙 Dark' : '☀️ Light';
    }

    function toggleTheme() {
        const current = root.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEY, next);
        applyTheme(next);
    }

    // Apply saved theme before paint to avoid flash
    const saved = localStorage.getItem(STORAGE_KEY) || 'dark';
    applyTheme(saved);

    document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('theme-toggle');
        if (btn) btn.addEventListener('click', toggleTheme);
    });
})();
