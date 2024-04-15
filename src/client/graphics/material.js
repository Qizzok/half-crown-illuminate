import vs from './shaders/demo.vert';
import fs from './shaders/demo.frag';
import vsTex from './shaders/texture.vert';
import fsTex from './shaders/texture.frag';

const _TYPE = {
    vert: (gl) => {
        return gl.VERTEX_SHADER;
    },
    frag: (gl) => {
        return gl.FRAGMENT_SHADER;
    },
};

const shaderData = {
    vertexDemo: {
        source: vs,
        type: _TYPE.vert,
        uniforms: {
            modelViewMatrix: 'uModelViewMatrix',
            projectionMatrix: 'uProjectionMatrix',
        },
        attributes: {
            vertexPosition: 'aVertexPosition',
        },
    },
    vertexTexture: {
        source: vsTex,
        type: _TYPE.vert,
        uniforms: {
            modelViewMatrix: 'uModelViewMatrix',
            projectionMatrix: 'uProjectionMatrix',
            tilesetSize: 'uTilesetSize',
            tilesetIndex: 'uTilesetIndex',
        },
        attributes: {
            vertexPosition: 'aVertexPosition',
        },
    },
    fragmentDemo: {
        source: fs,
        type: _TYPE.frag,
        uniforms: {
            objectColor: 'uObjectColor',
            cullRadius: 'uCullRadius',
            outlineWidth: 'uOutlineWidth',
            outlineColor: 'uOutlineColor',
        },
        attributes: {},
    },
    fragmentTexture: {
        source: fsTex,
        type: _TYPE.frag,
        uniforms: {
            sampler: 'uSampler',
            tint: 'uTint',
        },
        attributes: {},
    },
};

function buildShader(gl, data) {
    const shader = gl.createShader(data.type(gl));
    gl.shaderSource(shader, data.source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`Unable to compile shader: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function buildMaterial(gl, shaders) {
    const program = gl.createProgram();
    for (const shader of shaders) {
        gl.attachShader(program, buildShader(gl, shader));
    }

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(`Unable to link shaders: ${gl.getProgramInfoLog(program)}`);
        return null;
    }

    const attribLocations = {};
    const uniformLocations = {};
    let uniforms = {};
    let attributes = {};

    for (const shader of shaders) {
        uniforms = { ...uniforms, ...shader.uniforms };
        attributes = { ...attributes, ...shader.attributes };
    }

    for (const u of Object.keys(uniforms)) {
        uniformLocations[u] = gl.getUniformLocation(
            program,
            uniforms[u],
        );
    }

    for (const a of Object.keys(attributes)) {
        attribLocations[a] = gl.getAttribLocation(
            program,
            attributes[a],
        );
    }

    return {
        program,
        attribLocations,
        uniformLocations,
    };
}

function buildDemoMaterial(gl) {
    return buildMaterial(gl, [shaderData.vertexDemo, shaderData.fragmentDemo]);
}

function buildTextureMaterial(gl) {
    return buildMaterial(gl, [
        shaderData.vertexTexture,
        shaderData.fragmentTexture,
    ]);
}

export { buildDemoMaterial, buildTextureMaterial };
