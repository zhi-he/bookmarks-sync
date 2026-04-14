/**
 * Popup 页面 JavaScript
 */

// DOM 元素
const syncStatus = document.getElementById('syncStatus');
const lastSyncTime = document.getElementById('lastSyncTime');
const gistStatus = document.getElementById('gistStatus');
const localBookmarkCount = document.getElementById('localBookmarkCount');
const remoteBookmarkCount = document.getElementById('remoteBookmarkCount');
const gistId = document.getElementById('gistId');
const message = document.getElementById('message');
const uploadBtn = document.getElementById('uploadBtn');
const downloadBtn = document.getElementById('downloadBtn');
const settingsBtn = document.getElementById('settingsBtn');

// 初始化
async function init() {
  await updateStatus();
  await updateBookmarkCount();
  setupEventListeners();
}

// 更新状态显示
async function updateStatus() {
  try {
    const response = await sendMessage('getStatus');

    // 更新同步状态
    syncStatus.textContent = response.isSyncing ? '同步中...' : '就绪';
    syncStatus.className = `status-badge ${response.isSyncing ? 'syncing' : 'ready'}`;

    // 更新上次同步时间
    if (response.lastSyncTime) {
      const date = new Date(response.lastSyncTime);
      lastSyncTime.textContent = formatDate(date);
    } else {
      lastSyncTime.textContent = '从未';
    }

    // 更新 Gist 状态 - 直接调用 gistExists 函数
    const exists = await gistExists();
    gistStatus.textContent = exists ? '已创建' : '未创建';
    gistStatus.className = `status-badge ${exists ? 'success' : 'pending'}`;

    // 获取 Gist ID
    const gistIdData = await chrome.storage.local.get('gistId');
    gistId.textContent = gistIdData.gistId || '-';

  } catch (error) {
    console.error('更新状态失败:', error);
    showMessage('获取状态失败', 'error');
  }
}

// 检查 Gist 是否存在
async function gistExists() {
  try {
    const gistId = await chrome.storage.local.get('gistId');
    if (!gistId.gistId) {
      return false;
    }

    const platform = await chrome.storage.local.get('syncPlatform');
    const token = platform.syncPlatform === 'gitee'
      ? await chrome.storage.local.get('giteeToken')
      : await chrome.storage.local.get('githubToken');

    if (!token.githubToken && !token.giteeToken) {
      return false;
    }

    const apiBase = platform.syncPlatform === 'gitee'
      ? 'https://gitee.com/api/v5/gists'
      : 'https://api.github.com/gists';

    const response = await fetch(`${apiBase}/${gistId.gistId}`, {
      headers: {
        'Authorization': `token ${token.githubToken || token.giteeToken}`
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

// 更新书签数量
async function updateBookmarkCount() {
  try {
    // 获取本地书签数量
    const bookmarks = await sendMessage('getBookmarks');
    const localCount = countBookmarks(bookmarks);
    localBookmarkCount.textContent = localCount;

    // 获取远程书签数量
    await updateRemoteBookmarkCount();
  } catch (error) {
    console.error('获取书签数量失败:', error);
    localBookmarkCount.textContent = '-';
  }
}

// 更新远程书签数量
async function updateRemoteBookmarkCount() {
  try {
    const gistIdData = await chrome.storage.local.get('gistId');
    if (!gistIdData.gistId) {
      remoteBookmarkCount.textContent = '-';
      return;
    }

    const platform = await chrome.storage.local.get('syncPlatform');
    const token = platform.syncPlatform === 'gitee'
      ? await chrome.storage.local.get('giteeToken')
      : await chrome.storage.local.get('githubToken');

    if (!token.githubToken && !token.giteeToken) {
      remoteBookmarkCount.textContent = '-';
      return;
    }

    const apiBase = platform.syncPlatform === 'gitee'
      ? 'https://gitee.com/api/v5/gists'
      : 'https://api.github.com/gists';

    const response = await fetch(`${apiBase}/${gistIdData.gistId}`, {
      headers: {
        'Authorization': `token ${token.githubToken || token.giteeToken}`
      }
    });

    if (response.ok) {
      const gist = await response.json();
      const file = gist.files['bookmarks.json'];
      if (file) {
        const bookmarksData = JSON.parse(file.content);
        const remoteCount = countTreeBookmarks(bookmarksData);
        remoteBookmarkCount.textContent = remoteCount;
      } else {
        remoteBookmarkCount.textContent = '-';
      }
    } else {
      remoteBookmarkCount.textContent = '-';
    }
  } catch (error) {
    console.error('获取远程书签数量失败:', error);
    remoteBookmarkCount.textContent = '-';
  }
}

// 计算树形结构书签数量
function countTreeBookmarks(bookmarks) {
  let count = 0;

  function traverse(nodes) {
    for (const node of nodes) {
      if (node.url) {
        count++;
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(bookmarks);
  return count;
}

// 计算书签数量
function countBookmarks(bookmarks) {
  let count = 0;

  function traverse(nodes) {
    for (const node of nodes) {
      if (node.url) {
        count++;
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(bookmarks);
  return count;
}

// 发送消息到后台脚本
function sendMessage(action, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

// 显示消息
function showMessage(text, type = 'info', ms) {
  message.textContent = text;
  message.className = `message ${type}`;

  setTimeout(() => {
    message.textContent = '';
    message.className = 'message';
  }, ms || 3000);
}

// 格式化日期
function formatDate(date) {
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)} 小时前`;
  } else {
    return date.toLocaleDateString('zh-CN');
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 上传按钮
  uploadBtn.addEventListener('click', async () => {
    uploadBtn.disabled = true;
    uploadBtn.textContent = '上传中...';

    try {
      const result = await sendMessage('upload');

      // 如果需要确认
      if (result.needsConfirmation) {
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<span class="btn-icon">⬆️</span> 上传到 Gist';
        
        if (confirm(result.message)) {
          // 用户确认，执行上传
          uploadBtn.disabled = true;
          uploadBtn.textContent = '上传中...';
          
          const confirmResult = await sendMessage('upload', { confirm: true });
          
          if (confirmResult.success) {
            showMessage(confirmResult.message, 'success');
            await updateStatus();
          } else {
            showMessage(confirmResult.message, 'error');
          }
        } else {
          showMessage('已取消上传', 'info');
        }
        return;
      }

      if (result.success) {
        showMessage(result.message, 'success');
        await updateStatus();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage(`上传失败: ${error.message}`, 'error');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = '<span class="btn-icon">⬆️</span> 上传到 Gist';
    }
  });

  // 下载按钮
  downloadBtn.addEventListener('click', async () => {
    if (!confirm('确定要从 Gist 下载书签吗？这将覆盖本地书签。')) {
      return;
    }

    downloadBtn.disabled = true;
    downloadBtn.textContent = '下载中...';

    try {
      const result = await sendMessage('download');
      if (result.success) {
        showMessage(result.message, 'success');
        await updateStatus();
        await updateBookmarkCount();
      } else {
        showMessage(JSON.stringify(result), 'error', 10000);
      }
    } catch (error) {
      showMessage(`下载失败: ${error.message}`, 'error');
    } finally {
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = '<span class="btn-icon">⬇️</span> 从 Gist 下载';
    }
  });

  // 设置按钮 - 通过浏览器弹窗显示设置页面（不影响当前浏览页面）
  settingsBtn.addEventListener('click', () => {
    // 获取当前窗口尺寸
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;

    // 设置弹窗尺寸
    const popupWidth = 500;
    const popupHeight = 600;

    // 计算居中位置
    const left = (screenWidth - popupWidth) / 2;
    const top = (screenHeight - popupHeight) / 2;

    // 打开设置弹窗（使用 settings-modal.html 页面）
    const popupWindow = window.open(
      chrome.runtime.getURL('settings-modal.html'),
      'bookmarksSyncSettings',
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
    );

    // 如果弹窗被阻止，则使用默认方式打开
    if (!popupWindow || popupWindow.closed || typeof popupWindow.closed == 'undefined') {
      chrome.runtime.openOptionsPage();
    }
  });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);

// 页面可见时更新状态
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateStatus();
    updateBookmarkCount();
  }
});
