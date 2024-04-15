import { BOARD_START, BOARD_SIZE } from './config';

const ORTHAGONALS = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
];
const DIAGONALS = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
];
const ALL_DIRECTIONS = [].concat(ORTHAGONALS).concat(DIAGONALS);

function deep_copy(arr) {
    const out = [];
    for (let part of arr) {
        out.push([].concat(part));
    }

    return out;
}

function is_same_space(a, b) {
    return a.row === b.row && a.column === b.column;
}

function default_can_capture(attacker, target) {
    if (!attacker || attacker === 'x' || !target || target === 'x') {
        return false;
    }

    const targetable = {
        w: ['b', 'r'],
        b: ['w', 'u'],
        r: ['w', 'u'],
        u: ['b', 'r'],
    };
    return targetable[attacker[0]].indexOf(target[0]) !== -1;
}

function global_capture(_attacker, _target) {
    return true;
}

function global_vision(_team, _space) {
    return true;
}

function get_team(piece) {
    const TEAMS = {
        w: 'white',
        b: 'black',
    };
    return TEAMS[piece[0]];
}

function move_until_obstructed(
    board,
    piece,
    from,
    step,
    get_vision,
    can_capture,
    collect = [],
) {
    const test = { row: from.row + step.y, column: from.column + step.x };
    const target = board.at_space(test);
    if (target === 'x') {
    // edge of board
        return collect;
    }

    const team = get_team(piece[0]);
    if (target === '' || !get_vision(team, test)) {
        collect.push(test);
        return move_until_obstructed(board, piece, test, step, get_vision, can_capture, collect);
    }
    if (can_capture(piece, target)) {
        collect.push(test);
    }
    // else cannot capture known obstruction, either way stop looking
    return collect;
}

function moves_in_directions(board, piece, from, directions, get_vision, can_capture) {
    let moves = [];
    for (const dir of directions) {
        moves = moves.concat(
            move_until_obstructed(board, piece, from, dir, get_vision, can_capture),
        );
    }
    return moves;
}

function step_towards(board, from, to) {
    const delta = { x: to.column - from.column, y: to.row - from.row };
    const step = {
        x: delta.x === 0 ? 0 : delta.x / Math.abs(delta.x),
        y: delta.y === 0 ? 0 : delta.y / Math.abs(delta.y),
    };
    const place = { row: from.row, column: from.column };
    const test = { row: from.row + step.y, column: from.column + step.x };
    while (test.row !== to.row || test.column !== to.column) {
        if (board.at_space(test) !== '') {
            return place;
        }

        // place lags one step behind
        place.column = place.column + step.x;
        place.row = place.row + step.y;
        test.column = test.column + step.x;
        test.row = test.row + step.y;
    }
    const target = board.at_space(test);
    if (target === '' || default_can_capture(board.at_space(from), target)) {
        return test;
    }

    return place;
}

function get_space_in_direction(from, direction) {
    return { row: from.row + direction.y, column: from.column + direction.x };
}

function get_bounded_spaces_in_directions(from, directions) {
    let spaces = [];
    for (const dir of directions) {
        spaces.push(get_space_in_direction(from, dir));
    }
    return spaces.filter(space => {
        return space.row >= 0 &&
        space.row < BOARD_SIZE.y &&
        space.column >= 0 &&
        space.column < BOARD_SIZE.x
    });
}

function get_pawn_direction(team) {
    switch (team) {
        case 'w':
        case 'u':
            return -1;
        default:
            return 1;
    }
}

function get_knight_moves(from) {
    return [
        { row: from.row - 1, column: from.column - 2 },
        { row: from.row - 1, column: from.column + 2 },
        { row: from.row + 1, column: from.column - 2 },
        { row: from.row + 1, column: from.column + 2 },
        { row: from.row - 2, column: from.column - 1 },
        { row: from.row + 2, column: from.column - 1 },
        { row: from.row - 2, column: from.column + 1 },
        { row: from.row + 2, column: from.column + 1 },
    ].filter(space => {
        return space.row >= 0 &&
        space.row < BOARD_SIZE.y &&
        space.column >= 0 &&
        space.column < BOARD_SIZE.x
    });
}

function seek_threats_along_path(board, from, step, piece, get_vision, threats) {
    const space = get_space_in_direction(from, step);
    const threat = board.at_space(space);
    const team = get_team(piece);

    if (threat === 'x') {
        return false;
    }
    if (threat === '' || !get_vision(team, space)) {
        return seek_threats_along_path(board, space, step, piece, get_vision, threats);
    }
    return threats.indexOf(threat[1]) !== -1 && default_can_capture(threat, piece);
}

function seek_check(board, from, piece, get_vision) {
    const team = get_team(piece);
    for (const space of get_knight_moves(from)) {
        if (!get_vision(team, space)) {
            continue;
        }
        const threat = board.at_space(space);
        if (threat[1] === 'n' && default_can_capture(threat, piece)) {
            return true;
        }
    }

    // TODO extract reusable function?
    for (const space of get_bounded_spaces_in_directions(from, ALL_DIRECTIONS)) {
        if (!get_vision(team, space)) {
            continue;
        }
        const threat = board.at_space(space);
        if (threat[1] === 'k' && default_can_capture(threat, piece)) {
            return true;
        }
    }

    for (let dir of DIAGONALS) {
        if (seek_threats_along_path(board, from, dir, piece, get_vision, ['b', 'q'])) {
            return true;
        }
    }
    for (let dir of ORTHAGONALS) {
        if (seek_threats_along_path(board, from, dir, piece, get_vision, ['r', 'q'])) {
            return true;
        }
    }

    const pawnDirection = get_pawn_direction(piece[0])
    if (from.row < pawnDirection || from.row + pawnDirection >= BOARD_SIZE.y) {
        return false;
    }

    const pawnSpace1 = get_space_in_direction(from, { x: 1, y: pawnDirection });
    const pawn1 = board.at_space(pawnSpace1);
    const pawnSpace2 = get_space_in_direction(from, { x: -1, y: pawnDirection });
    const pawn2 = board.at_space(pawnSpace2);
    if (
        (get_vision(team, pawnSpace1) && pawn1[1] === 'p' && default_can_capture(pawn1, piece)) ||
        (get_vision(team, pawnSpace2) && pawn2[1] === 'p' && default_can_capture(pawn2, piece))
    ) {
        return true;
    }

    return false;
}

const MOVES = {
    r: {
        get_moves(board, from, _lastMove, get_vision, can_capture) {
            return moves_in_directions(
                board,
                board.at_space(from),
                from,
                ORTHAGONALS,
                get_vision,
                can_capture,
            );
        },
        get_move_result(board, from, to, _lastMove) {
            if (
                is_same_space(from, to) ||
                (from.row !== to.row && from.column !== to.column)
            ) {
                return from;
            }

            return step_towards(board, from, to);
        },
    },
    b: {
        get_moves(board, from, _lastMove, get_vision, can_capture) {
            return moves_in_directions(
                board,
                board.at_space(from),
                from,
                DIAGONALS,
                get_vision,
                can_capture,
            );
        },
        get_move_result(board, from, to, _lastMove) {
            if (
                is_same_space(from, to) ||
                Math.abs(to.row - from.row) !== Math.abs(to.column - from.column)
            ) {
                return from;
            }

            return step_towards(board, from, to);
        },
    },
    q: {
        get_moves(board, from, _lastMove, get_vision, can_capture) {
            return moves_in_directions(
                board,
                board.at_space(from),
                from,
                ALL_DIRECTIONS,
                get_vision,
                can_capture,
            );
        },
        get_move_result(board, from, to, _lastMove) {
            const delta = { x: to.row - from.row, y: to.column - from.column };
            if (
                !is_same_space(from, to) &&
                (delta.x === 0 ||
                delta.y === 0 ||
                Math.abs(delta.x) === Math.abs(delta.y))
            ) {
                return step_towards(board, from, to);
            }

            return from;
        },
    },
    n: {
        get_moves(board, from, _lastMove, _get_vision, can_capture) {
            const moves = [];
            const tries = get_knight_moves(from);
            for (const space of tries) {
                if (
                    space.row < 0 ||
                    space.row > BOARD_SIZE.y ||
                    space.column < 0 ||
                    space.column > BOARD_SIZE.x
                ) {
                    continue;
                }

                const target = board.at_space(space);
                if (target !== 'x' && (target === '' || can_capture(board.at_space(from), target))) {
                    moves.push(space);
                }
            }
            return moves;
        },
        get_move_result(board, from, to, _lastMove) {
            const absDelta = {
                x: Math.abs(to.column - from.column),
                y: Math.abs(to.row - from.row),
            };
            if (
                (absDelta.x === 1 && absDelta.y === 2) ||
                (absDelta.x === 2 && absDelta.y === 1)
            ) {
                const target = board.at_space(to);
                if (target === '' || default_can_capture(board.at_space(from), target)) {
                    return to;
                }
            }
            return from;
        },
    },
    k: {
        get_moves(board, from, _lastMove, get_vision, can_capture) {
            const moves = [];
            const piece = board.at_space(from);
            const team = get_team(piece);
            const tries = ALL_DIRECTIONS;
            for (const dir of tries) {
                const space = { row: from.row + dir.y, column: from.column + dir.x };
                let target = board.at_space(space);
                if (target === 'x') {
                    continue;
                }
                if (
                    (target === '' || can_capture(piece, board.at_space(space))) &&
                    !seek_check(board, space, piece, get_vision, can_capture)
                ) {
                    moves.push(space);
                }
            }

            if (piece.length === 3) {
                // Castling towards unmoved rook, not through or into check
                let dir = -1;
                let column = from.column;
                let space;
                do {
                    column = column + dir;
                    space = { row: from.row, column };
                } while (
                    column > 0 &&
                    (board.at_space(space) === '' || !get_vision(team, space)) &&
                    !seek_check(board, { row: from.row, column }, piece, get_vision, can_capture)
                );
                if (column === 0 && board.at_space({ row: from.row, column }).length === 3) {
                    moves.push({ row: from.row, column: from.column + 2 * dir });
                }

                // TODO EW CODE REPETITION STINKY
                dir = 1;
                column = from.column;
                do {
                    column = column + dir;
                    space = { row: from.row, column };
                } while (
                    column < BOARD_SIZE.x - 1 &&
                    (board.at_space(space) === '' || !get_vision(team, space)) &&
                    !seek_check(board, { row: from.row, column }, piece, get_vision, can_capture)
                );
                if (column === BOARD_SIZE.x - 1 && board.at_space({ row: from.row, column }).length === 3) {
                    moves.push({ row: from.row, column: from.column + 2 * dir });
                }
            }

            return moves;
        },
        get_move_result(board, from, to, _lastMove) {
            const absDelta = {
                x: Math.abs(to.column - from.column),
                y: Math.abs(to.row - from.row),
            };
            const piece = board.at_space(from);
            if (piece.length === 3 && absDelta.y === 0 && absDelta.x === 2) {
                // Castle attempt
                let mid = { row: from.row, column: from.column + (to.column - from.column) / 2 };
                if (seek_check(board, from, piece, (_team, _space) => true) || seek_check(board, mid, piece, (_team, _space) => true)) {
                    // Illegal first move
                    return from;
                }
                if (seek_check(board, to, piece, (_team, space) => true)) {
                    // Legal first move, illegal second move
                    return mid;
                }
                return to;
            }
            if (is_same_space(from, to) || absDelta.x > 1 || absDelta.y > 1) {
                return from;
            }

            const target = board.at_space(to);
            if (target === '' || default_can_capture(board.at_space(from), target)) {
                return to;
            }

            return from;
        },
    },
    p: {
        get_moves(board, from, lastMove, get_vision, can_capture) {
            const moves = [];
            const piece = board.at_space(from);
            const team = get_team(piece);

            const checkEnPassant = lastMove &&
                lastMove.piece &&
                lastMove.piece[1] === 'p' &&
                Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
                lastMove.to.row === from.row &&
                can_capture(piece, lastMove.piece);

            const dir = get_pawn_direction(piece[0]);

            let space = { row: from.row + dir, column: from.column };
            if (board.at_space(space) === 'x') {
                return [];
            }

            if (board.at_space(space) === '' || !get_vision(team, space)) {
                moves.push(space);
                if (piece.length === 3) {
                    // if unmoved
                    space = { row: from.row + 2 * dir, column: from.column };
                    if (board.at_space(space) === '' || !get_vision(team, space)) {
                        moves.push(space);
                    }
                }
            }

            space = { row: from.row + dir, column: from.column - 1 };
            if (
                (checkEnPassant && space.column === lastMove.from.column) ||
                (
                    get_vision(team, space) &&
                    can_capture(piece, board.at_space(space))
                )
            ) {
                moves.push(space);
            }

            space = { row: from.row + dir, column: from.column + 1 };
            if (
                (checkEnPassant && space.column === lastMove.from.column) ||
                (get_vision(team, space) && can_capture(piece, board.at_space(space)))
            ) {
                moves.push(space);
            }

            return moves;
        },
        get_move_result(board, from, to, lastMove) {
            const piece = board.at_space(from);
            const dir = get_pawn_direction(piece[0]);
            // let absDelta = { x: Math.abs(to.column - from.column), y: Math.abs(to.row - from.row) }
            const delta = { x: to.column - from.column, y: to.row - from.row };
            const target = board.at_space(to);

            if (
            // En passant
                lastMove &&
                lastMove.piece &&
                lastMove.piece[1] === 'p' &&
                Math.abs(lastMove.from.row - lastMove.to.row) === 2 &&
                lastMove.to.row === from.row &&
                lastMove.to.column === to.column &&
                Math.abs(delta.x) === 1 &&
                to.row === from.row + dir &&
                default_can_capture(piece, lastMove.piece)
            ) {
                return to;
            }

            if (delta.x === 0) {
                if (delta.y === dir && target === '') {
                    return to;
                }

                const middle = { row: from.row + dir, column: from.column };
                if (delta.y === 2 * dir && board.at_space(middle) === '') {
                    return target === '' ? to : middle;
                }
            }

            if (Math.abs(delta.x) === 1 && delta.y === dir) {
                if (!!target && default_can_capture(piece, target)) {
                    return to;
                }
            }

            return from;
        },
    },
};

function get_moves(board, from, lastMove, get_vision = (_team, _space) => true, can_capture = default_can_capture) {
    const piece = board.at_space(from);
    if (!piece) {
        return [];
    }

    return MOVES[piece[1]].get_moves(board, from, lastMove, get_vision, can_capture);
}

function get_move_result(board, from, to, lastMove) {
    const piece = board.at_space(from);
    if (!piece) {
        return from;
    }

    return MOVES[piece[1]].get_move_result(board, from, to, lastMove);
}

class GameBoard {
    constructor(codes = BOARD_START) {
        this.codes = deep_copy(codes);

        this.at_space = this.at_space.bind(this);
        this.move_piece = this.move_piece.bind(this);
        this.set_piece = this.set_piece.bind(this);
        this.copy = this.copy.bind(this);
    }

    copy() {
        return new GameBoard(this.codes);
    }

    move_piece(from, to) {
        let piece = this.at_space(from);
        this.set_piece('', from);
        if (piece[1] === 'p') {
            if (Math.abs(from.column - to.column) === 1 && this.at_space(to) === '') {
                // En Passant
                this.set_piece('', { column: to.column, row: from.row });
            }
            if (to.row === 0 || to.row == BOARD_SIZE.y - 1) {
                // Pawn Promotion
                // TODO this should ideally allow the player to select a piece.
                piece = piece[0] + 'q'
            }
        }
        if (piece[1] === 'k' && Math.abs(from.column - to.column) === 2) {
            // Castling
            let delta = to.column - from.column;
            this.move_piece({ column: (delta > 0 ? BOARD_SIZE.x - 1 : 0), row: from.row }, { column: to.column + (delta > 0 ? -1 : 1), row: to.row });
        }
        this.set_piece(piece.substring(0, 2), to);
    }

    set_piece(piece, space) {
        this.codes[space.row][space.column] = piece;
    }

    at_space(space) {
        if (
            space.row < 0 ||
            space.row >= BOARD_SIZE.y ||
            space.column < 0 ||
            space.column >= BOARD_SIZE.x
        ) {
            return 'x';
        }

        return this.codes[space.row][space.column];
    }

    calculate_vision(lastMove) {
        const blank = new Array(BOARD_SIZE.x).fill(false);
        let vision = { w: [], b: [] };
        for (let i = 0; i < BOARD_SIZE.y; i++) {
            vision.w.push([].concat(blank));
            vision.b.push([].concat(blank));
        }
        for (let row = 0; row < BOARD_SIZE.y; row++) {
            for (let column = 0; column < BOARD_SIZE.x; column++) {
                const space = { row, column };
                const piece = this.at_space(space);
                if (!piece) {
                    continue;
                }

                switch (piece[0]) { // Inverted in all cases, see below
                    case 'r':
                        vision.w[row][column] = true;
                        continue;
                    case 'u':
                        vision.b[row][column] = true;
                        continue;
                    case 'w':
                        vision.b[row][column] = true;
                        break;
                    case 'b':
                        vision.w[row][column] = true;
                        break;
                    default:
                        continue;
                }
                const moves = get_moves(this, space, lastMove, global_vision, global_capture);
                for (const move of moves) {
                    vision[piece[0]][move.row][move.column] = true;
                }
            }
        }

        return { white: vision.b, black: vision.w }; // Invert to give vision to all spaces seen by teammate
    }
}

export default GameBoard;
export { GameBoard, get_moves, get_move_result };
