/**
 * Simple JSON-based Database for Group Settings
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

const DB_PATH = path.join(__dirname, 'database');
const GROUPS_DB = path.join(DB_PATH, 'groups.json');
const USERS_DB = path.join(DB_PATH, 'users.json');
const WARNINGS_DB = path.join(DB_PATH, 'warnings.json');
const MODS_DB = path.join(DB_PATH, 'mods.json');
const ANTIGROUP_DB = path.join(DB_PATH, 'antigroup.json');

// Initialize database directory
if (!fs.existsSync(DB_PATH)) {
  fs.mkdirSync(DB_PATH, { recursive: true });
}

// Initialize database files
const initDB = (filePath, defaultData = {}) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initDB(GROUPS_DB, {});
initDB(USERS_DB, {});
initDB(WARNINGS_DB, {});
initDB(MODS_DB, { moderators: [] });
initDB(ANTIGROUP_DB, { blockedGroups: {} });

// Read database
const readDB = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading database: ${error.message}`);
    return {};
  }
};

// Write database
const writeDB = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing database: ${error.message}`);
    return false;
  }
};

// Group Settings
const getGroupSettings = (groupId) => {
  const groups = readDB(GROUPS_DB);
  if (!groups[groupId]) {
    groups[groupId] = { ...config.defaultGroupSettings };
    writeDB(GROUPS_DB, groups);
  }
  return groups[groupId];
};

const updateGroupSettings = (groupId, settings) => {
  const groups = readDB(GROUPS_DB);
  groups[groupId] = { ...groups[groupId], ...settings };
  return writeDB(GROUPS_DB, groups);
};

// User Data
const getUser = (userId) => {
  const users = readDB(USERS_DB);
  if (!users[userId]) {
    users[userId] = {
      registered: Date.now(),
      premium: false,
      banned: false
    };
    writeDB(USERS_DB, users);
  }
  return users[userId];
};

const updateUser = (userId, data) => {
  const users = readDB(USERS_DB);
  users[userId] = { ...users[userId], ...data };
  return writeDB(USERS_DB, users);
};

// Warnings System
const getWarnings = (groupId, userId) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;
  return warnings[key] || { count: 0, warnings: [] };
};

const addWarning = (groupId, userId, reason) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;
  
  if (!warnings[key]) {
    warnings[key] = { count: 0, warnings: [] };
  }
  
  warnings[key].count++;
  warnings[key].warnings.push({
    reason,
    date: Date.now()
  });
  
  writeDB(WARNINGS_DB, warnings);
  return warnings[key];
};

const removeWarning = (groupId, userId) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;
  
  if (warnings[key] && warnings[key].count > 0) {
    warnings[key].count--;
    warnings[key].warnings.pop();
    writeDB(WARNINGS_DB, warnings);
    return true;
  }
  return false;
};

const clearWarnings = (groupId, userId) => {
  const warnings = readDB(WARNINGS_DB);
  const key = `${groupId}_${userId}`;
  delete warnings[key];
  return writeDB(WARNINGS_DB, warnings);
};

// Moderators System
const getModerators = () => {
  const mods = readDB(MODS_DB);
  return mods.moderators || [];
};

const addModerator = (userId) => {
  const mods = readDB(MODS_DB);
  if (!mods.moderators) mods.moderators = [];
  if (!mods.moderators.includes(userId)) {
    mods.moderators.push(userId);
    return writeDB(MODS_DB, mods);
  }
  return false;
};

const removeModerator = (userId) => {
  const mods = readDB(MODS_DB);
  if (mods.moderators) {
    mods.moderators = mods.moderators.filter(id => id !== userId);
    return writeDB(MODS_DB, mods);
  }
  return false;
};

const isModerator = (userId) => {
  const mods = getModerators();
  return mods.includes(userId);
};

// ==========================================
// Antigroup / Blocked Groups System
// ==========================================

const normalizeGroupJid = (groupId) => {
  if (!groupId) return null;
  let id = String(groupId).trim();
  if (!id.includes('@')) {
    id = `${id}@g.us`;
  }
  return id;
};

const getBlockedGroups = () => {
  const data = readDB(ANTIGROUP_DB);
  let map = {};

  if (Array.isArray(data)) {
    data.forEach(item => {
      if (typeof item === 'string') {
        const jid = normalizeGroupJid(item);
        if (jid) map[jid] = { jid, name: '', reason: 'Manual entry', blockedAt: Date.now(), blockedBy: 'config' };
      } else if (item && item.jid) {
        const jid = normalizeGroupJid(item.jid);
        if (jid) map[jid] = { ...item, jid };
      }
    });
  } else if (data && typeof data === 'object') {
    if (data.blockedGroups && typeof data.blockedGroups === 'object' && !Array.isArray(data.blockedGroups)) {
      map = { ...data.blockedGroups };
    } else if (data.blockedGroups && Array.isArray(data.blockedGroups)) {
      data.blockedGroups.forEach(item => {
        if (typeof item === 'string') {
          const jid = normalizeGroupJid(item);
          if (jid) map[jid] = { jid, name: '', reason: 'Manual entry', blockedAt: Date.now(), blockedBy: 'config' };
        } else if (item && item.jid) {
          const jid = normalizeGroupJid(item.jid);
          if (jid) map[jid] = { ...item, jid };
        }
      });
    } else {
      Object.entries(data).forEach(([key, val]) => {
        if (key.endsWith('@g.us') || /^\d+$/.test(key)) {
          const jid = normalizeGroupJid(key);
          if (jid) {
            map[jid] = (typeof val === 'object' && val !== null)
              ? { ...val, jid }
              : { jid, name: '', reason: 'Manual entry', blockedAt: Date.now(), blockedBy: 'config' };
          }
        }
      });
    }
  }

  // Also include any hardcoded blocked groups from config.js
  try {
    delete require.cache[require.resolve('./config')];
    const liveConfig = require('./config');
    if (Array.isArray(liveConfig.blockedGroups)) {
      liveConfig.blockedGroups.forEach(bg => {
        const jid = normalizeGroupJid(bg);
        if (jid && !map[jid]) {
          map[jid] = { jid, name: '', reason: 'Config blacklist', blockedAt: Date.now(), blockedBy: 'config' };
        }
      });
    }
  } catch (e) {
    // Continue if config cannot be read
  }

  return map;
};

const isGroupBlocked = (groupId) => {
  if (!groupId) return false;
  const jid = normalizeGroupJid(groupId);
  if (!jid) return false;

  const blockedMap = getBlockedGroups();
  return Boolean(blockedMap[jid]);
};

const blockGroup = (groupId, options = {}) => {
  const jid = normalizeGroupJid(groupId);
  if (!jid) return false;

  let rawData = readDB(ANTIGROUP_DB);
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    rawData = { blockedGroups: {} };
  }
  if (!rawData.blockedGroups || typeof rawData.blockedGroups !== 'object' || Array.isArray(rawData.blockedGroups)) {
    rawData.blockedGroups = {};
  }

  rawData.blockedGroups[jid] = {
    jid,
    name: options.name || '',
    reason: options.reason || 'Blocked by owner',
    blockedAt: Date.now(),
    blockedBy: options.blockedBy || 'owner'
  };

  return writeDB(ANTIGROUP_DB, rawData);
};

const unblockGroup = (groupId) => {
  const jid = normalizeGroupJid(groupId);
  if (!jid) return false;

  let rawData = readDB(ANTIGROUP_DB);
  if (!rawData || typeof rawData !== 'object') return false;

  let modified = false;
  if (Array.isArray(rawData)) {
    const prevLen = rawData.length;
    rawData = rawData.filter(item => {
      const itemJid = typeof item === 'string' ? normalizeGroupJid(item) : normalizeGroupJid(item?.jid);
      return itemJid !== jid;
    });
    if (rawData.length !== prevLen) {
      writeDB(ANTIGROUP_DB, rawData);
      return true;
    }
    return false;
  }

  if (rawData.blockedGroups && typeof rawData.blockedGroups === 'object') {
    if (rawData.blockedGroups[jid]) {
      delete rawData.blockedGroups[jid];
      modified = true;
    }
  }

  if (rawData[jid]) {
    delete rawData[jid];
    modified = true;
  }

  if (modified) {
    writeDB(ANTIGROUP_DB, rawData);
    return true;
  }

  return false;
};

const getBlockedGroupsList = () => {
  const map = getBlockedGroups();
  return Object.values(map);
};

module.exports = {
  getGroupSettings,
  updateGroupSettings,
  getUser,
  updateUser,
  getWarnings,
  addWarning,
  removeWarning,
  clearWarnings,
  getModerators,
  addModerator,
  removeModerator,
  isModerator,
  getBlockedGroups,
  isGroupBlocked,
  blockGroup,
  unblockGroup,
  getBlockedGroupsList
};
