// Конфигурация координат для эффекта Hover
const BUTTONS = {
    CREATE: { left: 419, top: 290, width: 291, height: 53 },
    SCAN:   { left: 1228, top: 291, width: 293, height: 57 },
    RULES:  { left: 816, top: 905, width: 301, height: 68 },
    BACK:   { left: 734, top: 907, width: 71,  height: 53 },
    SAVE:   { left: 1124, top: 906, width: 63,  height: 66 }
};

// Рендерим HTML-структуру внутрь #root
document.getElementById('root').innerHTML = `
    <div class="relative w-[1920px] h-[1080px] bg-cover bg-center select-none overflow-hidden" style="background-image: url('004.jpg');">
        
        <div id="hover-mask" class="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-150 mix-blend-screen" style="background-image: url('003.jpg');"></div>

        <div id="buttons-container" class="absolute inset-0"></div>

        <input type="text" id="input-text" placeholder="Введите текст..." 
            class="absolute bg-transparent text-[#00ffcc] font-mono border border-[#00ffcc]/30 outline-none px-4"
            style="left: 419px; top: 370px; width: 291px; height: 50px; font-size: 18px;">

        <input type="password" id="input-key" placeholder="Ключ..." 
            class="absolute bg-transparent text-[#00ffcc] font-mono border border-[#00ffcc]/30 outline-none px-4"
            style="left: 1228px; top: 370px; width: 293px; height: 50px; font-size: 18px;">

        <div id="lock-left" class="absolute font-mono text-xl text-[#00ff00] font-bold tracking-widest" style="left: 505px; top: 597px;">OPEN</div>
        <div id="lock-right" class="absolute font-mono text-xl text-[#00ff00] font-bold tracking-widest" style="left: 1331px; top: 597px;">OPEN</div>

        <div class="absolute overflow-hidden flex justify-center items-center bg-black/40 border border-[#00ffcc]/20" style="left: 770px; top: 314px; width: 390px; height: 390px;">
            <canvas id="qr-canvas" width="390" height="390" class="w-full h-full"></canvas>
            <img id="gallery-layer" class="absolute inset-0 w-full h-full object-cover hidden pointer-events-none" style="mix-blend-mode: color-dodge;">
        </div>

        <div id="scan-menu" class="absolute bg-black/90 border border-[#00ffcc] p-4 rounded hidden flex-col gap-3 z-50 shadow-2xl" style="left: 1228px; top: 220px; width: 293px;">
            <button id="btn-camera" class="w-full bg-[#00ffcc]/10 hover:bg-[#00ffcc]/30 text-[#00ffcc] py-2 font-mono border border-[#00ffcc]/50 transition">CAMERA</button>
            <button id="btn-gallery" class="w-full bg-[#00ffcc]/10 hover:bg-[#00ffcc]/30 text-[#00ffcc] py-2 font-mono border border-[#00ffcc]/50 transition">GALLERY</button>
        </div>
        <input type="file" id="file-input" accept="image/*" class="hidden">

        <div id="modal-agent" class="fixed inset-0 bg-black/80 hidden justify-center items-center z-50">
            <div class="bg-[#121212] border-2 border-red-600 p-8 text-center max-w-md shadow-2xl">
                <h2 class="text-red-500 font-mono text-2xl font-bold mb-4 tracking-wider">АГЕНТ, СТОП!</h2>
                <p class="text-gray-300 font-mono mb-6">QR-код не распознан или поврежден. Доступ заблокирован.</p>
                <button id="close-modal" class="bg-red-600 hover:bg-red-700 text-white font-mono px-6 py-2 transition">ОК</button>
            </div>
        </div>

        <div id="overlay-spy" class="fixed inset-0 bg-cover bg-center hidden z-50 flex flex-col justify-end items-center pb-20" style="background-image: url('spy.png');">
            <div class="bg-black/80 px-8 py-4 border border-red-500 text-center max-w-2xl">
                <p class="text-red-500 font-mono text-xl md:text-2xl font-bold tracking-wide uppercase">
                    Держава не доверяет вам / The State does not trust you
                </p>
            </div>
        </div>

    </div>
`;

// --- ЛОГИКА ИНТЕРФЕЙСА ---

const hoverMask = document.getElementById('hover-mask');
const container = document.getElementById('buttons-container');
const inputText = document.getElementById('input-text');
const inputKey = document.getElementById('input-key');
const lockLeft = document.getElementById('lock-left');
const lockRight = document.getElementById('lock-right');
const scanMenu = document.getElementById('scan-menu');
const fileInput = document.getElementById('file-input');
const galleryLayer = document.getElementById('gallery-layer');
const modalAgent = document.getElementById('modal-agent');
const overlaySpy = document.getElementById('overlay-spy');
const qrCanvas = document.getElementById('qr-canvas');
const ctx = qrCanvas.getContext('2d');

// Генерация кнопок-активаторов для эффекта Hover
Object.entries(BUTTONS).forEach(([name, rect]) => {
    const zone = document.createElement('div');
    zone.className = 'absolute cursor-pointer bg-transparent';
    zone.style.left = `${rect.left}px`;
    zone.style.top = `${rect.top}px`;
    zone.style.width = `${rect.width}px`;
    zone.style.height = `${rect.height}px`;

    zone.addEventListener('mouseenter', () => {
        hoverMask.style.opacity = '1';
    });
    zone.addEventListener('mouseleave', () => {
        hoverMask.style.opacity = '0';
    });

    if (name === 'SCAN') {
        zone.addEventListener('click', (e) => {
            e.stopPropagation();
            scanMenu.classList.toggle('hidden');
        });
    }

    container.appendChild(zone);
});

document.addEventListener('click', () => scanMenu.classList.add('hidden'));

// Логика замков
inputText.addEventListener('input', () => {
    if (inputText.value.length >= 3) {
        lockLeft.textContent = 'CLOSED';
        lockLeft.className = 'absolute font-mono text-xl text-[#ff0000] font-bold tracking-widest';
    } else {
        lockLeft.textContent = 'OPEN';
        lockLeft.className = 'absolute font-mono text-xl text-[#00ff00] font-bold tracking-widest';
    }
});

inputKey.addEventListener('input', () => {
    if (inputKey.value.length >= 6) {
        lockRight.textContent = 'CLOSED';
        lockRight.className = 'absolute font-mono text-xl text-[#ff0000] font-bold tracking-widest';
    } else {
        lockRight.textContent = 'OPEN';
        lockRight.className = 'absolute font-mono text-xl text-[#00ff00] font-bold tracking-widest';
    }

    if (inputKey.value.toLowerCase() === 'неправильно') {
        overlaySpy.classList.remove('hidden');
        setTimeout(() => {
            overlaySpy.classList.add('hidden');
            inputKey.value = '';
            lockRight.textContent = 'OPEN';
            lockRight.className = 'absolute font-mono text-xl text-[#00ff00] font-bold tracking-widest';
        }, 4000);
    }
});

document.getElementById('btn-gallery').addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        galleryLayer.src = event.target.result;
        galleryLayer.classList.remove('hidden');

        const img = new Image();
        img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0);
            
            const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                let text = code.data;
                if (text.endsWith('=')) {
                    inputKey.focus();
                }
            } else {
                modalAgent.classList.remove('hidden');
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

document.getElementById('close-modal').addEventListener('click', () => {
    modalAgent.classList.add('hidden');
});

document.getElementById('btn-camera').addEventListener('click', () => {
    alert('Подключение камеры...');
});

function drawBasePattern() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 390, 390);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 350, 350);
}
drawBasePattern();
