import React, {useRef, useState} from 'react';
import {useFrame} from '@react-three/fiber';
import ClayPatternCurveGeo from "./ClayPatternCurveGeo";

const SimpleBrick = (props) => {
    console.log(props);

    const {thickness, baseHeight, bodyHeight, pinHeight} = props;

    const doubleThickness = thickness * 2.0;
    const heightArray = [baseHeight + thickness];

    const count = bodyHeight / doubleThickness + 1;
    console.log(count, bodyHeight, doubleThickness);

    for (let i = 1; i < count; i++) {
        heightArray.push(heightArray[0] + i * doubleThickness);
    }

    console.log(heightArray);

    return (
        heightArray.map((h, index) => {
            return <ClayPatternCurveGeo props={props} key={index} height={h}/>
        })
    )
}

export default SimpleBrick;
