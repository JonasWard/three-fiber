import {Vector3} from "three";
import {
    constructBetaUVs,
    framesFromPositionsNormalsStaticBiNormal
} from "./bufferGeometryGeneration";

export const constructDonutFrames = (radius, position, thickness, divisionsUV, uvGrid) => {
    const biNormal = new Vector3(0, 0, 1.);

    const uvLengths = {
        u: Math.PI * 2.,
        v: Math.PI * 2.
    }

    const {betaUVs, uvDeltas} = constructBetaUVs(divisionsUV, uvGrid, uvLengths);

    const alfaDelta = Math.PI * 2 / divisionsUV.u;

    const basePositions = [];
    const normals = [];
    const uVals = [];

    for (let i = 0; i < divisionsUV.u; i ++) {
        const localAlfa = alfaDelta * i;
        const localLength = localAlfa * radius;

        const frameNormal = new Vector3(Math.cos(localAlfa), Math.sin(localAlfa), 0.0);
        const basePosition = new Vector3().addVectors(position, new Vector3().addScaledVector(frameNormal, radius));

        const localU = localLength * uvDeltas.uDelta;

        basePositions.push(basePosition);
        normals.push(frameNormal);
        uVals.push(localU);
    }

    return framesFromPositionsNormalsStaticBiNormal(basePositions, normals, biNormal, uVals, thickness, betaUVs, uvDeltas);
}
