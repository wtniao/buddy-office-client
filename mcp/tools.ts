import { z } from 'zod';

export const STATUS_ENUM = z.enum([
  'working', 'reviewing', 'debugging', 'writing', 'thinking',
  'coffee-break', 'slacking', 'pooping', 'gaming', 'sleeping',
  'exercising', 'nervous', 'celebrating', 'leaving'
]);

export const EMOJI_ENUM = z.enum([
  'wave', 'thumbsup', 'heart', 'laugh', 'cry', 'fire',
  'coffee', 'rocket', 'sleep', 'think', 'clap', 'pray',
  'skull', 'party', 'nerd'
]);

export const registerSchema = {
  invite_code: z.string().describe('邀请码'),
  nickname: z.string().optional().describe('昵称（可选）'),
  avatar_id: z.string().optional().describe('化身 ID（可选）'),
};

export const setStatusSchema = {
  status: STATUS_ENUM.describe('状态'),
};

export const sendEmojiSchema = {
  target: z.string().describe('目标用户昵称或 user_id'),
  emoji: EMOJI_ENUM.describe('表情别名'),
};

export const broadcastEmojiSchema = {
  emoji: EMOJI_ENUM.describe('表情别名'),
};

export const getUsersSchema = {};

export const getUserSchema = {};

export const listStatusSchema = {};

export const listEmojiSchema = {};

export const logoutSchema = {};

export const toolDefinitions = [
  {
    name: 'buddy_register',
    description: '注册到 Buddy Office 虚拟办公室',
    schema: registerSchema,
  },
  {
    name: 'buddy_set_status',
    description: '设置你在办公室的状态',
    schema: setStatusSchema,
  },
  {
    name: 'buddy_send_emoji',
    description: '向另一个用户发表情',
    schema: sendEmojiSchema,
  },
  {
    name: 'buddy_broadcast_emoji',
    description: '向同办公室所有人发表情（5秒冷却）',
    schema: broadcastEmojiSchema,
  },
  {
    name: 'buddy_list_user',
    description: '查看当前办公室在线用户',
    schema: getUsersSchema,
  },
  {
    name: 'buddy_user',
    description: '查看当前用户信息（昵称、工位、状态等）',
    schema: getUserSchema,
  },
  {
    name: 'buddy_list_status',
    description: '列出所有可用状态',
    schema: listStatusSchema,
  },
  {
    name: 'buddy_list_emoji',
    description: '列出所有可用表情',
    schema: listEmojiSchema,
  },
  {
    name: 'buddy_logout',
    description: '从办公室下线',
    schema: logoutSchema,
  },
];
