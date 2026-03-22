(function () {
	// @ts-ignore
	const vscode = acquireVsCodeApi();

	const input = document.getElementById('input');
	const outputType = document.getElementById('outputType');
	const generateBtn = document.getElementById('generateBtn');
	const output = document.getElementById('output');

	generateBtn.addEventListener('click', () => {
		const text = input.value.trim();
		if (!text) {
			showError('Please enter a feature description.');
			return;
		}

		output.hidden = false;
		output.classList.remove('error');
		output.innerHTML = '<span class="spinner"></span> Generating\u2026';
		generateBtn.disabled = true;

		vscode.postMessage({
			type: 'generate',
			input: text,
			outputType: outputType.value,
		});
	});

	window.addEventListener('message', (event) => {
		const { type, content, message } = event.data;

		if (type === 'response') {
			output.hidden = false;
			output.classList.remove('error');
			output.textContent = content;
			generateBtn.disabled = false;
		} else if (type === 'error') {
			showError(message);
			generateBtn.disabled = false;
		}
	});

	function showError(msg) {
		output.hidden = false;
		output.classList.add('error');
		output.textContent = msg;
	}
})();
