// === НАСТРОЙКИ И ОБЪЕКТЫ ИНТЕРФЕЙСА ===
const els = {
    bText: document.getElementById('text-input'),   // Поле ввода сообщения
    keyInput: document.getElementById('key-input'), // Поле ввода ключа (пока просто объявляем)
    main: document.getElementById('mandala-canvas'), // Наш Canvas элемент в центре плиты
    ctx: document.getElementById('mandala-canvas').getContext('2d'),
    dropdown: document.getElementById('dropdown')
};

// Временный тестовый спрайт-лист 7х7 для генерации орнамента 
// (в реальном приложении замени на свой полный SPRITE_LIB_7x7)
const SPRITE_LIB_7x7 = [
    [0x7e, 0x42, 0x42, 0x42, 0x42, 0x42, 0x7e], // Рамка
    [0x18, 0x3c, 0x7e, 0xff, 0x7e, 0x3c, 0x18], // Ромб
    [0x66, 0x66, 0x66, 0x00, 0x66, 0x66, 0x66]  // Точки
];

// === 8. MANDALA GENERATION (БАЗОВАЯ ВЕРСИЯ БЕЗ ШИФРОВАНИЯ) ===
function generateMandala() {
    const text = els.bText.value;
    
    // Очищаем canvas черным цветом (размер окна 512x512)
    els.ctx.fillStyle = "#000000"; 
    els.ctx.fillRect(0, 0, 512, 512);

    // Если текста нет, тушим экран и скрываем кнопку сохранения
    if (!text.trim()) {
        els.main.style.opacity = 0.1;
        document.getElementById('btn-save').classList.add('hidden');
        return;
    }
    els.main.style.opacity = 1;

    try {
        // Кодируем текст напрямую в UTF-8 для QR-кода
        const utf8Text = unescape(encodeURIComponent(text));
        const qr = qrcode(0, 'M');
        qr.addData(utf8Text);
        qr.make();
        
        const moduleCount = qr.getModuleCount();
        
        // Параметры декоративных рамок
        const frameOuter = 2; 
        const frameInner = 1; 
        const quietZone = 2; 
        
        const totalModules = moduleCount + (quietZone * 2) + (frameInner * 2) + (frameOuter * 2);
        const modSize = 512 / totalModules;

        const colOuter = "rgb(200, 200, 200)";
        const colInner = "rgb(50, 50, 50)";

        // Отрисовка подложки рамок
        els.ctx.fillStyle = colOuter;
        els.ctx.fillRect(0, 0, 512, 512);

        const innerFrameOffset = frameOuter * modSize;
        const innerFrameSize = 512 - (innerFrameOffset * 2);
        els.ctx.fillStyle = colInner;
        els.ctx.fillRect(innerFrameOffset, innerFrameOffset, innerFrameSize, innerFrameSize);
        
        // Генерируем орнаментную сетку (7х7 блоки) под размер мандалы
        const ornamentSize = moduleCount + (quietZone * 2);
        const gridR = build7x7Grid(ornamentSize);
        const gridG = build7x7Grid(ornamentSize);

        const coreStart = frameOuter + frameInner + quietZone;
        
        // Попиксельный рендеринг мандалы
        for (let r = 0; r < totalModules; r++) {
            for (let c = 0; c < totalModules; c++) {
                const x = c * modSize;
                const y = r * modSize;

                const isOuterFrame = (r < frameOuter || r >= totalModules - frameOuter || c < frameOuter || c >= totalModules - frameOuter);
                const isInnerFrame = !isOuterFrame && (r < frameOuter + frameInner || r >= totalModules - (frameOuter + frameInner) || c < frameOuter + frameInner || c >= totalModules - (frameOuter + frameInner));
                
                if (isOuterFrame || isInnerFrame) continue; 
                
                const oR = r - (frameOuter + frameInner);
                const oC = c - (frameOuter + frameInner);

                const qrR = r - coreStart;
                const qrC = c - coreStart;
                
                const isDataCore = (qrR >= 0 && qrR < moduleCount && qrC >= 0 && qrC < moduleCount);

                // Заполняем R и G каналы сгенерированным орнаментом
                let valR = gridR[oR][oC] ? 200 : 50;
                let valG = gridG[oR][oC] ? 200 : 50;

                // B Канал (Скрытый информационный слой)
                let valB = 50; 

                if (isDataCore) {
                    // Пишем QR-код ИСКЛЮЧИТЕЛЬНО в синий канал
                    valB = qr.isDark(qrR, qrC) ? 200 : 50;
                }
                
                els.ctx.fillStyle = `rgb(${valR}, ${valG}, ${valB})`;
                els.ctx.fillRect(x, y, modSize + 0.5, modSize + 0.5);
            }
        }

        // Показываем кнопку сохранения после генерации
        document.getElementById('btn-save').classList.remove('hidden');
        
    } catch(e) {
        console.error("Ошибка генерации:", e);
    }
}

// === ВСПОМОГАТЕЛЬНЫЙ АЛГОРИТМ СЕТКИ И ЗЕРКАЛИРОВАНИЯ ===
function build7x7Grid(size) {
    const grid = Array(size).fill(0).map(() => Array(size).fill(0));
    const center = Math.floor(size / 2);
    const octantMap = new Map(); 
    const maxBlocks = Math.ceil((size / 2 + 7) / 7); 

    for (let by = 0; by < maxBlocks; by++) {
        for (let bx = by; bx < maxBlocks; bx++) {
            const patternIdx = Math.floor(Math.random() * SPRITE_LIB_7x7.length);
            const pattern = SPRITE_LIB_7x7[patternIdx];
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

    // Идеально центрируем координаты на холсте, чтобы избежать асимметричной обрезки
    octantMap.forEach((val, key) => {
        const [xStr, yStr] = key.split(',');
        const x = parseInt(xStr);
        const y = parseInt(yStr);
        
        const points = [
            [ x,  y], [ y,  x], [-x,  y], [-y,  x],
            [ x, -y], [ y, -x], [-x, -y], [-y, -x]
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

function saveQR() { 
    const a = document.createElement('a'); 
    a.download = 'cryptoseal-mandala.png'; 
    a.href = els.main.toDataURL(); 
    a.click(); 
}

// === НАВЕШИВАНИЕ СОБЫТИЙ ===
els.bText.addEventListener('input', generateMandala);
document.getElementById('btn-save').addEventListener('click', saveQR);
