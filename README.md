# PDF工具箱 - PDF Splitter & Merger

> 一个现代化的PDF文件拆分与合并工具，支持在线处理PDF文件，无需上传到服务器。

## ✨ 功能特色

### 🔧 核心功能
- **PDF拆分**：根据页码范围提取PDF页面
- **PDF合并**：将多个PDF文件合并为一个
- **在线预览**：实时预览处理后的PDF文件
- **一键下载**：快速下载处理结果

### 🎨 用户体验
- 现代化UI设计，支持深色/浅色主题
- 拖拽式文件上传，操作简单直观
- 响应式设计，完美适配移动端
- 纯前端处理，保护用户隐私

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 运行测试
```bash
npm test
```

## 📁 项目结构

```
pdf-spliter/
├── src/                    # 源代码目录
│   ├── components/         # UI组件
│   │   ├── FileUploadComponent.js
│   │   ├── PageRangeSelector.js
│   │   └── FileListComponent.js
│   ├── modules/           # 核心模块
│   │   ├── FileManager.js
│   │   ├── PDFProcessor.js
│   │   └── ErrorHandler.js
│   ├── utils/             # 工具函数
│   │   └── downloadUtils.js
│   ├── styles/            # 样式文件
│   │   └── main.css
│   ├── index.html         # HTML模板
│   └── index.js          # 入口文件
├── tests/                # 测试文件
├── public/               # 静态资源
├── PRD.md               # 产品需求文档
├── DESIGN.md            # 技术设计文档
└── README.md            # 项目说明
```

## 🛠️ 技术栈

- **前端框架**：原生JavaScript + ES6+
- **PDF处理**：PDF.js + pdf-lib
- **构建工具**：Webpack 5
- **代码转换**：Babel
- **样式**：CSS3 + CSS变量
- **测试**：Jest + Puppeteer

## 📖 使用说明

### PDF拆分
1. 选择"拆分PDF"标签页
2. 上传PDF文件（支持拖拽）
3. 设置起始页码和结束页码
4. 点击"拆分PDF"按钮
5. 预览并下载拆分结果

### PDF合并
1. 选择"合并PDF"标签页
2. 批量上传多个PDF文件
3. 拖拽调整文件顺序（可选）
4. 点击"合并PDF"按钮
5. 预览并下载合并结果

## ⚡ 性能特性

- **内存优化**：大文件分块处理，避免内存溢出
- **异步处理**：Web Worker处理PDF，避免UI阻塞
- **缓存机制**：智能缓存处理结果，提升用户体验
- **错误恢复**：完善的错误处理和用户提示

## 🔒 隐私保护

- **纯前端处理**：所有PDF处理在浏览器本地完成
- **无数据上传**：文件不会上传到任何服务器
- **即时清理**：处理完成后自动清理内存数据

## 🌐 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📝 开发计划

- [ ] 添加PDF密码保护功能
- [ ] 支持PDF页面旋转
- [ ] 增加批量处理模式
- [ ] 添加PDF元数据编辑
- [ ] 支持更多文件格式转换

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF渲染引擎
- [pdf-lib](https://pdf-lib.js.org/) - PDF操作库
- 感谢所有贡献者的支持

---

如果这个项目对您有帮助，请给个 ⭐️ 支持一下！