import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Generate components for PlatformUser using inline shortcut', async function() {
    this.timeout(15000); // Increase timeout to 15 seconds
    
    // Get workspace root
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
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
    const doc = await vscode.workspace.openTextDocument(outputPath);
    const editor = await vscode.window.showTextDocument(doc);
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
    await editor.edit(editBuilder => {
      editBuilder.insert(insertPosition, '  EA:PlatformUser');
    });
    
    console.log('✅ Inserted shortcut without semicolon');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Now add the semicolon to trigger the extension
    const lineAfterPaths = pathsLineIndex + 1;
    const lineEndPos = doc.lineAt(lineAfterPaths).range.end;
    await editor.edit(editBuilder => {
      editBuilder.insert(lineEndPos, ';');
    });
    
    console.log('✅ Added semicolon to trigger extension');
    
    // Wait for the extension to process
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Save to ensure changes are written
    await doc.save();
    console.log('✅ Saved document');
    
    // Wait after save
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    } catch (error: any) {
      console.error('❌ Assertion failed:', error.message);
      throw error;
    }
  });
});
