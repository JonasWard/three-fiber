import {Vector2, Vector3} from "three";
import {ClayPoint} from "./clay-point";

export const arc = (center, radius, startAngle, angleDelta, divisions, v) => {

    const angleStep = angleDelta / divisions;

    const vStep = angleStep * radius;

    const clayPoints = [];

    // making sure that the last point is also included
    for (let i = 0; i < divisions + .5; i++) {
        const angle = startAngle + angleStep * i;
        const normal = new Vector3(Math.cos(angle), Math.sin(angle), 0.);
        const position = new Vector3().addVectors(center, new Vector3().addScaledVector(normal, radius));
        const uv = new Vector2(v, 0.);

        clayPoints.push(new ClayPoint(position, normal, uv));

        v += vStep;
    }

    return clayPoints;
}

export const lerpClayPoints = (startPoint, endPoint, divisions) => {
    const clayPoints = [];
    const vStep = 1. / divisions;

    for (let v = vStep; v < 1.; v += vStep) {
        clayPoints.push(ClayPoint.lerp(startPoint, endPoint, v));
    }

    return clayPoints;
}

export const flatOval = (radius, bodyLength, divisionLength, height) => {
    const lV = new Vector3(-bodyLength * .5, 0., height);
    const rV = new Vector3(bodyLength * .5, 0., height);

    const hPi = Math.PI * .5;
    const pi = Math.PI;
    const ihPi = Math.PI * 1.5;

    const arcLeftBottom = arc(lV, radius, pi, hPi, Math.ceil(radius * hPi / divisionLength), 0.);

    const arcLeftTop = arc(lV, radius, hPi, hPi, Math.ceil(radius * hPi / divisionLength), radius * ihPi + 2. * bodyLength);

    const arcRight = arc(rV, radius, ihPi, pi, Math.ceil(radius * pi / divisionLength),radius * hPi + bodyLength);

    const clayPointArray = [];
    clayPointArray.push(...arcLeftBottom);
    clayPointArray.push(...lerpClayPoints(
        arcLeftBottom[arcLeftBottom.length - 1],
        arcRight[0], Math.ceil(bodyLength / divisionLength)
    ));
    clayPointArray.push(...arcRight);
    clayPointArray.push(...lerpClayPoints(
        arcRight[arcRight.length - 1],
        arcLeftTop[0], Math.ceil(bodyLength / divisionLength)
    ));
    clayPointArray.push(...arcLeftTop);

    return clayPointArray;
}
