// functions/saveToGitHub.js
import { Octokit } from "octokit";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const token = process.env.GITHUB_TOKEN;
  const octokit = new Octokit({ auth: token });

  const repo = "EuroNoteScanner";
  const owner = "intiequals1";
  const path = "docs/entries.json";
  const branch = "main";

  const newEntry = req.body;

  try {
    // Hole vorhandene Datei
    const { data: file } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch
    });

    const sha = file.sha;
    const content = Buffer.from(file.content, "base64").toString();
    const entries = JSON.parse(content);
    entries.push(newEntry);

    // Aktualisiere Datei
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "📄 Neue Banknoten-Analyse hinzugefügt",
      content: Buffer.from(JSON.stringify(entries, null, 2)).toString("base64"),
      sha,
      branch
    });

    return res.status(200).json({ message: "Erfolgreich gespeichert" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
