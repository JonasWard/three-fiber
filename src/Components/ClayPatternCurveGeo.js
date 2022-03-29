import React, {useRef, useState} from 'react';
import {
    constructBufferGeometryFromFrames,
    generateFramesFromClayCurve
} from "../three/bufferGeometryGeneration";
import {flatOval} from "../three/clay-brick/clay-profiles";
import {ClayPatternCurve} from "../three/clay-brick/clay-pattern-curve";
import {PATTERN_LIST} from "../three/clay-brick/clay-patterns";

const ClayPatternCurveGeo = (props) => {
    const {radius, bodyLength, divisionLength, thickness, divisionsV, uvGrid} = props.props;
    const {height} = props;

    // const [hovered, setHover] = useState(true);

    const clayPoints = flatOval(radius, bodyLength, divisionLength, height);

    const clayCurve = new ClayPatternCurve(clayPoints, false);

    const {patternParameters, patternFunction} = PATTERN_LIST.sinWaveUVPattern;

    const defaultPatternParameters = Object.fromEntries(Object.keys(patternParameters).map(key => {return [key, patternParameters[key].default]}));

    clayCurve.applyPattern(patternFunction, defaultPatternParameters);
    const {populatedFrames, divisionsUV} = generateFramesFromClayCurve(clayCurve, thickness, divisionsV, uvGrid);
    const {positions, normals, uvs} = constructBufferGeometryFromFrames(populatedFrames, divisionsUV, clayCurve.isClosed);

    // const mesh = useRef()
    // // useFrame((state, delta) => (mesh.current.rotation.y += 0.01));

    return (
        <mesh
            // ref={mesh}
            // onPointerOver={() => {
            //     setHover(true);
            // }}
            // onPointerOut={() => setHover(false)}>
            >
            <bufferGeometry>
                <bufferAttribute attachObject={['attributes', 'position']} count={positions.length / 3} array={positions} itemSize={3} />
                <bufferAttribute attachObject={['attributes', 'normal']} count={positions.length / 3} array={normals} itemSize={3} />
                <bufferAttribute attachObject={['attributes', 'uv']} count={uvs.length / 2} array={uvs} itemSize={2} />
            </bufferGeometry>
            <meshLambertMaterial color={0x750000} sides={"both"}/>
        </mesh>

    )
}

export default ClayPatternCurveGeo;
