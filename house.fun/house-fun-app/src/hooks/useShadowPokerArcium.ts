/**
 * Shadow Poker Arcium MXE Integration Hook
 * 
 * Implements provably private card dealing using Arcium Multi-Party Execution Environments.
 * Cards are encrypted to each player's public key and only decryptable by the intended recipient.
 * 
 * Track: Encrypted Gaming (Arcium)
 * Pattern: Follows Flip It implementation from useFlipItArcium.ts
 */

import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useArcium } from '~/lib/arcium/ArciumContext';
import { createCommitment } from '~/lib/arcium/privacy';
import { useShadowPokerProgram } from '~/lib/anchor/shadow-poker-client';
import { useMagicBlock } from '~/lib/magicblock/MagicBlockContext';
import type { ArciumProof, EncryptedDeck, EncryptedCard } from '~/lib/arcium/client';
import { cardToDisplay, type Card, type CardDisplay, type Suit, type Rank } from '~/lib/anchor/shadow-poker-utils';

// Helper to convert Arcium card response to CardDisplay
function arciumCardToDisplay(card: { rank: string; suit: string }): CardDisplay {
  // Map string rank to numeric rank for Card interface
  const rankMap: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };

  // Map suit string to numeric suit
  const suitMap: Record<string, number> = {
    'Hearts': 0, 'Diamonds': 1, 'Clubs': 2, 'Spades': 3,
  };

  const cardObj: Card = {
    suit: suitMap[card.suit] ?? 0,
    rank: rankMap[card.rank] ?? 2,
  };

  return cardToDisplay(cardObj);
}

export interface ShadowPokerArciumState {
  isGeneratingDeck: boolean;
  isDecryptingCards: boolean;
  isComputing: boolean;
  encryptedDeck: EncryptedDeck | null;
  decryptedHoleCards: CardDisplay[] | null;
  arciumProof: ArciumProof | null;
  error: string | null;
}

export interface GenerateDeckResult {
  success: boolean;
  encryptedDeck?: EncryptedDeck;
  proof?: ArciumProof;
  commitment?: string;
  error?: string;
}

export interface DecryptCardsResult {
  success: boolean;
  cards?: CardDisplay[];
  error?: string;
}

export interface ShowdownProofResult {
  success: boolean;
  allCards?: CardDisplay[];
  proof?: ArciumProof;
  error?: string;
}

export interface UseShadowPokerArciumReturn extends ShadowPokerArciumState {
  // Core Arcium operations
  generateEncryptedDeck: (
    tablePDA: PublicKey,
    playerPublicKeys: PublicKey[]
  ) => Promise<GenerateDeckResult>;

  decryptHoleCards: (
    encryptedCards: EncryptedCard[],
    playerPublicKey: PublicKey
  ) => Promise<DecryptCardsResult>;

  generateShowdownProof: (
    tablePDA: PublicKey,
    encryptedDeck: EncryptedDeck
  ) => Promise<ShowdownProofResult>;

  // Utility functions
  reset: () => void;
  validateDeckIntegrity: (deck: EncryptedDeck) => boolean;
}

export function useShadowPokerArcium(): UseShadowPokerArciumReturn {
  const { sessionKey } = useMagicBlock();
  const { generatePokerDeck, decryptPlayerCards, generateShowdownReveal, isComputing } = useArcium();
  const { initPokerCompDef, dealEncryptedCards, showdownWithProof } = useShadowPokerProgram(sessionKey);

  const [encryptedDeck, setEncryptedDeck] = useState<EncryptedDeck | null>(null);
  const [decryptedHoleCards, setDecryptedHoleCards] = useState<CardDisplay[] | null>(null);
  const [arciumProof, setArciumProof] = useState<ArciumProof | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate an encrypted deck for a poker hand using Arcium MXE
   * 
   * Flow:
   * 1. Create table commitment (tablePDA + nonce)
   * 2. Request Arcium MXE to generate encrypted deck
   * 3. Arcium TEE shuffles 52 cards and encrypts each to intended player
   * 4. Returns deck commitment + encrypted cards + proof
   * 
   * Security: No one (including house.fun) knows card order until dealing
   */
  const generateEncryptedDeck = useCallback(async (
    tablePDA: PublicKey,
    playerPublicKeys: PublicKey[]
  ): Promise<GenerateDeckResult> => {
    setError(null);
    setEncryptedDeck(null);
    setArciumProof(null);

    try {
      // Validate inputs
      if (playerPublicKeys.length < 2 || playerPublicKeys.length > 9) {
        throw new Error('Poker requires 2-9 players');
      }

      // Step 1: Create table commitment for this hand
      const tableId = tablePDA.toBase58();
      const commitment = await createCommitment(tableId);

      // Step 2: Request Arcium MXE computation
      // Arcium TEE generates encrypted deck in confidential environment
      const result = await generatePokerDeck({
        tableId,
        playerPublicKeys: playerPublicKeys.map(pk => pk.toBase58()),
        numCards: 52, // Full deck
        commitmentHash: commitment.hash,
        nonce: commitment.salt,
      });

      if (!result.success || !result.encryptedDeck || !result.proof) {
        const errorMsg = result.error || 'Failed to generate encrypted deck';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      // Step 3: Store encrypted deck and proof
      setEncryptedDeck(result.encryptedDeck);
      setArciumProof(result.proof);

      // Step 4: Update On-Chain State (Anchor Program)
      // We now call deal_encrypted_cards which triggers the MXE workflow
      console.log('[Arcium] Dealing encrypted cards on-chain...');
      const offset = new BN(Date.now()); // Using timestamp as offset for hackathon
      const pubKeyNum = Array.from(Buffer.from(result.encryptedDeck.commitment.slice(0, 64), 'hex'));
      const nonceVal = new BN(commitment.salt);

      await dealEncryptedCards(tablePDA, offset, pubKeyNum, nonceVal);

      return {
        success: true,
        encryptedDeck: result.encryptedDeck,
        proof: result.proof,
        commitment: commitment.hash,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error in Arcium deck generation';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }, [generatePokerDeck]);

  /**
   * Decrypt hole cards for the current player
   * 
   * Flow:
   * 1. Filter encrypted cards for current player
   * 2. Request Arcium to decrypt (requires player's private key authorization)
   * 3. Returns readable cards
   * 
   * Security: Only the player can decrypt their own cards
   */
  const decryptHoleCards = useCallback(async (
    encryptedCards: EncryptedCard[],
    playerPublicKey: PublicKey
  ): Promise<DecryptCardsResult> => {
    setError(null);
    setDecryptedHoleCards(null);

    try {
      // Filter cards encrypted to this player
      const playerCards = encryptedCards.filter(
        card => card.playerPubkey === playerPublicKey.toBase58()
      );

      if (playerCards.length !== 2) {
        throw new Error(`Expected 2 hole cards, found ${playerCards.length}`);
      }

      // Request Arcium decryption
      const result = await decryptPlayerCards({
        encryptedCards: playerCards,
        playerPublicKey: playerPublicKey.toBase58(),
      });

      if (!result.success || !result.cards) {
        const errorMsg = result.error || 'Failed to decrypt hole cards';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      // Convert Arcium card format to CardDisplay
      const displayCards = result.cards.map(arciumCardToDisplay);
      setDecryptedHoleCards(displayCards);

      return {
        success: true,
        cards: displayCards,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error decrypting cards';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }, [decryptPlayerCards]);

  /**
   * Generate showdown proof to reveal all cards
   * 
   * Flow:
   * 1. Request Arcium to generate showdown proof
   * 2. Arcium verifies encrypted deck integrity
   * 3. Returns proof to unlock all cards on-chain
   * 
   * Security: Proof ensures cards weren't tampered with during hand
   */
  const generateShowdownProof = useCallback(async (
    tablePDA: PublicKey,
    encryptedDeck: EncryptedDeck
  ): Promise<ShowdownProofResult> => {
    setError(null);

    try {
      const result = await generateShowdownReveal({
        tableId: tablePDA.toBase58(),
        encryptedDeck,
      });

      if (!result.success || !result.allCards || !result.proof) {
        const errorMsg = result.error || 'Failed to generate showdown proof';
        setError(errorMsg);
        return {
          success: false,
          error: errorMsg,
        };
      }

      // Convert Arcium card format to CardDisplay
      const displayCards = result.allCards.map(arciumCardToDisplay);

      // Step 2: Update On-Chain State
      console.log('[Arcium] Revealing showdown on-chain...');
      const offset = new BN(Date.now() + 1); // Offset for showdown
      const pubKey = Array.from(Buffer.from(result.proof.publicInputs).slice(0, 32));
      const nonce = new BN(result.proof.outcome);

      await showdownWithProof(tablePDA, offset, pubKey, nonce);

      return {
        success: true,
        allCards: displayCards,
        proof: result.proof,
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error in showdown';
      setError(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }, [generateShowdownReveal]);

  /**
   * Validate encrypted deck integrity
   * Client-side verification before sending to blockchain
   */
  const validateDeckIntegrity = useCallback((deck: EncryptedDeck): boolean => {
    try {
      // Check deck has 52 cards
      if (!deck.cards || deck.cards.length !== 52) {
        return false;
      }

      // Check commitment exists
      if (!deck.commitment || deck.commitment.length === 0) {
        return false;
      }

      // Check proof exists and is recent
      if (!deck.arciumProof) {
        return false;
      }

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (deck.arciumProof.timestamp < fiveMinutesAgo) {
        return false;
      }

      // Verify all cards have required fields
      const validCards = deck.cards.every(card =>
        card.ciphertext &&
        card.ciphertext.length > 0 &&
        card.playerPubkey &&
        card.proofFragment &&
        card.proofFragment.length > 0
      );

      return validCards;
    } catch {
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setEncryptedDeck(null);
    setDecryptedHoleCards(null);
    setArciumProof(null);
    setError(null);
  }, []);

  return {
    isGeneratingDeck: isComputing,
    isDecryptingCards: isComputing,
    encryptedDeck,
    decryptedHoleCards,
    arciumProof,
    error,
    generateEncryptedDeck,
    decryptHoleCards,
    generateShowdownProof,
    reset,
    validateDeckIntegrity,
    isComputing,
  };
}

/**
 * Serialize encrypted deck for Solana transaction
 * Creates a buffer that can be passed to the smart contract
 */
export function serializeEncryptedDeckForTransaction(deck: EncryptedDeck): Buffer {
  // Structure: [commitment (32 bytes)] [num_cards (2 bytes)] [cards...]
  const commitmentBytes = Buffer.from(deck.commitment.slice(0, 64), 'hex');

  const numCardsBuffer = Buffer.allocUnsafe(2);
  numCardsBuffer.writeUInt16LE(deck.cards.length, 0);

  // Serialize each card: [ciphertext_length (2 bytes)] [ciphertext] [player_pubkey (32 bytes)] [proof_length (2 bytes)] [proof]
  const cardBuffers = deck.cards.map(card => {
    const cipherLength = Buffer.allocUnsafe(2);
    cipherLength.writeUInt16LE(card.ciphertext.length, 0);

    const playerKeyBytes = Buffer.from(card.playerPubkey, 'base64');

    const proofLength = Buffer.allocUnsafe(2);
    proofLength.writeUInt16LE(card.proofFragment.length, 0);

    return Buffer.concat([
      cipherLength,
      Buffer.from(card.ciphertext),
      playerKeyBytes,
      proofLength,
      Buffer.from(card.proofFragment),
    ]);
  });

  return Buffer.concat([
    commitmentBytes,
    numCardsBuffer,
    ...cardBuffers,
  ]);
}

/**
 * Serialize Arcium proof for poker transaction
 * Extended version with deck-specific data
 */
export function serializePokerProofForTransaction(proof: ArciumProof, deckCommitment: string): Buffer {
  // Structure: [outcome (1 byte)] [proof_length (4 bytes)] [proof] [public_inputs_length (4 bytes)] [public_inputs] [deck_commitment (32 bytes)]
  const outcomeByte = Buffer.from([proof.outcome]);

  const proofLength = Buffer.allocUnsafe(4);
  proofLength.writeUInt32LE(proof.proof.length, 0);

  const publicInputsLength = Buffer.allocUnsafe(4);
  publicInputsLength.writeUInt32LE(proof.publicInputs.length, 0);

  const deckCommitmentBytes = Buffer.from(deckCommitment.slice(0, 64), 'hex');

  return Buffer.concat([
    outcomeByte,
    proofLength,
    Buffer.from(proof.proof),
    publicInputsLength,
    Buffer.from(proof.publicInputs),
    deckCommitmentBytes,
  ]);
}

/**
 * Extract hole card indices from encrypted deck for a player
 * Returns indices of the 2 cards dealt to the specified player
 */
export function getPlayerHoleCardIndices(
  deck: EncryptedDeck,
  playerIndex: number,
  totalPlayers: number
): number[] {
  // Standard dealing: 2 cards per player, dealt in order
  // Player 0 gets cards 0 and totalPlayers
  // Player 1 gets cards 1 and totalPlayers + 1
  // etc.
  const firstCard = playerIndex;
  const secondCard = totalPlayers + playerIndex;

  return [firstCard, secondCard];
}

/**
 * Extract community card indices from encrypted deck
 * Returns indices of the 5 community cards (flop, turn, river)
 */
export function getCommunityCardIndices(totalPlayers: number): number[] {
  // Community cards start after all hole cards are dealt
  // Hole cards: 2 * totalPlayers
  // Community starts at index: 2 * totalPlayers
  const startIdx = 2 * totalPlayers;

  // Flop: 3 cards (indices 0, 1, 2)
  // Turn: 1 card (index 3)
  // River: 1 card (index 4)
  return [startIdx, startIdx + 1, startIdx + 2, startIdx + 3, startIdx + 4];
}
