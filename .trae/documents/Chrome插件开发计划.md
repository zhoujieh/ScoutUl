# Chrome UI元素测量插件开发计划

## 1. 插件概述

开发一个Chrome扩展程序，用于测量网页UI元素的布局、间距以及页面内容的属性（文字大小、颜色、图标大小等）。类似Figma的"Inspect"功能或Chrome DevTools的Elements面板，但提供更直观、更专注于测量的用户体验。

## 2. 核心功能

### 2.1 元素选择与高亮
- 点击页面任意元素进行选中
- 选中的元素显示高亮边框
- 显示元素标签名和类名信息

### 2.2 布局与间距测量
- 元素宽度、高度
- 外边距（margin）
- 内边距（padding）
- 边框宽度（border）
- 元素之间的间距
- 元素相对于视口的位置

### 2.3 内容属性测量
- 字体大小、字体family、字体粗细
- 文字颜色（支持HEX、RGB、HSL格式）
- 背景颜色
- 图标/图片尺寸
- 行高（line-height）
- 不透明度

### 2.4 测量工具
- 标尺工具：手动测量任意两点之间的距离
- 颜色拾取器：获取页面任意点的颜色值

### 2.5 测量结果展示
- 悬浮面板显示测量数据
- 视觉化的尺寸标注（类似设计工具）
- 支持复制测量值到剪贴板

### 2.6 快捷键支持
- 快捷键快速激活测量模式
- ESC退出测量模式

## 3. 技术实现方案

### 3.1 Chrome扩展API
- `chrome.runtime` - 插件生命周期管理
- `chrome.devtools` - DevTools页面集成
- `chrome.tabs` - 标签页操作
- `chrome.contextMenus` - 右键菜单
- `chrome.storage` - 设置存储

### 3.2 核心文件结构
```
measure-plugin/
├── manifest.json          # 插件配置文件
├── popup.html/popup.js    # 弹出窗口
├── devtools.html         # DevTools页面
├── devtools.js            # DevTools脚本
├── content.js             # 内容脚本（注入到页面）
├── background.js          # 后台脚本
├── styles/
│   ├── overlay.css        # 高亮覆盖层样式
│   └── panel.css          # 测量面板样式
├── lib/
│   └── ruler.js           # 标尺工具逻辑
└── icons/                 # 插件图标
```

### 3.3 关键技术点

#### 内容脚本（content.js）
- 监听鼠标移动和点击事件
- 使用`getBoundingClientRect()`获取元素尺寸
- 使用`getComputedStyle()`获取元素样式
- 创建DOM覆盖层显示高亮和测量信息
- 使用Shadow DOM隔离样式

#### 消息传递
- content.js ↔ background.js：存储设置、历史记录
- content.js ↔ popup.js：实时测量数据同步

#### 样式计算
- 将计算样式转换为可读格式
- 支持rem → px转换显示
- 颜色值统一转换显示

## 4. 实现步骤

### 第一阶段：基础框架搭建
1. 创建`manifest.json`，配置插件基本信息和权限
2. 实现基础的popup界面（开启/关闭测量）
3. 注入content script到目标页面

### 第二阶段：元素选择与高亮
1. 实现鼠标悬停元素高亮效果
2. 实现点击选中元素
3. 创建覆盖层显示元素信息

### 第三阶段：测量功能
1. 解析并显示元素的尺寸数据
2. 解析并显示元素的样式属性
3. 实现间距测量标注

### 第四阶段：高级工具
1. 实现标尺工具
2. 实现颜色拾取器
3. 添加快捷键支持

### 第五阶段：优化与完善
1. 添加复制功能
2. 优化UI/UX
3. 修复bug和性能优化

## 5. 用户交互流程

1. 用户点击插件图标或使用快捷键激活测量模式
2. 鼠标悬停在任意元素上，显示高亮边框
3. 点击选中元素，弹出测量面板
4. 面板显示：尺寸、间距、字体、颜色等详细信息
5. 使用标尺工具可手动测量任意两点
6. 使用颜色拾取器获取任意点颜色
7. 点击复制按钮复制需要的数值

## 6. 预计文件清单

| 文件 | 说明 |
|------|------|
| manifest.json | 插件配置 |
| popup.html | 弹出窗口HTML |
| popup.js | 弹出窗口逻辑 |
| content.js | 页面注入脚本 |
| background.js | 后台脚本 |
| overlay.js | 覆盖层管理 |
| measurement.js | 测量逻辑 |
| styles.css | 基础样式 |
| overlay.css | 覆盖层样式 |
