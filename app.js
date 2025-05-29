
function extractDigits(serial) {
    return serial.replace(/\D/g, '').split('').map(d => parseInt(d));
}

function sumDigits(digits) {
    const sum = digits.reduce((a, b) => a + b, 0);
    const cross = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    return { sum, cross };
}

function getCountryCode(letter) {
    const map = {
        'X': 'Deutschland', 'Y': 'Griechenland', 'Z': 'Belgien',
        'N': 'Österreich', 'U': 'Frankreich', 'S': 'Italien',
        'P': 'Niederlande', 'M': 'Portugal', 'L': 'Finnland'
    };
    return map[letter] || 'Unbekannt';
}

async function analyzeNote() {
    const start = performance.now();
    const file = document.getElementById("imageInput").files[0];
    if (!file) return;

    const results = document.getElementById("results");
    results.innerHTML = "<p>🔍 Erkenne Text...</p>";

    const img = URL.createObjectURL(file);
    const { data: { text } } = await Tesseract.recognize(file, 'eng');

    const serial = (text.match(/[A-Z]{1}[0-9]{10}/) || [null])[0];
    if (!serial) {
        results.innerHTML = "<p>❌ Seriennummer konnte nicht erkannt werden.</p>";
        return;
    }

    const digits = extractDigits(serial);
    const { sum, cross } = sumDigits(digits);
    const country = getCountryCode(serial[0]);
    const date = new Date().toLocaleString();
    const duration = ((performance.now() - start) / 1000).toFixed(2);

    results.innerHTML = `
        <h3>Analyseergebnisse</h3>
        <p><strong>Seriennummer:</strong> ${serial}</p>
        <p><strong>Ziffernfolge:</strong> ${digits.join(' ')}</p>
        <p><strong>Ziffernsumme:</strong> ${sum}</p>
        <p><strong>Quersumme:</strong> ${cross}</p>
        <p><strong>Ländercode:</strong> ${serial[0]} → ${country}</p>
        <p><strong>Aufnahmedatum:</strong> ${date}</p>
        <p><strong>⏱ Analysezeit:</strong> ${duration} Sekunden</p>
        <p><label>Verfasser: <input type="text" id="authorName"></label></p>
        <p><img src="${img}" width="300"></p>
        <button onclick="save('${serial}', '${img}', '${date}', '${serial[0]}', ${JSON.stringify(digits)}, ${sum}, ${cross})">📄 Speichern & Dokumentieren</button>
    `;
}

function save(serial, img, date, code, digits, sum, crossSum) {
    const name = document.getElementById("authorName").value || "Unbekannt";
    const entry = {
        serial, img, date, country: getCountryCode(code), digits, sum, crossSum, name
    };
    const encoded = encodeURIComponent(JSON.stringify([entry]));
    window.open("dokumentation.html?data=" + encoded, "_blank");
}
