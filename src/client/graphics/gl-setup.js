import { mat4 } from 'gl-matrix';
import { SQUARE_SIDE_LENGTH, BOARD_SIZE } from '../../config';

const MAX_SCALE = Math.max(BOARD_SIZE.x, BOARD_SIZE.y) * SQUARE_SIDE_LENGTH;

function setShaderProjection(gl, programInfo) {
    // const projectionMatrix = mat4.create();

    // TODO: Magic numbers to be abstracted later
    // const fieldOfView = (45 * Math.PI) / 180;
    // const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
    // const zNear = 0.1;
    // const zFar = 100.0;
    // mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

    // this.gl.canvas.clientHeight
    const orthoMatrix = mat4.create();
    mat4.ortho(orthoMatrix, 0, MAX_SCALE, MAX_SCALE, 0, -1, 1);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        orthoMatrix,
    );
}

function setShaderVertexPosition(gl, buffers, programInfo) {
    const numComponents = 2; // operating in 2 dimensions
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0; // how many bytes to get from one set of values to the next
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );

    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

export { setShaderProjection, setShaderVertexPosition };
