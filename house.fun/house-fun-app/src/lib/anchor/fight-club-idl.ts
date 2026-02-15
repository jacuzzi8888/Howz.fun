/**
 * Anchor IDL for Fight Club Program
 * Pool-based betting with two tokens fighting each other
 */

export const FIGHT_CLUB_IDL = {
  "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5",
  "metadata": {
    "name": "fight_club",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Fight Club - Token battle betting"
  },
  "instructions": [
    {
      "name": "initialize_house",
      "discriminator": [112, 146, 238, 68, 186, 143, 197, 129],
      "accounts": [
        {
          "name": "house",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [102, 105, 103, 104, 116, 95, 99, 108, 117, 98, 95, 104, 111, 117, 115, 101]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        }
      ],
      "args": []
    },
    {
      "name": "create_match_v2",
      "discriminator": [201, 66, 124, 126, 173, 160, 181, 178],
      "accounts": [
        {
          "name": "fight_match",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [109, 97, 116, 99, 104]
              },
              {
                "kind": "account",
                "path": "house.total_matches"
              }
            ]
          }
        },
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "price_update_a",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        },
        {
          "name": "price_update_b",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        },
        {
          "name": "system_program",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        }
      ],
      "args": [
        {
          "name": "token_a",
          "type": "string"
        },
        {
          "name": "token_b",
          "type": "string"
        },
        {
          "name": "feed_id_a",
          "type": {
            "array": ["u8", 32]
          }
        },
        {
          "name": "feed_id_b",
          "type": {
            "array": ["u8", 32]
          }
        }
      ]
    },
    {
      "name": "place_bet",
      "discriminator": [222, 62, 67, 220, 175, 32, 219, 120],
      "accounts": [
        {
          "name": "player_bet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [112, 108, 97, 121, 101, 114, 95, 98, 101, 116]
              },
              {
                "kind": "account",
                "path": "match"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "match",
          "writable": true
        },
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "side",
          "type": "u8"
        }
      ]
    },
    {
      "name": "resolve_with_pyth",
      "discriminator": [145, 71, 223, 128, 33, 163, 148, 52],
      "accounts": [
        {
          "name": "fight_match",
          "writable": true
        },
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "price_update_a",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        },
        {
          "name": "price_update_b",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        },
        {
          "name": "authority",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "claim_winnings",
      "discriminator": [104, 216, 76, 139, 54, 88, 15, 121],
      "accounts": [
        {
          "name": "player_bet",
          "writable": true
        },
        {
          "name": "match",
          "writable": true
        },
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        }
      ],
      "args": []
    },
    {
      "name": "cancel_match",
      "discriminator": [142, 97, 86, 28, 79, 118, 115, 217],
      "accounts": [
        {
          "name": "match",
          "writable": true
        },
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "system_program",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        }
      ],
      "args": []
    },
    {
      "name": "refund_bet",
      "discriminator": [58, 30, 86, 203, 123, 192, 209, 163],
      "accounts": [
        {
          "name": "player_bet",
          "writable": true
        },
        {
          "name": "match",
          "writable": true
        },
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        }
      ],
      "args": []
    },
    {
      "name": "withdraw_treasury",
      "discriminator": [48, 70, 195, 165, 136, 159, 239, 205],
      "accounts": [
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "FightClubHouse",
      "discriminator": [159, 236, 209, 219, 96, 164, 132, 150],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "u64"
          },
          {
            "name": "total_matches",
            "type": "u64"
          },
          {
            "name": "total_volume",
            "type": "u64"
          },
          {
            "name": "house_fee_bps",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "FightMatch",
      "discriminator": [147, 23, 35, 84, 91, 144, 128, 74],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u64"
          },
          {
            "name": "token_a",
            "type": "string"
          },
          {
            "name": "token_b",
            "type": "string"
          },
          {
            "name": "feed_id_a",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "feed_id_b",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "start_price_a",
            "type": "i64"
          },
          {
            "name": "start_price_b",
            "type": "i64"
          },
          {
            "name": "end_price_a",
            "type": "i64"
          },
          {
            "name": "end_price_b",
            "type": "i64"
          },
          {
            "name": "total_bet_a",
            "type": "u64"
          },
          {
            "name": "total_bet_b",
            "type": "u64"
          },
          {
            "name": "player_count_a",
            "type": "u32"
          },
          {
            "name": "player_count_b",
            "type": "u32"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "MatchStatus"
              }
            }
          },
          {
            "name": "winner",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "house_fee",
            "type": "u64"
          },
          {
            "name": "created_at_slot",
            "type": "u64"
          },
          {
            "name": "resolved_at_slot",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "PlayerBet",
      "discriminator": [78, 200, 32, 144, 77, 61, 190, 116],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "match_index",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "side",
            "type": "u8"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "winnings",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "MatchStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Open"
          },
          {
            "name": "Resolved"
          },
          {
            "name": "Cancelled"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "BetTooSmall",
      "msg": "Bet amount too small"
    },
    {
      "code": 6001,
      "name": "BetTooLarge",
      "msg": "Bet amount too large"
    },
    {
      "code": 6002,
      "name": "InvalidSide",
      "msg": "Invalid side - must be 0 for token A or 1 for token B"
    },
    {
      "code": 6003,
      "name": "MatchNotOpen",
      "msg": "Match is not open for betting"
    },
    {
      "code": 6004,
      "name": "MatchAlreadyResolved",
      "msg": "Match has already been resolved"
    },
    {
      "code": 6005,
      "name": "UnauthorizedHouse",
      "msg": "Unauthorized house authority"
    },
    {
      "code": 6006,
      "name": "BetNotFound",
      "msg": "Player bet not found"
    },
    {
      "code": 6007,
      "name": "AlreadyClaimed",
      "msg": "Winnings already claimed"
    },
    {
      "code": 6008,
      "name": "MatchNotResolved",
      "msg": "Match not resolved yet"
    },
    {
      "code": 6009,
      "name": "NotAWinner",
      "msg": "Player did not bet on winning side"
    },
    {
      "code": 6010,
      "name": "InsufficientTreasury",
      "msg": "Insufficient treasury balance"
    },
    {
      "code": 6011,
      "name": "InvalidWinner",
      "msg": "Invalid winner side"
    },
    {
      "code": 6012,
      "name": "NoBetsPlaced",
      "msg": "No bets placed on this match"
    },
    {
      "code": 6013,
      "name": "MatchNotCancelled",
      "msg": "Match not cancelled"
    }
  ]
} as const;

export type FightClub = typeof FIGHT_CLUB_IDL;
