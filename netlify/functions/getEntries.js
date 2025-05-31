import { Octokit } from "@octokit/core";

export const handler = async (event, context) => {
  console.log("🔍 getEntries aufgerufen");

  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  // OPTIONS Request für CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // GitHub API initialisieren
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    const owner = process.env.GITHUB_OWNER || "intiequals1";
    const repo = process.env.GITHUB_REPO || "EuroNoteScanner";
    const filename = "docs/entries.json";

    console.log(`📂 Versuche ${filename} von ${owner}/${repo} zu laden...`);

    // Datei von GitHub abrufen
    const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: owner,
      repo: repo,
      path: filename
    });

    // Base64 dekodieren
    const content = Buffer.from(response.data.content, 'base64').toString('utf8');
    console.log("✅ Datei erfolgreich geladen, Größe:", content.length);

    // JSON parsen
    let entries = [];
    try {
      entries = JSON.parse(content);
      console.log("📊 Anzahl Einträge:", entries.length);
    } catch (parseError) {
      console.warn("⚠️ JSON Parse Fehler:", parseError.message);
      // Falls die Datei leer oder ungültig ist, leeres Array zurückgeben
      entries = [];
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        entries: entries,
        count: entries.length,
        lastModified: response.data.sha,
        status: "Daten erfolgreich aus GitHub geladen"
      })
    };

  } catch (error) {
    console.error("❌ GitHub API Fehler:", error);

    // Spezifische Fehlerbehandlung
    if (error.status === 404) {
      console.log("📄 entries.json noch nicht vorhanden, gebe leeres Array zurück");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          entries: [],
          count: 0,
          status: "Noch keine Einträge vorhanden - dies ist normal bei der ersten Nutzung"
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        status: error.status || "Unbekannter Fehler",
        entries: [],
        count: 0
      })
    };
  }
};