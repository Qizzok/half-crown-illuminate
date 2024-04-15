import { Game } from '../game';
import { LocalProxy } from '../client/proxy';

let game = new Game();
let proxy = new LocalProxy(game);

function hci_host(fastify, _opts, done) {
    fastify.get('/', { websocket: true }, (connection, _req) => {
        connection.socket.on('message', (data) => {
            let msg = {};
            try {
                msg = JSON.parse(data);
            } catch (e) {
                console.log(e);
                // processing? logging?
            } finally {
                switch (msg.type) {
                    case 'start':
                        connection.socket.send(
                            JSON.stringify({
                                type: 'board',
                                codes: game.board.codes,
                            }),
                        );
                        break;
                    case 'pong':
                        break;
                    case 'move':
                        let before = game.turnCount;
                        proxy.send_move(msg.from, msg.to);
                        connection.socket.send(
                            JSON.stringify({
                                type: 'moves',
                                moves: game.moveHistory.slice(0, game.turnCount - before).reverse(),
                            }),
                        );
                        break;
                    default:
                        break;
                }
            }
        });
    });

    done();
}

export default hci_host;
