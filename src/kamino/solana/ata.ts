import bs58 from 'bs58';
import { createProgramAddress } from './crypto.js';
import { SPL_TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '../constants.js';

/**
 * Derive the Associated Token Address (ATA) for a given owner and mint.
 * This is a PDA derived from [owner, TOKEN_PROGRAM_ID, mint] with the ATA program.
 * For Token-2022 tokens, pass the Token-2022 program ID as the tokenProgram.
 */
export function deriveATA(
  owner: string,
  mint: string,
  tokenProgram: string = SPL_TOKEN_PROGRAM_ID
): string {
  const ownerBytes = bs58.decode(owner);
  const mintBytes = bs58.decode(mint);
  const tokenProgramBytes = bs58.decode(tokenProgram);
  const ataProgramBytes = bs58.decode(ASSOCIATED_TOKEN_PROGRAM_ID);

  const seeds = [ownerBytes, tokenProgramBytes, mintBytes];

  for (let bump = 255; bump >= 0; bump--) {
    try {
      const pda = createProgramAddress(seeds, ataProgramBytes, bump);
      return bs58.encode(pda);
    } catch {
      continue;
    }
  }

  throw new Error(`Failed to derive ATA for owner ${owner} and mint ${mint}`);
}
