export function sinWaveUVPattern(uv, parameters) {
    const phase = parameters.phaseDelta * uv.y;
    return Math.sin(uv.x * Math.PI / parameters.period + phase) * parameters.amplitude + parameters.offset;
}

// function that gives the distance to the closest point in the UV grid
function dotForUV(uv, parameters) {
    let localU, localV;

    localU = (uv.x - parameters.baseU % parameters.uSpacing) % parameters.uSpacing - parameters.uSpacing * .5;
    localV = (uv.y - parameters.baseV % parameters.vSpacing) % parameters.vSpacing - parameters.vSpacing * .5;

    if (parameters.positionShift) {
        if ( (Math.abs(localU) / parameters.uSpacing + Math.abs(localV) / parameters.vSpacing ) > .5 ) {
            if (localU < 0.) {
                localU = -parameters.uSpacing * .5 - localU;
            } else {
                localU = parameters.uSpacing * .5 - localU;
            }
            if (localV < 0.) {
                localV = -parameters.vSpacing * .5 - localV;
            } else {
                localV = parameters.vSpacing * .5 - localV;
            }
        }
    }

    return {
        localU: localU,
        localV: localV
    }
}

function dotCylinderForUV(uv, parameters) {
    let localU, localV;

    localU = (uv.x - parameters.baseU % parameters.uSpacing) % parameters.uSpacing;
    localV = (uv.y - parameters.baseV % parameters.vSpacing) % parameters.vSpacing - parameters.vSpacing * .5;

    if (parameters.positionShift){
        if (Math.round((uv.y - localV) / parameters.vSpacing) % 2. === 1.) {
            localU += parameters.uSpacing * .5;
            localU %= parameters.uSpacing;
        }
    }

    localU -= parameters.uSpacing * .5;

    return {
        localU: localU,
        localV: localV
    }
}

function unitRadiusForDot(uv, parameters) {
    let {localU, localV} = dotForUV(uv, parameters);

    localV *= parameters.radiusScaleV;

    const localDistance = Math.sqrt(localU * localU + localV * localV);

    if (localDistance > parameters.radius) {
        return 0.;
    } else {
        return 1. - localDistance / parameters.radius;
    }
}

export function dotPyramidUVPattern(uv, parameters) {
    const locRadius = unitRadiusForDot(uv, parameters);
    return locRadius * parameters.amplitude;
}

export function dotEllipsoidUVPattern(uv, parameters) {
    const locRadius = unitRadiusForDot(uv, parameters);
    return Math.sqrt(1. - (1. - locRadius) ** 2) * parameters.amplitude;
}

export function dotInverseUVPattern(uv, parameters) {
    const locRadius = unitRadiusForDot(uv, parameters);
    return (1. - Math.sqrt(1. - locRadius ** 2)) * parameters.amplitude;
}

export function edgeUVConstraining(uv, easingParameters) {
    const length = uv.x;
    if (length >= easingParameters.endLength | length <= easingParameters.startLength){
        return 0.;
    } else if (length >= easingParameters.startMaxLength & length <= easingParameters.endMaxLength){
        return 1.;
    } else if (length < easingParameters.startMaxLength) {
        return (length - easingParameters.startLength) * easingParameters.easingDelta;
    } else if (length > easingParameters.endMaxLength) {
        return 1. - (length - easingParameters.endMaxLength) * easingParameters.easingDelta;
    } else {
        return null;
    }
}

export function cylinderUVFunction(uv, parameters) {
    let {localU, localV} = dotCylinderForUV(uv, parameters);

    const rD = parameters.radiusB - parameters.radiusA;

    localU = Math.abs(localU);
    let localR;

    if (Math.abs(localV) + 0.001 < parameters.height * .5) {
        localR = parameters.radiusA + rD * (localV / parameters.height + .5);
    } else {
        localR = -1.;
    }

    if (localU > localR) {
        return 0.;
    } else {
        return (1 - (localU / localR) ** 2.) ** .5 * parameters.amplitude;
    }
}

export const DEFAULT_SIN_WAVE_UV_PARAMETERS = {
    amplitude: {default: 2., min: 0., max: 10.},
    period: {default: 30., min: 10., max: 500.},
    phaseDelta: {default: .1, min: -10., max: 10.},
    offset: {default: 0., min: -10., max: 10.},
    uv: {default: 1, min: 0, max: 1}
};

export const DEFAULT_UV_DOT_PARAMETERS = {
    baseU: {default: 0., min: -100., max: 100.},
    baseV: {default: 0., min: -100., max: 100.},
    amplitude: {default: 10., min: -20., max: 20.},
    uSpacing: {default: 50., min: 0., max: 100.},
    vSpacing: {default: 50., min: 0., max: 100.},
    radius: {default: 25., min: 2., max: 50.},
    radiusScaleV: {default: 1., min: 0., max: 10.},
    positionShift: {default: 0., min: 0, max: .5},
    uv: {default: 1, min: 0, max: 1}
}

export const DEFAULT_CYLINDER_UV_PARAMETERS = {
    baseU: {default: 0., min: -100., max: 100.},
    baseV: {default: 0., min: -100., max: 100.},
    amplitude: {default: 10., min: -20., max: 20.},
    height: {default: 30., min: 5., max: 100.},
    uSpacing: {default: 50., min: 0., max: 100.},
    vSpacing: {default: 50., min: 0., max: 100.},
    radiusA: {default: 7.5, min: 2., max: 50.},
    radiusB: {default: 15., min: 2., max: 50.},
    positionShift: {default: 0., min: 0, max: .5},
    uv: {default: 1, min: 0, max: 1}
}

export const PATTERN_LIST = {
    sinWaveUVPattern: {
        patternParameters: DEFAULT_SIN_WAVE_UV_PARAMETERS,
        patternFunction: sinWaveUVPattern
    },
    dotPyramidUVPattern: {
        patternParameters: DEFAULT_UV_DOT_PARAMETERS,
        patternFunction: dotPyramidUVPattern
    },
    dotEllipsoidUVPattern: {
        patternParameters: DEFAULT_UV_DOT_PARAMETERS,
        patternFunction: dotEllipsoidUVPattern
    },
    dotInverseUVPattern: {
        patternParameters: DEFAULT_UV_DOT_PARAMETERS,
        patternFunction: dotInverseUVPattern
    },
    cylinderUVFunction: {
        patternParameters: DEFAULT_CYLINDER_UV_PARAMETERS,
        patternFunction: cylinderUVFunction
    }
}
