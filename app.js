const root = document.getElementById('root');
root.innerHTML = `
    <div class="stone-bg rounded-xl p-6 max-w-2xl mx-auto flex flex-col items-center relative text-gray-300">
        <h1 class="text-3xl font-bold tracking-widest text-center mb-6 text-gray-400 uppercase">Crypto Seal</h1>
        <div class="relative flex items-center justify-center w-full mb-6">
            <div class="absolute left-4 flex flex-col items-center gap-2">
                <div id="lock-1" class="lock-indicator"></div>
                <span class="text-xs text-gray-600 uppercase">L1</span>
            </div>
            <div class="stone-screen p-2 rounded-lg">
                <canvas id="mandala-canvas" width="512" height="512" class="w-[320px] h-[320px] sm:w-[450px] sm:h-[450px] bg-black block transition-opacity duration-300 opacity-10"></canvas>
            </div>
            <div class="absolute right-4 flex flex-col items-center gap-2">
                <div id="lock-2" class="lock-indicator"></div>
                <span class="text-xs text-gray-600 uppercase">L2</span>
            </div>
        </div>
        <div class="w-full flex flex-col gap-4">
            <input id="text-input" type="text" placeholder="Введите текст..." class="stone-input w-full px-4 py-3 rounded text-lg">
            <input id="key-input" type="text" placeholder="Ключ (3 и 6 символов)..." class="stone-input w-full px-4 py-2 rounded text-sm">
            <div class="flex flex-col sm:flex-row gap-4 w-full">
                <label class="stone-btn flex-1 py-3 rounded font-bold text-center block cursor-pointer bg-neutral-800 hover:bg-neutral-700 text-sm">Сканировать<input id="file-input" type="file" accept="image/*" class="hidden"></label>
                <button id="btn-change-ornament" class="stone-btn hidden flex-1 py-3 rounded font-bold text-white bg-neutral-700 hover:bg-neutral-600 text-sm">Обновить орнамент</button>
                <button id="btn-save" class="stone-btn hidden flex-1 py-3 rounded font-bold text-white bg-green-900 border-green-700 hover:bg-green-800 text-sm">Сохранить</button>
            </div>
        </div>
    </div>
`;

const els = {
    canvas: document.getElementById('mandala-canvas'),
    ctx: document.getElementById('mandala-canvas').getContext('2d'),
    textInput: document.getElementById('text-input'),
    keyInput: document.getElementById('key-input'),
    btnChange: document.getElementById('btn-change-ornament'),
    btnSave: document.getElementById('btn-save'),
    fileInput: document.getElementById('file-input'),
    lock1: document.getElementById('lock-1'),
    lock2: document.getElementById('lock-2')
};

const SPRITE_LIB_7x7 = [[0x00, 0x00, 0x1c, 0x1c, 0x1c, 0x00, 0x00], [0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e], [0x18, 0x3c, 0x7e, 0xff, 0x7e, 0x3c, 0x18], [0x00, 0x24, 0x66, 0xe7, 0x66, 0x24, 0x00], [0x10, 0x10, 0x28, 0x44, 0x28, 0x10, 0x10], [0x00, 0x3e, 0x22, 0x22, 0x22, 0x3e, 0x00], [0x41, 0x22, 0x14, 0x08, 0x14, 0x22, 0x41], [0x08, 0x1c, 0x3e, 0x7f, 0x1c, 0x1c, 0x1c], [0x77, 0x00, 0x55, 0x00, 0x55, 0x00, 0x77], [0x3c, 0x42, 0x95, 0xa1, 0x95, 0x42, 0x3c]];

function updateLocks() {
    const k = els.keyInput.value;
    els.lock1.className = k.length >= 3 ? "lock-indicator locked" : "lock-indicator";
    els.lock2.className = k.length >= 6 ? "lock-indicator locked" : "lock-indicator";
}

function build7x7Grid(size) {
    const grid = Array(size).fill(0).map(() => Array(size).fill(0));
    const center = Math.floor(size / 2);
    for (let by = 0; by < Math.ceil(size / 14); by++) {
        for (let bx = by; bx < Math.ceil(size / 14); bx++) {
            const p = SPRITE_LIB_7x7[Math.floor(Math.random() * SPRITE_LIB_7x7.length)];
            for (let py = 0; py < 7; py++) {
                for (let px = 0; px < 7; px++) {
                    if ((p[py] >> (6 - px)) & 1) {
                        let x = (bx * 7) + px - 3;
                        let y = (by * 7) + py - 3;
                        [[x,y],[y,x],[-x,y],[-y,x],[x,-y],[y,-x],[-x,-y],[-y,-x]].forEach(([px,py]) => {
                            if (center + px >= 0 && center + px < size && center + py >= 0 && center + py < size) grid[center + py][center + px] = 1;
                        });
                    }
                }
            }
        }
    }
    return grid;
}

function generateMandala() {
    let text = els.textInput.value;
    const key = els.keyInput.value;
    if (key.length > 0) text = "|" + btoa(text + ":::" + key);
    
    els.ctx.fillStyle = "#000000"; 
    els.ctx.fillRect(0, 0, 512, 512);
    if (!els.textInput.value.trim()) {
        els.canvas.style.opacity = 0.1;
        els.btnSave.classList.add('hidden');
        els.btnChange.classList.add('hidden');
        return;
    }
    els.canvas.style.opacity = 1;

    const qr = qrcode(0, 'M');
    qr.addData(unescape(encodeURIComponent(text)));
    qr.make();
    
    const modCount = qr.getModuleCount();
    const modSize = 512 / (modCount + 8);
    els.ctx.fillStyle = "rgb(200, 200, 200)";
    els.ctx.fillRect(0, 0, 512, 512);
    els.ctx.fillStyle = "rgb(50, 50, 50)";
    els.ctx.fillRect(modSize * 3, modSize * 3, 512 - modSize * 6, 512 - modSize * 6);

    const grid = build7x7Grid(modCount + 4);
    for (let r = 0; r < modCount + 4; r++) {
        for (let c = 0; c < modCount + 4; c++) {
            let valB = 50;
            if (r >= 2 && r < modCount + 2 && c >= 2 && c < modCount + 2) if (qr.isDark(r - 2, c - 2)) valB = 200;
            els.ctx.fillStyle = `rgb(${grid[r][c]?200:50}, ${grid[r][c]?200:50}, ${valB})`;
            els.ctx.fillRect(c * modSize + modSize*1.5, r * modSize + modSize*1.5, modSize + 0.5, modSize + 0.5);
        }
    }
    els.btnSave.classList.remove('hidden');
    els.btnChange.classList.remove('hidden');
}

function drawSpy() {
    els.ctx.fillStyle = "black";
    els.ctx.fillRect(0, 0, 512, 512);
    els.ctx.fillStyle = "red";
    els.ctx.font = "20px monospace";
    els.ctx.fillText("ДЕРЖАВА НЕ ДОВЕРЯЕТ ВАМ", 100, 256);
}

els.fileInput.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            els.ctx.drawImage(img, 0, 0, 512, 512);
            const data = els.ctx.getImageData(0, 0, 512, 512).data;
            for(let i=0; i<data.length; i+=4) data[i] = data[i+1] = data[i+2] = data[i+2] > 125 ? 255 : 0;
            const code = jsQR(data, 512, 512);
            if (code && code.data.startsWith('|')) {
                try {
                    const raw = atob(code.data.slice(1)).split(':::');
                    if (raw[1] === els.keyInput.value) els.textInput.value = raw[0];
                    else drawSpy();
                } catch(e) { drawSpy(); }
            } else els.textInput.value = code ? code.data : "QR не найден";
            generateMandala();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

els.btnChange.onclick = generateMandala;
els.btnSave.onclick = () => { const a = document.createElement('a'); a.download = 'seal.png'; a.href = els.canvas.toDataURL(); a.click(); };
els.textInput.addEventListener('input', generateMandala);
els.keyInput.addEventListener('input', () => { updateLocks(); generateMandala(); });
