import {Curve, Matrix4, Vector3} from "three";
import {clamp} from "three/src/math/MathUtils";
import ParallelTransportPolyline from "./parallel-transport-frames";

export class CustomSinCurve extends Curve {

    constructor( scale = 1 ) {

        super();

        this.scale = scale;

    }

    getPoint( t, optionalTarget = new Vector3() ) {

        const tx = t * 3 - 1.5;
        const ty = Math.sin( 2 * Math.PI * t );
        const tz = 0;

        return optionalTarget.set( tx, ty, tz ).multiplyScalar( this.scale );
    }
}

export class CustomLine extends Curve {

    constructor(v0, v1) {
        super();

        this.v0 = v0;
        this.vDir = v1 - this.v0;

        this.scale = 1.;
    }

    getPoint(t, optionalTarget = new Vector3()) {
        const v = this.v0 + t * this.vDir;
        // console.log(v);

        return optionalTarget.set(v.x, v.y, v.z).multiplyScalar( this.scale );
    }
}

export class Polyline extends Curve {
    constructor(points, closed = true) {
        super();

        this.points = points;
        this.closed = closed;

        this.init();
    }

    init() {
        this.dirs = this.getDirs();

        this.arcLengthDivisions = this.getPointCount();
    }

    getPointCount() {
        if (this.closed) {
            return this.points.length;
        } else {
            return this.points.length - 1;
        }
    }

    getDirs() {
        let dirList = [];

        for (let i = 0; i < this.getPointCount(); i++) {
            const v0 = this.points[i];
            const v1 = this.points[(i+1) % this.getPointCount()];

            const vDir = new Vector3().subVectors(v1, v0);

            dirList.push(vDir);
        }

        return dirList;
    }

    getLength() {
        const lengths = this.getLengths();
        return lengths[lengths.length - 1];
    }

    getLengths() {
        if ( this.cacheArcLengths &&
            ( this.cacheArcLengths.length === this.getPointCount() + 1 ) &&
            ! this.needsUpdate ) {

            return this.cacheArcLengths;
        }

        let previous = 0.;
        this.cacheArcLengths = [previous];

        for (const dir of this.dirs) {
            previous += dir.length();
            this.cacheArcLengths.push(previous);
        }

        return this.cacheArcLengths;
    }

    getTangentAt(u, optionalTarget = new Vector3()) {
        return this.getTangent(u * this.getPointCount(), optionalTarget)
    }

    getTangent(t, optionalTarget = new Vector3()) {
        const locT = t % 1.;
        let roundT = t - t % 1.;

        if (isNaN(t)) {
            return null;
        }

        let vT;

        if (t > 0 && t < this.getPointCount()) {
            if ( locT < .0001 ) {
                const v1 = new Vector3().copy(this.dirs[roundT]);
                const v0 = new Vector3().copy(this.dirs[roundT - 1]);

                v0.normalize();
                v1.normalize();

                vT = new Vector3().addVectors(v0, v1);
            } else {
                vT = new Vector3().copy(this.dirs[roundT]);
            }
        }

        if (this.closed) {
            roundT %= this.getPointCount();

            if ( locT < .0001 ) {
                const v1 = new Vector3().copy(this.dirs[roundT]);
                const v0 = new Vector3().copy(this.dirs[(roundT + this.getPointCount() - 1) % this.getPointCount()]);

                v0.normalize();
                v1.normalize();

                vT = new Vector3().addVectors(v0, v1);
            } else {
                vT = new Vector3().copy(this.dirs[roundT]);
            }
        } else {
            if (t < 1) {
                vT = new Vector3().copy(this.dirs[0]);
            } else {
                vT = new Vector3().copy(this.dirs[this.dirs.length - 1]);
            }
        }

        vT.normalize();
        return optionalTarget.set(vT.x, vT.y, vT.z);
    }

    computeFrenetFrames( segments, closed ) {

        console.log("compute Jonas Frenet Frames");

        // see http://www.cs.indiana.edu/pub/techreports/TR425.pdf

        const normal = new Vector3();

        const positions = [];
        const tangents = [];
        const normals = [];
        const binormals = [];

        const vec = new Vector3();
        const mat = new Matrix4();

        // compute the tangent vectors for each segment on the curve

        for ( let i = 0; i <= segments; i ++ ) {

            const u = i / segments;

            positions[i] = this.getPointAt( u );
            tangents[i] = this.getTangentAt( u );

        }

        // select an initial normal vector perpendicular to the first tangent vector,
        // and in the direction of the minimum tangent xyz component

        normals[ 0 ] = new Vector3();
        binormals[ 0 ] = new Vector3();
        let min = Number.MAX_VALUE;
        const tx = Math.abs( tangents[ 0 ].x );
        const ty = Math.abs( tangents[ 0 ].y );
        const tz = Math.abs( tangents[ 0 ].z );

        normal.set( 0, 0, 1 );

        vec.crossVectors( tangents[ 0 ], normal ).normalize();

        normals[ 0 ].crossVectors( tangents[ 0 ], vec );
        binormals[ 0 ].crossVectors( tangents[ 0 ], normals[ 0 ] );


        // compute the slowly-varying normal and binormal vectors for each segment on the curve

        let hasBeen0 = false;

        for ( let i = 1; i <= segments; i ++ ) {

            binormals[ i ] = new Vector3().crossVectors( normals[i-1], tangents[ i ] ).normalize();
            if ( new Vector3().crossVectors( normals[i-1], tangents[ i ] ).length() < 0.1 ) {
                if ( !hasBeen0 ) {
                    console.log(normals[i-1], tangents[ i ], new Vector3().crossVectors( normals[i-1], tangents[ i ] ))
                    hasBeen0 = true;
                }
            }

            if (normals[i].dot(normals[i-1]) < 0) {
                normals[i].negate();
            } else if (normals[i].dot(normals[i-1]) === 0) {
                if (normals[i].x !== normals[i-1].x) {
                    normals[i].negate();
                }
            }

            binormals[ i ] = new Vector3().crossVectors( tangents[ i ], normals[ i ] );
        }

        if ( closed === true ) {

            let theta = Math.acos( clamp( normals[0].dot( normals[segments] ), - 1, 1 ) );
            theta /= segments;

            if ( tangents[0].dot( vec.crossVectors( normals[0], normals[segments] ) ) > 0 ) {

                theta = - theta;

            }

            for ( let i = 1; i <= segments; i ++ ) {

                // twist a little...
                normals[i].applyMatrix4( mat.makeRotationAxis( tangents[i], theta * i ) );
                binormals[i].crossVectors( tangents[i], normals[i] );

            }
        }

        return {
            tangents: tangents,
            normals: normals,
            binormals: binormals
        };

    }

    toParallelTransport() {
        return new ParallelTransportPolyline(this.points);
    }

    _tConstraining(t) {
        let locT = t % 1.;

        let t0 = t - locT;

        if (this.closed) {
            t0 %= this.getPointCount();
        } else {
            if (t0 < 0) {
                locT += t0;
                t0 = 0;
            } else if (t0 >= this.getPointCount()) {
                locT += t0 - this.getPointCount();
                t0 = this.getPointCount();
            }
        }

        return {
            locT: locT,
            t0: t0
        };
    }

    getPointAt(t, optionalTarget = new Vector3() ) {
        return this.getPoint(t, optionalTarget);
    }

    getPoint( t, optionalTarget = new Vector3() ) {
        t *= this.getPointCount();

        const {locT, t0} = this._tConstraining(t);

        const v0 = this.points[t0];
        const vDir = this.dirs[t0];

        const v = new Vector3().addVectors(v0, new Vector3().addScaledVector(vDir, locT));

        return optionalTarget.set(v.x, v.y, v.z);
    }

    moveToHeight(height = 0.){
        for (const point of this.points) {
            point.y = height;
        }
    }

    makeMeWave(periods = 2., amplitude = 5.) {
        const step = (periods * 2. * Math.PI) / this.getPointCount();
        let phase = 0.;

        for (let i = 0; i < this.getPointCount(); i++ ) {
            this.points[i].z += amplitude * Math.sin(phase);
            phase += step;
        }

        this.init();
    }

    cadFlip() {
        for (const pt of this.points) {
            pt.set(pt.x, pt.z, -pt.y);
        }
    }
}
