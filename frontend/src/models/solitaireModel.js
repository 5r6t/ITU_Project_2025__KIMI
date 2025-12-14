/*
Model for klondike solitaire game
Author: Jaroslav Mervart
*/

export const SUITS = ["hearts", "spades", "clubs", "diamonds"];
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const RANK_VALUE = {
    A: 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
};

const SUIT_COLOR = {
    hearts: "red",
    diamonds: "red",
    clubs: "black",
    spades: "black",
};

export function spriteIdFor(suit, rank) {
    return `card-${suit}-${rank}`;
}

function createDeck() {
    const deck = [];
    SUITS.forEach((suit) => {
        RANKS.forEach((rank) => {
            deck.push({
                id: `${suit}-${rank}`,
                suit,
                rank,
                color: SUIT_COLOR[suit],
                spriteId: spriteIdFor(suit, rank),
                faceUp: false,
            });
        });
    });
    return deck;
}

function shuffle(cards, randomFn = Math.random) {
    const deck = [...cards];
    for (let i = deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(randomFn() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export class SolitaireModel {
    constructor(randomFn = Math.random) {
        this.randomFn = randomFn;
        this.reset();
    }

    reset() {
        const deck = shuffle(createDeck(), this.randomFn);
        this.foundations = {
            hearts: [],
            spades: [],
            clubs: [],
            diamonds: [],
        };
        this.waste = [];
        this.stock = [];
        this.tableau = Array.from({ length: 7 }, () => []);
        this.deal(deck);
    }

    loadSnapshot(snapshot) {
        if (!snapshot) return;
        const normalize = (card) => {
            if (!card || !card.suit || !card.rank) return null;
            return {
                id: card.id || `${card.suit}-${card.rank}`,
                suit: card.suit,
                rank: card.rank,
                color: card.color || SUIT_COLOR[card.suit],
                spriteId: card.spriteId || spriteIdFor(card.suit, card.rank),
                faceUp: Boolean(card.faceUp),
            };
        };

        this.stock = (snapshot.stock || []).map(normalize).filter(Boolean);
        this.waste = (snapshot.waste || []).map(normalize).filter(Boolean);

        const tableauRaw = Array.isArray(snapshot.tableau) ? snapshot.tableau : [];
        this.tableau = tableauRaw.map((pile = []) => pile.map(normalize).filter(Boolean));
        while (this.tableau.length < 7) this.tableau.push([]);
        this.tableau = this.tableau.slice(0, 7);

        const f = snapshot.foundations || {};
        this.foundations = {
            hearts: (f.hearts || []).map(normalize).filter(Boolean),
            spades: (f.spades || []).map(normalize).filter(Boolean),
            clubs: (f.clubs || []).map(normalize).filter(Boolean),
            diamonds: (f.diamonds || []).map(normalize).filter(Boolean),
        };
    }

    deal(deck) {
        const working = [...deck];
        for (let pile = 0; pile < 7; pile += 1) {
            for (let depth = 0; depth <= pile; depth += 1) {
                const card = working.shift();
                if (!card) break;
                this.tableau[pile].push({ ...card, faceUp: depth === pile });
            }
        }
        this.stock = working;
    }

    drawFromStock() {
        if (this.stock.length === 0) {
            return this.recycleWaste();
        }
        const next = this.stock.pop();
        this.waste.push({ ...next, faceUp: true });
        return true;
    }

    recycleWaste() {
        if (this.waste.length === 0) return false;
        this.stock = this.waste.map((card) => ({ ...card, faceUp: false })).reverse();
        this.waste = [];
        return true;
    }

    getWasteTop() {
        return this.waste[this.waste.length - 1] || null;
    }

    getFoundationTop(suit) {
        const pile = this.foundations[suit] || [];
        return pile[pile.length - 1] || null;
    }

    canPlaceOnFoundation(card, targetSuit = card.suit) {
        const pile = this.foundations[targetSuit];
        if (!pile || card.suit !== targetSuit) return false;
        const targetValue = pile.length === 0 ? 1 : RANK_VALUE[pile[pile.length - 1].rank] + 1;
        return RANK_VALUE[card.rank] === targetValue;
    }

    moveWasteToFoundation(targetSuit) {
        const top = this.getWasteTop();
        if (!top) return false;
        const suit = targetSuit || top.suit;
        if (!this.canPlaceOnFoundation(top, suit)) return false;
        this.waste.pop();
        this.foundations[suit].push(top);
        return true;
    }

    moveTableauToFoundation(pileIndex, targetSuit) {
        const pile = this.tableau[pileIndex];
        if (!pile || pile.length === 0) return false;
        const card = pile[pile.length - 1];
        if (!card.faceUp) return false;
        const suit = targetSuit || card.suit;
        if (!this.canPlaceOnFoundation(card, suit)) return false;
        pile.pop();
        this.foundations[suit].push(card);
        this.flipTop(pileIndex);
        return true;
    }

    canStackOnTableau(card, targetPileIndex) {
        const targetPile = this.tableau[targetPileIndex];
        if (!targetPile) return false;
        if (targetPile.length === 0) return card.rank === "K";
        const top = targetPile[targetPile.length - 1];
        if (!top.faceUp) return false;
        const rankBelow = RANK_VALUE[top.rank] - 1;
        const correctRank = RANK_VALUE[card.rank] === rankBelow;
        const alternatingColor = top.color !== card.color;
        return correctRank && alternatingColor;
    }

    moveWasteToTableau(targetPileIndex) {
        const top = this.getWasteTop();
        if (!top) return false;
        if (!this.canStackOnTableau(top, targetPileIndex)) return false;
        this.waste.pop();
        this.tableau[targetPileIndex].push(top);
        return true;
    }

    moveTableauStack(sourcePileIndex, cardIndex, targetPileIndex) {
        if (sourcePileIndex === targetPileIndex) return false;
        const pile = this.tableau[sourcePileIndex];
        if (!pile || !pile[cardIndex] || !pile[cardIndex].faceUp) return false;
        if (!this.canStackOnTableau(pile[cardIndex], targetPileIndex)) return false;
        const moving = pile.splice(cardIndex);
        this.tableau[targetPileIndex].push(...moving);
        this.flipTop(sourcePileIndex);
        return true;
    }

    flipTop(pileIndex) {
        const pile = this.tableau[pileIndex];
        if (!pile || pile.length === 0) return;
        const top = pile[pile.length - 1];
        if (!top.faceUp) top.faceUp = true;
    }

    getState() {
        return {
            stockCount: this.stock.length,
            waste: [...this.waste],
            foundations: {
                hearts: [...this.foundations.hearts],
                spades: [...this.foundations.spades],
                clubs: [...this.foundations.clubs],
                diamonds: [...this.foundations.diamonds],
            },
            tableau: this.tableau.map((pile) => [...pile]),
        };
    }

    getSnapshot() {
        const clonePile = (pile = []) => pile.map((c) => ({ ...c }));
        return {
            stock: clonePile(this.stock),
            waste: clonePile(this.waste),
            tableau: this.tableau.map((pile) => clonePile(pile)),
            foundations: {
                hearts: clonePile(this.foundations.hearts),
                spades: clonePile(this.foundations.spades),
                clubs: clonePile(this.foundations.clubs),
                diamonds: clonePile(this.foundations.diamonds),
            },
        };
    }
}
