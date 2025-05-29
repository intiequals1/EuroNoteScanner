
async function processImage() {
    const file = document.getElementById('imageInput').files[0];
    if (!file) return;

    const img = URL.createObjectURL(file);

    const resultContainer = document.getElementById('results');
    resultContainer.innerHTML = "<p>Erkenne Text...</p>";

    const { data: { text } } = await Tesseract.recognize(
        file,
        'eng',
        { logger: m => console.log(m) }
    );

    const digits = text.replace(/\D/g, '');
    const sum = digits.split('').reduce((acc, d) => acc + parseInt(d), 0);
    const final = sum.toString().split('').reduce((acc, d) => acc + parseInt(d), 0);

    resultContainer.innerHTML = `
        <h3>Ergebnisse</h3>
        <p><strong>Erkannter Text:</strong><br>${text}</p>
        <p><strong>Ziffernsumme:</strong> ${sum}</p>
        <p><strong>Quersumme:</strong> ${final}</p>
        <p><strong>Aufnahmedatum:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Bild:</strong><br><img src="${img}" width="300"/></p>
    `;
}
