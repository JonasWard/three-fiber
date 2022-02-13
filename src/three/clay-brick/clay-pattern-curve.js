// import {GeometryFactory} from "jsts/org/locationtech/jts/geom";
// import {ClayPoint} from './clay-point';
// import {Vector3} from "three";
// import {Polyline} from "../three/three-poly-line";
// import {edgeUVConstraining} from "./clay-patterns";
// import ParallelTransportPolyline from "../three/parallel-transport-frames";
//
// export class ClayPatternCurve {
//     clayPoints;
//
//     constructor(clayPoints) {
//         this.clayPoints = clayPoints;
//     }
//
//     toPolygon() {
//         let coordinates =[];
//
//         for (const pt of this.clayPoints) {
//             coordinates.push(pt.toCoordinate());
//         }
//
//         coordinates.push(coordinates[0]);
//
//         return new GeometryFactory().createPolygon(coordinates);
//     }
//
//     toPolyline() {
//         let positions = [];
//
//         for (const pt of this.clayPoints) {
//             positions.push(pt.toVector3());
//         }
//
//         return new Polyline(positions);
//     }
//
//     toParallelTransport() {
//         return new ParallelTransportPolyline(this.clayPoints.map(pt => pt.toVector3()));
//     }
//
//     moveToHeight(height = 0.) {
//         for (const pt of this.clayPoints) {
//             pt.z = height;
//         }
//     }
//
//     applyPattern(patternFunction, parameters, easingParameters = null) {
//         if (parameters.uv) {
//             for (const pt of this.clayPoints) {
//                 if (easingParameters) {
//                     const edgeValue = edgeUVConstraining(pt.uvValue, easingParameters);
//                     if (edgeValue !== 0.){
//                         pt.set(patternFunction(pt.uvValue, parameters) * edgeValue);
//                     }
//                 } else {
//                     pt.set(patternFunction(pt.uvValue, parameters));
//                 }
//             }
//         } else {
//             for (const pt of this.clayPoints) {
//                 pt.set(patternFunction(pt.origin, parameters));
//             }
//         }
//     }
//
//     toThreePolyline() {
//         let positions = [];
//
//         for (const pt of this.clayPoints) {
//             positions.push(pt.toVector3());
//         }
//
//         return new Polyline(positions);
//     }
// }
//
// export function testClayCurve(scene = null) {
//     let pts = [
//         new ClayPoint(
//             new Vector3(.5, .5, 0),
//             new Vector3(1, 1, 0),
//         ),
//         new ClayPoint(
//             new Vector3(-.5, .5, 0),
//             new Vector3(-1, 1, 0),
//         ),
//         new ClayPoint(
//             new Vector3(-.5, -.5, 0),
//             new Vector3(-1, -1, 0),
//         ),
//         new ClayPoint(
//             new Vector3(.5, -.5, 0),
//             new Vector3(1, -1, 0),
//         ),
//     ];
//
//     const clayCurve = new ClayPatternCurve(pts);
//
//     if (scene) {
//         // console.log("is not null?");
//         // console.log(scene);
//
//
//
//     } else {
//         console.log("is null !!!");
//     }
// }
