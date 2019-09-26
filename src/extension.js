'use strict';

const vscode = require('vscode');
const path = require('path');
const { readHtml, isEqual } = require('./util');

const getConfig = () => {
  const editorSettings = vscode.workspace.getConfiguration('editor', null);
  const extensionSettings = vscode.workspace.getConfiguration('codesnap', null);

  const enableLigatures = editorSettings.get('fontLigatures', false);
  const editor = vscode.window.activeTextEditor;
  const tabSize = editor ? editor.options.tabSize : editorSettings.get('tabSize', 4);

  const showWindowControls = extensionSettings.get('showWindowControls', true);
  const showLineNumbers = extensionSettings.get('showLineNumbers', true);

  return { enableLigatures, tabSize, showWindowControls, showLineNumbers };
};

module.exports.activate = context => {
  context.subscriptions.push(
    vscode.commands.registerCommand('codesnap.start', async () => {
      const html = await readHtml(path.resolve(context.extensionPath, 'webview/index.html'));

      const panel = vscode.window.createWebviewPanel(
        'codesnap',
        'CodeSnap 📸',
        vscode.ViewColumn.Two,
        { enableScripts: true }
      );
      panel.webview.html = html;

      const update = () => {
        vscode.commands.executeCommand('editor.action.clipboardCopyAction');
        panel.postMessage({ type: 'update', ...getConfig() });
      };

      const editor = vscode.window.activeTextEditor;
      const selection = editor && editor.selection;
      if (selection && !isEqual(selection.start, selection.end)) {
        update();
      }

      const selectionHandler = vscode.window.onDidChangeTextEditorSelection(e => {
        if (!e.selections[0] || e.selections[0].isEmpty) return;
        update();
      });
      panel.onDidDispose(() => selectionHandler.dispose());
    })
  );
};
