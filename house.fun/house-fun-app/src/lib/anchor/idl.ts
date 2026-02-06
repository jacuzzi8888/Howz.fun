/**
 * Anchor IDL for Flip It Program
 * This is the TypeScript representation of the smart contract interface
 */

export type FlipIt = {
  "address": "6rTzxEePi1mtqs1XXp5ao8Bk6iSXQzzbSayfCk3tdRKQ",
  "metadata": {
    "name": "flip_it",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Flip It - Solana coin flip game"
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
                "value": [104, 111, 117, 115, 101]
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
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "place_bet",
      "discriminator": [222, 62, 67, 220, 175, 32, 219, 120],
      "accounts": [
        {
          "name": "bet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [98, 101, 116]
              },
              {
                "kind": "account",
                "path": "player"
              },
              {
                "kind": "account",
                "path": "house.total_bets"
              }
            ]
          }
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
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "commitment",
          "type": {
            "array": ["u8", 32]
          }
        }
      ]
    },
    {
      "name": "reveal",
      "discriminator": [232, 206, 197, 103, 178, 96, 186, 155],
      "accounts": [
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "recent_blockhashes"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "choice",
          "type": "u8"
        },
        {
          "name": "nonce",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claim_winnings",
      "discriminator": [104, 216, 76, 139, 54, 88, 15, 121],
      "accounts": [
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "timeout_resolve",
      "discriminator": [55, 128, 167, 236, 80, 203, 115, 96],
      "accounts": [
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
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
          "address": "11111111111111111111111111111111"
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
      "name": "House",
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
            "name": "total_bets",
            "type": "u64"
          },
          {
            "name": "total_volume",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Bet",
      "discriminator": [147, 23, 35, 84, 91, 144, 128, 74],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "commitment",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "status",
            "type": {
              "defined": "BetStatus"
            }
          },
          {
            "name": "commit_slot",
            "type": "u64"
          },
          {
            "name": "outcome",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "player_wins",
            "type": "bool"
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "house_fee",
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
      "name": "BetStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Committed"
          },
          {
            "name": "Resolved"
          },
          {
            "name": "Claimed"
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
      "name": "UnauthorizedPlayer",
      "msg": "Unauthorized player"
    },
    {
      "code": 6003,
      "name": "InvalidBetStatus",
      "msg": "Invalid bet status"
    },
    {
      "code": 6004,
      "name": "RevealTimeout",
      "msg": "Reveal timeout reached"
    },
    {
      "code": 6005,
      "name": "InvalidReveal",
      "msg": "Invalid reveal - commitment mismatch"
    },
    {
      "code": 6006,
      "name": "BetNotResolved",
      "msg": "Bet not resolved yet"
    },
    {
      "code": 6007,
      "name": "TimeoutNotReached",
      "msg": "Timeout not reached yet"
    },
    {
      "code": 6008,
      "name": "UnauthorizedHouse",
      "msg": "Unauthorized house authority"
    },
    {
      "code": 6009,
      "name": "InsufficientTreasury",
      "msg": "Insufficient treasury balance"
    }
  ]
};

export const IDL: FlipIt = {
  "address": "6rTzxEePi1mtqs1XXp5ao8Bk6iSXQzzbSayfCk3tdRKQ",
  "metadata": {
    "name": "flip_it",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Flip It - Solana coin flip game"
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
                "value": [104, 111, 117, 115, 101]
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
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "place_bet",
      "discriminator": [222, 62, 67, 220, 175, 32, 219, 120],
      "accounts": [
        {
          "name": "bet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [98, 101, 116]
              },
              {
                "kind": "account",
                "path": "player"
              },
              {
                "kind": "account",
                "path": "house.total_bets"
              }
            ]
          }
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
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "commitment",
          "type": {
            "array": ["u8", 32]
          }
        }
      ]
    },
    {
      "name": "reveal",
      "discriminator": [232, 206, 197, 103, 178, 96, 186, 155],
      "accounts": [
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "recent_blockhashes"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "choice",
          "type": "u8"
        },
        {
          "name": "nonce",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claim_winnings",
      "discriminator": [104, 216, 76, 139, 54, 88, 15, 121],
      "accounts": [
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "player",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "timeout_resolve",
      "discriminator": [55, 128, 167, 236, 80, 203, 115, 96],
      "accounts": [
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "house",
          "writable": true
        },
        {
          "name": "caller",
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
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
          "address": "11111111111111111111111111111111"
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
      "name": "House",
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
            "name": "total_bets",
            "type": "u64"
          },
          {
            "name": "total_volume",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "Bet",
      "discriminator": [147, 23, 35, 84, 91, 144, 128, 74],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "commitment",
            "type": {
              "array": ["u8", 32]
            }
          },
          {
            "name": "status",
            "type": {
              "defined": "BetStatus"
            }
          },
          {
            "name": "commit_slot",
            "type": "u64"
          },
          {
            "name": "outcome",
            "type": {
              "option": "u8"
            }
          },
          {
            "name": "player_wins",
            "type": "bool"
          },
          {
            "name": "payout",
            "type": "u64"
          },
          {
            "name": "house_fee",
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
      "name": "BetStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Committed"
          },
          {
            "name": "Resolved"
          },
          {
            "name": "Claimed"
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
      "name": "UnauthorizedPlayer",
      "msg": "Unauthorized player"
    },
    {
      "code": 6003,
      "name": "InvalidBetStatus",
      "msg": "Invalid bet status"
    },
    {
      "code": 6004,
      "name": "RevealTimeout",
      "msg": "Reveal timeout reached"
    },
    {
      "code": 6005,
      "name": "InvalidReveal",
      "msg": "Invalid reveal - commitment mismatch"
    },
    {
      "code": 6006,
      "name": "BetNotResolved",
      "msg": "Bet not resolved yet"
    },
    {
      "code": 6007,
      "name": "TimeoutNotReached",
      "msg": "Timeout not reached yet"
    },
    {
      "code": 6008,
      "name": "UnauthorizedHouse",
      "msg": "Unauthorized house authority"
    },
    {
      "code": 6009,
      "name": "InsufficientTreasury",
      "msg": "Insufficient treasury balance"
    }
  ]
};
