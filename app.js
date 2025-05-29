
function analyzeNote() {
    const start = performance.now();
    const file = document.getElementById("imageInput").files[0];
    if (!file) return;

    const results = document.getElementById("results");
    results.innerHTML = "<p>🔍 Erkenne Text...</p>";
    const img = URL.createObjectURL(file);

    Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
        const serial = (text.match(/[A-Z]{1,2}[0-9]{10}/) || [null])[0];
        if (!serial) {
            results.innerHTML = "<p>❌ Seriennummer konnte nicht erkannt werden.</p>";
            return;
        }

        const digits = serial.replace(/\D/g, '').split('').map(d => parseInt(d));
        const sum = digits.reduce((a, b) => a + b, 0);
        const cross = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
        const code = serial.slice(0, 2);
        const date = new Date().toLocaleString();
        const duration = ((performance.now() - start) / 1000).toFixed(2);

        results.innerHTML = `
            <h3>Analyseergebnisse (bearbeitbar)</h3>
            <label>Seriennummer: <input id="serial" value="${serial}"></label><br>
            <label>Ziffernfolge: <input id="digits" value="${digits.join(' ')}"></label><br>
            <label>Ziffernsumme: <input id="sum" value="${sum}"></label><br>
            <label>Quersumme: <input id="crossSum" value="${cross}"></label><br>
            <label>Ländercode: <input id="code" value="${code}"></label><br>
            <label>Aufnahmedatum: <input id="date" value="${date}"></label><br>
            <label>⏱ Analysezeit: ${duration} Sekunden</label><br>
            <label>Verfasser: <input id="authorName"></label><br><br>
            <img src="${img}" width="300"><br><br>
            <button onclick="save('${img}')">📄 Speichern & Dokumentieren</button>
        `;
    });
}

function save(img) {
    const entry = {
        serial: document.getElementById("serial").value,
        digits: document.getElementById("digits").value,
        sum: document.getElementById("sum").value,
        crossSum: document.getElementById("crossSum").value,
        country: document.getElementById("code").value,
        date: document.getElementById("date").value,
        name: document.getElementById("authorName").value || "Unbekannt",
        img: img
    };
    const encoded = encodeURIComponent(JSON.stringify([entry]));
    window.open("dokumentation.html?data=" + encoded, "_blank");
}
