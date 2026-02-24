// Kamino Lending Program ID (Mainnet)
export const KAMINO_LENDING_PROGRAM_ID = 'KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD';

// Kamino Main Market Address
export const KAMINO_MAIN_MARKET = '5wJeMrUYECGq41fxRESKALVcHnNX26TAWy4W98yULsua';

// Kamino Savings Market Address
export const KAMINO_SAVINGS_MARKET = '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF';

// Kamino instruction discriminators (Anchor 8-byte format)
// These are SHA256("global:<instruction_name>")[0..8]
export const KAMINO_DISCRIMINATORS = {
  // depositReserveLiquidityAndObligationCollateral
  deposit: new Uint8Array([129, 199, 4, 2, 222, 39, 26, 46]),
  // withdrawObligationCollateralAndRedeemReserveCollateral
  withdraw: new Uint8Array([75, 93, 93, 220, 34, 150, 218, 196]),
  // borrowObligationLiquidity
  borrow: new Uint8Array([121, 127, 18, 204, 73, 245, 225, 65]),
  // repayObligationLiquidity
  repay: new Uint8Array([145, 178, 13, 225, 76, 240, 147, 72]),
  // refreshReserve
  refreshReserve: new Uint8Array([2, 218, 138, 235, 79, 201, 25, 102]),
  // refreshObligation
  refreshObligation: new Uint8Array([33, 132, 147, 228, 151, 192, 72, 89]),
  // refreshObligationFarmsForReserve
  refreshObligationFarmsForReserve: new Uint8Array([140, 144, 253, 21, 10, 74, 248, 3]),
  // initObligationFarmsForReserve
  initObligationFarmsForReserve: new Uint8Array([136, 63, 15, 186, 211, 152, 168, 164]),
  // initObligation
  initObligation: new Uint8Array([251, 10, 231, 76, 27, 11, 159, 96]),
  // initUserMetadata
  initUserMetadata: new Uint8Array([117, 169, 176, 69, 197, 23, 15, 162]),
} as const;

// Sysvar addresses
export const SYSVAR_INSTRUCTIONS_ID = 'Sysvar1nstructions1111111111111111111111111';
export const SYSVAR_RENT_ID = 'SysvarRent111111111111111111111111111111111';

// Default public key (all zeros, used in Kamino instructions)
export const DEFAULT_PUBKEY = '11111111111111111111111111111111';

// Obligation tag for VanillaObligation
export const VANILLA_OBLIGATION_TAG = 0;

// Token Program IDs
export const SPL_TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const ASSOCIATED_TOKEN_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

// System Program
export const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';

// Compute Budget Program
export const COMPUTE_BUDGET_PROGRAM_ID = 'ComputeBudget111111111111111111111111111111';
