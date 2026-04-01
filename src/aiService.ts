import * as vscode from 'vscode';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { OutputType, getSystemPrompt, CLARIFYING_QUESTIONS_PROMPT } from './prompts';

export type AiProvider = 'copilot' | 'anthropic' | 'openai';

async function generateWithAnthropic(
	apiKey: string,
	input: string,
	outputType: OutputType
): Promise<string> {
	const client = new Anthropic({ apiKey });
	const response = await client.messages.create({
		model: 'claude-sonnet-4-6',
		max_tokens: 4096,
		system: getSystemPrompt(outputType),
		messages: [{ role: 'user', content: input }],
	});
	const textBlock = response.content.find((b) => b.type === 'text');
	return textBlock?.text ?? 'No output generated.';
}

async function generateWithOpenAI(
	apiKey: string,
	input: string,
	outputType: OutputType
): Promise<string> {
	const client = new OpenAI({ apiKey });
	const response = await client.chat.completions.create({
		model: 'gpt-4o',
		max_tokens: 4096,
		messages: [
			{ role: 'system', content: getSystemPrompt(outputType) },
			{ role: 'user', content: input },
		],
	});
	return response.choices[0]?.message?.content ?? 'No output generated.';
}

async function generateWithCopilot(
	input: string,
	outputType: OutputType,
	token: vscode.CancellationToken
): Promise<string> {
	const models = await vscode.lm.selectChatModels();
	if (models.length === 0) {
		throw new Error(
			'No language models available. Make sure GitHub Copilot is installed and signed in.'
		);
	}

	const model = models[0];
	const systemPrompt = getSystemPrompt(outputType);
	const messages = [
		vscode.LanguageModelChatMessage.User(
			`${systemPrompt}\n\n---\n\n${input}`
		),
	];

	const response = await model.sendRequest(messages, {}, token);
	let result = '';
	for await (const chunk of response.text) {
		result += chunk;
	}
	return result || 'No output generated.';
}

export async function askClarifyingQuestions(
	provider: AiProvider,
	input: string,
	token: vscode.CancellationToken
): Promise<string[]> {
	const config = vscode.workspace.getConfiguration('pmCopilot');
	let raw: string;

	switch (provider) {
		case 'anthropic': {
			const apiKey = config.get<string>('anthropicApiKey');
			if (!apiKey) { throw new Error('MISSING_KEY:anthropic'); }
			const client = new Anthropic({ apiKey });
			const response = await client.messages.create({
				model: 'claude-sonnet-4-6',
				max_tokens: 1024,
				system: CLARIFYING_QUESTIONS_PROMPT,
				messages: [{ role: 'user', content: input }],
			});
			const textBlock = response.content.find((b) => b.type === 'text');
			raw = textBlock?.text ?? '[]';
			break;
		}
		case 'openai': {
			const apiKey = config.get<string>('openaiApiKey');
			if (!apiKey) { throw new Error('MISSING_KEY:openai'); }
			const client = new OpenAI({ apiKey });
			const response = await client.chat.completions.create({
				model: 'gpt-4o',
				max_tokens: 1024,
				messages: [
					{ role: 'system', content: CLARIFYING_QUESTIONS_PROMPT },
					{ role: 'user', content: input },
				],
			});
			raw = response.choices[0]?.message?.content ?? '[]';
			break;
		}
		case 'copilot': {
			const models = await vscode.lm.selectChatModels();
			if (models.length === 0) {
				throw new Error('No language models available. Make sure GitHub Copilot is installed and signed in.');
			}
			const model = models[0];
			const messages = [
				vscode.LanguageModelChatMessage.User(
					`${CLARIFYING_QUESTIONS_PROMPT}\n\n---\n\n${input}`
				),
			];
			const response = await model.sendRequest(messages, {}, token);
			raw = '';
			for await (const chunk of response.text) { raw += chunk; }
			break;
		}
		default:
			throw new Error(`Unknown AI provider: ${provider}`);
	}

	// Extract JSON array from the response (handle markdown code fences)
	const jsonMatch = raw.match(/\[[\s\S]*\]/);
	if (jsonMatch) {
		try {
			const parsed = JSON.parse(jsonMatch[0]);
			if (Array.isArray(parsed)) {
				return parsed.map(String).slice(0, 5);
			}
		} catch { /* fall through */ }
	}
	return [];
}

export async function generate(
	provider: AiProvider,
	input: string,
	outputType: OutputType,
	token: vscode.CancellationToken
): Promise<string> {
	const config = vscode.workspace.getConfiguration('pmCopilot');

	switch (provider) {
		case 'anthropic': {
			const apiKey = config.get<string>('anthropicApiKey');
			if (!apiKey) {
				throw new Error('MISSING_KEY:anthropic');
			}
			return generateWithAnthropic(apiKey, input, outputType);
		}
		case 'openai': {
			const apiKey = config.get<string>('openaiApiKey');
			if (!apiKey) {
				throw new Error('MISSING_KEY:openai');
			}
			return generateWithOpenAI(apiKey, input, outputType);
		}
		case 'copilot':
			return generateWithCopilot(input, outputType, token);
		default:
			throw new Error(`Unknown AI provider: ${provider}`);
	}
}
