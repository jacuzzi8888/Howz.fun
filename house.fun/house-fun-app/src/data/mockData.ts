interface LobbyGame {
    id: string;
    title: string;
    description: string;
    status: string;
    players: number | string;
    maxBet: string;
    image: string;
    icon: string;
    href: string;
    accent: 'gold' | 'red' | 'white';
    comingSoon?: boolean;
}

export const LOBBY_GAMES: LobbyGame[] = [
    {
        id: "flip-it",
        title: "FLIP IT",
        description: "50/50 Coinflip. Double or Nothing.",
        status: "LIVE",
        players: 420,
        maxBet: "100 SOL",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDRiGKJYlkfHfLd_yZN_PDbVffk5AXZDPCih8CP1OIpXQq9sni3-HxMdn53Ppg7zn4nd9WFLF4h_Lb-sA-eD7HWRcpdfWPzQ6p4EGR2toemr3QpFGZwWTytaNZDMrwkkbUZTzkoGm3XSMZphxgaovSPfiZIhSB4TCqT9P5YJYHND-icW3N7pYtoFq4LnsNJFCnWo2_2bAxut3I94bsEGAH4QcHhSUI-8DSh5cDsk1d6Grnlmfk-f5U1gHlr0hAJAel_N1v0-FUXdag",
        icon: "monetization_on",
        href: "/games/flip-it",
        accent: "gold"
    },
    {
        id: "fight-club",
        title: "FIGHT CLUB",
        description: "PvP Betting. Winner takes all.",
        status: "LIVE",
        players: 85,
        maxBet: "High Stakes",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDCwCBfEkt8raKegr347LAvDN9ywvLKGf1IHaeiEJYqlnvtKSNmr9snn9-KYnAs74QxQCO4geg5g6xLQEvsEiq5jKix7jXqAqaTj6UiFMwQOEXUA7KMaBHaItNgpDhwh0hczOE-Em3aa8Ohpu-IdorxKFEhz9mW7WoJ4dqYOkSsm_wx6gv2O3gUNcskg4DncsdRF1RvgjWR1DPq1UTNcyRFXBfLeQ0guF9PdrM4rIG8uYt4DUFDYB2dODDBYhm6Dhp5C5mjQXwhsDk",
        icon: "sports_mma",
        href: "/games/fight-club",
        accent: "red",
        comingSoon: false
    },
    {
        id: "degen-derby",
        title: "DEGEN DERBY",
        description: "Virtual Horse Racing. Live 24/7.",
        status: "LIVE",
        players: "Pool: 450 SOL",
        maxBet: "12x Multiplier",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqqDQ7qGAIx2YYEDhxep5ADuCH4S58PCdU3rrf4PrBNh0Pp2yV5SVnbnQm-ew3Czz1urJoFnTDFHhG6s1ayOWTa_sq5KpB1_x0Z5Hjttl1g-gWVmOD4QGkEJAF-x2SdCWkqAJz8LUNe3vcEF2EDomiGble2dtQvfkQvJgirb41_P3_HJhiCaZFsz2quJPx-t3pF3HDDFexonQD10iivNak30WNekrk__MzpFdULfzTmlhv7V5Gq1X8XK8XDUKuCFDHgzB3yjiE19E",
        icon: "bedroom_baby",
        href: "/games/degen-derby",
        accent: "white",
        comingSoon: false
    },
    {
        id: "shadow-poker",
        title: "SHADOW POKER",
        description: "Private tables. Encrypted hands.",
        status: "LIVE",
        players: "Anon Mode",
        maxBet: "Encrypted",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDc47a7myehvEeVzPwOgy-MAY3wU9nmcZ-ckqvSnwus2joVMpigxfxTCTNTwYjmEiT5-TCXEySokau_uC7aY07PnHoIJv9vbflM2YPP9aeZG2cWAwhQmrYfDIYh0A5XRoDCWQqzPQPR5-iesWU8cAJPBuCYr3aXsECWEHQXBguHroATLZRvsZZ8R9nmtrnFcEcfYKWiwzCBEVSIKdhl3UDHUWM8yggaKoXILRpvScyKURv2znike7tHETU48IIDiI2GRHjFxc-QfaU",
        icon: "playing_cards",
        href: "/games/shadow-poker",
        accent: "white",
        comingSoon: false
    }
];

export const LOBBY_STATS = [
    { label: "Total Volume", value: "$42,892,100+" },
    { label: "Players Online", value: "1,204", online: true },
    { label: "Games Played Today", value: "15,302" }
];
