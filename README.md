# Bookmarks Sync

一个 Chrome 浏览器插件，用于将书签数据同步到 GitHub Gists 或 Gitee Gists，实现多端书签同步。

## 功能特性

- 🔄 **双向同步**: 支持上传本地书签到 Gist，以及从 Gist 下载书签
- 📱 **多端同步**: 在不同设备上安装插件，即可同步书签
- 🌐 **双平台支持**: 支持 GitHub Gist 和 Gitee Gist 两种存储方式
- ⏰ **自动同步**: 支持设置自动同步间隔
- 🔒 **私有存储**: 书签数据存储在私有的 Gist 中，只有你能访问

## 安装步骤

### 1. 准备图标

由于当前图标是占位符，你需要替换为实际的 PNG 图标。可以使用以下方法之一：

- 在线工具: https://favicon.io/emoji-favicons/bookmark/
- 设计软件: Figma, Sketch, Adobe Illustrator
- 命令行工具:
  ```bash
  brew install imagemagick
  convert icons/icon16.svg icons/icon16.png
  convert icons/icon48.svg icons/icon48.png
  convert icons/icon128.svg icons/icon128.png
  ```

### 2. 加载插件

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `bookmarks_sync` 文件夹

### 3. 配置同步平台

1. 点击插件图标，然后点击「设置」按钮
2. 在设置页面选择同步平台：
   - **GitHub Gist**: 使用 GitHub 的代码片段功能
   - **Gitee Gist**: 使用 Gitee 的代码片段功能

### 4. 配置 GitHub Token（如选择 GitHub）

1. 在 GitHub 上创建 Personal Access Token:
   - 访问 https://github.com/settings/tokens
   - 点击「Generate new token」
   - 勾选 `gist` 权限
   - 复制生成的 Token
2. 在插件设置页面粘贴 Token 并保存

### 5. 配置 Gitee Token（如选择 Gitee）

1. 在 Gitee 上创建 Personal Access Token:
   - 访问 https://gitee.com/profile/personal_access_tokens
   - 点击「创建令牌」
   - 勾选 `gist` 权限
   - 复制生成的 Token
2. 在插件设置页面粘贴 Token 并保存

## 使用方法

### 首次使用

1. 配置好 Token 后，点击「同步书签」按钮
2. 插件会自动创建一个私有的 Gist 来存储书签数据

### 日常使用

- **同步书签**: 点击「同步书签」按钮，将本地书签上传到 Gist
- **上传到 Gist**: 手动上传当前书签
- **从 Gist 下载**: 从 Gist 下载书签到本地（会覆盖本地书签）

### 自动同步

在设置页面可以启用自动同步功能，设置同步间隔（30分钟到24小时）。

## 项目结构

```
bookmarks_sync/
├── manifest.json      # 插件配置文件
├── background.js      # 后台脚本，处理书签同步
├── gist.js            # GitHub Gist API 交互模块
├── popup.html         # 弹出页面 HTML
├── popup.js           # 弹出页面 JavaScript
├── options.html       # 设置页面 HTML
├── options.js         # 设置页面 JavaScript
├── styles.css         # 样式文件
├── icons/             # 图标目录
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # 说明文档
```

## 技术说明

- 使用 Chrome Extension Manifest V3
- 支持 GitHub Gist API 和 Gitee Gist API
- 书签数据以 JSON 格式存储
- 支持书签树结构的完整同步

## 注意事项

1. Token 仅存储在本地浏览器中，不会上传到任何服务器
2. Gist 默认为私有，只有你能访问
3. 下载书签时会覆盖本地书签，请谨慎操作
4. 建议定期备份重要书签
5. 切换同步平台时，需要重新配置 Token 并同步书签

## 许可证

MIT License
