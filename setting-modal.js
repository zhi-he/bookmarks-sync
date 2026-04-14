/**
 * 设置弹窗页面 JavaScript
 */

// DOM 元素
const syncPlatformRadios = document.querySelectorAll('input[name="syncPlatform"]');
const githubAuthGroup = document.getElementById('githubAuthGroup');
const giteeAuthGroup = document.getElementById('giteeAuthGroup');
const githubTokenInput = document.getElementById('githubToken');
const giteeTokenInput = document.getElementById('giteeToken');
const toggleGitHubTokenBtn = document.getElementById('toggleGitHubToken');
const toggleGiteeTokenBtn = document.getElementById('toggleGiteeToken');
const saveGitHubTokenBtn = document.getElementById('saveGitHubTokenBtn');
const saveGiteeTokenBtn = document.getElementById('saveGiteeTokenBtn');
const testGitHubTokenBtn = document.getElementById('testGitHubTokenBtn');
const testGiteeTokenBtn = document.getElementById('testGiteeTokenBtn');
const githubAuthStatus = document.getElementById('githubAuthStatus');
const giteeAuthStatus = document.getElementById('giteeAuthStatus');
const gistIdInput = document.getElementById('gistId');
const saveGistIdBtn = document.getElementById('saveGistIdBtn');
const deleteGistBtn = document.getElementById('deleteGistBtn');
const closeBtn = document.getElementById('closeBtn');
const message = document.getElementById('message');

// 初始化
async function init() {
  await loadSettings();
  await loadVersion();
  setupEventListeners();
}

// 加载版本号
async function loadVersion() {
  try {
    const manifest = chrome.runtime.getManifest();
    const versionElement = document.getElementById('version');
    if (versionElement) {
      versionElement.textContent = manifest.version;
    }
  } catch (error) {
    console.error('加载版本号失败:', error);
  }
}

// 获取当前选中的同步平台
function getSelectedPlatform() {
  for (const radio of syncPlatformRadios) {
    if (radio.checked) {
      return radio.value;
    }
  }
  return 'github';
}

// 加载设置
async function loadSettings() {
  try {
    // 加载同步平台
    const platformData = await chrome.storage.local.get('syncPlatform');
    const platform = platformData.syncPlatform || 'github';
    for (const radio of syncPlatformRadios) {
      radio.checked = radio.value === platform;
    }
    updateAuthGroupVisibility();

    // 加载 GitHub Token
    const githubTokenData = await chrome.storage.local.get('githubToken');
    if (githubTokenData.githubToken) {
      githubTokenInput.value = githubTokenData.githubToken;
    }

    // 加载 Gitee Token
    const giteeTokenData = await chrome.storage.local.get('giteeToken');
    if (giteeTokenData.giteeToken) {
      giteeTokenInput.value = giteeTokenData.giteeToken;
    }

    // 加载 Gist ID
    const gistIdData = await chrome.storage.local.get('gistId');
    gistIdInput.value = gistIdData.gistId || '-';

  } catch (error) {
    console.error('加载设置失败:', error);
    showMessage('加载设置失败', 'error');
  }
}

// 更新认证组可见性
function updateAuthGroupVisibility() {
  const platform = getSelectedPlatform();
  if (platform === 'github') {
    githubAuthGroup.style.display = 'block';
    giteeAuthGroup.style.display = 'none';
  } else {
    githubAuthGroup.style.display = 'none';
    giteeAuthGroup.style.display = 'block';
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 显示/隐藏 GitHub Token
  toggleGitHubTokenBtn.addEventListener('click', () => {
    if (githubTokenInput.type === 'password') {
      githubTokenInput.type = 'text';
      toggleGitHubTokenBtn.textContent = '🙈';
    } else {
      githubTokenInput.type = 'password';
      toggleGitHubTokenBtn.textContent = '👁';
    }
  });

  // 显示/隐藏 Gitee Token
  toggleGiteeTokenBtn.addEventListener('click', () => {
    if (giteeTokenInput.type === 'password') {
      giteeTokenInput.type = 'text';
      toggleGiteeTokenBtn.textContent = '🙈';
    } else {
      giteeTokenInput.type = 'password';
      toggleGiteeTokenBtn.textContent = '👁️ ';
    }
  });

  // 同步平台切换
  syncPlatformRadios.forEach(radio => {
    radio.addEventListener('change', async () => {
      await chrome.storage.local.set({ syncPlatform: radio.value });
      updateAuthGroupVisibility();
      showMessage(`已切换到 ${radio.value === 'github' ? 'GitHub' : 'Gitee'} 同步`, 'success');
    });
  });

  // 保存 GitHub Token
  saveGitHubTokenBtn.addEventListener('click', async () => {
    const token = githubTokenInput.value.trim();

    if (!token) {
      showMessage('请输入 GitHub Token', 'error');
      return;
    }

    saveGitHubTokenBtn.disabled = true;
    saveGitHubTokenBtn.textContent = '保存中...';

    try {
      await chrome.storage.local.set({ githubToken: token });
      showMessage('GitHub Token 保存成功', 'success');

      // 测试连接
      await testGitHubConnection(token);
    } catch (error) {
      showMessage(`保存失败: ${error.message}`, 'error');
    } finally {
      saveGitHubTokenBtn.disabled = false;
      saveGitHubTokenBtn.textContent = '保存 Token';
    }
  });

  // 测试 GitHub 连接
  testGitHubTokenBtn.addEventListener('click', async () => {
    const token = githubTokenInput.value.trim();

    if (!token) {
      showMessage('请输入 GitHub Token', 'error');
      return;
    }

    testGitHubTokenBtn.disabled = true;
    testGitHubTokenBtn.textContent = '测试中...';

    try {
      await testGitHubConnection(token);
    } finally {
      testGitHubTokenBtn.disabled = false;
      testGitHubTokenBtn.textContent = '测试连接';
    }
  });

  // 保存 Gitee Token
  saveGiteeTokenBtn.addEventListener('click', async () => {
    const token = giteeTokenInput.value.trim();

    if (!token) {
      showMessage('请输入 Gitee Token', 'error');
      return;
    }

    saveGiteeTokenBtn.disabled = true;
    saveGiteeTokenBtn.textContent = '保存中...';

    try {
      await chrome.storage.local.set({ giteeToken: token });
      showMessage('Gitee Token 保存成功', 'success');

      // 测试连接
      await testGiteeConnection(token);
    } catch (error) {
      showMessage(`保存失败: ${error.message}`, 'error');
    } finally {
      saveGiteeTokenBtn.disabled = false;
      saveGiteeTokenBtn.textContent = '保存 Token';
    }
  });

  // 测试 Gitee 连接
  testGiteeTokenBtn.addEventListener('click', async () => {
    const token = giteeTokenInput.value.trim();

    if (!token) {
      showMessage('请输入 Gitee Token', 'error');
      return;
    }

    testGiteeTokenBtn.disabled = true;
    testGiteeTokenBtn.textContent = '测试中...';

    try {
      await testGiteeConnection(token);
    } finally {
      testGiteeTokenBtn.disabled = false;
      testGiteeTokenBtn.textContent = '测试连接';
    }
  });

  // 保存 Gist ID
  saveGistIdBtn.addEventListener('click', async () => {
    const gistId = gistIdInput.value.trim();

    if (!gistId) {
      showMessage('请输入 Gist ID', 'error');
      return;
    }

    saveGistIdBtn.disabled = true;
    saveGistIdBtn.textContent = '保存中...';

    try {
      await chrome.storage.local.set({ gistId });
      showMessage('Gist ID 保存成功', 'success');
    } catch (error) {
      showMessage(`保存失败: ${error.message}`, 'error');
    } finally {
      saveGistIdBtn.disabled = false;
      saveGistIdBtn.textContent = '保存 Gist ID';
    }
  });

  // 删除 Gist
  deleteGistBtn.addEventListener('click', async () => {
    if (!confirm('确定要删除 Gist 吗？此操作不可恢复。')) {
      return;
    }

    deleteGistBtn.disabled = true;
    deleteGistBtn.textContent = '删除中...';

    try {
      const result = await sendMessage('deleteGist');

      if (result.success) {
        showMessage('Gist 已删除', 'success');
        gistIdInput.value = '';
      } else {
        showMessage('删除失败', 'error');
      }
    } catch (error) {
      showMessage(`删除失败: ${error.message}`, 'error');
    } finally {
      deleteGistBtn.disabled = false;
      deleteGistBtn.textContent = '删除 Gist';
    }
  });

  // 关闭按钮
  closeBtn.addEventListener('click', () => {
    // 尝试关闭窗口
    window.close();
    // 如果 window.close() 不起作用，尝试其他方法
    if (window.opener) {
      window.opener.focus();
    }
  });
}

// 测试 GitHub 连接
async function testGitHubConnection(token) {
  githubAuthStatus.textContent = '测试连接中...';
  githubAuthStatus.className = 'status-message info';

  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const user = await response.json();
      githubAuthStatus.textContent = `✅ 连接成功！用户: ${user.login}`;
      githubAuthStatus.className = 'status-message success';
      showMessage('GitHub 连接成功', 'success');
    } else {
      const error = await response.json();
      githubAuthStatus.textContent = `❌ 连接失败: ${error.message}`;
      githubAuthStatus.className = 'status-message error';
      showMessage(`GitHub 连接失败: ${error.message}`, 'error');
    }
  } catch (error) {
    githubAuthStatus.textContent = `❌ 连接失败: ${error.message}`;
    githubAuthStatus.className = 'status-message error';
    showMessage(`GitHub 连接失败: ${error.message}`, 'error');
  }
}

// 测试 Gitee 连接
async function testGiteeConnection(token) {
  giteeAuthStatus.textContent = '测试连接中...';
  giteeAuthStatus.className = 'status-message info';

  try {
    const response = await fetch('https://gitee.com/api/v5/user', {
      headers: {
        'Authorization': `token ${token}`
      }
    });

    if (response.ok) {
      const user = await response.json();
      giteeAuthStatus.textContent = `✅ 连接成功！用户: ${user.login}`;
      giteeAuthStatus.className = 'status-message success';
      showMessage('Gitee 连接成功', 'success');
    } else {
      const error = await response.json();
      giteeAuthStatus.textContent = `❌ 连接失败: ${error.message}`;
      giteeAuthStatus.className = 'status-message error';
      showMessage(`Gitee 连接失败: ${error.message}`, 'error');
    }
  } catch (error) {
    giteeAuthStatus.textContent = `❌ 连接失败: ${error.message}`;
    giteeAuthStatus.className = 'status-message error';
    showMessage(`Gitee 连接失败: ${error.message}`, 'error');
  }
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
function showMessage(text, type = 'info') {
  message.textContent = text;
  message.className = `message ${type}`;

  setTimeout(() => {
    message.textContent = '';
    message.className = 'message';
  }, 3000);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);
