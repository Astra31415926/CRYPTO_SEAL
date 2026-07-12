// === КАРКАС ИНТЕРФЕЙСА (РЕНДЕРИНГ В ROOT) ===
const root = document.getElementById('root');
root.innerHTML = `
    <div class="stone-bg rounded-xl p-6 max-w-2xl mx-auto flex flex-col items-center relative text-gray-300">
        
        <h1 class="text-3xl font-bold tracking-widest text-center mb-6 text-gray-400 uppercase">Crypto Seal</h1>
        
        <div class="flex gap-4 mb-6 w-full">
            <button id="mode-create" class="stone-btn active flex-1 py-2 text-center font-bold rounded">Create</button>
            <button id="mode-scan" class="stone-btn flex-1 py-2 text-center font-bold rounded">Scan</button>
        </div>

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

        <div id="panel-create" class="w-full flex flex-col gap-4">
            <input id="text-input" type="text" placeholder="Введите секретное сообщение..." class="stone-input w-full px-4 py-3 rounded text-lg">
            <input id="key-input" type="text" placeholder="Ключ шифрования (необязательно)..." class="stone-input w-full px-4 py-2 rounded text-sm">
            <button id="btn-save" class="stone-btn hidden w-full py-3 rounded font-bold text-white bg-green-900 border-green-700 hover:bg-green-800">Сохранить Мандалу</button>
        </div>

        <div id="panel-scan" class="w-full hidden flex flex-col gap-4">
            <label class="stone-btn w-full py-4 rounded font-bold text-center block cursor-pointer">
                Загрузить Мандалу из Галереи
                <input id="file-input" type="file" accept="image/*" class="hidden">
            </label>
            <input id="scan-key-input" type="text" placeholder="Введите ключ для расшифровки..." class="stone-input hidden w-full px-4 py-2 rounded text-sm">
            <div id="result-box" class="stone-screen p-4 rounded text-center min-h-[50px] flex items-center justify-center text-gray-400 text-lg">
                Ожидание загрузки файла...
            </div>
        </div>
    </div>
`;

// === ССЫЛКИ НА ЭЛЕМЕНТЫ ===
const els = {
    canvas: document.getElementById('mandala-canvas'),
    ctx: document.getElementById('mandala-canvas').getContext('2d'),
    btnCreate: document.getElementById('mode-create'),
    btnScan: document.getElementById('mode-scan'),
    panelCreate: document.getElementById('panel-create'),
    panelScan: document.getElementById('panel-scan'),
    textInput: document.getElementById('text-input'),
    keyInput: document.getElementById('key-input'),
    scanKeyInput: document.getElementById('scan-key-input'),
    btnSave: document.getElementById('btn-save'),
    fileInput: document.getElementById('file-input'),
    resultBox: document.getElementById('result-box'),
    lock1: document.getElementById('lock-1'),
    lock2: document.getElementById('lock-2')
};

// === ПОЛНЫЙ НАБОР ПРИМИТИВОВ ОРНАМЕНТА (7x7) ===
const SPRITE_LIB_7x7 = [
    [0x00, 0x00, 0x1c, 0x1c, 0x1c, 0x00, 0x00],
    [0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e],
    [0x18, 0x3c, 0x7e, 0xff, 0x7e, 0x3c, 0x18],
    [0x00, 0x24, 0x66, 0xe7, 0x66, 0x24, 0x00],
    [0x10, 0x10, 0x28, 0x44, 0x28, 0x10, 0x10],
    [0x00, 0x3e, 0x22, 0x22, 0x22, 0x3e, 0x00],
    [0x41, 0x22, 0x14, 0x08, 0x14, 0x22, 0x41],
    [0x08, 0x1c, 0x3e, 0x7f, 0x1c, 0x1c, 0x1c],
    [0x77, 0x00, 0x55, 0x00, 0x55, 0x00, 0x77],
    [0x3c, 0x42, 0x95, 0xa1, 0x95, 0x42, 0x3c]
];

// === ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ (CREATE / SCAN) ===
els.btnCreate.onclick = () => {
    els.btnCreate.classList.add('active');
    els.btnScan.classList.remove('active');
    els.panelCreate.classList.remove('hidden');
    els.panelScan.classList.add('hidden');
    resetLocks();
    generateMandala();
};

els.btnScan.onclick = () => {
    els.btnScan.classList.add('active');
    els.btnCreate.classList.remove('active');
    els.panelScan.classList.remove('hidden');
    els.panelCreate.classList.add('hidden');
    resetLocks();
    
    // Очищаем экран под сканирование
    els.ctx.fillStyle = "#000000";
    els.ctx.fillRect(0, 0, 512, 512);
    els.canvas.style.opacity = 0.3;
};

function resetLocks() {
    els.lock1.classList.remove('locked');
    els.lock2.classList.remove('locked');
}

// === ГЕНЕРАТОР МАНДАЛЫ (БАЗА) ===
function generateMandala() {
    const text = els.textInput.value;
    
    els.ctx.fillStyle = "#000000"; 
    els.ctx.fillRect(0, 0, 512, 512);

    if (!text.trim()) {
        els.canvas.style.opacity = 0.1;
        els.btnSave.classList.add('hidden');
        return;
    }
    els.canvas.style.opacity = 1;

    try {
        const utf8Text = unescape(encodeURIComponent(text));
        const qr = qrcode(0, 'M');
        qr.addData(utf8Text);
        qr.make();
        
        const moduleCount = qr.getModuleCount();
        const frameOuter = 2; 
        const frameInner = 1; 
        const quietZone = 2; 
        
        const totalModules = moduleCount + (quietZone * 2) + (frameInner * 2) + (frameOuter * 2);
        const modSize = 512 / totalModules;

        // Фон рамок
        els.ctx.fillStyle = "rgb(200, 200, 200)";
        els.ctx.fillRect(0, 0, 512, 512);

        const innerOffset = frameOuter * modSize;
        const innerSize = 512 - (innerOffset * 2);
        els.ctx.fillStyle = "rgb(50, 50, 50)";
        els.ctx.fillRect(innerOffset, innerOffset, innerSize, innerSize);
        
        const ornamentSize = moduleCount + (quietZone * 2);
        const gridR = build7x7Grid(ornamentSize);
        const gridG = build7x7Grid(ornamentSize);

        const coreStart = frameOuter + frameInner + quietZone;
        
        for (let r = 0; r < totalModules; r++) {
            for (let c = 0; c < totalModules; c++) {
                const x = c * modSize;
                const y = r * modSize;

                const isOuter = (r < frameOuter || r >= totalModules - frameOuter || c < frameOuter || c >= totalModules - frameOuter);
                const isInner = !isOuter && (r < frameOuter + frameInner || r >= totalModules - (frameOuter + frameInner) || c < frameOuter + frameInner || c >= totalModules - (frameOuter + frameInner));
                
                if (isOuter || isInner) continue; 
                
                const oR = r - (frameOuter + frameInner);
                const oC = c - (frameOuter + frameInner);
                const qrR = r - coreStart;
                const qrC = c - coreStart;
                
                const isDataCore = (qrR >= 0 && qrR < moduleCount && qrC >= 0 && qrC < moduleCount);

                let valR = gridR[oR][oC] ? 200 : 50;
                let valG = gridG[oR][oC] ? 200 : 50;
                let valB = 50; 

                if (isDataCore) {
                    // Пишем данные строго в Синий канал
                    valB = qr.isDark(qrR, qrC) ? 200 : 50;
                }
                
                els.ctx.fillStyle = `rgb(${valR}, ${valG}, ${valB})`;
                els.ctx.fillRect(x, y, modSize + 0.5, modSize + 0.5);
            }
        }

        els.btnSave.classList.remove('hidden');
        
    } catch(e) {
        console.error(e);
    }
}

// Построение симметричной сетки
function build7x7Grid(size) {
    const grid = Array(size).fill(0).map(() => Array(size).fill(0));
    const center = Math.floor(size / 2);
    const octantMap = new Map(); 
    const maxBlocks = Math.ceil((size / 2 + 7) / 7); 

    for (let by = 0; by < maxBlocks; by++) {
        for (let bx = by; bx < maxBlocks; bx++) {
            const pattern = SPRITE_LIB_7x7[Math.floor(Math.random() * SPRITE_LIB_7x7.length)];
            const flipX = Math.random() > 0.5;
            const flipY = Math.random() > 0.5;

            for (let py = 0; py < 7; py++) {
                for (let px = 0; px < 7; px++) {
                    let sX = flipX ? (6 - px) : px;
                    let sY = flipY ? (6 - py) : py;
                    
                    if ((pattern[sY] >> (6 - sX)) & 1) {
                        let xRel = (bx * 7) + px - 3;
                        let yRel = (by * 7) + py - 3;
                        if (xRel >= yRel && yRel >= 0) {
                            octantMap.set(`${xRel},${yRel}`, true);
                        }
                    }
                }
            }
        }
    }

    octantMap.forEach((val, key) => {
        const [xStr, yStr] = key.split(',');
        const x = parseInt(xStr);
        const y = parseInt(yStr);
        const points = [
            [x, y], [y, x], [-x, y], [-y, x],
            [x, -y], [y, -x], [-x, -y], [-y, -x]
        ];
        points.forEach(([px, py]) => {
            const absX = center + px;
            const absY = center + py;
            if (absX >= 0 && absX < size && absY >= 0 && absY < size) {
                grid[absY][absX] = 1;
            }
        });
    });
    return grid;
}

// === МОДУЛЬ СКАНИРОВАНИЯ (БЛОК 1.3) ===
els.fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            // Отрисовываем картинку на скрытом холсте для разбора пикселей
            els.ctx.drawImage(img, 0, 0, 512, 512);
            els.canvas.style.opacity = 1;

            // Выделяем только СИНИЙ канал
            const imgData = els.ctx.getImageData(0, 0, 512, 512);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                const b = data[i + 2]; // Синий пиксель
                // Бинаризация: если синий яркий — делаем его белым, если темный — черным
                const brightness = b > 125 ? 255 : 0;
                data[i] = brightness;     // R
                data[i + 1] = brightness; // G
                data[i + 2] = brightness; // B
            }
            
            // Временный холст для jsQR, чтобы скормить ему очищенный синий QR
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 512;
            tempCanvas.height = 512;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.putImageData(imgData, 0, 0);

            // Сканируем
            const code = jsQR(data, 512, 512);

            if (code) {
                try {
                    const decodedText = decodeURIComponent(escape(code.data));
                    els.resultBox.innerHTML = `<span class="text-green-400 font-bold">${decodedText}</span>`;
                } catch(err) {
                    els.resultBox.innerHTML = `<span class="text-green-400 font-bold">${code.data}</span>`;
                }
            } else {
                els.resultBox.innerHTML = '<span class="text-red-500">Матрица повреждена или QR не найден</span>';
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

// Сохранение картинки
els.btnSave.onclick = () => {
    const a = document.createElement('a');
    a.download = 'crypto-seal.png';
    a.href = els.canvas.toDataURL();
    a.click();
};

// Слушатель ввода
els.textInput.addEventListener('input', generateMandala);
