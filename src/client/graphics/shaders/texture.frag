precision lowp float;
uniform sampler2D uSampler;
uniform lowp vec4 uTint;
varying highp vec2 vUv;

void main() {
    gl_FragColor = texture2D(uSampler, vUv) * uTint;
}
