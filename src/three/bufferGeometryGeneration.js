import {Vector3} from "three";

const frameIterator = (frames, ij, positionArray, normalArray, uvArray) => {
    positionArray.push(...frames[ij.j].positions[ij.i]);
    normalArray.push(...frames[ij.j].normals[ij.i]);
    uvArray.push(...frames[ij.j].uvs[ij.i]);
}

export const constructBetaUVs = (divisionsUV, uvGrid, uvLengths) => {
    const betaUVs = [];
    const betaDelta = Math.PI * 2 / divisionsUV.v;

    const uvDeltas = {
        uDelta: uvGrid.u / uvLengths.u,
        vDelta: uvGrid.v / uvLengths.v
    }

    for (let i = 0; i < divisionsUV.v; i++) {
        const localBeta = i * betaDelta;
        betaUVs.push({
            u: Math.cos(localBeta),
            v: Math.sin(localBeta),
            uvV: localBeta * uvDeltas.vDelta
        });
    }

    return {betaUVs: betaUVs, uvDeltas: uvDeltas};
}

export const framesFromPositionsNormalsStaticBiNormal = (basePositions, normals, biNormal, uVals, thickness, betaUVs, uvDeltas) => {
    const frames = []

    for (let i = 0; i < basePositions.length; i ++) {
        const localU = uVals[i] * uvDeltas.uDelta;

        const localPositions = [];
        const localUVs = [];
        const localNormals = [];

        for (const {u, v, uvV} of betaUVs) {
            const localNormal = new Vector3().addVectors(
                new Vector3().addScaledVector(normals[i], u),
                new Vector3().addScaledVector(biNormal, v)
            );

            const localPosition = new Vector3().addVectors(basePositions[i], localNormal);

            localPositions.push(localPosition.toArray());
            localUVs.push([localU, uvV]);
            localNormals.push(localNormal.normalize().toArray());

        }

        frames.push({
            positions: localPositions,
            uvs: localUVs,
            normals: localNormals
        });
    }

    return frames;
}

export const generateFramesFromClayPoints = (clayPoints, thickness, divisionsV, uvGrid) => {
    const biNormal = new Vector3(0, 0, 1.);

    const divisionsUV = {
        u: clayPoints.length,
        v: divisionsV
    }

    const uvLengths = {
        u: clayPoints[clayPoints.length - 1].uvValue.x,
        v: Math.PI * 2.
    }

    const {betaUVs, uvDeltas} = constructBetaUVs(divisionsUV, uvGrid, uvLengths);

    const basePositions = [];
    const normals = [];
    const uVals = [];

    for (const clayPoint of clayPoints) {
        basePositions.push(clayPoint.position);
        normals.push(clayPoint.direction);
        uVals.push(clayPoint.uvValue.x);
    }

    return {
        frames: framesFromPositionsNormalsStaticBiNormal(basePositions, normals, biNormal, uVals, thickness, betaUVs, uvDeltas),
        divisionsUV: divisionsUV
    };
}

export const constructBufferGeometryFromFrames = (frames, divisionsUV) => {
    const positionArray = [];
    const uvArray = [];
    const normalsArray = [];

    for (let j = 0; j < divisionsUV.u; j ++) {
        const jPlusOne = (j + 1) % divisionsUV.u;
        for (let i = 0; i < divisionsUV.v; i++) {
            const iPlusOne = (i + 1) % divisionsUV.v;

            frameIterator(frames, {i: i, j:j}, positionArray, normalsArray, uvArray);
            frameIterator(frames, {i:i, j:jPlusOne}, positionArray, normalsArray, uvArray);
            frameIterator(frames, {i:iPlusOne, j:jPlusOne}, positionArray, normalsArray, uvArray);

            frameIterator(frames, {i:i, j:j}, positionArray, normalsArray, uvArray);
            frameIterator(frames, {i:iPlusOne, j:jPlusOne}, positionArray, normalsArray, uvArray);
            frameIterator(frames, {i:iPlusOne, j:j}, positionArray, normalsArray, uvArray);
        }
    }

    return {
        positions: new Float32Array(positionArray),
        normals: new Float32Array(normalsArray),
        uvs: new Float32Array(uvArray)
    };
}
