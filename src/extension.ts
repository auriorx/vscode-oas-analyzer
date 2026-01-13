import * as vscode from "vscode";
import { expandInlinePathShortcutIfMatched } from "./features/ExpandInlinePathShortcut";
import { generateMissingRefs } from "./utils/ComponentGenerator";

export function activate(context: vscode.ExtensionContext) {
  console.log("✅ OAS Analyzer activated");

  let lastTagGenerated: string | undefined;
  let lastTimestamp = 0;

  // 🚀 One unified listener for typing + post-expansion
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      const now = Date.now();

      const result = await expandInlinePathShortcutIfMatched(event);
      console.log(`📊 Expansion result:`, result);
      if (
        result?.tag &&
        result.auto &&
        (result.tag !== lastTagGenerated || now - lastTimestamp > 1000)
      ) {
        console.log(`🎯 Triggering component generation for tag: ${result.tag}`);
        lastTagGenerated = result.tag;
        lastTimestamp = now;

        // Add a short delay to avoid race conditions with formatting
        setTimeout(async () => {
          console.log(`⏰ Calling generateMissingRefs for tag: ${result.tag}`);
          await generateMissingRefs(event.document, result.tag);
        }, 100);
      } else {
        console.log(`⏭️ Skipping component generation - result.tag=${result?.tag}, result.auto=${result?.auto}, sameasLast=${result?.tag === lastTagGenerated}`);
      }
    })
  );

  // 🎯 Optional: Manual trigger from F1 or keybinding
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "oasAnalyzer.expandInlineShortcut",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const lineNumber = editor.selection.active.line;
        const line = document.lineAt(lineNumber);

        const fakeEvent: vscode.TextDocumentChangeEvent = {
          document,
          reason: vscode.TextDocumentChangeReason.Undo,
          contentChanges: [
            {
              text: ";",
              range: line.range,
              rangeOffset: document.offsetAt(line.range.start),
              rangeLength: line.text.length,
            },
          ],
        };

        await expandInlinePathShortcutIfMatched(fakeEvent);
      }
    )
  );
}
