import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { generate } from './anthropicService';
import { OutputType } from './prompts';

export class PmCopilotViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'pmCopilot.sidebarView';

	private _view?: vscode.WebviewView;

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this._extensionUri, 'media'),
			],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async (message) => {
			if (message.type === 'generate') {
				await this._handleGenerate(
					webviewView.webview,
					message.input,
					message.outputType
				);
			}
		});
	}

	private async _handleGenerate(
		webview: vscode.Webview,
		input: string,
		outputType: OutputType
	) {
		if (!input.trim()) {
			webview.postMessage({ type: 'error', message: 'Please enter a feature description.' });
			return;
		}

		const config = vscode.workspace.getConfiguration('pmCopilot');
		const apiKey = config.get<string>('anthropicApiKey');

		if (!apiKey) {
			const action = await vscode.window.showErrorMessage(
				'Anthropic API key not set. Add it in Settings.',
				'Open Settings'
			);
			if (action === 'Open Settings') {
				vscode.commands.executeCommand(
					'workbench.action.openSettings',
					'pmCopilot.anthropicApiKey'
				);
			}
			webview.postMessage({ type: 'error', message: 'API key not configured.' });
			return;
		}

		try {
			const result = await generate(apiKey, input, outputType);
			webview.postMessage({ type: 'response', content: result });
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			webview.postMessage({ type: 'error', message: errorMessage });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview): string {
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'style.css')
		);
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
		);
		const nonce = crypto.randomBytes(16).toString('hex');
		const cspSource = webview.cspSource;

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy"
		content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}'; connect-src https://api.anthropic.com;">
	<link href="${styleUri}" rel="stylesheet">
	<title>PM Copilot</title>
</head>
<body>
	<div class="container">
		<label for="input">Feature description or user feedback</label>
		<textarea id="input" rows="6"
			placeholder="Paste a feature request, user feedback, or product idea..."></textarea>

		<label for="outputType">Output type</label>
		<select id="outputType">
			<option value="prd">PRD Outline</option>
			<option value="userStory">User Stories</option>
			<option value="riskAnalysis">Risk Analysis</option>
		</select>

		<button id="generateBtn">Generate</button>

		<div id="output" class="output" hidden></div>
	</div>
	<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
	}
}
