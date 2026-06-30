#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CONFIG_PATH = path_1.default.join(os_1.default.homedir(), '.buddy', 'config.json');
const OFFICE_PATH = path_1.default.join(os_1.default.homedir(), '.buddy', 'office.json');
function loadConfig() {
    try {
        return JSON.parse(fs_1.default.readFileSync(CONFIG_PATH, 'utf-8'));
    }
    catch {
        return { server: 'https://buddy.findu.site', admin_token: '' };
    }
}
function fullUrl(path) {
    const config = loadConfig();
    const base = serverOverride || config.server;
    return `${base.replace(/\/+$/, '')}/${path.replace(/^\/*/, '')}`;
}
function loadOffice() {
    try {
        return JSON.parse(fs_1.default.readFileSync(OFFICE_PATH, 'utf-8'));
    }
    catch {
        return null;
    }
}
function saveOffice(data) {
    const dir = path_1.default.dirname(OFFICE_PATH);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    fs_1.default.writeFileSync(OFFICE_PATH, JSON.stringify(data, null, 2));
}
async function api(method, endpoint, body, token) {
    const config = loadConfig();
    const server = serverOverride || config.server;
    const headers = { 'Content-Type': 'application/json' };
    if (token)
        headers['Authorization'] = `Bearer ${token}`;
    if (debugMode) {
        console.log(`[DEBUG] ${method} ${server}${endpoint}`);
        if (token)
            console.log(`[DEBUG] Headers: Authorization: Bearer ${token.slice(0, 20)}...`);
        if (body)
            console.log(`[DEBUG] Body: ${JSON.stringify(body)}`);
    }
    const res = await fetch(`${server}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (debugMode) {
        console.log(`[DEBUG] Response: ${res.status} ${JSON.stringify(data)}`);
    }
    return data;
}
const program = new commander_1.Command();
let debugMode = false;
let serverOverride;
program
    .name('buddy-cli')
    .description('Buddy Office CLI — virtual office for coding agents')
    .version('1.0.0')
    .option('--debug', 'Enable debug output');
program.command('config')
    .description('Configure server URL and admin token')
    .option('--server <url>', 'Server URL')
    .option('--admin-token <token>', 'Admin token for invite management')
    .action((opts) => {
    const config = loadConfig();
    if (opts.server)
        config.server = opts.server;
    if (opts.adminToken)
        config.admin_token = opts.adminToken;
    const dir = path_1.default.dirname(CONFIG_PATH);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    fs_1.default.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`Server: ${config.server}`);
    if (config.admin_token)
        console.log(`Admin token: ${config.admin_token.slice(0, 8)}...`);
});
program.command('register')
    .description('Register or reconnect')
    .option('--invite-code <code>', 'Invite code (required for first time)')
    .option('--nickname <name>', 'Nickname (first time only)')
    .option('--avatar-id <id>', 'Avatar ID (first time only)')
    .option('--agent-type <type>', 'Agent type', 'claude-code')
    .action(async (opts) => {
    const agentType = opts.agentType || 'claude-code';
    const office = loadOffice();
    const headers = { 'Content-Type': 'application/json' };
    // Already registered → reconnect with token
    if (office?.agent_token) {
        headers['Authorization'] = `Bearer ${office.agent_token}`;
        const result = await api('POST', '/api/auth/register', { agent_type: agentType }, office.agent_token);
        if (!result.error) {
            console.log(`Reconnected! ${result.nickname} at ${result.desk.label} ${result.level_badge} Lv.${result.level}`);
            console.log(`Office: ${fullUrl(`/w/${result.room_id}`)}`);
            return;
        }
        // Token expired → fall through to new registration
        console.log('Token expired, re-registering...');
    }
    if (!opts.inviteCode) {
        console.error('First time? Use --invite-code <code>');
        return;
    }
    const result = await api('POST', '/api/auth/register', {
        invite_code: opts.inviteCode,
        agent_type: agentType,
        nickname: opts.nickname,
        avatar_id: opts.avatarId,
    });
    if (result.error) {
        console.error('Error:', result.error);
        return;
    }
    saveOffice({ agent_token: result.agent_token, user_id: result.user_id, office_url: result.office_url });
    console.log(`Registered! ${result.nickname} at ${result.desk.label} ${result.level_badge} Lv.${result.level}`);
    console.log(`Office URL: ${fullUrl(`/w/${result.room_id}`)}`);
});
program.command('user')
    .description('Show current user info')
    .action(async () => {
    const office = loadOffice();
    if (!office) {
        console.error('Not registered. Run: buddy-cli register --invite-code XXX');
        return;
    }
    const result = await api('GET', '/api/agent/user', undefined, office.agent_token);
    if (result.error) {
        console.error('Error:', result.error);
        return;
    }
    const hours = (result.total_online_seconds / 3600).toFixed(1);
    console.log(`Nickname:   ${result.nickname}`);
    console.log(`Level:      ${result.level_badge} Lv.${result.level}`);
    console.log(`Online:     ${hours}h`);
    console.log(`Office:     ${result.room}`);
    console.log(`Desk:       ${result.desk}`);
    console.log(`Office URL: ${fullUrl(`/w/${result.room_id}`)}`);
    console.log(`Token:      ${office.agent_token.slice(0, 20)}...`);
});
program.command('set-status <status>')
    .description('Set avatar status')
    .action(async (status) => {
    const office = loadOffice();
    if (!office) {
        console.error('Not registered');
        return;
    }
    await api('POST', '/api/agent/status', { status }, office.agent_token);
    console.log(`Status set to: ${status}`);
});
const HOOK_EVENTS = {
    'prompt-submit': 'working',
    'session-start': 'working',
    'ask-user': 'coffee-break',
    'stop': 'working',
    'task-completed': 'celebrating',
    'stop-failure': 'nervous',
    'writing': 'writing',
};
program.command('hook <event>')
    .description('Update status from a Claude Code hook event (silent if not registered)')
    .action(async (event) => {
    const office = loadOffice();
    if (!office?.agent_token)
        return;
    // Special case: session-end calls logout
    if (event === 'session-end') {
        try {
            await api('DELETE', '/api/agent/logout', undefined, office.agent_token);
        }
        catch { }
        return;
    }
    // TaskCompleted: celebrate then revert to working after 2s
    if (event === 'task-completed') {
        try {
            await api('POST', '/api/agent/status', { status: 'celebrating' }, office.agent_token);
            await new Promise(r => setTimeout(r, 2000));
            await api('POST', '/api/agent/status', { status: 'working' }, office.agent_token);
        }
        catch { }
        return;
    }
    const status = HOOK_EVENTS[event];
    if (!status)
        return;
    try {
        await api('POST', '/api/agent/status', { status }, office.agent_token);
    }
    catch { }
});
program.command('list-status')
    .description('List available statuses')
    .action(async () => {
    const result = await api('GET', '/api/office/statuses');
    console.log('Available statuses:');
    for (const s of result.statuses) {
        console.log(`  ${s.emoji}  ${s.value.padEnd(15)} ${s.label}`);
    }
});
program.command('list-user')
    .description('List online users')
    .action(async () => {
    const result = await api('GET', '/api/office/users');
    console.log(`Online users (${result.users.length}):`);
    for (const u of result.users) {
        console.log(`  ${u.avatar} ${u.nickname}  ${u.desk}  ${u.status}`);
    }
});
program.command('emoji <target> <emoji>')
    .description('Send emoji to a user')
    .action(async (target, emoji) => {
    const office = loadOffice();
    if (!office) {
        console.error('Not registered');
        return;
    }
    const result = await api('POST', '/api/agent/emoji', { target, emoji }, office.agent_token);
    if (!result.ok)
        console.log('Target is offline');
    else
        console.log(`Emoji sent to ${target}`);
});
program.command('broadcast-emoji <emoji>')
    .description('Broadcast emoji to everyone in the same room (5s cooldown)')
    .action(async (emoji) => {
    const office = loadOffice();
    if (!office) {
        console.error('Not registered');
        return;
    }
    const result = await api('POST', '/api/agent/emoji/broadcast', { emoji }, office.agent_token);
    if (result.error)
        console.log(`Error: ${result.error}`);
    else
        console.log(`Emoji broadcast to ${result.sent_to} users`);
});
program.command('list-emoji')
    .description('List available emojis')
    .action(async () => {
    const result = await api('GET', '/api/emojis');
    for (const e of result.emojis) {
        console.log(`  ${e.alias.padEnd(10)} ${e.emoji}  ${e.label}`);
    }
});
program.command('avatars')
    .description('List available avatars')
    .action(async () => {
    const result = await api('GET', '/api/avatars');
    if (result.error) {
        console.error('Error:', result.error);
        return;
    }
    for (const a of result.avatars) {
        console.log(`  ${a.name.padEnd(10)} ${a.category}`);
    }
});
program.command('reset')
    .description('Clear local configuration')
    .action(() => {
    try {
        fs_1.default.unlinkSync(CONFIG_PATH);
    }
    catch { }
    try {
        fs_1.default.unlinkSync(OFFICE_PATH);
    }
    catch { }
    console.log('Local configuration cleared');
});
// Admin commands: only show if admin token is configured
const cliConfig = loadConfig();
if (cliConfig.admin_token) {
    program.command('invite')
        .description('Generate invite code')
        .option('--max-uses <n>', 'Max uses', '1')
        .option('--expires <hours>', 'Expires in hours')
        .action(async (opts) => {
        const config = loadConfig();
        const result = await api('POST', '/api/auth/invite/generate', {
            max_uses: parseInt(opts.maxUses),
            expires_in_hours: opts.expires ? parseInt(opts.expires) : undefined,
        }, config.admin_token);
        if (result.error) {
            console.error('Error:', result.error);
            return;
        }
        console.log(`Invite code: ${result.code} (max ${opts.maxUses} uses)`);
    });
    program.command('list-invites')
        .description('List invite codes')
        .action(async () => {
        const config = loadConfig();
        const result = await api('GET', '/api/auth/invites', undefined, config.admin_token);
        if (result.error) {
            console.error('Error:', result.error);
            return;
        }
        console.log(`Invite codes (${result.codes.length}):`);
        for (const c of result.codes) {
            console.log(`  ${c.code}  uses: ${c.use_count}/${c.max_uses}  expires: ${c.expires_at || 'never'}`);
        }
    });
    program.command('list-rooms')
        .description('List rooms')
        .action(async () => {
        const result = await api('GET', '/api/rooms');
        for (const r of result.rooms) {
            console.log(`  ${r.id}  ${r.name}  (${r.occupied_desks}/${r.total_desks})`);
        }
    });
    program.command('rename-room <room-id> <name>')
        .description('Rename room')
        .action(async (roomId, name) => {
        const config = loadConfig();
        await api('PUT', `/api/rooms/${roomId}`, { name }, config.admin_token);
        console.log(`Room renamed to: ${name}`);
    });
    program.command('revoke <code>')
        .description('Revoke invite code')
        .action(async (code) => {
        const config = loadConfig();
        await api('DELETE', `/api/auth/invite/${code}`, undefined, config.admin_token);
        console.log(`Revoked: ${code}`);
    });
}
program.command('logout')
    .description('Logout')
    .action(async () => {
    const office = loadOffice();
    if (!office) {
        console.error('Not registered');
        return;
    }
    await api('DELETE', '/api/agent/logout', undefined, office.agent_token);
    console.log('Logged out');
});
// --- Agent integrations ---
// Path to this repo's root (for finding bundled cli/ and mcp/ files)
function getRepoRoot() {
    return path_1.default.join(__dirname, '..');
}
// Path to the USER'S project .claude/ directory (where hooks should be written)
function getClaudeSettingsPath() {
    const cwd = process.cwd();
    const local = path_1.default.join(cwd, '.claude', 'settings.local.json');
    if (fs_1.default.existsSync(local))
        return local;
    return path_1.default.join(cwd, '.claude', 'settings.json');
}
function loadClaudeSettings() {
    try {
        return JSON.parse(fs_1.default.readFileSync(getClaudeSettingsPath(), 'utf-8'));
    }
    catch {
        return {};
    }
}
function saveClaudeSettings(data) {
    const p = getClaudeSettingsPath();
    const dir = path_1.default.dirname(p);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    fs_1.default.writeFileSync(p, JSON.stringify(data, null, 2));
}
function hookCommand(event) {
    const repoRoot = getRepoRoot();
    const distPath = path_1.default.join(repoRoot, 'cli', 'dist', 'index.js');
    const srcPath = path_1.default.join(repoRoot, 'cli', 'index.ts');
    if (fs_1.default.existsSync(distPath)) {
        return `node ${distPath} hook ${event}`;
    }
    return `npx tsx ${srcPath} hook ${event}`;
}
function hookEntry(event, matcher) {
    const entry = {
        hooks: [
            {
                type: 'command',
                command: hookCommand(event),
            },
        ],
    };
    if (matcher)
        entry.matcher = matcher;
    return [entry];
}
function extractHooksCmds(entry) {
    const cmds = new Set();
    const entries = Array.isArray(entry) ? entry : [entry];
    for (const e of entries) {
        if (e && typeof e === 'object' && 'hooks' in e) {
            for (const h of e.hooks) {
                if (h.command)
                    cmds.add(String(h.command));
            }
        }
    }
    return cmds;
}
function applyHooks(settings) {
    const existingHooks = settings.hooks || {};
    const newEntries = [
        { event: 'SessionStart', entry: hookEntry('session-start') },
        { event: 'UserPromptSubmit', entry: hookEntry('prompt-submit') },
        { event: 'Elicitation', entry: hookEntry('ask-user') },
        { event: 'Stop', entry: hookEntry('stop') },
        { event: 'SessionEnd', entry: hookEntry('session-end') },
        { event: 'TaskCompleted', entry: hookEntry('task-completed') },
        { event: 'StopFailure', entry: hookEntry('stop-failure') },
        { event: 'PreToolUse', entry: hookEntry('writing', 'Write|Edit') },
    ];
    const merged = { ...existingHooks };
    for (const { event, entry } of newEntries) {
        const existing = merged[event];
        if (Array.isArray(existing) && Array.isArray(entry)) {
            const existingCmds = extractHooksCmds(existing);
            const newCmds = extractHooksCmds(entry);
            const toAdd = entry.filter(e => {
                const cmds = extractHooksCmds(e);
                return ![...cmds].some(c => existingCmds.has(c));
            });
            if (toAdd.length > 0) {
                merged[event] = [...existing, ...toAdd];
            }
        }
        else {
            merged[event] = entry;
        }
    }
    settings.hooks = merged;
}
program.command('setup-hooks')
    .description('Configure Claude Code hooks for automatic buddy-office status updates')
    .action(async () => {
    const settings = loadClaudeSettings();
    applyHooks(settings);
    saveClaudeSettings(settings);
    console.log(`Configured hooks in ${getClaudeSettingsPath()}`);
    console.log('Hooks:');
    console.log('  SessionStart             -> working');
    console.log('  UserPromptSubmit         -> working');
    console.log('  Elicitation              -> coffee-break');
    console.log('  Stop                     -> working');
    console.log('  SessionEnd               -> logout');
    console.log('  TaskCompleted            -> celebrating (→working after 2s)');
    console.log('  StopFailure              -> nervous');
    console.log('  PreToolUse(Write|Edit)   -> writing');
});
program.command('setup')
    .description('One-click setup: configure MCP server and permissions for Claude Code')
    .option('--server <url>', 'Buddy Office server URL', 'https://buddy.findu.site')
    .option('--invite-code <code>', 'Invite code (required for first time)')
    .option('--with-hooks', 'Also configure Claude Code hooks for automatic status updates')
    .action(async (opts) => {
    const { execSync } = await Promise.resolve().then(() => __importStar(require('child_process')));
    // Save config
    const config = { server: opts.server, admin_token: '' };
    const dir = path_1.default.dirname(CONFIG_PATH);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    fs_1.default.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`Config saved: ${CONFIG_PATH}`);
    // Register if invite code provided
    if (opts.inviteCode) {
        const result = await api('POST', '/api/auth/register', {
            invite_code: opts.inviteCode,
            agent_type: 'claude-code',
        });
        if (result.error) {
            console.error(`Registration failed: ${result.error}`);
        }
        else {
            saveOffice({ agent_token: result.agent_token, user_id: result.user_id, office_url: result.office_url });
            console.log(`Registered: ${result.nickname} at ${result.desk?.label}`);
            console.log(`Office URL: ${fullUrl(`/w/${result.room_id}`)}`);
        }
    }
    // Add MCP server to Claude Code
    const repoRoot = getRepoRoot();
    const mcpSource = path_1.default.join(repoRoot, 'mcp', 'index.ts');
    const idleArg = opts.withHooks ? '--idle-status off' : '';
    const mcpCmd = `claude mcp add buddy-office -- npx tsx ${mcpSource} --server ${opts.server} ${idleArg}`.trim();
    try {
        execSync(mcpCmd, { stdio: 'inherit' });
        console.log('MCP server added to Claude Code');
    }
    catch {
        console.log('Failed to add MCP server (is Claude Code installed?)');
    }
    // Add permissions
    try {
        execSync('claude settings add allowedTools "mcp__buddy-office__*"', { stdio: 'inherit' });
        console.log('Permissions configured');
    }
    catch {
        console.log('Failed to set permissions');
    }
    // Configure hooks if requested
    if (opts.withHooks) {
        const settings = loadClaudeSettings();
        applyHooks(settings);
        saveClaudeSettings(settings);
        console.log(`Hooks configured in ${getClaudeSettingsPath()}`);
    }
    console.log('\nSetup complete! Restart Claude Code to activate.');
});
// Extract global --server from argv before commander
debugMode = process.argv.includes('--debug');
const serverIdx = process.argv.indexOf('--server');
if (serverIdx >= 0 && serverIdx < process.argv.length - 1) {
    serverOverride = process.argv[serverIdx + 1];
}
program.allowUnknownOption();
program.parse();
