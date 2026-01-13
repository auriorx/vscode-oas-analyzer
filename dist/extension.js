"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const ExpandInlinePathShortcut_1 = require("./features/ExpandInlinePathShortcut");
const ComponentGenerator_1 = require("./utils/ComponentGenerator");
function activate(context) {
    console.log("✅ OAS Analyzer activated");
    let lastTagGenerated;
    let lastTimestamp = 0;
    // 🚀 One unified listener for typing + post-expansion
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => __awaiter(this, void 0, void 0, function* () {
        const now = Date.now();
        const result = yield (0, ExpandInlinePathShortcut_1.expandInlinePathShortcutIfMatched)(event);
        console.log(`📊 Expansion result:`, result);
        if ((result === null || result === void 0 ? void 0 : result.tag) &&
            result.auto &&
            (result.tag !== lastTagGenerated || now - lastTimestamp > 1000)) {
            console.log(`🎯 Triggering component generation for tag: ${result.tag}`);
            lastTagGenerated = result.tag;
            lastTimestamp = now;
            // Add a short delay to avoid race conditions with formatting
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                console.log(`⏰ Calling generateMissingRefs for tag: ${result.tag}`);
                yield (0, ComponentGenerator_1.generateMissingRefs)(event.document, result.tag);
            }), 100);
        }
        else {
            console.log(`⏭️ Skipping component generation - result.tag=${result === null || result === void 0 ? void 0 : result.tag}, result.auto=${result === null || result === void 0 ? void 0 : result.auto}, sameasLast=${(result === null || result === void 0 ? void 0 : result.tag) === lastTagGenerated}`);
        }
    })));
    // 🎯 Optional: Manual trigger from F1 or keybinding
    context.subscriptions.push(vscode.commands.registerCommand("oasAnalyzer.expandInlineShortcut", () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const lineNumber = editor.selection.active.line;
        const line = document.lineAt(lineNumber);
        const fakeEvent = {
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
        yield (0, ExpandInlinePathShortcut_1.expandInlinePathShortcutIfMatched)(fakeEvent);
    })));
}
