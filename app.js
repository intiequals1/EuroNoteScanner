function analyzeNote() {
  const start = performance.now();
  const file = document.getElementById("imageInput").files[0];
  if (!file) {
    alert("Bitte wählen Sie zuerst ein Bild aus!");
    return;
  }

  const results = document.getElementById("results");
  results.innerHTML = "<p>🔍 Erkenne Text...</p>";
  const img = URL.createObjectURL(file);

  Tesseract.recognize(file, 'eng', {
    logger: m => {
      if (m.status === 'recognizing text') {
        const progress = Math.round(m.progress * 100);
        results.innerHTML = `<p>🔍 Erkenne Text... ${progress}%</p>`;
      }
    }
  }).then(({ data: { text } }) => {
    console.log("OCR Ergebnis:", text);
    
    // KORRIGIERT: Euro-Seriennummern können 10-11 Ziffern haben
    const serial = (text.match(/[A-Z]{1,2}[0-9]{10,11}/) || [null])[0];
    if (!serial) {
      results.innerHTML = "<p>❌ Seriennummer konnte nicht erkannt werden.</p>";
      return;
    }

    const digits = serial.replace(/\D/g, '').split('').map(d => parseInt(d));
    const sum = digits.reduce((a, b) => a + b, 0);
    const cross = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    
    // KORRIGIERT: Ländercode richtig extrahieren
    const code = serial.replace(/[0-9]/g, ''); // Nur Buchstaben
    const date = new Date().toLocaleString('de-DE');
    const duration = ((performance.now() - start) / 1000).toFixed(2);

    results.innerHTML = `
      <h3>Analyseergebnisse (bearbeitbar)</h3>
      <label>Seriennummer: <input id="serial" value="${serial}"></label><br>
      <label>Ziffernfolge: <input id="digits" value="${digits.join(' ')}"></label><br>
      <label>Ziffernsumme: <input id="sum" value="${sum}"></label><br>
      <label>Quersumme: <input id="crossSum" value="${cross}"></label><br>
      <label>Ländercode: <input id="code" value="${code}"></label><br>
      <label>Vertikale Ziffernfolge: <input id="verticalDigits" oninput="calcVerticalCrossSum()"></label><br>
      <label>Quersumme (vertikal): <input id="verticalCrossSum" readonly></label><br>
      <label>Aufnahmedatum: <input id="date" value="${date}"></label><br>
      <label>⏱ Analysezeit: ${duration} Sekunden</label><br>
      <label>Verfasser: <input id="authorName"></label><br><br>
      <img src="${img}" width="300"><br><br>
      <button onclick="saveEntry()">📄 Speichern & Dokumentieren</button>
    `;
  }).catch(error => {
    console.error("OCR Fehler:", error);
    results.innerHTML = `<p>❌ Fehler bei der Texterkennung: ${error.message}</p>`;
  }); // KORRIGIERT: Schließende Klammer hinzugefügt
}

function calcVerticalCrossSum() {
  const input = document.getElementById("verticalDigits").value.replace(/\D/g, "");
  if (input.length === 0) {
    document.getElementById("verticalCrossSum").value = "";
    return;
  }
  const digits = input.split("").map(d => parseInt(d, 10));
  const sum = digits.reduce((a, b) => a + b, 0);
  const cross = sum.toString().split("").reduce((a, b) => a + parseInt(b), 0);
  document.getElementById("verticalCrossSum").value = cross;
}

function saveEntry() {
  try {
    const imgElement = document.querySelector("#results img");
    if (!imgElement) {
      alert("❌ Kein Bild gefunden!");
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    // KORRIGIERT: Sicherstellen dass Bild geladen ist
    const processImage = () => {
      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;
      ctx.drawImage(imgElement, 0, 0);
      const imgBase64 = canvas.toDataURL("image/jpeg", 0.8);

      const entry = {
        serial: document.getElementById("serial").value,
        digits: document.getElementById("digits").value,
        sum: document.getElementById("sum").value,
        crossSum: document.getElementById("crossSum").value,
        verticalDigits: document.getElementById("verticalDigits")?.value || "",
        verticalCrossSum: document.getElementById("verticalCrossSum")?.value || "",
        country: document.getElementById("code").value,
        date: document.getElementById("date").value,
        name: document.getElementById("authorName").value || "Unbekannt",
        img: imgBase64
      };

      // KORRIGIERT: Bessere Fehlerbehandlung
      fetch("/.netlify/functions/saveToGitHub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry)
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(() => {
          alert("✅ Analyse wurde erfolgreich gespeichert!");
          window.location.href = "dokumentation.html";
        })
        .catch(err => {
          console.error("Speicher-Fehler:", err);
          alert("❌ Fehler beim Speichern: " + err.message);
        });
    };

    if (imgElement.complete && imgElement.naturalWidth > 0) {
      processImage();
    } else {
      imgElement.onload = processImage;
    }

  } catch (error) {
    console.error("Fehler beim Speichern:", error);
    alert("❌ Fehler beim Verarbeiten: " + error.message);
  }
}

// ENTFERNT: Die problematischen Zeilen am Ende