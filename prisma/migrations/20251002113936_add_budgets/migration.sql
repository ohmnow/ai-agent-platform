-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_budgets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL DEFAULT 'user-001',
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_budgets" ("amount", "category", "created_at", "end_date", "id", "period", "start_date", "updated_at", "user_id") SELECT "amount", "category", "created_at", "end_date", "id", "period", "start_date", "updated_at", "user_id" FROM "budgets";
DROP TABLE "budgets";
ALTER TABLE "new_budgets" RENAME TO "budgets";
CREATE INDEX "budgets_user_id_idx" ON "budgets"("user_id");
CREATE INDEX "budgets_category_idx" ON "budgets"("category");
CREATE UNIQUE INDEX "budgets_user_id_category_period_key" ON "budgets"("user_id", "category", "period");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
