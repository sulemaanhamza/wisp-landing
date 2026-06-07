/* Wisp landing — tiny vanilla JS.
   Two jobs:
     1. Three-state theme cycle (system → light → dark → system)
        that mirrors Wisp itself, persisted in localStorage.
     2. Resolve the latest release URL from GitHub Releases API so
        the Download button goes straight to the .zip. Falls back
        to the /releases page if the API is unreachable.
*/

(function () {
    'use strict';

    const html = document.documentElement;
    const STORAGE_KEY = 'wisp-landing-theme';
    const cycle = ['system', 'light', 'dark'];

    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) { /* private mode */ }
    }

    function initTheme() {
        let saved = null;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (_) { /* ignore */ }
        applyTheme(cycle.includes(saved) ? saved : 'system');
    }

    function nextTheme() {
        const current = html.getAttribute('data-theme') || 'system';
        const idx = cycle.indexOf(current);
        return cycle[(idx + 1) % cycle.length];
    }

    function attachThemeToggle() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        toggle.addEventListener('click', () => {
            const next = nextTheme();
            applyTheme(next);
            toggle.title = `Theme: ${next} — click to cycle`;
        });
    }

    /* ---------- Download URL resolution ---------- */

    const RELEASES_PAGE = 'https://github.com/sulemaanhamza/wisp/releases/latest';
    const API_URL = 'https://api.github.com/repos/sulemaanhamza/wisp/releases/latest';

    async function resolveDownload() {
        const buttons = [
            document.getElementById('downloadBtn'),
            document.getElementById('downloadBtn2'),
        ].filter(Boolean);
        const metaEl = document.getElementById('downloadMeta');

        // Fallback in place from HTML — buttons point to '#'. Replace with
        // the releases page as a baseline.
        buttons.forEach(b => b.href = RELEASES_PAGE);

        try {
            const res = await fetch(API_URL, {
                headers: { 'Accept': 'application/vnd.github+json' }
            });
            if (!res.ok) return;
            const data = await res.json();
            const tag = data.tag_name || '';
            const asset = (data.assets || []).find(a => a.name && a.name.endsWith('.zip'));
            if (asset && asset.browser_download_url) {
                buttons.forEach(b => b.href = asset.browser_download_url);
            }
            if (metaEl && tag) {
                metaEl.textContent = tag + ' · macOS 13+';
            }
        } catch (_) {
            /* Network issue — buttons keep the releases-page fallback. */
        }
    }

    /* ---------- Scroll reveal (subtle) ---------- */

    function attachReveal() {
        if (!('IntersectionObserver' in window)) return;
        const els = document.querySelectorAll('.feature, .install-method, .trust-item');
        els.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(12px)';
            el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
        });
        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
        els.forEach(el => io.observe(el));
    }

    /* ---------- Boot ---------- */

    initTheme();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            attachThemeToggle();
            resolveDownload();
            attachReveal();
        });
    } else {
        attachThemeToggle();
        resolveDownload();
        attachReveal();
    }
})();
