import * as vscode from 'vscode';
import { PmCopilotViewProvider } from './PmCopilotViewProvider';

export function activate(context: vscode.ExtensionContext) {
	const provider = new PmCopilotViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			PmCopilotViewProvider.viewType,
			provider
		)
	);
}

export function deactivate() {}
