import React, { useRef, useState } from 'react'
import {useFrame } from '@react-three/fiber'

const Box = (props) => {
    // This reference will give us direct access to the mesh
    // Set up state for the hovered and active state

    const mesh = useRef()
    const [hovered, setHover] = useState(false)
    const [active, setActive] = useState(false)
    // Subscribe this component to the render-loop, rotate the mesh every frame
    // useFrame((state, delta) => (mesh.current.rotation.x += 0.01))
    // Return view, these are regular three.js elements expressed in JSX
    return (
        <mesh
            {...props}
            ref={mesh}
            scale={active ? 1.5 : 1}
            onClick={(event) => {
                setActive(!active);
                console.log(event);
            }}
            onPointerOver={(event) => {
                setHover(true);
            }}
            onPointerOut={(event) => setHover(false)}>
            <boxGeometry args={[100, 100, 100]} />
            <meshLambertMaterial color={hovered ? 'hotpink' : 'orange'} />
        </mesh>
    )
}

export default Box;
