-- =============================================================================
-- マイグレーション: capacity_scenarios に hours_per_person カラムを追加
-- =============================================================================

-- 1. カラム追加（デフォルト値あり、既存行に自動適用）
ALTER TABLE capacity_scenarios
  ADD hours_per_person DECIMAL(10, 2) NOT NULL
    CONSTRAINT DF_capacity_scenarios_hours_per_person DEFAULT 160.00;

-- 2. CHECK 制約追加（0 超 744 以下）
ALTER TABLE capacity_scenarios
  ADD CONSTRAINT CK_capacity_scenarios_hours_per_person
    CHECK (hours_per_person > 0 AND hours_per_person <= 744);

-- 3. 既存シードデータの更新
UPDATE capacity_scenarios
SET hours_per_person = 128.00
WHERE scenario_name = N'標準シナリオ';

UPDATE capacity_scenarios
SET hours_per_person = 162.00
WHERE scenario_name = N'楽観シナリオ';
