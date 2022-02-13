import {BufferAttribute, BufferGeometry, Vector3} from "three";
const {Matrix} = require("ml-matrix");

export default class ParallelTransportPolyline {

    start;
    positions;
    isClosed;
    tangents;
    normals;
    binormals;
    layers;

    update = false;

    _populatedFrames = false;

    constructor(positions, radius = 1.5) {
        this.start = new Vector3(0,1,0);
        this.positions = positions;
        this.update = false;
        this.updateGeometry();
        this.radius = radius;

        this._distance = 0;
    }

    updateGeometry () {
        if (!this.update) {
            this._manageClosed();
            this._constructRawTangents();
            this._constructTangents();
            this.constructFrames();
            this.update = false;
        }
    }

    _manageClosed() {
        if (this.positions[0].distanceToSquared(this.positions[this.positionCount() - 1]) < 1e-6) {
            this.isClosed = true;
            this.positions.pop();
        }
    }

    _constructRawTangents() {
        this.rawTangents = [];

        for (let i = 0; i < this.positionCount() - 1; i++) {
            let tangent = this.positions[i].clone().sub(this.getPosition(i+1));
            tangent.normalize();
            this.rawTangents.push(tangent);
        }

        if (this.isClosed){
            let tangent = this.positions[this.positionCount() - 1].clone().sub(this.getPosition(0));
            tangent.normalize();
            this.rawTangents.push(tangent);
        } else {
            this.rawTangents.push(this.rawTangents[this.rawTangents.length - 1].clone());
        }
    }

    _constructDoubleTangentAt(i) {
        // assuming that this thing just works, so not towards the ends
        return new Vector3().addVectors(this.rawTangents[i-1], this.rawTangents[i]).normalize();
    }

    _constructTangents() {
        this.tangents = [];

        if (this.isClosed) {
            this.tangents.push(this.rawTangents[0]);
        } else {
            this.tangents.push(
                new Vector3().addVectors(this.rawTangents[this.rawTangents.length-1], this.rawTangents[0]).normalize()
            );
        }

        for (let i = 1; i < this.positionCount() - 1; i++) {
            this.tangents.push(this._constructDoubleTangentAt(i));
        }

        if (this.isClosed) {
            this.tangents.push(this.rawTangents[this.rawTangents.length-1]);
        } else {
            this.tangents.push(this._constructDoubleTangentAt(this.rawTangents.length-1));
        }
    }

    positionCount() {
        return this.positions.length;
    }

    getPosition(index) {
        return this.positions[index % this.positionCount()];
    }

    getTangent(index) {
        if (index >= 0 && index < this.positionCount()) {
            return this.tangents[index];
        } else {
            // console.log("invalid tangent index: "+index);
            return undefined;
        }
    }

    constructFrames() {
        this.normals = [this.start];
        this.binormals = [new Vector3().crossVectors(this.getTangent(0), this.start)];

        for (let i = 1; i < this.positionCount(); i++) {
            this.binormals.push(this.normals[i-1].clone().cross(this.getTangent(i)).normalize());
            this.normals.push(this.getTangent(i).clone().cross(this.binormals[i]).normalize());
        }
    }

    constructLayer(index, endAngle, angleDelta, uvPairMultiplier) {
        let positions = [];
        let normals = []
        let uvs = [];

        for (let a = 0.; a < endAngle; a += angleDelta) {
            const n3 = this.normals[index].clone().multiplyScalar(Math.cos(a))
                .add(this.binormals[index].clone().multiplyScalar(Math.sin(a)));

            const v3 = this.getPosition(index).clone().add(n3.clone().multiplyScalar(this.radius));

            normals.push([n3.x, n3.y, n3.z]);
            positions.push([v3.x, v3.y, v3.z]);

            uvs.push([this._distance * uvPairMultiplier[0], a * uvPairMultiplier[1]]);
        }

        return {positions: positions, uvs: uvs, normals: normals};
    }

    concatenateBuffers(currentLayer, previousLayer, divisions) {
        let uvs = [];
        let positions = [];
        let normals = [];

        // console.log(previousLayer, currentLayer);

        for (let i = 0; i < divisions; i++) {
            const iBis = (i+1) % divisions;

            // console.log(i, iBis);

            uvs.push(...previousLayer.uvs[i]);
            uvs.push(...previousLayer.uvs[iBis]);
            uvs.push(...currentLayer.uvs[iBis]);

            uvs.push(...previousLayer.uvs[i]);
            uvs.push(...currentLayer.uvs[iBis]);
            uvs.push(...currentLayer.uvs[i]);

            positions.push(...previousLayer.positions[i]);
            positions.push(...previousLayer.positions[iBis]);
            positions.push(...currentLayer.positions[iBis]);

            positions.push(...previousLayer.positions[i]);
            positions.push(...currentLayer.positions[iBis]);
            positions.push(...currentLayer.positions[i]);

            normals.push(...previousLayer.normals[i]);
            normals.push(...previousLayer.normals[iBis]);
            normals.push(...currentLayer.normals[iBis]);

            normals.push(...previousLayer.normals[i]);
            normals.push(...currentLayer.normals[iBis]);
            normals.push(...currentLayer.normals[i]);
        }

        // console.log(positions, uvs);

        return {positions: positions, uvs: uvs, normals: normals};
    }

    _constructLayers(endAngle, angleDelta, uvPairMultiplier) {
        this.layers = [];

        if (this.isClosed) {
            this._distance = this.getPosition(0).distanceTo(this.getPosition(this.positionCount()-1));
        } else {
            this._distance = 0.;
        }

        for (let i = 0; i < this.positionCount(); i++) {
            this.layers.push(this.constructLayer(i, endAngle, angleDelta, uvPairMultiplier));
            if (i > 0) {
                this._distance += this.getPosition(i).distanceTo(this.getPosition(i-1));
            }
        }
    }

    constructBufferGeometry (divisions = 8, uvPair = [1., 1.]) {
        this.updateGeometry();

        const geometry = new BufferGeometry();

        let positions = [];
        let uvs = [];
        let normals = [];

        const endAngle = 2 * Math.PI;
        const angleDelta = endAngle / divisions;

        const uvPairMultiplier = [1. / uvPair[0], 1. / (uvPair[1] * endAngle)];

        this._constructLayers(endAngle, angleDelta, uvPairMultiplier);

        if (this.isClosed) {
            const currentLayer = this.layers[0];
            const previousLayer = this.layers[this.positionCount() - 1];

            const layerBufferData = this.concatenateBuffers(currentLayer, previousLayer, divisions);
            positions.push(...layerBufferData.positions);
            uvs.push(...layerBufferData.uvs);
            normals.push(...layerBufferData.normals);
        } else {
            const currentLayer = this.layers[0];
            const previousLayer = this.layers[1];

            const layerBufferData = this.concatenateBuffers(currentLayer, previousLayer, divisions);
            positions.push(...layerBufferData.positions);
            uvs.push(...layerBufferData.uvs);
            normals.push(...layerBufferData.normals);
        }

        for (let i = 1; i < this.positionCount(); i++) {
            const currentLayer = this.layers[i];
            const previousLayer = this.layers[i-1];

            const layerBufferData = this.concatenateBuffers(currentLayer, previousLayer, divisions);
            positions.push(...layerBufferData.positions);
            uvs.push(...layerBufferData.uvs);
            normals.push(...layerBufferData.normals);
        }

        geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
        const uvBufferAtt = new BufferAttribute(new Float32Array(uvs), 2);
        geometry.setAttribute('uv', uvBufferAtt);
        geometry.setAttribute('uv2', uvBufferAtt);
        geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));

        if (this.positionCount() > 100) {
            console.log(geometry);
        }

        return geometry;
    }
}
