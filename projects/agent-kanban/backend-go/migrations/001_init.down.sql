-- Drop all kanban tables (reverse of 001_init.up.sql)

DROP TABLE IF EXISTS kanban_webhook_subscription;
DROP TABLE IF EXISTS kanban_audit_log;
DROP TABLE IF EXISTS kanban_assignment;
DROP TABLE IF EXISTS kanban_agent;
DROP TABLE IF EXISTS kanban_task;
DROP TABLE IF EXISTS kanban_project;
DROP TABLE IF EXISTS kanban_workspace;
