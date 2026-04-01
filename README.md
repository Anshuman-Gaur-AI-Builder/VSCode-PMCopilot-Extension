# PM Copilot

**AI-powered PRD generator for Product Managers, built inside VS Code.**

---

## The Problem

Product Managers spend hours translating raw feature requests, customer feedback, and stakeholder asks into structured PRDs, user stories, and risk assessments. It's repetitive, high-effort work that delays the actual product thinking.

PM Copilot eliminates that friction. Paste a feature request, select your deliverables, click Generate — and get structured, actionable documents in seconds. No context-switching to a browser. No copy-pasting into ChatGPT. It lives where your engineering team already works: inside VS Code.

## Capabilities

| Deliverable | What You Get |
|---|---|
| **Product Brief** | Problem Statement, Goals & Objectives, Scope, Out of Scope, Success Metrics |
| **User Stories** | Persona-driven stories in As a / I want / So that format, grouped by epic, with acceptance criteria |
| **Risk Analysis** | Technical Risks, Business Risks, Mitigation Strategies — rated by impact and likelihood |

Generate any combination of deliverables — select individual items or use **Select All** to produce a complete package in one click.

## Key Features

- **Multi-provider AI support** — choose between VS Code Copilot (no API key needed), Anthropic Claude, or OpenAI GPT-4o
- **Clarifying questions** — the AI asks targeted follow-up questions before generating, so outputs are tailored to your context. Skip them anytime with "Surprise Me"
- **Selective deliverables** — generate only what you need: Product Brief, User Stories, Risk Analysis, or all three
- **Copy to clipboard** — one-click copy to paste into GitHub issues, Notion, Confluence, or anywhere else
- **Theme-adaptive UI** — matches any VS Code theme automatically

## Screenshot

![PM Copilot in action](images/screenshot.png)

## Installation

### VS Code Marketplace

[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Anshuman-Gaur.pm-copilot)

### From Source (Development)

```bash
git clone https://github.com/Anshuman-Gaur-AI-Builder/VSCode-PMCopilot-Extension.git
cd VSCode-PMCopilot-Extension
npm install
npm run compile
```

Open the project in VS Code and press **F5** to launch the Extension Development Host.

## Configuration

### AI Provider

PM Copilot supports three AI providers. Set your preference in VS Code Settings:

| Provider | Setting | API Key Required? |
|---|---|---|
| **VS Code Copilot** (default) | `pmCopilot.aiProvider` = `copilot` | No — uses GitHub Copilot if installed |
| **Anthropic Claude** | `pmCopilot.aiProvider` = `anthropic` | Yes — set `pmCopilot.anthropicApiKey` |
| **OpenAI GPT-4o** | `pmCopilot.aiProvider` = `openai` | Yes — set `pmCopilot.openaiApiKey` |

You can also switch providers directly from the sidebar dropdown without opening Settings.

API keys are stored securely in VS Code's settings infrastructure — not in `.env` files or source code.

## Usage

1. Click the **PM Copilot** icon in the Activity Bar (left sidebar)
2. Paste a feature request, customer feedback, or product idea into the text area
3. Select your AI provider
4. Check the deliverables you want: **Product Brief**, **User Stories**, **Risk Analysis**, or **Select All**
5. Click **Generate**
6. Answer the clarifying questions to improve output quality, or click **Skip — Surprise Me** to generate immediately
7. Review the output and click **Copy** to paste it wherever you need it

## Example

### Input

```
We need to let employees view their full compensation history — base salary changes,
bonus payouts, equity grants, and any adjustments — in one place. Right now they
have to ask HR or dig through old offer letters. Managers should see their direct
reports' history too. This needs to integrate with our existing Workday payroll data.
```

### Output (Product Brief)

```
## Problem Statement
Employees lack a self-service view of their compensation history, creating
unnecessary HR ticket volume and reducing transparency. Managers cannot
access direct report compensation data without manual HR intervention,
slowing down planning cycles.

## Goals & Objectives
- Provide employees with a single dashboard showing complete compensation history
- Reduce HR ticket volume for compensation inquiries by 80%
- Enable managers to access direct report compensation data in real time
- Automate data sync from Workday to eliminate manual record-keeping

## Scope
Self-service compensation dashboard displaying base salary, bonus, equity,
and adjustments in chronological order. Nightly sync from Workday. Manager
view scoped to org hierarchy. Read-only with export-to-PDF.

## Out of Scope
- Compensation benchmarking or market data comparisons
- Editing or correcting historical records (HR admin workflow)
- Tax or payroll calculation features
- Non-Workday HRIS integrations

## Success Metrics
- HR compensation inquiry tickets reduced by 80% within 90 days
- 70% employee adoption within first quarter
- Manager satisfaction score >= 4.0/5.0 in post-launch survey
```

## Tech Stack

| Component | Technology |
|---|---|
| Extension Runtime | TypeScript, VS Code Extension API |
| UI | Webview with VS Code native CSS variables (adapts to any theme) |
| AI Backend | VS Code Copilot (`vscode.lm` API), Anthropic Claude (`@anthropic-ai/sdk`), OpenAI GPT-4o (`openai`) |
| Configuration | VS Code Settings API (secure, per-user) |

## Architecture

```
┌──────────────────────────────────────────────────┐
│  VS Code                                         │
│  ┌────────────┐    postMessage    ┌────────────┐ │
│  │  Webview    │ ◄──────────────► │  Provider   │ │
│  │  (HTML/JS)  │                  │    (TS)     │ │
│  └────────────┘                  └─────┬──────┘ │
│                                        │         │
└────────────────────────────────────────┼─────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                     │
           ┌────────▼──────┐  ┌─────────▼───────┐  ┌─────────▼───────┐
           │  VS Code LM   │  │  Anthropic API  │  │   OpenAI API    │
           │  (Copilot)    │  │  claude-sonnet  │  │    gpt-4o       │
           └───────────────┘  └─────────────────┘  └─────────────────┘
```

## Why This Exists

This extension was built to demonstrate how **AI-native tooling can augment PM workflows** — not replace them. The best product thinking still comes from humans. But the mechanical work of structuring that thinking into PRDs, stories, and risk assessments is exactly the kind of task LLMs handle well.

This is directly relevant to **Copilot-style product development**: embedding AI capabilities into the tools people already use, reducing context-switching, and keeping humans in the loop as decision-makers while AI handles the scaffolding.

## Built By

**Anshuman Gaur** — VP of Product with 7 patents and deep HCM domain expertise. Building at the intersection of product management and AI-native developer tools.

- [GitHub](https://github.com/Anshuman-Gaur-AI-Builder)

## License

[MIT](LICENSE)
