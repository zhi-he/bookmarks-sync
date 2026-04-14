/**
 * 后台脚本 - 处理书签同步功能
 */

// 同步状态
let isSyncing = false;
let lastSyncTime = null;

// Gist API 配置
const GITHUB_API_BASE = 'https://api.github.com';
const GITEE_API_BASE = 'https://gitee.com/api/v5';
const GIST_FILENAME = 'bookmarks.json';

// Gist API 函数
async function getSyncPlatform() {
  const platform = await chrome.storage.local.get('syncPlatform');
  return platform.syncPlatform || 'github';
}

async function getGitHubToken() {
  const token = await chrome.storage.local.get('githubToken');
  return token.githubToken;
}

async function getGiteeToken() {
  const token = await chrome.storage.local.get('giteeToken');
  return token.giteeToken;
}

async function getGistId() {
  const gistId = await chrome.storage.local.get('gistId');
  return gistId.gistId;
}

async function setGistId(gistId) {
  await chrome.storage.local.set({ gistId });
}

async function createGist(bookmarksData) {
  const platform = await getSyncPlatform();
  if (platform === 'gitee') {
    return await createGiteeGist(bookmarksData);
  }
  return await createGitHubGist(bookmarksData);
}

async function createGitHubGist(bookmarksData) {
  const token = await getGitHubToken();
  if (!token) throw new Error('请先配置 GitHub Token');

  const response = await fetch(`${GITHUB_API_BASE}/gists`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: 'Chrome Bookmarks Sync',
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(bookmarksData, null, 2) } }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`创建 Gist 失败: ${error.message || response.statusText}`);
  }

  const gist = await response.json();
  await setGistId(gist.id);
  return gist;
}

async function createGiteeGist(bookmarksData) {
  const token = await getGiteeToken();
  if (!token) throw new Error('请先配置 Gitee Token');

  const response = await fetch(`${GITEE_API_BASE}/gists`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      description: 'Chrome Bookmarks Sync',
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(bookmarksData, null, 2) } }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`创建 Gist 失败: ${error.message || response.statusText}`);
  }

  const gist = await response.json();
  await setGistId(gist.id);
  return gist;
}

async function getGist() {
  const platform = await getSyncPlatform();
  const gistId = await getGistId();
  if (!gistId) throw new Error('请先同步书签以创建 Gist');

  if (platform === 'gitee') return await getGiteeGist(gistId);
  return await getGitHubGist(gistId);
}

async function getGitHubGist(gistId) {
  const token = await getGitHubToken();
  if (!token) throw new Error('请先配置 GitHub Token');

  const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`获取 Gist 失败: ${error.message || response.statusText}`);
  }

  return await response.json();
}

async function getGiteeGist(gistId) {
  const token = await getGiteeToken();
  if (!token) throw new Error('请先配置 Gitee Token');

  const response = await fetch(`${GITEE_API_BASE}/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`获取 Gist 失败: ${error.message || response.statusText}`);
  }

  return await response.json();
}

async function updateGist(bookmarksData) {
  const platform = await getSyncPlatform();
  const gistId = await getGistId();
  if (!gistId) throw new Error('请先同步书签以创建 Gist');

  if (platform === 'gitee') return await updateGiteeGist(gistId, bookmarksData);
  return await updateGitHubGist(gistId, bookmarksData);
}

async function updateGitHubGist(gistId, bookmarksData) {
  const token = await getGitHubToken();
  if (!token) throw new Error('请先配置 GitHub Token');

  const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(bookmarksData, null, 2) } }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`更新 Gist 失败: ${error.message || response.statusText}`);
  }

  return await response.json();
}

async function updateGiteeGist(gistId, bookmarksData) {
  const token = await getGiteeToken();
  if (!token) throw new Error('请先配置 Gitee Token');

  const response = await fetch(`${GITEE_API_BASE}/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: { [GIST_FILENAME]: { content: JSON.stringify(bookmarksData, null, 2) } }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`更新 Gist 失败: ${error.message || response.statusText}`);
  }

  return await response.json();
}

async function getBookmarksFromGist() {
  const gist = await getGist();
  const file = gist.files[GIST_FILENAME];
  if (!file) throw new Error('Gist 中未找到书签文件');
  return JSON.parse(file.content);
}

async function deleteGist() {
  const platform = await getSyncPlatform();
  const gistId = await getGistId();
  if (!gistId) return;

  if (platform === 'gitee') await deleteGiteeGist(gistId);
  else await deleteGitHubGist(gistId);
}

async function deleteGitHubGist(gistId) {
  const token = await getGitHubToken();
  if (!token) return;

  const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `token ${token}` }
  });

  if (response.ok) await chrome.storage.local.remove('gistId');
}

async function deleteGiteeGist(gistId) {
  const token = await getGiteeToken();
  if (!token) return;

  const response = await fetch(`${GITEE_API_BASE}/gists/${gistId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `token ${token}` }
  });

  if (response.ok) await chrome.storage.local.remove('gistId');
}

/**
 * 检查 Gist 是否存在（通过 API 检查，而不是只检查本地存储）
 * @returns {Promise<boolean>} Gist 是否存在
 */
async function gistExists() {
  try {
    // 先检查本地存储中是否有 gistId
    const gistId = await getGistId();
    if (gistId) {
      // 如果有 gistId，通过 API 检查 Gist 是否存在
      return await checkGistById(gistId);
    }

    // 如果没有 gistId，尝试通过 API 查找用户的 Gist
    return await findUserGist();
  } catch {
    return false;
  }
}

/**
 * 通过 ID 检查 Gist 是否存在
 * @param {string} gistId Gist ID
 * @returns {Promise<boolean>} Gist 是否存在
 */
async function checkGistById(gistId) {
  const platform = await getSyncPlatform();
  const token = platform === 'gitee' ? await getGiteeToken() : await getGitHubToken();

  if (!token) return false;

  const apiBase = platform === 'gitee' ? GITEE_API_BASE : GITHUB_API_BASE;

  try {
    const response = await fetch(`${apiBase}/gists/${gistId}`, {
      headers: { 'Authorization': `token ${token}` }
    });

    if (response.ok) {
      // Gist 存在，更新本地存储中的 gistId
      await setGistId(gistId);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 查找用户的 Gist（通过 API 搜索）
 * @returns {Promise<boolean>} 是否找到 Gist
 */
async function findUserGist() {
  const platform = await getSyncPlatform();
  const token = platform === 'gitee' ? await getGiteeToken() : await getGitHubToken();

  if (!token) return false;

  const apiBase = platform === 'gitee' ? GITEE_API_BASE : GITHUB_API_BASE;

  try {
    // GitHub: 搜索用户的 Gist
    if (platform === 'github') {
      const response = await fetch(`${apiBase}/gists?per_page=100`, {
        headers: { 'Authorization': `token ${token}` }
      });

      if (response.ok) {
        const gists = await response.json();
        const bookmarkGist = gists.find(g =>
          g.files && g.files[GIST_FILENAME] &&
          g.description === 'Chrome Bookmarks Sync'
        );

        if (bookmarkGist) {
          await setGistId(bookmarkGist.id);
          return true;
        }
      }
    } else {
      // Gitee: 搜索用户的 Gist
      const response = await fetch(`${apiBase}/gists?per_page=100`, {
        headers: { 'Authorization': `token ${token}` }
      });

      if (response.ok) {
        const gists = await response.json();
        const bookmarkGist = gists.find(g =>
          g.files && g.files[GIST_FILENAME] &&
          g.description === 'Chrome Bookmarks Sync'
        );

        if (bookmarkGist) {
          await setGistId(bookmarkGist.id);
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * 获取所有书签数据
 * @returns {Promise<Array>} 书签数据数组
 */
async function getAllBookmarks() {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((bookmarks) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(bookmarks);
    });
  });
}

/**
 * 将浏览器书签树转换为通用树形结构（不存储 ID）
 * 只处理书签栏中的书签，不处理 "其他书签" 文件夹和书签栏本身
 * @param {Array} bookmarks 浏览器书签树
 * @returns {Array} 通用树形结构
 */
function convertToTreeStructure(bookmarks) {
  const result = [];

  function traverse(nodes) {
    const children = [];

    for (const node of nodes) {
      // 跳过根节点（id: "0"）
      if (node.id === '0') {
        continue;
      }

      // 跳过 "其他书签" 文件夹（folderType 为 "other" 或 title 为 "其他书签"）
      if (node.folderType === 'other' || node.title === '其他书签' || node.title === 'Other Bookmarks') {
        continue;
      }

      // 跳过书签栏本身（folderType 为 "bookmarks-bar" 或 title 为 "书签栏"）
      if (node.folderType === 'bookmarks-bar' || node.title === '书签栏' || node.title === 'Bookmarks Bar') {
        // 只处理书签栏中的子节点，不处理书签栏本身
        if (node.children && node.children.length > 0) {
          const bookmarkBarChildren = traverse(node.children);
          result.push(...bookmarkBarChildren);
        }
        continue;
      }

      const bookmark = {
        title: node.title,
        url: node.url || null, // 文件夹的 url 为 null
        index: node.index
      };

      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        bookmark.children = traverse(node.children);
      }

      children.push(bookmark);
    }

    return children;
  }

  // 遍历根节点的子节点（书签栏、其他书签等）
  for (const rootNode of bookmarks) {
    if (rootNode.children) {
      traverse(rootNode.children);
    }
  }

  return result;
}

/**
 * 计算两个书签树结构的差异
 * @param {Array} localBookmarks 本地书签树
 * @param {Array} remoteBookmarks 远程书签树
 * @returns {Object} 差异信息
 */
function calculateBookmarksDiff(localBookmarks, remoteBookmarks) {
  // 将树结构转换为标题集合进行比较
  function getTitles(nodes) {
    const titles = new Set();
    for (const node of nodes) {
      titles.add(node.title);
      if (node.children && node.children.length > 0) {
        const childTitles = getTitles(node.children);
        childTitles.forEach(t => titles.add(t));
      }
    }
    return titles;
  }

  const localTitles = getTitles(localBookmarks);
  const remoteTitles = getTitles(remoteBookmarks);

  const added = [...localTitles].filter(t => !remoteTitles.has(t));
  const removed = [...remoteTitles].filter(t => !localTitles.has(t));

  return {
    added: added.length,
    removed: removed.length,
    total: added.length + removed.length
  };
}

/**
 * 计算两个书签数组的差异
 * @param {Array} localBookmarks 本地书签
 * @param {Array} remoteBookmarks 远程书签
 * @returns {Object} 差异信息
 */
function calculateBookmarksDiff(localBookmarks, remoteBookmarks) {
  const localSet = new Set(localBookmarks.map(b => b.title));
  const remoteSet = new Set(remoteBookmarks.map(b => b.title));

  const added = localBookmarks.filter(b => !remoteSet.has(b.title));
  const removed = remoteBookmarks.filter(b => !localSet.has(b.title));

  return {
    added: added.length,
    removed: removed.length,
    total: added.length + removed.length
  };
}

/**
 * 上传书签到 Gist（增加 diff 检查，超过 5 个变动后需要确认）
 * @returns {Promise<Object>} 同步结果
 */
async function uploadBookmarks() {
  try {
    const bookmarks = await getAllBookmarks();
    const treeBookmarks = convertToTreeStructure(bookmarks);

    // 检查 Gist 是否存在
    const exists = await gistExists();

    // 如果 Gist 存在，计算差异
    if (exists) {
      const remoteBookmarks = await getBookmarksFromGist();
      const diff = calculateBookmarksDiff(treeBookmarks, remoteBookmarks);

      // 如果差异超过 5 个，返回需要确认的结果
      if (diff.total > 5) {
        return {
          success: false,
          needsConfirmation: true,
          message: `检测到 ${diff.total} 个变动（新增 ${diff.added} 个，删除 ${diff.removed} 个），请确认是否继续上传`,
          diff: diff
        };
      }
    }

    let gist;
    if (exists) {
      gist = await updateGist(treeBookmarks);
    } else {
      gist = await createGist(treeBookmarks);
    }

    lastSyncTime = Date.now();
    await chrome.storage.local.set({ lastSyncTime });

    return {
      success: true,
      message: exists ? '书签已更新到现有 Gist' : '书签已上传到新 Gist',
      gistId: gist.id,
      timestamp: lastSyncTime
    };
  } catch (error) {
    return {
      success: false,
      message: `上传失败: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * 上传书签到 Gist（跳过 diff 检查，用于用户确认后）
 * @returns {Promise<Object>} 同步结果
 */
async function uploadBookmarksConfirmed() {
  try {
    const bookmarks = await getAllBookmarks();
    const treeBookmarks = convertToTreeStructure(bookmarks);

    // 检查 Gist 是否存在
    const exists = await gistExists();

    let gist;
    if (exists) {
      gist = await updateGist(treeBookmarks);
    } else {
      gist = await createGist(treeBookmarks);
    }

    lastSyncTime = Date.now();
    await chrome.storage.local.set({ lastSyncTime });

    return {
      success: true,
      message: exists ? '书签已更新到现有 Gist' : '书签已上传到新 Gist',
      gistId: gist.id,
      timestamp: lastSyncTime
    };
  } catch (error) {
    return {
      success: false,
      message: `上传失败: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * 删除书签栏中的所有书签（只删除子节点，不删除书签栏本身）
 * @returns {Promise<void>}
 */
async function clearBookmarkBar() {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((bookmarks) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      // 找到书签栏节点
      let bookmarkBarId = null;
      for (const rootNode of bookmarks) {
        if (rootNode.children) {
          for (const childNode of rootNode.children) {
            if (childNode.folderType === 'bookmarks-bar' ||
                childNode.title === '书签栏' ||
                childNode.title === 'Bookmarks Bar' ||
                childNode.id === '1') {
              bookmarkBarId = childNode.id;
              break;
            }
          }
        }
        if (bookmarkBarId) break;
      }

      if (bookmarkBarId) {
        // 获取书签栏中的所有子节点
        chrome.bookmarks.getChildren(bookmarkBarId, (children) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }

          // 删除所有子节点
          const promises = children.map(child => {
            return new Promise((childResolve, childReject) => {
              chrome.bookmarks.removeTree(child.id, () => {
                if (chrome.runtime.lastError) {
                  childReject(chrome.runtime.lastError);
                } else {
                  childResolve();
                }
              });
            });
          });

          Promise.all(promises).then(() => {
            resolve();
          }).catch(reject);
        });
      } else {
        resolve();
      }
    });
  });
}

/**
 * 从 Gist 下载书签（覆盖模式：删除本地书签，导入 Gist 中的书签）
 * @returns {Promise<Object>} 同步结果
 */
async function downloadBookmarks() {
  try {
    const bookmarksData = await getBookmarksFromGist();

    // 删除本地书签栏中的所有书签
    await clearBookmarkBar();

    // 导入 Gist 中的书签（直接使用树形结构）
    if (bookmarksData.length > 0) {
      await importBookmarks(bookmarksData);
    }

    lastSyncTime = Date.now();
    await chrome.storage.local.set({ lastSyncTime });

    return {
      success: true,
      message: `书签下载成功，共 ${bookmarksData.length} 个书签`,
      timestamp: lastSyncTime,
      totalCount: bookmarksData.length
    };
  } catch (error) {
    return {
      success: false,
      message: `下载失败: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * 导入书签到浏览器
 * @param {Array} bookmarks 书签数据（树结构）
 */
async function importBookmarks(bookmarks) {
  // 获取书签栏 ID
  const bookmarkBarId = await getBookmarkBarId();

  // 递归导入书签
  for (const bookmark of bookmarks) {
    await createBookmarkNode(bookmark, bookmarkBarId);
  }
}

/**
 * 获取书签栏的 ID
 * @returns {Promise<string>} 书签栏的 ID
 */
async function getBookmarkBarId() {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((bookmarks) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      // 书签树的结构是：根节点 -> [书签栏, 其他书签, ...]
      // 我们需要找到书签栏节点（folderType 为 "bookmarks-bar" 或 title 为 "书签栏"）
      for (const rootNode of bookmarks) {
        if (rootNode.children) {
          for (const childNode of rootNode.children) {
            if (childNode.folderType === 'bookmarks-bar' ||
                childNode.title === '书签栏' ||
                childNode.title === 'Bookmarks Bar' ||
                childNode.id === '1') {
              resolve(childNode.id);
              return;
            }
          }
        }
      }
      // 如果找不到，返回 undefined，让书签创建在 "Other Bookmarks" 文件夹中
      resolve(undefined);
    });
  });
}

/**
 * 创建书签节点
 * @param {Object} bookmark 书签数据（树结构）
 * @param {string} parentId 父节点的 ID
 */
async function createBookmarkNode(bookmark, parentId = null) {
  const options = {
    title: bookmark.title
  };

  if (parentId !== null && parentId !== undefined) {
    options.parentId = parentId;
  }

  if (bookmark.url) {
    options.url = bookmark.url;
  }

  // 使用 Promise 包装 chrome.bookmarks.create
  const createdBookmark = await new Promise((resolve, reject) => {
    chrome.bookmarks.create(options, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve(result);
    });
  });

  // 递归创建子节点
  if (bookmark.children && bookmark.children.length > 0) {
    const promises = bookmark.children.map(async (child) => {
      await createBookmarkNode(child, createdBookmark.id);
    });
    await Promise.all(promises);
  }

  return createdBookmark;
}

/**
 * 书签变化时触发同步
 */
async function onBookmarkChanged(id, change) {
  // 书签变化时立即上传
  await uploadBookmarks();
}

// 监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'upload':
      // 如果用户确认上传，则跳过 diff 检查
      if (request.confirm) {
        uploadBookmarksConfirmed().then(sendResponse);
      } else {
        uploadBookmarks().then(sendResponse);
      }
      return true;

    case 'download':
      downloadBookmarks().then(sendResponse);
      return true;

    case 'getStatus':
      const status = {
        isSyncing,
        lastSyncTime,
        gistExists: async () => await gistExists()
      };
      sendResponse(status);
      return true;

    case 'getBookmarks':
      getAllBookmarks().then(sendResponse);
      return true;

    case 'deleteGist':
      deleteGist().then(() => sendResponse({ success: true }));
      return true;

    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// 监听书签变化事件
chrome.bookmarks.onChanged.addListener(onBookmarkChanged);

// 浏览器启动时检查同步
chrome.runtime.onStartup.addListener(async () => {
  // 只在 Gist 存在时才同步
  if (await gistExists()) {
    await uploadBookmarks();
  }
});

// 浏览器唤醒时检查同步
chrome.runtime.onSuspend.addListener(async () => {
  // 浏览器即将休眠时同步
  if (await gistExists()) {
    await uploadBookmarks();
  }
});
