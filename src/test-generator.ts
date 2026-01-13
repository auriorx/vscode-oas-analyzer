// Test setup script - prepares example-api-output.yaml for testing
import * as fs from 'fs';
import * as path from 'path';

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
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
runTest();
