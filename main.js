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
const roadElevation = 0.1;

let carPoints= [];
let carColors = [];
const bodyColor = vec4(1.0, 0.0, 0.0, 1.0);
const windowColor = vec4(0.5, 1.0, 1.0, 1.0);
const tireColor = vec4(0.1, 0.1, 0.1, 1.0);

let cameraMatrix;
let projMatrix;

let splines = [];
let catmull = [];
let bSpline = [];

let vPosition;
let vColor;
let modelMatrixLoc;

const segments = 125;
let t = 0;
let birdl = 0;
let birdAlpha = 0;
let currentType = 0; // 0 = Catmull, 1 = BSpline
let birdControlPoint = 0;
let currentSpline = 0;
const numParts = 3;
const flapAngle = 10;

let carl = 0;
let carAlpha = 0;
let carControlPoint = 0;


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

            gl.drawArrays(gl.TRIANGLES, 0, pointsArray.length);
        }
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
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
    vec4( 1.0, 1.0, 1.0, 1.0 )   // white
];

function quad(a, b, c, d) {
    pointsArray.push(pointCube[a]);
    animatedArray.push(animatedCube[a]);
    colorsArray.push(vertexColors[a]);

    pointsArray.push(pointCube[b]);
    animatedArray.push(animatedCube[b]);
    colorsArray.push(vertexColors[a]);

    pointsArray.push(pointCube[c]);
    animatedArray.push(animatedCube[c]);
    colorsArray.push(vertexColors[a]);

    pointsArray.push(pointCube[a]);
    animatedArray.push(animatedCube[a]);
    colorsArray.push(vertexColors[a]);

    pointsArray.push(pointCube[c]);
    animatedArray.push(animatedCube[c]);
    colorsArray.push(vertexColors[a]);

    pointsArray.push(pointCube[d]);
    animatedArray.push(animatedCube[d]);
    colorsArray.push(vertexColors[a]);
}

function wing(a, b, c, d) {
    wings.push(wingPoints[a]);
    wings.push(wingPoints[b]);
    wings.push(wingPoints[c]);
    wings.push(wingPoints[a]);
    wings.push(wingPoints[c]);
    wings.push(wingPoints[d]);
}

function createGround() {
    groundPoints.push(vec4(groundRadius, 0.0, -groundRadius, 1.0));
    groundPoints.push(vec4(-groundRadius, 0.0, -groundRadius, 1.0));
    groundPoints.push(vec4(-groundRadius, 0.0, groundRadius, 1.0));
    groundPoints.push(vec4(groundRadius, 0.0, -groundRadius, 1.0));
    groundPoints.push(vec4(-groundRadius, 0.0, groundRadius, 1.0));
    groundPoints.push(vec4(groundRadius, 0.0, groundRadius, 1.0));
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
    }
}

function createCar() {
    const carKeyPoints = [
        vec4(2.0, 1.0, -1.0, 1.0),
        vec4(-2.0, 1.0, -1.0, 1.0),
        vec4(-2.0, 1.0, 1.0, 1.0),
        vec4(2.0, 1.0, 1.0, 1.0)
    ];

    genericQuad(0, 1, 2, 3, carKeyPoints, bodyColor, carPoints, carColors);
}

function genericQuad(a, b, c, d, keyPoints, color, pointArray, colorArray) {
    pointArray.push(keyPoints[a]);
    colorArray.push(color);

    pointArray.push(keyPoints[b]);
    colorArray.push(color);

    pointArray.push(keyPoints[c]);
    colorArray.push(color);

    pointArray.push(keyPoints[c]);
    colorArray.push(color);

    pointArray.push(keyPoints[d]);
    colorArray.push(color);

    pointArray.push(keyPoints[a]);
    colorArray.push(color);
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
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
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

    let birdSpline = new Spline([new Point([-7.5, 10, 0], [0, -45, 0]),
        new Point([-5, 10, -5], [0, -90, 0]),
        new Point([0, 10, -7.5], [0, -135, 0]),
        new Point([5, 10, -5], [0, -180, 0]),
        new Point([7.5, 10, 0], [0, -225, 0]),
        new Point([5, 10, 5], [0, -270, 0]),
        new Point([0, 10, 7.5], [0, -315, 0]),
        new Point([-5, 10, 5], [0, -360, 0]),
        new Point([-7.5, 10, 0], [0, -405, 0]),
        new Point([-5, 10, -5], [0, -450, 0]),
        new Point([0, 10, -7.5], [0, -495, 0])]);

    let carSpline = new Spline([new Point([-7.5, 0, 0], [0, -45, 0]),
        new Point([-5, 0, -5], [0, -90, 0]),
        new Point([0, 0, -7.5], [0, -135, 0]),
        new Point([5, 0, -5], [0, -180, 0]),
        new Point([7.5, 0, 0], [0, -225, 0]),
        new Point([5, 0, 5], [0, -270, 0]),
        new Point([0, 0, 7.5], [0, -315, 0]),
        new Point([-5, 0, 5], [0, -360, 0]),
        new Point([-7.5, 0, 0], [0, -405, 0]),
        new Point([-5, 0, -5], [0, -450, 0]),
        new Point([0, 0, -7.5], [0, -495, 0])]);

    splines.push(birdSpline);
    splines.push(carSpline);
    t = 0;
    currentType = 0;
    currentSpline = 0;
    birdl = 0;
    birdControlPoint = 0;
    carl = 0;
    carControlPoint = 0;
    generateSplines();

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.enableVertexAttribArray( vPosition );
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");

    vColor = gl.getAttribLocation( program, "vColor" );
    gl.enableVertexAttribArray( vColor );

    projMatrix = perspective(65, 1, 0.1, 100);
    let projMatrixLoc = gl.getUniformLocation(program, "projMatrix");
    gl.uniformMatrix4fv(projMatrixLoc, false, flatten(projMatrix));

    cameraMatrix = lookAt(vec3(0.0, 10.0, 23.0), vec3(0.0, 5.0, 0.0), vec3(0.0, 1.0, 0.0));
    let cameraMatrixLoc = gl.getUniformLocation(program, "cameraMatrix");
    gl.uniformMatrix4fv(cameraMatrixLoc, false, flatten(cameraMatrix));

    let quat = toQuaternion(new Point([0,0,0], [90,90,0]));
    toEuler(quat);

    render();
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    drawGround();
    drawRoad();
    // Draw the control points as small cubes
    // drawControlPoints();
    if(t >= catmull[0].length - 2) {
        t=0;
        birdControlPoint=0;
        birdAlpha=0;
        birdl=0;
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
    requestAnimFrame(render);
}

function drawBird() {
    t += 1;
    birdl += 1;
    birdAlpha += 2*Math.PI/segments;
    if (birdl > segments) {
        birdl = 0;
        birdControlPoint += 1;
    }

    // Push main cube
    loadVectors(animatedArray, colorsArray);
    let point = catmull[0][t];

    // Compute quaternions based on what control points animation is currently between
    let q1 = toQuaternion(splines[currentSpline].points[birdControlPoint]);
    let q2 = toQuaternion(splines[currentSpline].points[birdControlPoint+1]);
    let rotation = quatToMatrix(normalize(slerp(q1, q2, birdl/segments)));

    let modelMatrix = mult(translate(point.x, point.y, point.z), rotation);
    body.matrix = modelMatrix;

    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, animatedArray.length);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(wings), gl.STATIC_DRAW);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

    for (let c = 0; c < body.children.length; c++) {
        drawWings(body.matrix, body.children[c], Math.sign(body.children[c].offset));
    }
}

function drawCar() {
    carl += 1;
    carAlpha += 2*Math.PI/segments;
    if (carl > segments) {
        carl = 0;
        carControlPoint += 1;
    }

    loadVectors(carPoints, carColors);
    let point = catmull[1][t];
    let q1 = toQuaternion(splines[currentSpline].points[carControlPoint]);
    let q2 = toQuaternion(splines[currentSpline].points[carControlPoint+1]);
    let rotation = quatToMatrix(normalize(slerp(q1, q2, carl/segments)));
    let modelMatrix = mult(translate(point.x, point.y, point.z), rotation);
    body.matrix = modelMatrix;

    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, animatedArray.length);
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

    wing.matrix = mult(parentMatrix, matrix);
    gl.pointSize = 8.0;
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(wing.matrix));
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
    loadVectors(groundPoints, groundColors);
    let modelMatrix = mat4();
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, groundPoints.length)
}

function drawRoad() {
    loadVectors(roadPoints, roadColors);
    let modelMatrix = mat4();
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, roadPoints.length);
}

// Helper function to generate spline points
function generateSplines() {
    catmull = [];
    bSpline = [];
    for (let i = 0; i < splines.length; i++) {
        let spline = splines[i];
        catmull.push(generateCatmullRomCurve(spline.points));
        bSpline.push(generateBSpline(spline.points));
    }

}

function generateCatmullRomCurve(points) {
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

function generateBSpline(points) {
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

function loadVectors(points, colors = null) {
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
}