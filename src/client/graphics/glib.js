import { mat4, quat } from 'gl-matrix';
import { buildDemoMaterial, buildTextureMaterial } from './material';
import { loadTexture, setShaderTexture } from './texture';
import spritesheet from './pieces_sprite.svg';
import { CLEAR_COLOR, BOARD_COLOR_A, BOARD_COLOR_B, BOARD_SIZE, BOARD_LAYOUT_FROM_CANVAS, SELECT_COLOR, HOVER_COLOR, MOVE_HISTORY_LENGTH } from '../../config';

const TILE_COUNT = BOARD_SIZE.x * BOARD_SIZE.y;

function index_to_tile(index, reversed = false) {
    const column = index % BOARD_SIZE.x;
    const row = Math.floor(index / BOARD_SIZE.x);
    const left = (reversed ? BOARD_SIZE.x - 1 - column : column);
    const top = (reversed ? BOARD_SIZE.y - 1 - row : row);
    return { column, row, left, top };
}

function get_texture_index(piece) {
    switch (piece.substr(0, 2)) {
        case 'wp':
        case 'rp':
        case 'up':
            return [5, 0];
        case 'bp':
            return [5, 1];

        case 'wr':
        case 'rr':
        case 'ur':
            return [4, 0];
        case 'br':
            return [4, 1];

        case 'wn':
        case 'rn':
        case 'un':
            return [3, 0];
        case 'bn':
            return [3, 1];

        case 'wb':
        case 'rb':
        case 'ub':
            return [2, 0];
        case 'bb':
            return [2, 1];

        case 'wq':
        case 'rq':
        case 'uq':
            return [1, 0];
        case 'bq':
            return [1, 1];

        case 'wk':
        case 'wk0':
            return [0, 0];
        case 'bk':
        case 'bk0':
            return [0, 1];

        default:
            return [0, 0];
    }
}

function get_tint(piece) {
    if (piece === '') {
        return;
    }

    switch (piece[0]) {
        case 'r':
            return [1.0, 0.0, 0.0, 1.0];
        case 'u':
            return [0.0, 0.0, 1.0, 1.0];
        default:
            return [1.0, 1.0, 1.0, 1.0];
    }
}

function adjust_piece(piece, reversed) {
    if (!reversed) {
        return piece;
    }
    switch (piece[0]) {
        case 'r':
            return 'u' + piece.substring(1);
        case 'u':
            return 'r' + piece.substring(1);
        case 'w':
        case 'b':
        default:
            return piece;
    }
}

class GLib {
    gl;
    demoMaterial;
    primitives;
    positionBuffer;
    isBufferDirty = true;
    isViewportSet = true;

    constructor(canvas) {
        this.gl = canvas.getContext('webgl');

        new ResizeObserver((entries) => {
            this.gl.canvas.width = entries[0].contentRect.width;
            this.gl.canvas.height = entries[0].contentRect.height;
            this.gl.viewport(0, 0, entries[0].contentRect.width, entries[0].contentRect.height);
        }).observe(canvas);

        // configure gl context
        this.gl.clearColor(...CLEAR_COLOR);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        // Create buffers
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);

        // Build materials
        this.demoMaterial = buildDemoMaterial(this.gl);
        this.textureMaterial = buildTextureMaterial(this.gl);
        this.pieceTexture = loadTexture(this.gl, spritesheet);
    }

    invalidate() {
        this.isBufferDirty = true;
    }

    setBuffers() {
        this.isBufferDirty = false;

        const positions = [0, 0, 1, 0, 0, 1, 1, 1];

        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array(positions),
            this.gl.STATIC_DRAW,
        );
    }

    setShaders(material) {
        this.gl.useProgram(material.program);

        const numComponents = 2; // operating in 2 dimensions
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0; // how many bytes to get from one set of values to the next
        const offset = 0;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.vertexAttribPointer(
            material.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset,
        );
        this.gl.enableVertexAttribArray(material.attribLocations.vertexPosition);

        const orthoMatrix = mat4.create();
        mat4.ortho(orthoMatrix, 0, this.gl.canvas.clientWidth, this.gl.canvas.clientHeight, 0, -1, 1);
        this.gl.uniformMatrix4fv(
            material.uniformLocations.projectionMatrix,
            false,
            orthoMatrix,
        );
    }

    render(game, turn, player, spoiler = false) {
        if (!this.isViewportSet) {
            this.gl.viewport(0, 0, this.gl.canvas.clientWidth, this.gl.canvas.clientHeight);
            this.isViewportSet = true;
        }

        if (spoiler) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            return;
        }
        const reversed = player.team === 'black';
        const layout = BOARD_LAYOUT_FROM_CANVAS(this.gl.canvas);

        if (this.isBufferDirty) {
            this.setBuffers();
        }

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.setShaders(this.demoMaterial);

        let lastMoves = turn > 0 ? game.moveHistory.slice(Math.max(0, turn - MOVE_HISTORY_LENGTH), turn) : [];

        for (let i = 0; i < TILE_COUNT; i++) {
            const tile = index_to_tile(i, reversed);
            const hasVision = game.get_vision(player.team, tile, turn);
            const color = [].concat(i % 2 === tile.row % 2 ? BOARD_COLOR_B : BOARD_COLOR_A);
            if (turn === game.turnCount && player.selected && player.selected.row === tile.row && player.selected.column === tile.column) {
                this.gl.uniform1f(this.demoMaterial.uniformLocations.outlineWidth, 0.1);
                this.gl.uniform4fv(this.demoMaterial.uniformLocations.outlineColor, SELECT_COLOR);
            } else if (turn === game.turnCount && player.hovered && player.hovered.row === tile.row && player.hovered.column === tile.column) {
                this.gl.uniform1f(this.demoMaterial.uniformLocations.outlineWidth, 0.1);
                this.gl.uniform4fv(this.demoMaterial.uniformLocations.outlineColor, HOVER_COLOR);
            } else {
                this.gl.uniform1f(this.demoMaterial.uniformLocations.outlineWidth, -1);
            }

            if (!hasVision) {
                color[0] = color[0] * 0.25;
                color[1] = color[1] * 0.25;
                color[2] = color[2] * 0.25;
            }
            this.renderRectangle(
                layout.offset.left + layout.side * tile.left,
                layout.offset.top + layout.side * tile.top,
                layout.side,
                layout.side,
                false,
                color,
            );
            for (const move of lastMoves) {
                if (
                    move.from &&
                    move.to &&
                    hasVision && (
                        (tile.row === move.from.row && tile.column === move.from.column) ||
                        (tile.row === move.to.row && tile.column === move.to.column)
                    )
                ) {
                    this.renderRectangle(
                        layout.offset.left + layout.side * tile.left,
                        layout.offset.top + layout.side * tile.top,
                        layout.side,
                        layout.side,
                        false,
                        [1, 0, 0, 0.5],
                    );
                }
            }
        }

        if (turn === game.turnCount) {
            for (const move of player.moveOptions) {
                this.renderCircle(
                    layout.offset.left + ((reversed ? BOARD_SIZE.x - 1 - move.column : move.column) + 0.5) * layout.side,
                    layout.offset.top + ((reversed ? BOARD_SIZE.y - 1 - move.row : move.row) + 0.5) * layout.side,
                    0.1 * layout.side,
                    true,
                    [0, 1, 0, 1],
                );
            }
        }

        this.setShaders(this.textureMaterial);
        setShaderTexture(this.gl, this.pieceTexture, this.textureMaterial);
        for (let i = 0; i < TILE_COUNT; i++) {
            const tile = index_to_tile(i, reversed);
            // tile has unnecessary left + top but also necessary column and row
            if (game.get_vision(player.team, tile, turn)) {
                const piece = adjust_piece(game.at_space(tile, turn), reversed);
                this.renderPiece(
                    layout.offset.left + layout.side * tile.left,
                    layout.offset.top + layout.side * tile.top,
                    layout.side,
                    layout.side,
                    piece,
                );
            }
        }
    }

    renderPiece(left, top, width, height, piece, centred = false) {
        if (piece === '') {
            return;
        }

        const SQUARE_BUFFER_OFFSET = 0;
        const SQUARE_BUFFER_LENGTH = 4;

        const view = mat4.create();
        mat4.fromRotationTranslationScale(
            view,
            quat.create(),
            [
                centred ? left - width / 2 : left,
                centred ? top - height / 2 : top,
                0.1,
            ],
            [width, height, 1],
        );
        this.gl.uniformMatrix4fv(
            this.textureMaterial.uniformLocations.modelViewMatrix,
            false,
            view,
        );
        this.gl.uniform2fv(
            this.textureMaterial.uniformLocations.tilesetIndex,
            get_texture_index(piece),
        );
        this.gl.uniform4f(this.textureMaterial.uniformLocations.tint, ...get_tint(piece));
        this.gl.drawArrays(
            this.gl.TRIANGLE_STRIP,
            SQUARE_BUFFER_OFFSET,
            SQUARE_BUFFER_LENGTH,
        );
    }

    renderCircle(left, top, radius, centred = true, color) {
        const SQUARE_BUFFER_OFFSET = 0;
        const SQUARE_BUFFER_LENGTH = 4;

        const view = mat4.create();
        mat4.fromRotationTranslationScale(
            view,
            quat.create(),
            [centred ? left - radius : left, centred ? top - radius : top, 0.2],
            [radius * 2, radius * 2, 1],
        );
        this.gl.uniformMatrix4fv(
            this.demoMaterial.uniformLocations.modelViewMatrix,
            false,
            view,
        );
        this.gl.uniform1f(this.demoMaterial.uniformLocations.cullRadius, 0.5);
        this.gl.uniform4fv(
            this.demoMaterial.uniformLocations.objectColor,
            color || this.defaultColor,
        );
        this.gl.drawArrays(
            this.gl.TRIANGLE_STRIP,
            SQUARE_BUFFER_OFFSET,
            SQUARE_BUFFER_LENGTH,
        );
    }

    renderRectangle(left, top, width, height, centred = false, color) {
        const SQUARE_BUFFER_OFFSET = 0;
        const SQUARE_BUFFER_LENGTH = 4;

        const view = mat4.create();
        mat4.fromRotationTranslationScale(
            view,
            quat.create(),
            [centred ? left - width / 2 : left, centred ? top - height / 2 : top, 0],
            [width, height, 1],
        );
        this.gl.uniformMatrix4fv(
            this.demoMaterial.uniformLocations.modelViewMatrix,
            false,
            view,
        );
        this.gl.uniform1f(this.demoMaterial.uniformLocations.cullRadius, 1);
        this.gl.uniform4fv(
            this.demoMaterial.uniformLocations.objectColor,
            color || this.defaultColor,
        );
        this.gl.drawArrays(
            this.gl.TRIANGLE_STRIP,
            SQUARE_BUFFER_OFFSET,
            SQUARE_BUFFER_LENGTH,
        );
    }
}

export { GLib };
