export const unitsPerPixelAtDepth = (camera, depth) => {
	const fov = camera.fov * (Math.PI / 180)
	const height = 2 * Math.tan(fov / 2) * depth

	return height / window.innerHeight
}
