import {
    DirectionalLight,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    VideoTexture,
    WebGLRenderer,
    Clock
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { unitsPerPixelAtDepth } from './unitsToPixels.js'
import { cover } from './helpers.js'
import { attachPane, createCan } from './can.js'
import { getPane } from './getPane.js'

export const App = () => {
    const canvas = document.querySelector('#canvas')
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)

    const scene = new Scene()

    const camera = new PerspectiveCamera(45, width / height, 1, 20)
    camera.position.set(2, 1, 2)

    const bgGeometry = new PlaneGeometry(1, 1)
    const video = document.querySelector('.video')
    const bgTexture = new VideoTexture(video)
    bgTexture.generateMipmaps = false
    const bgMaterial = new MeshBasicMaterial({ map: bgTexture })
    const bgMesh = new Mesh(bgGeometry, bgMaterial)

    camera.add(bgMesh)
    bgMesh.position.set(0, 0, -10)
    scene.add(camera)

    const resizeBackground = () => {
        const unitRatio = unitsPerPixelAtDepth(camera, Math.abs(bgMesh.position.z))
        const x = video.offsetWidth * unitRatio
        const y = video.offsetHeight * unitRatio
        bgMesh.scale.set(x, y, 1)
        cover(bgTexture, window.innerWidth / window.innerHeight, 1920 / 1280)
    }
    resizeBackground()

    const can = createCan()
    scene.add(can)

    const options = { autoRotate: true }
    const pane = getPane()

    pane.addBinding(options, 'autoRotate')
    attachPane(can)

    const light = new DirectionalLight(0xfff0dd, 1)
    light.position.set(0, 2, -5)
    camera.add(light)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target = can.position
    controls.update()

    const clock = new Clock()

    const animate = () => {
        requestAnimationFrame(animate)
        const delta = clock.getDelta()
        if (options.autoRotate) can.rotation.y += delta * 0.25
        renderer.render(scene, camera)
    }

    animate()

    const resize = () => {
        const width = window.innerWidth
        const height = window.innerHeight

        camera.aspect = width / height
        camera.updateProjectionMatrix()

        renderer.setSize(width, height)

        resizeBackground()
    }

    window.addEventListener('resize', resize)

    return {}
}