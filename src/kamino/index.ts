// Constants
export {
  KAMINO_LENDING_PROGRAM_ID,
  KAMINO_MAIN_MARKET,
  KAMINO_SAVINGS_MARKET,
  KAMINO_DISCRIMINATORS,
  SYSVAR_INSTRUCTIONS_ID,
  SYSVAR_RENT_ID,
  DEFAULT_PUBKEY,
  VANILLA_OBLIGATION_TAG,
  SPL_TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  COMPUTE_BUDGET_PROGRAM_ID,
} from './constants.js';

// Types
export type {
  KaminoInstruction,
  KaminoReserveConfig,
  KaminoAction,
  KaminoFarmConfig,
  BuildKaminoInstructionsParams,
  BuildKaminoTransactionParams,
  BuildActivationInstructionsParams,
  BuildActivationTransactionParams,
  CompileTransactionParams,
  KaminoTransactionResult,
} from './types.js';

// Instructions
export {
  buildInitUserMetadataInstruction,
  buildRefreshReserveInstruction,
  buildRefreshObligationInstruction,
  buildRefreshObligationFarmsForReserveInstruction,
  buildInitObligationFarmsForReserveInstruction,
  buildInitObligationInstruction,
  buildDepositInstruction,
  buildWithdrawInstruction,
  buildBorrowInstruction,
  buildRepayInstruction,
  buildComputeBudgetInstructions,
  buildCreateAtaIdempotentInstruction,
} from './instructions.js';

// PDA derivation
export {
  deriveLendingMarketAuthority,
  deriveObligationPda,
  deriveUserDestinationCollateral,
  deriveReferrerTokenState,
  deriveObligationFarmUserStatePda,
  deriveUserMetadataPda,
  getCachedLendingMarketAuthority,
} from './pda.js';

// Transaction building
export {
  buildKaminoInstructions,
  buildKaminoTransaction,
  buildActivationInstructions,
  buildActivationTransaction,
  compileTransaction,
} from './transaction.js';

// Reserve parsing
export {
  parseReserveAccount,
  getCollateralExchangeRate,
  liquidityToCollateral,
  collateralToLiquidity,
  RESERVE_OFFSETS,
  ORACLE_OFFSETS,
  RESERVE_DATA_SLICE_LENGTH,
  extractPubkey,
  extractU64,
  extractU128,
} from './reserve.js';

// Solana utilities
export {
  findProgramAddressSync,
  createProgramAddress,
  deriveATA,
  compileInstructions,
  buildTransactionBytes,
  bytesToBase64,
  base64ToBytes,
  type CompiledInstruction,
  type TransactionHeader,
  type AddressTableLookup,
  type CompileInstructionsResult,
} from './solana/index.js';
