import bs58 from 'bs58';
import { KAMINO_LENDING_PROGRAM_ID, SPL_TOKEN_PROGRAM_ID } from './constants.js';
import type { KaminoReserveConfig } from './types.js';

// Core offsets for liquidity/collateral fields
export const RESERVE_OFFSETS = {
  LENDING_MARKET: 32,
  FARM_COLLATERAL: 64,
  FARM_DEBT: 96,
  LIQUIDITY_MINT: 128,
  LIQUIDITY_SUPPLY: 160,
  LIQUIDITY_FEE_VAULT: 192,
  LIQUIDITY_AVAILABLE_AMOUNT: 128 + 96, // = 224 (u64, 8 bytes)
  LIQUIDITY_BORROWED_AMOUNT_SF: 128 + 104, // = 232 (u128, 16 bytes)
  LIQUIDITY_ACCUMULATED_PROTOCOL_FEES_SF: 128 + 216, // = 344 (u128, 16 bytes)
  LIQUIDITY_ACCUMULATED_REFERRER_FEES_SF: 128 + 232, // = 360 (u128, 16 bytes)
  LIQUIDITY_PENDING_REFERRER_FEES_SF: 128 + 248, // = 376 (u128, 16 bytes)
  LIQUIDITY_TOKEN_PROGRAM: 128 + 280, // = 408
  COLLATERAL_MINT: 2560,
  COLLATERAL_MINT_TOTAL_SUPPLY: 2560 + 32, // = 2592 (u64, 8 bytes)
  COLLATERAL_SUPPLY: 2600,
} as const;

const CONFIG_START = 4856;
const TOKEN_INFO_OFFSET_IN_CONFIG = 176;
const TOKEN_INFO_START = CONFIG_START + TOKEN_INFO_OFFSET_IN_CONFIG; // 5032

// Oracle offsets (absolute from reserve account start)
export const ORACLE_OFFSETS = {
  SCOPE_PRICE_FEED: TOKEN_INFO_START + 80,   // 5112
  SWITCHBOARD_PRICE: TOKEN_INFO_START + 128,  // 5160
  SWITCHBOARD_TWAP: TOKEN_INFO_START + 160,   // 5192
  PYTH_PRICE: TOKEN_INFO_START + 192,         // 5224
} as const;

// Enough data to parse all fields used by parseReserveAccount.
export const RESERVE_DATA_SLICE_LENGTH = ORACLE_OFFSETS.PYTH_PRICE + 32;

// Default pubkey (all zeros in base58)
const DEFAULT_PUBKEY = '11111111111111111111111111111111';

/**
 * Safely extract a pubkey from data at a given offset.
 */
export function extractPubkey(data: Uint8Array, offset: number): string {
  if (offset + 32 > data.length) {
    return DEFAULT_PUBKEY;
  }
  return bs58.encode(data.slice(offset, offset + 32));
}

/**
 * Extract a u64 value from data at a given offset.
 */
export function extractU64(data: Uint8Array, offset: number): string {
  if (offset + 8 > data.length) {
    return '0';
  }
  const view = new DataView(data.buffer, data.byteOffset + offset, 8);
  return view.getBigUint64(0, true).toString();
}

/**
 * Extract a u128 value from data at a given offset.
 */
export function extractU128(data: Uint8Array, offset: number): string {
  if (offset + 16 > data.length) {
    return '0';
  }
  const view = new DataView(data.buffer, data.byteOffset + offset, 16);
  const low = view.getBigUint64(0, true);
  const high = view.getBigUint64(8, true);
  return (high * BigInt('18446744073709551616') + low).toString();
}

/**
 * Extract oracle pubkey, returning program ID if oracle is disabled (null/default).
 */
function extractOraclePubkey(data: Uint8Array, offset: number): string {
  const pubkey = extractPubkey(data, offset);
  if (pubkey === DEFAULT_PUBKEY) {
    return KAMINO_LENDING_PROGRAM_ID;
  }
  return pubkey;
}

/**
 * Parse reserve account data to extract relevant fields.
 */
export function parseReserveAccount(data: Uint8Array, reserveAddress: string): KaminoReserveConfig {
  const liquidityMint = extractPubkey(data, RESERVE_OFFSETS.LIQUIDITY_MINT);
  const liquiditySupply = extractPubkey(data, RESERVE_OFFSETS.LIQUIDITY_SUPPLY);
  const liquidityFeeReceiver = extractPubkey(data, RESERVE_OFFSETS.LIQUIDITY_FEE_VAULT);
  const farmCollateral = extractPubkey(data, RESERVE_OFFSETS.FARM_COLLATERAL);
  const farmDebt = extractPubkey(data, RESERVE_OFFSETS.FARM_DEBT);

  const collateralMint = extractPubkey(data, RESERVE_OFFSETS.COLLATERAL_MINT);
  const collateralSupply = extractPubkey(data, RESERVE_OFFSETS.COLLATERAL_SUPPLY);

  const liquidityTokenProgram = extractPubkey(data, RESERVE_OFFSETS.LIQUIDITY_TOKEN_PROGRAM);
  const collateralTokenProgram = SPL_TOKEN_PROGRAM_ID;

  const pythOracle = extractOraclePubkey(data, ORACLE_OFFSETS.PYTH_PRICE);
  const switchboardPriceOracle = extractOraclePubkey(data, ORACLE_OFFSETS.SWITCHBOARD_PRICE);
  const switchboardTwapOracle = extractOraclePubkey(data, ORACLE_OFFSETS.SWITCHBOARD_TWAP);
  const scopePrices = extractOraclePubkey(data, ORACLE_OFFSETS.SCOPE_PRICE_FEED);

  const availableAmount = extractU64(data, RESERVE_OFFSETS.LIQUIDITY_AVAILABLE_AMOUNT);
  const borrowedAmountSf = extractU128(data, RESERVE_OFFSETS.LIQUIDITY_BORROWED_AMOUNT_SF);
  const accumulatedProtocolFeesSf = extractU128(data, RESERVE_OFFSETS.LIQUIDITY_ACCUMULATED_PROTOCOL_FEES_SF);
  const accumulatedReferrerFeesSf = extractU128(data, RESERVE_OFFSETS.LIQUIDITY_ACCUMULATED_REFERRER_FEES_SF);
  const pendingReferrerFeesSf = extractU128(data, RESERVE_OFFSETS.LIQUIDITY_PENDING_REFERRER_FEES_SF);
  const mintTotalSupply = extractU64(data, RESERVE_OFFSETS.COLLATERAL_MINT_TOTAL_SUPPLY);

  return {
    address: reserveAddress,
    liquidityMint,
    liquidityTokenProgram,
    liquiditySupply,
    liquidityFeeReceiver,
    collateralMint,
    collateralTokenProgram,
    collateralSupply,
    pythOracle,
    switchboardPriceOracle,
    switchboardTwapOracle,
    scopePrices,
    farmCollateral,
    farmDebt,
    availableAmount,
    borrowedAmountSf,
    accumulatedProtocolFeesSf,
    accumulatedReferrerFeesSf,
    pendingReferrerFeesSf,
    mintTotalSupply,
  };
}

// Scaling factor for Sf (scaled fraction) fields: 2^60
const SF_SCALE = BigInt('1152921504606846976'); // 2^60

/**
 * Calculate the collateral exchange rate for a reserve.
 */
export function getCollateralExchangeRate(reserve: KaminoReserveConfig): number {
  const availableAmount = BigInt(reserve.availableAmount);
  const borrowedAmountSf = BigInt(reserve.borrowedAmountSf);
  const accumulatedProtocolFeesSf = BigInt(reserve.accumulatedProtocolFeesSf);
  const accumulatedReferrerFeesSf = BigInt(reserve.accumulatedReferrerFeesSf);
  const pendingReferrerFeesSf = BigInt(reserve.pendingReferrerFeesSf);
  const mintTotalSupply = BigInt(reserve.mintTotalSupply);

  const borrowedAmount = borrowedAmountSf / SF_SCALE;
  const protocolFees = accumulatedProtocolFeesSf / SF_SCALE;
  const referrerFees = accumulatedReferrerFeesSf / SF_SCALE;
  const pendingFees = pendingReferrerFeesSf / SF_SCALE;

  const totalSupply = availableAmount + borrowedAmount - protocolFees - referrerFees - pendingFees;

  if (totalSupply === 0n || mintTotalSupply === 0n) {
    return 1.0;
  }

  return Number(mintTotalSupply) / Number(totalSupply);
}

/**
 * Convert liquidity amount to collateral amount (cTokens).
 */
export function liquidityToCollateral(reserve: KaminoReserveConfig, liquidityAmount: bigint): bigint {
  const exchangeRate = getCollateralExchangeRate(reserve);
  return BigInt(Math.ceil(Number(liquidityAmount) * exchangeRate));
}

/**
 * Convert collateral amount (cTokens) to liquidity amount.
 */
export function collateralToLiquidity(reserve: KaminoReserveConfig, collateralAmount: bigint): bigint {
  const exchangeRate = getCollateralExchangeRate(reserve);
  if (exchangeRate === 0) {
    return 0n;
  }
  return BigInt(Math.floor(Number(collateralAmount) / exchangeRate));
}
