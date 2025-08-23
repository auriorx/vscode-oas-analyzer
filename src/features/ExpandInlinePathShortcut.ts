import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { renderPathTemplate } from "../utils/TemplateRenderer";

let lastExpansionKey = "";
let lastExpansionTime = 0;
let lastExpandedLine = -1;
let lastExpandedTag = "";
let lastExpandedTime = 0;

export async function expandInlinePathShortcutIfMatched(
  event: vscode.TextDocumentChangeEvent
): Promise<{ tag: string; auto: boolean } | undefined> {
  const document = event.document;
  if (document.languageId !== "yaml") return;

  const changes = event.contentChanges;
  if (changes.length !== 1 || !changes[0].text.includes(";")) return;

  const change = changes[0];
  const lineNumber = change.range.start.line;
  const lineText = document.lineAt(lineNumber).text.trim();

  const match = lineText.match(/^(EA|E):\s*([A-Z][a-zA-Z0-9]*)\s*;$/);
  if (!match) return;

  const [, mode, tag] = match;
  const key = `${event.document.uri.toString()}::${lineNumber}::${tag}`;
  const now = Date.now();

  if (key === lastExpansionKey && now - lastExpansionTime < 500) {
    console.log(`[OAS] Skipping duplicate expansion for ${key}`);
    return;
  }

  lastExpansionKey = key;
  lastExpansionTime = now;

  // ⛔ Debounce: same tag on same line within 500ms
  if (
    lineNumber === lastExpandedLine &&
    tag === lastExpandedTag &&
    now - lastExpandedTime < 500
  ) {
    console.log(
      `[OAS] Skipping duplicate expansion for ${tag} at line ${lineNumber}`
    );
    return;
  }

  lastExpandedLine = lineNumber;
  lastExpandedTag = tag;
  lastExpandedTime = now;

  const templatePath = path.join(__dirname, "../templates/path.yaml");
  const template = fs.readFileSync(templatePath, "utf-8");
  const rendered = renderPathTemplate(template, tag);

  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, document.lineAt(lineNumber).range, rendered);
  await vscode.workspace.applyEdit(edit);

  vscode.window.showInformationMessage(`🚀 Expanded CRUD path for '${tag}'`);
  return { tag, auto: mode === "EA" };
}
