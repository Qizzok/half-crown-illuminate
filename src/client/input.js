import { get_moves } from '../board';
import { BOARD_SIZE, BOARD_LAYOUT_FROM_CANVAS } from '../config';

function quashEvent(e) {
    if (e && e.preventDefault) {
        e.preventDefault();
    }

    if (e && e.stopPropagation) {
        e.stopPropagation();
    }

    return false;
}

function getEventSpace(canvas, e, reversed) {
    const layout = BOARD_LAYOUT_FROM_CANVAS(canvas);
    const boardPos = {
        x: e.pageX - e.target.offsetLeft - layout.offset.left,
        y: e.pageY - e.target.offsetTop - layout.offset.top,
    };
    const square = {
        column: Math.floor(boardPos.x / layout.side),
        row: Math.floor(boardPos.y / layout.side),
    };
    return rectify_space(square, reversed);
}

function rectify_space(square, reversed) {
    return reversed ? { column: BOARD_SIZE.x - 1 - square.column, row: BOARD_SIZE.y - 1 - square.row } : square;
}

function get_bounded_space_in_direction(from, dir) {
    return {
        row: Math.max(0, Math.min(BOARD_SIZE.y - 1, from.row + dir.y)),
        column: Math.max(0, Math.min(BOARD_SIZE.x - 1, from.column + dir.x)),
    };
}

class InputHandler {
    _game;
    _proxy;
    canvas;
    player;
    usesBlindfold = true;
    isBlindfolded = false;
    enabled = false;

    constructor(game, proxy, canvas) {
        this._game = game;
        this._proxy = proxy;
        this.canvas = canvas;
    }

    bind_canvas() {
        this.canvas.ontouchstart = this.on_touch_start.bind(this);
        this.canvas.ontouchmove = this.on_touch_move.bind(this);
        this.canvas.ontouchend = this.on_touch_end.bind(this);
        this.canvas.ontouchcancel = this.on_touch_cancel.bind(this);
        this.canvas.onclick = this.on_click.bind(this);
        this.canvas.onkeydown = this.on_key_down.bind(this);
        this.canvas.onblur = this.on_blur.bind(this);
        this.enabled = true;
    }

    set_player(player) {
        this._player = player;
        this._player.hovered = this._player.selected;
        this.isBlindfolded = this.usesBlindfold;
    }

    on_touch_start(e) {
        return quashEvent(e);
    }

    on_touch_move(e) {
        return quashEvent(e);
    }

    on_touch_end(e) {
        return quashEvent(e);
    }

    on_touch_cancel(e) {
        return quashEvent(e);
    }

    on_click(e) {
        quashEvent(e);
        if (!this._player || this._game.turn !== this._player.team || !this.enabled) {
            return;
        }
        if (this.isBlindfolded) {
            this.isBlindfolded = false;
            return;
        }
        const space = getEventSpace(this.canvas, e, this._player.team === 'black');

        this.handle_space_input(space);
    }

    on_blur(_e) {
        if (this._player) {
            this._player.hovered = undefined;
        }
    }

    on_key_down(e) {
        if (!this._player || !this.enabled) {
            return;
        }
        if (this.isBlindfolded) {
            this.isBlindfolded = false;
            return;
        }
        const reversed = this._player.team === 'black';
        switch (e.key) {
            case 'ArrowUp':
                this._player.hovered = get_bounded_space_in_direction(this._player.hovered ?? { row: 0, column: 0 }, { x: 0, y: reversed ? 1 : -1 });
                break;
            case 'ArrowDown':
                this._player.hovered = get_bounded_space_in_direction(this._player.hovered ?? { row: 0, column: 0 }, { x: 0, y: reversed ? -1 : 1 });
                break;
            case 'ArrowLeft':
                this._player.hovered = get_bounded_space_in_direction(this._player.hovered ?? { row: 0, column: 0 }, { x: reversed ? 1 : -1, y: 0 });
                break;
            case 'ArrowRight':
                this._player.hovered = get_bounded_space_in_direction(this._player.hovered ?? { row: 0, column: 0 }, { x: reversed ? -1 : 1, y: 0 });
                break;
            case 'Enter':
                if (this._player.hovered && this._game.turn === this._player.team) {
                    this.handle_space_input(this._player.hovered);
                }
                break;
            default:
                return;
        }
        quashEvent(e);
    }

    handle_space_input(space) {
        if (this.isBlindfolded) {
            this.isBlindfolded = false;
            return;
        }

        for (let move of this._player.moveOptions) {
            if (move.row === space.row && move.column === space.column) {
                let from = this._player.selected;
                this._player.selected = undefined;
                this._player.moveOptions = [];
                this._proxy.send_move(from, space);
                return;
            }
        }

        if (this._player.selected && space.row === this._player.selected.row && space.column === this._player.selected.column) {
            this._player.selected = undefined;
            this._player.moveOptions = [];
        }

        const piece = this._game.board.at_space(space);
        if (piece && piece[0] === this._player.team[0]) {
            this._player.hovered = space;
            this._player.selected = space;
            this._player.moveOptions = get_moves(this._game.board, space, this._game.moveHistory[this._game.moveHistory.length - 1], this._game.get_vision);
        } else {
            this._player.selected = undefined;
            this._player.moveOptions = [];
        }
    }
}

export { InputHandler };
