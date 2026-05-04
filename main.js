let program;
let gl;

let pointsArray = [];
let wings = [];
let body;
let animatedArray = [];
let colorsArray =[];

let groundPoints = [];
const groundColor = vec4(0.0, 0.7, 0.0, 1.0);
const groundColors = [groundColor, groundColor, groundColor, groundColor, groundColor, groundColor]
const groundRadius = 20;

let roadPoints = [];
const roadColor = vec4(0.3, 0.3, 0.3, 1.0);
let roadColors = [];
const roadWidth = 4;
const roadInnerRadius = 6;
const roadQuality = 50;
const roadElevation = 0.01;

let carPoints= [];
let hoodPoints = [];
let carColors = [];
let hoodColors = [];
const bodyColor = vec4(1.0, 0.0, 0.0, 1.0);
const windowColor = vec4(0.5, 1.0, 1.0, 1.0);
const tireColor = vec4(0.1, 0.1, 0.1, 1.0);

let skyboxPoints = [];
let skyboxColors = [];
let skyboxColor = vec4(0.5, 1.0, 1.0, 1.0);

let cameraMatrix;
let projMatrix;

let splines = [];
let catmull = [];
let bSpline = [];

let vPosition;
let vColor;
let modelMatrixLoc;

const birdSegments = 125;
let birdt = 0;
let birdl = 0;
let birdAlpha = 0;
let currentType = 0; // 0 = Catmull, 1 = BSpline
let birdControlPoint = 0;
let currentSpline = 0;
const numParts = 3;
const flapAngle = 10;

const carSegments = 225;
let cart = 0;
let carl = 0;
let carAlpha = 0;
let carControlPoint = 0;
let carFollow = false;

let normalsArray = [];
let vNormal;

let carNormals = [];
let groundNormals = [];
let roadNormals = [];
let wingNormals = [];
let pistonHeadNormals = [];
let pistonArm1Normals = [];
let pistonArm2Normals = [];
let particleNormals = [];

let birdBuffers = {};
let wingBuffers = {};
let carBuffers = {};
let groundBuffers = {};
let roadBuffers = {};
let pistonHeadBuffers = {};
let pistonArm1Buffers = {};
let pistonArm2Buffers = {};
let particleBuffers = {};

class Point {
    constructor(pos, rot) {
        this.x = pos[0];
        this.y = pos[1];
        this.z = pos[2];
        this.xRot = rot[0];
        this.yRot = rot[1];
        this.zRot = rot[2];
    }
}

class Spline {
    constructor(points) {
        this.points = points;
    }

    print() {
        console.log(this.points);
    }

    draw() {
        for (let i = 0; i < this.points.length; i++) {
            let point = this.points[i];
            let x = point.x;
            let y = point.y;
            let z = point.z;

            let modelMatrix = translate(parseFloat(x), parseFloat(y), parseFloat(z));
            gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

            setNormalMatrix(modelMatrix);
            gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
        }
    }
}

class Particle {
    constructor(position, velocity) {
        this.position = position;
        this.velocity = velocity;
    }

    // Update position based on velocity
    update(dt) {
        this.position = add(this.position, scale(dt, this.velocity));
    }

    /**
     *  Handles collisions between this particle and the four walls
     */
    handleWallCollisions() {
        if (this.position[0] > pistonEnd[0] + pistonArmLength1 - particleRadius) {
            this.position[0] = pistonEnd[0] + pistonArmLength1 - particleRadius;
            this.velocity[0] = -this.velocity[0];
        }
        if (this.position[0] < particleRadius + pistonEnd[0] - pistonArmLength1) {
            this.position[0] = particleRadius + pistonEnd[0] - pistonArmLength1;
            this.velocity[0] = -this.velocity[0];
        }
        if (this.position[1] < pistonEnd[1] + pistonHeadHeight + particleRadius) {
            this.position[1] = pistonEnd[1] + pistonHeadHeight + particleRadius;
            this.velocity[1] = -this.velocity[1];
        }
        if (this.position[1] > yUpperBound - particleRadius) {
            this.position[1] = yUpperBound - particleRadius;
            this.velocity[1] = -this.velocity[1];
        }
        if (this.position[2] > pistonEnd[2] + pistonArmLength1 - particleRadius) {
            this.position[2] = pistonEnd[2] + pistonArmLength1 - particleRadius;
            this.velocity[2] = -this.velocity[2];
        }
        if (this.position[2] < particleRadius + pistonEnd[2] - pistonArmLength1) {
            this.position[2] = particleRadius + pistonEnd[2] - pistonArmLength1;
            this.velocity[2] = -this.velocity[2];
        }
    }

    /**
     * Handles collisions between this particle and another particle p.
     * @param p The other particle used for collision detection.
     */
    handleParticleCollisions(p) {
        let n = vec3(p.position[0] - this.position[0], p.position[1] - this.position[1], p.position[2] - this.position[2]);
        let vr = vec3(p.velocity[0] - this.velocity[0], p.velocity[1] - this.velocity[1], p.velocity[2] - this.velocity[2]);
        let vnc = (dot(n, vr) / (n[0]*n[0] + n[1]*n[1] + n[2]*n[2]));
        let vn = vec3(n[0] * vnc, n[1] * vnc, n[2] * vnc);
        this.velocity = add(this.velocity, vn);
        p.velocity = subtract(p.velocity, vn);
    }

    // Draw particle as a point
    render() {
        bindBuffers(particleBuffers);
        let modelMatrix = translate(this.position[0], this.position[1], this.position[2]);
        modelMatrix = mult(carMatrix, modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        setNormalMatrix(modelMatrix);
        gl.drawArrays(gl.TRIANGLES, 0, particlePoints.length);
    }
}

// Hierarchy structure
function Body(matrix) {
    this.matrix = matrix;
    this.children = [];
}

function Wing(matrix, offset) {
    this.matrix = matrix;
    this.offset = offset;
    this.child = null;
}

// Cube building helpers
let pointCube = [
    vec4( -0.1, -0.1,  0.1, 1.0 ),
    vec4( -0.1,  0.1,  0.1, 1.0 ),
    vec4( 0.1,  0.1,  0.1, 1.0 ),
    vec4( 0.1, -0.1,  0.1, 1.0 ),
    vec4( -0.1, -0.1, -0.1, 1.0 ),
    vec4( -0.1,  0.1, -0.1, 1.0 ),
    vec4( 0.1,  0.1, -0.1, 1.0 ),
    vec4( 0.1, -0.1, -0.1, 1.0 )
];

let animatedCube = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

let wingPoints = [
    vec4( 0, -0.1,  0.5, 1.0 ),
    vec4( 0,  0.1,  0.5, 1.0 ),
    vec4( 1,  0.1,  0.5, 1.0 ),
    vec4( 1, -0.1,  0.5, 1.0 ),
    vec4( 0, -0.1, -0.5, 1.0 ),
    vec4( 0,  0.1, -0.5, 1.0 ),
    vec4( 1,  0.1, -0.5, 1.0 ),
    vec4( 1, -0.1, -0.5, 1.0 )
]

let vertexColors = [
    vec4( 0.8, 0.5, 0.0, 1.0 ),
    vec4( 0.8, 0.5, 0.0, 1.0 ),
    vec4( 0.8, 0.5, 0.0, 1.0 ),
    vec4( 0.8, 0.5, 0.0, 1.0 ),
    vec4( 0.8, 0.5, 0.0, 1.0 ),
    vec4( 0.8, 0.5, 0.0, 1.0 ),
    vec4( 0.8, 0.5, 0.0, 1.0 ),
    vec4( 0.8, 0.5, 0.0, 1.0 )
];

function quad(a, b, c, d) {
    let normal = computeNormal(
        pointCube[a],
        pointCube[b],
        pointCube[c]
    );

    pointsArray.push(pointCube[a]);
    animatedArray.push(animatedCube[a]);
    colorsArray.push(vertexColors[a]);
    normalsArray.push(normal);

    pointsArray.push(pointCube[b]);
    animatedArray.push(animatedCube[b]);
    colorsArray.push(vertexColors[a]);
    normalsArray.push(normal);

    pointsArray.push(pointCube[c]);
    animatedArray.push(animatedCube[c]);
    colorsArray.push(vertexColors[a]);
    normalsArray.push(normal);

    pointsArray.push(pointCube[a]);
    animatedArray.push(animatedCube[a]);
    colorsArray.push(vertexColors[a]);
    normalsArray.push(normal);

    pointsArray.push(pointCube[c]);
    animatedArray.push(animatedCube[c]);
    colorsArray.push(vertexColors[a]);
    normalsArray.push(normal);

    pointsArray.push(pointCube[d]);
    animatedArray.push(animatedCube[d]);
    colorsArray.push(vertexColors[a]);
    normalsArray.push(normal);
}

function wing(a, b, c, d) {
    wings.push(wingPoints[a]);
    wings.push(wingPoints[b]);
    wings.push(wingPoints[c]);
    wings.push(wingPoints[a]);
    wings.push(wingPoints[c]);
    wings.push(wingPoints[d]);

    let normal = computeNormal(
        wingPoints[a],
        wingPoints[b],
        wingPoints[c]
    );

    for(let i = 0; i < 6; i++) {
        wingNormals.push(normal);
    }
}

function createGround() {
    let normal = vec3(0.0, 1.0, 0.0);

    groundPoints.push(vec4(groundRadius*2, 0.0, -groundRadius, 1.0));
    groundPoints.push(vec4(-groundRadius*2, 0.0, -groundRadius, 1.0));
    groundPoints.push(vec4(-groundRadius*2, 0.0, groundRadius, 1.0));
    groundPoints.push(vec4(groundRadius*2, 0.0, -groundRadius, 1.0));
    groundPoints.push(vec4(-groundRadius*2, 0.0, groundRadius, 1.0));
    groundPoints.push(vec4(groundRadius*2, 0.0, groundRadius, 1.0));

    for(let i = 0; i < 6; i++) {
        groundNormals.push(normal);
    }
}

function createRoad() {
    const degrees = 2 * Math.PI/roadQuality;
    const shift = degrees/2;
    const outerR = roadInnerRadius + roadWidth;
    const innerR = roadInnerRadius;
    for (let i = 0; i < roadQuality; i++){
        roadPoints.push(vec4(
            outerR*Math.cos(i * degrees - shift),
            roadElevation,
            outerR*Math.sin(i * degrees - shift),
            1.0));
        roadColors.push(roadColor);
        roadPoints.push(vec4(
            innerR*Math.cos(i * degrees),
            roadElevation,
            innerR*Math.sin(i * degrees),
            1.0));
        roadColors.push(roadColor);
        roadPoints.push(vec4(
            outerR*Math.cos((i+1) * degrees - shift),
            roadElevation,
            outerR*Math.sin((i+1) * degrees - shift),
            1.0));
        roadColors.push(roadColor);
        roadPoints.push(vec4(
            innerR*Math.cos((i+1) * degrees),
            roadElevation,
            innerR*Math.sin((i+1) * degrees),
            1.0));
        roadColors.push(roadColor);
        roadPoints.push(vec4(
            outerR*Math.cos((i+1) * degrees - shift),
            roadElevation,
            outerR*Math.sin((i+1) * degrees - shift),
            1.0));
        roadColors.push(roadColor);
        roadPoints.push(vec4(
            innerR*Math.cos(i * degrees),
            roadElevation,
            innerR*Math.sin(i * degrees),
            1.0));
        roadColors.push(roadColor);
        for(let k = 0; k < 6; k++) {
            roadNormals.push(vec3(0.0, 1.0, 0.0));
        }
    }
}

function createCar() {
    const carKeyPoints = [
        vec4(2.0, 0.5, -1.0, 1.0),
        vec4(-2.0, 0.5, -1.0, 1.0),
        vec4(-2.0, 0.5, 1.0, 1.0),
        vec4(2.0, 0.5, 1.0, 1.0),
        vec4(2.0, 1.5, -1.0, 1.0),
        vec4(-2.0, 1.5, -1.0, 1.0),
        vec4(-2.0, 1.5, 1.0, 1.0),
        vec4(2.0, 1.5, 1.0, 1.0),
        vec4(1.2, 1.5, -1.0, 1.0),
        vec4(-1.2, 1.5, -1.0, 1.0),
        vec4(-1.2, 1.5, 1.0, 1.0),
        vec4(1.2, 1.5, 1.0, 1.0),
        vec4(0.8, 2.0, -1.0, 1.0),
        vec4(-0.8, 2.0, -1.0, 1.0),
        vec4(-0.8, 2.0, 1.0, 1.0),
        vec4(0.8, 2.0, 1.0, 1.0)
    ];

    genericQuad(0, 1, 2, 3, carKeyPoints, bodyColor, carPoints, carColors, carNormals);
    genericQuad(0, 4, 7, 3, carKeyPoints, bodyColor, hoodPoints, hoodColors, carNormals);
    genericQuad(1, 5, 4, 0, carKeyPoints, bodyColor, carPoints, carColors, carNormals);
    genericQuad(0, 4, 5, 1, carKeyPoints, bodyColor, carPoints, carColors, carNormals);
    genericQuad(2, 6, 5, 1, carKeyPoints, bodyColor, carPoints, carColors, carNormals);
    genericQuad(1, 5, 6, 2, carKeyPoints, bodyColor, carPoints, carColors, carNormals);
    genericQuad(3, 7, 6, 2, carKeyPoints, bodyColor, carPoints, carColors, carNormals);
    genericQuad(2, 6, 7, 3, carKeyPoints, bodyColor, carPoints, carColors, carNormals);
    genericQuad(4, 8, 11, 7, carKeyPoints, bodyColor, hoodPoints, hoodColors, carNormals);
    genericQuad(9, 5, 6, 10, carKeyPoints, bodyColor, carPoints, carColors, carNormals);
    genericQuad(8, 12, 15, 11, carKeyPoints, windowColor, carPoints, carColors, carNormals);
    genericQuad(9, 13, 12, 8, carKeyPoints, windowColor, carPoints, carColors, carNormals);
    genericQuad(10, 14, 13, 9, carKeyPoints, bodyColor, carPoints, carColors, carNormals);
    genericQuad(11, 15, 14, 10, carKeyPoints, windowColor, carPoints, carColors, carNormals);
    genericQuad(12, 13, 14, 15, carKeyPoints, bodyColor, carPoints, carColors, carNormals);

    const degrees = 2 * Math.PI/50;

    for (let j = 0; j < 4; j++) {
        let z = Math.pow(-1, j);
        let outerZ = z + 0.1;
        let innerZ = z - 0.1;
        let x = 1.3 - 2.6 * Math.floor(j/2);
        for (let i = 0; i <= 50; i++) {
            carPoints.push(vec4(x, 0.5, outerZ, 1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(
                0.5 * Math.cos((i) * degrees) + x,
                0.5 * Math.sin((i) * degrees) + 0.5,
                outerZ,
                1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(
                0.5 * Math.cos((i+1) * degrees) + x,
                0.5 * Math.sin((i+1) * degrees) + 0.5,
                outerZ,
                1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(x, 0.5, innerZ, 1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(
                0.5 * Math.cos((i+1) * degrees) + x,
                0.5 * Math.sin((i+1) * degrees) + 0.5,
                innerZ,
                1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(
                0.5 * Math.cos((i) * degrees) + x,
                0.5 * Math.sin((i) * degrees) + 0.5,
                innerZ,
                1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(
                0.5 * Math.cos((i) * degrees) + x,
                0.5 * Math.sin((i) * degrees) + 0.5,
                innerZ,
                1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(
                0.5 * Math.cos((i+1) * degrees) + x,
                0.5 * Math.sin((i+1) * degrees) + 0.5,
                innerZ,
                1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(
                0.5 * Math.cos((i+1) * degrees) + x,
                0.5 * Math.sin((i+1) * degrees) + 0.5,
                outerZ,
                1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(
                0.5 * Math.cos((i+1) * degrees) + x,
                0.5 * Math.sin((i+1) * degrees) + 0.5,
                outerZ,
                1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(
                0.5 * Math.cos((i) * degrees) + x,
                0.5 * Math.sin((i) * degrees) + 0.5,
                outerZ,
                1.0));
            carColors.push(tireColor);
            carPoints.push(vec4(
                0.5 * Math.cos((i) * degrees) + x,
                0.5 * Math.sin((i) * degrees) + 0.5,
                innerZ,
                1.0));
            carColors.push(tireColor);
        }
    }
}

function createSkybox() {
    const skyboxKey = [
        vec4(groundRadius, -1.0, -groundRadius, 1.0),
        vec4(-groundRadius, -1.0, -groundRadius, 1.0),
        vec4(-groundRadius, -1.0, groundRadius, 1.0),
        vec4(groundRadius, -1.0, groundRadius, 1.0),
        vec4(groundRadius, groundRadius, -groundRadius, 1.0),
        vec4(-groundRadius, -groundRadius, -groundRadius, 1.0),
        vec4(-groundRadius, -groundRadius, groundRadius, 1.0),
        vec4(groundRadius, -groundRadius, groundRadius, 1.0)
    ]

    genericQuad(0, 1, 2, 3, skyboxKey, skyboxColor, skyboxPoints, skyboxColors);
    genericQuad(0, 4, 7, 3, skyboxKey, skyboxColor, skyboxPoints, skyboxColors);
    genericQuad(1, 5, 4, 0, skyboxKey, skyboxColor, skyboxPoints, skyboxColors);
    genericQuad(2, 6, 5, 1, skyboxKey, skyboxColor, skyboxPoints, skyboxColors);
    genericQuad(3, 7, 6, 2, skyboxKey, skyboxColor, skyboxPoints, skyboxColors);
    genericQuad(4, 5, 6, 7, skyboxKey, skyboxColor, skyboxPoints, skyboxColors);
}

function genericQuad(a, b, c, d, keyPoints, color, pointArray, colorArray, normalArray = null) {
    let normal = computeNormal(
        keyPoints[a],
        keyPoints[b],
        keyPoints[c]
    );
    pointArray.push(keyPoints[a]);
    colorArray.push(color);
    if(normalArray) {
        normalArray.push(normal);
    }

    pointArray.push(keyPoints[b]);
    colorArray.push(color);
    if(normalArray) {
        normalArray.push(normal);
    }

    pointArray.push(keyPoints[c]);
    colorArray.push(color);
    if(normalArray) {
        normalArray.push(normal);
    }

    pointArray.push(keyPoints[c]);
    colorArray.push(color);
    if(normalArray) {
        normalArray.push(normal);
    }

    pointArray.push(keyPoints[d]);
    colorArray.push(color);
    if(normalArray) {
        normalArray.push(normal);
    }

    pointArray.push(keyPoints[a]);
    colorArray.push(color);
    if(normalArray) {
        normalArray.push(normal);
    }
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function makeWings() {

    wing( 1, 0, 3, 2 );
    wing( 2, 3, 7, 6 );
    wing( 3, 0, 4, 7 );
    wing( 6, 5, 1, 2 );
    wing( 4, 5, 6, 7 );
    wing( 5, 4, 0, 1 );
}

function main()
{
    // Retrieve <canvas> element
    let canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas, undefined);

    //Check that the return value is not null.
    if (!gl)
    {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);

    //Set up the viewport
    gl.viewport( 0, 0, 400, 400);

    // Set flags
    gl.clearColor(0.5, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Create cubes
    colorCube();
    makeWings();
    createGround();
    createRoad();
    createCar();

    // Create Hierarchy
    body = new Body(mat4());
    let wing1 = null;
    let wing2 = null;
    for (let i = 0; i < numParts; i++) {
        if (wing1 === null) {
            let newWing1 = new Wing(body.matrix, 0.5);
            let newWing2 = new Wing(body.matrix, -0.5);
            body.children.push(newWing1);
            body.children.push(newWing2);
            wing1 = newWing1;
            wing2 = newWing2;
        } else {
            let newWing1 = new Wing(wing1.matrix, 1);
            let newWing2 = new Wing(wing2.matrix, -1);
            wing1.child = newWing1;
            wing2.child = newWing2;
            wing1 = newWing1;
            wing2 = newWing2;
        }
    }

    let birdSpline = new Spline([new Point([0, 10, -3.75], [0, -45, 0]),
        new Point([1.25, 10, -6.25], [0, -90, 0]),
        new Point([3.75, 10, -7.5], [0, -135, 0]),
        new Point([6.25, 10, -6.25], [0, -180, 0]),
        new Point([7.5, 10, -3.75], [0, -225, 0]),
        new Point([6.25, 10, -1.25], [0, -270, 0]),
        new Point([3.75, 10, 0], [0, -315, 0]),
        new Point([1.25, 10, -1.25], [0, -360, 0]),
        new Point([0, 10, -3.75], [0, -405, 0]),
        new Point([1.25, 10, -6.25], [0, -450, 0]),
        new Point([3.75, 10, -7.5], [0, -495, 0])]);

    let carSpline = new Spline([new Point([-7.5, 0, 0], [0, 45, 0]),
        new Point([-5.3, 0, -5.3], [0, 0, 0]),
        new Point([0, 0, -7.5], [0, -45, 0]),
        new Point([5.3, 0, -5.3], [0, -90, 0]),
        new Point([7.5, 0, 0], [0, -135, 0]),
        new Point([5.3, 0, 5.3], [0, -180, 0]),
        new Point([0, 0, 7.5], [0, -225, 0]),
        new Point([-5.3, 0, 5.3], [0, -270, 0]),
        new Point([-7.5, 0, 0], [0, -315, 0]),
        new Point([-5.3, 0, -5.3], [0, -360, 0]),
        new Point([0, 0, -7.5], [0, -405, 0])]);

    splines.push(birdSpline);
    splines.push(carSpline);
    birdt = 0;
    cart = 0;
    currentType = 0;
    currentSpline = 0;
    birdl = 0;
    birdControlPoint = 0;
    carl = 0;
    carControlPoint = 0;
    generateSplines();

    birdBuffers = createBuffers(animatedArray, colorsArray, normalsArray);
    wingBuffers = createBuffers(
        wings,
        colorsArray.slice(0, wings.length),
        wingNormals
    );
    carBuffers = createBuffers(carPoints, carColors, carNormals);
    groundBuffers = createBuffers(groundPoints, groundColors, groundNormals);
    roadBuffers = createBuffers(roadPoints, roadColors, roadNormals);
    pistonHeadBuffers = createBuffers(pistonHeadPoints, pistonHeadColors, pistonHeadNormals);
    pistonArm1Buffers = createBuffers(pistonArm1Points, pistonArm1Colors, pistonArm1Normals);
    pistonArm2Buffers = createBuffers(pistonArm2Points, pistonArm2Colors, pistonArm2Normals);
    particleBuffers = createBuffers(particlePoints, particleColors, particleNormals);

    const lightPosition = vec3(0.0, 15.0, 23.0);
    const eyePosition = vec3(0.0, 10.0, 23.0);

    gl.uniform3fv(
        gl.getUniformLocation(program, "lightPosition"),
        flatten(lightPosition)
    );

    gl.uniform3fv(
        gl.getUniformLocation(program, "eyePosition"),
        flatten(eyePosition)
    );

    gl.uniform4fv(
        gl.getUniformLocation(program, "ambientProduct"),
        flatten(vec4(0.25, 0.25, 0.25, 1.0))
    );

    gl.uniform4fv(
        gl.getUniformLocation(program, "diffuseProduct"),
        flatten(vec4(1.0, 1.0, 1.0, 1.0))
    );

    gl.uniform4fv(
        gl.getUniformLocation(program, "specularProduct"),
        flatten(vec4(1.0, 1.0, 1.0, 1.0))
    );

    gl.uniform1f(
        gl.getUniformLocation(program, "shininess"),
        50.0
    );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.enableVertexAttribArray( vPosition );
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.enableVertexAttribArray( vColor );

    vNormal = gl.getAttribLocation(program, "vNormal");
    gl.enableVertexAttribArray(vNormal);

    projMatrix = perspective(65, 1, 0.1, 100);
    let projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
    gl.uniformMatrix4fv(projMatrixLoc, false, flatten(projMatrix));

    cameraMatrix = lookAt(vec3(0.0, 10.0, 23.0), vec3(0.0, 5.0, 0.0), vec3(0.0, 1.0, 0.0));
    let cameraMatrixLoc = gl.getUniformLocation(program, "cameraMatrix");
    gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));

    let quat = toQuaternion(new Point([0,0,0], [90,90,0]));
    toEuler(quat);

    document.addEventListener("keydown", cameraSwitch);

    render();
}

function cameraSwitch(e) {
    if (e.key === "c") carFollow = !carFollow;
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    drawGround();
    drawRoad();
    // Draw the control points as small cubes
    // drawControlPoints();
    if(birdt >= catmull[0].length - 2) {
        birdt=0;
        birdControlPoint=0;
        birdAlpha=0;
        birdl=0;
    }
    if(cart >= catmull[1].length - 2) {
        cart=0;
        carControlPoint=0;
        carAlpha=0;
        carl=0;
    }
    if(catmull[0].length > 0) {
        drawBird();
    }
    if(catmull[1].length > 0) {
        drawCar();
    }
    drawPiston();
    const dt = 0.01;
    handleCollisionsBetweenParticles();
    for (let p of particles) {
        p.handleWallCollisions();
        p.update(dt);
        p.render();
    }
    requestAnimFrame(render);
}

function drawBird() {
    birdt += 1;
    birdl += 1;
    birdAlpha += 2*Math.PI/birdSegments;
    if (birdl > birdSegments) {
        birdl = 0;
        birdControlPoint += 1;
    }

    // Push main cube
    bindBuffers(birdBuffers);
    let point = catmull[0][birdt];

    // Compute quaternions based on what control points animation is currently between
    let q1 = toQuaternion(splines[currentSpline].points[birdControlPoint]);
    let q2 = toQuaternion(splines[currentSpline].points[birdControlPoint+1]);
    let rotation = quatToMatrix(normalize(slerp(q1, q2, birdl/birdSegments)));

    let modelMatrix = mult(translate(point.x, point.y, point.z), rotation);
    body.matrix = modelMatrix;

    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    setNormalMatrix(modelMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, animatedArray.length);

    for (let c = 0; c < body.children.length; c++) {
        drawWings(body.matrix, body.children[c], Math.sign(body.children[c].offset));
    }
}

function drawCar() {
    cart += 1;
    carl += 1;
    carAlpha += 2*Math.PI/carSegments;
    if (carl > carSegments) {
        carl = 0;
        carControlPoint += 1;
    }

    bindBuffers(carBuffers);
    let point = catmull[1][cart];
    let q1 = toQuaternion(splines[1].points[carControlPoint]);
    let q2 = toQuaternion(splines[1].points[carControlPoint+1]);
    let rotation = quatToMatrix(normalize(slerp(q1, q2, carl/carSegments)));
    carMatrix = mult(translate(point.x, point.y, point.z), rotation);
    body.matrix = carMatrix;

    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(carMatrix));

    if (carFollow) {
        cameraMatrix = lookAt(vec3(mult(carMatrix, vec4(4.0, 2.0, -7.0, 0.0))), vec3(point.x, point.y, point.z), vec3(0.0, 1.0, 0.0));
        let cameraMatrixLoc = gl.getUniformLocation(program, "cameraMatrix");
        gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));
    } else {
        cameraMatrix = lookAt(vec3(0.0, 10.0, 23.0), vec3(0.0, 5.0, 0.0), vec3(0.0, 1.0, 0.0));
        let cameraMatrixLoc = gl.getUniformLocation(program, "cameraMatrix");
        gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));
    }
    setNormalMatrix(carMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, carPoints.length);
}



// Used to apply kinematics recursively, direction used to determine side of body
// for the first part of each wing which is then applied to all children.
function drawWings(parentMatrix, wing, direction = 1) {
    let offset = wing.offset;

    let matrix = rotateZ(Math.sin(birdAlpha) * flapAngle);
    matrix = mult(translate(Math.abs(offset), 0, 0), matrix);
    if (direction === -1) {
        matrix = mult(rotateY(180), matrix);
    }

    bindBuffers(wingBuffers);

    wing.matrix = mult(parentMatrix, matrix);
    gl.pointSize = 8.0;
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(wing.matrix));
    setNormalMatrix(wing.matrix);
    gl.drawArrays(gl.TRIANGLES, 0, wings.length);

    if (wing.child !== null) {
        drawWings(wing.matrix, wing.child);
    }
}

// Draw small cubes at control points
function drawControlPoints() {
    loadVectors(pointsArray, colorsArray);


    for (let i = 0; i < splines.length; i++) {
        splines[i].draw();
    }
}

function drawGround() {
    bindBuffers(groundBuffers);
    let modelMatrix = mat4();
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    setNormalMatrix(modelMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, groundPoints.length)
}

function drawRoad() {
    bindBuffers(roadBuffers);
    let modelMatrix = mat4();
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    setNormalMatrix(modelMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, roadPoints.length);
}

function drawPiston() {
    p += 0.005;
    if (p >= 2*Math.PI) p -= 2*Math.PI;
    let y = (Math.cos(p) * pistonArmLength1) + pistonArmLength2 + pistonStart[1];
    pistonEnd = vec4(pistonStart[0], y, pistonStart[2], 1.0);
    let angles = inverseKinematics(pistonEnd[1] - pistonStart[1], pistonEnd[2] - pistonStart[2]);
    let pistonMid = forwardKinematics(pistonStart[1], pistonStart[2], angles[0], angles[1], pistonArmLength1);
    bindBuffers(pistonArm1Buffers);
    let modelMatrix = mult(translate(pistonStart[0], pistonStart[1], pistonStart[2]), rotateX((angles[0] - Math.PI/2)*180/Math.PI));
    modelMatrix = mult(carMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    setNormalMatrix(modelMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, pistonArm1Points.length);

    bindBuffers(pistonArm2Buffers);
    modelMatrix = mult(translate(pistonMid[0], pistonMid[1], pistonMid[2]), rotateX((angles[1]-Math.PI/2)*180/Math.PI));
    modelMatrix = mult(carMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    setNormalMatrix(modelMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, pistonArm2Points.length);

    bindBuffers(pistonHeadBuffers);
    modelMatrix = translate(pistonEnd[0], pistonEnd[1], pistonEnd[2]);
    modelMatrix = mult(carMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    setNormalMatrix(modelMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, pistonHeadPoints.length);
}

function drawSkybox() {
    loadVectors(skyboxPoints, skyboxColors);
    let modelMatrix = mat4();
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    setNormalMatrix(modelMatrix);
    gl.drawArrays(gl.TRIANGLES, 0, skyboxPoints.length);
}

// Helper function to generate spline points
function generateSplines() {
    catmull = [];
    bSpline = [];
    let spline = splines[0];
    catmull.push(generateCatmullRomCurve(spline.points, birdSegments));
    bSpline.push(generateBSpline(spline.points, birdSegments));
    spline = splines[1];
    catmull.push(generateCatmullRomCurve(spline.points, carSegments));
    bSpline.push(generateBSpline(spline.points, carSegments));
}

function generateCatmullRomCurve(points, segments) {
    let curve = [];
    let M = [vec4(-1/2, 3/2, -3/2, 1/2),
        vec4(1.0, -5/2, 2.0, -1/2),
        vec4(-1/2, 0.0, 1/2, 0.0),
        vec4(0.0, 1.0, 0.0, 0.0)];
    for(let j = 1; j < points.length - 2; j++) {
        let X = [points[j-1].x, points[j].x, points[j+1].x, points[j+2].x];
        let Y = [points[j-1].y, points[j].y, points[j+1].y, points[j+2].y];
        let Z = [points[j-1].z, points[j].z, points[j+1].z, points[j+2].z];
        for (let i = 0; i <= segments; i++) {
            let U = vec4((i / segments)**3, (i / segments)**2, i / segments, 1);

            let x = multiply(X, M, U);
            let y = multiply(Y, M, U);
            let z = multiply(Z, M, U);

            curve.push(new Point([x, y, z], [points[j].xRot, points[j].yRot, points[j].zRot]));
        }
    }
    return curve;
}

function generateBSpline(points, segments) {
    let curve = [];
    let M = [vec4(-1.0, 3.0, -3.0, 1.0),
        vec4(3.0, -6.0, 3.0, 0.0),
        vec4(-3.0, 0.0, 3.0, 0.0),
        vec4(1.0, 4.0, 1.0, 0.0)];
    for(let j = 1; j < points.length - 2; j++) {
        let X = [points[j-1].x, points[j].x, points[j+1].x, points[j+2].x];
        let Y = [points[j-1].y, points[j].y, points[j+1].y, points[j+2].y];
        let Z = [points[j-1].z, points[j].z, points[j+1].z, points[j+2].z];
        for (let i = 0; i <= segments; i++) {
            let U = vec4((i / segments)**3, (i / segments)**2, i / segments, 1);

            let x = multiply(X, M, U)/6;
            let y = multiply(Y, M, U)/6;
            let z = multiply(Z, M, U)/6;

            curve.push(new Point([x, y, z], [points[j].xRot, points[j].yRot, points[j].zRot]));
        }
    }
    return curve;

}

// Multiply matrices for splines
function multiply(P, M, U) {
    let output = 0;
    let T = [0, 0, 0, 0];
    for(let i = 0; i < 4; i++) {
        for(let j = 0; j < 4; j++) {
            T[i] += P[j] * M[i][j];
        }
    }

    for(let i = 0; i < 4; i ++) {
        output += U[i] * T[i];
    }

    return output;
}

// Linear interpolation
function slerp(q1, q2, t) {
    let angle = Math.acos(dot(vec3(q1), vec3(q2)));

    let co1 = Math.sin((1-t)*angle) / Math.sin(angle);
    let co2 = Math.sin(t*angle) / Math.sin(angle);

    return q1.map((value, i) => {
        return value * co1 + q2[i] * co2
    });
}

// Convert euler rotations to quaternion
function toQuaternion(point) {
    let rotX = point.xRot * Math.PI/180.0;
    let rotY = point.yRot * Math.PI/180.0;
    let rotZ = point.zRot * Math.PI/180.0;

    let sinX = Math.sin(rotX/2);
    let sinY = Math.sin(rotY/2);
    let sinZ = Math.sin(rotZ/2);
    let cosX = Math.cos(rotX/2);
    let cosY = Math.cos(rotY/2);
    let cosZ = Math.cos(rotZ/2);

    let x = sinX * cosY * cosZ - cosX * sinY * sinZ;
    let y = cosX * sinY * cosZ + sinX * cosY * sinZ;
    let z = cosX * cosY * sinZ - sinX * sinY * cosZ;
    let w = cosX * cosY * cosZ + sinX * sinY * sinZ;

    return vec4(x, y, z, w);
}

// Convert quaternion to euler rotations (for debugging)
function toEuler(quat) {
    let X = quat[0];
    let Y = quat[1];
    let Z = quat[2];
    let W = quat[3];

    let x = Math.atan2(2 * (W * X + Y * Z), 1 - 2 * (X * X + Y * Y)) * 180/Math.PI;
    let y = (-(Math.PI / 2) + 2 * Math.atan2(Math.sqrt(1 + 2 * (W * Y - X * Z)), Math.sqrt(1 - 2 * (W * Y - X * Z)))) * 180/Math.PI;
    let z = Math.atan2(2 * (W * Z + Y * X), 1 - 2 * (Z * Z + Y * Y)) * 180/Math.PI;

    return vec3(x, y, z);
}

// Converts a quaternion to an equivalent 4x4 matrix representation. Same as MV.js but outputs mat4
function quatToMatrix(q) {
    const [x, y, z, w] = q;
    return mat4(
        vec4(1.0 - 2.0 * (y * y + z * z), 2.0 * (x * y - w * z),     2.0 * (x * z + w * y),     0.0),
        vec4(2.0 * (x * y + w * z),     1.0 - 2.0 * (x * x + z * z), 2.0 * (y * z - w * x),     0.0),
        vec4(2.0 * (x * z - w * y),     2.0 * (y * z + w * x),     1.0 - 2.0 * (x * x + y * y), 0.0),
        vec4(0.0,                       0.0,                       0.0,                       1.0)
    );
}

function loadVectors(points, colors = null, normals = null) {
    let vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );

    if (colors !== null) {
        let cBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    }

    if(normals !== null) {
        let nBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    }
}

function computeNormal(a, b, c) {
    let t1 = subtract(b, a);
    let t2 = subtract(c, a);
    let normal = normalize(cross(t1, t2));
    return vec3(normal);
}

function setNormalMatrix(modelMatrix) {
    let n = normalMatrix(modelMatrix, true);
    gl.uniformMatrix3fv(
        gl.getUniformLocation(program, "normalMatrix"),
        false,
        flatten(n)
    );
}

function createBuffers(points, colors, normals) {
    let buffers = {};

    buffers.vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    buffers.cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    buffers.nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    return buffers;
}

function bindBuffers(buffers) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vBuffer);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.cBuffer);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.nBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
}

function inverseKinematics(Y, Z) {
    let direction = Math.sign(Math.PI-p);
    let slack = .000001
    let d = Math.sqrt(Z * Z + Y * Y);
    d = Math.max(Math.abs(pistonArmLength1-pistonArmLength2) + slack, Math.min(pistonArmLength1+pistonArmLength2 - slack, d));
    let angle = Math.atan2(Y, Z);
    let angle1 = -direction*Math.acos((pistonArmLength1*pistonArmLength1+d*d-pistonArmLength2*pistonArmLength2)/(2*pistonArmLength1*d)) + angle;
    let angle2 = Math.PI - direction*Math.acos((pistonArmLength1*pistonArmLength1+pistonArmLength2*pistonArmLength2-d*d)/(2*pistonArmLength1*pistonArmLength2));
    return [angle1, angle1 + angle2];
}


function forwardKinematics(originy, originz, angle1, angle2, L1) {
    return vec4(pistonStart[0], Math.sin(angle1)*L1 + originy, -Math.cos(angle1)*L1 + originz, 0.0);
}

function handleCollisionsBetweenParticles() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i+1; j < particles.length; j++) {
            let vec = subtract(particles[j].position, particles[i].position);
            let mag = Math.sqrt(Math.pow(vec[0], 2) + Math.pow(vec[1], 2) + Math.pow(vec[2], 2));
            if (mag <= particleRadius*2) {
                let newvec = normalize(vec);
                particles[i].position[0] = particles[j].position[0] - newvec[0]*particleRadius*2;
                particles[i].position[1] = particles[j].position[1] - newvec[1]*particleRadius*2;
                particles[i].position[2] = particles[j].position[2] - newvec[2]*particleRadius*2;
                particles[i].handleParticleCollisions(particles[j]);
            }
        }
    }
}