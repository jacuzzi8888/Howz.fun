// Type definition derived from IDL
export type FlipIt = typeof IDL;

export const IDL = {
  "address": "BWGSySnUGc9GRW4KdesmNAzp9Y2KoCioUfrz1Q5cdcqu",
  "metadata": {
    "name": "flip_it",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Arcium & Anchor"
  },
  "instructions": [
    {
      "name": "claim_winnings",
      "docs": [
        "Claim winnings after bet is resolved"
      ],
      "discriminator": [
        161,
        215,
        24,
        59,
        14,
        236,
        242,
        221
      ],
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
      "name": "deposit_treasury",
      "discriminator": [
        2,
        129,
        72,
        214,
        50,
        94,
        151,
        230
      ],
      "accounts": [
        {
          "name": "house",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "depositor",
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
    },
    {
      "name": "flip",
      "docs": [
        "Request the coin flip computation from Arcium MPC cluster"
      ],
      "discriminator": [
        24,
        243,
        78,
        161,
        192,
        246,
        102,
        103
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "house",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "sign_pda_account",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  65,
                  114,
                  99,
                  105,
                  117,
                  109,
                  83,
                  105,
                  103,
                  110,
                  101,
                  114,
                  65,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mxe_account"
        },
        {
          "name": "mempool_account",
          "writable": true
        },
        {
          "name": "executing_pool",
          "writable": true
        },
        {
          "name": "computation_account",
          "writable": true
        },
        {
          "name": "comp_def_account"
        },
        {
          "name": "cluster_account",
          "writable": true
        },
        {
          "name": "pool_account",
          "writable": true,
          "address": "G2sRWJvi3xoyh5k2gY49eG9L8YhAEWQPtNb1zb1GXTtC"
        },
        {
          "name": "clock_account",
          "writable": true,
          "address": "7EbMUTLo5DjdzbN7s8BXeZwXzEwNQb1hScfRvWg8a6ot"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "arcium_program",
          "address": "Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ"
        }
      ],
      "args": [
        {
          "name": "computation_offset",
          "type": "u64"
        },
        {
          "name": "user_choice",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "pub_key",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nonce",
          "type": "u128"
        }
      ]
    },
    {
      "name": "flip_callback",
      "docs": [
        "Callback from Arcium MPC cluster with the flip result"
      ],
      "discriminator": [
        191,
        124,
        4,
        142,
        224,
        106,
        210,
        199
      ],
      "accounts": [
        {
          "name": "arcium_program",
          "address": "Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ"
        },
        {
          "name": "comp_def_account"
        },
        {
          "name": "mxe_account"
        },
        {
          "name": "computation_account"
        },
        {
          "name": "cluster_account"
        },
        {
          "name": "instructions_sysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "bet",
          "writable": true
        },
        {
          "name": "house",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "output",
          "type": {
            "defined": {
              "name": "SignedComputationOutputs",
              "generics": [
                {
                  "kind": "type",
                  "type": {
                    "defined": {
                      "name": "FlipOutput"
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "init_flip_comp_def",
      "docs": [
        "Initialize the flip computation definition",
        "Called once after program deployment to register the MPC circuit"
      ],
      "discriminator": [
        75,
        38,
        202,
        55,
        163,
        72,
        59,
        59
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mxe_account",
          "writable": true
        },
        {
          "name": "comp_def_account",
          "writable": true
        },
        {
          "name": "address_lookup_table",
          "writable": true
        },
        {
          "name": "lut_program",
          "address": "AddressLookupTab1e1111111111111111111111111"
        },
        {
          "name": "arcium_program",
          "address": "Arcj82pX7HxYKLR92qvgZUAd7vGS1k4hQvAFcPATFdEQ"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize_house",
      "docs": [
        "Initialize the house treasury account",
        "Called once when setting up the game"
      ],
      "discriminator": [
        180,
        46,
        86,
        125,
        135,
        107,
        214,
        28
      ],
      "accounts": [
        {
          "name": "house",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101
                ]
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
      "docs": [
        "Player places a bet with their choice"
      ],
      "discriminator": [
        222,
        62,
        67,
        220,
        63,
        166,
        126,
        33
      ],
      "accounts": [
        {
          "name": "bet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "player"
              },
              {
                "kind": "account",
                "path": "house.total_bets",
                "account": "House"
              }
            ]
          }
        },
        {
          "name": "house",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101
                ]
              }
            ]
          }
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
          "name": "choice",
          "type": "bool"
        }
      ]
    },
    {
      "name": "withdraw_treasury",
      "discriminator": [
        40,
        63,
        122,
        158,
        144,
        216,
        83,
        96
      ],
      "accounts": [
        {
          "name": "house",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  111,
                  117,
                  115,
                  101
                ]
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true,
          "relations": [
            "house"
          ]
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
      "name": "ArciumSignerAccount",
      "discriminator": [
        214,
        157,
        122,
        114,
        117,
        44,
        214,
        74
      ]
    },
    {
      "name": "Bet",
      "discriminator": [
        147,
        23,
        35,
        59,
        15,
        75,
        155,
        32
      ]
    },
    {
      "name": "ClockAccount",
      "discriminator": [
        152,
        171,
        158,
        195,
        75,
        61,
        51,
        8
      ]
    },
    {
      "name": "Cluster",
      "discriminator": [
        236,
        225,
        118,
        228,
        173,
        106,
        18,
        60
      ]
    },
    {
      "name": "ComputationDefinitionAccount",
      "discriminator": [
        245,
        176,
        217,
        221,
        253,
        104,
        172,
        200
      ]
    },
    {
      "name": "FeePool",
      "discriminator": [
        172,
        38,
        77,
        146,
        148,
        5,
        51,
        242
      ]
    },
    {
      "name": "House",
      "discriminator": [
        21,
        145,
        94,
        109,
        254,
        199,
        210,
        151
      ]
    },
    {
      "name": "MXEAccount",
      "discriminator": [
        103,
        26,
        85,
        250,
        179,
        159,
        17,
        117
      ]
    }
  ],
  "events": [
    {
      "name": "FlipEvent",
      "discriminator": [
        94,
        121,
        180,
        56,
        26,
        254,
        246,
        87
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "BetTooSmall",
      "msg": "Bet amount too small (min 0.001 SOL)"
    },
    {
      "code": 6001,
      "name": "BetTooLarge",
      "msg": "Bet amount too large (max 100 SOL)"
    },
    {
      "code": 6002,
      "name": "UnauthorizedPlayer",
      "msg": "Unauthorized player"
    },
    {
      "code": 6003,
      "name": "BetNotResolved",
      "msg": "Bet not resolved yet"
    },
    {
      "code": 6004,
      "name": "UnauthorizedHouse",
      "msg": "Unauthorized house authority"
    },
    {
      "code": 6005,
      "name": "InsufficientTreasury",
      "msg": "Insufficient treasury balance"
    },
    {
      "code": 6006,
      "name": "ArciumVerificationFailed",
      "msg": "Arcium computation verification failed"
    },
    {
      "code": 6007,
      "name": "ClusterNotSet",
      "msg": "Cluster not set for MXE"
    }
  ],
  "types": [
    {
      "name": "Activation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "activation_epoch",
            "type": {
              "defined": {
                "name": "Epoch"
              }
            }
          },
          {
            "name": "deactivation_epoch",
            "type": {
              "defined": {
                "name": "Epoch"
              }
            }
          }
        ]
      }
    },
    {
      "name": "ArciumSignerAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "BN254G2BLSPublicKey",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "array": [
              "u8",
              64
            ]
          }
        ]
      }
    },
    {
      "name": "Bet",
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
            "name": "choice",
            "type": "bool"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "BetStatus"
              }
            }
          },
          {
            "name": "placed_at",
            "type": "i64"
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
    },
    {
      "name": "BetStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Placed"
          },
          {
            "name": "Flipping"
          },
          {
            "name": "Resolved"
          },
          {
            "name": "Claimed"
          }
        ]
      }
    },
    {
      "name": "CircuitSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Local",
            "fields": [
              {
                "defined": {
                  "name": "LocalCircuitSource"
                }
              }
            ]
          },
          {
            "name": "OnChain",
            "fields": [
              {
                "defined": {
                  "name": "OnChainCircuitSource"
                }
              }
            ]
          },
          {
            "name": "OffChain",
            "fields": [
              {
                "defined": {
                  "name": "OffChainCircuitSource"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "ClockAccount",
      "docs": [
        "An account storing the current network epoch"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "start_epoch",
            "type": {
              "defined": {
                "name": "Epoch"
              }
            }
          },
          {
            "name": "current_epoch",
            "type": {
              "defined": {
                "name": "Epoch"
              }
            }
          },
          {
            "name": "start_epoch_timestamp",
            "type": {
              "defined": {
                "name": "Timestamp"
              }
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
      "name": "Cluster",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "td_info",
            "type": {
              "option": {
                "defined": {
                  "name": "NodeMetadata"
                }
              }
            }
          },
          {
            "name": "authority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "cluster_size",
            "type": "u16"
          },
          {
            "name": "activation",
            "type": {
              "defined": {
                "name": "Activation"
              }
            }
          },
          {
            "name": "max_capacity",
            "type": "u64"
          },
          {
            "name": "cu_price",
            "type": "u64"
          },
          {
            "name": "cu_price_proposals",
            "type": {
              "array": [
                "u64",
                32
              ]
            }
          },
          {
            "name": "last_updated_epoch",
            "type": {
              "defined": {
                "name": "Epoch"
              }
            }
          },
          {
            "name": "nodes",
            "type": {
              "vec": {
                "defined": {
                  "name": "NodeRef"
                }
              }
            }
          },
          {
            "name": "pending_nodes",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "bls_public_key",
            "type": {
              "defined": {
                "name": "SetUnset",
                "generics": [
                  {
                    "kind": "type",
                    "type": {
                      "defined": {
                        "name": "BN254G2BLSPublicKey"
                      }
                    }
                  }
                ]
              }
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
      "name": "ComputationDefinitionAccount",
      "docs": [
        "An account representing a [ComputationDefinition] in a MXE."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "finalization_authority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "cu_amount",
            "type": "u64"
          },
          {
            "name": "definition",
            "type": {
              "defined": {
                "name": "ComputationDefinitionMeta"
              }
            }
          },
          {
            "name": "circuit_source",
            "type": {
              "defined": {
                "name": "CircuitSource"
              }
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
      "name": "ComputationDefinitionMeta",
      "docs": [
        "A computation definition for execution in a MXE."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "circuit_len",
            "type": "u32"
          },
          {
            "name": "signature",
            "type": {
              "defined": {
                "name": "ComputationSignature"
              }
            }
          }
        ]
      }
    },
    {
      "name": "ComputationSignature",
      "docs": [
        "The signature of a computation defined in a [ComputationDefinition]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "parameters",
            "type": {
              "vec": {
                "defined": {
                  "name": "Parameter"
                }
              }
            }
          },
          {
            "name": "outputs",
            "type": {
              "vec": {
                "defined": {
                  "name": "Output"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "Epoch",
      "docs": [
        "The network epoch"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          "u64"
        ]
      }
    },
    {
      "name": "FeePool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "FlipEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bet",
            "type": "pubkey"
          },
          {
            "name": "player",
            "type": "pubkey"
          },
          {
            "name": "player_wins",
            "type": "bool"
          },
          {
            "name": "payout",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "FlipOutput",
      "docs": [
        "The output of the callback instruction. Provided as a struct with ordered fields",
        "as anchor does not support tuples and tuple structs yet."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field_0",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "House",
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
            "name": "active_bets",
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
      "name": "LocalCircuitSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "MxeKeygen"
          },
          {
            "name": "MxeKeyRecoveryInit"
          },
          {
            "name": "MxeKeyRecoveryFinalize"
          }
        ]
      }
    },
    {
      "name": "MXEAccount",
      "docs": [
        "A MPC Execution Environment."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "cluster",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "keygen_offset",
            "type": "u64"
          },
          {
            "name": "key_recovery_init_offset",
            "type": "u64"
          },
          {
            "name": "mxe_program_id",
            "type": "pubkey"
          },
          {
            "name": "authority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "utility_pubkeys",
            "type": {
              "defined": {
                "name": "SetUnset",
                "generics": [
                  {
                    "kind": "type",
                    "type": {
                      "defined": {
                        "name": "UtilityPubkeys"
                      }
                    }
                  }
                ]
              }
            }
          },
          {
            "name": "lut_offset_slot",
            "type": "u64"
          },
          {
            "name": "computation_definitions",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "MxeStatus"
              }
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
      "name": "MxeStatus",
      "docs": [
        "The status of an MXE."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Active"
          },
          {
            "name": "Recovery"
          }
        ]
      }
    },
    {
      "name": "NodeMetadata",
      "docs": [
        "location as [ISO 3166-1 alpha-2](https://www.iso.org/iso-3166-country-codes.html) country code"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "ip",
            "type": {
              "array": [
                "u8",
                4
              ]
            }
          },
          {
            "name": "peer_id",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "location",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "NodeRef",
      "docs": [
        "A reference to a node in the cluster.",
        "The offset is to derive the Node Account.",
        "The current_total_rewards is the total rewards the node has received so far in the current",
        "epoch."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "offset",
            "type": "u32"
          },
          {
            "name": "current_total_rewards",
            "type": "u64"
          },
          {
            "name": "vote",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "OffChainCircuitSource",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "source",
            "type": "string"
          },
          {
            "name": "hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "OnChainCircuitSource",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "is_completed",
            "type": "bool"
          },
          {
            "name": "upload_auth",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "Output",
      "docs": [
        "An output of a computation.",
        "We currently don't support encrypted outputs yet since encrypted values are passed via",
        "data objects."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "PlaintextBool"
          },
          {
            "name": "PlaintextU8"
          },
          {
            "name": "PlaintextU16"
          },
          {
            "name": "PlaintextU32"
          },
          {
            "name": "PlaintextU64"
          },
          {
            "name": "PlaintextU128"
          },
          {
            "name": "Ciphertext"
          },
          {
            "name": "ArcisX25519Pubkey"
          },
          {
            "name": "PlaintextFloat"
          },
          {
            "name": "PlaintextPoint"
          },
          {
            "name": "PlaintextI8"
          },
          {
            "name": "PlaintextI16"
          },
          {
            "name": "PlaintextI32"
          },
          {
            "name": "PlaintextI64"
          },
          {
            "name": "PlaintextI128"
          }
        ]
      }
    },
    {
      "name": "Parameter",
      "docs": [
        "A parameter of a computation.",
        "We differentiate between plaintext and encrypted parameters and data objects.",
        "Plaintext parameters are directly provided as their value.",
        "Encrypted parameters are provided as an offchain reference to the data.",
        "Data objects are provided as a reference to the data object account."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "PlaintextBool"
          },
          {
            "name": "PlaintextU8"
          },
          {
            "name": "PlaintextU16"
          },
          {
            "name": "PlaintextU32"
          },
          {
            "name": "PlaintextU64"
          },
          {
            "name": "PlaintextU128"
          },
          {
            "name": "Ciphertext"
          },
          {
            "name": "ArcisX25519Pubkey"
          },
          {
            "name": "ArcisSignature"
          },
          {
            "name": "PlaintextFloat"
          },
          {
            "name": "PlaintextI8"
          },
          {
            "name": "PlaintextI16"
          },
          {
            "name": "PlaintextI32"
          },
          {
            "name": "PlaintextI64"
          },
          {
            "name": "PlaintextI128"
          },
          {
            "name": "PlaintextPoint"
          }
        ]
      }
    },
    {
      "name": "SetUnset",
      "docs": [
        "Utility struct to store a value that needs to be set by a certain number of participants (keys",
        "in our case). Once all participants have set the value, the value is considered set and we only",
        "store it once."
      ],
      "generics": [
        {
          "kind": "type",
          "name": "T"
        }
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Set",
            "fields": [
              {
                "generic": "T"
              }
            ]
          },
          {
            "name": "Unset",
            "fields": [
              {
                "generic": "T"
              },
              {
                "vec": "bool"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "SignedComputationOutputs",
      "generics": [
        {
          "kind": "type",
          "name": "O"
        }
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Success",
            "fields": [
              {
                "generic": "O"
              },
              {
                "array": [
                  "u8",
                  64
                ]
              }
            ]
          },
          {
            "name": "Failure"
          },
          {
            "name": "MarkerForIdlBuildDoNotUseThis",
            "fields": [
              {
                "generic": "O"
              }
            ]
          }
        ]
      }
    },
    {
      "name": "Timestamp",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timestamp",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "UtilityPubkeys",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "x25519_pubkey",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "ed25519_verifying_key",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "elgamal_pubkey",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "pubkey_validity_proof",
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          }
        ]
      }
    }
  ]
} as const;
