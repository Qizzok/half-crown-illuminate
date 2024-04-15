precision lowp float;
uniform lowp vec4 uObjectColor;
uniform lowp float uCullRadius;
uniform lowp float uOutlineWidth;
uniform lowp vec4 uOutlineColor;
varying highp vec2 vUv;

void main() {
    float borderMask = 1.0 - (step(uOutlineWidth, vUv.x) * step(uOutlineWidth, 1.0 - vUv.x) * step(uOutlineWidth, vUv.y) * step(uOutlineWidth, 1.0 - vUv.y));
    float cullMask = 1.0 - step(uCullRadius, distance(vUv, vec2(0.5)));
    vec4 outline = uOutlineColor * borderMask;
    cullMask *= 1.0 - borderMask;
    vec4 object = uObjectColor * cullMask;
    gl_FragColor = object + outline;
}
