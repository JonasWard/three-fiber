import {Vector3} from "three";

const frameIterator = (frames, ij, positionArray, normalArray, uvArray) => {
    positionArray.push(...frames[ij.j].positions[ij.i]);
    normalArray.push(...frames[ij.j].normals[ij.i]);
    uvArray.push(...frames[ij.j].uvs[ij.i]);
}

export const constructDonutFrame = (radius, position, thickness, divisionsUV, uvGrid) => {
    const biNormal = new Vector3(0, 0, 1.);

    const betaUVs = [];
    const betaDelta = Math.PI * 2 / divisionsUV.v;

    const uvDeltas = {
        uDelta: uvGrid.u / (Math.PI * 2.),
        vDelta: uvGrid.v / (Math.PI * 2.)
    }

    for (let i = 0; i < divisionsUV.v; i ++) {
        const localBeta = i * betaDelta;
        betaUVs.push({
            u: Math.cos(localBeta) * thickness,
            v: Math.sin(localBeta) * thickness,
            uvV: localBeta * uvDeltas.vDelta
        });
    }

    console.log(betaUVs);

    const frames = []

    const alfaDelta = Math.PI * 2 / divisionsUV.u;

    for (let i = 0; i < divisionsUV.u; i ++) {
        const localAlfa = alfaDelta * i;
        const localLength = localAlfa * radius;

        const frameNormal = new Vector3(Math.cos(localAlfa), Math.sin(localAlfa), 0.0);
        const basePosition = new Vector3().addVectors(position, new Vector3().addScaledVector(frameNormal, radius));

        const localU = localLength * uvDeltas.uDelta;

        const localPositions = [];
        const localUVs = [];
        const localNormals = [];

        for (const {u, v, uvV} of betaUVs) {
            const localNormal = new Vector3().addVectors(
                new Vector3().addScaledVector(frameNormal, u),
                new Vector3().addScaledVector(biNormal, v)
            );

            const localPosition = new Vector3().addVectors(basePosition, localNormal);

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

export const constructDonutBufferGeometry = (radius, position, thickness, divisionsUV, uvGrid) => {
    const frames = constructDonutFrame(radius, position, thickness, divisionsUV, uvGrid);
    return constructBufferGeometryFromFrames(frames, divisionsUV);
}