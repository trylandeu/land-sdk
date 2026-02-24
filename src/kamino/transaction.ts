import { KAMINO_MAIN_MARKET } from './constants.js';
import type {
  KaminoInstruction,
  KaminoTransactionResult,
  BuildKaminoInstructionsParams,
  BuildKaminoTransactionParams,
  BuildActivationInstructionsParams,
  BuildActivationTransactionParams,
  CompileTransactionParams,
} from './types.js';
import { deriveUserMetadataPda } from './pda.js';
import {
  buildRefreshReserveInstruction,
  buildRefreshObligationInstruction,
  buildRefreshObligationFarmsForReserveInstruction,
  buildInitObligationFarmsForReserveInstruction,
  buildInitUserMetadataInstruction,
  buildInitObligationInstruction,
  buildDepositInstruction,
  buildWithdrawInstruction,
  buildBorrowInstruction,
  buildRepayInstruction,
  buildComputeBudgetInstructions,
  buildCreateAtaIdempotentInstruction,
} from './instructions.js';
import { compileInstructions, buildTransactionBytes, bytesToBase64 } from './solana/compile.js';

const DEFAULT_COMPUTE_UNITS = 400_000;
const DEFAULT_PRIORITY_FEE_MICRO_LAMPORTS = 100_000n;

/**
 * Build the ordered Kamino instruction list WITHOUT compute budget or fee instructions.
 */
export function buildKaminoInstructions(params: BuildKaminoInstructionsParams): KaminoInstruction[] {
  const {
    action,
    userPublicKey,
    feePayerAddress,
    obligationAddress,
    reserve,
    obligationReserves,
    amount,
    needsInitObligation,
    needsInitUserMetadata,
    farmConfig,
  } = params;
  const marketAddress = params.marketAddress ?? KAMINO_MAIN_MARKET;

  const instructions: KaminoInstruction[] = [];

  // 1. Init user metadata (if first-time user, deposit only)
  if (needsInitUserMetadata && action === 'deposit') {
    const userMetadataPda = deriveUserMetadataPda(userPublicKey);
    instructions.push(buildInitUserMetadataInstruction(userPublicKey, feePayerAddress, userMetadataPda));
  }

  // 2. Init obligation (if first deposit)
  if (needsInitObligation && action === 'deposit') {
    instructions.push(
      buildInitObligationInstruction(userPublicKey, feePayerAddress, obligationAddress, marketAddress)
    );
  }

  // 3. Token ATA creation (must be before refresh instructions)
  switch (action) {
    case 'deposit':
    case 'withdraw':
    case 'borrow':
      instructions.push(
        buildCreateAtaIdempotentInstruction(feePayerAddress, userPublicKey, reserve.liquidityMint, reserve.liquidityTokenProgram)
      );
      break;
  }

  // 4. Init obligation for farm (if needed)
  if (farmConfig?.needsInitObligationFarm) {
    instructions.push(
      buildInitObligationFarmsForReserveInstruction(
        farmConfig,
        feePayerAddress,
        userPublicKey,
        obligationAddress,
        reserve,
        marketAddress
      )
    );
  }

  // 5-6. Refresh reserves
  for (const depositReserve of obligationReserves.filter(r => r.address !== reserve.address)) {
    instructions.push(buildRefreshReserveInstruction(depositReserve, marketAddress));
  }
  instructions.push(buildRefreshReserveInstruction(reserve, marketAddress));

  // 7. Refresh obligation
  const reservesForRefresh = needsInitObligation ? [] : obligationReserves;
  instructions.push(buildRefreshObligationInstruction(obligationAddress, reservesForRefresh, marketAddress));

  // 8. Refresh obligation farms (before action)
  if (farmConfig) {
    instructions.push(
      buildRefreshObligationFarmsForReserveInstruction(
        farmConfig,
        feePayerAddress,
        obligationAddress,
        reserve,
        marketAddress
      )
    );
  }

  // 9. Main action instruction
  switch (action) {
    case 'deposit':
      instructions.push(buildDepositInstruction(userPublicKey, obligationAddress, reserve, amount, marketAddress));
      break;
    case 'withdraw':
      instructions.push(buildWithdrawInstruction(userPublicKey, obligationAddress, reserve, amount, marketAddress));
      break;
    case 'borrow':
      instructions.push(buildBorrowInstruction(userPublicKey, obligationAddress, reserve, amount, marketAddress));
      break;
    case 'repay':
      instructions.push(buildRepayInstruction(userPublicKey, obligationAddress, reserve, amount, marketAddress));
      break;
  }

  // 10. Post-action farm refresh
  if (farmConfig) {
    instructions.push(
      buildRefreshObligationFarmsForReserveInstruction(
        farmConfig,
        feePayerAddress,
        obligationAddress,
        reserve,
        marketAddress
      )
    );
  }

  return instructions;
}

/**
 * Build a complete Kamino transaction (compute budget + Kamino instructions, compiled to base64).
 */
export function buildKaminoTransaction(params: BuildKaminoTransactionParams): KaminoTransactionResult {
  const {
    recentBlockhash,
    feePayerAddress,
    userPublicKey,
    priorityFeeMicroLamports = DEFAULT_PRIORITY_FEE_MICRO_LAMPORTS,
    computeUnitLimit = DEFAULT_COMPUTE_UNITS,
  } = params;

  const kaminoIxs = buildKaminoInstructions(params);

  const allInstructions: KaminoInstruction[] = [
    ...buildComputeBudgetInstructions(priorityFeeMicroLamports, computeUnitLimit),
    ...kaminoIxs,
  ];

  return compileAndBuildTransaction({
    instructions: allInstructions,
    feePayerAddress,
    signers: [feePayerAddress, userPublicKey],
    recentBlockhash,
  });
}

/**
 * Build activation instructions (InitUserMetadata + InitObligation) without compute budget or fees.
 */
export function buildActivationInstructions(params: BuildActivationInstructionsParams): KaminoInstruction[] {
  const {
    userPublicKey,
    feePayerAddress,
    obligationAddress,
    needsInitObligation,
    needsInitUserMetadata,
  } = params;
  const marketAddress = params.marketAddress ?? KAMINO_MAIN_MARKET;

  const instructions: KaminoInstruction[] = [];

  if (needsInitUserMetadata) {
    const userMetadataPda = deriveUserMetadataPda(userPublicKey);
    instructions.push(buildInitUserMetadataInstruction(userPublicKey, feePayerAddress, userMetadataPda));
  }

  if (needsInitObligation) {
    instructions.push(
      buildInitObligationInstruction(userPublicKey, feePayerAddress, obligationAddress, marketAddress)
    );
  }

  return instructions;
}

/**
 * Build a complete activation transaction.
 */
export function buildActivationTransaction(params: BuildActivationTransactionParams): KaminoTransactionResult {
  const {
    recentBlockhash,
    feePayerAddress,
    userPublicKey,
    priorityFeeMicroLamports = DEFAULT_PRIORITY_FEE_MICRO_LAMPORTS,
  } = params;

  const activationIxs = buildActivationInstructions(params);

  const allInstructions: KaminoInstruction[] = [
    ...buildComputeBudgetInstructions(priorityFeeMicroLamports),
    ...activationIxs,
  ];

  return compileAndBuildTransaction({
    instructions: allInstructions,
    feePayerAddress,
    signers: [feePayerAddress, userPublicKey],
    recentBlockhash,
  });
}

/**
 * Compile raw instructions into a complete transaction (advanced mode helper).
 */
export function compileTransaction(params: CompileTransactionParams): KaminoTransactionResult {
  return compileAndBuildTransaction(params);
}

/**
 * Internal helper to compile instructions and build transaction bytes.
 */
function compileAndBuildTransaction(params: CompileTransactionParams): KaminoTransactionResult {
  const { instructions, feePayerAddress, signers, recentBlockhash } = params;

  const additionalSigners = signers.filter(s => s !== feePayerAddress);

  const { accounts, compiledInstructions, header } = compileInstructions(
    instructions,
    feePayerAddress,
    ...additionalSigners
  );

  const transactionBytes = buildTransactionBytes(
    header.numRequiredSignatures,
    header,
    accounts,
    recentBlockhash,
    compiledInstructions
  );

  const transactionBase64 = bytesToBase64(transactionBytes);

  return {
    transactionBase64,
    signers: [feePayerAddress, ...additionalSigners],
  };
}
