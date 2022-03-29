import React, {useRef, useState} from 'react';
import {
    generateFramesFromClayCurve,
    visualiseFrames
} from "../three/bufferGeometryGeneration";
import {flatOval} from "../three/clay-brick/clay-profiles";
import {ClayPatternCurve} from "../three/clay-brick/clay-pattern-curve";
import {PATTERN_LIST} from "../three/clay-brick/clay-patterns";


const FramesClayCurve = (props) => {
    const {radius, bodyLength, divisionLength, thickness, divisionsV, uvGrid} = props;

    const [hovered, setHover] = useState(true);

    const clayPoints = flatOval(radius, bodyLength, divisionLength);

    const clayCurve = new ClayPatternCurve(clayPoints, false);

    const {patternParameters, patternFunction} = PATTERN_LIST.sinWaveUVPattern;

    const defaultPatternParameters = Object.fromEntries(Object.keys(patternParameters).map(key => {return [key, patternParameters[key].default]}));

    clayCurve.applyPattern(patternFunction, defaultPatternParameters);
    const {frames} = generateFramesFromClayCurve(clayCurve, thickness, divisionsV, uvGrid);

    const {positions, normals, uvs} = visualiseFrames(frames, 10.);

    console.log(positions, normals, uvs);

    const mesh = useRef()

    return (
        <mesh
            ref={mesh}
            onPointerOver={() => {
                setHover(true);
            }}
            onPointerOut={() => setHover(false)}>
            >
            <bufferGeometry>
                <bufferAttribute attachObject={['attributes', 'position']} count={positions.length / 3} array={positions} itemSize={3} />
                <bufferAttribute attachObject={['attributes', 'normal']} count={positions.length / 3} array={normals} itemSize={3} />
                <bufferAttribute attachObject={['attributes', 'uv']} count={uvs.length / 2} array={uvs} itemSize={2} />
            </bufferGeometry>
            <shaderMaterial
                // attach="material"
                args={[{
                    name: "hsvShader",
                    vertexShader: `
                        varying vec3 v_Normal;
                        varying vec2 vUv;
                        
                        uniform vec2 styleOffset;
                        varying vec2 vStyleOffset;
                    
                        void main() {
                            vUv = uv - vec2(0.5, 0.5);
                            v_Normal = normal;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }`,
                    fragmentShader: `
                        varying vec3 v_Normal;
                        varying vec2 vUv;
                        
                        vec3 hsv2rgb(vec3 c)
                        {
                            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
                        }
                        
                        void main() {
                            gl_FragColor = vec4(hsv2rgb(vec3(atan(vUv.y, vUv.x) * 0.1591549, 1. - length(vUv), 1. - length(vUv))), 1.0);
                            // vec3 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
                
                        }`,
                    transparent: true,
                }]}
            />
        </mesh>

    )
}

export default FramesClayCurve;
