import { get_moves } from './board';
import { PIECE_VALUES, ENEMY_SPAWN_THRESHOLD, ENEMY_PIECE_TURN_THRESHOLDS, ENEMY_TURN_SPAWN_DENSITY, ENEMY_SPAWN_AREA, BOARD_SIZE } from './config';

const VALUE_SCALARS = {
    w: 1,
    b: 1,
    r: -1,
    u: -1,
};

const TEAMS = {
    white: 'w',
    black: 'b',
    cpu1: 'r',
    cpu2: 'u',
};

function map_moves(board, from, moves) {
    const mapped = [];
    const piece = board.at_space(from);
    for (const move of moves) {
        mapped.push({ piece, from, to: move });
    }
    return mapped;
}

function score_move(board, from, to) {
    let value = 0;
    const piece = board.at_space(from);
    const target = board.at_space(to);
    if (target !== '') {
        value += PIECE_VALUES[target[1]] * VALUE_SCALARS[target[0]];
    }
    // TODO more nuanced piece AI, future looking
    return value;
}

function get_computer_tiles(team, board) {
    let tiles = [];
    for (let row = 0; row < BOARD_SIZE.y; row++) {
        for (let column = 0; column < BOARD_SIZE.x; column++) {
            let space = { row, column };
            if (board.at_space(space)[0] === TEAMS[team]) {
                tiles.push(space);
            }
        }
    }
    return tiles;
}

function get_spawnable_tiles(board) {
    let tiles = [];
    for (let row = ENEMY_SPAWN_AREA.ROW_MIN; row < ENEMY_SPAWN_AREA.ROW_MAX; row++) {
        for (let column = 0; column < BOARD_SIZE.x; column++) {
            let space = { row, column };
            if (board.at_space(space) === '') {
                tiles.push(space);
            }
        }
    }
    return tiles;
}

function choose_new_piece_type(game) {
    let options = [];
    for (const piece of Object.keys(ENEMY_PIECE_TURN_THRESHOLDS)) {
        if (game.turnCount >= ENEMY_PIECE_TURN_THRESHOLDS[piece]) {
            options.push(piece);
        }
    }
    return options.length === 0 ? '' : TEAMS[game.turn] + options[Math.floor(Math.random() * options.length)];
}

function spawn_enemy(game) {
    const spawnableTiles = get_spawnable_tiles(game.board);
    const tile = spawnableTiles[Math.floor(Math.random() * spawnableTiles.length)];
    const piece = choose_new_piece_type(game);
    if (!piece || !tile) {
        game.moveHistory.push({});
        return game.next_turn();
    }
    game.spawn_piece(piece, tile);
}

function do_enemy_move(game, tiles) {
    const moves = [];
    for (let source of tiles) {
        let piece_moves = get_moves(game.board, source, game.moveHistory[game.moveHistory.length - 1], (_team, _space) => true);
        moves.push(...map_moves(game.board, source, piece_moves));
    }
    if (moves.length === 0) {
        return spawn_enemy(game);
    }
    moves.sort((m1, m2) => score_move(game.board, m2.from, m2.to) - score_move(game.board, m1.from, m1.to));
    const bestMove = moves[0];

    game.move_piece(bestMove.from, bestMove.to);
}

function should_spawn(game, tiles) {
    return tiles.length < ENEMY_SPAWN_THRESHOLD && game.turnCount - game.lastSpawnTurn[TEAMS[game.turn]] >= ENEMY_TURN_SPAWN_DENSITY;
}

function do_enemy_turn(game) {
    const enemyTiles = get_computer_tiles(game.turn, game.board);
    if (should_spawn(game, enemyTiles)) {
        return spawn_enemy(game);
    }
    if (enemyTiles.length > 0) {
        return do_enemy_move(game, enemyTiles);
    }
    game.moveHistory.push({});
    game.next_turn();
}

export { do_enemy_turn };
