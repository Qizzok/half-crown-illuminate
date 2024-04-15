attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform lowp vec2 uTilesetSize;
uniform lowp vec2 uTilesetIndex;
varying highp vec2 vUv;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    vec2 uvScale = vec2(1.0) / uTilesetSize;
    vec2 uvTopLeft = uvScale * uTilesetIndex;
    vUv = uvTopLeft + aVertexPosition.xy * uvScale;
}
