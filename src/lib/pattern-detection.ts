/**
 * Pattern Detection Library
 *
 * Implements intelligent pattern detection for transactions including:
 * 1. Recurring transaction detection - Identifies regular payment patterns (weekly, monthly, etc.)
 * 2. Spending anomaly detection - Flags unusual transactions using statistical analysis
 * 3. Merchant clustering - Groups similar merchants together using fuzzy matching
 * 4. Seasonal pattern analysis - Detects spending patterns across months/seasons
 * 5. Savings opportunity identification - Suggests potential areas to reduce spending
 *
 * @author Claude Agent SDK
 * @version 1.0.0
 */

// Define transaction interface based on Prisma schema
interface Transaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  category: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define pattern types
export interface RecurringPattern {
  merchant: string;
  category: string;
  averageAmount: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  nextExpectedDate: string;
  confidence: number;
}

export interface SpendingAnomaly {
  transaction_id: string;
  transaction: Transaction;
  deviation: number; // How much it deviates from normal (as percentage)
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SavingsOpportunity {
  category: string;
  potentialSavings: number;
  recommendation: string;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Utility function to extract merchant name from transaction description
 */
function extractMerchantName(description: string): string {
  // Remove common payment prefixes and suffixes
  let merchant = description
    .replace(/^(DEBIT\s+|CREDIT\s+|POS\s+|ATM\s+)/i, '')
    .replace(/\s+\d{2}\/\d{2}$/, '') // Remove date suffixes
    .replace(/\s+#\d+$/, '') // Remove reference numbers
    .trim();

  // Normalize to title case
  return merchant.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Determine frequency based on average interval between transactions
 */
function determineFrequency(avgInterval: number): 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' {
  if (avgInterval <= 2) return 'daily';
  if (avgInterval <= 9) return 'weekly';
  if (avgInterval <= 16) return 'biweekly';
  if (avgInterval <= 35) return 'monthly';
  return 'yearly';
}

/**
 * Detect recurring transactions based on merchant, category, and timing patterns
 */
export async function detectRecurringTransactions(
  transactions: Transaction[]
): Promise<RecurringPattern[]> {
  const patterns: RecurringPattern[] = [];
  const groupedTransactions = new Map<string, Transaction[]>();

  // Group transactions by merchant + category
  for (const transaction of transactions) {
    const merchant = extractMerchantName(transaction.description);
    const key = `${merchant}|${transaction.category}`;

    if (!groupedTransactions.has(key)) {
      groupedTransactions.set(key, []);
    }
    groupedTransactions.get(key)!.push(transaction);
  }

  // Analyze each group for recurring patterns
  for (const [key, groupTransactions] of Array.from(groupedTransactions.entries())) {
    // Need at least 3 transactions to detect a pattern
    if (groupTransactions.length < 3) continue;

    // Sort by date
    groupTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate intervals between transactions
    const intervals: number[] = [];
    for (let i = 1; i < groupTransactions.length; i++) {
      intervals.push(daysBetween(groupTransactions[i-1].date, groupTransactions[i].date));
    }

    // Calculate average interval and standard deviation
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Check if intervals are consistent (low standard deviation)
    const consistencyThreshold = avgInterval * 0.3; // 30% variation allowed
    if (stdDev <= consistencyThreshold && avgInterval >= 1) {
      const [merchant, category] = key.split('|');
      const amounts = groupTransactions.map(t => Math.abs(t.amount));
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

      // Calculate confidence based on consistency and sample size
      const consistency = Math.max(0, 1 - (stdDev / avgInterval));
      const sampleSizeBonus = Math.min(0.3, groupTransactions.length * 0.05);
      const confidence = Math.min(1, consistency + sampleSizeBonus);

      // Predict next occurrence
      const lastTransaction = groupTransactions[groupTransactions.length - 1];
      const nextExpectedDate = new Date(lastTransaction.date.getTime() + avgInterval * 24 * 60 * 60 * 1000);

      patterns.push({
        merchant,
        category,
        averageAmount: Number(avgAmount.toFixed(2)),
        frequency: determineFrequency(avgInterval),
        nextExpectedDate: nextExpectedDate.toISOString().split('T')[0],
        confidence: Number(confidence.toFixed(2))
      });
    }
  }

  // Sort by confidence (highest first)
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Detect spending anomalies using statistical methods
 */
export async function detectAnomalies(
  transactions: Transaction[]
): Promise<SpendingAnomaly[]> {
  const anomalies: SpendingAnomaly[] = [];
  const categoryStats = new Map<string, { amounts: number[], mean: number, stdDev: number }>();

  // Calculate statistics for each category (only expenses - negative amounts)
  const expenseTransactions = transactions.filter(t => t.amount < 0);

  for (const transaction of expenseTransactions) {
    const amount = Math.abs(transaction.amount);

    if (!categoryStats.has(transaction.category)) {
      categoryStats.set(transaction.category, { amounts: [], mean: 0, stdDev: 0 });
    }

    categoryStats.get(transaction.category)!.amounts.push(amount);
  }

  // Calculate mean and standard deviation for each category
  for (const [category, stats] of Array.from(categoryStats.entries())) {
    if (stats.amounts.length < 3) continue; // Need minimum data for statistical analysis

    stats.mean = stats.amounts.reduce((sum, amount) => sum + amount, 0) / stats.amounts.length;
    const variance = stats.amounts.reduce((sum, amount) => sum + Math.pow(amount - stats.mean, 2), 0) / stats.amounts.length;
    stats.stdDev = Math.sqrt(variance);
  }

  // Identify anomalies using z-score method
  for (const transaction of expenseTransactions) {
    const amount = Math.abs(transaction.amount);
    const stats = categoryStats.get(transaction.category);

    if (!stats || stats.stdDev === 0) continue;

    // Calculate z-score (how many standard deviations away from mean)
    const zScore = (amount - stats.mean) / stats.stdDev;
    const absZScore = Math.abs(zScore);

    // Flag as anomaly if z-score > 2 (roughly top/bottom 5% of normal distribution)
    if (absZScore > 2) {
      let severity: 'low' | 'medium' | 'high';
      let reason: string;

      if (absZScore > 3) {
        severity = 'high';
        reason = `Extremely unusual amount: $${amount.toFixed(2)} is ${absZScore.toFixed(1)} standard deviations from typical ${transaction.category} spending`;
      } else if (absZScore > 2.5) {
        severity = 'medium';
        reason = `Very unusual amount: $${amount.toFixed(2)} is significantly higher than typical ${transaction.category} spending`;
      } else {
        severity = 'low';
        reason = `Unusual amount: $${amount.toFixed(2)} is moderately higher than typical ${transaction.category} spending`;
      }

      // Check for unusual merchants too
      const merchant = extractMerchantName(transaction.description);
      const sameCategoryTransactions = expenseTransactions.filter(t => t.category === transaction.category);
      const merchantCount = sameCategoryTransactions.filter(t => extractMerchantName(t.description) === merchant).length;

      if (merchantCount === 1 && sameCategoryTransactions.length > 5) {
        reason += ` at unfamiliar merchant "${merchant}"`;
        severity = severity === 'low' ? 'medium' : severity === 'medium' ? 'high' : severity;
      }

      anomalies.push({
        transaction_id: transaction.id,
        transaction,
        deviation: Number(absZScore.toFixed(2)),
        reason,
        severity
      });
    }
  }

  // Sort by deviation (highest first)
  return anomalies.sort((a, b) => b.deviation - a.deviation);
}

// Define budget interface for type safety
interface Budget {
  category: string;
  amount: number;
}

/**
 * Find savings opportunities based on spending patterns and budget analysis
 */
export async function findSavingsOpportunities(
  transactions: Transaction[],
  budgets: Budget[] = []
): Promise<SavingsOpportunity[]> {
  const opportunities: SavingsOpportunity[] = [];

  // Calculate spending by category (only expenses)
  const expenseTransactions = transactions.filter(t => t.amount < 0);
  const categorySpending = new Map<string, { total: number, transactions: Transaction[], merchants: Set<string> }>();

  for (const transaction of expenseTransactions) {
    const amount = Math.abs(transaction.amount);

    if (!categorySpending.has(transaction.category)) {
      categorySpending.set(transaction.category, {
        total: 0,
        transactions: [],
        merchants: new Set()
      });
    }

    const category = categorySpending.get(transaction.category)!;
    category.total += amount;
    category.transactions.push(transaction);
    category.merchants.add(extractMerchantName(transaction.description));
  }

  // Sort categories by total spending (highest first)
  const sortedCategories = Array.from(categorySpending.entries())
    .sort(([,a], [,b]) => b.total - a.total);

  for (const [category, data] of sortedCategories) {
    const monthlyAverage = data.total / (transactions.length > 0 ?
      Math.max(1, Math.ceil(transactions.length / 30)) : 1); // Rough monthly estimate

    // Find budget for this category
    const budget = budgets.find(b => b.category === category);

    // Opportunity 1: Budget overrun
    if (budget && data.total > budget.amount) {
      const overrun = data.total - budget.amount;
      opportunities.push({
        category,
        potentialSavings: Number(overrun.toFixed(2)),
        recommendation: `You've spent $${data.total.toFixed(2)} in ${category}, which is $${overrun.toFixed(2)} over your budget of $${budget.amount.toFixed(2)}. Consider tracking expenses more closely in this category.`,
        priority: overrun > budget.amount * 0.5 ? 'high' : overrun > budget.amount * 0.2 ? 'medium' : 'low'
      });
    }

    // Opportunity 2: High-spending categories (top 3)
    if (sortedCategories.indexOf([category, data]) < 3 && data.total > 100) {
      const reductionTarget = data.total * 0.15; // Suggest 15% reduction
      opportunities.push({
        category,
        potentialSavings: Number(reductionTarget.toFixed(2)),
        recommendation: `${category} is one of your highest spending categories ($${data.total.toFixed(2)}). Even a 15% reduction could save you $${reductionTarget.toFixed(2)}.`,
        priority: data.total > 500 ? 'high' : data.total > 200 ? 'medium' : 'low'
      });
    }

    // Opportunity 3: Frequent small purchases (potential subscription optimization)
    if (data.transactions.length > 10) {
      const avgTransaction = data.total / data.transactions.length;
      if (avgTransaction < 50) {
        const subscriptionSavings = avgTransaction * data.transactions.length * 0.1; // 10% savings
        opportunities.push({
          category,
          potentialSavings: Number(subscriptionSavings.toFixed(2)),
          recommendation: `You made ${data.transactions.length} ${category} transactions averaging $${avgTransaction.toFixed(2)}. Consider bundling purchases or finding bulk discounts.`,
          priority: 'low'
        });
      }
    }

    // Opportunity 4: Multiple merchants in same category (consolidation opportunity)
    if (data.merchants.size > 5 && data.total > 200) {
      const consolidationSavings = data.total * 0.08; // 8% potential savings
      opportunities.push({
        category,
        potentialSavings: Number(consolidationSavings.toFixed(2)),
        recommendation: `You're using ${data.merchants.size} different merchants for ${category}. Consolidating to fewer providers might unlock better rates or rewards.`,
        priority: 'low'
      });
    }
  }

  // Opportunity 5: Seasonal spending patterns (if we have historical data)
  const now = new Date();
  const currentMonth = now.getMonth();

  // Holiday months (November, December) spending analysis
  if (currentMonth === 10 || currentMonth === 11) {
    const holidayCategories = ['Entertainment', 'Shopping', 'Food', 'Travel'];
    for (const category of holidayCategories) {
      const categoryData = categorySpending.get(category);
      if (categoryData && categoryData.total > 300) {
        const holidaySavings = categoryData.total * 0.20; // 20% potential holiday savings
        opportunities.push({
          category,
          potentialSavings: Number(holidaySavings.toFixed(2)),
          recommendation: `Holiday season spending in ${category} ($${categoryData.total.toFixed(2)}) could be reduced by setting specific limits and comparison shopping.`,
          priority: 'medium'
        });
      }
    }
  }

  // Remove duplicates and sort by potential savings (highest first)
  const uniqueOpportunities = opportunities
    .filter((opportunity, index, self) =>
      index === self.findIndex(o => o.category === opportunity.category && o.recommendation === opportunity.recommendation))
    .sort((a, b) => {
      // First sort by priority
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      // Then by potential savings
      return b.potentialSavings - a.potentialSavings;
    });

  return uniqueOpportunities.slice(0, 10); // Return top 10 opportunities
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  return maxLength === 0 ? 1 : 1 - (distance / maxLength);
}

/**
 * Normalize merchant name for better clustering
 */
function normalizeMerchantName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\b(inc|llc|corp|ltd|co|store|shop|market|pharmacy|gas|station)\b/g, '') // Remove common business suffixes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Analyze merchant clusters to group similar merchants together
 */
export async function analyzeMerchantClusters(
  transactions: Transaction[]
): Promise<Map<string, string[]>> {
  const merchantClusters = new Map<string, string[]>();
  const merchants: string[] = [];
  const merchantTransactions = new Map<string, Transaction[]>();

  // Extract and normalize merchant names
  for (const transaction of transactions) {
    const merchant = extractMerchantName(transaction.description);
    const normalized = normalizeMerchantName(merchant);

    if (!merchants.includes(merchant)) {
      merchants.push(merchant);
    }

    if (!merchantTransactions.has(merchant)) {
      merchantTransactions.set(merchant, []);
    }
    merchantTransactions.get(merchant)!.push(transaction);
  }

  // Group merchants by similarity
  const processed = new Set<string>();

  for (const merchant1 of merchants) {
    if (processed.has(merchant1)) continue;

    const cluster: string[] = [merchant1];
    const normalized1 = normalizeMerchantName(merchant1);

    for (const merchant2 of merchants) {
      if (merchant1 === merchant2 || processed.has(merchant2)) continue;

      const normalized2 = normalizeMerchantName(merchant2);
      const similarity = calculateSimilarity(normalized1, normalized2);

      // If similarity is high enough, add to cluster
      if (similarity > 0.8) {
        cluster.push(merchant2);
        processed.add(merchant2);
      }

      // Also check for common words/substrings
      const words1 = normalized1.split(' ').filter(w => w.length > 2);
      const words2 = normalized2.split(' ').filter(w => w.length > 2);
      const commonWords = words1.filter(w => words2.includes(w));

      if (commonWords.length > 0 && commonWords.length / Math.max(words1.length, words2.length) > 0.6) {
        if (!cluster.includes(merchant2)) {
          cluster.push(merchant2);
          processed.add(merchant2);
        }
      }
    }

    // Only create cluster if it has more than one merchant
    if (cluster.length > 1) {
      // Use the most common merchant as the cluster key
      const clusterKey = cluster
        .map(m => ({ merchant: m, count: merchantTransactions.get(m)?.length || 0 }))
        .sort((a, b) => b.count - a.count)[0].merchant;

      merchantClusters.set(clusterKey, cluster);
    }

    processed.add(merchant1);
  }

  return merchantClusters;
}

/**
 * Detect seasonal spending patterns across categories
 */
export async function detectSeasonalPatterns(
  transactions: Transaction[]
): Promise<Map<string, number[]>> {
  const seasonalPatterns = new Map<string, number[]>();

  // Filter only expense transactions
  const expenseTransactions = transactions.filter(t => t.amount < 0);

  // Group transactions by category and month
  const categoryMonthSpending = new Map<string, Map<number, number>>();

  for (const transaction of expenseTransactions) {
    const month = transaction.date.getMonth(); // 0-11
    const amount = Math.abs(transaction.amount);

    if (!categoryMonthSpending.has(transaction.category)) {
      categoryMonthSpending.set(transaction.category, new Map());
    }

    const monthlySpending = categoryMonthSpending.get(transaction.category)!;
    monthlySpending.set(month, (monthlySpending.get(month) || 0) + amount);
  }

  // Calculate seasonal patterns for each category
  for (const [category, monthlyData] of Array.from(categoryMonthSpending.entries())) {
    // Create array of 12 months with spending data
    const monthlySpending: number[] = [];
    let totalSpending = 0;

    for (let month = 0; month < 12; month++) {
      const spending = monthlyData.get(month) || 0;
      monthlySpending[month] = spending;
      totalSpending += spending;
    }

    // Calculate average monthly spending
    const averageMonthlySpending = totalSpending / 12;

    // Calculate seasonal multipliers (ratio to average)
    const seasonalMultipliers: number[] = monthlySpending.map(spending =>
      averageMonthlySpending > 0 ? Number((spending / averageMonthlySpending).toFixed(2)) : 0
    );

    // Only include categories with significant seasonal variation
    const maxMultiplier = Math.max(...seasonalMultipliers);
    const minMultiplier = Math.min(...seasonalMultipliers.filter(m => m > 0));
    const seasonalVariation = maxMultiplier - minMultiplier;

    // If there's significant seasonal variation (>50% difference), include it
    if (seasonalVariation > 0.5) {
      seasonalPatterns.set(category, seasonalMultipliers);
    }
  }

  return seasonalPatterns;
}

/**
 * Helper function to get season name from month
 */
export function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

/**
 * Helper function to get month name from month index
 */
export function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month] || 'Unknown';
}

/**
 * Analyze seasonal patterns and return insights
 */
export async function getSeasonalInsights(
  transactions: Transaction[]
): Promise<{ category: string; insight: string; peakMonth: string; lowMonth: string }[]> {
  const patterns = await detectSeasonalPatterns(transactions);
  const insights: { category: string; insight: string; peakMonth: string; lowMonth: string }[] = [];

  for (const [category, multipliers] of Array.from(patterns.entries())) {
    const maxMultiplier = Math.max(...multipliers);
    const minMultiplier = Math.min(...multipliers.filter(m => m > 0));
    const peakMonth = multipliers.indexOf(maxMultiplier);
    const lowMonth = multipliers.indexOf(minMultiplier);

    let insight = '';
    if (maxMultiplier > 2) {
      insight = `High seasonal spending in ${getMonthName(peakMonth)} (${(maxMultiplier * 100).toFixed(0)}% above average)`;
    } else if (maxMultiplier > 1.5) {
      insight = `Elevated spending in ${getMonthName(peakMonth)} (${((maxMultiplier - 1) * 100).toFixed(0)}% above average)`;
    } else {
      insight = `Moderate seasonal variation with peak in ${getMonthName(peakMonth)}`;
    }

    insights.push({
      category,
      insight,
      peakMonth: getMonthName(peakMonth),
      lowMonth: getMonthName(lowMonth)
    });
  }

  return insights.sort((a, b) => a.category.localeCompare(b.category));
}
