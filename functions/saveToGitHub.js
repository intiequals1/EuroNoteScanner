import { Octokit } from "@octokit/core";
import { config } from "dotenv";

config(); // falls du lokal .env verwendest

export const handler = async (event) => {
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
    const {
      data: { sha, content },
    } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path,
      ref: branch,
    });

    const decodedContent = Buffer.from(content, "base64").toString();
    const entries = JSON.parse(decodedContent);
    entries.push(newEntry);

    const updatedContent = Buffer.from(JSON.stringify(entries, null, 2)).toString("base64");

    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path,
      message: "Update entries.json via Netlify Function",
      content: updatedContent,
      sha,
      branch,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Saved successfully." }),
    };
  } catch (error) {
    if (error.status === 404) {
      // Datei existiert noch nicht
      const initialContent = Buffer.from(JSON.stringify([newEntry], null, 2)).toString("base64");

      await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
        owner,
        repo,
        path,
        message: "Create entries.json via Netlify Function",
        content: initialContent,
        branch,
      });

      return {
        statusCode: 201,
        body: JSON.stringify({ message: "Created new entries.json" }),
      };
    }

    return {
      statusCode: 500,
      body: `Error: ${error.message}`,
    };
  }
};
