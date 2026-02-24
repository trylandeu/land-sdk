import bs58 from 'bs58';
import {
  KAMINO_LENDING_PROGRAM_ID,
  KAMINO_MAIN_MARKET,
  VANILLA_OBLIGATION_TAG,
  DEFAULT_PUBKEY,
} from './constants.js';
import { findProgramAddressSync } from './solana/crypto.js';

/**
 * Derive the lending market authority PDA.
 * Seeds: ["lma", market_address]
 */
export function deriveLendingMarketAuthority(
  marketAddress: string = KAMINO_MAIN_MARKET,
  programId: string = KAMINO_LENDING_PROGRAM_ID
): string {
  const seeds = [
    new TextEncoder().encode('lma'),
    bs58.decode(marketAddress),
  ];

  const { address } = findProgramAddressSync(seeds, programId);
  return address;
}

/**
 * Derive the obligation PDA for a VanillaObligation.
 * Seeds: [tag (1 byte), id (1 byte), owner (32 bytes), lending_market (32 bytes), seed1 (32 bytes), seed2 (32 bytes)]
 *
 * For VanillaObligation: tag=0, id=0, seed1=default_pubkey, seed2=default_pubkey
 */
export function deriveObligationPda(
  userPublicKey: string,
  marketAddress: string = KAMINO_MAIN_MARKET,
  programId: string = KAMINO_LENDING_PROGRAM_ID
): string {
  const tag = new Uint8Array([VANILLA_OBLIGATION_TAG]);
  const id = new Uint8Array([0]);
  const userBytes = bs58.decode(userPublicKey);
  const marketBytes = bs58.decode(marketAddress);
  const defaultPubkeyBytes = bs58.decode(DEFAULT_PUBKEY);

  const seeds = [
    tag,
    id,
    userBytes,
    marketBytes,
    defaultPubkeyBytes,
    defaultPubkeyBytes,
  ];

  const { address } = findProgramAddressSync(seeds, programId);
  return address;
}

/**
 * Derive the user's destination collateral account for a reserve.
 * Seeds: ["user_deposit", obligation, reserve]
 */
export function deriveUserDestinationCollateral(
  obligationAddress: string,
  reserveAddress: string,
  programId: string = KAMINO_LENDING_PROGRAM_ID
): string {
  const seeds = [
    new TextEncoder().encode('user_deposit'),
    bs58.decode(obligationAddress),
    bs58.decode(reserveAddress),
  ];

  const { address } = findProgramAddressSync(seeds, programId);
  return address;
}

/**
 * Derive referrer token state PDA (used for borrow operations).
 */
export function deriveReferrerTokenState(
  referrer: string = DEFAULT_PUBKEY,
  reserveAddress: string,
  programId: string = KAMINO_LENDING_PROGRAM_ID
): string {
  const seeds = [
    new TextEncoder().encode('referrer_acc'),
    bs58.decode(referrer),
    bs58.decode(reserveAddress),
  ];

  const { address } = findProgramAddressSync(seeds, programId);
  return address;
}

/**
 * Derive obligation farm user state PDA.
 * Seeds: ["user", farm, obligation]
 */
export function deriveObligationFarmUserStatePda(
  farmAddress: string,
  obligationAddress: string,
  farmsProgramId: string
): string {
  const seeds = [
    new TextEncoder().encode('user'),
    bs58.decode(farmAddress),
    bs58.decode(obligationAddress),
  ];

  const { address } = findProgramAddressSync(seeds, farmsProgramId);
  return address;
}

/**
 * Derive user metadata PDA.
 * Seeds: ["user_meta", user_pubkey]
 */
export function deriveUserMetadataPda(
  userPublicKey: string,
  programId: string = KAMINO_LENDING_PROGRAM_ID
): string {
  const seeds = [
    new TextEncoder().encode('user_meta'),
    bs58.decode(userPublicKey),
  ];

  const { address } = findProgramAddressSync(seeds, programId);
  return address;
}

// Cache lending market authorities by market since they don't change.
const lendingMarketAuthorityCache = new Map<string, string>();

export function getCachedLendingMarketAuthority(
  marketAddress: string = KAMINO_MAIN_MARKET
): string {
  const cached = lendingMarketAuthorityCache.get(marketAddress);
  if (cached) {
    return cached;
  }
  const authority = deriveLendingMarketAuthority(marketAddress);
  lendingMarketAuthorityCache.set(marketAddress, authority);
  return authority;
}
