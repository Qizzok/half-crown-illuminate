import { do_enemy_turn } from '../enemy';

class Proxy {
    _game;

    constructor(game) {
        this.send_move = this.send_move.bind(this);
        this._game = game;
    }

    send_move(_from, _to) {}
}

class LocalProxy extends Proxy {
    _input;
    players;
    on_turn_change;

    constructor(game, turn_change_callback) {
        super(game);
        this.on_turn_change = turn_change_callback;
    }

    bind_input(input, players) {
        this._input = input;
        this.players = players;
    }

    send_move(from, to) {
        this._game.move_piece(from, to);
        if (this._game.turn === 'END') {
            // Player captured teammate's king. Edge case but possible through misplay or very bad strategy.
            return this.on_turn_change();
        }
        do_enemy_turn(this._game);
        if (this._input && this._input.set_player && this.players && this.players[this._game.turn]) {
            this._input.set_player(this.players[this._game.turn]);
        }
        this.on_turn_change();
    }
}

class NetworkProxy extends Proxy {
    _socket;

    constructor(url, game) {
        super(game);

        this._socket = new WebSocket(url);

        this._socket.addEventListener('open', (_e) => {
            // this._socket.send('hello, server!')
        });

        this._socket.addEventListener('message', (e) => {
            const msg = JSON.parse(e.data);
            switch (msg.type) {
                case 'ping':
                    this._socket.send(JSON.stringify({ type: 'pong' }));
                    break;
                case 'start':
                    break;
                case 'moves':
                    for (const move of msg.moves) {
                        this._game.move_piece(move.from, move.to, true);
                    }
                    break;
                case 'timeout':
                    break;
                case 'reject': // deliberate fallthrough
                default:
                    break;
            }
        });
    }

    send_move(from, to) {
        this._socket.send(
            JSON.stringify({
                type: 'move',
                from,
                to,
            }),
        );
    }
}

export { NetworkProxy, LocalProxy };
