# Claude Code — 公式ドキュメント
> 取得日: 2026-03-20
> ソース: https://docs.anthropic.com/en/docs/claude-code/
> このファイルは `scripts/fetch-claude-docs.js` で自動更新されます。
---
## 概要 (Overview)

> ソース: https://docs.anthropic.com/en/docs/claude-code/overview

# Claude Code overview

Claude Code is an agentic coding tool that reads your codebase, edits files, runs commands, and integrates with your development tools. Available in your terminal, IDE, desktop app, and browser.

Claude Code is an AI-powered coding assistant that helps you build features, fix bugs, and automate development tasks. It understands your entire codebase and can work across multiple files and tools to get things done.

## ​Get started

Choose your environment to get started. Most surfaces require a [Claude subscription](https://claude.com/pricing?utm_source=claude_code&utm_medium=docs&utm_content=overview_pricing) or [Anthropic Console](https://console.anthropic.com/) account. The Terminal CLI and VS Code also support [third-party providers](https://docs.anthropic.com/docs/en/third-party-integrations).

- Terminal
- VS Code
- Desktop app
- Web
- JetBrains

The full-featured CLI for working with Claude Code directly in your terminal. Edit files, run commands, and manage your entire project from the command line.To install Claude Code, use one of the following methods:
- Native Install (Recommended)
- Homebrew
- WinGet

**macOS, Linux, WSL:**Copy
```
curl -fsSL https://claude.ai/install.sh | bash
```
**Windows PowerShell:**Copy
```
irm https://claude.ai/install.ps1 | iex
```
**Windows CMD:**Copy
```
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```
**Windows requires [Git for Windows](https://git-scm.com/downloads/win).** Install it first if you don’t have it.Native installations automatically update in the background to keep you on the latest version.Copy
```
brew install --cask claude-code
```
Homebrew installations do not auto-update. Run `brew upgrade claude-code` periodically to get the latest features and security fixes.Copy
```
winget install Anthropic.ClaudeCode
```
WinGet installations do not auto-update. Run `winget upgrade Anthropic.ClaudeCode` periodically to get the latest features and security fixes.Then start Claude Code in any project:Copy
```
cd your-project
claude
```
You’ll be prompted to log in on first use. That’s it! [Continue with the Quickstart →](https://docs.anthropic.com/docs/en/quickstart)See [advanced setup](https://docs.anthropic.com/docs/en/setup) for installation options, manual updates, or uninstallation instructions. Visit [troubleshooting](https://docs.anthropic.com/docs/en/troubleshooting) if you hit issues.The VS Code extension provides inline diffs, @-mentions, plan review, and conversation history directly in your editor.

- Install for VS Code

- Install for Cursor

Or search for “Claude Code” in the Extensions view (`Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows/Linux). After installing, open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`), type “Claude Code”, and select **Open in New Tab**.[Get started with VS Code →](https://docs.anthropic.com/docs/en/vs-code#get-started)A standalone app for running Claude Code outside your IDE or terminal. Review diffs visually, run multiple sessions side by side, schedule recurring tasks, and kick off cloud sessions.Download and install:

- macOS (Intel and Apple Silicon)

- Windows (x64)

- Windows ARM64 (remote sessions only)

After installing, launch Claude, sign in, and click the **Code** tab to start coding. A [paid subscription](https://claude.com/pricing?utm_source=claude_code&utm_medium=docs&utm_content=overview_desktop_pricing) is required.[Learn more about the desktop app →](https://docs.anthropic.com/docs/en/desktop-quickstart)Run Claude Code in your browser with no local setup. Kick off long-running tasks and check back when they’re done, work on repos you don’t have locally, or run multiple tasks in parallel. Available on desktop browsers and the Claude iOS app.Start coding at [claude.ai/code](https://claude.ai/code).[Get started on the web →](https://docs.anthropic.com/docs/en/claude-code-on-the-web#getting-started)A plugin for IntelliJ IDEA, PyCharm, WebStorm, and other JetBrains IDEs with interactive diff viewing and selection context sharing.Install the [Claude Code plugin](https://plugins.jetbrains.com/plugin/27310-claude-code-beta-) from the JetBrains Marketplace and restart your IDE.[Get started with JetBrains →](https://docs.anthropic.com/docs/en/jetbrains)

## ​What you can do

Here are some of the ways you can use Claude Code:
Automate the work you keep putting off

Claude Code handles the tedious tasks that eat up your day: writing tests for untested code, fixing lint errors across a project, resolving merge conflicts, updating dependencies, and writing release notes.
Copy
```
claude "write tests for the auth module, run them, and fix any failures"
```
Build features and fix bugs

Describe what you want in plain language. Claude Code plans the approach, writes the code across multiple files, and verifies it works.For bugs, paste an error message or describe the symptom. Claude Code traces the issue through your codebase, identifies the root cause, and implements a fix. See [common workflows](https://docs.anthropic.com/docs/en/common-workflows) for more examples.

Create commits and pull requests

Claude Code works directly with git. It stages changes, writes commit messages, creates branches, and opens pull requests.
Copy
```
claude "commit my changes with a descriptive message"
```
In CI, you can automate code review and issue triage with [GitHub Actions](https://docs.anthropic.com/docs/en/github-actions) or [GitLab CI/CD](https://docs.anthropic.com/docs/en/gitlab-ci-cd).Connect your tools with MCP

The [Model Context Protocol (MCP)](https://docs.anthropic.com/docs/en/mcp) is an open standard for connecting AI tools to external data sources. With MCP, Claude Code can read your design docs in Google Drive, update tickets in Jira, pull data from Slack, or use your own custom tooling.

Customize with instructions, skills, and hooks

[`CLAUDE.md`](https://docs.anthropic.com/docs/en/memory) is a markdown file you add to your project root that Claude Code reads at the start of every session. Use it to set coding standards, architecture decisions, preferred libraries, and review checklists. Claude also builds [auto memory](https://docs.anthropic.com/docs/en/memory#auto-memory) as it works, saving learnings like build commands and debugging insights across sessions without you writing anything.Create [custom commands](https://docs.anthropic.com/docs/en/skills) to package repeatable workflows your team can share, like `/review-pr` or `/deploy-staging`.[Hooks](https://docs.anthropic.com/docs/en/hooks) let you run shell commands before or after Claude Code actions, like auto-formatting after every file edit or running lint before a commit.

Run agent teams and build custom agents

Spawn [multiple Claude Code agents](https://docs.anthropic.com/docs/en/sub-agents) that work on different parts of a task simultaneously. A lead agent coordinates the work, assigns subtasks, and merges results.For fully custom workflows, the [Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) lets you build your own agents powered by Claude Code’s tools and capabilities, with full control over orchestration, tool access, and permissions.

Pipe, script, and automate with the CLI

Claude Code is composable and follows the Unix philosophy. Pipe logs into it, run it in CI, or chain it with other tools:
Copy
```
# Analyze recent log output
tail -200 app.log | claude -p "Slack me if you see any anomalies"

# Automate translations in CI
claude -p "translate new strings into French and raise a PR for review"

# Bulk operations across files
git diff main --name-only | claude -p "review these changed files for security issues"
```
See the [CLI reference](https://docs.anthropic.com/docs/en/cli-reference) for the full set of commands and flags.Work from anywhere

Sessions aren’t tied to a single surface. Move work between environments as your context changes:

- Step away from your desk and keep working from you

---

## クイックスタート

> ソース: https://docs.anthropic.com/en/docs/claude-code/quickstart

# Quickstart

Welcome to Claude Code!

This quickstart guide will have you using AI-powered coding assistance in a few minutes. By the end, you’ll understand how to use Claude Code for common development tasks.

## ​Before you begin

Make sure you have:

- A terminal or command prompt open

If you’ve never used the terminal before, check out the terminal guide

- A code project to work with

- A Claude subscription (Pro, Max, Teams, or Enterprise), Claude Console account, or access through a supported cloud provider

This guide covers the terminal CLI. Claude Code is also available on the [web](https://claude.ai/code), as a [desktop app](https://docs.anthropic.com/docs/en/desktop), in [VS Code](https://docs.anthropic.com/docs/en/vs-code) and [JetBrains IDEs](https://docs.anthropic.com/docs/en/jetbrains), in [Slack](https://docs.anthropic.com/docs/en/slack), and in CI/CD with [GitHub Actions](https://docs.anthropic.com/docs/en/github-actions) and [GitLab](https://docs.anthropic.com/docs/en/gitlab-ci-cd). See [all interfaces](https://docs.anthropic.com/docs/en/overview#use-claude-code-everywhere).

## ​Step 1: Install Claude Code

To install Claude Code, use one of the following methods:

- Native Install (Recommended)
- Homebrew
- WinGet

**macOS, Linux, WSL:**Copy
```
curl -fsSL https://claude.ai/install.sh | bash
```
**Windows PowerShell:**Copy
```
irm https://claude.ai/install.ps1 | iex
```
**Windows CMD:**Copy
```
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```
**Windows requires [Git for Windows](https://git-scm.com/downloads/win).** Install it first if you don’t have it.Native installations automatically update in the background to keep you on the latest version.Copy
```
brew install --cask claude-code
```
Homebrew installations do not auto-update. Run `brew upgrade claude-code` periodically to get the latest features and security fixes.Copy
```
winget install Anthropic.ClaudeCode
```
WinGet installations do not auto-update. Run `winget upgrade Anthropic.ClaudeCode` periodically to get the latest features and security fixes.

## ​Step 2: Log in to your account

Claude Code requires an account to use. When you start an interactive session with the `claude` command, you’ll need to log in:
Copy
```
claude
# You'll be prompted to log in on first use
```

Copy
```
/login
# Follow the prompts to log in with your account
```

You can log in using any of these account types:

- Claude Pro, Max, Teams, or Enterprise (recommended)

- Claude Console (API access with pre-paid credits). On first login, a “Claude Code” workspace is automatically created in the Console for centralized cost tracking.

- Amazon Bedrock, Google Vertex AI, or Microsoft Foundry (enterprise cloud providers)

Once logged in, your credentials are stored and you won’t need to log in again. To switch accounts later, use the `/login` command.

## ​Step 3: Start your first session

Open your terminal in any project directory and start Claude Code:
Copy
```
cd /path/to/your/project
claude
```

You’ll see the Claude Code welcome screen with your session information, recent conversations, and latest updates. Type `/help` for available commands or `/resume` to continue a previous conversation.
After logging in (Step 2), your credentials are stored on your system. Learn more in [Credential Management](https://docs.anthropic.com/docs/en/authentication#credential-management).

## ​Step 4: Ask your first question

Let’s start with understanding your codebase. Try one of these commands:
Copy
```
what does this project do?

```

Claude will analyze your files and provide a summary. You can also ask more specific questions:
Copy
```
what technologies does this project use?

```

Copy
```
where is the main entry point?

```

Copy
```
explain the folder structure

```

You can also ask Claude about its own capabilities:
Copy
```
what can Claude Code do?

```

Copy
```
how do I create custom skills in Claude Code?

```

Copy
```
can Claude Code work with Docker?

```

Claude Code reads your project files as needed. You don’t have to manually add context.

## ​Step 5: Make your first code change

Now let’s make Claude Code do some actual coding. Try a simple task:
Copy
```
add a hello world function to the main file

```

Claude Code will:

- Find the appropriate file

- Show you the proposed changes

- Ask for your approval

- Make the edit

Claude Code always asks for permission before modifying files. You can approve individual changes or enable “Accept all” mode for a session.

## ​Step 6: Use Git with Claude Code

Claude Code makes Git operations conversational:
Copy
```
what files have I changed?

```

Copy
```
commit my changes with a descriptive message

```

You can also prompt for more complex Git operations:
Copy
```
create a new branch called feature/quickstart

```

Copy
```
show me the last 5 commits

```

Copy
```
help me resolve merge conflicts

```

## ​Step 7: Fix a bug or add a feature

Claude is proficient at debugging and feature implementation.
Describe what you want in natural language:
Copy
```
add input validation to the user registration form

```

Or fix existing issues:
Copy
```
there's a bug where users can submit empty forms - fix it

```

Claude Code will:

- Locate the relevant code

- Understand the context

- Implement a solution

- Run tests if available

## ​Step 8: Test out other common workflows

There are a number of ways to work with Claude:
**Refactor code**
Copy
```
refactor the authentication module to use async/await instead of callbacks

```

**Write tests**
Copy
```
write unit tests for the calculator functions

```

**Update documentation**
Copy
```
update the README with installation instructions

```

**Code review**
Copy
```
review my changes and suggest improvements

```

Talk to Claude like you would a helpful colleague. Describe what you want to achieve, and it will help you get there.

## ​Essential commands

Here are the most important commands for daily use:
CommandWhat it doesExample`claude`Start interactive mode`claude``claude "task"`Run a one-time task`claude "fix the build error"``claude -p "query"`Run one-off query, then exit`claude -p "explain this function"``claude -c`Continue most recent conversation in current directory`claude -c``claude -r`Resume a previous conversation`claude -r``claude commit`Create a Git commit`claude commit``/clear`Clear conversation history`/clear``/help`Show available commands`/help``exit` or Ctrl+CExit Claude Code`exit`
See the [CLI reference](https://docs.anthropic.com/docs/en/cli-reference) for a complete list of commands.

## ​Pro tips for beginners

For more, see [best practices](https://docs.anthropic.com/docs/en/best-practices) and [common workflows](https://docs.anthropic.com/docs/en/common-workflows).
Be specific with your requests

Instead of: “fix the bug”Try: “fix the login bug where users see a blank screen after entering wrong credentials”

Use step-by-step instructions

Break complex tasks into steps:
Copy
```
1. create a new database table for user profiles
2. create an API endpoint to get and update user profiles
3. build a webpage that allows users to see and edit their information

```
Let Claude explore first

Before making changes, let Claude understand your code:
Copy
```
analyze the database schema

```
Copy
```
build a dashboard showing products that are most frequently returned by our UK customers

```
Save time with shortcuts

- Press `?` to see all available keyboard shortcuts

- Use Tab for command completion

- Press ↑ for command history

- Type `/` to see all commands and skills

## ​What’s next?

Now that you’ve learned the basics, explore more advanced features:

## How Claude Code works
Understand the agentic loop, built-in tools, and how Claude Code interacts with your project

## Best practices
Get better results with effective prompting and project setup

## Common workflows
Step-by-step guides for common tasks

## Extend Claude Cod

---

## CLI リファレンス

> ソース: https://docs.anthropic.com/en/docs/claude-code/cli-reference

# CLI reference

Complete reference for Claude Code command-line interface, including commands and flags.

## ​CLI commands

You can start sessions, pipe content, resume conversations, and manage updates with these commands:
CommandDescriptionExample`claude`Start interactive session`claude``claude "query"`Start interactive session with initial prompt`claude "explain this project"``claude -p "query"`Query via SDK, then exit`claude -p "explain this function"``cat file | claude -p "query"`Process piped content`cat logs.txt | claude -p "explain"``claude -c`Continue most recent conversation in current directory`claude -c``claude -c -p "query"`Continue via SDK`claude -c -p "Check for type errors"``claude -r "" "query"`Resume session by ID or name`claude -r "auth-refactor" "Finish this PR"``claude update`Update to latest version`claude update``claude auth login`Sign in to your Anthropic account. Use `--email` to pre-fill your email address, `--sso` to force SSO authentication, and `--console` to sign in with Anthropic Console for API usage billing instead of a Claude subscription`claude auth login --console``claude auth logout`Log out from your Anthropic account`claude auth logout``claude auth status`Show authentication status as JSON. Use `--text` for human-readable output. Exits with code 0 if logged in, 1 if not`claude auth status``claude agents`List all configured [subagents](https://docs.anthropic.com/docs/en/sub-agents), grouped by source`claude agents``claude mcp`Configure Model Context Protocol (MCP) serversSee the [Claude Code MCP documentation](https://docs.anthropic.com/docs/en/mcp).`claude remote-control`Start a [Remote Control](https://docs.anthropic.com/docs/en/remote-control) server to control Claude Code from Claude.ai or the Claude app. Runs in server mode (no local interactive session). See [Server mode flags](https://docs.anthropic.com/docs/en/remote-control#server-mode)`claude remote-control --name "My Project"`

## ​CLI flags

Customize Claude Code’s behavior with these command-line flags:
FlagDescriptionExample`--add-dir`Add additional working directories for Claude to access (validates each path exists as a directory)`claude --add-dir ../apps ../lib``--agent`Specify an agent for the current session (overrides the `agent` setting)`claude --agent my-custom-agent``--agents`Define custom subagents dynamically via JSON. Uses the same field names as subagent [frontmatter](https://docs.anthropic.com/docs/en/sub-agents#supported-frontmatter-fields), plus a `prompt` field for the agent’s instructions`claude --agents '{"reviewer":{"description":"Reviews code","prompt":"You are a code reviewer"}}'``--allow-dangerously-skip-permissions`Enable permission bypassing as an option without immediately activating it. Allows composing with `--permission-mode` (use with caution)`claude --permission-mode plan --allow-dangerously-skip-permissions``--allowedTools`Tools that execute without prompting for permission. See [permission rule syntax](https://docs.anthropic.com/docs/en/settings#permission-rule-syntax) for pattern matching. To restrict which tools are available, use `--tools` instead`"Bash(git log *)" "Bash(git diff *)" "Read"``--append-system-prompt`Append custom text to the end of the default system prompt`claude --append-system-prompt "Always use TypeScript"``--append-system-prompt-file`Load additional system prompt text from a file and append to the default prompt`claude --append-system-prompt-file ./extra-rules.txt``--betas`Beta headers to include in API requests (API key users only)`claude --betas interleaved-thinking``--channels`(Research preview) MCP servers whose [channel](https://docs.anthropic.com/docs/en/channels) notifications Claude should listen for in this session. Space-separated list of `plugin:@` entries. Requires Claude.ai authentication`claude --channels plugin:my-notifier@my-marketplace``--chrome`Enable [Chrome browser integration](https://docs.anthropic.com/docs/en/chrome) for web automation and testing`claude --chrome``--continue`, `-c`Load the most recent conversation in the current directory`claude --continue``--dangerously-load-development-channels`Enable [channels](https://docs.anthropic.com/docs/en/channels-reference#test-during-the-research-preview) that are not on the approved allowlist, for local development. Accepts `plugin:@` and `server:` entries. Prompts for confirmation`claude --dangerously-load-development-channels server:webhook``--dangerously-skip-permissions`Skip permission prompts (use with caution). See [permission modes](https://docs.anthropic.com/docs/en/permissions#permission-modes) for what this does and does not skip`claude --dangerously-skip-permissions``--debug`Enable debug mode with optional category filtering (for example, `"api,hooks"` or `"!statsig,!file"`)`claude --debug "api,mcp"``--disable-slash-commands`Disable all skills and commands for this session`claude --disable-slash-commands``--disallowedTools`Tools that are removed from the model’s context and cannot be used`"Bash(git log *)" "Bash(git diff *)" "Edit"``--effort`Set the [effort level](https://docs.anthropic.com/docs/en/model-config#adjust-effort-level) for the current session. Options: `low`, `medium`, `high`, `max` (Opus 4.6 only). Session-scoped and does not persist to settings`claude --effort high``--fallback-model`Enable automatic fallback to specified model when default model is overloaded (print mode only)`claude -p --fallback-model sonnet "query"``--fork-session`When resuming, create a new session ID instead of reusing the original (use with `--resume` or `--continue`)`claude --resume abc123 --fork-session``--from-pr`Resume sessions linked to a specific GitHub PR. Accepts a PR number or URL. Sessions are automatically linked when created via `gh pr create``claude --from-pr 123``--ide`Automatically connect to IDE on startup if exactly one valid IDE is available`claude --ide``--init`Run initialization hooks and start interactive mode`claude --init``--init-only`Run initialization hooks and exit (no interactive session)`claude --init-only``--include-partial-messages`Include partial streaming events in output (requires `--print` and `--output-format=stream-json`)`claude -p --output-format stream-json --include-partial-messages "query"``--input-format`Specify input format for print mode (options: `text`, `stream-json`)`claude -p --output-format json --input-format stream-json``--json-schema`Get validated JSON output matching a JSON Schema after agent completes its workflow (print mode only, see [structured outputs](https://platform.claude.com/docs/en/agent-sdk/structured-outputs))`claude -p --json-schema '{"type":"object","properties":{...}}' "query"``--maintenance`Run maintenance hooks and exit`claude --maintenance``--max-budget-usd`Maximum dollar amount to spend on API calls before stopping (print mode only)`claude -p --max-budget-usd 5.00 "query"``--max-turns`Limit the number of agentic turns (print mode only). Exits with an error when the limit is reached. No limit by default`claude -p --max-turns 3 "query"``--mcp-config`Load MCP servers from JSON files or strings (space-separated)`claude --mcp-config ./mcp.json``--model`Sets the model for the current session with an alias for the latest model (`sonnet` or `opus`) or a model’s full name`claude --model claude-sonnet-4-6``--name`, `-n`Set a display name for the session, shown in `/resume` and the terminal title. You can resume a named session with `claude --resume `. 

[`/rename`](https://docs.anthropic.com/docs/en/commands) changes the name mid-session and also shows it on the prompt bar`claude -n "my-feature-work"``--no-chrome`Disable [Chrome browser integration](https://docs.anthropic.com/docs/en/chrome) for this session`claude --no-chrome``--no-session-persistence`Disable session persistence so sessions are not saved to disk and cannot be resumed (print mode only)`claude -p --no-session-persistence "query"``--output-format`Specify output format for print mode (options: `text`,

---

## 設定 (Settings)

> ソース: https://docs.anthropic.com/en/docs/claude-code/settings

# Claude Code settings

Configure Claude Code with global and project-level settings, and environment variables.

Claude Code offers a variety of settings to configure its behavior to meet your needs. You can configure Claude Code by running the `/config` command when using the interactive REPL, which opens a tabbed Settings interface where you can view status information and modify configuration options.

## ​Configuration scopes

Claude Code uses a **scope system** to determine where configurations apply and who they’re shared with. Understanding scopes helps you decide how to configure Claude Code for personal use, team collaboration, or enterprise deployment.

### ​Available scopes

ScopeLocationWho it affectsShared with team?**Managed**Server-managed settings, plist / registry, or system-level `managed-settings.json`All users on the machineYes (deployed by IT)**User**`~/.claude/` directoryYou, across all projectsNo**Project**`.claude/` in repositoryAll collaborators on this repositoryYes (committed to git)**Local**`.claude/settings.local.json`You, in this repository onlyNo (gitignored)

### ​When to use each scope

**Managed scope** is for:

- Security policies that must be enforced organization-wide

- Compliance requirements that can’t be overridden

- Standardized configurations deployed by IT/DevOps

**User scope** is best for:

- Personal preferences you want everywhere (themes, editor settings)

- Tools and plugins you use across all projects

- API keys and authentication (stored securely)

**Project scope** is best for:

- Team-shared settings (permissions, hooks, MCP servers)

- Plugins the whole team should have

- Standardizing tooling across collaborators

**Local scope** is best for:

- Personal overrides for a specific project

- Testing configurations before sharing with the team

- Machine-specific settings that won’t work for others

### ​How scopes interact

When the same setting is configured in multiple scopes, more specific scopes take precedence:

- Managed (highest) - can’t be overridden by anything

- Command line arguments - temporary session overrides

- Local - overrides project and user settings

- Project - overrides user settings

- User (lowest) - applies when nothing else specifies the setting

For example, if a permission is allowed in user settings but denied in project settings, the project setting takes precedence and the permission is blocked.

### ​What uses scopes

Scopes apply to many Claude Code features:
FeatureUser locationProject locationLocal location**Settings**`~/.claude/settings.json``.claude/settings.json``.claude/settings.local.json`**Subagents**`~/.claude/agents/``.claude/agents/`None**MCP servers**`~/.claude.json``.mcp.json``~/.claude.json` (per-project)**Plugins**`~/.claude/settings.json``.claude/settings.json``.claude/settings.local.json`**CLAUDE.md**`~/.claude/CLAUDE.md``CLAUDE.md` or `.claude/CLAUDE.md`None

## ​Settings files

The `settings.json` file is the official mechanism for configuring Claude
Code through hierarchical settings:

- User settings are defined in `~/.claude/settings.json` and apply to all
projects.

- Project settings are saved in your project directory:

`.claude/settings.json` for settings that are checked into source control and shared with your team

- `.claude/settings.local.json` for settings that are not checked in, useful for personal preferences and experimentation. Claude Code will configure git to ignore `.claude/settings.local.json` when it is created.

- Managed settings: For organizations that need centralized control, Claude Code supports multiple delivery mechanisms for managed settings. All use the same JSON format and cannot be overridden by user or project settings:

Server-managed settings: delivered from Anthropic’s servers via the Claude.ai admin console. See server-managed settings.

- MDM/OS-level policies: delivered through native device management on macOS and Windows:

macOS: `com.anthropic.claudecode` managed preferences domain (deployed via configuration profiles in Jamf, Kandji, or other MDM tools)

- Windows: `HKLM\SOFTWARE\Policies\ClaudeCode` registry key with a `Settings` value (REG_SZ or REG_EXPAND_SZ) containing JSON (deployed via Group Policy or Intune)

- Windows (user-level): `HKCU\SOFTWARE\Policies\ClaudeCode` (lowest policy priority, only used when no admin-level source exists)

- File-based: `managed-settings.json` and `managed-mcp.json` deployed to system directories:

macOS: `/Library/Application Support/ClaudeCode/`

- Linux and WSL: `/etc/claude-code/`

- Windows: `C:\Program Files\ClaudeCode\`

The legacy Windows path `C:\ProgramData\ClaudeCode\managed-settings.json` is no longer supported as of v2.1.75. Administrators who deployed settings to that location must migrate files to `C:\Program Files\ClaudeCode\managed-settings.json`.

See [managed settings](https://docs.anthropic.com/docs/en/permissions#managed-only-settings) and [Managed MCP configuration](https://docs.anthropic.com/docs/en/mcp#managed-mcp-configuration) for details.

Managed deployments can also restrict **plugin marketplace additions** using
`strictKnownMarketplaces`. For more information, see [Managed marketplace restrictions](https://docs.anthropic.com/docs/en/plugin-marketplaces#managed-marketplace-restrictions).

- Other configuration is stored in `~/.claude.json`. This file contains your preferences (theme, notification settings, editor mode), OAuth session, MCP server configurations for user and local scopes, per-project state (allowed tools, trust settings), and various caches. Project-scoped MCP servers are stored separately in `.mcp.json`.

Claude Code automatically creates timestamped backups of configuration files and retains the five most recent backups to prevent data loss.

Example settings.json

Copy

```
{
 "$schema": "https://json.schemastore.org/claude-code-settings.json",
 "permissions": {
 "allow": [
 "Bash(npm run lint)",
 "Bash(npm run test *)",
 "Read(~/.zshrc)"
 ],
 "deny": [
 "Bash(curl *)",
 "Read(./.env)",
 "Read(./.env.*)",
 "Read(./secrets/**)"
 ]
 },
 "env": {
 "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
 "OTEL_METRICS_EXPORTER": "otlp"
 },
 "companyAnnouncements": [
 "Welcome to Acme Corp! Review our code guidelines at docs.acme.com",
 "Reminder: Code reviews required for all PRs",
 "New security policy in effect"
 ]
}
```

The `$schema` line in the example above points to the [official JSON schema](https://json.schemastore.org/claude-code-settings.json) for Claude Code settings. Adding it to your `settings.json` enables autocomplete and inline validation in VS Code, Cursor, and any other editor that supports JSON schema validation.

### ​Available settings

`settings.json` supports a number of options:
KeyDescriptionExample`apiKeyHelper`Custom script, to be executed in `/bin/sh`, to generate an auth value. This value will be sent as `X-Api-Key` and `Authorization: Bearer` headers for model requests`/bin/generate_temp_api_key.sh``autoMemoryDirectory`Custom directory for [auto memory](https://docs.anthropic.com/docs/en/memory#storage-location) storage. Accepts `~/`-expanded paths. Not accepted in project settings (`.claude/settings.json`) to prevent shared repos from redirecting memory writes to sensitive locations. Accepted from policy, local, and user settings`"~/my-memory-dir"``cleanupPeriodDays`Sessions inactive for longer than this period are deleted at startup (default: 30 days).

Setting to `0` deletes all existing transcripts at startup and disables session persistence entirely. No new `.jsonl` files are written, `/resume` shows no conversations, and hooks receive an empty `transcript_path`.`20``companyAnnouncements`Announcement to display to users at startup. If multiple announcements are provided, they will be cycled through at random.`["Welcome to Acme Corp! Review our code guidelines at docs.acme.com"]``env`Environment variables that will be applied to every session`{"FOO": "bar"}``attribution`Customize attribution for g

---

## フック (Hooks)

> ソース: https://docs.anthropic.com/en/docs/claude-code/hooks

# Hooks reference

Reference for Claude Code hook events, configuration schema, JSON input/output formats, exit codes, async hooks, HTTP hooks, prompt hooks, and MCP tool hooks.

For a quickstart guide with examples, see [Automate workflows with hooks](https://docs.anthropic.com/docs/en/hooks-guide).
Hooks are user-defined shell commands, HTTP endpoints, or LLM prompts that execute automatically at specific points in Claude Code’s lifecycle. Use this reference to look up event schemas, configuration options, JSON input/output formats, and advanced features like async hooks, HTTP hooks, and MCP tool hooks. If you’re setting up hooks for the first time, start with the [guide](https://docs.anthropic.com/docs/en/hooks-guide) instead.

## ​Hook lifecycle

Hooks fire at specific points during a Claude Code session. When an event fires and a matcher matches, Claude Code passes JSON context about the event to your hook handler. For command hooks, input arrives on stdin. For HTTP hooks, it arrives as the POST request body. Your handler can then inspect the input, take action, and optionally return a decision. Some events fire once per session, while others fire repeatedly inside the agentic loop:

The table below summarizes when each event fires. The Hook events section documents the full input schema and decision control options for each one.
EventWhen it fires`SessionStart`When a session begins or resumes`UserPromptSubmit`When you submit a prompt, before Claude processes it`PreToolUse`Before a tool call executes. Can block it`PermissionRequest`When a permission dialog appears`PostToolUse`After a tool call succeeds`PostToolUseFailure`After a tool call fails`Notification`When Claude Code sends a notification`SubagentStart`When a subagent is spawned`SubagentStop`When a subagent finishes`Stop`When Claude finishes responding`StopFailure`When the turn ends due to an API error. Output and exit code are ignored`TeammateIdle`When an [agent team](https://docs.anthropic.com/docs/en/agent-teams) teammate is about to go idle`TaskCompleted`When a task is being marked as completed`InstructionsLoaded`When a CLAUDE.md or `.claude/rules/*.md` file is loaded into context. Fires at session start and when files are lazily loaded during a session`ConfigChange`When a configuration file changes during a session`WorktreeCreate`When a worktree is being created via `--worktree` or `isolation: "worktree"`. Replaces default git behavior`WorktreeRemove`When a worktree is being removed, either at session exit or when a subagent finishes`PreCompact`Before context compaction`PostCompact`After context compaction completes`Elicitation`When an MCP server requests user input during a tool call`ElicitationResult`After a user responds to an MCP elicitation, before the response is sent back to the server`SessionEnd`When a session terminates

### ​How a hook resolves

To see how these pieces fit together, consider this `PreToolUse` hook that blocks destructive shell commands. The hook runs `block-rm.sh` before every Bash tool call:
Copy
```
{
 "hooks": {
 "PreToolUse": [
 {
 "matcher": "Bash",
 "hooks": [
 {
 "type": "command",
 "command": ".claude/hooks/block-rm.sh"
 }
 ]
 }
 ]
 }
}
```

The script reads the JSON input from stdin, extracts the command, and returns a `permissionDecision` of `"deny"` if it contains `rm -rf`:
Copy
```
#!/bin/bash
# .claude/hooks/block-rm.sh
COMMAND=$(jq -r '.tool_input.command')

if echo "$COMMAND" | grep -q 'rm -rf'; then
 jq -n '{
 hookSpecificOutput: {
 hookEventName: "PreToolUse",
 permissionDecision: "deny",
 permissionDecisionReason: "Destructive command blocked by hook"
 }
 }'
else
 exit 0 # allow the command
fi
```

Now suppose Claude Code decides to run `Bash "rm -rf /tmp/build"`. Here’s what happens:

1Event fires
The `PreToolUse` event fires. Claude Code sends the tool input as JSON on stdin to the hook:
Copy
```
{ "tool_name": "Bash", "tool_input": { "command": "rm -rf /tmp/build" }, ... }
```
2Matcher checks
The matcher `"Bash"` matches the tool name, so `block-rm.sh` runs. If you omit the matcher or use `"*"`, the hook runs on every occurrence of the event. Hooks only skip when a matcher is defined and doesn’t match.

3

Hook handler runs
The script extracts `"rm -rf /tmp/build"` from the input and finds `rm -rf`, so it prints a decision to stdout:
Copy
```
{
 "hookSpecificOutput": {
 "hookEventName": "PreToolUse",
 "permissionDecision": "deny",
 "permissionDecisionReason": "Destructive command blocked by hook"
 }
}
```
If the command had been safe (like `npm test`), the script would hit `exit 0` instead, which tells Claude Code to allow the tool call with no further action.4Claude Code acts on the result
Claude Code reads the JSON decision, blocks the tool call, and shows Claude the reason.

The Configuration section below documents the full schema, and each hook event section documents what input your command receives and what output it can return.

## ​Configuration

Hooks are defined in JSON settings files. The configuration has three levels of nesting:

- Choose a hook event to respond to, like `PreToolUse` or `Stop`

- Add a matcher group to filter when it fires, like “only for the Bash tool”

- Define one or more hook handlers to run when matched

See How a hook resolves above for a complete walkthrough with an annotated example.

This page uses specific terms for each level: **hook event** for the lifecycle point, **matcher group** for the filter, and **hook handler** for the shell command, HTTP endpoint, prompt, or agent that runs. “Hook” on its own refers to the general feature.

### ​Hook locations

Where you define a hook determines its scope:
LocationScopeShareable`~/.claude/settings.json`All your projectsNo, local to your machine`.claude/settings.json`Single projectYes, can be committed to the repo`.claude/settings.local.json`Single projectNo, gitignoredManaged policy settingsOrganization-wideYes, admin-controlled[Plugin](https://docs.anthropic.com/docs/en/plugins) `hooks/hooks.json`When plugin is enabledYes, bundled with the plugin[Skill](https://docs.anthropic.com/docs/en/skills) or [agent](https://docs.anthropic.com/docs/en/sub-agents) frontmatterWhile the component is activeYes, defined in the component file

For details on settings file resolution, see [settings](https://docs.anthropic.com/docs/en/settings). Enterprise administrators can use `allowManagedHooksOnly` to block user, project, and plugin hooks. See [Hook configuration](https://docs.anthropic.com/docs/en/settings#hook-configuration).

### ​Matcher patterns

The `matcher` field is a regex string that filters when hooks fire. Use `"*"`, `""`, or omit `matcher` entirely to match all occurrences. Each event type matches on a different field:
EventWhat the matcher filtersExample matcher values`PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`tool name`Bash`, `Edit|Write`, `mcp__.*``SessionStart`how the session started`startup`, `resume`, `clear`, `compact``SessionEnd`why the session ended`clear`, `resume`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other``Notification`notification type`permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog``SubagentStart`agent type`Bash`, `Explore`, `Plan`, or custom agent names`PreCompact`, `PostCompact`what triggered compaction`manual`, `auto``SubagentStop`agent typesame values as `SubagentStart``ConfigChange`configuration source`user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills``StopFailure`error type`rate_limit`, `authentication_failed`, `billing_error`, `invalid_request`, `server_error`, `max_output_tokens`, `unknown``InstructionsLoaded`load reason`session_start`, `nested_traversal`, `path_glob_match`, `include`, `compact``Elicitation`MCP server nameyour configured MCP server names`ElicitationResult`MCP server namesame values as `Elicitation``UserPromptSubmit`, `Stop`, `TeammateIdle`, `TaskCompleted`, `WorktreeCreate`, `WorktreeRemove`no matcher suppor

---

## MCP

> ソース: https://docs.anthropic.com/en/docs/claude-code/mcp

# Connect Claude Code to tools via MCP

Learn how to connect Claude Code to your tools with the Model Context Protocol.

Claude Code can connect to hundreds of external tools and data sources through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction), an open source standard for AI-tool integrations. MCP servers give Claude Code access to your tools, databases, and APIs.

## ​What you can do with MCP

With MCP servers connected, you can ask Claude Code to:

- Implement features from issue trackers: “Add the feature described in JIRA issue ENG-4521 and create a PR on GitHub.”

- Analyze monitoring data: “Check Sentry and Statsig to check the usage of the feature described in ENG-4521.”

- Query databases: “Find emails of 10 random users who used feature ENG-4521, based on our PostgreSQL database.”

- Integrate designs: “Update our standard email template based on the new Figma designs that were posted in Slack”

- Automate workflows: “Create Gmail drafts inviting these 10 users to a feedback session about the new feature.”

- React to external events: An MCP server can also act as a channel that pushes messages into your session, so Claude reacts to Telegram messages, Discord chats, or webhook events while you’re away.

## ​Popular MCP servers

Here are some commonly used MCP servers you can connect to Claude Code:
Use third party MCP servers at your own risk - Anthropic has not verified
the correctness or security of all these servers.
Make sure you trust MCP servers you are installing.
Be especially careful when using MCP servers that could fetch untrusted
content, as these can expose you to prompt injection risk.

**Need a specific integration?** [Find hundreds more MCP servers on GitHub](https://github.com/modelcontextprotocol/servers), or build your own using the [MCP SDK](https://modelcontextprotocol.io/quickstart/server).

## ​Installing MCP servers

MCP servers can be configured in three different ways depending on your needs:

### ​Option 1: Add a remote HTTP server

HTTP servers are the recommended option for connecting to remote MCP servers. This is the most widely supported transport for cloud-based services.
Copy
```
# Basic syntax
claude mcp add --transport http name> url>

# Real example: Connect to Notion
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Example with Bearer token
claude mcp add --transport http secure-api https://api.example.com/mcp \
 --header "Authorization: Bearer your-token"
```

### ​Option 2: Add a remote SSE server

The SSE (Server-Sent Events) transport is deprecated. Use HTTP servers instead, where available.
Copy
```
# Basic syntax
claude mcp add --transport sse name> url>

# Real example: Connect to Asana
claude mcp add --transport sse asana https://mcp.asana.com/sse

# Example with authentication header
claude mcp add --transport sse private-api https://api.company.com/sse \
 --header "X-API-Key: your-key-here"
```

### ​Option 3: Add a local stdio server

Stdio servers run as local processes on your machine. They’re ideal for tools that need direct system access or custom scripts.
Copy
```
# Basic syntax
claude mcp add [options] name> -- command> [args...]

# Real example: Add Airtable server
claude mcp add --transport stdio --env AIRTABLE_API_KEY=YOUR_KEY airtable \
 -- npx -y airtable-mcp-server
```

**Important: Option ordering**All options (`--transport`, `--env`, `--scope`, `--header`) must come **before** the server name. The `--` (double dash) then separates the server name from the command and arguments that get passed to the MCP server.For example:

- `claude mcp add --transport stdio myserver -- npx server` → runs `npx server`

- `claude mcp add --transport stdio --env KEY=value myserver -- python server.py --port 8080` → runs `python server.py --port 8080` with `KEY=value` in environment

This prevents conflicts between Claude’s flags and the server’s flags.

### ​Managing your servers

Once configured, you can manage your MCP servers with these commands:
Copy
```
# List all configured servers
claude mcp list

# Get details for a specific server
claude mcp get github

# Remove a server
claude mcp remove github

# (within Claude Code) Check server status
/mcp
```

### ​Dynamic tool updates

Claude Code supports MCP `list_changed` notifications, allowing MCP servers to dynamically update their available tools, prompts, and resources without requiring you to disconnect and reconnect. When an MCP server sends a `list_changed` notification, Claude Code automatically refreshes the available capabilities from that server.

### ​Push messages with channels

An MCP server can also push messages directly into your session so Claude can react to external events like CI results, monitoring alerts, or chat messages. To enable this, your server declares the `claude/channel` capability and you opt it in with the `--channels` flag at startup. See [Channels](https://docs.anthropic.com/docs/en/channels) to use an officially supported channel, or [Channels reference](https://docs.anthropic.com/docs/en/channels-reference) to build your own.
Tips:

- Use the `--scope` flag to specify where the configuration is stored:

`local` (default): Available only to you in the current project (was called `project` in older versions)

- `project`: Shared with everyone in the project via `.mcp.json` file

- `user`: Available to you across all projects (was called `global` in older versions)

- Set environment variables with `--env` flags (for example, `--env KEY=value`)

- Configure MCP server startup timeout using the MCP_TIMEOUT environment variable (for example, `MCP_TIMEOUT=10000 claude` sets a 10-second timeout)

- Claude Code will display a warning when MCP tool output exceeds 10,000 tokens. To increase this limit, set the `MAX_MCP_OUTPUT_TOKENS` environment variable (for example, `MAX_MCP_OUTPUT_TOKENS=50000`)

- Use `/mcp` to authenticate with remote servers that require OAuth 2.0 authentication

**Windows Users**: On native Windows (not WSL), local MCP servers that use `npx` require the `cmd /c` wrapper to ensure proper execution.Copy
```
# This creates command="cmd" which Windows can execute
claude mcp add --transport stdio my-server -- cmd /c npx -y @some/package
```
Without the `cmd /c` wrapper, you’ll encounter “Connection closed” errors because Windows cannot directly execute `npx`. (See the note above for an explanation of the `--` parameter.)

### ​Plugin-provided MCP servers

[Plugins](https://docs.anthropic.com/docs/en/plugins) can bundle MCP servers, automatically providing tools and integrations when the plugin is enabled. Plugin MCP servers work identically to user-configured servers.
**How plugin MCP servers work**:

- Plugins define MCP servers in `.mcp.json` at the plugin root or inline in `plugin.json`

- When a plugin is enabled, its MCP servers start automatically

- Plugin MCP tools appear alongside manually configured MCP tools

- Plugin servers are managed through plugin installation (not `/mcp` commands)

**Example plugin MCP configuration**:
In `.mcp.json` at plugin root:
Copy
```
{
 "database-tools": {
 "command": "${CLAUDE_PLUGIN_ROOT}/servers/db-server",
 "args": ["--config", "${CLAUDE_PLUGIN_ROOT}/config.json"],
 "env": {
 "DB_URL": "${DB_URL}"
 }
 }
}
```

Or inline in `plugin.json`:
Copy
```
{
 "name": "my-plugin",
 "mcpServers": {
 "plugin-api": {
 "command": "${CLAUDE_PLUGIN_ROOT}/servers/api-server",
 "args": ["--port", "8080"]
 }
 }
}
```

**Plugin MCP features**:

- Automatic lifecycle: At session startup, servers for enabled plugins connect automatically. If you enable or disable a plugin during a session, run `/reload-plugins` to connect or disconnect its MCP servers

- Environment variables: use `${CLAUDE_PLUGIN_ROOT}` for bundled plugin files and `${CLAUDE_PLUGIN_DATA}` for persistent state that survives plugin updates

- User environment access: Access to same environment variables as manually configured servers

- Multiple transpo

---

## メモリ (Memory)

> ソース: https://docs.anthropic.com/en/docs/claude-code/memory

# How Claude remembers your project

Give Claude persistent instructions with CLAUDE.md files, and let Claude accumulate learnings automatically with auto memory.

Each Claude Code session begins with a fresh context window. Two mechanisms carry knowledge across sessions:

- CLAUDE.md files: instructions you write to give Claude persistent context

- Auto memory: notes Claude writes itself based on your corrections and preferences

This page covers how to:

- Write and organize CLAUDE.md files

- Scope rules to specific file types with `.claude/rules/`

- Configure auto memory so Claude takes notes automatically

- Troubleshoot when instructions aren’t being followed

## ​CLAUDE.md vs auto memory

Claude Code has two complementary memory systems. Both are loaded at the start of every conversation. Claude treats them as context, not enforced configuration. The more specific and concise your instructions, the more consistently Claude follows them.
CLAUDE.md filesAuto memory**Who writes it**YouClaude**What it contains**Instructions and rulesLearnings and patterns**Scope**Project, user, or orgPer working tree**Loaded into**Every sessionEvery session (first 200 lines)**Use for**Coding standards, workflows, project architectureBuild commands, debugging insights, preferences Claude discovers
Use CLAUDE.md files when you want to guide Claude’s behavior. Auto memory lets Claude learn from your corrections without manual effort.
Subagents can also maintain their own auto memory. See [subagent configuration](https://docs.anthropic.com/docs/en/sub-agents#enable-persistent-memory) for details.

## ​CLAUDE.md files

CLAUDE.md files are markdown files that give Claude persistent instructions for a project, your personal workflow, or your entire organization. You write these files in plain text; Claude reads them at the start of every session.

### ​Choose where to put CLAUDE.md files

CLAUDE.md files can live in several locations, each with a different scope. More specific locations take precedence over broader ones.
ScopeLocationPurposeUse case examplesShared with**Managed policy**• macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`
• Linux and WSL: `/etc/claude-code/CLAUDE.md`
• Windows: `C:\Program Files\ClaudeCode\CLAUDE.md`Organization-wide instructions managed by IT/DevOpsCompany coding standards, security policies, compliance requirementsAll users in organization**Project instructions**`./CLAUDE.md` or `./.claude/CLAUDE.md`Team-shared instructions for the projectProject architecture, coding standards, common workflowsTeam members via source control**User instructions**`~/.claude/CLAUDE.md`Personal preferences for all projectsCode styling preferences, personal tooling shortcutsJust you (all projects)
CLAUDE.md files in the directory hierarchy above the working directory are loaded in full at launch. CLAUDE.md files in subdirectories load on demand when Claude reads files in those directories. See How CLAUDE.md files load for the full resolution order.
For large projects, you can break instructions into topic-specific files using project rules. Rules let you scope instructions to specific file types or subdirectories.

### ​Set up a project CLAUDE.md

A project CLAUDE.md can be stored in either `./CLAUDE.md` or `./.claude/CLAUDE.md`. Create this file and add instructions that apply to anyone working on the project: build and test commands, coding standards, architectural decisions, naming conventions, and common workflows. These instructions are shared with your team through version control, so focus on project-level standards rather than personal preferences.
Run `/init` to generate a starting CLAUDE.md automatically. Claude analyzes your codebase and creates a file with build commands, test instructions, and project conventions it discovers. If a CLAUDE.md already exists, `/init` suggests improvements rather than overwriting it. Refine from there with instructions Claude wouldn’t discover on its own.Set `CLAUDE_CODE_NEW_INIT=true` to enable an interactive multi-phase flow. `/init` asks which artifacts to set up: CLAUDE.md files, skills, and hooks. It then explores your codebase with a subagent, fills in gaps via follow-up questions, and presents a reviewable proposal before writing any files.

### ​Write effective instructions

CLAUDE.md files are loaded into the context window at the start of every session, consuming tokens alongside your conversation. Because they’re context rather than enforced configuration, how you write instructions affects how reliably Claude follows them. Specific, concise, well-structured instructions work best.
**Size**: target under 200 lines per CLAUDE.md file. Longer files consume more context and reduce adherence. If your instructions are growing large, split them using imports or `.claude/rules/` files.
**Structure**: use markdown headers and bullets to group related instructions. Claude scans structure the same way readers do: organized sections are easier to follow than dense paragraphs.
**Specificity**: write instructions that are concrete enough to verify. For example:

- “Use 2-space indentation” instead of “Format code properly”

- “Run `npm test` before committing” instead of “Test your changes”

- “API handlers live in `src/api/handlers/`” instead of “Keep files organized”

**Consistency**: if two rules contradict each other, Claude may pick one arbitrarily. Review your CLAUDE.md files, nested CLAUDE.md files in subdirectories, and `.claude/rules/` periodically to remove outdated or conflicting instructions. In monorepos, use `claudeMdExcludes` to skip CLAUDE.md files from other teams that aren’t relevant to your work.

### ​Import additional files

CLAUDE.md files can import additional files using `@path/to/import` syntax. Imported files are expanded and loaded into context at launch alongside the CLAUDE.md that references them.
Both relative and absolute paths are allowed. Relative paths resolve relative to the file containing the import, not the working directory. Imported files can recursively import other files, with a maximum depth of five hops.
To pull in a README, package.json, and a workflow guide, reference them with `@` syntax anywhere in your CLAUDE.md:
Copy
```
See @README for project overview and @package.json for available npm commands for this project.

# Additional Instructions
- git workflow @docs/git-instructions.md

```

For personal preferences you don’t want to check in, import a file from your home directory. The import goes in the shared CLAUDE.md, but the file it points to stays on your machine:
Copy
```
# Individual Preferences
- @~/.claude/my-project-instructions.md

```

The first time Claude Code encounters external imports in a project, it shows an approval dialog listing the files. If you decline, the imports stay disabled and the dialog does not appear again.
For a more structured approach to organizing instructions, see `.claude/rules/`.

### ​How CLAUDE.md files load

Claude Code reads CLAUDE.md files by walking up the directory tree from your current working directory, checking each directory along the way. This means if you run Claude Code in `foo/bar/`, it loads instructions from both `foo/bar/CLAUDE.md` and `foo/CLAUDE.md`.
Claude also discovers CLAUDE.md files in subdirectories under your current working directory. Instead of loading them at launch, they are included when Claude reads files in those subdirectories.
If you work in a large monorepo where other teams’ CLAUDE.md files get picked up, use `claudeMdExcludes` to skip them.

#### ​Load from additional directories

The `--add-dir` flag gives Claude access to additional directories outside your main working directory. By default, CLAUDE.md files from these directories are not loaded.
To also load CLAUDE.md files from additional directories, including `CLAUDE.md`, `.claude/CLAUDE.md`, and `.claude/rules/*.md`, set the `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` environment variable:
Copy
```
CLAUDE_CODE_ADDITIONA

---

## GitHub Actions

> ソース: https://docs.anthropic.com/en/docs/claude-code/github-actions

# Claude Code GitHub Actions

Learn about integrating Claude Code into your development workflow with Claude Code GitHub Actions

Claude Code GitHub Actions brings AI-powered automation to your GitHub workflow. With a simple `@claude` mention in any PR or issue, Claude can analyze your code, create pull requests, implement features, and fix bugs - all while following your project’s standards. For automatic reviews posted on every PR without a trigger, see [GitHub Code Review](https://docs.anthropic.com/docs/en/code-review).
Claude Code GitHub Actions is built on top of the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview), which enables programmatic integration of Claude Code into your applications. You can use the SDK to build custom automation workflows beyond GitHub Actions.
**Claude Opus 4.6 is now available.** Claude Code GitHub Actions default to Sonnet. To use Opus 4.6, configure the model parameter to use `claude-opus-4-6`.

## ​Why use Claude Code GitHub Actions?

- Instant PR creation: Describe what you need, and Claude creates a complete PR with all necessary changes

- Automated code implementation: Turn issues into working code with a single command

- Follows your standards: Claude respects your `CLAUDE.md` guidelines and existing code patterns

- Simple setup: Get started in minutes with our installer and API key

- Secure by default: Your code stays on Github’s runners

## ​What can Claude do?

Claude Code provides a powerful GitHub Action that transforms how you work with code:

### ​Claude Code Action

This GitHub Action allows you to run Claude Code within your GitHub Actions workflows. You can use this to build any custom workflow on top of Claude Code.
[View repository →](https://github.com/anthropics/claude-code-action)

## ​Setup

## ​Quick setup

The easiest way to set up this action is through Claude Code in the terminal. Just open claude and run `/install-github-app`.
This command will guide you through setting up the GitHub app and required secrets.

- You must be a repository admin to install the GitHub app and add secrets

- The GitHub app will request read & write permissions for Contents, Issues, and Pull requests

- This quickstart method is only available for direct Claude API users. If
you’re using AWS Bedrock or Google Vertex AI, please see the Using with AWS
Bedrock & Google Vertex AI
section.

## ​Manual setup

If the `/install-github-app` command fails or you prefer manual setup, please follow these manual setup instructions:

- Install the Claude GitHub app to your repository: https://github.com/apps/claude
The Claude GitHub app requires the following repository permissions:

Contents: Read & write (to modify repository files)

- Issues: Read & write (to respond to issues)

- Pull requests: Read & write (to create PRs and push changes)

For more details on security and permissions, see the [security documentation](https://github.com/anthropics/claude-code-action/blob/main/docs/security.md).

- Add ANTHROPIC_API_KEY to your repository secrets (Learn how to use secrets in GitHub Actions)

- Copy the workflow file from examples/claude.yml into your repository’s `.github/workflows/`

After completing either the quickstart or manual setup, test the action by tagging `@claude` in an issue or PR comment.

## ​Upgrading from Beta

Claude Code GitHub Actions v1.0 introduces breaking changes that require updating your workflow files in order to upgrade to v1.0 from the beta version.
If you’re currently using the beta version of Claude Code GitHub Actions, we recommend that you update your workflows to use the GA version. The new version simplifies configuration while adding powerful new features like automatic mode detection.

### ​Essential changes

All beta users must make these changes to their workflow files in order to upgrade:

- Update the action version: Change `@beta` to `@v1`

- Remove mode configuration: Delete `mode: "tag"` or `mode: "agent"` (now auto-detected)

- Update prompt inputs: Replace `direct_prompt` with `prompt`

- Move CLI options: Convert `max_turns`, `model`, `custom_instructions`, etc. to `claude_args`

### ​Breaking Changes Reference

Old Beta InputNew v1.0 Input`mode`*(Removed - auto-detected)*`direct_prompt``prompt``override_prompt``prompt` with GitHub variables`custom_instructions``claude_args: --append-system-prompt``max_turns``claude_args: --max-turns``model``claude_args: --model``allowed_tools``claude_args: --allowedTools``disallowed_tools``claude_args: --disallowedTools``claude_env``settings` JSON format

### ​Before and After Example

**Beta version:**
Copy
```
- uses: anthropics/claude-code-action@beta
 with:
 mode: "tag"
 direct_prompt: "Review this PR for security issues"
 anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
 custom_instructions: "Follow our coding standards"
 max_turns: "10"
 model: "claude-sonnet-4-6"
```

**GA version (v1.0):**
Copy
```
- uses: anthropics/claude-code-action@v1
 with:
 prompt: "Review this PR for security issues"
 anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
 claude_args: |
 --append-system-prompt "Follow our coding standards"
 --max-turns 10
 --model claude-sonnet-4-6
```

The action now automatically detects whether to run in interactive mode (responds to `@claude` mentions) or automation mode (runs immediately with a prompt) based on your configuration.

## ​Example use cases

Claude Code GitHub Actions can help you with a variety of tasks. The [examples directory](https://github.com/anthropics/claude-code-action/tree/main/examples) contains ready-to-use workflows for different scenarios.

### ​Basic workflow

Copy
```
name: Claude Code
on:
 issue_comment:
 types: [created]
 pull_request_review_comment:
 types: [created]
jobs:
 claude:
 runs-on: ubuntu-latest
 steps:
 - uses: anthropics/claude-code-action@v1
 with:
 anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
 # Responds to @claude mentions in comments
```

### ​Using skills

Copy
```
name: Code Review
on:
 pull_request:
 types: [opened, synchronize]
jobs:
 review:
 runs-on: ubuntu-latest
 steps:
 - uses: anthropics/claude-code-action@v1
 with:
 anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
 prompt: "Review this pull request for code quality, correctness, and security. Analyze the diff, then post your findings as review comments."
 claude_args: "--max-turns 5"
```

### ​Custom automation with prompts

Copy
```
name: Daily Report
on:
 schedule:
 - cron: "0 9 * * *"
jobs:
 report:
 runs-on: ubuntu-latest
 steps:
 - uses: anthropics/claude-code-action@v1
 with:
 anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
 prompt: "Generate a summary of yesterday's commits and open issues"
 claude_args: "--model opus"
```

### ​Common use cases

In issue or PR comments:
Copy
```
@claude implement this feature based on the issue description
@claude how should I implement user authentication for this endpoint?
@claude fix the TypeError in the user dashboard component

```

Claude will automatically analyze the context and respond appropriately.

## ​Best practices

### ​CLAUDE.md configuration

Create a `CLAUDE.md` file in your repository root to define code style guidelines, review criteria, project-specific rules, and preferred patterns. This file guides Claude’s understanding of your project standards.

### ​Security considerations

Never commit API keys directly to your repository.
For comprehensive security guidance including permissions, authentication, and best practices, see the [Claude Code Action security documentation](https://github.com/anthropics/claude-code-action/blob/main/docs/security.md).
Always use GitHub Secrets for API keys:

- Add your API key as a repository secret named `ANTHROPIC_API_KEY`

- Reference it in workflows: `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`

- Limit action permissions to only what’s necessary

- Review Claude’s suggestions before merging

Always use GitHub Secrets (for example, `${{ secrets.ANTHROPIC_API_KE

---

## トラブルシューティング

> ソース: https://docs.anthropic.com/en/docs/claude-code/troubleshooting

# Troubleshooting

Discover solutions to common issues with Claude Code installation and usage.

## ​Troubleshoot installation issues

If you’d rather skip the terminal entirely, the [Claude Code Desktop app](https://docs.anthropic.com/docs/en/desktop-quickstart) lets you install and use Claude Code through a graphical interface. Download it for [macOS](https://claude.ai/api/desktop/darwin/universal/dmg/latest/redirect?utm_source=claude_code&utm_medium=docs) or [Windows](https://claude.ai/api/desktop/win32/x64/exe/latest/redirect?utm_source=claude_code&utm_medium=docs) and start coding without any command-line setup.

Find the error message or symptom you’re seeing:
What you seeSolution`command not found: claude` or `'claude' is not recognized`Fix your PATH`syntax error near unexpected token 'Install script returns HTML`curl: (56) Failure writing output to destination`Download script first, then run it`Killed` during install on LinuxAdd swap space for low-memory servers`TLS connect error` or `SSL/TLS secure channel`Update CA certificates`Failed to fetch version` or can’t reach download serverCheck network and proxy settings`irm is not recognized` or `&& is not valid`Use the right command for your shell`Claude Code on Windows requires git-bash`Install or configure Git Bash`Error loading shared library`Wrong binary variant for your system`Illegal instruction` on LinuxArchitecture mismatch`dyld: cannot load` or `Abort trap` on macOSBinary incompatibility`Invoke-Expression: Missing argument in parameter list`Install script returns HTML`App unavailable in region`Claude Code is not available in your country. See [supported countries](https://www.anthropic.com/supported-countries).`unable to get local issuer certificate`Configure corporate CA certificates`OAuth error` or `403 Forbidden`Fix authentication

If your issue isn’t listed, work through these diagnostic steps.

## ​Debug installation problems

### ​Check network connectivity

The installer downloads from `storage.googleapis.com`. Verify you can reach it:

Copy

```
curl -sI https://storage.googleapis.com
```

If this fails, your network may be blocking the connection. Common causes:

- Corporate firewalls or proxies blocking Google Cloud Storage

- Regional network restrictions: try a VPN or alternative network

- TLS/SSL issues: update your system’s CA certificates, or check if `HTTPS_PROXY` is configured

If you’re behind a corporate proxy, set `HTTPS_PROXY` and `HTTP_PROXY` to your proxy’s address before installing. Ask your IT team for the proxy URL if you don’t know it, or check your browser’s proxy settings.
This example sets both proxy variables, then runs the installer through your proxy:

Copy

```
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
curl -fsSL https://claude.ai/install.sh | bash
```

### ​Verify your PATH

If installation succeeded but you get a `command not found` or `not recognized` error when running `claude`, the install directory isn’t in your PATH. Your shell searches for programs in directories listed in PATH, and the installer places `claude` at `~/.local/bin/claude` on macOS/Linux or `%USERPROFILE%\.local\bin\claude.exe` on Windows.
Check if the install directory is in your PATH by listing your PATH entries and filtering for `local/bin`:

- macOS/Linux
- Windows PowerShell
- Windows CMD

Copy

```
echo $PATH | tr ':' '\n' | grep local/bin
```

If there’s no output, the directory is missing. Add it to your shell configuration:
Copy

```
# Zsh (macOS default)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Bash (Linux default)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Alternatively, close and reopen your terminal.Verify the fix worked:
Copy

```
claude --version
```

Copy

```
$env:PATH -split ';' | Select-String 'local\\bin'
```

If there’s no output, add the install directory to your User PATH:
Copy

```
$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
[Environment]::SetEnvironmentVariable('PATH', "$currentPath;$env:USERPROFILE\.local\bin", 'User')
```

Restart your terminal for the change to take effect.Verify the fix worked:
Copy

```
claude --version
```

Copy

```
echo %PATH% | findstr /i "local\bin"
```

If there’s no output, open System Settings, go to Environment Variables, and add `%USERPROFILE%\.local\bin` to your User PATH variable. Restart your terminal.Verify the fix worked:
Copy

```
claude --version
```

### ​Check for conflicting installations

Multiple Claude Code installations can cause version mismatches or unexpected behavior. Check what’s installed:

- macOS/Linux
- Windows PowerShell

List all `claude` binaries found in your PATH:
Copy

```
which -a claude
```

Check whether the native installer and npm versions are present:
Copy

```
ls -la ~/.local/bin/claude
```

Copy

```
ls -la ~/.claude/local/
```

Copy

```
npm -g ls @anthropic-ai/claude-code 2>/dev/null
```

Copy

```
where.exe claude
Test-Path "$env:LOCALAPPDATA\Claude Code\claude.exe"
```

If you find multiple installations, keep only one. The native install at `~/.local/bin/claude` is recommended. Remove any extra installations:
Uninstall an npm global install:

Copy

```
npm uninstall -g @anthropic-ai/claude-code
```

Remove a Homebrew install on macOS:

Copy

```
brew uninstall --cask claude-code
```

### ​Check directory permissions

The installer needs write access to `~/.local/bin/` and `~/.claude/`. If installation fails with permission errors, check whether these directories are writable:

Copy

```
test -w ~/.local/bin && echo "writable" || echo "not writable"
test -w ~/.claude && echo "writable" || echo "not writable"
```

If either directory isn’t writable, create the install directory and set your user as the owner:

Copy

```
sudo mkdir -p ~/.local/bin
sudo chown -R $(whoami) ~/.local
```

### ​Verify the binary works

If `claude` is installed but crashes or hangs on startup, run these checks to narrow down the cause.
Confirm the binary exists and is executable:

Copy

```
ls -la $(which claude)
```

On Linux, check for missing shared libraries. If `ldd` shows missing libraries, you may need to install system packages. On Alpine Linux and other musl-based distributions, see [Alpine Linux setup](https://docs.anthropic.com/docs/en/setup#alpine-linux-and-musl-based-distributions).

Copy

```
ldd $(which claude) | grep "not found"
```

Run a quick sanity check that the binary can execute:

Copy

```
claude --version
```

## ​Common installation issues

These are the most frequently encountered installation problems and their solutions.

### ​Install script returns HTML instead of a shell script

When running the install command, you may see one of these errors:

Copy

```
bash: line 1: syntax error near unexpected token `
bash: line 1: `'

```

On PowerShell, the same problem appears as:

Copy

```
Invoke-Expression: Missing argument in parameter list.

```

This means the install URL returned an HTML page instead of the install script. If the HTML page says “App unavailable in region,” Claude Code is not available in your country. See [supported countries](https://www.anthropic.com/supported-countries).
Otherwise, this can happen due to network issues, regional routing, or a temporary service disruption.
**Solutions:**

- Use an alternative install method:
On macOS or Linux, install via Homebrew:
Copy
```
brew install --cask claude-code
```

On Windows, install via WinGet:
Copy
```
winget install Anthropic.ClaudeCode
```

- Retry after a few minutes: the issue is often temporary. Wait and try the original command again.

### ​`command not found: claude` after installation

The install finished but `claude` doesn’t work. The exact error varies by platform:
PlatformError messagemacOS`zsh: command not found: claude`Linux`bash: claude: command not found`Windows CMD`'claude' is not recognized as an internal or external command`PowerShell`claude : The

---


*取得できなかったページ: Bedrock / Vertex*