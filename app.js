document.addEventListener('DOMContentLoaded', () => {
    // === КОНФИГУРАЦИЯ РАЗМЕРОВ БАЗОВОЙ ПЛИТЫ ===
    const BASE_W = 1440;
    const BASE_H = 900;

    // === СОСТОЯНИЕ ПРИЛОЖЕНИЯ ===
    let text = '';
    let key = '';
    let pendingCipher = null;
    let isBlinking = false;
    let showScanMenu = false;
    let showAgentModal = false;
    let showSpyOverlay = false;

    // === МАССИВ ЗОН КНОПОК (ПОСЕГМЕНТНЫЙ HOVER) ===
    const BUTTONS = [
        { id: 'create', x: 419, y: 290, w: 291, h: 53, action: handleCreate },
        { id: 'scan', x: 1228, y: 291, w: 293, h: 57, action: handleScan },
        { id: 'rules', x: 816, y: 905, w: 301, h: 68, action: () => {} },
        { id: 'back', x: 734, y: 907, w: 71, h: 53, action: () => {} },
        { id: 'save', x: 1124, y: 906, w: 63, h: 66, action: handleSave },
    ];

    // === МАТЕМАТИЧЕСКИЕ МАТРИЦЫ ОРНАМЕНТА (20 ПАТТЕРНОВ) ===
    const PATTERNS = [
        [[0,1,0,1,0,1,0],[1,0,0,0,0,0,1],[0,0,1,1,1,0,0],[1,0,1,1,1,0,1],[0,0,1,1,1,0,0],[1,0,0,0,0,0,1],[0,1,0,1,0,1,0]],
        [[0,1,1,0,1,1,0],[0,1,1,0,1,1,0],[0,1,1,0,1,1,0],[0,1,1,0,1,1,0],[0,1,1,0,1,1,0],[0,1,1,0,1,1,0],[0,1,1,0,1,1,0]],
        [[1,1,1,1,1,1,1],[0,0,0,0,0,0,1],[1,1,1,1,1,0,1],[1,0,0,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]],
        [[1,1,1,1,1,1,1],[1,0,0,0,0,0,0],[1,0,1,1,1,1,1],[1,0,1,0,0,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]],
        [[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,0,1,0,1],[1,0,1,0,0,0,1],[1,0,1,1,1,1,1],[1,0,0,0,0,0,0]],
        [[0,0,0,0,0,1,1],[0,0,0,0,1,1,0],[0,0,0,1,1,0,0],[1,1,1,1,1,1,1],[0,0,0,1,1,0,0],[0,0,0,0,1,1,0],[0,0,0,0,0,1,1]],
        [[1,1,1,1,1,0,0],[1,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,1,1,1,1,1,1],[0,0,0,0,0,0,1],[0,0,0,0,0,0,1],[0,0,1,1,1,1,1]],
        [[0,0,0,0,1,1,1],[0,0,0,1,1,1,0],[0,0,1,1,1,0,0],[0,1,1,1,0,0,0],[1,1,1,0,0,0,0],[1,1,0,0,0,0,0],[1,0,0,0,0,0,0]],
        [[1,1,0,0,0,1,1],[1,1,0,0,0,1,1],[0,0,1,0,1,0,0],[0,0,0,1,0,0,0],[0,0,1,0,1,0,0],[1,1,0,0,0,1,1],[1,1,0,0,0,1,1]],
        [[0,0,0,1,0,0,0],[0,0,1,1,1,0,0],[0,1,1,1,1,1,0],[1,1,1,1,1,1,1],[0,0,0,1,0,0,0],[0,0,0,1,0,0,0],[0,0,0,1,0,0,0]],
        [[1,1,1,1,1,1,0],[1,0,0,0,0,1,0],[1,0,1,1,1,1,0],[1,0,1,0,0,0,0],[1,0,1,1,1,1,1],[1,0,0,0,0,0,0],[1,1,1,1,1,1,1]],
        [[0,0,0,0,0,0,1],[0,0,0,0,0,1,1],[0,0,0,0,1,1,0],[0,0,0,1,1,0,0],[0,0,1,1,0,0,0],[0,1,1,0,0,0,0],[1,1,0,0,0,0,0]],
        [[0,0,0,1,0,0,0],[0,1,1,0,1,1,0],[0,1,1,0,1,1,0],[1,0,0,0,0,0,1],[0,1,1,0,1,1,0],[0,1,1,0,1,1,0],[0,0,0,1,0,0,0]],
        [[1,0,0,0,0,0,1],[0,1,0,0,0,1,0],[0,0,1,0,1,0,0],[0,0,0,1,0,0,0],[0,0,1,0,1,0,0],[0,1,0,0,0,1,0],[1,0,0,0,0,0,1]],
        [[0,0,1,1,1,0,0],[0,0,1,1,1,0,0],[1,1,0,1,0,1,1],[1,1,1,0,1,1,1],[1,1,0,1,0,1,1],[0,0,1,1,1,0,0],[0,0,1,1,1,0,0]],
        [[0,0,1,0,1,0,0],[0,1,0,0,0,1,0],[1,0,0,0,0,0,1],[0,0,0,0,0,0,0],[1,0,0,0,0,0,1],[0,1,0,0,0,1,0],[0,0,1,0,1,0,0]],
        [[0,1,1,0,1,1,0],[1,0,1,0,1,0,1],[1,1,0,0,0,1,1],[0,0,0,1,0,0,0],[1,1,0,0,0,1,1],[1,0,1,0,1,0,1],[0,1,1,0,1,1,0]],
        [[0,1,0,1,0,1,0],[1,1,0,1,0,1,1],[0,0,0,1,0,0,0],[1,1,1,1,1,1,1],[0,0,0,1,0,0,0],[1,1,0,1,0,1,1],[0,1,0,1,0,1,0]],
        [[1,1,1,1,1,1,1],[0,1,1,1,1,1,1],[0,0,1,1,1,1,1],[0,0,0,1,1,1,1],[0,0,0,0,1,1,1],[0,0,0,0,0,1,1],[0,0,0,0,0,0,1]],
        [[0,0,0,0,0,0,0],[1,0,0,0,0,0,0],[1,1,0,0,0,0,0],[1,1,1,0,0,0,0],[1,1,1,1,0,0,0],[1,1,1,1,1,0,0],[1,1,1,1,1,1,0]]
    ];
    const solidBlock = Array.from({ length: 7 }, () => Array(7).fill(1));
    const FILLER_IDX = [0, 8, 13, 16, 17];

    // === ГЛОБАЛЬНЫЕ DOM ЭЛЕМЕНТЫ ===
    const root = document.getElementById('root');
    const wrapper = document.createElement('div');
    const textInput = document.createElement('textarea');
    const keyInput = document.createElement('input');
    const canvas = document.createElement('canvas');
    const galleryImg = document.createElement('img');
    const scanMenu = document.createElement('div');
    const modalAgent = document.createElement('div');
    const modalSpy = document.createElement('div');
    const fileInput = document.createElement('input');
    const lockLeft = document.createElement('div');
    const lockRight = document.createElement('div');

    // === ИНИЦИАЛИЗАЦИЯ СТРУКТУРЫ ===
    function init() {
        setupWrapper();
        setupHoverZones();
        setupLocks();
        setupCenterWindow();
        setupInputs();
        setupModals();
        setupFileInput();
        
        root.appendChild(wrapper);
        handleResize();
        window.addEventListener('resize', handleResize);
        updateUI();
    }

    function setupWrapper() {
        Object.assign(wrapper.style, {
            position: 'relative',
            width: `${BASE_W}px`,
            height: `${BASE_H}px`,
            transformOrigin: 'center center',
            overflow: 'hidden',
            backgroundColor: '#000',
            margin: '0 auto',
            backgroundImage: "url('/004.jpg')",
            backgroundSize: `${BASE_W}px ${BASE_H}px`,
            backgroundRepeat: 'no-repeat'
        });
    }

    function setupHoverZones() {
        BUTTONS.forEach(btn => {
            const zone = document.createElement('div');
            Object.assign(zone.style, {
                position: 'absolute',
                left: `${btn.x}px`,
                top: `${btn.y}px`,
                width: `${btn.w}px`,
                height: `${btn.h}px`,
                cursor: 'pointer',
                zIndex: '10',
                opacity: '0',
                transition: 'opacity 0.15s ease-in-out',
                backgroundImage: "url('/003.jpg')",
                backgroundSize: `${BASE_W}px ${BASE_H}px`,
                backgroundPosition: `-${btn.x}px -${btn.y}px`
            });
            
            zone.addEventListener('mouseenter', () => zone.style.opacity = '1');
            zone.addEventListener('mouseleave', () => zone.style.opacity = '0');
            zone.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.action();
            });
            wrapper.appendChild(zone);
        });
    }

    function setupLocks() {
        const applyLockStyle = (el, position) => {
            Object.assign(el.style, {
                position: 'absolute', top: '400px', width: '150px',
                textAlign: 'center', zIndex: '20', pointerEvents: 'none',
                color: 'white', fontSize: '20px', fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255,255,255,0.5)', fontFamily: 'sans-serif',
                left: position === 'left' ? '100px' : 'auto',
                right: position === 'right' ? '100px' : 'auto'
            });
        };
        applyLockStyle(lockLeft, 'left');
        applyLockStyle(lockRight, 'right');
        wrapper.appendChild(lockLeft);
        wrapper.appendChild(lockRight);
    }

    function setupCenterWindow() {
        const centerWin = document.createElement('div');
        Object.assign(centerWin.style, {
            position: 'absolute', left: '770px', top: '314px',
            width: '390px', height: '390px', backgroundColor: 'rgba(0,0,0,0.6)',
            border: '2px solid rgba(255,255,255,0.1)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: '20', overflow: 'hidden'
        });

        canvas.width = 512;
        canvas.height = 512;
        Object.assign(canvas.style, {
            width: '390px', height: '390px', maxWidth: '100%',
            maxHeight: '100%', opacity: '0', transition: 'opacity 0.3s'
        });
        centerWin.appendChild(canvas);

        Object.assign(galleryImg.style, {
            position: 'absolute', top: '0', left: '0', width: '100%',
            height: '100%', objectFit: 'contain', mixBlendMode: 'color-dodge',
            pointerEvents: 'none', zIndex: '30', display: 'none'
        });
        centerWin.appendChild(galleryImg);

        Object.assign(scanMenu.style, {
            position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.85)', display: 'none', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', gap: '20px', zIndex: '40'
        });
        scanMenu.appendChild(createScanButton('CAMERA', () => {
            showScanMenu = false; updateUI(); alert('CAMERA: Автозапуск отключен по ТЗ');
        }));
        scanMenu.appendChild(createScanButton('GALLERY', handleGallery));
        centerWin.appendChild(scanMenu);

        wrapper.appendChild(centerWin);
    }

    function createScanButton(text, action) {
        const btn = document.createElement('button');
        btn.innerText = text;
        Object.assign(btn.style, {
            padding: '15px 40px', backgroundColor: 'transparent', color: 'white',
            border: '1px solid white', fontSize: '18px', letterSpacing: '2px',
            cursor: 'pointer', transition: '0.2s'
        });
        btn.addEventListener('mouseenter', () => { btn.style.backgroundColor = 'white'; btn.style.color = 'black'; });
        btn.addEventListener('mouseleave', () => { btn.style.backgroundColor = 'transparent'; btn.style.color = 'white'; });
        btn.addEventListener('click', action);
        return btn;
    }

    function setupInputs() {
        const inputContainer = document.createElement('div');
        Object.assign(inputContainer.style, {
            position: 'absolute', bottom: '120px', left: '50%',
            transform: 'translateX(-50%)', width: '600px', zIndex: '30',
            display: 'flex', flexDirection: 'column', gap: '15px'
        });

        const applyInputStyles = (el, isPassword) => {
            Object.assign(el.style, {
                width: '100%', padding: '12px', backgroundColor: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.3)', color: '#0f0',
                fontFamily: 'monospace', fontSize: '16px', outline: 'none',
                boxSizing: 'border-box'
            });
            if (!isPassword) { el.style.height = '60px'; el.style.resize = 'none'; }
            el.addEventListener('focus', () => el.style.borderColor = '#0f0');
            el.addEventListener('blur', () => el.style.borderColor = 'rgba(255,255,255,0.3)');
        };

        textInput.placeholder = 'Текст таємниці / Secret payload...';
        applyInputStyles(textInput, false);
        textInput.addEventListener('input', (e) => { text = e.target.value; updateUI(); });

        keyInput.type = 'password';
        keyInput.placeholder = 'КЛЮЧ / PASSWORD';
        keyInput.maxLength = 12;
        applyInputStyles(keyInput, true);
        keyInput.addEventListener('input', (e) => { key = e.target.value; updateUI(); });
        keyInput.addEventListener('keydown', handleKeyDown);

        inputContainer.appendChild(textInput);
        inputContainer.appendChild(keyInput);
        wrapper.appendChild(inputContainer);
    }

    function setupModals() {
        // Модалка "Агент, стоп!"
        Object.assign(modalAgent.style, {
            position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.95)', zIndex: '50', display: 'none',
            flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            textAlign: 'center', padding: '40px'
        });
        modalAgent.innerHTML = `
            <div style="font-size: 120px; margin-bottom: 20px; animation: bounce 1s infinite;">🕵️‍♂️</div>
            <h2 style="color: #ef4444; font-size: 36px; font-weight: bold; letter-spacing: 4px; font-family: monospace; margin-bottom: 20px;">АГЕНТ, СТОП!</h2>
            <p style="color: #d1d5db; font-size: 18px; margin-bottom: 40px;">Ці дані зашифровані. Назовьте секретне слово.</p>
            <button id="btn-close-agent" style="padding: 15px 30px; border: 1px solid #ef4444; color: #ef4444; background: transparent; font-size: 16px; font-weight: bold; cursor: pointer; letter-spacing: 2px; transition: 0.2s;">ЗАКРЫТЬ</button>
        `;
        wrapper.appendChild(modalAgent);

        // Оверлей Шпиона (spy.png)
        Object.assign(modalSpy.style, {
            position: 'absolute', top: '0', left: '0', right: '0', bottom: '0',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: '50', display: 'none',
            flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            pointerEvents: 'none'
        });
        modalSpy.innerHTML = `
            <img src="/spy.png" alt="Spy" style="max-width: 600px; width: 100%; object-fit: contain; filter: drop-shadow(0 10px 20px rgba(0,0,0,0.8)); animation: bounce 1s infinite;" />
            <div style="margin-top: 30px; text-align: center;">
                <h1 style="color: #dc2626; font-size: 48px; font-weight: bold; letter-spacing: 2px; text-shadow: 0 0 20px rgba(220, 38, 38, 0.8);">ДЕРЖАВА НЕ ДОВІРЯЄ ВАМ</h1>
                <p style="color: white; font-size: 24px; margin-top: 20px; letter-spacing: 4px;">THE STATE DOES NOT TRUST YOU</p>
            </div>
        `;
        wrapper.appendChild(modalSpy);

        // Делегирование событий для модалок
        wrapper.addEventListener('click', (e) => {
            if (e.target.id === 'btn-close-agent') {
                showAgentModal = false;
                updateUI();
            }
        });
    }

    function setupFileInput() {
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) processImage(file);
            fileInput.value = '';
        });
        wrapper.appendChild(fileInput);
    }

    // === МАСШТАБИРОВАНИЕ ПОД ЭКРАН ===
    function handleResize() {
        const scaleX = window.innerWidth / BASE_W;
        const scaleY = window.innerHeight / BASE_H;
        const scale = Math.min(scaleX, scaleY);
        wrapper.style.transform = `scale(${scale})`;
        
        Object.assign(root.style, {
            width: '100vw', height: '100vh', display: 'flex',
            justifyContent: 'center', alignItems: 'center',
            overflow: 'hidden', backgroundColor: '#000'
        });
    }

    // === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА (RE-RENDER ЛОГИКИ) ===
    function updateUI() {
        const isLeftLocked = text.length >= 3;
        const isRightLocked = key.length >= 6;

        lockLeft.innerHTML = isLeftLocked 
            ? "CLOSED<br><span style='font-size:14px; color:#ccc'>ЗАКРИТО</span>" 
            : "OPEN<br><span style='font-size:14px; color:#ccc'>ВІДКРИТО</span>";
            
        lockRight.innerHTML = isRightLocked 
            ? "CLOSED<br><span style='font-size:14px; color:#ccc'>ЗАКРИТО</span>" 
            : "OPEN<br><span style='font-size:14px; color:#ccc'>ВІДКРИТО</span>";

        keyInput.style.animation = isBlinking ? 'pulse 1s infinite' : 'none';
        scanMenu.style.display = showScanMenu ? 'flex' : 'none';
        modalAgent.style.display = showAgentModal ? 'flex' : 'none';
        modalSpy.style.display = showSpyOverlay ? 'flex' : 'none';
    }

    // === ГЕНЕРАТОР СИММЕТРИЧНЫХ МАСОК ===
    function generateMask(size) {
        if (size % 2 === 0) size += 1;
        let matrix = Array(size).fill(null).map(() => Array(size).fill(0));
        let centerY = Math.floor(size / 2);
        let centerX = Math.floor(size / 2);
        let maxBlock = Math.ceil(centerY / 7) + 1;
        let blockMap = {};

        for (let by = 0; by < maxBlock; by++) {
            for (let bx = by; bx < maxBlock; bx++) {
                let pat = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
                if (JSON.stringify(pat) === JSON.stringify(solidBlock)) {
                    pat = PATTERNS[FILLER_IDX[Math.floor(Math.random() * FILLER_IDX.length)]];
                }
                blockMap[`${bx},${by}`] = pat;
            }
        }

        for (let y = 0; y <= centerY; y++) {
            for (let x = y; x <= centerX; x++) {
                let bx = Math.floor(x / 7);
                let by = Math.floor(y / 7);
                let k = `${bx},${by}`;
                if (!blockMap[k]) k = `${by},${bx}`;
                let pat = blockMap[k];
                if (!pat) continue;

                if (pat[y % 7][x % 7] === 1) {
                    matrix[centerY + y][centerX + x] = 1;
                    matrix[centerY + x][centerX + y] = 1;
                    matrix[centerY - y][centerX + x] = 1;
                    matrix[centerY - x][centerX + y] = 1;
                    matrix[centerY + y][centerX - x] = 1;
                    matrix[centerY + x][centerX - y] = 1;
                    matrix[centerY - y][centerX - x] = 1;
                    matrix[centerY - x][centerX - y] = 1;
                }
            }
        }
        return matrix;
    }

    // === ПОПИКСЕЛЬНЫЙ РЕНДЕРИНГ ОРНАМЕНТА НА CANVAS ===
    function drawOrnament(dataString) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = "#110e0b";
        ctx.fillRect(0, 0, 512, 512);

        if (!dataString.trim()) {
            canvas.style.opacity = "0";
            return;
        }

        canvas.style.opacity = "1";

        try {
            const utf8 = unescape(encodeURIComponent(dataString));
            const qrObj = qrcode(0, 'M');
            qrObj.addData(utf8);
            qrObj.make();
            let mc = qrObj.getModuleCount();
            
            let qz = 2, fi = 1, fo = 2;
            let ornSize = mc + (qz * 2);
            if (ornSize % 2 === 0) ornSize += 1;
            let total = ornSize + (fi * 2) + (fo * 2);
            if (total % 2 === 0) total += 1;

            const mod = 512 / total;
            
            // Базовый камень
            ctx.fillStyle = "rgb(180, 160, 140)";
            ctx.fillRect(0, 0, 512, 512);
            // Внутренняя выемка
            ctx.fillStyle = "rgb(25, 20, 15)";
            ctx.fillRect(fo * mod, fo * mod, 512 - (fo * mod * 2), 512 - (fo * mod * 2));

            // Генерация двух независимых масок для R и G каналов
            const maskR = generateMask(ornSize);
            const maskG = generateMask(ornSize);
            const coreStart = fo + fi + qz;

            for (let r = 0; r < total; r++) {
                for (let c = 0; c < total; c++) {
                    let isO = (r < fo || r >= total - fo || c < fo || c >= total - fo);
                    let isI = !isO && (r < fo + fi || r >= total - (fo + fi) || c < fo + fi || c >= total - (fo + fi));
                    if (isO || isI) continue;

                    let oR = r - (fo + fi);
                    let oC = c - (fo + fi);
                    let qrR = r - coreStart;
                    let qrC = c - coreStart;
                    let isC = (qrR >= 0 && qrR < mc && qrC >= 0 && qrC < mc);

                    // Математическое смешение RGB каналов
                    let vR = maskR[oR] && maskR[oR][oC] ? 210 : 35;
                    let vG = maskG[oR] && maskG[oR][oC] ? 210 : 35;
                    let vB = 35;
                    if (isC) vB = qrObj.isDark(qrR, qrC) ? 210 : 35;

                    ctx.fillStyle = `rgb(${vR}, ${vG}, ${vB})`;
                    ctx.fillRect(c * mod, r * mod, mod + 0.4, mod + 0.4);
                }
            }
        } catch (e) {
            console.error("Canvas seal draw failed: ", e);
        }
    }

    // === КРИПТОГРАФИЯ (ЧИСТЫЙ JS + WEB CRYPTO API) ===
    async function encryptData(plaintext, passwordKey) {
        const enc = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const km = await crypto.subtle.importKey("raw", enc.encode(passwordKey), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey(
            { name: "PBKDF2", salt, iterations: 390000, hash: "SHA-256" },
            km, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
        );
        const nonce = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, enc.encode(plaintext));
        const comb = new Uint8Array(28 + ct.byteLength);
        comb.set(salt, 0);
        comb.set(nonce, 16);
        comb.set(new Uint8Array(ct), 28);
        let binary = '';
        for (let i = 0; i < comb.byteLength; i++) binary += String.fromCharCode(comb[i]);
        return btoa(binary);
    }

    async function decryptData(b64, passwordKey) {
        try {
            const enc = new TextEncoder();
            const binaryString = atob(b64);
            const comb = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) comb[i] = binaryString.charCodeAt(i);
            const salt = comb.slice(0, 16);
            const nonce = comb.slice(16, 28);
            const ct = comb.slice(28);
            const km = await crypto.subtle.importKey("raw", enc.encode(passwordKey), "PBKDF2", false, ["deriveKey"]);
            const key = await crypto.subtle.deriveKey(
                { name: "PBKDF2", salt, iterations: 390000, hash: "SHA-256" },
                km, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
            );
            const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce }, key, ct);
            return new TextDecoder().decode(dec);
        } catch (e) {
            return null;
        }
    }

    // === ОБРАБОТЧИКИ СОБЫТИЙ ===
    async function handleCreate() {
        if (!text.trim()) return;
        const pass = key.trim();
        let dataToDraw = text;
        if (pass) {
            dataToDraw = await encryptData(text, pass);
        }
        drawOrnament(dataToDraw);
    }

    function handleScan() {
        showScanMenu = !showScanMenu;
        updateUI();
    }

    function handleGallery() {
        showScanMenu = false;
        updateUI();
        fileInput.click();
    }

    function handleSave() {
        if (canvas.style.opacity === '0') return;
        const link = document.createElement('a');
        link.download = 'crypto-ornament.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function processImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            galleryImg.src = dataUrl;
            galleryImg.style.display = 'block';

            const img = new Image();
            img.onload = () => {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });

                if (code && code.data) {
                    const trimmed = code.data.trim();
                    if (trimmed.endsWith('=')) {
                        pendingCipher = trimmed;
                        textInput.value = '';
                        keyInput.value = '';
                        text = '';
                        key = '';
                        isBlinking = true;
                        updateUI();
                        setTimeout(() => keyInput.focus(), 100);
                    } else {
                        textInput.value = trimmed;
                        text = trimmed;
                        pendingCipher = null;
                        isBlinking = false;
                        updateUI();
                    }
                } else {
                    galleryImg.style.display = 'none';
                    showAgentModal = true;
                    updateUI();
                }
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }

    async function handleKeyDown(e) {
        if (e.key === 'Enter') {
            isBlinking = false;
            const trimmedKey = keyInput.value.trim().toLowerCase();

            // Пасхалка со словом "неправильно"
            if (trimmedKey === 'неправильно') {
                showSpyOverlay = true;
                updateUI();
                setTimeout(() => {
                    showSpyOverlay = false;
                    keyInput.value = '';
                    key = '';
                    updateUI();
                }, 4000);
                return;
            }

            // Дешифровка
            if (pendingCipher && trimmedKey) {
                const result = await decryptData(pendingCipher, trimmedKey);
                
                if (result !== null) {
                    textInput.value = result;
                    text = result;
                    pendingCipher = null;
                    galleryImg.style.display = 'none';
                    updateUI();
                } else {
                    // Неверный ключ - просто очищаем поле
                    keyInput.value = '';
                    key = '';
                    updateUI();
                }
            }
        }
    }

    // === ЗАПУСК ===
    init();
});
