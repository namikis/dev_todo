# Claude Code — 機能概要

> 最終更新: 2026-03-20 / 最新バージョン: `2.1.80`
>
> このドキュメントは `scripts/fetch-claude-changelog.js` で自動更新されます。
> 更新コマンド: `npm run claude:update`

---

## パッケージ情報

- **パッケージ名**: `@anthropic-ai/claude-code`
- **最新バージョン**: `2.1.80`
- **前回確認バージョン**: `2.1.80`
- **npm**: https://www.npmjs.com/package/@anthropic-ai/claude-code
- **GitHub**: https://github.com/anthropics/claude-code

---

## 直近のリリース内容

## 2.1.80

- Added `rate_limits` field to statusline scripts for displaying Claude.ai rate limit usage (5-hour and 7-day windows with `used_percentage` and `resets_at`)
- Added `source: 'settings'` plugin marketplace source — declare plugin entries inline in settings.json
- Added CLI tool usage detection to plugin tips, in addition to file pattern matching
- Added `effort` frontmatter support for skills and slash commands to override the model effort level when invoked
- Added `--channels` (research preview) — allow MCP servers to push messages into your session
- Fixed `--resume` dropping parallel tool results — sessions with parallel tool calls now restore all tool_use/tool_result pairs instead of showing `[Tool result missing]` placeholders
- Fixed voice mode WebSocket failures caused by Cloudflare bot detection on non-browser TLS fingerprints
- Fixed 400 errors when using fine-grained tool streaming through API proxies, Bedrock, or Vertex
- Fixed `/remote-control` appearing for gateway and third-party provider deployments where it cannot function
- Fixed `/sandbox` tab switching not responding to Tab or arrow keys
- Improved responsiveness of `@` file autocomplete in large git repositories
- Improved `/effort` to show what auto currently resolves to, matching the status bar indicator
- Improved `/permissions` — Tab and arrow keys now switch tabs from within a list
- Improved background tasks panel — left arrow now closes from the list view
- Simplified plugin install tips to use a single `/plugin install` command instead of a two-step flow
- Reduced memory usage on startup in large repositories (~80 MB saved on 250k-file repos)
- Fixed managed settings (`enabledPlugins`, `permissions.defaultMode`, policy-set env vars) not being applied at startup when `remote-settings.json` was cached from a prior session


---

## 2.1.79

- Added `--console` flag to `claude auth login` for Anthropic Console (API billing) authentication
- Added "Show turn duration" toggle to the `/config` menu
- Fixed `claude -p` hanging when spawned as a subprocess without explicit stdin (e.g. Python `subprocess.run`)
- Fixed Ctrl+C not working in `-p` (print) mode
- Fixed `/btw` returning the main agent's output instead of answering the side question when triggered during streaming
- Fixed voice mode not activating correctly on startup when `voiceEnabled: true` is set
- Fixed left/right arrow tab navigation in `/permissions`
- Fixed `CLAUDE_CODE_DISABLE_TERMINAL_TITLE` not preventing terminal title from being set on startup
- Fixed custom status line showing nothing when workspace trust is blocking it
- Fixed enterprise users being unable to retry on rate limit (429) errors
- Fixed `SessionEnd` hooks not firing when using interactive `/resume` to switch sessions
- Improved startup memory usage by ~18MB across all scenarios
- Improved non-streaming API fallback with a 2-minute per-attempt timeout, preventing sessions from hanging indefinitely
- `CLAUDE_CODE_PLUGIN_SEED_DIR` now supports multiple seed directories separated by the platform path delimiter (`:` on Unix, `;` on Windows)
- [VSCode] Added `/remote-control` — bridge your session to claude.ai/code to continue from a browser or phone
- [VSCode] Session tabs now get AI-generated titles based on your first message
- [VSCode] Fixed the thinking pill showing "Thinking" instead of "Thought for Ns" after a response completes
- [VSCode] Fixed missing session diff button when opening sessions from the left sidebar


---

## 2.1.78

- Added `StopFailure` hook event that fires when the turn ends due to an API error (rate limit, auth failure, etc.)
- Added `${CLAUDE_PLUGIN_DATA}` variable for plugin persistent state that survives plugin updates; `/plugin uninstall` prompts before deleting it
- Added `effort`, `maxTurns`, and `disallowedTools` frontmatter support for plugin-shipped agents
- Terminal notifications (iTerm2/Kitty/Ghostty popups, progress bar) now reach the outer terminal when running inside tmux with `set -g allow-passthrough on`
- Response text now streams line-by-line as it's generated
- Fixed `git log HEAD` failing with "ambiguous argument" inside sandboxed Bash on Linux, and stub files polluting `git status` in the working directory
- Fixed `cc log` and `--resume` silently truncating conversation history on large sessions (>5 MB) that used subagents
- Fixed infinite loop when API errors triggered stop hooks that re-fed blocking errors to the model
- Fixed `deny: ["mcp__servername"]` permission rules not removing MCP server tools before sending to the model, allowing it to see and attempt blocked tools
- Fixed `sandbox.filesystem.allowWrite` not working with absolute paths (previously required `//` prefix)
- Fixed `/sandbox` Dependencies tab showing Linux prerequisites on macOS instead of macOS-specific info
- **Security:** Fixed silent sandbox disable when `sandbox.enabled: true` is set but dependencies are missing — now shows a visible startup warning
- Fixed `.git`, `.claude`, and other protected directories being writable without a prompt in `bypassPermissions` mode
- Fixed ctrl+u in normal mode scrolling instead of readline kill-line (ctrl+u/ctrl+d half-page scroll moved to transcript mode only)
- Fixed voice mode modifier-combo push-to-talk keybindings (e.g. ctrl+k) requiring a hold instead of activating immediately
- Fixed voice mode not working on WSL2 with WSLg (Windows 11); WSL1/Win10 users now get a clear error
- Fixed `--worktree` flag not loading skills and hooks from the worktree directory
- Fixed `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS` and `includeGitInstructions` setting not suppressing the git status section in the system prompt
- Fixed Bash tool not finding Homebrew and other PATH-dependent binaries when VS Code is launched from Dock/Spotlight
- Fixed washed-out Claude orange color in VS Code/Cursor/code-server terminals that don't advertise truecolor support
- Added `ANTHROPIC_CUSTOM_MODEL_OPTION` env var to add a custom entry to the `/model` picker, with optional `_NAME` and `_DESCRIPTION` suffixed vars for display
- Fixed `ANTHROPIC_BETAS` environment variable being silently ignored when using Haiku models
- Fixed queued prompts being concatenated without a newline separator
- Improved memory usage and startup time when resuming large sessions
- [VSCode] Fixed a brief flash of the login screen when opening the sidebar while already authenticated
- [VSCode] Fixed "API Error: Rate limit reached" when selecting Opus — model dropdown no longer offers 1M context variant to subscribers whose plan tier is unknown


---

## 2.1.77

- Increased default maximum output token limits for Claude Opus 4.6 to 64k tokens, and the upper bound for Opus 4.6 and Sonnet 4.6 models to 128k tokens
- Added `allowRead` sandbox filesystem setting to re-allow read access within `denyRead` regions
- `/copy` now accepts an optional index: `/copy N` copies the Nth-latest assistant response
- Fixed "Always Allow" on compound bash commands (e.g. `cd src && npm test`) saving a single rule for the full string instead of per-subcommand, leading to dead rules and repeated permission prompts
- Fixed auto-updater starting overlapping binary downloads when the slash-command overlay repeatedly opened and closed, accumulating tens of gigabytes of memory
- Fixed `--resume` silently truncating recent conversation history due to a race between memory-extraction writes and the main transcript
- Fixed PreToolUse hooks returning `"allow"` bypassing `deny` permission rules, including enterprise managed settings
- Fixed Write tool silently converting line endings when overwriting CRLF files or creating files in CRLF directories
- Fixed memory growth in long-running sessions from progress messages surviving compaction
- Fixed cost and token usage not being tracked when the API falls back to non-streaming mode
- Fixed `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` not stripping beta tool-schema fields, causing proxy gateways to reject requests
- Fixed Bash tool reporting errors for successful commands when the system temp directory path contains spaces
- Fixed paste being lost when typing immediately after pasting
- Fixed Ctrl+D in `/feedback` text input deleting forward instead of the second press exiting the session
- Fixed API error when dragging a 0-byte image file into the prompt
- Fixed Claude Desktop sessions incorrectly using the terminal CLI's configured API key instead of OAuth
- Fixed `git-subdir` plugins at different subdirectories of the same monorepo commit colliding in the plugin cache
- Fixed ordered list numbers not rendering in terminal UI
- Fixed a race condition where stale-worktree cleanup could delete an agent worktree just resumed from a previous crash
- Fixed input deadlock when opening `/mcp` or similar dialogs while the agent is running
- Fixed Backspace and Delete keys not working in vim NORMAL mode
- Fixed status line not updating when vim mode is toggled on or off
- Fixed hyperlinks opening twice on Cmd+click in VS Code, Cursor, and other xterm.js-based terminals
- Fixed background colors rendering as terminal-default inside tmux with default configuration
- Fixed iTerm2 session crash when selecting text inside tmux over SSH
- Fixed clipboard copy silently failing in tmux sessions; copy toast now indicates whether to paste with `⌘V` or tmux `prefix+]`
- Fixed `←`/`→` accidentally switching tabs in settings, permissions, and sandbox dialogs while navigating lists
- Fixed IDE integration not auto-connecting when Claude Code is launched inside tmux or screen
- Fixed CJK characters visually bleeding into adjacent UI elements when clipped at the right edge
- Fixed teammate panes not closing when the leader exits
- Fixed iTerm2 auto mode not detecting iTerm2 for native split-pane teammates
- Faster startup on macOS (~60ms) by reading keychain credentials in parallel with module loading
- Faster `--resume` on fork-heavy and very large sessions — up to 45% faster loading and ~100-150MB less peak memory
- Improved Esc to abort in-flight non-streaming API requests
- Improved `claude plugin validate` to check skill, agent, and command frontmatter plus `hooks/hooks.json`, catching YAML parse errors and schema violations
- Background bash tasks are now killed if output exceeds 5GB, preventing runaway processes from filling disk
- Sessions are now auto-named from plan content when you accept a plan
- Improved headless mode plugin installation to compose correctly with `CLAUDE_CODE_PLUGIN_SEED_DIR`
- Show a notice when `apiKeyHelper` takes longer than 10s, preventing it from blocking the main loop
- The Agent tool no longer accepts a `resume` parameter — use `SendMessage({to: agentId})` to continue a previously spawned agent
- `SendMessage` now auto-resumes stopped agents in the background instead of returning an error
- Renamed `/fork` to `/branch` (`/fork` still works as an alias)
- [VSCode] Improved plan preview tab titles to use the plan's heading instead of "Claude's Plan"
- [VSCode] When option+click doesn't trigger native selection on macOS, the footer now points to the `macOptionClickForcesSelection` setting


---

## 2.1.76

- Added MCP elicitation support — MCP servers can now request structured input mid-task via an interactive dialog (form fields or browser URL)
- Added new `Elicitation` and `ElicitationResult` hooks to intercept and override responses before they're sent back
- Added `-n` / `--name <name>` CLI flag to set a display name for the session at startup
- Added `worktree.sparsePaths` setting for `claude --worktree` in large monorepos to check out only the directories you need via git sparse-checkout
- Added `PostCompact` hook that fires after compaction completes
- Added `/effort` slash command to set model effort level
- Added session quality survey — enterprise admins can configure the sample rate via the `feedbackSurveyRate` setting
- Fixed deferred tools (loaded via `ToolSearch`) losing their input schemas after conversation compaction, causing array and number parameters to be rejected with type errors
- Fixed slash commands showing "Unknown skill"
- Fixed plan mode asking for re-approval after the plan was already accepted
- Fixed voice mode swallowing keypresses while a permission dialog or plan editor was open
- Fixed `/voice` not working on Windows when installed via npm
- Fixed spurious "Context limit reached" when invoking a skill with `model:` frontmatter on a 1M-context session
- Fixed "adaptive thinking is not supported on this model" error when using non-standard model strings
- Fixed `Bash(cmd:*)` permission rules not matching when a quoted argument contains `#`
- Fixed "don't ask again" in the Bash permission dialog showing the full raw command for pipes and compound commands
- Fixed auto-compaction retrying indefinitely after consecutive failures — a circuit breaker now stops after 3 attempts
- Fixed MCP reconnect spinner persisting after successful reconnection
- Fixed LSP plugins not registering servers when the LSP Manager initialized before marketplaces were reconciled
- Fixed clipboard copying in tmux over SSH — now attempts both direct terminal write and tmux clipboard integration
- Fixed `/export` showing only the filename instead of the full file path in the success message
- Fixed transcript not auto-scrolling to new messages after selecting text
- Fixed Escape key not working to exit the login method selection screen
- Fixed several Remote Control issues: sessions silently dying when the server reaps an idle environment, rapid messages being queued one-at-a-time instead of batched, and stale work items causing redelivery after JWT refresh
- Fixed bridge sessions failing to recover after extended WebSocket disconnects
- Fixed slash commands not found when typing the exact name of a soft-hidden command
- Improved `--worktree` startup performance by reading git refs directly and skipping redundant `git fetch` when the remote branch is already available locally
- Improved background agent behavior — killing a background agent now preserves its partial results in the conversation context
- Improved model fallback notifications — now always visible instead of hidden behind verbose mode, with human-friendly model names
- Improved blockquote readability on dark terminal themes — text is now italic with a left bar instead of dim
- Improved stale worktree cleanup — worktrees left behind after an interrupted parallel run are now automatically cleaned up
- Improved Remote Control session titles — now derived from your first prompt instead of showing "Interactive session"
- Improved `/voice` to show your dictation language on enable and warn when your `language` setting isn't supported for voice input
- Updated `--plugin-dir` to only accept one path to support subcommands — use repeated `--plugin-dir` for multiple directories
- [VSCode] Fixed gitignore patterns containing commas silently excluding entire filetypes from the @-mention file picker


---

*完全な変更履歴は `docs/claude-code-changelog.md` を参照*