import bs58 from 'bs58';
import type { KaminoInstruction } from '../types.js';

/**
 * Compiled instruction with numeric indexes into the account list.
 */
export interface CompiledInstruction {
  programIdIndex: number;
  accountKeyIndexes: number[];
  data: Uint8Array;
}

/**
 * Transaction header structure.
 */
export interface TransactionHeader {
  numRequiredSignatures: number;
  numReadonlySignedAccounts: number;
  numReadonlyUnsignedAccounts: number;
}

/**
 * Address table lookup for v0 transactions.
 */
export interface AddressTableLookup {
  accountKey: string;
  writableIndexes: number[];
  readonlyIndexes: number[];
}

/**
 * Result of compiling instructions.
 */
export interface CompileInstructionsResult {
  accounts: string[];
  compiledInstructions: CompiledInstruction[];
  header: TransactionHeader;
}

/**
 * Compile instructions into a transaction format.
 * Returns ordered account list and compiled instructions.
 */
export function compileInstructions(
  instructions: KaminoInstruction[],
  feePayerAddress: string,
  ...additionalSigners: string[]
): CompileInstructionsResult {
  const accountMap = new Map<string, { isSigner: boolean; isWritable: boolean }>();

  // Fee payer is always first and a writable signer
  accountMap.set(feePayerAddress, { isSigner: true, isWritable: true });

  // Additional signers
  for (const signer of additionalSigners) {
    if (signer !== feePayerAddress && !accountMap.has(signer)) {
      accountMap.set(signer, { isSigner: true, isWritable: false });
    }
  }

  // Process all instructions to collect accounts
  for (const ix of instructions) {
    if (!accountMap.has(ix.programId)) {
      accountMap.set(ix.programId, { isSigner: false, isWritable: false });
    }

    for (const account of ix.accounts) {
      const existing = accountMap.get(account.pubkey);
      if (existing) {
        accountMap.set(account.pubkey, {
          isSigner: existing.isSigner || account.isSigner,
          isWritable: existing.isWritable || account.isWritable,
        });
      } else {
        accountMap.set(account.pubkey, {
          isSigner: account.isSigner,
          isWritable: account.isWritable,
        });
      }
    }
  }

  // Sort accounts: writable signers, readonly signers, writable non-signers, readonly non-signers
  const writableSigners: string[] = [];
  const readonlySigners: string[] = [];
  const writableNonSigners: string[] = [];
  const readonlyNonSigners: string[] = [];

  for (const [pubkey, props] of accountMap) {
    if (props.isSigner && props.isWritable) {
      if (pubkey === feePayerAddress) {
        writableSigners.unshift(pubkey);
      } else {
        writableSigners.push(pubkey);
      }
    } else if (props.isSigner && !props.isWritable) {
      readonlySigners.push(pubkey);
    } else if (!props.isSigner && props.isWritable) {
      writableNonSigners.push(pubkey);
    } else {
      readonlyNonSigners.push(pubkey);
    }
  }

  // Ensure fee payer is at index 0
  if (writableSigners[0] !== feePayerAddress) {
    const idx = writableSigners.indexOf(feePayerAddress);
    if (idx > 0) {
      writableSigners.splice(idx, 1);
      writableSigners.unshift(feePayerAddress);
    }
  }

  const accounts = [
    ...writableSigners,
    ...readonlySigners,
    ...writableNonSigners,
    ...readonlyNonSigners,
  ];

  const accountIndex = new Map<string, number>();
  accounts.forEach((pubkey, index) => {
    accountIndex.set(pubkey, index);
  });

  const compiledInstructions: CompiledInstruction[] = instructions.map(ix => ({
    programIdIndex: accountIndex.get(ix.programId)!,
    accountKeyIndexes: ix.accounts.map(acc => accountIndex.get(acc.pubkey)!),
    data: ix.data,
  }));

  const header: TransactionHeader = {
    numRequiredSignatures: writableSigners.length + readonlySigners.length,
    numReadonlySignedAccounts: readonlySigners.length,
    numReadonlyUnsignedAccounts: readonlyNonSigners.length,
  };

  return { accounts, compiledInstructions, header };
}

/**
 * Write a compact-u16 value to a buffer.
 */
function writeCompactU16(buffer: number[], value: number): void {
  if (value < 0 || value > 0xffff) {
    throw new Error(`Invalid compact-u16 value: ${value}`);
  }

  if (value < 0x80) {
    buffer.push(value);
  } else if (value < 0x4000) {
    buffer.push((value & 0x7f) | 0x80);
    buffer.push(value >> 7);
  } else {
    buffer.push((value & 0x7f) | 0x80);
    buffer.push(((value >> 7) & 0x7f) | 0x80);
    buffer.push(value >> 14);
  }
}

/**
 * Build transaction bytes from components.
 */
export function buildTransactionBytes(
  numSignatures: number,
  header: TransactionHeader,
  staticAccounts: string[],
  recentBlockhash: string,
  instructions: CompiledInstruction[],
  addressTableLookups?: AddressTableLookup[]
): Uint8Array {
  const buffer: number[] = [];

  // 1. Signature count (compact-u16)
  writeCompactU16(buffer, numSignatures);

  // 2. Empty signatures (64 bytes each)
  for (let i = 0; i < numSignatures; i++) {
    for (let j = 0; j < 64; j++) {
      buffer.push(0);
    }
  }

  // 3. Version byte (0x80 for versioned transaction v0)
  buffer.push(0x80);

  // 4. Message header (3 bytes)
  buffer.push(header.numRequiredSignatures);
  buffer.push(header.numReadonlySignedAccounts);
  buffer.push(header.numReadonlyUnsignedAccounts);

  // 5. Account keys (compact-u16 count + 32 bytes each)
  writeCompactU16(buffer, staticAccounts.length);
  for (const account of staticAccounts) {
    const decoded = bs58.decode(account);
    if (decoded.length !== 32) {
      throw new Error(`Invalid account key length: ${decoded.length}`);
    }
    buffer.push(...decoded);
  }

  // 6. Recent blockhash (32 bytes)
  const blockhashBytes = bs58.decode(recentBlockhash);
  if (blockhashBytes.length !== 32) {
    throw new Error(`Invalid blockhash length: ${blockhashBytes.length}`);
  }
  buffer.push(...blockhashBytes);

  // 7. Instructions (compact-u16 count + each instruction)
  writeCompactU16(buffer, instructions.length);
  for (const ix of instructions) {
    buffer.push(ix.programIdIndex);

    writeCompactU16(buffer, ix.accountKeyIndexes.length);
    for (const idx of ix.accountKeyIndexes) {
      buffer.push(idx);
    }

    writeCompactU16(buffer, ix.data.length);
    buffer.push(...ix.data);
  }

  // 8. Address table lookups (compact-u16 count + each lookup)
  const lookups = addressTableLookups ?? [];
  writeCompactU16(buffer, lookups.length);
  for (const lookup of lookups) {
    const keyBytes = bs58.decode(lookup.accountKey);
    buffer.push(...keyBytes);

    writeCompactU16(buffer, lookup.writableIndexes.length);
    for (const idx of lookup.writableIndexes) {
      buffer.push(idx);
    }

    writeCompactU16(buffer, lookup.readonlyIndexes.length);
    for (const idx of lookup.readonlyIndexes) {
      buffer.push(idx);
    }
  }

  return new Uint8Array(buffer);
}

/**
 * Convert Uint8Array to base64 string.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binaryString = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]!);
  }
  return btoa(binaryString);
}

/**
 * Convert base64 string to Uint8Array.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
