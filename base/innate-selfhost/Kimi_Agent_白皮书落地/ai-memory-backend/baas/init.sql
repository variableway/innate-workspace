-- ============================================================================
-- init.sql —— baas 数据库初始化脚本（挂载到 /docker-entrypoint-initdb.d/）
-- 对应白皮书 2.2 Skill 4 / 方案 B：pgvector 向量 + pg_search 全文 + 多租户 RLS
-- 仅在数据目录为空（首次启动）时自动执行
-- ============================================================================

-- ---------- 扩展：向量检索 + 全文搜索 ----------
CREATE EXTENSION IF NOT EXISTS vector;      -- pgvector：embedding 存储与相似度搜索
CREATE EXTENSION IF NOT EXISTS pg_search;   -- ParadeDB pg_search（Tantivy 全文搜索）

-- ---------- 匿名角色（供 PostgREST PGRST_DB_ANON_ROLE 使用）----------
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
END
$$;
GRANT USAGE ON SCHEMA public TO anon;

-- ---------- 多租户示例表 ----------
-- 租户表
CREATE TABLE IF NOT EXISTS tenants (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 文档表：内容 + 384 维向量（对齐 memweave 的 all-MiniLM-L6-v2 / 哈希兜底维度）
CREATE TABLE IF NOT EXISTS documents (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content     text NOT NULL,
    embedding   vector(384),
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- 常用索引：按租户过滤 + 向量近邻搜索（HNSW）
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents (tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding
    ON documents USING hnsw (embedding vector_cosine_ops);

-- 授权 anon 角色读写示例表（RLS 负责行级隔离）
GRANT SELECT, INSERT, UPDATE, DELETE ON tenants, documents TO anon;

-- ---------- 行级安全（RLS）：按 app.tenant_id 会话变量隔离 ----------
-- 请求进入 PostgREST 时通过：
--   SET LOCAL app.tenant_id = '<租户 uuid>';
-- 或在 JWT claim 中携带后由中间层注入。
ALTER TABLE tenants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 租户只能看到自己的租户记录
DROP POLICY IF EXISTS tenant_isolation ON tenants;
CREATE POLICY tenant_isolation ON tenants
    USING (id = current_setting('app.tenant_id', true)::uuid);

-- 文档只能访问属于当前租户的行
DROP POLICY IF EXISTS document_tenant_isolation ON documents;
CREATE POLICY document_tenant_isolation ON documents
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- ---------- 使用示例 ----------
-- SET LOCAL app.tenant_id = '00000000-0000-0000-0000-000000000001';
-- SELECT * FROM documents ORDER BY embedding <=> '[0.1, 0.2, ...]'::vector LIMIT 10;

-- ============================================================================
-- pg_cron 定时任务示例（方案 B 组件之一；ParadeDB 镜像默认未装 pg_cron，
-- 如换用带 pg_cron 的镜像，可取消注释以下片段）
-- ============================================================================
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
--
-- -- 每天凌晨 3 点清理 90 天前的旧文档
-- SELECT cron.schedule('clean-old-documents', '0 3 * * *',
--     $$DELETE FROM documents WHERE created_at < now() - interval '90 days'$$);
--
-- -- 每 10 分钟刷新统计信息
-- SELECT cron.schedule('analyze-documents', '*/10 * * * *',
--     $$ANALYZE documents$$);
