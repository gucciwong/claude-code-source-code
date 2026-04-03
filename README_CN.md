# Sovereign Coder

Sovereign Coder 是一个本地优先的 AI 工程平台，聚焦独立模型运行、编码协作与企业集成能力。

## 当前项目

- `apps/desktop`：Electron + React 桌面端
- `apps/vscode-extension`：VS Code 扩展
- `services/*`：训练、编排、分析、记忆、语音等后端服务
- `scripts/*`：Sovereign 周度运行与验收自动化脚本

## 快速开始

### 桌面端

```bash
cd apps/desktop
npm install
npm run dev
```

### VS Code 扩展

```bash
cd apps/vscode-extension
npm install
npm test
```

### 周度验证

```bash
npm run test:sovereign
npm run sovereign:week1:run -- --date 2026-04-04 --tier 8GB --out-dir artifacts
```

## 仓库方向

该仓库已切换为 Sovereign-first 开发模式，旧的逆向源码层不再作为活跃开发或构建路径。
