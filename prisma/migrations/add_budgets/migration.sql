-- CreateTable
CREATE TABLE "budgets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "start_date" TEXT NOT NULL,
    "end_date" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "budgets_user_id_idx" ON "budgets"("user_id");
CREATE INDEX "budgets_category_idx" ON "budgets"("category");
CREATE UNIQUE INDEX "budgets_user_category_period_idx" ON "budgets"("user_id", "category", "period");

-- TODO: Claude should apply this migration and update schema.prisma
