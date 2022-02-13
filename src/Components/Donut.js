import React, {useRef, useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {constructDonutBufferGeometry} from "../three/donut";

const Donut = (props) => {
    const {radius, position, thickness, divisionsUV, uvGrid} = props;

    const [hovered, setHover] = useState(true);

    const {positions, normals, uvs} = constructDonutBufferGeometry(radius, position, thickness, divisionsUV, uvGrid);

    const mesh = useRef()
    useFrame((state, delta) => (mesh.current.rotation.y += 0.01))

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
            <meshLambertMaterial color={ hovered ? 0x990000 : 0xd3f300 } />
        </mesh>

    )
}

export default Donut;