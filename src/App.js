import {
    DirectionalLight,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    VideoTexture,
    WebGLRenderer
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { unitsPerPixelAtDepth } from './unitsToPixels.js'
import { cover } from './helpers.js'
import { attachPane, createCan } from './can.js'

export const App = () => {
    const canvas = document.querySelector('#canvas')
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)

    const scene = new Scene()

    const camera = new PerspectiveCamera(45, width / height, 1, 1000)
    camera.position.set(4, 2, 10)

    const bgGeometry = new PlaneGeometry(1, 1)
    const video = document.querySelector('.video')
    const bgTexture = new VideoTexture(video)
    bgTexture.generateMipmaps = false
    const bgMaterial = new MeshBasicMaterial({ map: bgTexture })
    const bgMesh = new Mesh(bgGeometry, bgMaterial)

    camera.add(bgMesh)
    bgMesh.position.set(0, 0, -200)
    scene.add(camera)

    const resizeBackground = () => {
        const unitRatio = unitsPerPixelAtDepth(camera, camera.position.z - bgMesh.position.z)
        const x = video.offsetWidth * unitRatio
        const y = video.offsetHeight * unitRatio
        bgMesh.scale.set(x, y, 1)
        cover(bgTexture, window.innerWidth / window.innerHeight, 1920 / 1280)
    }
    resizeBackground()



    const can = createCan()
    can.position.z = 5
    scene.add(can)
    attachPane(can)

    const light = new DirectionalLight(0xfff0dd, 1)
    light.position.set(0, 5, 10)
    scene.add(light)


    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target = can.position
    controls.update()

    const animate = () => {
        requestAnimationFrame(animate)
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