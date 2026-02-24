import { sha256 } from '@noble/hashes/sha2.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import bs58 from 'bs58';

/**
 * Create a program-derived address (PDA) from seeds and program ID.
 * Uses SHA-256 for hashing (matches Solana's implementation).
 */
export function createProgramAddress(
  seeds: Uint8Array[],
  programId: Uint8Array,
  bump: number
): Uint8Array {
  const buffer: number[] = [];

  for (const seed of seeds) {
    if (seed.length > 32) {
      throw new Error('Seed too long');
    }
    buffer.push(...seed);
  }

  buffer.push(bump);
  buffer.push(...programId);
  buffer.push(...new TextEncoder().encode('ProgramDerivedAddress'));

  const hash = sha256(new Uint8Array(buffer));

  if (isOnCurve(hash)) {
    throw new Error('Invalid PDA - on curve');
  }

  return hash;
}

/**
 * Find a valid PDA with bump seed, returning both the address and bump.
 */
export function findProgramAddressSync(
  seeds: Uint8Array[],
  programIdBase58: string
): { address: string; bump: number } {
  const programIdBytes = bs58.decode(programIdBase58);

  for (let bump = 255; bump >= 0; bump--) {
    try {
      const pda = createProgramAddress(seeds, programIdBytes, bump);
      return { address: bs58.encode(pda), bump };
    } catch {
      continue;
    }
  }

  throw new Error('Failed to find valid PDA');
}

/**
 * Check if a point is on the ed25519 curve.
 * A valid PDA must NOT be on the curve.
 */
function isOnCurve(point: Uint8Array): boolean {
  try {
    ed25519.Point.fromBytes(point);
    return true;
  } catch {
    return false;
  }
}
