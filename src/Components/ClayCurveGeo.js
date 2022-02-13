import React, {useRef, useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {constructDonutBufferGeometry} from "../three/donut";
import {constructBufferGeometryFromFrames, generateFramesFromClayPoints} from "../three/bufferGeometryGeneration";
import {flatOval} from "../three/clay-brick/clay-profiles";

const ClayCurveGeo = (props) => {
    const {radius, bodyLength, divisionLength, thickness, divisionsV, uvGrid} = props;

    const [hovered, setHover] = useState(true);

    const clayPoints = flatOval(radius, bodyLength, divisionLength);
    const {frames, divisionsUV} = generateFramesFromClayPoints(clayPoints, thickness, divisionsV, uvGrid);
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

export default ClayCurveGeo;
