import { ShaderMaterial } from 'three'

export const createBackgroundMaterial = (texture, width, height) => {
    const material = new ShaderMaterial({
        uniforms: {
            tMap: { value: texture }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec2 vUv;
            uniform sampler2D tMap;
      
            void main() {
              vec2 uv = vUv;
              float ratio = 16.0 / 9.0;
              uv.y *= ratio;
              
              uv.y -= (0.5 - (1. / ratio) * 0.5) * ratio;
              vec3 col = texture2D(tMap, uv).rgb;
              
              col = mix(col, vec3(0), step(0.5, abs(uv.y - 0.5)));
              
              gl_FragColor = vec4(col, 1.);
            }
        `
    })

    return material
}