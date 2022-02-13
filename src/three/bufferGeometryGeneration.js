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

            localNormals.push(localNormal.toArray());

            const localPosition = new Vector3().addVectors(basePositions[i], localNormal.multiplyScalar(thickness));

            localPositions.push(localPosition.toArray());
            localUVs.push([localU, uvV]);

        }

        frames.push({
            positions: localPositions,
            uvs: localUVs,
            normals: localNormals
        });
    }

    return frames;
}

export const framesFromPositionsNormalsBiNormals = (basePositions, normals, biNormals, uVals, thickness, betaUVs, uvDeltas) => {
    const frames = []

    for (let i = 0; i < basePositions.length; i ++) {
        const localU = uVals[i] * uvDeltas.uDelta;

        const localPositions = [];
        const localUVs = [];
        const localNormals = [];

        for (const {u, v, uvV} of betaUVs) {
            const localNormal = new Vector3().addVectors(
                new Vector3().addScaledVector(normals[i], u),
                new Vector3().addScaledVector(biNormals[i], v)
            );

            localNormals.push(localNormal.toArray());

            const localPosition = new Vector3().addVectors(basePositions[i], localNormal.multiplyScalar(thickness));

            localPositions.push(localPosition.toArray());
            localUVs.push([localU, uvV]);

        }

        frames.push({
            positions: localPositions,
            uvs: localUVs,
            normals: localNormals
        });
    }

    return frames;
}

export const generateFramesFromClayCurve = (clayCurve, thickness, divisionsV, uvGrid) => {
    const ptCount = (clayCurve.isClosed) ? clayCurve.clayPoints.length : clayCurve.clayPoints.length - 1;

    // 0. store positions
    const positions = clayCurve.clayPoints.map(pt => {return pt.position.clone()});

    console.log(positions);

    // 1. construct directions & uVals
    const directions = [];
    const uVals = [0];

    for (let i = 0; i < ptCount; i++) {
        const localDirection = new Vector3().subVectors(
            positions[(i + 1) % positions.length],
            positions[i]
        );
        uVals.push(uVals[uVals.length-1] + localDirection.length());
        directions.push(localDirection.normalize());
    }

    let totalLength = undefined;
    if (clayCurve.isClosed) {
        totalLength = uVals.pop();
    }

    // 2. construct tangents
    const tangents = [];

    if (clayCurve.isClosed) {
        tangents.push(new Vector3().addVectors(directions[directions.length - 1], directions[0]).normalize());
        for (let i = 1; i < ptCount; i++) {
            tangents.push(new Vector3().addVectors(
                directions[i - 1],
                directions[i]
            ).normalize());
        }
    } else {
        tangents.push(directions[0]);

        for (let i = 1; i < ptCount; i++) {
            tangents.push(new Vector3().addVectors(
                directions[i - 1],
                directions[i]
            ).normalize());
        }

        tangents.push(directions[directions.length-1]);
    }

    // 3. defining the start normal
    // assuming that that start vector will always be non-vertical
    const normal0 = new Vector3(tangents[0].x, tangents[0].y, 0.).normalize();
    normal0.set(-normal0.y, normal0.x, 0.);

    // 4. construct (bi)Normals
    const normals = [normal0];
    const biNormals = [new Vector3().crossVectors(tangents[0],normal0)];

    for (let i = 1; i < positions.length; i++) {
        biNormals.push(normals[i-1].clone().cross(tangents[i]).normalize());
        normals.push(tangents[i].clone().cross(biNormals[i]).normalize());
    }

    // 5. frame parameters

    const divisionsUV = {
        u: positions.length,
        v: divisionsV
    }

    const uvLengths = {
        u: (totalLength) ? totalLength : uVals[uVals.length - 1],
        v: Math.PI * 2.
    }

    const {betaUVs, uvDeltas} = constructBetaUVs(divisionsUV, uvGrid, uvLengths);

    return {
        frames: framesFromPositionsNormalsBiNormals(positions, normals, biNormals, uVals, thickness, betaUVs, uvDeltas),
        divisionsUV: divisionsUV
    };
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

export const constructBufferGeometryFromFrames = (frames, divisionsUV, closed = true) => {
    const positionArray = [];
    const uvArray = [];
    const normalsArray = [];

    const uDivisions = (closed) ? divisionsUV.u : divisionsUV.u - 1;

    for (let j = 0; j < uDivisions; j ++) {
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
