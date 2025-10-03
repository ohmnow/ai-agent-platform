-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "tags" TEXT,
    "estimatedMinutes" INTEGER,
    "actualMinutes" INTEGER,
    "userId" TEXT NOT NULL DEFAULT 'user-001',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TimeBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "taskId" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL DEFAULT 'user-001',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductivityLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL,
    "focusRating" INTEGER,
    "notes" TEXT,
    "userId" TEXT NOT NULL DEFAULT 'user-001',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "TimeBlock_userId_idx" ON "TimeBlock"("userId");

-- CreateIndex
CREATE INDEX "TimeBlock_start_idx" ON "TimeBlock"("start");

-- CreateIndex
CREATE INDEX "TimeBlock_category_idx" ON "TimeBlock"("category");

-- CreateIndex
CREATE INDEX "ProductivityLog_userId_idx" ON "ProductivityLog"("userId");

-- CreateIndex
CREATE INDEX "ProductivityLog_date_idx" ON "ProductivityLog"("date");
