import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { toolDefinitions } from './tools';
import fs from 'fs';
import path from 'path';
import os from 'os';

const server = new McpServer({
  name: 'buddy-office',
  version: '1.0.0',
});

// Parse args
const args = process.argv.slice(2);
function getArg(name: string): string | undefined {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : undefined;
}
function hasFlag(name: string): boolean {
  return args.includes(name);
}

const SERVER_URL = getArg('--server') || 'http://localhost:3000';
const INVITE_CODE = getArg('--invite-code') || '';

// Feature toggles
const AUTO_GREET = hasFlag('--auto-greet') || hasFlag('--no-auto-greet') ? !hasFlag('--no-auto-greet') : true;
const NOTIFY_EVENTS = hasFlag('--notify-events') || hasFlag('--no-notify-events') ? !hasFlag('--no-notify-events') : true;
const rawIdleStatus = getArg('--idle-status');
const IDLE_STATUS_DISABLED = rawIdleStatus === 'off' || hasFlag('--no-idle-status');
const IDLE_STATUS = IDLE_STATUS_DISABLED ? '' : (rawIdleStatus || 'slacking');
const IDLE_TIMEOUT = parseInt(getArg('--idle-timeout') || '600') * 1000; // default 10 min

// Try loading existing token from CLI config
const OFFICE_PATH = path.join(os.homedir(), '.buddy', 'office.json');
let agentToken = '';
let myUserId = '';
let myNickname = '';
try {
  const office = JSON.parse(fs.readFileSync(OFFICE_PATH, 'utf-8'));
  if (office.agent_token) {
    agentToken = office.agent_token;
    myUserId = office.user_id || '';
    console.error(`Loaded existing token from ${OFFICE_PATH}`);
  }
} catch {}

// Track last buddy tool call for idle detection
let lastToolCallTime = Date.now();

// Register tools
for (const tool of toolDefinitions) {
  const hasSchema = Object.keys(tool.schema).length > 0;

  if (hasSchema) {
    server.tool(
      tool.name,
      tool.description,
      tool.schema,
      async (params) => {
        lastToolCallTime = Date.now();
        const result = await callApi(tool.name, params);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }
    );
  } else {
    server.tool(
      tool.name,
      tool.description,
      async () => {
        lastToolCallTime = Date.now();
        const result = await callApi(tool.name, {});
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
      }
    );
  }
}

async function callApi(toolName: string, params: Record<string, unknown>) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (agentToken) headers['Authorization'] = `Bearer ${agentToken}`;

  let apiPath = '';
  let method = 'POST';
  let body = params;

  switch (toolName) {
    case 'buddy_register':
      apiPath = '/api/auth/register';
      if (agentToken) {
        method = 'POST';
        body = { agent_type: 'claude-code' };
      } else {
        body = { ...params, invite_code: params.invite_code || INVITE_CODE, agent_type: 'claude-code' };
      }
      break;
    case 'buddy_set_status':
      apiPath = '/api/agent/status';
      break;
    case 'buddy_send_emoji':
      apiPath = '/api/agent/emoji';
      break;
    case 'buddy_broadcast_emoji':
      apiPath = '/api/agent/emoji/broadcast';
      break;
    case 'buddy_list_user':
      apiPath = '/api/office/users';
      method = 'GET';
      break;
    case 'buddy_user':
      apiPath = '/api/agent/user';
      method = 'GET';
      break;
    case 'buddy_list_status':
      apiPath = '/api/office/statuses';
      method = 'GET';
      break;
    case 'buddy_list_emoji':
      apiPath = '/api/emojis';
      method = 'GET';
      break;
    case 'buddy_logout':
      apiPath = '/api/agent/logout';
      method = 'DELETE';
      break;
  }

  const fetchOpts: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'DELETE') {
    fetchOpts.body = JSON.stringify(body);
  }

  const res = await fetch(`${SERVER_URL}${apiPath}`, fetchOpts);
  const data = await res.json();

  if (toolName === 'buddy_register' && data.agent_token) {
    agentToken = data.agent_token;
    myUserId = data.user_id || '';
    myNickname = data.nickname || '';
    const officePath = `/w/${data.room_id || data.user_id || ''}`;
    console.error(`Buddy Office: ${data.nickname || ''} online — ${SERVER_URL}${officePath}`);
  }

  return data;
}

async function autoLogin() {
  if (!agentToken) return;
  try {
    const res = await fetch(`${SERVER_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`,
      },
      body: JSON.stringify({ agent_type: 'claude-code' }),
    });
    const data = await res.json();
    if (data.error) {
      console.error(`Auto-login failed: ${data.error}`);
      return;
    }
    myUserId = data.user_id || '';
    myNickname = data.nickname || '';
    const officePath = `/w/${data.room_id || data.user_id || ''}`;
    console.error(`Auto-login: ${data.nickname} at ${data.desk?.label} ${data.level_badge || ''}`);
    console.error(`Office URL: ${SERVER_URL}${officePath}`);

    await fetch(`${SERVER_URL}/api/agent/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`,
      },
      body: JSON.stringify({ status: 'working' }),
    });
  } catch (e) {
    console.error(`Auto-login failed: ${e}`);
  }
}

// WebSocket listener for user events
function connectEventStream() {
  if (!agentToken) return;

  const wsUrl = SERVER_URL.replace(/^http/, 'ws') + '/ws';
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.error(`Event stream connected`);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data));
          if (msg.type === 'user_join' && msg.user) {
            handleUserJoin(msg.user);
          } else if (msg.type === 'user_leave' && msg.user_id) {
            handleUserLeave(msg.user_id);
          } else if (msg.type === 'emoji' && msg.to === myUserId) {
            handleEmojiReceived(msg);
          }
        } catch {}
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    } catch {
      reconnectTimer = setTimeout(connect, 5000);
    }
  }

  connect();

  return () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}

async function handleUserJoin(user: any) {
  if (!AUTO_GREET || !agentToken || user.id === myUserId) return;
  try {
    await fetch(`${SERVER_URL}/api/agent/emoji`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentToken}`,
      },
      body: JSON.stringify({ target: user.nickname, emoji: 'wave' }),
    });
    console.error(`Auto-greet: waved at ${user.nickname}`);
  } catch {}
}

async function handleUserLeave(userId: string) {
  if (!NOTIFY_EVENTS || !agentToken) return;
  console.error(`User left: ${userId.slice(0, 8)}...`);
}

function handleEmojiReceived(msg: any) {
  const from = msg.from_nickname || msg.from?.slice(0, 8) || 'unknown';
  const emoji = msg.emoji || '';
  console.error(`[Buddy] ${from} sent you ${emoji}`);
}

// Auto-logout on process exit
async function logout() {
  if (!agentToken) return;
  try {
    await fetch(`${SERVER_URL}/api/agent/logout`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${agentToken}` },
    });
  } catch {}
}

async function main() {
  await autoLogin();

  // Heartbeat every 200s to keep online (TTL is 300s)
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let idleChecker: ReturnType<typeof setInterval> | null = null;
  let cleanupEvents: (() => void) | undefined;

  if (agentToken) {
    heartbeat = setInterval(async () => {
      try {
        await fetch(`${SERVER_URL}/api/agent/heartbeat`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${agentToken}` },
        });
      } catch {}
    }, 200_000);

    // Idle detection: check every 60s if buddy tools have been called recently
    if (IDLE_STATUS && IDLE_TIMEOUT > 0) {
      let currentStatus = 'working';
      idleChecker = setInterval(async () => {
        const idle = Date.now() - lastToolCallTime > IDLE_TIMEOUT;
        const newStatus = idle ? IDLE_STATUS : 'working';
        if (newStatus !== currentStatus) {
          currentStatus = newStatus;
          try {
            await fetch(`${SERVER_URL}/api/agent/status`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${agentToken}`,
              },
              body: JSON.stringify({ status: newStatus }),
            });
            console.error(`Status: ${newStatus} (idle: ${idle})`);
          } catch {}
        }
      }, 60_000);
    }

    // Connect WebSocket for event listening
    cleanupEvents = connectEventStream();

    // Cleanup on exit
    const cleanup = async () => {
      if (heartbeat) clearInterval(heartbeat);
      if (idleChecker) clearInterval(idleChecker);
      if (cleanupEvents) cleanupEvents();
      await logout();
      process.exit(0);
    };
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', () => { logout(); });

    // Detect parent process exit via stdin EOF (prevents orphaned processes)
    const onStdinClose = () => {
      console.error('stdin closed (parent exited), shutting down');
      cleanup();
    };
    process.stdin.on('end', onStdinClose);
    process.stdin.on('error', onStdinClose);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  const features = [
    AUTO_GREET ? 'auto-greet' : null,
    NOTIFY_EVENTS ? 'notify-events' : null,
    IDLE_STATUS ? `idle→${IDLE_STATUS}(${IDLE_TIMEOUT / 1000}s)` : 'no-idle',
  ].filter(Boolean).join(', ');
  console.error(`Buddy Office MCP Server running [${features}]`);
}

main().catch(console.error);
