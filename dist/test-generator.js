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
Object.defineProperty(exports, "__esModule", { value: true });
// Test setup script - prepares example-api-output.yaml for testing
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function runTest() {
    const inputPath = path.join(__dirname, '../example-api.yaml');
    const outputPath = path.join(__dirname, '../example-api-output.yaml');
    console.log('🧪 Test Setup: Preparing file for extension testing');
    console.log('📥 Input file:', inputPath);
    console.log('📤 Output file:', outputPath);
    try {
        // Copy input to output (always overwrite)
        fs.copyFileSync(inputPath, outputPath);
        console.log('✅ Copied example-api.yaml to example-api-output.yaml');
        console.log('');
        console.log('📋 Next steps to test the extension:');
        console.log('  1. Press F5 to launch Extension Development Host');
        console.log('  2. Open example-api-output.yaml in the dev host');
        console.log('  3. Run command: "OAS: Insert missing components for tag"');
        console.log('  4. Enter tag: PlatformUser');
        console.log('  5. Verify the generated components match your requirements');
        console.log('');
        console.log('✨ The plugin should automatically generate:');
        console.log('  - PlatformUserId parameter (with lowercase platformuserId)');
        console.log('  - Sort.PlatformUsers parameter');
        console.log('  - PostPlatformUsersRequest & PutPlatformUserRequest');
        console.log('  - GetPlatformUserResponse & GetPlatformUsersResponse');
        console.log('  - PlatformUser schemas (base, .Updated, .New)');
        console.log('  - PaginatedPlatformUsers & array schemas');
        console.log('  - Sort.PlatformUser & Sort.PlatformUsers schemas');
        console.log('  - Pagination schema (generic)');
        console.log('  - x-correlation-id header (generic)');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
// Run the test
runTest();
