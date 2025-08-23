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
exports.expandInlinePathShortcutIfMatched = expandInlinePathShortcutIfMatched;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const TemplateRenderer_1 = require("../utils/TemplateRenderer");
let lastExpansionKey = "";
let lastExpansionTime = 0;
let lastExpandedLine = -1;
let lastExpandedTag = "";
let lastExpandedTime = 0;
function expandInlinePathShortcutIfMatched(event) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = event.document;
        if (document.languageId !== "yaml")
            return;
        const changes = event.contentChanges;
        if (changes.length !== 1 || !changes[0].text.includes(";"))
            return;
        const change = changes[0];
        const lineNumber = change.range.start.line;
        const lineText = document.lineAt(lineNumber).text.trim();
        const match = lineText.match(/^(EA|E):\s*([A-Z][a-zA-Z0-9]*)\s*;$/);
        if (!match)
            return;
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
        if (lineNumber === lastExpandedLine &&
            tag === lastExpandedTag &&
            now - lastExpandedTime < 500) {
            console.log(`[OAS] Skipping duplicate expansion for ${tag} at line ${lineNumber}`);
            return;
        }
        lastExpandedLine = lineNumber;
        lastExpandedTag = tag;
        lastExpandedTime = now;
        const templatePath = path.join(__dirname, "../templates/path.yaml");
        const template = fs.readFileSync(templatePath, "utf-8");
        const rendered = (0, TemplateRenderer_1.renderPathTemplate)(template, tag);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, document.lineAt(lineNumber).range, rendered);
        yield vscode.workspace.applyEdit(edit);
        vscode.window.showInformationMessage(`🚀 Expanded CRUD path for '${tag}'`);
        return { tag, auto: mode === "EA" };
    });
}
