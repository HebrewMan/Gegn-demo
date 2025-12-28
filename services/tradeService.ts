import { User, WalletToken, WalletActivity } from '../types';
import { 
  addTrade as addTradeRecord, 
  upsertHolding as upsertHoldingRecord, 
  removeHolding as removeHoldingRecord, 
  updateUserBalance, 
  upsertUser,
  getTradesByUserId as getTradeRecordsByUserId,
  getHoldingsByUserId as getHoldingRecordsByUserId,
  type TradeRecord,
  type HoldingRecord
} from '../data/database';

const TRADES_STORAGE_KEY = 'gmgn_trades_data';
const HOLDINGS_STORAGE_KEY = 'gmgn_holdings_data';

export interface Trade {
  id: string;
  userId: string;
  type: 'BUY' | 'SELL';
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenImage: string;
  price: number;
  quantity: number;
  totalUsd: number;
  timestamp: number;
  gasFee: number;
}

export interface Holding {
  userId: string;
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenImage: string;
  quantity: number; // Token quantity
  averageBuyPrice: number;
  totalBuyUsd: number;
  totalSellUsd: number;
  firstBuyTime: number;
  lastActiveTime: number;
}

// Read trades from localStorage
const readTrades = (): Trade[] => {
  try {
    const data = localStorage.getItem(TRADES_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading trades data:', error);
  }
  return [];
};

// Write trades to localStorage
const writeTrades = (trades: Trade[]): void => {
  try {
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades, null, 2));
  } catch (error) {
    console.error('Error writing trades data:', error);
  }
};

// Read holdings from localStorage
const readHoldings = (): Holding[] => {
  try {
    const data = localStorage.getItem(HOLDINGS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading holdings data:', error);
  }
  return [];
};

// Write holdings to localStorage
const writeHoldings = (holdings: Holding[]): void => {
  try {
    localStorage.setItem(HOLDINGS_STORAGE_KEY, JSON.stringify(holdings, null, 2));
  } catch (error) {
    console.error('Error writing holdings data:', error);
  }
};

// Execute a trade (BUY or SELL)
export const executeTrade = async (
  userId: string,
  type: 'BUY' | 'SELL',
  tokenAddress: string,
  tokenSymbol: string,
  tokenName: string,
  tokenImage: string,
  price: number,
  usdAmount: number,
  quantity?: number // Optional: if provided, use it; otherwise calculate from usdAmount
): Promise<{ success: boolean; message: string; trade?: Trade }> => {
  try {
    // Get user from JSON database
    const { getUserById } = await import('../data/database');
    const userRecord = await getUserById(userId);
    
    if (!userRecord) {
      return { success: false, message: '用户不存在' };
    }

    // Use provided quantity or calculate from usdAmount
    const finalQuantity = quantity !== undefined ? quantity : (usdAmount / price);
    const gasFee = Math.random() * 0.1 + 0.01; // Random gas fee between 0.01 and 0.11

    if (type === 'BUY') {
      // Check if user has enough USDT
      if (userRecord.balance < usdAmount + gasFee) {
        return { success: false, message: 'USDT余额不足' };
      }

      // Deduct USDT from user balance
      userRecord.balance -= (usdAmount + gasFee);
      await updateUserBalance(userId, userRecord.balance);
      
      // Update or create holding
      const holdings = await getHoldingRecordsByUserId(userId);
      let holding = holdings.find(
        h => h.token_address.toLowerCase() === tokenAddress.toLowerCase()
      );

      if (holding) {
        // Update existing holding
        const totalQuantity = holding.quantity + finalQuantity;
        const totalBuyUsd = holding.total_buy_usd + usdAmount;
        holding.average_buy_price = totalBuyUsd / totalQuantity;
        holding.quantity = totalQuantity;
        holding.total_buy_usd = totalBuyUsd;
        holding.last_active_time = Date.now();
      } else {
        // Create new holding
        holding = {
          holding_id: `holding_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          user: userId,
          token_address: tokenAddress,
          token_symbol: tokenSymbol,
          token_name: tokenName,
          token_image: tokenImage,
          quantity: finalQuantity,
          average_buy_price: price,
          total_buy_usd: usdAmount,
          total_sell_usd: 0,
          first_buy_time: Date.now(),
          last_active_time: Date.now(),
        };
      }
      await upsertHoldingRecord(holding);
    } else {
      // SELL
      const holdings = await getHoldingRecordsByUserId(userId);
      const holding = holdings.find(
        h => h.token_address.toLowerCase() === tokenAddress.toLowerCase()
      );

      if (!holding || holding.quantity < finalQuantity) {
        return { success: false, message: '代币余额不足' };
      }

      // Add USDT to user balance
      userRecord.balance += (usdAmount - gasFee);
      await updateUserBalance(userId, userRecord.balance);
      
      // Update holding
      holding.quantity -= finalQuantity;
      holding.total_sell_usd += usdAmount;
      holding.last_active_time = Date.now();

      // Remove holding if quantity is zero
      if (holding.quantity <= 0) {
        await removeHoldingRecord(userId, tokenAddress);
      } else {
        await upsertHoldingRecord(holding);
      }
    }

    // Update user record
    await upsertUser({
      user_id: userRecord.user_id,
      name: userRecord.name,
      email: userRecord.email,
      wallet_address: userRecord.wallet_address,
      avatar: userRecord.avatar,
      balance: userRecord.balance,
      created_at: userRecord.created_at,
      last_login_at: Date.now(),
      auth_type: userRecord.auth_type,
    });

    // Create trade record in new format
    const tradeRecord: TradeRecord = {
      trade_id: `tx_${Date.now().toString().padStart(10, '0')}`,
      user: userId,
      base_token: tokenSymbol,
      quote_token: 'USDT',
      side: type,
      price: price,
      base_amount: finalQuantity,
      quote_amount: usdAmount,
      timestamp: Math.floor(Date.now() / 1000), // Unix timestamp
      gas_fee: gasFee,
      token_address: tokenAddress,
      token_name: tokenName,
      token_image: tokenImage,
    };

    // Add trade to JSON database
    await addTradeRecord(tradeRecord);

    // Return in old format for compatibility
    const trade: Trade = {
      id: tradeRecord.trade_id,
      userId,
      type,
      tokenAddress,
      tokenSymbol,
      tokenName,
      tokenImage,
      price,
      quantity: finalQuantity,
      totalUsd: usdAmount,
      timestamp: tradeRecord.timestamp * 1000, // Convert back to milliseconds
      gasFee,
    };

    return {
      success: true,
      message: type === 'BUY' ? '买入成功' : '卖出成功',
      trade,
    };
  } catch (error) {
    console.error('Error executing trade:', error);
    return { success: false, message: '交易失败，请重试' };
  }
};

// Get user holdings (using new JSON format)
export const getUserHoldings = async (userId: string, currentPrices: Record<string, number>, totalPortfolioValue?: number): Promise<WalletToken[]> => {
  const holdings = await getHoldingRecordsByUserId(userId);
  const userHoldings = holdings.filter(h => h.quantity > 0);

  // Get all trades for this user to count transactions per token
  const { getTradesByUserId } = await import('../data/database');
  const allTrades = await getTradesByUserId(userId);

  return userHoldings.map(holding => {
    const currentPrice = currentPrices[holding.token_address.toLowerCase()] || holding.average_buy_price;
    const balanceUsd = holding.quantity * currentPrice;
    
    // 未实现利润 = 当前价值 - 当前持仓的买入成本
    // 当前持仓的买入成本 = 当前数量 * 平均买入价格
    const currentHoldingCost = holding.quantity * holding.average_buy_price;
    const unrealizedProfit = balanceUsd - currentHoldingCost;
    const unrealizedProfitPercent = currentHoldingCost > 0 ? (unrealizedProfit / currentHoldingCost) * 100 : 0;
    
    // 总利润 = 未实现利润 + 已实现利润
    // 已实现利润 = 卖出总额 - 卖出部分的成本
    // 卖出部分的成本 = 总买入成本 - 当前持仓成本
    const soldCost = holding.total_buy_usd - currentHoldingCost;
    const realizedProfit = holding.total_sell_usd - soldCost;
    
    // 如果用户没有卖出，总利润 = 未实现利润
    // 如果用户有卖出，总利润 = 未实现利润 + 已实现利润
    const totalProfit = holding.total_sell_usd > 0 ? (unrealizedProfit + realizedProfit) : unrealizedProfit;
    const totalProfitPercent = holding.total_buy_usd > 0 ? ((totalProfit / holding.total_buy_usd) * 100) : 0;
    
    // 持仓比例 = 当前资产价值 / 总资产（包括USDT）
    // 如果传入了totalPortfolioValue（包含USDT），使用它；否则只计算token价值
    const allHoldingsValue = userHoldings.reduce((sum, h) => {
      const price = currentPrices[h.token_address.toLowerCase()] || h.average_buy_price;
      return sum + (h.quantity * price);
    }, 0);
    const portfolioValue = totalPortfolioValue !== undefined ? totalPortfolioValue : allHoldingsValue;
    const holdingPercent = portfolioValue > 0 ? (balanceUsd / portfolioValue) * 100 : 0;

    const holdingDuration = Math.floor((Date.now() - holding.first_buy_time) / (1000 * 60 * 60 * 24)); // days
    const durationStr = holdingDuration === 0 ? '<1d' : `${holdingDuration}d`;

    // Count transactions for this token
    const tokenTrades = allTrades.filter(t => 
      t.token_address?.toLowerCase() === holding.token_address.toLowerCase()
    );
    const transactionCount = tokenTrades.length;

    // Calculate average sell price
    // 总卖出数量 = 总买入数量 - 当前持仓数量
    // 总买入数量 = 总买入金额 / 平均买入价格
    const totalBuyQuantity = holding.total_buy_usd / holding.average_buy_price;
    const totalSellQuantity = totalBuyQuantity - holding.quantity;
    const averageSell = totalSellQuantity > 0 ? holding.total_sell_usd / totalSellQuantity : 0;

    return {
      address: holding.token_address,
      name: holding.token_name,
      symbol: holding.token_symbol,
      image: holding.token_image || '',
      balance: holding.quantity, // 当前持仓数量
      balanceUsd, // 当前持仓价值（USD）
      holdingPercent,
      holdingDuration: durationStr,
      unrealizedProfit,
      unrealizedProfitPercent,
      totalProfit,
      totalProfitPercent,
      totalBuy: holding.total_buy_usd, // 总买入金额
      averageBuy: holding.average_buy_price, // 平均买入价格
      totalSell: holding.total_sell_usd, // 总卖出金额
      averageSell: averageSell, // 平均卖出价格
      transactionCount, // 该代币的交易次数
      lastActive: new Date(holding.last_active_time).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      price: `$${currentPrice.toFixed(7)}`, // 当前价格
      marketCap: currentPrice * 1000000000, // Assuming 1B supply
    };
  });
};

// Get user activities (trades) - using new JSON format
export const getUserActivities = async (userId: string, limit: number = 50): Promise<WalletActivity[]> => {
  const tradeRecords = await getTradeRecordsByUserId(userId);
  const userTrades = tradeRecords
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);

  // Get all trades for this user to find corresponding buy trades
  const allUserTrades = await getTradeRecordsByUserId(userId);
  
  // Get holdings for fallback calculation
  const holdings = await getHoldingRecordsByUserId(userId);

  return userTrades.map(trade => {
    // Calculate profit for SELL trades
    let profit: number | undefined;
    let profitPercent: number | undefined;

    if (trade.side === 'SELL' && trade.token_address) {
      // Find all BUY trades for this token before this SELL trade, sorted by timestamp (oldest first)
      const buyTrades = allUserTrades
        .filter(t => 
          t.side === 'BUY' && 
          t.token_address?.toLowerCase() === trade.token_address?.toLowerCase() &&
          t.timestamp < trade.timestamp
        )
        .sort((a, b) => a.timestamp - b.timestamp); // FIFO: oldest first

      // Calculate total buy cost for the sold quantity using FIFO
      let remainingSellQuantity = trade.base_amount;
      let totalBuyCost = 0;

      for (const buyTrade of buyTrades) {
        if (remainingSellQuantity <= 0) break;
        
        const usedQuantity = Math.min(remainingSellQuantity, buyTrade.base_amount);
        const buyCost = usedQuantity * buyTrade.price; // 买入时的 value = 数量 * 买入价格
        totalBuyCost += buyCost;
        remainingSellQuantity -= usedQuantity;
      }

      // If we couldn't match all sold quantity, use average buy price as fallback
      if (remainingSellQuantity > 0) {
        const holding = holdings.find(
          h => h.token_address.toLowerCase() === trade.token_address?.toLowerCase()
        );
        if (holding) {
          totalBuyCost += remainingSellQuantity * holding.average_buy_price;
        }
      }

      // 利润 = 卖出时的 value - 买入时的 value
      // 卖出时的 value = trade.quote_amount (卖出得到的 USDT)
      // 买入时的 value = totalBuyCost (买入这些代币时花费的 USDT)
      profit = trade.quote_amount - totalBuyCost;
      profitPercent = totalBuyCost > 0 ? (profit / totalBuyCost) * 100 : 0;
    }

    const timestampMs = trade.timestamp * 1000; // Convert from Unix timestamp to milliseconds
    const duration = Math.floor((Date.now() - timestampMs) / (1000 * 60)); // minutes
    let durationStr = '';
    if (duration < 60) {
      durationStr = `${duration}m`;
    } else if (duration < 1440) {
      durationStr = `${Math.floor(duration / 60)}h`;
    } else {
      durationStr = `${Math.floor(duration / 1440)}d`;
    }

    return {
      id: trade.trade_id,
      type: trade.side,
      token: {
        address: trade.token_address || '',
        name: trade.token_name || trade.base_token,
        symbol: trade.base_token,
        image: trade.token_image || '',
      },
      marketCap: trade.price * 1000000000, // Assuming 1B supply
      quantity: trade.base_amount,
      totalUsd: trade.quote_amount,
      profit,
      profitPercent,
      duration: durationStr,
      gasFee: trade.gas_fee || 0,
      timestamp: timestampMs,
    };
  });
};

// Get user USDT balance - using new JSON format
export const getUserBalance = async (userId: string): Promise<number> => {
  try {
    const { getUserById } = await import('../data/database');
    const userRecord = await getUserById(userId);
    return userRecord?.balance || 0;
  } catch (error) {
    console.error('Error getting user balance:', error);
    return 0;
  }
};

// Get user token holding quantity for a specific token - using new JSON format
export const getUserTokenBalance = async (userId: string, tokenAddress: string): Promise<number> => {
  try {
    const holdings = await getHoldingRecordsByUserId(userId);
    const holding = holdings.find(
      h => h.token_address.toLowerCase() === tokenAddress.toLowerCase()
    );
    return holding?.quantity || 0;
  } catch (error) {
    console.error('Error getting user token balance:', error);
    return 0;
  }
};

// Get holdings by userId (for viewing other users' data)
export const getHoldingsByUserId = async (userId: string, currentPrices: Record<string, number>, totalPortfolioValue?: number): Promise<WalletToken[]> => {
  return getUserHoldings(userId, currentPrices, totalPortfolioValue);
};

// Get trades by userId (for viewing other users' data)
export const getTradesByUserId = async (userId: string, limit: number = 50): Promise<WalletActivity[]> => {
  return getUserActivities(userId, limit);
};

