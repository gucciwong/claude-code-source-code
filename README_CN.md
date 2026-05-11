# Sovereign Code

**版本：** 1.0.0 GA · 2026-07-06 · [发布说明](RELEASE_NOTES_v1.0.0.md) ·
[合规文档](docs/en/COMPLIANCE.md) · [安全策略](SECURITY.md) ·
[English](README.md)

> **Sovereign Code 是 100% 本地运行的 AI 工程平台。** 代码不离开你的机器，
> 模型权重跑在你自己的 GPU 上，训练数据存进一个你拥有的 SQLite 文件。
> 联邦学习只共享梯度，不共享代码。

## 为什么选 Sovereign Code

| 关切                  | 云端工具（Copilot / Cursor） | Sovereign Code               |
|---------------------|---------------------------|------------------------------|
| 代码去哪了？            | 厂商云                     | 留在你笔记本上                |
| 模型归谁？             | 厂商                       | 你自己 —— 可训练、可导出       |
| 能离线/气隙运行？        | 否                         | 可以                          |
| 大陆访问？             | 慢 / 受限                  | 内置 hf-mirror.com 切换       |
| SOC 2 / HIPAA 怎么过？  | 走厂商 BAA                 | 没有数据出站 —— 天然简单       |

## v1.0.0 已包含

* **桌面端**（Electron + React）—— Chat、Models、Training、Knowledge、
  Federation、Analytics、IM Bridge、PR Review 等 25 屏
* **VS Code 扩展** —— 基于本地模型 + RAG 上下文的内联补全
* **18 个本地 FastAPI 服务** —— model-manager、training、knowledge、
  enterprise-data、execution-trace、voice (Whisper + TTS) 等
* **CAMR —— 上下文感知模型路由器** —— 自动为每条 prompt 选最优本地模型
  （补全用小模型、重构用大模型），并按你的接受率持续学习
* **本地认证** —— 每台机器一份 token，localhost 服务不向其他进程暴露
* **自动更新** —— 通过 GitHub Releases 推送 cosign 签名的增量包

## 快速开始

### 安装（终端用户）

到 [GitHub Releases](https://github.com/gucciwong/claude-code-source-code/releases/latest)
下载已签名安装包：

* Windows —— `Sovereign-Code-Setup-1.0.0.exe`
* macOS   —— `Sovereign-Code-1.0.0.dmg`
* Linux   —— `Sovereign-Code-1.0.0.AppImage` 或 `.deb`

中国大陆用户：以上文件同步上架 **阿里云 OSS 镜像**，下载站列表见上述 Release 页。

校验下载（推荐）：

```sh
cosign verify-blob \
  --certificate SHA256SUMS.pem \
  --signature   SHA256SUMS.sig \
  --certificate-identity-regexp '^https://github.com/gucciwong/claude-code-source-code/' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  SHA256SUMS
sha256sum -c SHA256SUMS --ignore-missing
```

首次启动会跑引导流：**检测 VRAM → 推荐 starter 模型 → 下载 → 预热 → 就绪**。
6 GB VRAM 机器大约 90 秒走完。

### 开发（贡献者）

```bash
# 桌面端
cd apps/desktop && npm install && npm run dev

# VS Code 扩展
cd apps/vscode-extension && npm install && npm test

# 全部服务（Docker）
docker compose up                                 # 核心 18 服务
docker compose --profile observability up        # + Prometheus/Grafana/Loki

# E2E 测试
cd apps/desktop && npm run e2e

# CAMR 路由性能 bench
node scripts/bench-router.mjs

# 推理性能 bench（需先下载 Qwen2.5-Coder-7B）
node scripts/bench-perf.mjs
```

## 文档

* [PRD v3.0](docs/en/Sovereign-Code-PRD.md)
* [GA 落地计划 W1–W8](docs/plans/2026-05-11-ga-runway-plan.md)
* [合规](docs/en/COMPLIANCE.md)
* [安全](SECURITY.md)
* [发布说明](RELEASE_NOTES_v1.0.0.md)

## 许可证

详见 [LICENSE](LICENSE)。Sovereign Code 采用宽松许可证，个人和商用均可。
