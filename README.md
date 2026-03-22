# PM Copilot

**AI-powered PRD generator for Product Managers, built inside VS Code.**

---

## The Problem

Product Managers spend hours translating raw feature requests, customer feedback, and stakeholder asks into structured PRDs, user stories, and risk assessments. It's repetitive, high-effort work that delays the actual product thinking.

PM Copilot eliminates that friction. Paste a feature request, select an output type, click Generate — and get a structured, actionable document in seconds. No context-switching to a browser. No copy-pasting into ChatGPT. It lives where your engineering team already works: inside VS Code.

## Capabilities

| Output Type | What You Get |
|---|---|
| **PRD Outline** | Problem Statement, User Stories, Acceptance Criteria, Out of Scope, Risks & Open Questions |
| **User Stories** | Persona-driven stories in As a / I want / So that format, grouped by epic, with acceptance criteria |
| **Risk Analysis** | Technical Risks, Business Risks, Mitigation Strategies — rated by impact and likelihood |

## Screenshot

![PM Copilot in action](images/screenshot.png)

## Installation

### From Source (Development)

```bash
git clone https://github.com/Anshuman-Gaur-AI-Builder/VSCode-PMCopilot-Extension.git
cd VSCode-PMCopilot-Extension
npm install
npm run compile
```

Open the project in VS Code and press **F5** to launch the Extension Development Host.

### VS Code Marketplace

[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Anshuman-Gaur.pm-copilot)

## Configuration

PM Copilot requires an Anthropic API key to call Claude.

1. Open VS Code Settings (`Cmd+,` on macOS / `Ctrl+,` on Windows)
2. Search for `pmCopilot.anthropicApiKey`
3. Paste your API key

The key is stored securely in VS Code's settings infrastructure — not in `.env` files or source code.

## Usage

1. Click the **PM Copilot** icon in the Activity Bar (left sidebar)
2. Paste a feature request, customer feedback, or product idea into the text area
3. Select the output type: **PRD Outline**, **User Stories**, or **Risk Analysis**
4. Click **Generate**

Results appear directly in the sidebar panel.

## Example

### Input

```
We need to let employees view their full compensation history — base salary changes,
bonus payouts, equity grants, and any adjustments — in one place. Right now they
have to ask HR or dig through old offer letters. Managers should see their direct
reports' history too. This needs to integrate with our existing Workday payroll data.
```

### Output (PRD Outline)

```
## Problem Statement
Employees lack a self-service view of their compensation history, creating
unnecessary HR ticket volume and reducing transparency. Managers cannot
access direct report compensation data without manual HR intervention,
slowing down planning cycles.

## User Stories
- As an employee, I want to view my complete compensation history in one
  dashboard, so that I can track my growth without contacting HR.
- As a manager, I want to see my direct reports' compensation history,
  so that I can make informed promotion and retention decisions.
- As an HR admin, I want compensation data to sync automatically from
  Workday, so that records stay current without manual entry.

## Acceptance Criteria
- Dashboard displays base salary, bonus, equity, and adjustments in
  chronological order
- Data refreshes from Workday on a nightly sync cycle
- Managers see only their direct reports (org hierarchy scoped)
- Employee view is read-only with export-to-PDF option
- Role-based access control enforced at API and UI layers

## Out of Scope
- Compensation benchmarking or market data comparisons
- Editing or correcting historical records (HR admin workflow)
- Tax or payroll calculation features
- Non-Workday HRIS integrations

## Risks & Open Questions
- What is the Workday API rate limit, and can it support nightly bulk sync?
- How far back does historical data need to go — full tenure or last N years?
- Does displaying equity grant details require legal/compliance review?
- Org hierarchy changes (reorgs) may create edge cases in manager visibility
```

## Tech Stack

| Component | Technology |
|---|---|
| Extension Runtime | TypeScript, VS Code Extension API |
| UI | Webview with VS Code native CSS variables (adapts to any theme) |
| AI Backend | Anthropic Claude (claude-sonnet-4-6) via `@anthropic-ai/sdk` |
| Configuration | VS Code Settings API (secure, per-user) |

## Architecture

```
┌──────────────────────────────────────────────┐
│  VS Code                                     │
│  ┌────────────┐    postMessage    ┌────────┐ │
│  │  Webview    │ ◄──────────────► │Provider│ │
│  │  (HTML/JS)  │                  │  (TS)  │ │
│  └────────────┘                  └───┬────┘ │
│                                      │       │
└──────────────────────────────────────┼───────┘
                                       │ HTTPS
                              ┌────────▼────────┐
                              │  Anthropic API   │
                              │  claude-sonnet   │
                              └─────────────────┘
```

## Why This Exists

This extension was built to demonstrate how **AI-native tooling can augment PM workflows** — not replace them. The best product thinking still comes from humans. But the mechanical work of structuring that thinking into PRDs, stories, and risk assessments is exactly the kind of task LLMs handle well.

This is directly relevant to **Copilot-style product development**: embedding AI capabilities into the tools people already use, reducing context-switching, and keeping humans in the loop as decision-makers while AI handles the scaffolding.

## Built By

**Anshuman Gaur** — VP of Product with 7 patents and deep HCM domain expertise. Building at the intersection of product management and AI-native developer tools.

- [GitHub](https://github.com/Anshuman-Gaur-AI-Builder)

## License

[MIT](LICENSE)
