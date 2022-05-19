class Vec2 {
    constructor(x, y){
        this.x = x
        this.y = y
    }
}

class Vec3 {
    constructor(x, y, z){
        this.x = x
        this.y = y
        this.z = z
    }

    static subtract(v1, v2){
        return new Vec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z)
    }

    static scalarMultiply(v, s){
        return new Vec3(v.x * s, v.y * s, v.z * s)
    }

    magnitude(){
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
    }

    normalize(){
        return Vec3.scalarMultiply(this, 1 / this.magnitude())
    }
}

class Vec4 {
    constructor(x, y, z, w){
        this.x = x
        this.y = y
        this.w = w
        this.z = z
    }

    static projectionScale = 0
    static projectionOffset = new Vec3(0, 0, 0)

    static to3D(v, cameraW){
        return new Vec3(
            v.x - (v.x * (v.w - cameraW) * Vec4.projectionScale) + (Vec4.projectionOffset.x * (v.w - cameraW)),
            v.y - (v.y * (v.w - cameraW) * Vec4.projectionScale) + (Vec4.projectionOffset.y * (v.w - cameraW)),
            v.z - (v.z * (v.w - cameraW) * Vec4.projectionScale) + (Vec4.projectionOffset.y * (v.w - cameraW))
        )
    }
}

class Camera {
    constructor(pos, rot, fov, near){
        this.pos = pos
        this.rot = rot
        this.fov = fov
        this.near = near
    }
}

class Scene {
    constructor(camera, segments, vertexColor, dimensionalEdgeColor, firstDimensionColor, secondDimensionColor, bgColor){
        this.camera = camera
        this.segments = segments

        this.vertexColor = vertexColor
        this.dimensionalEdgeColor = dimensionalEdgeColor
        this.firstDimensionColor = firstDimensionColor
        this.secondDimensionColor = secondDimensionColor
        this.bgColor = bgColor
    }

    render(canvas, ctx){
        const sinRotX = Math.sin(this.camera.rot.x)
        const cosRotX = Math.cos(this.camera.rot.x)
        const sinRotY = Math.sin(this.camera.rot.y)
        const cosRotY = Math.cos(this.camera.rot.y)

        ctx.fillStyle = this.bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        const screenSpaceSegments = []
        
        this.segments.forEach(segment => {
            let p1 = Vec4.to3D(segment[0], this.camera.pos.w)
            let p2 = Vec4.to3D(segment[1], this.camera.pos.w)

            p1 = Vec3.subtract(p1, this.camera.pos)
            p2 = Vec3.subtract(p2, this.camera.pos)

            p1 = new Vec3(p1.x * cosRotY + p1.z * sinRotY, p1.y, p1.z * cosRotY - p1.x * sinRotY)
            p2 = new Vec3(p2.x * cosRotY + p2.z * sinRotY, p2.y, p2.z * cosRotY - p2.x * sinRotY)

            p1 = new Vec3(p1.x, p1.y * cosRotX - p1.z * sinRotX, p1.y * sinRotX + p1.z * cosRotX)
            p2 = new Vec3(p2.x, p2.y * cosRotX - p2.z * sinRotX, p2.y * sinRotX + p2.z * cosRotX)

            if(p1.z > this.camera.near && p2.z > this.camera.near){
                p1 = new Vec3(p1.x / p1.z / Math.tan(this.camera.fov / 2), p1.y / p1.z / Math.tan(this.camera.fov / 2), p1.z)
                p2 = new Vec3(p2.x / p2.z / Math.tan(this.camera.fov / 2), p2.y / p2.z / Math.tan(this.camera.fov / 2), p2.z)

                let color = this.dimensionalEdgeColor

                if(segment[0].w == segment[1].w){
                    if(segment[0].w == 0){
                        color = this.firstDimensionColor
                    } else {
                        color = this.secondDimensionColor
                    }
                }

                screenSpaceSegments.push([ p1, p2, color ])
            }
        })

        screenSpaceSegments.sort((s1, s2) => {
            if(s1[0].z < s2[0].z && s1[1].z < s2[1].z){
                return 1
            } else {
                return -1
            }
        })

        ctx.lineWidth = 4

        screenSpaceSegments.forEach(segment => {
            ctx.strokeStyle = segment[2]
            ctx.beginPath()
            ctx.moveTo(0.5 * canvas.width + segment[0].x * canvas.width, 0.5 * canvas.height - segment[0].y * canvas.width)
            ctx.lineTo(0.5 * canvas.width + segment[1].x * canvas.width, 0.5 * canvas.height - segment[1].y * canvas.width)
            ctx.closePath()
            ctx.stroke()
        })

        ctx.fillStyle = this.vertexColor
        screenSpaceSegments.forEach(segment => {
            ctx.beginPath()
            ctx.arc(0.5 * canvas.width + segment[0].x * canvas.width, 0.5 * canvas.height - segment[0].y * canvas.width, 6, 0, 2 * Math.PI)
            ctx.closePath()
            ctx.fill()
            ctx.beginPath()
            ctx.arc(0.5 * canvas.width + segment[1].x * canvas.width, 0.5 * canvas.height - segment[1].y * canvas.width, 6, 0, 2 * Math.PI)
            ctx.closePath()
            ctx.fill()
        })
    }
}

const canvas = document.getElementById("canvas")
canvas.width = window.innerWidth - 300
canvas.height = window.innerHeight
const ctx = canvas.getContext("2d")

const mainScene = new Scene(
    new Camera(
        new Vec4(0, 2.5, -10, 0.5),
        new Vec2(-10 * Math.PI / 180, 0),
        90 * Math.PI / 180,
        1
    ),
    [
        /*  W=0 Cube  */
        // front face
        [
            new Vec4(-1, 1, -1, 0),
            new Vec4(1, 1, -1, 0),
        ],
        [
            new Vec4(1, 1, -1, 0),
            new Vec4(1, -1, -1, 0)
        ],
        [
            new Vec4(1, -1, -1, 0),
            new Vec4(-1, -1, -1, 0)
        ],
        [
            new Vec4(-1, -1, -1, 0),
            new Vec4(-1, 1, -1, 0)
        ],
        // back face
        [
            new Vec4(-1, 1, 1, 0),
            new Vec4(1, 1, 1, 0),
        ],
        [
            new Vec4(1, 1, 1, 0),
            new Vec4(1, -1, 1, 0)
        ],
        [
            new Vec4(1, -1, 1, 0),
            new Vec4(-1, -1, 1, 0)
        ],
        [
            new Vec4(-1, -1, 1, 0),
            new Vec4(-1, 1, 1, 0)
        ],
        // lateral edges
        [
            new Vec4(-1, 1, -1, 0),
            new Vec4(-1, 1, 1, 0)
        ],
        [
            new Vec4(1, 1, -1, 0),
            new Vec4(1, 1, 1, 0)
        ],
        [
            new Vec4(1, -1, -1, 0),
            new Vec4(1, -1, 1, 0)
        ],
        [
            new Vec4(-1, -1, -1, 0),
            new Vec4(-1, -1, 1, 0)
        ],
        /*  W=1 Cube  */
        // front face
        [
            new Vec4(-1, 1, -1, 1),
            new Vec4(1, 1, -1, 1),
        ],
        [
            new Vec4(1, 1, -1, 1),
            new Vec4(1, -1, -1, 1)
        ],
        [
            new Vec4(1, -1, -1, 1),
            new Vec4(-1, -1, -1, 1)
        ],
        [
            new Vec4(-1, -1, -1, 1),
            new Vec4(-1, 1, -1, 1)
        ],
        // back face
        [
            new Vec4(-1, 1, 1, 1),
            new Vec4(1, 1, 1, 1),
        ],
        [
            new Vec4(1, 1, 1, 1),
            new Vec4(1, -1, 1, 1)
        ],
        [
            new Vec4(1, -1, 1, 1),
            new Vec4(-1, -1, 1, 1)
        ],
        [
            new Vec4(-1, -1, 1, 1),
            new Vec4(-1, 1, 1, 1)
        ],
        // lateral edges
        [
            new Vec4(-1, 1, -1, 1),
            new Vec4(-1, 1, 1, 1)
        ],
        [
            new Vec4(1, 1, -1, 1),
            new Vec4(1, 1, 1, 1)
        ],
        [
            new Vec4(1, -1, -1, 1),
            new Vec4(1, -1, 1, 1)
        ],
        [
            new Vec4(-1, -1, -1, 1),
            new Vec4(-1, -1, 1, 1)
        ],
        /*  Dimensional Edges  */
        [
            new Vec4(-1, 1, -1, 0),
            new Vec4(-1, 1, -1, 1)
        ],
        [
            new Vec4(1, 1, -1, 0),
            new Vec4(1, 1, -1, 1)
        ],
        [
            new Vec4(1, -1, -1, 0),
            new Vec4(1, -1, -1, 1)
        ],
        [
            new Vec4(-1, -1, -1, 0),
            new Vec4(-1, -1, -1, 1)
        ],
        [
            new Vec4(-1, 1, 1, 0),
            new Vec4(-1, 1, 1, 1)
        ],
        [
            new Vec4(1, 1, 1, 0),
            new Vec4(1, 1, 1, 1)
        ],
        [
            new Vec4(1, -1, 1, 0),
            new Vec4(1, -1, 1, 1)
        ],
        [
            new Vec4(-1, -1, 1, 0),
            new Vec4(-1, -1, 1, 1)
        ]
    ],
    "rgb(100, 200, 100)",
    "rgb(0, 255, 0)",
    "rgb(250, 0, 0)",
    "rgb(0, 0, 250)",
    "rgb(25, 0, 50)"
)

let keyMap = {}
window.addEventListener("keydown", (event) => {
    event.preventDefault()
    keyMap[event.key] = true
})
window.addEventListener("keyup", (event) => {
    keyMap[event.key] = false
})

let t = 0
let last = performance.now()
const updateScene = () => {
    if(keyMap["ArrowLeft"]){
        mainScene.camera.pos.x += 0.1 * Math.cos(mainScene.camera.rot.y + Math.PI)
        mainScene.camera.pos.z += 0.1 * Math.sin(mainScene.camera.rot.y + Math.PI)
    }
    if(keyMap["ArrowRight"]){
        mainScene.camera.pos.x += 0.1 * Math.cos(mainScene.camera.rot.y)
        mainScene.camera.pos.z += 0.1 * Math.sin(mainScene.camera.rot.y)
    }
    if(keyMap["ArrowUp"]){
        mainScene.camera.pos.x += 0.1 * Math.cos(mainScene.camera.rot.y + Math.PI / 2)
        mainScene.camera.pos.z += 0.1 * Math.sin(mainScene.camera.rot.y + Math.PI / 2)
    }
    if(keyMap["ArrowDown"]){
        mainScene.camera.pos.x += 0.1 * Math.cos(mainScene.camera.rot.y - Math.PI / 2)
        mainScene.camera.pos.z += 0.1 * Math.sin(mainScene.camera.rot.y - Math.PI / 2)
    }

    if(keyMap["w"]){
        mainScene.camera.pos.y += 0.1
    }
    if(keyMap["s"]){
        mainScene.camera.pos.y -= 0.1
    }
    if(keyMap["a"]){
        mainScene.camera.rot.y += 0.015
    }
    if(keyMap["d"]){
        mainScene.camera.rot.y -= 0.015
    }

    mainScene.camera.pos.w = parseFloat(document.getElementById("w").value)
    mainScene.camera.rot.x = parseFloat(document.getElementById("rotX").value)
    mainScene.camera.fov = parseFloat(document.getElementById("fov").value * Math.PI / 180)

    const dt = performance.now() - last
    t += 0.001 * dt
    last = performance.now()

    Vec4.projectionScale = 0.5 * Math.sin(t)

    Vec4.projectionOffset.x = 1.5 * Math.cos(t)

    mainScene.render(canvas, ctx)
    requestAnimationFrame(updateScene)
}

updateScene()