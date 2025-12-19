

const ASSET_CONFIG = {
    BTC:   { label: 'BITCOIN',   icon: '₿', image: 'images/bitcoin.png', csvSymbol: 'BTCEUR', csvPath: 'data/BTCEUR.csv' },
    ETH:   { label: 'ETHEREUM',  icon: 'Ξ', image: 'images/ethereum.png', csvSymbol: 'ETHEUR', csvPath: 'data/ETHEUR.csv' },
    ADA:   { label: 'CARDANO',   icon: '₳', image: 'images/cardano.png', csvSymbol: 'ADAEUR', csvPath: 'data/ADAEUR.csv' },
    DOT:   { label: 'POLKADOT',  icon: '●', image: 'images/polkadot.png', csvSymbol: 'DOTEUR', csvPath: 'data/DOTEUR.csv' },
    SOL:   { label: 'SOLANA',    icon: '◎', image: 'images/solana.png', csvSymbol: 'SOLEUR', csvPath: 'data/SOLEUR.csv' },
    XRP:   { label: 'RIPPLE',    icon: '✕', image: 'images/ripple.png', csvSymbol: 'XRPEUR', csvPath: 'data/XRPEUR.csv' },
    AAPL:  { label: 'APPLE',     icon: '', image: 'images/apple.png', csvSymbol: 'AAPL',   csvPath: 'data/apple.csv' },
    TSLA:  { label: 'TESLA',     icon: '⚡', image: 'images/tesla.png', csvSymbol: 'TSLA',   csvPath: 'data/tesla.csv' },
    MSFT:  { label: 'MICROSOFT', icon: '', image: 'images/microsoft.png', csvSymbol: 'MSFT',   csvPath: 'data/microsoft.csv' },
    AMZN:  { label: 'AMAZON',    icon: '📦', image: 'images/amazon.png', csvSymbol: 'AMZN',   csvPath: 'data/amazon.csv' },
    GOOGL: { label: 'GOOGLE',    icon: 'G', image: 'images/google.png', csvSymbol: 'GOOGL',  csvPath: 'data/google.csv' },
    META:  { label: 'META',      icon: 'f', image: 'images/meta.png', csvSymbol: 'META',   csvPath: 'data/meta.csv' }
};
const DEFAULT_ASSET = ASSET_CONFIG.BTC;
const CSV_MAP = Object.values(ASSET_CONFIG).reduce((acc, cfg) => {
    acc[cfg.csvSymbol] = cfg.csvPath;
    return acc;
}, {});
let candlesWindow = 30;
const CANDLE_UPDATE_MS = 1000;
let allCandles = [];
let candlePtr = 0;
let currentSymbol = DEFAULT_ASSET.csvSymbol;
const holdings = {};
const avgCosts = {};
const stopLoss = {};
const takeProfit = {};
let windowOffsetFromEnd = 0;
const symbolState = {};

// Salva la posizione attuale del puntatore e lo stato dell'asset selezionato
function rememberCurrentState() {
    if (!currentSymbol || !allCandles.length) return;
    const state = symbolState[currentSymbol] || {};
    state.ptr = Math.max(1, Math.min(candlePtr, allCandles.length));
    state.seed = state.seed || Math.min(candlesWindow, allCandles.length);
    symbolState[currentSymbol] = state;
}

// Formatta i numeri come valuta CHF (es: chf 1'000.00) usando lo standard svizzero
function fmtCHF(v) { 
    return 'chf ' + Number(v).toLocaleString('it-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); 
}

// Formatta la quantità degli asset con 4 cifre decimali
function fmtQty(v) { 
    return Number(v).toFixed(4); 
}

// Aggiorna gli elementi del DOM relativi al saldo, quantità posseduta e prezzo medio
function updateBalanceUI() {
    const balanceEl = document.getElementById('balanceAmount');
    const holdingsEl = document.getElementById('holdings');
    const avgCostEl = document.getElementById('avgCost');
    balanceEl.textContent = fmtCHF(portfolioCHF);
    const qty = holdings[currentSymbol] || 0;
    holdingsEl.textContent = fmtQty(qty);
    const ac = avgCosts[currentSymbol];
    avgCostEl.textContent = (ac > 0) ? ac.toFixed(2) : '-';
}

// Aggiorna l'interfaccia dei prezzi e calcola il profitto/perdita (P/L) in tempo reale
function setPricesUI(candle) {
    const askEl = document.getElementById('askPrice');
    const bidEl = document.getElementById('bidPrice');
    const unrealizedEl = document.getElementById('unrealized');
    const infoEl = document.getElementById('info');
    const px = Number(candle?.close ?? 0);
    
    askEl.textContent = px ? px.toFixed(2) : '-';
    bidEl.textContent = px ? px.toFixed(2) : '-';
    infoEl.textContent = `price: ${px ? px.toFixed(2) : '-'}`;
    
    // Calcola il guadagno non realizzato e colora il testo (verde = profitto, rosso = perdita)
    const qty = holdings[currentSymbol] || 0;
    const ac = avgCosts[currentSymbol] || 0;
    const pl = (px - ac) * qty;
    unrealizedEl.textContent = (Number.isFinite(pl) ? pl.toFixed(2) : '0.00');
    unrealizedEl.style.color = pl >= 0 ? '#22c55e' : '#ef4444';
}

// Crea o aggiorna un box di notifica rosso per mostrare errori o messaggi all'utente
function showError(msg) { 
    let box = document.getElementById('errbox'); 
    if (!box) { 
        box = document.createElement('div'); 
        box.id = 'errbox'; 
        box.style.position = 'absolute'; 
        box.style.left = '40px'; 
        box.style.top = '40px'; 
        box.style.zIndex = '4'; 
        box.style.background = 'rgba(255,0,0,0.85)'; 
        box.style.color = 'white'; 
        box.style.padding = '8px 10px'; 
        box.style.borderRadius = '6px'; 
        document.querySelector('.trading-container').appendChild(box);
    } 
    box.textContent = msg; 
}

// --- CSV ---
function parseCSV(text) { 
    // Rimuove il "BOM" (un carattere invisibile all'inizio di certi file che rompe il codice)
    const clean = text.replace(/^\uFEFF/, '').trim(); 
    // Divide le righe gestendo sia il formato Windows che quello Linux/Mac
    const lines = clean.split(/\r?\n/); 
    if (!lines.length) return []; 
    const header = lines.shift(); 
    const cols = header.split(',').map(s => s.trim()); 
    // Funzione "salva-tempo": cerca una colonna per nome invece di usare un numero fisso
    const idx = (n) => cols.findIndex(c => c.toLowerCase() === n.toLowerCase()); 
    const iUnix = idx('Unix'), iOpen = idx('Open'), iHigh = idx('High'), iLow = idx('Low'), iClose = idx('Close'); 
    const iDate = idx('Date'); 
    const iCloseLast = idx('Close/Last'); 
    // Controlla se esistono TUTTE le colonne necessarie (.every verifica che ogni indice sia >= 0)
    const hasCryptoCols = [iUnix, iOpen, iHigh, iLow, iClose].every(i => i >= 0); 
    const hasStockCols = iDate >= 0 && [iOpen, iHigh, iLow].every(i => i >= 0) && (iClose >= 0 || iCloseLast >= 0); 
    
    if (!hasCryptoCols && !hasStockCols) { 
        return []; 
    }
    const parsePrice = (val) => { 
        if (typeof val !== 'string') return Number(val); 
        // Rimuove simboli $, virgole e spazi vuoti prima di convertire in numero
        const cleaned = val.replace(/[$,\s]/g, ''); 
        return Number(cleaned); 
    }; 

    const parseDate = (val) => { 
        if (!val) return NaN; 
        const trimmed = val.trim(); 
        // Regex per estrarre Giorno, Mese, Anno dal formato MM/DD/YYYY
        const slashFmt = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); 
        if (slashFmt) { 
            const month = Number(slashFmt[1]); 
            const day = Number(slashFmt[2]); 
            const year = Number(slashFmt[3].length === 2 ? '20' + slashFmt[3] : slashFmt[3]); 
            // Converte la data in Unix Timestamp (secondi) per uniformità con i dati Crypto
            if (month >= 1 && month <= 12 && day >= 1 && day <= 31) { 
                return Math.floor(Date.UTC(year, month - 1, day) / 1000); 
            } 
        } 
        const ts = Date.parse(trimmed); 
        return Number.isFinite(ts) ? Math.floor(ts / 1000) : NaN; 
    }; 
    const arr = []; 
    for (const line of lines) { 
        if (!line) continue; 
        const p = line.split(','); 
        // Smistamento logico: se il file è Crypto usa indici Unix, altrimenti usa indici Stock
        if (hasCryptoCols) { 
            const t = Number(p[iUnix]); 
            const o = Number(p[iOpen]); 
            const h = Number(p[iHigh]); 
            const l = Number(p[iLow]); 
            const c = Number(p[iClose]); 
            // Validazione: scarta la riga se anche solo un valore non è un numero valido
            if (!Number.isFinite(t) || !Number.isFinite(o) || !Number.isFinite(h) || !Number.isFinite(l) || !Number.isFinite(c)) continue; 
            arr.push({ time: Math.floor(t/1000), open: o, high: h, low: l, close: c }); 
        } else { 
            const t = parseDate(p[iDate]); 
            const o = parsePrice(p[iOpen]); 
            const h = parsePrice(p[iHigh]); 
            const l = parsePrice(p[iLow]); 
            const c = parsePrice(p[iCloseLast >= 0 ? iCloseLast : iClose]); 
            if (!Number.isFinite(t) || !Number.isFinite(o) || !Number.isFinite(h) || !Number.isFinite(l) || !Number.isFinite(c)) continue; 
            arr.push({ time: t, open: o, high: h, low: l, close: c }); 
        } 
    } 
    // Garantisce che i dati siano in ordine temporale crescente prima di visualizzarli
    return arr.sort((a, b) => a.time - b.time);
}

// Canvases
const priceCanvas = document.getElementById('priceCanvas');
const pctx = priceCanvas.getContext('2d');
const gridCanvas = document.getElementById('tradingGrid');
const gctx = gridCanvas.getContext('2d');
const info = document.getElementById('info');
const gridCfg = { spacing: 50, majorEvery: 5, dpr: window.devicePixelRatio || 1 };
const view = { offsetX: 0, offsetY: 0, spacing: gridCfg.spacing };
const mouse = { x: 0, y: 0, down: false, isInside: false, lastX: 0, lastY: 0 };

function sizeCanvases() {
    const box = document.querySelector('.trading-container');
    const rect = box.getBoundingClientRect();
    const left = 30, right = 30, top = 30, bottom = 120;
    const w = rect.width - left - right;
    const h = rect.height - top - bottom;
    [priceCanvas, gridCanvas].forEach(cv => {
        cv.style.left = left + 'px';
        cv.style.top = top + 'px';
        cv.style.width = w + 'px';
        cv.style.height = h + 'px';
        cv.width = Math.max(1, Math.floor(w * gridCfg.dpr));
        cv.height = Math.max(1, Math.floor(h * gridCfg.dpr));
    });
    pctx.setTransform(gridCfg.dpr, 0, 0, gridCfg.dpr, 0, 0);
    gctx.setTransform(gridCfg.dpr, 0, 0, gridCfg.dpr, 0, 0);
    drawAll();
}

function visibleSlice() {
    const total = Math.min(candlePtr, allCandles.length);
    let end = total - windowOffsetFromEnd;
    end = Math.max(0, Math.min(total, end));
    const start = Math.max(0, end - candlesWindow);
    return allCandles.slice(start, end);
}

function drawCandles() {
    const w = priceCanvas.clientWidth;
    const h = priceCanvas.clientHeight;
    if (!w || !h) return;
    pctx.clearRect(0, 0, w, h);
    const data = visibleSlice();
    if (!data.length) return;
    // Estrae tutti i prezzi massimi e minimi dal gruppo di candele visibili
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    // Trova il valore più alto in assoluto e quello più basso per decidere i limiti del grafico
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    // Crea un "margine" (pad) del 5% sopra e sotto, così la linea non tocca i bordi del Canvas
    const pad = (max - min) * 0.05 || 1;
    const top = max + pad;      // Limite superiore visibile
    const bottom = min - pad;   // Limite inferiore visibile
    // LA FORMULA: Trasforma un prezzo (es. 60.000) in un punto Y in pixel (es. 150px)
    // Sottrae il risultato dall'altezza totale (h) perché nel Canvas lo zero è in alto
    const pxPer = (v) => h - ((v - bottom) / (top - bottom)) * h;
    const gap = Math.max(3, Math.floor(w / Math.max(1, data.length)));
    const candleW = Math.max(2, Math.floor(gap * 0.6));
    
    data.forEach((d, i) => {
        const x = i * gap + Math.floor((gap - candleW) / 2);
        const yHigh = pxPer(d.high);
        const yLow = pxPer(d.low);
        const yOpen = pxPer(d.open);
        const yClose = pxPer(d.close);
        const up = d.close >= d.open;
        pctx.strokeStyle = up ? '#22c55e' : '#ef4444';
        pctx.fillStyle = up ? '#22c55e' : '#ef4444';
        pctx.beginPath();
        pctx.moveTo(x + Math.floor(candleW / 2), yHigh);
        pctx.lineTo(x + Math.floor(candleW / 2), yLow);
        pctx.stroke();
        const topBody = Math.min(yOpen, yClose);
        const botBody = Math.max(yOpen, yClose);
        const bodyH = Math.max(1, botBody - topBody);
        pctx.fillRect(x, topBody, candleW, bodyH);
    });
}

function drawGrid() {
    // 1. PREPARAZIONE: Recupera le dimensioni del Canvas e pulisce i disegni precedenti
    const w = gridCanvas.clientWidth;
    const h = gridCanvas.clientHeight;
    if (!w || !h) return;
    gctx.clearRect(0, 0, w, h);

    // 2. CALCOLO OFFSET: Gestisce lo spostamento della griglia quando l'utente trascina il grafico
    const spacing = view.spacing;
    const startX = -(view.offsetX % spacing) - spacing;
    const startY = -(view.offsetY % spacing) - spacing;
    
    // 3. GRIGLIA SECONDARIA (Sottile): Disegna le linee grigie di sfondo molto leggere
    gctx.beginPath();
    gctx.strokeStyle = 'rgba(255,255,255,0.15)'; // Bianco molto trasparente
    for (let x = startX; x <= w + spacing; x += spacing) {
        gctx.moveTo(x, 0); gctx.lineTo(x, h);
    }
    for (let y = startY; y <= h + spacing; y += spacing) {
        gctx.moveTo(0, y); gctx.lineTo(w, y);
    }
    gctx.stroke();
    
    // 4. GRIGLIA PRINCIPALE (Verde): Evidenzia le linee ogni "N" quadretti (majorEvery)
    gctx.beginPath();
    gctx.strokeStyle = 'rgba(0,255,0,0.6)'; // Verde semi-trasparente
    for (let x = startX; x <= w + spacing; x += spacing * gridCfg.majorEvery) {
        gctx.moveTo(x, 0); gctx.lineTo(x, h);
    }
    for (let y = startY; y <= h + spacing; y += spacing * gridCfg.majorEvery) {
        gctx.moveTo(0, y); gctx.lineTo(w, y);
    }
    gctx.stroke();
    
    // 5. MIRINO (Crosshair): Se il mouse è sopra il grafico, disegna due linee tratteggiate
    if (mouse.isInside) {
        gctx.beginPath();
        gctx.setLineDash([4, 4]); // Imposta il tratto tratteggiato
        gctx.strokeStyle = 'rgba(255,255,255,0.35)';
        gctx.moveTo(mouse.x, 0); gctx.lineTo(mouse.x, h); // Linea verticale
        gctx.moveTo(0, mouse.y); gctx.lineTo(w, mouse.y); // Linea orizzontale
        gctx.stroke();
        gctx.setLineDash([]); // Reset del tratto (torna linea continua per altri disegni)
    }
}

function drawAll() {
    drawCandles();
    drawGrid();
    updateInfoBox();
}

function updateInfoBox() {
    const last = Math.min(candlePtr - 1, allCandles.length - 1);
    const px = last >= 0 ? allCandles[last].close : 0;
    info.textContent = `price: ${px ? px.toFixed(2) : '-'}`;
}

gridCanvas.addEventListener('mousemove', (e) => {
    const rect = gridCanvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.isInside = true;
    
    if (mouse.down) {
        const dx = mouse.x - mouse.lastX;
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
        const dataCount = Math.max(1, candlesWindow);
        const w = gridCanvas.clientWidth || 1;
        const gap = Math.max(3, Math.floor(w / dataCount));
        const deltaCandles = Math.round(-dx / gap);
        const maxOffset = Math.max(0, Math.min(candlePtr, allCandles.length));
        windowOffsetFromEnd = Math.max(0, Math.min(maxOffset, windowOffsetFromEnd + deltaCandles));
    }
    drawAll();
});

gridCanvas.addEventListener('mousedown', () => {
    mouse.down = true;
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
});

window.addEventListener('mouseup', () => {
    mouse.down = false;
});

gridCanvas.addEventListener('mouseleave', () => {
    mouse.isInside = false;
    drawAll();
});

gridCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomOut = e.deltaY > 0;
    candlesWindow = Math.max(10, Math.min(300, Math.round(candlesWindow * (zoomOut ? 1.1 : 0.9))));
    view.spacing = Math.max(20, Math.min(200, view.spacing * (zoomOut ? 1.05 : 0.95)));
    drawAll();
}, { passive: false });

window.addEventListener('resize', sizeCanvases);

// --- Trading ---
// Recupera il prezzo Ask e Bid corrente basandosi sull'indice del grafico
function currentPrices() {
    const idx = Math.min(candlePtr - 1, allCandles.length - 1);
    if (idx < 0) return { ask: NaN, bid: NaN };
    const px = Number(allCandles[idx].close);
    return { ask: px, bid: px };
}

// Salva i valori di Stop Loss e Take Profit inseriti dall'utente per l'asset attuale
function saveStops() {
    const sl = Number(document.getElementById('slPrice').value || '');
    const tp = Number(document.getElementById('tpPrice').value || '');
    if (sl > 0) stopLoss[currentSymbol] = sl;
    if (tp > 0) takeProfit[currentSymbol] = tp;
}

// Rimuove i limiti di Stop Loss e Take Profit e pulisce i campi di input
function clearStops() {
    delete stopLoss[currentSymbol];
    delete takeProfit[currentSymbol];
    document.getElementById('slPrice').value = '';
    document.getElementById('tpPrice').value = '';
}

// Gestisce l'intera logica di acquisto e vendita (Trade)
function trade(action) {
    const { ask, bid } = currentPrices();
    const qty = Number(document.getElementById('qty').value || '0');
    
    // Validazione: controlla che la quantità sia valida e i prezzi disponibili
    if (!(qty > 0)) {
        alert('Quantità non valida');
        return;
    }
    if (!Number.isFinite(ask) || !Number.isFinite(bid)) {
        alert('Prezzi non disponibili');
        return;
    }
    const have = holdings[currentSymbol] || 0;
    
    if (action === 'buy') {
        // Logica ACQUISTO: controlla se ci sono abbastanza CHF nel saldo
        const cost = ask * qty;
        if (cost > portfolioCHF + 1e-9) {
            alert('Fondi insufficienti');
            return;
        }
        portfolioCHF -= cost; // Scala il costo dal saldo
        
        // Ricalcola dinamicamente il prezzo medio di carico (Average Cost)
        const oldQty = have;
        const oldAvg = avgCosts[currentSymbol] || 0;
        const newQty = oldQty + qty;
        const newAvg = newQty > 0 ? ((oldAvg * oldQty) + (ask * qty)) / newQty : 0;
        
        avgCosts[currentSymbol] = newAvg;
        holdings[currentSymbol] = newQty;
    } else {
        // Logica VENDITA: controlla se l'utente possiede abbastanza asset
        if (qty > have + 1e-9) {
            alert('Quantità asset insufficiente');
            return;
        }
        const proceeds = bid * qty;
        portfolioCHF += proceeds; // Aggiunge il ricavo al saldo
        holdings[currentSymbol] = have - qty;
        
        // Evita errori di precisione decimale azzerando quantità infinitesimali
        if (holdings[currentSymbol] <= 1e-12) {
            holdings[currentSymbol] = 0;
        }
    }
    // Aggiorna i valori mostrati nell'interfaccia (saldo e quantità)
    updateBalanceUI();
}

function hasOpenPositions() {
    return Object.values(holdings).some(v => (v || 0) > 0);
}

// --- Asset selection ---
function selectAsset(name, icon) {
    const key = (name || '').toUpperCase();
    const cfg = ASSET_CONFIG[key];
    const displayName = cfg?.label || name || 'ASSET';
    const displayIcon = cfg?.icon || icon || '?';
    document.getElementById('selectedName').textContent = displayName;
    
    // Update image if available
    const selectedImage = document.getElementById('selectedImage');
    if (cfg?.image && selectedImage) {
        selectedImage.src = cfg.image;
        selectedImage.alt = displayName;
    } else {
        // Fallback to icon if no image
        const selectedIconEl = document.getElementById('selectedIcon');
        if (selectedIconEl) {
            selectedIconEl.textContent = displayIcon;
        }
    }

    try {
        const items = document.querySelectorAll('.asset-item');
        items.forEach(el => {
            el.style.borderColor = 'black';
            el.style.boxShadow = 'none';
        });
        const needle = (displayName || '').toUpperCase();
        const match = Array.from(items).find(el => (el.textContent || '').toUpperCase().includes(needle));
        if (match) {
            match.style.borderColor = '#4CAF50';
            match.style.boxShadow = '0 5px 20px rgba(76,175,80,0.3)';
        }
    } catch (e) {}

    if (!cfg) {
        return;
    }
    if (cfg.csvSymbol) {
        loadSymbol(cfg.csvSymbol);
    } else {
        showError('Asset non configurato: ' + displayName);
    }
}

let simTimer = null;

function startSimulation() {
    // Controllo se l'array dei dati è vuoto
    if (!allCandles.length) {
        showError('Nessun dato nel CSV.');
        return;
    }
    // Se c'è un timer attivo lo resetto per evitare sovrapposizioni
    if (simTimer) {
        clearInterval(simTimer);
        simTimer = null;
    }
    // Recupero lo stato dell'asset per sapere da dove ripartire
    const state = symbolState[currentSymbol] || {};
    const seed = Math.min(candlesWindow, allCandles.length);
    state.seed = seed;
    // Calcolo il punto di ripresa della simulazione
    const resumePtr = Math.max(seed, Math.min(state.ptr || seed, allCandles.length));
    candlePtr = resumePtr;
    symbolState[currentSymbol] = state;
    // Aggiorno i prezzi nell'interfaccia e disegno il grafico
    setPricesUI(allCandles[candlePtr - 1]);
    drawAll();
    // Avvio il ciclo che aggiorna la simulazione ogni secondo
    simTimer = setInterval(() => {
        // Se arrivo alla fine del CSV, ricomincio il giro
        if (candlePtr >= allCandles.length) {
            candlePtr = seed;
            symbolState[currentSymbol].ptr = candlePtr;
            windowOffsetFromEnd = 0;
            setPricesUI(allCandles[candlePtr - 1]);
            drawAll();
            return;
        }
        // Avanzo di una candela e aggiorno i prezzi a schermo
        candlePtr++;
        symbolState[currentSymbol].ptr = candlePtr;
        if (windowOffsetFromEnd === 0) {
        }
        setPricesUI(allCandles[candlePtr - 1]);
        // Controllo se l'utente ha posizioni aperte per gestire SL e TP
        const qty = holdings[currentSymbol] || 0;
        if (qty > 0) {
            const { ask, bid } = currentPrices();
            const sl = stopLoss[currentSymbol];
            const tp = takeProfit[currentSymbol];
            // Verifica Stop Loss: vende se il prezzo scende troppo
            if (Number.isFinite(sl) && bid <= sl) {
                const proceeds = bid * qty;
                portfolioCHF += proceeds;
                holdings[currentSymbol] = 0;
                showError('Stop Loss triggered at ' + bid.toFixed(2));
                delete stopLoss[currentSymbol];
                delete takeProfit[currentSymbol];
                updateBalanceUI();
            // Verifica Take Profit: vende se si raggiunge il guadagno impostato
            } else if (Number.isFinite(tp) && ask >= tp) {
                const proceeds = ask * qty;
                portfolioCHF += proceeds;
                holdings[currentSymbol] = 0;
                showError('Take Profit triggered at ' + ask.toFixed(2));
                delete stopLoss[currentSymbol];
                delete takeProfit[currentSymbol];
                updateBalanceUI();
            }
        }
        // Ridissegno tutto il grafico aggiornato
        drawAll();
    }, CANDLE_UPDATE_MS);
}

async function loadSymbol(symbol) {
    rememberCurrentState();
    currentSymbol = symbol;
    try {
        const url = CSV_MAP[symbol];
        if (!url) throw new Error('CSV non configurato per ' + symbol);
        const res = await fetch(url + '?t=' + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error('Impossibile caricare CSV');
        const text = await res.text();
        allCandles = parseCSV(text);
        if (!allCandles.length) throw new Error('CSV vuoto o intestazioni non riconosciute. Attese colonne: Unix,Open,High,Low,Close');
        symbolState[currentSymbol] = symbolState[currentSymbol] || {};
        startSimulation();
        updateBalanceUI();
    } catch (e) {
        console.error(e);
        showError('Errore dati: ' + (e && e.message ? e.message : e));
    }
}

// --- Profile dropdown + boot ---
function setupProfileMenu() {
    const profile = document.getElementById('profile');
    const menu = document.getElementById('profileMenu');
    const logout = document.getElementById('logoutLink');
    
    profile.addEventListener('click', (e) => {
        e.stopPropagation();
        const v = getComputedStyle(menu).display;
        menu.style.display = (v === 'none') ? 'block' : 'none';
    });

    
    
    logout.addEventListener('click', (e) => {
        e.preventDefault();

        // Se ci sono posizioni aperte, impedisci il logout
        if (hasOpenPositions()) {
            alert('Chiudi le posizioni aperte prima di effettuare il logout.');
            return;
        }

        // Prepara i dati da mandare al server (saldo attuale)
        const formData = new FormData();
        formData.append('saldo', portfolioCHF);

        // Invia il saldo al server prima di fare il logout
        fetch('logout.php', {
            method: 'POST',
            body: formData
        }).then(() => {
            // Dopo aver salvato il saldo, reindirizza alla pagina di login
            window.location.href = 'login.html';
        }).catch((err) => {
            console.error('Errore durante il logout:', err);
            alert('Errore durante il logout. Riprova.');
        });
    });

// Chiude il menu profilo se clicchi fuori
document.addEventListener('click', () => {
    menu.style.display = 'none';
});

}

window.onload = function() {
    document.getElementById('selectedName').textContent = DEFAULT_ASSET.label;
    const selectedImage = document.getElementById('selectedImage');
    if (selectedImage && DEFAULT_ASSET.image) {
        selectedImage.src = DEFAULT_ASSET.image;
        selectedImage.alt = DEFAULT_ASSET.label;
    }
    sizeCanvases();
    setupProfileMenu();
    loadSymbol(DEFAULT_ASSET.csvSymbol);
}


