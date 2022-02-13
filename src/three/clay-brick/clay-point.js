import {Vector2, Vector3} from "three";

export class ClayPoint {
    origin;
    direction;
    position;
    uvValue;

    constructor(origin, direction, uv = undefined) {
        this.origin = origin;
        this.position = new Vector3().copy(origin);
        this.direction = direction;
        this.uvValue = (!uv) ? new Vector2(0, 0, 0) : uv;
    }

    move(value) {
        this.position = new Vector3().addVectors(
            this.position,
            new Vector3().addScaledVector(this.direction, value)
        );
    }

    set(value) {
        this.position = new Vector3().addVectors(
            this.origin,
            new Vector3().addScaledVector(this.direction, value)
        );
    }

    toVector3() {
        return new Vector3(this.position.x, this.position.z, -this.position.y);
    }

    static lerp(clayStartPoint, clayEndPoint, t) {
        return new ClayPoint(
            new Vector3().lerpVectors(clayStartPoint.position, clayEndPoint.position, t),
            new Vector3().lerpVectors(clayStartPoint.direction, clayEndPoint.direction, t).normalize(),
            new Vector2().lerpVectors(clayStartPoint.uvValue, clayEndPoint.uvValue, t)
        );
    }
}

export function clayPointTest() {
    const vBase = new Vector3(0, 0, 0);
    const vDir = new Vector3(1, 0, 0);

    const clayPoint = new ClayPoint(vBase, vDir);

    clayPoint.move(1.);

    clayPoint.set(10.);
}
