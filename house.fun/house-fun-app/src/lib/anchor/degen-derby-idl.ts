/**
 * Anchor IDL for Degen Derby Program
 * Horse racing betting with weighted random winner selection
 */

export const DEGEN_DERBY_IDL = {
  "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5",
  "metadata": {
    "name": "degen_derby",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Degen Derby - Horse racing betting with weighted odds"
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
                "value": [100, 101, 103, 101, 110, 95, 100, 101, 114, 98, 121, 95, 104, 111, 117, 115, 101]
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
      "name": "create_race",
      "discriminator": [201, 66, 124, 126, 173, 160, 181, 178],
      "accounts": [
        {
          "name": "race",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [114, 97, 99, 101]
              },
              {
                "kind": "account",
                "path": "house.total_races"
              }
            ]
          }
        },
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
          "name": "horses",
          "type": {
            "vec": {
              "defined": "HorseData"
            }
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
                "path": "race"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "race",
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
          "name": "horse_index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "start_race",
      "discriminator": [145, 71, 223, 128, 33, 163, 148, 52],
      "accounts": [
        {
          "name": "race",
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
      "name": "resolve_race",
      "discriminator": [155, 82, 234, 139, 64, 99, 157, 63],
      "accounts": [
        {
          "name": "race",
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
          "name": "recent_blockhashes"
        },
        {
          "name": "system_program",
          "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5"
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
          "name": "race",
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
      "name": "cancel_race",
      "discriminator": [142, 97, 86, 28, 79, 118, 115, 217],
      "accounts": [
        {
          "name": "race",
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
          "name": "race",
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
      "name": "DegenDerbyHouse",
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
            "name": "total_races",
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
      "name": "Race",
      "discriminator": [147, 23, 35, 84, 91, 144, 128, 74],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u64"
          },
          {
            "name": "horses",
            "type": {
              "vec": {
                "defined": "Horse"
              }
            }
          },
          {
            "name": "total_bets",
            "type": {
              "vec": "u64"
            }
          },
          {
            "name": "player_counts",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": "RaceStatus"
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
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "started_at",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "resolved_at",
            "type": {
              "option": "i64"
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
            "name": "race_index",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "horse_index",
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
      "name": "HorseData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "odds_numerator",
            "type": "u32"
          },
          {
            "name": "odds_denominator",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "Horse",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "odds_numerator",
            "type": "u32"
          },
          {
            "name": "odds_denominator",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "RaceStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Open"
          },
          {
            "name": "Started"
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
      "name": "InvalidHorseIndex",
      "msg": "Invalid horse index"
    },
    {
      "code": 6003,
      "name": "RaceNotOpen",
      "msg": "Race is not open for betting"
    },
    {
      "code": 6004,
      "name": "RaceAlreadyResolved",
      "msg": "Race has already been resolved"
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
      "name": "RaceNotResolved",
      "msg": "Race not resolved yet"
    },
    {
      "code": 6009,
      "name": "NotAWinner",
      "msg": "Player did not bet on winning horse"
    },
    {
      "code": 6010,
      "name": "InsufficientTreasury",
      "msg": "Insufficient treasury balance"
    },
    {
      "code": 6011,
      "name": "InvalidWinner",
      "msg": "Invalid winner"
    },
    {
      "code": 6012,
      "name": "NoBetsPlaced",
      "msg": "No bets placed on this race"
    },
    {
      "code": 6013,
      "name": "RaceNotCancelled",
      "msg": "Race not cancelled"
    },
    {
      "code": 6014,
      "name": "TooManyHorses",
      "msg": "Too many horses in race (max 20)"
    },
    {
      "code": 6015,
      "name": "TooFewHorses",
      "msg": "Too few horses in race (min 2)"
    },
    {
      "code": 6016,
      "name": "RaceNotStarted",
      "msg": "Race has not started yet"
    }
  ]
};

export type DegenDerby = typeof DEGEN_DERBY_IDL;
