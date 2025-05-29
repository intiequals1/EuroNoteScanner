const { Octokit } = require("@octokit/rest");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = "EuroNoteScanner";
  const owner = "intiequals1";
  const path = "docs/entries.json";
  const branch = "main";

  const octokit = new Octokit({ auth: token });

  const newEntry = JSON.parse(event.body);

  try {
    let sha;
    let entries = [];

    try {
      const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
      sha = data.sha;
      const content = Buffer.from(data.content, "base64").toString();
      entries = JSON.parse(content);
    } catch (err) {
      if (err.status === 404) {
        entries = [];
      } else {
        throw err;
      }
    }

    entries.push(newEntry);

    const updatedContent = Buffer.from(JSON.stringify(entries, null, 2)).toString("base64");

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "Eintrag automatisch über Webapp gespeichert",
      content: updatedContent,
      sha,
      branch,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Erfolgreich gespeichert!" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};