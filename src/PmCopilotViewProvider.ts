import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { generate, askClarifyingQuestions, AiProvider } from './aiService';
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
			switch (message.type) {
				case 'askQuestions':
					await this._handleAskQuestions(
						webviewView.webview,
						message.input,
						message.provider
					);
					break;
				case 'generate':
					await this._handleGenerate(
						webviewView.webview,
						message.input,
						message.outputTypes,
						message.provider,
						message.answers
					);
					break;
				case 'copy':
					await vscode.env.clipboard.writeText(message.text);
					vscode.window.showInformationMessage('Copied to clipboard!');
					break;
			}
		});
	}

	private async _handleAskQuestions(
		webview: vscode.Webview,
		input: string,
		provider: AiProvider
	) {
		if (!input.trim()) {
			webview.postMessage({ type: 'error', message: 'Please enter a feature description.' });
			return;
		}

		const tokenSource = new vscode.CancellationTokenSource();

		try {
			webview.postMessage({ type: 'progress', message: 'Analyzing your idea...' });
			const questions = await askClarifyingQuestions(provider, input, tokenSource.token);

			if (questions.length === 0) {
				// No questions generated — go straight to generation
				webview.postMessage({ type: 'noQuestions' });
			} else {
				webview.postMessage({ type: 'questions', questions });
			}
		} catch (err: unknown) {
			this._handleError(webview, err);
		} finally {
			tokenSource.dispose();
		}
	}

	private async _handleGenerate(
		webview: vscode.Webview,
		input: string,
		outputTypes: OutputType[],
		provider: AiProvider,
		answers?: { question: string; answer: string }[]
	) {
		if (!outputTypes || outputTypes.length === 0) {
			webview.postMessage({ type: 'error', message: 'Please select at least one deliverable.' });
			return;
		}

		// Build the enriched prompt
		let enrichedInput = input;
		if (answers && answers.length > 0) {
			const qaBlock = answers
				.filter((a) => a.answer.trim())
				.map((a) => `Q: ${a.question}\nA: ${a.answer}`)
				.join('\n\n');
			if (qaBlock) {
				enrichedInput = `${input}\n\n--- Additional Context ---\n${qaBlock}`;
			}
		}

		const tokenSource = new vscode.CancellationTokenSource();

		try {
			const sections: string[] = [];

			for (const outputType of outputTypes) {
				webview.postMessage({
					type: 'progress',
					message: `Generating ${formatOutputType(outputType)}...`,
					current: outputTypes.indexOf(outputType) + 1,
					total: outputTypes.length,
				});

				const result = await generate(provider, enrichedInput, outputType, tokenSource.token);
				sections.push(result);
			}

			webview.postMessage({ type: 'response', content: sections.join('\n\n---\n\n') });
		} catch (err: unknown) {
			this._handleError(webview, err);
		} finally {
			tokenSource.dispose();
		}
	}

	private _handleError(webview: vscode.Webview, err: unknown) {
		const errorMessage = err instanceof Error ? err.message : 'Unknown error';

		if (errorMessage.startsWith('MISSING_KEY:')) {
			const providerName = errorMessage.split(':')[1];
			const settingKey = providerName === 'anthropic'
				? 'pmCopilot.anthropicApiKey'
				: 'pmCopilot.openaiApiKey';
			vscode.window.showErrorMessage(
				`${providerName === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key not set. Add it in Settings.`,
				'Open Settings'
			).then((action) => {
				if (action === 'Open Settings') {
					vscode.commands.executeCommand('workbench.action.openSettings', settingKey);
				}
			});
			webview.postMessage({ type: 'error', message: 'API key not configured.' });
		} else {
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

		const config = vscode.workspace.getConfiguration('pmCopilot');
		const savedProvider = config.get<string>('aiProvider') || 'copilot';

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy"
		content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}';">
	<link href="${styleUri}" rel="stylesheet">
	<title>PM Copilot</title>
</head>
<body>
	<div class="container">
		<label for="input">Feature description or user feedback</label>
		<textarea id="input" rows="6"
			placeholder="Paste a feature request, user feedback, or product idea..."></textarea>

		<label>AI Provider</label>
		<select id="provider">
			<option value="copilot"${savedProvider === 'copilot' ? ' selected' : ''}>VS Code Copilot (no key needed)</option>
			<option value="anthropic"${savedProvider === 'anthropic' ? ' selected' : ''}>Anthropic Claude</option>
			<option value="openai"${savedProvider === 'openai' ? ' selected' : ''}>OpenAI GPT-4o</option>
		</select>

		<label>Deliverables</label>
		<div class="checkbox-group">
			<label class="checkbox-label">
				<input type="checkbox" id="selectAll" checked> Select All
			</label>
			<label class="checkbox-label">
				<input type="checkbox" class="deliverable-cb" value="brief" checked> Product Brief
			</label>
			<label class="checkbox-label">
				<input type="checkbox" class="deliverable-cb" value="userStory" checked> User Stories
			</label>
			<label class="checkbox-label">
				<input type="checkbox" class="deliverable-cb" value="riskAnalysis" checked> Risk Analysis
			</label>
		</div>

		<button id="generateBtn">Generate</button>

		<!-- Clarifying questions section -->
		<div id="questionsWrapper" hidden>
			<div class="section-header">
				<span class="section-title">A few quick questions</span>
			</div>
			<div id="questionsContainer"></div>
			<div class="questions-actions">
				<button id="submitAnswersBtn">Generate with Answers</button>
				<button id="skipQuestionsBtn" class="secondary-btn">Skip &mdash; Surprise Me</button>
			</div>
		</div>

		<!-- Output section -->
		<div id="outputWrapper" hidden>
			<div class="output-header">
				<span class="section-title">Output</span>
				<button id="copyBtn" class="copy-btn" title="Copy to clipboard">Copy</button>
			</div>
			<div id="output" class="output"></div>
		</div>
	</div>
	<script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
	}
}

function formatOutputType(type: OutputType): string {
	switch (type) {
		case 'brief': return 'Product Brief';
		case 'userStory': return 'User Stories';
		case 'riskAnalysis': return 'Risk Analysis';
		default: return type;
	}
}
