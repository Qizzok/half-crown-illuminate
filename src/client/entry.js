import { Engine } from './engine';

document.body.onload = function () {
    const canvas = document.getElementById('content');
    
    const status = document.getElementById('status');

    const firstTurnButton = document.getElementById('firstTurn');
    const prevRoundButton = document.getElementById('prevRound');
    const prevTurnButton = document.getElementById('prevTurn');
    const nextTurnButton = document.getElementById('nextTurn');
    const nextRoundButton = document.getElementById('nextRound');
    const lastTurnButton = document.getElementById('lastTurn');
    const newGameButton = document.getElementById('newGame');
    const blindfoldSelect = document.getElementById('blindfold');

    const engine = new Engine(canvas, status);
    newGameButton.onclick = engine.new_game;
    firstTurnButton.onclick = engine.view_first_turn;
    prevRoundButton.onclick = engine.view_previous_round;
    prevTurnButton.onclick = engine.view_previous_turn;
    nextTurnButton.onclick = engine.view_next_turn;
    nextRoundButton.onclick = engine.view_next_round;
    lastTurnButton.onclick = engine.view_last_turn;
    blindfoldSelect.onclick = function() {
        engine.set_blindfold(blindfoldSelect.checked)
    };
    engine.run()
};
