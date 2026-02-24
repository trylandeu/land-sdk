import {
  KAMINO_LENDING_PROGRAM_ID,
  KAMINO_MAIN_MARKET,
  KAMINO_DISCRIMINATORS,
  SYSVAR_INSTRUCTIONS_ID,
  SYSVAR_RENT_ID,
  SYSTEM_PROGRAM_ID,
  DEFAULT_PUBKEY,
  COMPUTE_BUDGET_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SPL_TOKEN_PROGRAM_ID,
} from './constants.js';
import type { KaminoInstruction, KaminoReserveConfig } from './types.js';
import { getCachedLendingMarketAuthority, deriveUserMetadataPda } from './pda.js';
import { deriveATA } from './solana/ata.js';

/**
 * Serialize a u64 value as little-endian bytes.
 */
function serializeU64(value: bigint): Uint8Array {
  const buffer = new Uint8Array(8);
  const view = new DataView(buffer.buffer);
  view.setBigUint64(0, value, true);
  return buffer;
}

/**
 * Build initUserMetadata instruction.
 */
export function buildInitUserMetadataInstruction(
  userPublicKey: string,
  feePayerAddress: string,
  userMetadataPda: string
): KaminoInstruction {
  const data = new Uint8Array(40);
  data.set(KAMINO_DISCRIMINATORS.initUserMetadata);

  return {
    programId: KAMINO_LENDING_PROGRAM_ID,
    accounts: [
      { pubkey: userPublicKey, isSigner: true, isWritable: false },
      { pubkey: feePayerAddress, isSigner: true, isWritable: true },
      { pubkey: userMetadataPda, isSigner: false, isWritable: true },
      { pubkey: KAMINO_LENDING_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_ID, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  };
}

/**
 * Build refreshReserve instruction.
 */
export function buildRefreshReserveInstruction(
  reserve: KaminoReserveConfig,
  marketAddress: string = KAMINO_MAIN_MARKET
): KaminoInstruction {
  const data = new Uint8Array(KAMINO_DISCRIMINATORS.refreshReserve);

  return {
    programId: KAMINO_LENDING_PROGRAM_ID,
    accounts: [
      { pubkey: reserve.address, isSigner: false, isWritable: true },
      { pubkey: marketAddress, isSigner: false, isWritable: false },
      { pubkey: reserve.pythOracle, isSigner: false, isWritable: false },
      { pubkey: reserve.switchboardPriceOracle, isSigner: false, isWritable: false },
      { pubkey: reserve.switchboardTwapOracle, isSigner: false, isWritable: false },
      { pubkey: reserve.scopePrices, isSigner: false, isWritable: false },
    ],
    data,
  };
}

/**
 * Build refreshObligation instruction.
 */
export function buildRefreshObligationInstruction(
  obligationAddress: string,
  reserves: KaminoReserveConfig[],
  marketAddress: string = KAMINO_MAIN_MARKET
): KaminoInstruction {
  const data = new Uint8Array(KAMINO_DISCRIMINATORS.refreshObligation);

  const accounts: KaminoInstruction['accounts'] = [
    { pubkey: marketAddress, isSigner: false, isWritable: false },
    { pubkey: obligationAddress, isSigner: false, isWritable: true },
  ];

  for (const reserve of reserves) {
    accounts.push({ pubkey: reserve.address, isSigner: false, isWritable: true });
  }

  return {
    programId: KAMINO_LENDING_PROGRAM_ID,
    accounts,
    data,
  };
}

/**
 * Build refreshObligationFarmsForReserve instruction.
 */
export function buildRefreshObligationFarmsForReserveInstruction(
  params: {
    mode: number;
    farmsProgramId: string;
    reserveFarmState: string;
    obligationFarmUserState: string;
  },
  crank: string,
  obligationAddress: string,
  reserve: KaminoReserveConfig,
  marketAddress: string = KAMINO_MAIN_MARKET
): KaminoInstruction {
  const data = new Uint8Array(9);
  data.set(KAMINO_DISCRIMINATORS.refreshObligationFarmsForReserve);
  data[8] = params.mode;

  const lendingMarketAuthority = getCachedLendingMarketAuthority(marketAddress);

  return {
    programId: KAMINO_LENDING_PROGRAM_ID,
    accounts: [
      { pubkey: crank, isSigner: true, isWritable: true },
      { pubkey: obligationAddress, isSigner: false, isWritable: false },
      { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
      { pubkey: reserve.address, isSigner: false, isWritable: false },
      { pubkey: params.reserveFarmState, isSigner: false, isWritable: true },
      { pubkey: params.obligationFarmUserState, isSigner: false, isWritable: true },
      { pubkey: marketAddress, isSigner: false, isWritable: false },
      { pubkey: params.farmsProgramId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_ID, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  };
}

/**
 * Build initObligationFarmsForReserve instruction.
 */
export function buildInitObligationFarmsForReserveInstruction(
  params: {
    mode: number;
    farmsProgramId: string;
    reserveFarmState: string;
    obligationFarmUserState: string;
  },
  payer: string,
  owner: string,
  obligationAddress: string,
  reserve: KaminoReserveConfig,
  marketAddress: string = KAMINO_MAIN_MARKET
): KaminoInstruction {
  const data = new Uint8Array(9);
  data.set(KAMINO_DISCRIMINATORS.initObligationFarmsForReserve);
  data[8] = params.mode;

  const lendingMarketAuthority = getCachedLendingMarketAuthority(marketAddress);

  return {
    programId: KAMINO_LENDING_PROGRAM_ID,
    accounts: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: obligationAddress, isSigner: false, isWritable: true },
      { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
      { pubkey: reserve.address, isSigner: false, isWritable: true },
      { pubkey: params.reserveFarmState, isSigner: false, isWritable: true },
      { pubkey: params.obligationFarmUserState, isSigner: false, isWritable: true },
      { pubkey: marketAddress, isSigner: false, isWritable: false },
      { pubkey: params.farmsProgramId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_ID, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  };
}

/**
 * Build initObligation instruction.
 */
export function buildInitObligationInstruction(
  userPublicKey: string,
  feePayerAddress: string,
  obligationAddress: string,
  marketAddress: string = KAMINO_MAIN_MARKET
): KaminoInstruction {
  const data = new Uint8Array(10);
  data.set(KAMINO_DISCRIMINATORS.initObligation);
  data[8] = 0; // tag = 0 (VanillaObligation)
  data[9] = 0; // id = 0

  const userMetadataPda = deriveUserMetadataPda(userPublicKey);

  return {
    programId: KAMINO_LENDING_PROGRAM_ID,
    accounts: [
      { pubkey: userPublicKey, isSigner: true, isWritable: false },
      { pubkey: feePayerAddress, isSigner: true, isWritable: true },
      { pubkey: obligationAddress, isSigner: false, isWritable: true },
      { pubkey: marketAddress, isSigner: false, isWritable: false },
      { pubkey: DEFAULT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: DEFAULT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: userMetadataPda, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_ID, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  };
}

/**
 * Build depositReserveLiquidityAndObligationCollateral instruction.
 */
export function buildDepositInstruction(
  userPublicKey: string,
  obligationAddress: string,
  reserve: KaminoReserveConfig,
  amount: bigint,
  marketAddress: string = KAMINO_MAIN_MARKET
): KaminoInstruction {
  const data = new Uint8Array(16);
  data.set(KAMINO_DISCRIMINATORS.deposit);
  data.set(serializeU64(amount), 8);

  const userSourceLiquidity = deriveATA(userPublicKey, reserve.liquidityMint, reserve.liquidityTokenProgram);
  const lendingMarketAuthority = getCachedLendingMarketAuthority(marketAddress);

  return {
    programId: KAMINO_LENDING_PROGRAM_ID,
    accounts: [
      { pubkey: userPublicKey, isSigner: true, isWritable: true },
      { pubkey: obligationAddress, isSigner: false, isWritable: true },
      { pubkey: marketAddress, isSigner: false, isWritable: false },
      { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
      { pubkey: reserve.address, isSigner: false, isWritable: true },
      { pubkey: reserve.liquidityMint, isSigner: false, isWritable: true },
      { pubkey: reserve.liquiditySupply, isSigner: false, isWritable: true },
      { pubkey: reserve.collateralMint, isSigner: false, isWritable: true },
      { pubkey: reserve.collateralSupply, isSigner: false, isWritable: true },
      { pubkey: userSourceLiquidity, isSigner: false, isWritable: true },
      { pubkey: DEFAULT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: reserve.collateralTokenProgram, isSigner: false, isWritable: false },
      { pubkey: reserve.liquidityTokenProgram, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_INSTRUCTIONS_ID, isSigner: false, isWritable: false },
    ],
    data,
  };
}

/**
 * Build withdrawObligationCollateralAndRedeemReserveCollateral instruction.
 */
export function buildWithdrawInstruction(
  userPublicKey: string,
  obligationAddress: string,
  reserve: KaminoReserveConfig,
  amount: bigint,
  marketAddress: string = KAMINO_MAIN_MARKET
): KaminoInstruction {
  const data = new Uint8Array(16);
  data.set(KAMINO_DISCRIMINATORS.withdraw);
  data.set(serializeU64(amount), 8);

  const userDestinationLiquidity = deriveATA(userPublicKey, reserve.liquidityMint, reserve.liquidityTokenProgram);
  const lendingMarketAuthority = getCachedLendingMarketAuthority(marketAddress);

  return {
    programId: KAMINO_LENDING_PROGRAM_ID,
    accounts: [
      { pubkey: userPublicKey, isSigner: true, isWritable: true },
      { pubkey: obligationAddress, isSigner: false, isWritable: true },
      { pubkey: marketAddress, isSigner: false, isWritable: false },
      { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
      { pubkey: reserve.address, isSigner: false, isWritable: true },
      { pubkey: reserve.liquidityMint, isSigner: false, isWritable: true },
      { pubkey: reserve.collateralSupply, isSigner: false, isWritable: true },
      { pubkey: reserve.collateralMint, isSigner: false, isWritable: true },
      { pubkey: reserve.liquiditySupply, isSigner: false, isWritable: true },
      { pubkey: userDestinationLiquidity, isSigner: false, isWritable: true },
      { pubkey: DEFAULT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: reserve.collateralTokenProgram, isSigner: false, isWritable: false },
      { pubkey: reserve.liquidityTokenProgram, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_INSTRUCTIONS_ID, isSigner: false, isWritable: false },
    ],
    data,
  };
}

/**
 * Build borrowObligationLiquidity instruction.
 */
export function buildBorrowInstruction(
  userPublicKey: string,
  obligationAddress: string,
  reserve: KaminoReserveConfig,
  amount: bigint,
  marketAddress: string = KAMINO_MAIN_MARKET
): KaminoInstruction {
  const data = new Uint8Array(16);
  data.set(KAMINO_DISCRIMINATORS.borrow);
  data.set(serializeU64(amount), 8);

  const userDestinationLiquidity = deriveATA(userPublicKey, reserve.liquidityMint, reserve.liquidityTokenProgram);
  const lendingMarketAuthority = getCachedLendingMarketAuthority(marketAddress);
  const referrerTokenState = KAMINO_LENDING_PROGRAM_ID;

  return {
    programId: KAMINO_LENDING_PROGRAM_ID,
    accounts: [
      { pubkey: userPublicKey, isSigner: true, isWritable: false },
      { pubkey: obligationAddress, isSigner: false, isWritable: true },
      { pubkey: marketAddress, isSigner: false, isWritable: false },
      { pubkey: lendingMarketAuthority, isSigner: false, isWritable: false },
      { pubkey: reserve.address, isSigner: false, isWritable: true },
      { pubkey: reserve.liquidityMint, isSigner: false, isWritable: true },
      { pubkey: reserve.liquiditySupply, isSigner: false, isWritable: true },
      { pubkey: reserve.liquidityFeeReceiver, isSigner: false, isWritable: true },
      { pubkey: userDestinationLiquidity, isSigner: false, isWritable: true },
      { pubkey: referrerTokenState, isSigner: false, isWritable: false },
      { pubkey: reserve.liquidityTokenProgram, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_INSTRUCTIONS_ID, isSigner: false, isWritable: false },
    ],
    data,
  };
}

/**
 * Build repayObligationLiquidity instruction.
 */
export function buildRepayInstruction(
  userPublicKey: string,
  obligationAddress: string,
  reserve: KaminoReserveConfig,
  amount: bigint,
  marketAddress: string = KAMINO_MAIN_MARKET
): KaminoInstruction {
  const data = new Uint8Array(16);
  data.set(KAMINO_DISCRIMINATORS.repay);
  data.set(serializeU64(amount), 8);

  const userSourceLiquidity = deriveATA(userPublicKey, reserve.liquidityMint, reserve.liquidityTokenProgram);

  return {
    programId: KAMINO_LENDING_PROGRAM_ID,
    accounts: [
      { pubkey: userPublicKey, isSigner: true, isWritable: false },
      { pubkey: obligationAddress, isSigner: false, isWritable: true },
      { pubkey: marketAddress, isSigner: false, isWritable: false },
      { pubkey: reserve.address, isSigner: false, isWritable: true },
      { pubkey: reserve.liquidityMint, isSigner: false, isWritable: true },
      { pubkey: reserve.liquiditySupply, isSigner: false, isWritable: true },
      { pubkey: userSourceLiquidity, isSigner: false, isWritable: true },
      { pubkey: reserve.liquidityTokenProgram, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_INSTRUCTIONS_ID, isSigner: false, isWritable: false },
    ],
    data,
  };
}

/**
 * Build compute budget instructions (SetComputeUnitLimit + SetComputeUnitPrice).
 */
export function buildComputeBudgetInstructions(
  priorityFeeMicroLamports: bigint,
  computeUnitLimit: number = 400_000
): KaminoInstruction[] {
  const limitData = new Uint8Array(5);
  limitData[0] = 2; // discriminator for SetComputeUnitLimit
  new DataView(limitData.buffer).setUint32(1, computeUnitLimit, true);

  const limitInstruction: KaminoInstruction = {
    programId: COMPUTE_BUDGET_PROGRAM_ID,
    accounts: [],
    data: limitData,
  };

  const priceData = new Uint8Array(9);
  priceData[0] = 3; // discriminator for SetComputeUnitPrice
  new DataView(priceData.buffer).setBigUint64(1, priorityFeeMicroLamports, true);

  const priceInstruction: KaminoInstruction = {
    programId: COMPUTE_BUDGET_PROGRAM_ID,
    accounts: [],
    data: priceData,
  };

  return [limitInstruction, priceInstruction];
}

/**
 * Build CreateAssociatedTokenAccountIdempotent instruction.
 * Supports both Token and Token-2022 programs.
 */
export function buildCreateAtaIdempotentInstruction(
  payer: string,
  owner: string,
  mint: string,
  tokenProgram: string = SPL_TOKEN_PROGRAM_ID
): KaminoInstruction {
  const ata = deriveATA(owner, mint, tokenProgram);

  return {
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    accounts: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: tokenProgram, isSigner: false, isWritable: false },
    ],
    data: new Uint8Array([1]), // CreateIdempotent discriminator
  };
}
