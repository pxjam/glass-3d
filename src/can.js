import { BoxGeometry, Mesh, MeshPhysicalMaterial, Group, Color, DoubleSide } from 'three'
import { GLTFLoader } from 'three/addons'
import { getPane } from './getPane.js'
import modelUrl from '/logo-decompressed.gltf?url'

const CAP_HEIGHT = 0.25
const BODY_HEIGHT = 0.75
const INDENT = 0.07

const params = {
    common: {
        roughness: 0.2,
        metalness: 0.0,
        transmission: 1,
        ior: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        thickness: 0.5,
        transparent: true,
        opacity: 1.0
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

export const loadCan = async () => {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader()
        loader.load(modelUrl, (data) => {
            const capMaterial = new MeshPhysicalMaterial({ ...params.common, ...params.cap, side: DoubleSide })
            const bodyMaterial = new MeshPhysicalMaterial({ ...params.common, ...params.body, side: DoubleSide })
            console.log(data)

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

export const createCan = () => {
    const capGeometry = new BoxGeometry(1, CAP_HEIGHT, 1)
    const capMaterial = new MeshPhysicalMaterial({ ...params.common, ...params.cap })
    const cap = new Mesh(capGeometry, capMaterial)
    cap.name = 'cap'

    const bodyGeometry = new BoxGeometry(1, BODY_HEIGHT, 1)
    const bodyMaterial = new MeshPhysicalMaterial({ ...params.common, ...params.body })
    const body = new Mesh(bodyGeometry, bodyMaterial)
    body.name = 'body'

    cap.position.y = (CAP_HEIGHT / 2) + (BODY_HEIGHT / 2) + INDENT

    const can = new Group()
    can.add(cap, body)

    return can
}

export const attachPane = (can) => {
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


    pane.addBinding(params.common, 'roughness', { min: 0, max: 1 }).on('change', commonSetter())
    pane.addBinding(params.common, 'metalness', { min: 0, max: 1 }).on('change', commonSetter())
    pane.addBinding(params.common, 'transmission', { min: 0, max: 1 }).on('change', commonSetter())
    pane.addBinding(params.common, 'ior', { min: 1, max: 2.33 }).on('change', commonSetter())
    pane.addBinding(params.common, 'clearcoat', { min: 0, max: 1 }).on('change', commonSetter())
    pane.addBinding(params.common, 'clearcoatRoughness', { min: 0, max: 1 }).on('change', commonSetter())
    pane.addBinding(params.common, 'thickness', { min: 0, max: 3 }).on('change', commonSetter())
    pane.addBinding(params.common, 'transparent').on('change', commonSetter())
    pane.addBinding(params.common, 'opacity', { min: 0, max: 1 }).on('change', commonSetter())

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
