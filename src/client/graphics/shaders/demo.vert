attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
varying highp vec2 vUv;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vUv = aVertexPosition.xy;
}
