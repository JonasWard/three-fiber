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
    let normal0;

    if (clayCurve.isClosed) {
        if (tangents[0].angleTo(tangents[tangents.length - 1]) > .01) {
            normal0 = new Vector3().addVectors(tangents[0], tangents[tangents.length - 1]).normalize();
        } else {
            normal0 = new Vector3(tangents[0].y, tangents[0].x, 0.).normalize();
        }
    } else {
        normal0 = new Vector3(tangents[0].y, tangents[0].x, 0.).normalize();
    }

    // 4. construct (bi)Normals
    const normals = [normal0];
    const biNormals = [new Vector3().crossVectors(normal0, tangents[0]).normalize()];

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
        populatedFrames: framesFromPositionsNormalsBiNormals(positions, normals, biNormals, uVals, thickness, betaUVs, uvDeltas),
        divisionsUV: divisionsUV,
        frames: {
            positions: positions,
            normals: normals,
            biNormals: biNormals
        }
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
        populatedFrames: framesFromPositionsNormalsStaticBiNormal(basePositions, normals, biNormal, uVals, thickness, betaUVs, uvDeltas),
        divisionsUV: divisionsUV,
        frames: {
            positions: basePositions,
            normals: normals,
            biNormals: [].fill(biNormal, 0, basePositions.length)
        }
    };
}

const squareFrame = (position, normal, biNormal, size = 10.0, uvArray = [], positionArray = [], normalArray = []) => {
    const na = new Vector3().addScaledVector(normal, -size);
    const nb = new Vector3().addScaledVector(normal, size);

    const bNa = new Vector3().addScaledVector(biNormal, -size);
    const bNb = new Vector3().addScaledVector(biNormal, size);

    const nGlobal = new Vector3().crossVectors(normal, biNormal).normalize().toArray();

    const v00 = new Vector3().addVectors(position, new Vector3().addVectors(na, bNa)).toArray();
    const v01 = new Vector3().addVectors(position, new Vector3().addVectors(na, bNb)).toArray();
    const v11 = new Vector3().addVectors(position, new Vector3().addVectors(nb, bNb)).toArray();
    const v10 = new Vector3().addVectors(position, new Vector3().addVectors(nb, bNa)).toArray();

    for (let i = 0; i < 6; i++) {
        normalArray.push(...nGlobal);
    }

    uvArray.push(...[0,0]);
    positionArray.push(...v00);
    uvArray.push(...[1,1]);
    positionArray.push(...v11);
    uvArray.push(...[1,0]);
    positionArray.push(...v10);

    uvArray.push(...[0,0]);
    positionArray.push(...v00);
    uvArray.push(...[0,1]);
    positionArray.push(...v01);
    uvArray.push(...[1,1]);
    positionArray.push(...v11);
}

export const visualiseFrames = (frames, size = 10.) => {
    const {positions, normals, biNormals} = frames;

    const uvFloats = [];
    const positionsFloats = [];
    const normalFloats = [];

    positions.map((position, index) => {
        squareFrame(position, normals[index], biNormals[index], size, uvFloats, positionsFloats, normalFloats);
    })

    return {
        positions: new Float32Array(positionsFloats),
        normals: new Float32Array(normalFloats),
        uvs: new Float32Array(uvFloats)
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
