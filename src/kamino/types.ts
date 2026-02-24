/**
 * Instruction representation for transaction building.
 */
export interface KaminoInstruction {
  programId: string;
  accounts: Array<{
    pubkey: string;
    isSigner: boolean;
    isWritable: boolean;
  }>;
  data: Uint8Array;
}

/**
 * Reserve configuration extracted from on-chain account data.
 */
export interface KaminoReserveConfig {
  address: string;
  liquidityMint: string;
  liquidityTokenProgram: string;
  liquiditySupply: string;
  liquidityFeeReceiver: string;
  collateralMint: string;
  collateralTokenProgram: string;
  collateralSupply: string;
  pythOracle: string;
  switchboardPriceOracle: string;
  switchboardTwapOracle: string;
  scopePrices: string;
  farmCollateral: string;
  farmDebt: string;
  availableAmount: string;
  borrowedAmountSf: string;
  accumulatedProtocolFeesSf: string;
  accumulatedReferrerFeesSf: string;
  pendingReferrerFeesSf: string;
  mintTotalSupply: string;
}

/**
 * Kamino lending action types.
 */
export type KaminoAction = 'deposit' | 'withdraw' | 'borrow' | 'repay';

/**
 * Farm configuration for reserve-specific farm operations.
 */
export interface KaminoFarmConfig {
  farmsProgramId: string;
  reserveFarmState: string;
  obligationFarmUserState: string;
  mode: number;
  needsInitObligationFarm: boolean;
}

/**
 * Parameters for building Kamino instructions (no transaction-level params).
 */
export interface BuildKaminoInstructionsParams {
  action: KaminoAction;
  userPublicKey: string;
  feePayerAddress: string;
  obligationAddress: string;
  reserve: KaminoReserveConfig;
  obligationReserves: KaminoReserveConfig[];
  amount: bigint;
  needsInitObligation: boolean;
  needsInitUserMetadata: boolean;
  marketAddress?: string;
  farmConfig?: KaminoFarmConfig;
}

/**
 * Parameters for building a complete Kamino transaction.
 */
export interface BuildKaminoTransactionParams extends BuildKaminoInstructionsParams {
  recentBlockhash: string;
  priorityFeeMicroLamports?: bigint;
  computeUnitLimit?: number;
}

/**
 * Parameters for building activation instructions.
 */
export interface BuildActivationInstructionsParams {
  userPublicKey: string;
  feePayerAddress: string;
  obligationAddress: string;
  needsInitObligation: boolean;
  needsInitUserMetadata: boolean;
  marketAddress?: string;
}

/**
 * Parameters for building a complete activation transaction.
 */
export interface BuildActivationTransactionParams extends BuildActivationInstructionsParams {
  recentBlockhash: string;
  priorityFeeMicroLamports?: bigint;
}

/**
 * Parameters for compiling a transaction from raw instructions.
 */
export interface CompileTransactionParams {
  instructions: KaminoInstruction[];
  feePayerAddress: string;
  signers: string[];
  recentBlockhash: string;
}

/**
 * Result of building a Kamino transaction.
 */
export interface KaminoTransactionResult {
  transactionBase64: string;
  signers: string[];
}
