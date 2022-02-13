import React, {useRef, useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {
    constructBufferGeometryFromFrames,
    generateFramesFromClayCurve
} from "../three/bufferGeometryGeneration";
import {flatOval} from "../three/clay-brick/clay-profiles";
import {ClayPatternCurve} from "../three/clay-brick/clay-pattern-curve";
import {PATTERN_LIST} from "../three/clay-brick/clay-patterns";

const ClayPatternCurveGeo = (props) => {
    const {radius, bodyLength, divisionLength, thickness, divisionsV, uvGrid} = props;

    const [hovered, setHover] = useState(true);

    const clayPoints = flatOval(radius, bodyLength, divisionLength);

    const clayCurve = new ClayPatternCurve(clayPoints);

    const {patternParameters, patternFunction} = PATTERN_LIST.sinWaveUVPattern;

    const defaultPatternParameters = Object.fromEntries(Object.keys(patternParameters).map(key => {return [key, patternParameters[key].default]}));
    console.log(patternParameters);
    console.log(patternFunction);
    console.log(defaultPatternParameters);

    clayCurve.applyPattern(patternFunction, defaultPatternParameters);
    const {frames, divisionsUV} = generateFramesFromClayCurve(clayCurve, thickness, divisionsV, uvGrid);
    const {positions, normals, uvs} = constructBufferGeometryFromFrames(frames, divisionsUV);

    const mesh = useRef()
    useFrame((state, delta) => (mesh.current.rotation.y += 0.02))

    console.log(positions, normals, uvs);

    return (
        <mesh
            ref={mesh}
            onPointerOver={(event) => {
                setHover(true);
            }}
            onPointerOut={(event) => setHover(false)}>
            >
            <bufferGeometry>
                <bufferAttribute attachObject={['attributes', 'position']} count={positions.length / 3} array={positions} itemSize={3} />
                <bufferAttribute attachObject={['attributes', 'normal']} count={positions.length / 3} array={normals} itemSize={3} />
                <bufferAttribute attachObject={['attributes', 'uv']} count={uvs.length / 2} array={uvs} itemSize={2} />
            </bufferGeometry>
            <meshLambertMaterial color={ hovered ? 0x750000 : 0xd33300 } sides={"both"}/>
        </mesh>

    )
}

export default ClayPatternCurveGeo;
