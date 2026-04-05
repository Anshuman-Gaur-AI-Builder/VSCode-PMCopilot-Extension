/**
 * Type declarations for the vscode.lm API (stable since VS Code 1.93).
 * These augment older @types/vscode versions that don't include lm types.
 * At runtime, availability is checked via assertCopilotAvailable().
 */
declare module 'vscode' {

	export interface LanguageModelChat {
		sendRequest(
			messages: LanguageModelChatMessage[],
			options?: Record<string, unknown>,
			token?: CancellationToken
		): Thenable<LanguageModelChatResponse>;
	}

	export interface LanguageModelChatResponse {
		text: AsyncIterable<string>;
	}

	export class LanguageModelChatMessage {
		static User(content: string): LanguageModelChatMessage;
		static Assistant(content: string): LanguageModelChatMessage;
	}

	export namespace lm {
		export function selectChatModels(
			selector?: Record<string, unknown>
		): Thenable<LanguageModelChat[]>;
	}
}
