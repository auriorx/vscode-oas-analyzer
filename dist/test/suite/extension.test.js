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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');
    test('Generate components for PlatformUser using inline shortcut', function () {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            this.timeout(15000); // Increase timeout to 15 seconds
            // Get workspace root
            const workspaceRoot = (_b = (_a = vscode.workspace.workspaceFolders) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.uri.fsPath;
            if (!workspaceRoot) {
                throw new Error('No workspace folder found');
            }
            console.log('📁 Workspace root:', workspaceRoot);
            const inputPath = path.join(workspaceRoot, 'example-api.yaml');
            const outputPath = path.join(workspaceRoot, 'example-api-output.yaml');
            // Check if input file exists
            if (!fs.existsSync(inputPath)) {
                throw new Error(`Input file not found: ${inputPath}`);
            }
            // Copy example-api.yaml to example-api-output.yaml
            fs.copyFileSync(inputPath, outputPath);
            console.log('✅ Copied file');
            // Open the output file
            const doc = yield vscode.workspace.openTextDocument(outputPath);
            const editor = yield vscode.window.showTextDocument(doc);
            console.log('✅ Opened document');
            // Find the paths section
            const text = doc.getText();
            const lines = text.split('\n');
            const pathsLineIndex = lines.findIndex(line => line.trim() === 'paths:');
            if (pathsLineIndex === -1) {
                throw new Error('Could not find paths: section in example-api.yaml');
            }
            console.log(`✅ Found paths section at line ${pathsLineIndex}`);
            // Insert a line after paths: WITHOUT the semicolon first
            const insertPosition = new vscode.Position(pathsLineIndex + 1, 0);
            yield editor.edit(editBuilder => {
                editBuilder.insert(insertPosition, '  EA:PlatformUser');
            });
            console.log('✅ Inserted shortcut without semicolon');
            yield new Promise(resolve => setTimeout(resolve, 500));
            // Now add the semicolon to trigger the extension
            const lineAfterPaths = pathsLineIndex + 1;
            const lineEndPos = doc.lineAt(lineAfterPaths).range.end;
            yield editor.edit(editBuilder => {
                editBuilder.insert(lineEndPos, ';');
            });
            console.log('✅ Added semicolon to trigger extension');
            // Wait for the extension to process
            yield new Promise(resolve => setTimeout(resolve, 3000));
            // Save to ensure changes are written
            yield doc.save();
            console.log('✅ Saved document');
            // Wait after save
            yield new Promise(resolve => setTimeout(resolve, 2000));
            // Read the result
            const content = fs.readFileSync(outputPath, 'utf-8');
            console.log('📄 File content preview:');
            console.log(content.substring(0, 500));
            // Verify expected components were generated
            try {
                assert.ok(content.includes('PlatformUserId:'), 'Should generate PlatformUserId parameter');
                assert.ok(content.includes('name: platformuserId'), 'Should use lowercase platformuserId');
                assert.ok(content.includes('Sort.PlatformUsers:'), 'Should generate Sort.PlatformUsers parameter');
                assert.ok(content.includes('PostPlatformUsersRequest:'), 'Should generate PostPlatformUsersRequest');
                assert.ok(content.includes('PutPlatformUserRequest:'), 'Should generate PutPlatformUserRequest');
                assert.ok(content.includes('GetPlatformUserResponse:'), 'Should generate GetPlatformUserResponse');
                assert.ok(content.includes('GetPlatformUsersResponse:'), 'Should generate GetPlatformUsersResponse');
                assert.ok(content.includes('PlatformUser:'), 'Should generate PlatformUser schema');
                assert.ok(content.includes('PaginatedPlatformUsers:'), 'Should generate PaginatedPlatformUsers schema');
                assert.ok(content.includes('Pagination:'), 'Should generate Pagination schema');
                assert.ok(content.includes('x-correlation-id:'), 'Should generate x-correlation-id header');
                console.log('✅ All assertions passed!');
            }
            catch (error) {
                console.error('❌ Assertion failed:', error.message);
                throw error;
            }
        });
    });
});
