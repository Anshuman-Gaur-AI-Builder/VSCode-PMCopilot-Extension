import Anthropic from '@anthropic-ai/sdk';
import { OutputType, getSystemPrompt } from './prompts';

export async function generate(
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
