import { GameBoard,  get_move_result } from './board';
import { TURN_ORDER, ENEMY_TURN_SPAWN_DENSITY } from './config';

class Game {
    board;
    stateHistory;
    vision;
    turn;
    turnCount;
    moveHistory;
    lastSpawnTurn;

    constructor() {
        this.move_piece = this.move_piece.bind(this);
        this.spawn_piece = this.spawn_piece.bind(this);
        this.next_turn = this.next_turn.bind(this);
        this.get_vision = this.get_vision.bind(this);
        this.new_game = this.new_game.bind(this);
    }

    new_game() {
        this.board = new GameBoard();
        this.stateHistory = [{ board: this.board.copy() }]
        this.vision = {};
        this.turn = TURN_ORDER[0];
        this.turnCount = 0;
        this.moveHistory = [];
        this.lastSpawnTurn = { r: -ENEMY_TURN_SPAWN_DENSITY, u: -ENEMY_TURN_SPAWN_DENSITY };
    }

    move_piece(from, to, assertive = false) {
        const result = assertive ?
            to :
            get_move_result(
                this.board,
                from,
                to,
                this.moveHistory[0],
            );

        const piece = this.board.at_space(from);
        const target = this.board.at_space(result);
        this.board.move_piece(from, result);

        this.moveHistory.push({ piece, from, to: result });

        this.vision = {};
        this.next_turn();
        if (target[1] === 'k' && piece !== target) {
            this.turn = 'END';
        }
    }

    spawn_piece(piece, tile) {
        this.board.set_piece(piece, tile);
        this.moveHistory.push({ piece, from: tile, to: tile });
        this.vision = {};
        this.lastSpawnTurn[piece[0]] = this.turnCount;
        this.next_turn();
    }

    at_space(tile, turn) {
        let state = this.stateHistory[turn]
        return state.board.at_space(tile)
    }

    get_vision(team, tile, turn) {
        if (this.turn === 'END') {
            return true;
        }
        let state = this.stateHistory[turn ?? this.turnCount]
        if (!state.vision) {
            // TODO USE LAST MOVE
            state.vision = state.board.calculate_vision({});
            this.stateHistory[turn ?? this.turnCount] = state;
        }
        return state.vision[team][tile.row][tile.column];
    }

    next_turn() {
        this.turnCount = this.turnCount + 1;
        this.turn = TURN_ORDER[this.turnCount % TURN_ORDER.length];
        this.stateHistory.push({ board: this.board.copy() })
    }
}

export { Game };
