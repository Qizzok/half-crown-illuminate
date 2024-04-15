export const TARGET_FPS = 20.0;
export const FRAME_TIME_MS = 1000 / TARGET_FPS;

export const BOARD_SIZE = {
    x: 8,
    y: 10,
};
export function BOARD_LAYOUT_FROM_CANVAS(canvas) {
    const SQUARE_SIDE_LENGTH = Math.min(canvas.clientWidth / BOARD_SIZE.x, canvas.clientHeight / BOARD_SIZE.y);
    return {
        side: SQUARE_SIDE_LENGTH,
        offset: {
            left: (canvas.clientWidth - (BOARD_SIZE.x * SQUARE_SIDE_LENGTH)) / 2.0,
            top: (canvas.clientHeight - (BOARD_SIZE.y * SQUARE_SIDE_LENGTH)) / 2.0,
        },
    };
}

export const BOARD_START = [
    ['br0', 'bn', 'bb', 'bq', 'bk0', 'bb', 'bn', 'br0'],
    new Array(8).fill('bp0'),
    new Array(8).fill(''),
    new Array(8).fill(''),
    new Array(8).fill(''),
    new Array(8).fill(''),
    new Array(8).fill(''),
    new Array(8).fill(''),
    new Array(8).fill('wp0'),
    ['wr0', 'wn', 'wb', 'wq', 'wk0', 'wb', 'wn', 'wr0'],
];
export const ENEMY_SPAWN_AREA = {
    ROW_MIN: 3,
    ROW_MAX: 6,
};

export const BOARD_COLOR_A = [0.1, 0.32, 0.05, 1];
export const BOARD_COLOR_B = [0.95, 0.83, 0.72, 1];
export const CLEAR_COLOR = [0, 0, 1, 1];
export const SELECT_COLOR = [1, 0, 0, 1];
export const HOVER_COLOR = [0, 1, 0, 1];

export const TURN_ORDER = ['white', 'cpu1', 'black', 'cpu2'];
export const MOVE_HISTORY_LENGTH = 3;

export const ENEMY_SPAWN_THRESHOLD = 2;
export const ENEMY_TURN_SPAWN_DENSITY = 12;
export const ENEMY_PIECE_TURN_THRESHOLDS = {
    p: 0,
    n: 10,
    b: 20,
    r: 40,
    q: 69,
};
export const FUTURE_THREAT_SCALAR = 0.3;
export const PIECE_VALUES = {
    p: 1,
    n: 2,
    b: 3,
    r: 5,
    q: 9,
    k: 20,
};
