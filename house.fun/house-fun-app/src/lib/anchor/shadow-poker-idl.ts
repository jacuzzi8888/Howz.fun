/**
 * Anchor IDL for Shadow Poker Program
 * Texas Hold'em Poker on Solana with encrypted card reveals
 */

export type ShadowPoker = {
  "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5",
  "metadata": {
    "name": "shadow_poker",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Shadow Poker - Texas Hold'em with encrypted card reveals"
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
                "value": [115, 104, 97, 100, 111, 119, 95, 112, 111, 107, 101, 114, 95, 104, 111, 117, 115, 101]
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
      "name": "create_table",
      "discriminator": [201, 66, 124, 126, 173, 160, 181, 178],
      "accounts": [
        {
          "name": "table",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [116, 97, 98, 108, 101]
              },
              {
                "kind": "account",
                "path": "house.total_tables"
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
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "min_buy_in",
          "type": "u64"
        },
        {
          "name": "max_buy_in",
          "type": "u64"
        },
        {
          "name": "small_blind",
          "type": "u64"
        },
        {
          "name": "big_blind",
          "type": "u64"
        },
        {
          "name": "max_players",
          "type": "u8"
        }
      ]
    },
    {
      "name": "join_table",
      "discriminator": [222, 62, 67, 220, 175, 32, 219, 120],
      "accounts": [
        {
          "name": "player_state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [112, 108, 97, 121, 101, 114, 95, 115, 116, 97, 116, 101]
              },
              {
                "kind": "account",
                "path": "table"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "table",
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
          "name": "buy_in",
          "type": "u64"
        }
      ]
    },
    {
      "name": "start_hand",
      "discriminator": [145, 71, 223, 128, 33, 163, 148, 52],
      "accounts": [
        {
          "name": "table",
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
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "post_blind",
      "discriminator": [155, 82, 234, 139, 64, 99, 157, 63],
      "accounts": [
        {
          "name": "player_state",
          "writable": true
        },
        {
          "name": "table",
          "writable": true
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "blind_type",
          "type": {
            "defined": "BlindType"
          }
        }
      ]
    },
    {
      "name": "player_action",
      "discriminator": [104, 216, 76, 139, 54, 88, 15, 121],
      "accounts": [
        {
          "name": "player_state",
          "writable": true
        },
        {
          "name": "table",
          "writable": true
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "action",
          "type": {
            "defined": "PlayerAction"
          }
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "reveal_cards",
      "discriminator": [142, 97, 86, 28, 79, 118, 115, 217],
      "accounts": [
        {
          "name": "table",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "cards",
          "type": {
            "vec": {
              "defined": "Card"
            }
          }
        }
      ]
    },
    {
      "name": "showdown",
      "discriminator": [58, 30, 86, 203, 123, 192, 209, 163],
      "accounts": [
        {
          "name": "table",
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
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "winner_index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "leave_table",
      "discriminator": [48, 70, 195, 165, 136, 159, 239, 205],
      "accounts": [
        {
          "name": "player_state",
          "writable": true
        },
        {
          "name": "table",
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
      "name": "withdraw_treasury",
      "discriminator": [232, 206, 197, 103, 178, 96, 186, 155],
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
      "name": "ShadowPokerHouse",
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
            "name": "total_tables",
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
      "name": "Table",
      "discriminator": [147, 23, 35, 84, 91, 144, 128, 74],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u64"
          },
          {
            "name": "min_buy_in",
            "type": "u64"
          },
          {
            "name": "max_buy_in",
            "type": "u64"
          },
          {
            "name": "small_blind",
            "type": "u64"
          },
          {
            "name": "big_blind",
            "type": "u64"
          },
          {
            "name": "max_players",
            "type": "u8"
          },
          {
            "name": "players",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "player_states",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "pot",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": "TableStatus"
            }
          },
          {
            "name": "current_round",
            "type": {
              "defined": "BettingRound"
            }
          },
          {
            "name": "dealer_position",
            "type": "u8"
          },
          {
            "name": "current_player_index",
            "type": "u8"
          },
          {
            "name": "community_cards",
            "type": {
              "vec": {
                "defined": "Card"
              }
            }
          },
          {
            "name": "current_bet",
            "type": "u64"
          },
          {
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "PlayerState",
      "discriminator": [78, 200, 32, 144, 77, 61, 190, 116],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "table",
            "type": "pubkey"
          },
          {
            "name": "stack",
            "type": "u64"
          },
          {
            "name": "current_bet",
            "type": "u64"
          },
          {
            "name": "is_active",
            "type": "bool"
          },
          {
            "name": "has_acted",
            "type": "bool"
          },
          {
            "name": "is_all_in",
            "type": "bool"
          },
          {
            "name": "hole_cards",
            "type": {
              "vec": {
                "defined": "Card"
              }
            }
          },
          {
            "name": "position",
            "type": "u8"
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
      "name": "Card",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "suit",
            "type": "u8"
          },
          {
            "name": "rank",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "BlindType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Small"
          },
          {
            "name": "Big"
          }
        ]
      }
    },
    {
      "name": "PlayerAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Fold"
          },
          {
            "name": "Check"
          },
          {
            "name": "Call"
          },
          {
            "name": "Raise"
          },
          {
            "name": "AllIn"
          }
        ]
      }
    },
    {
      "name": "TableStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Waiting"
          },
          {
            "name": "PreFlop"
          },
          {
            "name": "Flop"
          },
          {
            "name": "Turn"
          },
          {
            "name": "River"
          },
          {
            "name": "Showdown"
          },
          {
            "name": "Finished"
          }
        ]
      }
    },
    {
      "name": "BettingRound",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "PreFlop"
          },
          {
            "name": "Flop"
          },
          {
            "name": "Turn"
          },
          {
            "name": "River"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidBuyIn",
      "msg": "Buy-in amount is outside table limits"
    },
    {
      "code": 6001,
      "name": "TableFull",
      "msg": "Table is full"
    },
    {
      "code": 6002,
      "name": "TableNotWaiting",
      "msg": "Table is not in waiting state"
    },
    {
      "code": 6003,
      "name": "InvalidBlindType",
      "msg": "Invalid blind type"
    },
    {
      "code": 6004,
      "name": "NotPlayerTurn",
      "msg": "Not your turn to act"
    },
    {
      "code": 6005,
      "name": "InvalidAction",
      "msg": "Invalid action for current state"
    },
    {
      "code": 6006,
      "name": "InsufficientStack",
      "msg": "Insufficient stack for action"
    },
    {
      "code": 6007,
      "name": "UnauthorizedHouse",
      "msg": "Unauthorized house authority"
    },
    {
      "code": 6008,
      "name": "PlayerNotFound",
      "msg": "Player not found at table"
    },
    {
      "code": 6009,
      "name": "PlayerNotActive",
      "msg": "Player is not active in hand"
    },
    {
      "code": 6010,
      "name": "InsufficientTreasury",
      "msg": "Insufficient treasury balance"
    },
    {
      "code": 6011,
      "name": "InvalidWinner",
      "msg": "Invalid winner index"
    },
    {
      "code": 6012,
      "name": "InvalidCardCount",
      "msg": "Invalid number of cards"
    },
    {
      "code": 6013,
      "name": "InvalidTableParams",
      "msg": "Invalid table parameters"
    },
    {
      "code": 6014,
      "name": "MinPlayersNotMet",
      "msg": "Minimum 2 players required"
    },
    {
      "code": 6015,
      "name": "AlreadyInHand",
      "msg": "Hand already in progress"
    },
    {
      "code": 6016,
      "name": "InvalidRaise",
      "msg": "Invalid raise amount"
    },
    {
      "code": 6017,
      "name": "PlayerAlreadyAtTable",
      "msg": "Player already at table"
    },
    {
      "code": 6018,
      "name": "InvalidBlinds",
      "msg": "Invalid blind amounts"
    }
  ]
};

export const SHADOW_POKER_IDL: ShadowPoker = {
  "address": "7UVimWpZp93R8M7hKdfun2z1xZpkqUnGid9y9u68kYJ5",
  "metadata": {
    "name": "shadow_poker",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Shadow Poker - Texas Hold'em with encrypted card reveals"
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
                "value": [115, 104, 97, 100, 111, 119, 95, 112, 111, 107, 101, 114, 95, 104, 111, 117, 115, 101]
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
      "name": "create_table",
      "discriminator": [201, 66, 124, 126, 173, 160, 181, 178],
      "accounts": [
        {
          "name": "table",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [116, 97, 98, 108, 101]
              },
              {
                "kind": "account",
                "path": "house.total_tables"
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
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "min_buy_in",
          "type": "u64"
        },
        {
          "name": "max_buy_in",
          "type": "u64"
        },
        {
          "name": "small_blind",
          "type": "u64"
        },
        {
          "name": "big_blind",
          "type": "u64"
        },
        {
          "name": "max_players",
          "type": "u8"
        }
      ]
    },
    {
      "name": "join_table",
      "discriminator": [222, 62, 67, 220, 175, 32, 219, 120],
      "accounts": [
        {
          "name": "player_state",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [112, 108, 97, 121, 101, 114, 95, 115, 116, 97, 116, 101]
              },
              {
                "kind": "account",
                "path": "table"
              },
              {
                "kind": "account",
                "path": "player"
              }
            ]
          }
        },
        {
          "name": "table",
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
          "name": "buy_in",
          "type": "u64"
        }
      ]
    },
    {
      "name": "start_hand",
      "discriminator": [145, 71, 223, 128, 33, 163, 148, 52],
      "accounts": [
        {
          "name": "table",
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
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "post_blind",
      "discriminator": [155, 82, 234, 139, 64, 99, 157, 63],
      "accounts": [
        {
          "name": "player_state",
          "writable": true
        },
        {
          "name": "table",
          "writable": true
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "blind_type",
          "type": {
            "defined": "BlindType"
          }
        }
      ]
    },
    {
      "name": "player_action",
      "discriminator": [104, 216, 76, 139, 54, 88, 15, 121],
      "accounts": [
        {
          "name": "player_state",
          "writable": true
        },
        {
          "name": "table",
          "writable": true
        },
        {
          "name": "player",
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "action",
          "type": {
            "defined": "PlayerAction"
          }
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "reveal_cards",
      "discriminator": [142, 97, 86, 28, 79, 118, 115, 217],
      "accounts": [
        {
          "name": "table",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "cards",
          "type": {
            "vec": {
              "defined": "Card"
            }
          }
        }
      ]
    },
    {
      "name": "showdown",
      "discriminator": [58, 30, 86, 203, 123, 192, 209, 163],
      "accounts": [
        {
          "name": "table",
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
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "winner_index",
          "type": "u8"
        }
      ]
    },
    {
      "name": "leave_table",
      "discriminator": [48, 70, 195, 165, 136, 159, 239, 205],
      "accounts": [
        {
          "name": "player_state",
          "writable": true
        },
        {
          "name": "table",
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
      "name": "withdraw_treasury",
      "discriminator": [232, 206, 197, 103, 178, 96, 186, 155],
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
      "name": "ShadowPokerHouse",
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
            "name": "total_tables",
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
      "name": "Table",
      "discriminator": [147, 23, 35, 84, 91, 144, 128, 74],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "index",
            "type": "u64"
          },
          {
            "name": "min_buy_in",
            "type": "u64"
          },
          {
            "name": "max_buy_in",
            "type": "u64"
          },
          {
            "name": "small_blind",
            "type": "u64"
          },
          {
            "name": "big_blind",
            "type": "u64"
          },
          {
            "name": "max_players",
            "type": "u8"
          },
          {
            "name": "players",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "player_states",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "pot",
            "type": "u64"
          },
          {
            "name": "status",
            "type": {
              "defined": "TableStatus"
            }
          },
          {
            "name": "current_round",
            "type": {
              "defined": "BettingRound"
            }
          },
          {
            "name": "dealer_position",
            "type": "u8"
          },
          {
            "name": "current_player_index",
            "type": "u8"
          },
          {
            "name": "community_cards",
            "type": {
              "vec": {
                "defined": "Card"
              }
            }
          },
          {
            "name": "current_bet",
            "type": "u64"
          },
          {
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "PlayerState",
      "discriminator": [78, 200, 32, 144, 77, 61, 190, 116],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "table",
            "type": "pubkey"
          },
          {
            "name": "stack",
            "type": "u64"
          },
          {
            "name": "current_bet",
            "type": "u64"
          },
          {
            "name": "is_active",
            "type": "bool"
          },
          {
            "name": "has_acted",
            "type": "bool"
          },
          {
            "name": "is_all_in",
            "type": "bool"
          },
          {
            "name": "hole_cards",
            "type": {
              "vec": {
                "defined": "Card"
              }
            }
          },
          {
            "name": "position",
            "type": "u8"
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
      "name": "Card",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "suit",
            "type": "u8"
          },
          {
            "name": "rank",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "BlindType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Small"
          },
          {
            "name": "Big"
          }
        ]
      }
    },
    {
      "name": "PlayerAction",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Fold"
          },
          {
            "name": "Check"
          },
          {
            "name": "Call"
          },
          {
            "name": "Raise"
          },
          {
            "name": "AllIn"
          }
        ]
      }
    },
    {
      "name": "TableStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Waiting"
          },
          {
            "name": "PreFlop"
          },
          {
            "name": "Flop"
          },
          {
            "name": "Turn"
          },
          {
            "name": "River"
          },
          {
            "name": "Showdown"
          },
          {
            "name": "Finished"
          }
        ]
      }
    },
    {
      "name": "BettingRound",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "PreFlop"
          },
          {
            "name": "Flop"
          },
          {
            "name": "Turn"
          },
          {
            "name": "River"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidBuyIn",
      "msg": "Buy-in amount is outside table limits"
    },
    {
      "code": 6001,
      "name": "TableFull",
      "msg": "Table is full"
    },
    {
      "code": 6002,
      "name": "TableNotWaiting",
      "msg": "Table is not in waiting state"
    },
    {
      "code": 6003,
      "name": "InvalidBlindType",
      "msg": "Invalid blind type"
    },
    {
      "code": 6004,
      "name": "NotPlayerTurn",
      "msg": "Not your turn to act"
    },
    {
      "code": 6005,
      "name": "InvalidAction",
      "msg": "Invalid action for current state"
    },
    {
      "code": 6006,
      "name": "InsufficientStack",
      "msg": "Insufficient stack for action"
    },
    {
      "code": 6007,
      "name": "UnauthorizedHouse",
      "msg": "Unauthorized house authority"
    },
    {
      "code": 6008,
      "name": "PlayerNotFound",
      "msg": "Player not found at table"
    },
    {
      "code": 6009,
      "name": "PlayerNotActive",
      "msg": "Player is not active in hand"
    },
    {
      "code": 6010,
      "name": "InsufficientTreasury",
      "msg": "Insufficient treasury balance"
    },
    {
      "code": 6011,
      "name": "InvalidWinner",
      "msg": "Invalid winner index"
    },
    {
      "code": 6012,
      "name": "InvalidCardCount",
      "msg": "Invalid number of cards"
    },
    {
      "code": 6013,
      "name": "InvalidTableParams",
      "msg": "Invalid table parameters"
    },
    {
      "code": 6014,
      "name": "MinPlayersNotMet",
      "msg": "Minimum 2 players required"
    },
    {
      "code": 6015,
      "name": "AlreadyInHand",
      "msg": "Hand already in progress"
    },
    {
      "code": 6016,
      "name": "InvalidRaise",
      "msg": "Invalid raise amount"
    },
    {
      "code": 6017,
      "name": "PlayerAlreadyAtTable",
      "msg": "Player already at table"
    },
    {
      "code": 6018,
      "name": "InvalidBlinds",
      "msg": "Invalid blind amounts"
    }
  ]
};
