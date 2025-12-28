// Database file - Direct JSON file operations
// This file directly reads/writes JSON files as database tables
// Since browsers can't write files directly, we use localStorage as a bridge
// In production, you would need a backend API to write to these JSON files

// Trade data structure matching your format
export interface TradeRecord {
  trade_id: string;
  user: string; // user ID
  base_token: string; // e.g., "ETH", "SOL"
  quote_token: string; // e.g., "USDT"
  side: "BUY" | "SELL";
  price: number;
  base_amount: number;
  quote_amount: number;
  timestamp: number;
  gas_fee?: number;
  token_address?: string;
  token_name?: string;
  token_image?: string;
}

// User data structure
export interface UserRecord {
  user_id: string;
  name?: string;
  email?: string;
  wallet_address?: string;
  avatar?: string;
  balance: number; // USDT balance
  created_at: number;
  last_login_at: number;
  auth_type?: "email" | "metamask";
}

// Holding data structure
export interface HoldingRecord {
  holding_id: string;
  user: string; // user ID
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_image?: string;
  quantity: number;
  average_buy_price: number;
  total_buy_usd: number;
  total_sell_usd: number;
  first_buy_time: number;
  last_active_time: number;
}

// JSON file structures
export interface TradesData {
  trades: TradeRecord[];
}

export interface UsersData {
  users: UserRecord[];
}

export interface HoldingsData {
  holdings: HoldingRecord[];
}

// File paths (relative to public/data/db for runtime access)
const TRADES_FILE = '/data/db/trades.json';
const USERS_FILE = '/data/db/users.json';
const HOLDINGS_FILE = '/data/db/holdings.json';

// localStorage keys (used as cache/bridge since browsers can't write files)
const TRADES_STORAGE_KEY = 'gmgn_trades_json';
const USERS_STORAGE_KEY = 'gmgn_users_json';
const HOLDINGS_STORAGE_KEY = 'gmgn_holdings_json';

// Load JSON file from localStorage (or fetch from public folder on first load)
async function loadJsonFile<T>(storageKey: string, filePath: string, defaultValue: T): Promise<T> {
  try {
    // First try localStorage (our "database")
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // If not in localStorage, try to fetch from public folder
    try {
      const response = await fetch(filePath);
      if (response.ok) {
        const data = await response.json();
        // Cache it in localStorage
        localStorage.setItem(storageKey, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      // File doesn't exist or can't be fetched, use default
      console.log(`File ${filePath} not found, using default`);
    }
    
    // Return default and cache it
    localStorage.setItem(storageKey, JSON.stringify(defaultValue));
    return defaultValue;
  } catch (error) {
    console.error(`Error loading ${storageKey}:`, error);
    return defaultValue;
  }
}

// Save JSON file to localStorage (in production, this would call a backend API)
function saveJsonFile<T>(storageKey: string, data: T): void {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    localStorage.setItem(storageKey, jsonString);
    console.log(`✅ Saved ${storageKey} to localStorage`);
    console.log(`📊 Data preview:`, jsonString.substring(0, 300) + (jsonString.length > 300 ? '...' : ''));
    // In production, you would also POST to a backend API to write to the actual JSON file
    // Example: await fetch('/api/database/trades', { method: 'POST', body: JSON.stringify(data) });
  } catch (error) {
    console.error(`Error saving ${storageKey}:`, error);
  }
}

// ========== TRADES OPERATIONS ==========

export async function loadTrades(): Promise<TradesData> {
  return loadJsonFile<TradesData>(TRADES_STORAGE_KEY, TRADES_FILE, { trades: [] });
}

export function saveTrades(data: TradesData): void {
  saveJsonFile(TRADES_STORAGE_KEY, data);
}

export async function addTrade(trade: TradeRecord): Promise<void> {
  try {
    const data = await loadTrades();
    console.log('📥 Adding trade:', trade);
    console.log('📋 Current trades count:', data.trades.length);
    data.trades.push(trade);
    saveTrades(data);
    console.log('✅ Trade added successfully!');
    console.log('📊 New trades count:', data.trades.length);
  } catch (error) {
    console.error('❌ Error adding trade:', error);
    throw error;
  }
}

export async function getTradesByUserId(userId: string): Promise<TradeRecord[]> {
  const data = await loadTrades();
  return data.trades.filter(t => t.user === userId);
}

export async function getAllTrades(): Promise<TradeRecord[]> {
  const data = await loadTrades();
  return data.trades;
}

// ========== USERS OPERATIONS ==========

export async function loadUsers(): Promise<UsersData> {
  return loadJsonFile<UsersData>(USERS_STORAGE_KEY, USERS_FILE, { users: [] });
}

export function saveUsers(data: UsersData): void {
  saveJsonFile(USERS_STORAGE_KEY, data);
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  const data = await loadUsers();
  return data.users.find(u => u.user_id === userId) || null;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const data = await loadUsers();
  return data.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

export async function getUserByWalletAddress(address: string): Promise<UserRecord | null> {
  const data = await loadUsers();
  return data.users.find(u => u.wallet_address?.toLowerCase() === address.toLowerCase()) || null;
}

export async function upsertUser(user: UserRecord): Promise<void> {
  const data = await loadUsers();
  const index = data.users.findIndex(u => u.user_id === user.user_id);
  if (index >= 0) {
    data.users[index] = user;
  } else {
    data.users.push(user);
  }
  saveUsers(data);
}

export async function updateUserBalance(userId: string, newBalance: number): Promise<void> {
  const data = await loadUsers();
  const user = data.users.find(u => u.user_id === userId);
  if (user) {
    user.balance = newBalance;
    saveUsers(data);
  }
}

// ========== HOLDINGS OPERATIONS ==========

export async function loadHoldings(): Promise<HoldingsData> {
  return loadJsonFile<HoldingsData>(HOLDINGS_STORAGE_KEY, HOLDINGS_FILE, { holdings: [] });
}

export function saveHoldings(data: HoldingsData): void {
  saveJsonFile(HOLDINGS_STORAGE_KEY, data);
}

export async function getHoldingsByUserId(userId: string): Promise<HoldingRecord[]> {
  const data = await loadHoldings();
  return data.holdings.filter(h => h.user === userId);
}

export async function upsertHolding(holding: HoldingRecord): Promise<void> {
  const data = await loadHoldings();
  const index = data.holdings.findIndex(
    h => h.user === holding.user && h.token_address.toLowerCase() === holding.token_address.toLowerCase()
  );
  if (index >= 0) {
    data.holdings[index] = holding;
  } else {
    data.holdings.push(holding);
  }
  saveHoldings(data);
}

export async function removeHolding(userId: string, tokenAddress: string): Promise<void> {
  const data = await loadHoldings();
  data.holdings = data.holdings.filter(
    h => !(h.user === userId && h.token_address.toLowerCase() === tokenAddress.toLowerCase())
  );
  saveHoldings(data);
}

// ========== UTILITY FUNCTIONS ==========

// Reset all JSON files to empty state
export function resetDatabase(): void {
  try {
    localStorage.removeItem(TRADES_STORAGE_KEY);
    localStorage.removeItem(USERS_STORAGE_KEY);
    localStorage.removeItem(HOLDINGS_STORAGE_KEY);
    // Also clear old keys for compatibility
    localStorage.removeItem('gmgn_users_data');
    localStorage.removeItem('gmgn_holdings_data');
    localStorage.removeItem('gmgn_trades_data');
    localStorage.removeItem('gmgn_current_user');
    console.log('✅ Database reset successfully - all JSON files cleared');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  }
}

// Export all data as JSON strings (for backup)
export async function exportDatabase(): Promise<{
  trades: string;
  users: string;
  holdings: string;
}> {
  const trades = await loadTrades();
  const users = await loadUsers();
  const holdings = await loadHoldings();
  return {
    trades: JSON.stringify(trades, null, 2),
    users: JSON.stringify(users, null, 2),
    holdings: JSON.stringify(holdings, null, 2),
  };
}
