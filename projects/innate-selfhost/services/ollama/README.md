# Ollama — 本地 LLM 推理

本地运行大语言模型，为 AI Agent 提供模型服务。

## 状态

🔲 预留 — 待实现

## 规划

- 支持 llama3.2、codellama 等开源模型
- 与 agent-runtime 集成
- GPU 加速支持（NVIDIA/Apple Silicon）

## 快速开始（规划中）

```bash
cd services/ollama
cp .env.example .env
docker compose up -d

# 拉取模型
docker compose exec ollama ollama pull llama3.2

# 测试推理
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello, world!"
}'
```

## 端口

| 端口 | 说明 |
|------|------|
| 11434 | Ollama API |
