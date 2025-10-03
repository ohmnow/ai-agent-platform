-- CreateTable
CREATE TABLE "Portfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "broker" TEXT,
    "userId" TEXT NOT NULL DEFAULT 'user-001',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "shares" REAL NOT NULL,
    "costBasis" REAL NOT NULL,
    "purchaseDate" DATETIME NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'user-001',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Holding_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "Portfolio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StockQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "change" REAL NOT NULL,
    "changePercent" REAL NOT NULL,
    "volume" INTEGER,
    "marketCap" REAL,
    "peRatio" REAL,
    "dividendYield" REAL,
    "high52Week" REAL,
    "low52Week" REAL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DividendHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "exDate" DATETIME NOT NULL,
    "payDate" DATETIME NOT NULL,
    "frequency" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MarketIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "change" REAL NOT NULL,
    "changePercent" REAL NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");

-- CreateIndex
CREATE INDEX "Holding_userId_idx" ON "Holding"("userId");

-- CreateIndex
CREATE INDEX "Holding_symbol_idx" ON "Holding"("symbol");

-- CreateIndex
CREATE INDEX "Holding_portfolioId_idx" ON "Holding"("portfolioId");

-- CreateIndex
CREATE UNIQUE INDEX "StockQuote_symbol_key" ON "StockQuote"("symbol");

-- CreateIndex
CREATE INDEX "StockQuote_symbol_idx" ON "StockQuote"("symbol");

-- CreateIndex
CREATE INDEX "StockQuote_updatedAt_idx" ON "StockQuote"("updatedAt");

-- CreateIndex
CREATE INDEX "DividendHistory_symbol_idx" ON "DividendHistory"("symbol");

-- CreateIndex
CREATE INDEX "DividendHistory_exDate_idx" ON "DividendHistory"("exDate");

-- CreateIndex
CREATE UNIQUE INDEX "MarketIndex_symbol_key" ON "MarketIndex"("symbol");

-- CreateIndex
CREATE INDEX "MarketIndex_symbol_idx" ON "MarketIndex"("symbol");

-- CreateIndex
CREATE INDEX "MarketIndex_updatedAt_idx" ON "MarketIndex"("updatedAt");
