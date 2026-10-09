/* Wisp landing — small vanilla JS, no dependencies.
     1. Theme: system → light → dark, remembered in localStorage.
     2. Download buttons point at the latest release's zip (GitHub API),
        falling back to the releases page.
     3. Copy buttons for the Homebrew command.
     4. A gentle reveal as sections scroll in.
     5. The hero plays Wisp in use once. Without script, or with Reduce
        Motion, it simply shows the finished note.
*/
(function () {
    'use strict';

    var root = document.documentElement;
    root.classList.add('js');

    /* ---------- Theme ---------- */

    var KEY = 'wisp-landing-theme';
    var cycle = ['system', 'light', 'dark'];

    function setTheme(theme) {
        root.setAttribute('data-theme', theme);
        try { localStorage.setItem(KEY, theme); } catch (_) { /* private mode */ }
        var toggle = document.getElementById('themeToggle');
        if (toggle) toggle.setAttribute('aria-label', 'Theme: ' + theme + '. Click to change.');
    }

    function initTheme() {
        var saved = null;
        try { saved = localStorage.getItem(KEY); } catch (_) { /* ignore */ }
        setTheme(cycle.indexOf(saved) >= 0 ? saved : 'system');
        var toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        toggle.addEventListener('click', function () {
            var now = root.getAttribute('data-theme') || 'system';
            setTheme(cycle[(cycle.indexOf(now) + 1) % cycle.length]);
        });
    }

    /* ---------- Nav border once scrolled ---------- */

    function initNav() {
        var nav = document.getElementById('nav');
        if (!nav) return;
        var update = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
        update();
        window.addEventListener('scroll', update, { passive: true });
    }

    /* ---------- Download links ---------- */

    function initDownloads() {
        var links = document.querySelectorAll('a.download');
        if (!links.length || !window.fetch) return;
        fetch('https://api.github.com/repos/sulemaanhamza/wisp/releases/latest', {
            headers: { Accept: 'application/vnd.github+json' }
        }).then(function (res) {
            return res.ok ? res.json() : null;
        }).then(function (data) {
            if (!data) return;
            var zip = (data.assets || []).filter(function (a) { return /\.zip$/.test(a.name || ''); })[0];
            if (zip && zip.browser_download_url) {
                links.forEach(function (a) { a.href = zip.browser_download_url; });
            }
            var line = document.getElementById('versionLine');
            if (line && data.tag_name) line.textContent = 'Version ' + data.tag_name.replace(/^v/, '') + ', free and open source';
        }).catch(function () { /* the releases page stays as the fallback */ });
    }

    /* ---------- Copy buttons ---------- */

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
        return new Promise(function (resolve) {
            var area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            try { document.execCommand('copy'); } catch (_) { /* ignore */ }
            document.body.removeChild(area);
            resolve();
        });
    }

    function initCopy() {
        document.querySelectorAll('[data-copy]').forEach(function (button) {
            var state = button.querySelector('.copy-state');
            button.addEventListener('click', function () {
                copyText(button.getAttribute('data-copy')).then(function () {
                    button.classList.add('copied');
                    if (state) state.textContent = 'Copied';
                    clearTimeout(button._t);
                    button._t = setTimeout(function () {
                        button.classList.remove('copied');
                        if (state) state.textContent = 'Copy';
                    }, 1600);
                });
            });
        });
    }

    /* ---------- Reveal ---------- */

    function initReveal() {
        var els = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
        els.forEach(function (el) { io.observe(el); });
    }

    /* ---------- Hero: Wisp in use ---------- */

    var BELL = '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>';
    var TICK = '<svg class="tick" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>';

    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function initHero() {
        var stage = document.getElementById('stage');
        var body = document.getElementById('heroBody');
        var panel = document.getElementById('heroPanel');
        var keys = document.getElementById('heroKeys');
        var tickKeys = document.getElementById('heroTick');
        var toast = document.getElementById('heroToast');
        var clock = document.getElementById('heroClock');
        var words = document.getElementById('heroWords');
        if (!stage || !body || !panel) return;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        var started = false;
        var caret = document.createElement('span');
        caret.className = 'caret';

        function countWords() {
            var text = '';
            body.querySelectorAll('.l').forEach(function (line) {
                line.childNodes.forEach(function (n) {
                    if (n.nodeType === 3) text += n.textContent + ' ';
                    else if (n.classList && !n.classList.contains('lab') && !n.classList.contains('ans') && !n.classList.contains('syn')) text += n.textContent + ' ';
                });
            });
            var n = (text.match(/[A-Za-z0-9]+/g) || []).length;
            if (words) words.textContent = n + (n === 1 ? ' word' : ' words');
        }

        function newLine(cls) {
            var p = document.createElement('p');
            p.className = 'l' + (cls ? ' ' + cls : '');
            p.appendChild(caret);
            body.appendChild(p);
            return p;
        }

        // Type `text` into `line`, in a span of class `cls` (or plain text).
        async function type(line, text, cls, speed) {
            var target;
            if (cls) {
                target = document.createElement('span');
                target.className = cls;
                line.insertBefore(target, caret);
            } else {
                target = document.createTextNode('');
                line.insertBefore(target, caret);
            }
            for (var i = 0; i < text.length; i++) {
                target.textContent += text[i];
                countWords();
                var ch = text[i];
                await sleep((speed || 42) + Math.random() * 38 + (ch === ' ' ? 20 : 0));
            }
            return target;
        }

        function press(el) {
            el.classList.add('shown');
            return sleep(380).then(function () {
                el.classList.add('pressed');
                return sleep(170);
            }).then(function () {
                el.classList.remove('pressed');
                return sleep(420);
            }).then(function () {
                el.classList.remove('shown');
            });
        }

        async function play() {
            stage.classList.add('playing');
            body.innerHTML = '';
            panel.classList.remove('shown');
            if (toast) toast.classList.remove('shown');
            if (clock) clock.textContent = 'Fri 2:41 PM';
            countWords();

            await sleep(500);
            await press(keys);
            panel.classList.add('shown');
            await sleep(520);

            var heading = newLine('h');
            await type(heading, '# ', 'syn', 70);
            await type(heading, 'Friday', null, 70);
            await sleep(260);

            var task = newLine();
            var taskBox = await type(task, '- [ ] ', 'syn');
            var taskText = await type(task, 'Book flights');
            await sleep(240);

            var sum = newLine();
            await type(sum, 'Flights 2 × 340 + 45 =');
            await sleep(240);
            var ans = document.createElement('span');
            ans.className = 'ans fade-in';
            ans.textContent = ' 725';
            sum.insertBefore(ans, caret);
            await sleep(700);

            var remind = newLine();
            await type(remind, 'Remind me at 3pm');
            var label = document.createElement('span');
            label.className = 'lab fade-in';
            label.textContent = '→ 3:00 PM';
            remind.appendChild(label);
            await sleep(320);
            await type(remind, ' to call John');
            await sleep(380);
            // Return: the line is finished, and the reminder is set.
            label.innerHTML = BELL + '3:00 PM';
            label.classList.remove('fade-in');
            void label.offsetWidth;
            label.classList.add('fade-in');
            newLine();
            await sleep(700);

            // ⌘L ticks the first task off.
            if (tickKeys) await press(tickKeys);
            taskBox.textContent = '- [x] ';
            var struck = document.createElement('s');
            struck.textContent = taskText.textContent;
            task.replaceChild(struck, taskText);
            task.classList.add('done');
            countWords();
            await sleep(1100);

            // Later: the reminder arrives.
            if (clock) clock.textContent = 'Fri 3:00 PM';
            if (toast) toast.classList.add('shown');
            await sleep(500);
            label.innerHTML = TICK + 'sent 3:00 PM';
        }

        function start() {
            if (started) return;
            started = true;
            play();
        }

        // Hidden straight away, so the end state never flashes first.
        stage.classList.add('playing');
        panel.classList.remove('shown');
        if (!('IntersectionObserver' in window)) { start(); return; }
        var io = new IntersectionObserver(function (entries) {
            if (entries.some(function (e) { return e.isIntersecting; })) {
                io.disconnect();
                start();
            }
        }, { threshold: 0.15 });
        io.observe(stage);
    }

    /* ---------- Boot ---------- */

    function boot() {
        var year = document.getElementById('year');
        if (year) year.textContent = new Date().getFullYear();
        initNav();
        initDownloads();
        initCopy();
        initReveal();
        initHero();
    }

    initTheme();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
