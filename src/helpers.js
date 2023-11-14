// // https://codepen.io/trusktr/pen/jOQZZdZ
//
// const V_FOV_DEG = 45
// const V_FOV_RAD = Math.PI * (V_FOV_DEG / 180);
// const TAN_HALF_V_FOV = Math.tan(V_FOV_RAD / 2);
//
// /**
//  * @param {number} aspect - The camera aspect ratio, which is generally width/height of the viewport.
//  * @returns {number} - The horizontal field of view derived from the vertical field of view.
//  */
// export const vFovToHFov = (aspect) => {
//     return Math.atan(aspect * TAN_HALF_V_FOV) * 2;
// }
//
// export const getDistanceFromCamera = (fitment = "contain", width, height) => {
//     const imgAspect = width / height;
//     const viewAspect = window.innerWidth / window.innerHeight;
//     return (
//         fitment === "contain" ? imgAspect <= viewAspect : imgAspect > viewAspect
//     )
//         ? height / (2 * TAN_HALF_V_FOV) // Use the object size here! Not the viewport size!
//         : width / (2 * Math.tan(vFovToHFov(viewAspect) / 2));
// };

export const visibleHeightAtZDepth = (depth, camera) => {
    // compensate for cameras not positioned at z=0
    const cameraOffset = camera.position.z
    if (depth < cameraOffset) depth -= cameraOffset
    else depth += cameraOffset

    // vertical fov in radians
    const vFOV = camera.fov * Math.PI / 180

    // Math.abs to ensure the result is always positive
    return 2 * Math.tan(vFOV / 2) * Math.abs(depth)
}

export const visibleWidthAtZDepth = (depth, camera) => {
    const height = visibleHeightAtZDepth(depth, camera)
    return height * camera.aspect
}

export const cover = (texture, aspect, imageAspect) => {
    texture.matrixAutoUpdate = false
    if ( aspect < imageAspect ) {
        texture.matrix.setUvTransform( 0, 0, aspect / imageAspect, 1, 0, 0.5, 0.5 )
    } else {
        texture.matrix.setUvTransform( 0, 0, 1, imageAspect / aspect, 0, 0.5, 0.5 );
    }
}
