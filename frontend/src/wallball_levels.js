/*
Zdrojový kód pro definici úrovní hry Wallball Puzzle.
Author: Pavel Hýža
*/
export const LEVELS = [
    {
        id: 1,
        difficulty: "Lehká",
        description: "Dostaň míček dolů.",
        start: { col: 2, row: 0 }, 
        goal:  { col: 2, row: 5 },
        walls: [
            { col: 2, row: 3 }
        ],
        inventory: [
            { type: "square", count: 3 },
            { type: "triangle_left", count: 2 },
            { type: "triangle_right", count: 2 }
        ]
    },
    {
        id: 2,
        difficulty: "Lehká",
        description: "Pozor na úzký průchod.",
        start: { col: 0, row: 0 },
        goal:  { col: 4, row: 5 },
        walls: [
            { col: 0, row: 3 },
            { col: 3, row: 3 },
            { col: 4, row: 3 }
        ],
        inventory: [
            { type: "square", count: 2 },
            { type: "triangle_left", count: 3 }
        ]
    },
    {
        id: 3,
        difficulty: "Střední",
        description: "Setrvačnost je klíčová.",
        start: { col: 1, row: 0 },
        goal:  { col: 0, row: 5 },
        walls: [
            { col: 0, row: 2 },
            { col: 1, row: 2 },
            { col: 2, row: 2 },
            { col: 3, row: 2 }
        ],
        inventory: [
            { type: "square", count: 3 },
            { type: "triangle_left", count: 1 },
            { type: "triangle_right", count: 1 }
        ]
    },
    {
        id: 4,
        difficulty: "Střední",
        description: "Mezi zdi se musíš trefit přesně.",
        start: { col: 0, row: 0 },
        goal:  { col: 0, row: 4 },
        walls: [
            { col: 2, row: 2 },
            { col: 0, row: 3 },
            { col: 1, row: 3 },
            { col: 0, row: 5 },
            { col: 1, row: 5 }
        ],
        inventory: [
            { type: "square", count: 2 },
            { type: "triangle_left", count: 1 },
            { type: "triangle_right", count: 1 }
        ]
    },
    {
        id: 5,
        difficulty: "Těžká",
        description: "Tak se předveď!",
        start: { col: 2, row: 0 },
        goal:  { col: 2, row: 4 },
        walls: [
            { col: 1, row: 3 },
            { col: 2, row: 3 },
            { col: 3, row: 2 },
            { col: 3, row: 3 },
            { col: 3, row: 4 }
        ],
        inventory: [
            { type: "triangle_left", count: 2 },
            { type: "triangle_right", count: 1 }
        ]
    }
];