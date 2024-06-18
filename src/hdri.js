import {
    Clock, Color,
    DoubleSide,
    Group,
    MeshPhysicalMaterial,
    PerspectiveCamera,
    PMREMGenerator,
    Scene,
    WebGLRenderer,
    NoToneMapping,
    LinearToneMapping,
    ReinhardToneMapping,
    CineonToneMapping,
    ACESFilmicToneMapping,
    AgXToneMapping,
    NeutralToneMapping,
    CustomToneMapping
} from 'three'
import { OrbitControls, GLTFLoader, RGBELoader, EXRLoader } from 'three/addons'
import { getPane } from './getPane.js'
import Stats from 'stats.js'
import hdrUrl from '/rostock_laage_airport_1k.hdr?url'
import modelUrl from '/logo-decompressed.gltf?url'

const toneMappingOptions = {
    None: NoToneMapping,
    Linear: LinearToneMapping,
    Reinhard: ReinhardToneMapping,
    Cineon: CineonToneMapping,
    ACESFilmic: ACESFilmicToneMapping,
    AgX: AgXToneMapping,
    Neutral: NeutralToneMapping,
    Custom: CustomToneMapping
}

const params = {
    environment: {
        envMapIntensity: 1,
        toneMapping: toneMappingOptions.None,
        exposure: 1
    },
    common: {
        roughness: 0.2,
        metalness: 0.0,
        transmission: 0,
        ior: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    },
    cap: {
        color: '#ffffff',
        attenuationColor: '#ffffff',
        attenuationDistance: 1,
        sheen: 0.0,
        sheenColor: '#000000',
        sheenRoughness: 1.0
    },
    body: {
        color: '#fa5555',
        attenuationColor: '#ffffff',
        attenuationDistance: 1,
        sheen: 0.0,
        sheenColor: '#000000',
        sheenRoughness: 1.0
    }
}


init()

async function init() {
    const canvas = document.querySelector('#canvas')
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = params.environment.toneMapping
    renderer.toneMappingExposure = params.environment.exposure

    const scene = new Scene()
    window.scene = scene

    const camera = new PerspectiveCamera(45, width / height, 1, 20)
    camera.position.set(2, 1, 2)

    scene.add(camera)

    const pmremGenerator = new PMREMGenerator(renderer)

    const texture = await loadHDR()
    const envMap = pmremGenerator.fromEquirectangular(texture).texture
    scene.background = envMap
    scene.environment = envMap

    const can = await loadCan()
    can.scale.set(0.5, 0.5, 0.5)
    scene.add(can)

    const options = { autoRotate: true }
    const pane = getPane()

    pane.addBinding(options, 'autoRotate')
    attachPane(can, scene, renderer)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target = can.position
    controls.update()

    const clock = new Clock()

    const stats = new Stats()
    stats.showPanel(0)
    document.body.appendChild(stats.dom)

    const animate = () => {
        requestAnimationFrame(animate)
        stats.begin()
        const delta = clock.getDelta()
        if (options.autoRotate) can.rotation.y += delta * 0.25
        renderer.render(scene, camera)
        stats.end()
    }

    animate()

    const resize = () => {
        const width = window.innerWidth
        const height = window.innerHeight

        camera.aspect = width / height
        camera.updateProjectionMatrix()

        renderer.setSize(width, height)
    }

    window.addEventListener('resize', resize)

    return {}
}

async function loadHDR(path = hdrUrl) {
    return new Promise((resolve, reject) => {
        const loader = new RGBELoader()
        loader.load(path, resolve, undefined, reject)
    })
}

function loadCan() {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader()
        loader.load(modelUrl, (data) => {
            const capMaterial = new MeshPhysicalMaterial({ ...params.common, ...params.cap, side: DoubleSide })
            const bodyMaterial = new MeshPhysicalMaterial({ ...params.common, ...params.body, side: DoubleSide })

            const cap = data.scene.getObjectByName('cap')
            const body = data.scene.getObjectByName('body')

            cap.material = capMaterial
            body.material = bodyMaterial
            const group = new Group()
            group.add(cap, body)
            resolve(group)
        }, undefined, reject)
    })
}

function attachPane(can, scene, renderer) {
    const pane = getPane()
    const cap = can.getObjectByName('cap')
    const body = can.getObjectByName('body')

    const setValue = (object, key, value) => {
        if (['color', 'attenuationColor', 'sheenColor'].includes(key)) {
            object.material[key] = new Color(value)
        } else {
            object.material[key] = value
        }
    }

    const createSetter = (object) => (key = '') => (e) => {
        const _key = key || e.target.key
        setValue(object, _key, e.value)
    }

    const bodySetter = createSetter(body)
    const capSetter = createSetter(cap)

    const commonSetter = (key = '') => (e) => {
        const _key = key || e.target.key
        setValue(body, _key, e.value)
        setValue(cap, _key, e.value)
    }

    const envFolder = pane.addFolder({ title: 'Environment' })
    envFolder.addBinding(params.environment, 'envMapIntensity', { min: 0, max: 4 }).on('change', ({ value }) => {
        scene.environmentIntensity = value
    })
    envFolder.addButton({ title: 'Toggle background'}).on('click', () => {
        scene.background = scene.background ? null : scene.environment
    })
    envFolder.addBinding(params.environment, 'exposure', { min: 0, max: 2, step: 0.01 }).on('change', ({ value }) => {
        renderer.toneMappingExposure = value
    })
    envFolder.addBinding(params.environment, 'toneMapping', { options: toneMappingOptions }).on('change', ({ value }) => {
        renderer.toneMapping = value
    })
    envFolder.addButton({ title: 'Upload environment' }).on('click', () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.exr,.hdr'
        input.onchange = (e) => {
            const file = e.target.files[0]
            const reader = new FileReader()

            if (/.exr$/i.test(file.name)) {
                reader.onload = (e) => {
                    const exrLoader = new EXRLoader()
                    exrLoader.load(e.target.result, (texture) => {
                        const envMap = texture
                        const pmremGenerator = new PMREMGenerator(renderer)
                        pmremGenerator.compileEquirectangularShader()

                        const envMapTexture = pmremGenerator.fromEquirectangular(envMap).texture

                        if (scene.background) scene.background = envMapTexture
                        scene.environment = envMapTexture
                    })
                }
            } else if (/.hdr$/i.test(file.name)) {
                reader.onload = async (e) => {
                    const texture = await loadHDR(e.target.result)
                    const pmremGenerator = new PMREMGenerator(renderer)
                    const envMap = pmremGenerator.fromEquirectangular(texture).texture
                    if (scene.background) scene.background = envMap
                    scene.environment = envMap
                }
            } else {
                console.error('Invalid file type')
                return
            }

            reader.readAsDataURL(file)
        }
        input.click()

    })


    pane.addBinding(params.common, 'roughness', { min: 0, max: 1 }).on('change', commonSetter())
    pane.addBinding(params.common, 'metalness', { min: 0, max: 1 }).on('change', commonSetter())
    pane.addBinding(params.common, 'ior', { min: 1, max: 2.33 }).on('change', commonSetter())
    pane.addBinding(params.common, 'clearcoat', { min: 0, max: 1 }).on('change', commonSetter())
    pane.addBinding(params.common, 'clearcoatRoughness', { min: 0, max: 1 }).on('change', commonSetter())

    const capFolder = pane.addFolder({ title: 'Cap' })
    capFolder.addBinding(params.cap, 'color').on('change', capSetter())
    capFolder.addBinding(params.cap, 'attenuationColor').on('change', capSetter())
    capFolder.addBinding(params.cap, 'attenuationDistance', { min: 0.01, max: 2 }).on('change', capSetter())
    capFolder.addBinding(params.cap, 'sheen', { min: 0, max: 1 }).on('change', capSetter())
    capFolder.addBinding(params.cap, 'sheenColor').on('change', capSetter())
    capFolder.addBinding(params.cap, 'sheenRoughness', { min: 0, max: 1 }).on('change', capSetter())

    const bodyFolder = pane.addFolder({ title: 'Body' }).on('change', bodySetter())
    bodyFolder.addBinding(params.body, 'color').on('change', bodySetter())
    bodyFolder.addBinding(params.body, 'attenuationColor').on('change', bodySetter())
    bodyFolder.addBinding(params.cap, 'attenuationDistance', { min: 0.01, max: 2 }).on('change', bodySetter())
    bodyFolder.addBinding(params.cap, 'sheen', { min: 0, max: 1 }).on('change', bodySetter())
    bodyFolder.addBinding(params.cap, 'sheenColor').on('change', bodySetter())
    bodyFolder.addBinding(params.cap, 'sheenRoughness', { min: 0, max: 1 }).on('change', bodySetter())

    const copyButton = pane.addButton({ title: 'Copy' })

    let timeout = null
    const notify = (title, time = 2500) => {
        clearTimeout(timeout)
        copyButton.title = title
        timeout = setTimeout(() => {
            copyButton.title = 'Copy'
        }, time)
    }

    copyButton.on('click', async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(params))
            notify('Copied')
        } catch (error) {
            console.error(error)
            notify('Error')
        }
    })
}