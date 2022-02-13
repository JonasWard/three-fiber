import {edgeUVConstraining} from "./clay-patterns";

export class ClayPatternCurve {
    clayPoints;
    isClosed;

    constructor(clayPoints, isClosed=true) {
        this.clayPoints = clayPoints;
        this.isClosed = isClosed;
    }

    toNestedFloats() {
        const array = [this.clayPoints.map(p => {return [p.position.x, p.position.y]})];
        array.push(array[0]);

        return array;
    }

    moveToHeight(height = 0.) {
        for (const pt of this.clayPoints) {
            pt.z = height;
        }
    }

    applyPattern(patternFunction, parameters, easingParameters = null) {
        if (parameters.uv) {
            for (const pt of this.clayPoints) {
                if (easingParameters) {
                    const edgeValue = edgeUVConstraining(pt.uvValue, easingParameters);
                    if (edgeValue !== 0.){
                        pt.set(patternFunction(pt.uvValue, parameters) * edgeValue);
                    }
                } else {
                    pt.set(patternFunction(pt.uvValue, parameters));
                }
            }
        } else {
            for (const pt of this.clayPoints) {
                pt.set(patternFunction(pt.origin, parameters));
            }
        }
    }
}
