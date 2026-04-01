(function () {
	// @ts-ignore
	const vscode = acquireVsCodeApi();

	const input = document.getElementById('input');
	const provider = document.getElementById('provider');
	const generateBtn = document.getElementById('generateBtn');
	const outputWrapper = document.getElementById('outputWrapper');
	const output = document.getElementById('output');
	const copyBtn = document.getElementById('copyBtn');
	const selectAll = document.getElementById('selectAll');
	const deliverableCbs = document.querySelectorAll('.deliverable-cb');
	const questionsWrapper = document.getElementById('questionsWrapper');
	const questionsContainer = document.getElementById('questionsContainer');
	const submitAnswersBtn = document.getElementById('submitAnswersBtn');
	const skipQuestionsBtn = document.getElementById('skipQuestionsBtn');

	// State for the two-step flow
	let pendingQuestions = [];

	// ----- Checkbox logic -----
	selectAll.addEventListener('change', () => {
		deliverableCbs.forEach((cb) => { cb.checked = selectAll.checked; });
	});

	deliverableCbs.forEach((cb) => {
		cb.addEventListener('change', () => {
			const allChecked = Array.from(deliverableCbs).every((c) => c.checked);
			const noneChecked = Array.from(deliverableCbs).every((c) => !c.checked);
			selectAll.checked = allChecked;
			selectAll.indeterminate = !allChecked && !noneChecked;
		});
	});

	// ----- Step 1: Generate → ask clarifying questions -----
	generateBtn.addEventListener('click', () => {
		const text = input.value.trim();
		if (!text) { showError('Please enter a feature description.'); return; }

		const selectedTypes = getSelectedTypes();
		if (selectedTypes.length === 0) { showError('Please select at least one deliverable.'); return; }

		// Hide any previous output/questions
		questionsWrapper.hidden = true;
		outputWrapper.hidden = false;
		output.classList.remove('error');
		output.innerHTML = '<span class="spinner"></span> Analyzing your idea\u2026';
		copyBtn.hidden = true;
		generateBtn.disabled = true;

		vscode.postMessage({
			type: 'askQuestions',
			input: text,
			provider: provider.value,
		});
	});

	// ----- Step 2a: Submit answers → generate -----
	submitAnswersBtn.addEventListener('click', () => {
		const answers = collectAnswers();
		questionsWrapper.hidden = true;
		startGeneration(answers);
	});

	// ----- Step 2b: Skip → generate without answers -----
	skipQuestionsBtn.addEventListener('click', () => {
		questionsWrapper.hidden = true;
		startGeneration(null);
	});

	// ----- Copy -----
	copyBtn.addEventListener('click', () => {
		vscode.postMessage({ type: 'copy', text: output.textContent });
	});

	// ----- Messages from extension -----
	window.addEventListener('message', (event) => {
		const data = event.data;

		switch (data.type) {
			case 'questions':
				showQuestions(data.questions);
				break;

			case 'noQuestions':
				// AI couldn't generate questions — go straight to output
				startGeneration(null);
				break;

			case 'response':
				outputWrapper.hidden = false;
				output.classList.remove('error');
				output.textContent = data.content;
				copyBtn.hidden = false;
				generateBtn.disabled = false;
				break;

			case 'progress':
				outputWrapper.hidden = false;
				output.classList.remove('error');
				output.innerHTML =
					'<span class="spinner"></span> ' +
					escapeHtml(data.message) +
					(data.total > 1 ? ' (' + data.current + '/' + data.total + ')' : '');
				break;

			case 'error':
				showError(data.message);
				generateBtn.disabled = false;
				break;
		}
	});

	// ----- Helpers -----

	function getSelectedTypes() {
		return Array.from(deliverableCbs)
			.filter((cb) => cb.checked)
			.map((cb) => cb.value);
	}

	function showQuestions(questions) {
		pendingQuestions = questions;
		questionsContainer.innerHTML = '';

		questions.forEach((q, i) => {
			const group = document.createElement('div');
			group.className = 'question-group';

			const label = document.createElement('label');
			label.className = 'question-label';
			label.textContent = q;
			label.setAttribute('for', 'qa-' + i);

			const textarea = document.createElement('textarea');
			textarea.id = 'qa-' + i;
			textarea.className = 'question-input';
			textarea.rows = 2;
			textarea.placeholder = 'Your answer (optional)';

			group.appendChild(label);
			group.appendChild(textarea);
			questionsContainer.appendChild(group);
		});

		// Show questions, hide the loading output
		outputWrapper.hidden = true;
		questionsWrapper.hidden = false;
		generateBtn.disabled = false;
	}

	function collectAnswers() {
		const answers = [];
		pendingQuestions.forEach((q, i) => {
			const el = document.getElementById('qa-' + i);
			const val = el ? el.value.trim() : '';
			if (val) {
				answers.push({ question: q, answer: val });
			}
		});
		return answers.length > 0 ? answers : null;
	}

	function startGeneration(answers) {
		const selectedTypes = getSelectedTypes();

		outputWrapper.hidden = false;
		output.classList.remove('error');
		output.innerHTML = '<span class="spinner"></span> Generating\u2026';
		copyBtn.hidden = true;
		generateBtn.disabled = true;

		vscode.postMessage({
			type: 'generate',
			input: input.value.trim(),
			outputTypes: selectedTypes,
			provider: provider.value,
			answers: answers,
		});
	}

	function showError(msg) {
		questionsWrapper.hidden = true;
		outputWrapper.hidden = false;
		output.classList.add('error');
		output.textContent = msg;
		copyBtn.hidden = true;
	}

	function escapeHtml(str) {
		const el = document.createElement('span');
		el.textContent = str;
		return el.innerHTML;
	}
})();
