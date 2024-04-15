import { Game } from '../game';
import { InputHandler } from './input';
import { GLib } from './graphics/glib';
import { LocalProxy } from './proxy';
import { FRAME_TIME_MS, TURN_ORDER } from '../config';

class Engine {
    _glib;
    _game;
    _input;
    _proxy;
    activeTurn;
    players;
    status;

    constructor(canvas, status) {
        this.do_game_loop = this.do_game_loop.bind(this);
        this.run = this.run.bind(this);
        this.new_game = this.new_game.bind(this);
        this.view_first_turn = this.view_first_turn.bind(this);
        this.view_previous_round = this.view_previous_round.bind(this);
        this.view_previous_turn = this.view_previous_turn.bind(this);
        this.view_next_turn = this.view_next_turn.bind(this);
        this.view_next_round = this.view_next_round.bind(this);
        this.view_last_turn = this.view_last_turn.bind(this);
        this.set_blindfold = this.set_blindfold.bind(this);

        this._glib = new GLib(canvas);
        this._game = new Game();
        this._proxy = new LocalProxy(this._game, this.view_last_turn);
        this._input = new InputHandler(this._game, this._proxy, canvas);

        this.status = status;

        this.new_game();
    }

    new_game() {
        this.players = {
            white: {
                team: 'white',
                selected: undefined,
                hovered: undefined,
                moveOptions: [],
            },
            black: {
                team: 'black',
                selected: undefined,
                hovered: undefined,
                moveOptions: [],
            },
        };
        this._proxy.bind_input(this._input, this.players);
        this._input.set_player(this.players.white);
        this._input.isBlindfolded = false;
        this._game.new_game();
        this.view_last_turn();
    }

    set_blindfold(usesBlindfold) {
        this._input.usesBlindfold = usesBlindfold;
        if (this._input.isBlindfolded && !usesBlindfold) {
            this._input.isBlindfolded = false;
        }
    }

    view_first_turn() {
        this.activeTurn = 0;
        this.update();
    }

    view_previous_round() {
        this.activeTurn = Math.max(0, this.activeTurn - TURN_ORDER.length);
        this.update();
    }

    view_previous_turn() {
        this.activeTurn = Math.max(0, this.activeTurn - 1);
        this.update();
    }

    view_next_turn() {
        this.activeTurn = Math.min(this._game.turnCount, this.activeTurn + 1);
        this.update();
    }

    view_next_round() {
        this.activeTurn = Math.mind(this._game.turnCount, this.activeTurn + TURN_ORDER.length)
        this.update();
    }

    view_last_turn() {
        this.activeTurn = this._game.turnCount;
        this.update();
    }

    update() {
        this._input.enabled = this.activeTurn === this._game.turnCount;
        let statusText = this._game.turn === 'END' ?
            `Game over! You survived ${this._game.turnCount + 1} turns.` :
            `Viewing turn ${this.activeTurn + 1} of ${this._game.turnCount + 1}. Next to move: ${TURN_ORDER[this.activeTurn % TURN_ORDER.length]}.`;
        this.status.innerText = statusText;
    }

    do_game_loop() {
        let player = this.players[this._game.turn] ?? this.players.white;
        this._glib.render(this._game, this.activeTurn, player, this._input.isBlindfolded);
    }

    run() {
        this._input.bind_canvas();
        setInterval(this.do_game_loop, FRAME_TIME_MS);
    }
}

export { Engine };
