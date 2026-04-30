let gl, program, fileupload;
let startTime = performance.now();
let points = [];
let colors = [];
let weights = [];
let spline;
let pathIndex = 0.0;
let path, path2;
let path2Index = 0.0;

let vertices;
let weightV

let controlPointBuffer;
let numControlPoints = 0;

let totalTime = 1;
let path2start = false;
let angle = 0.0;

function main()
{
	// Retrieve <canvas> element
	let canvas = document.getElementById('webgl');

	// Get the rendering context for WebGL
	gl = WebGLUtils.setupWebGL(canvas, null);
	if (!gl)
	{
		console.log('Failed to get the rendering context for WebGL');
		return;
	}

	// Initialize shaders
	program = initShaders(gl, "vshader", "fshader");
	gl.useProgram(program);
	fileupload = document.getElementById('fileupload');
	//Set up the viewport
	gl.viewport( 0, 0, canvas.width, canvas.height );
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	spline = new Spline();
	gl.enable(gl.DEPTH_TEST);

	fileupload.addEventListener('change', spline.handleFileSelection.bind(spline));

	vertices = [
		vec4( -1.5, -1.5,  1.5, 1.0 ),
		vec4( -1.5,  1.5,  1.5, 1.0 ),
		vec4(  1.5,  1.5,  1.5, 1.0 ),
		vec4(  1.5, -1.5,  1.5, 1.0 ),
		vec4( -1.5, -1.5, -1.5, 1.0 ),
		vec4( -1.5,  1.5, -1.5, 1.0 ),
		vec4(  1.5,  1.5, -1.5, 1.0 ),
		vec4(  1.5, -1.5, -1.5, 1.0 )
	];
	cube();
	//1 left
	vertices = [
		vec4( 1.5, -1.5,  1.5, 1.0 ),
		vec4( 1.5,  1.5,  1.5, 1.0 ),
		vec4(  4.5,  1.5,  1.5, 1.0 ),
		vec4(  4.5, -1.5,  1.5, 1.0 ),
		vec4( 1.5, -1.5, -1.5, 1.0 ),
		vec4( 1.5,  1.5, -1.5, 1.0 ),
		vec4(  4.5,  1.5, -1.5, 1.0 ),
		vec4(  4.5, -1.5, -1.5, 1.0 )
	];
	cube();
	//2 left
	vertices = [
		vec4( 4.5, -1.5,  1.5, 1.0 ),
		vec4( 4.5,  1.5,  1.5, 1.0 ),
		vec4(  7.5,  1.5,  1.5, 1.0 ),
		vec4(  7.5, -1.5,  1.5, 1.0 ),
		vec4( 4.5, -1.5, -1.5, 1.0 ),
		vec4( 4.5,  1.5, -1.5, 1.0 ),
		vec4(  7.5,  1.5, -1.5, 1.0 ),
		vec4(  7.5, -1.5, -1.5, 1.0 )
	];
	cube();
    //3 left
	vertices = [
		vec4( 7.5, -1.5,  1.5, 1.0 ),
		vec4( 7.5,  1.5,  1.5, 1.0 ),
		vec4(  10.5,  1.5,  1.5, 1.0 ),
		vec4(  10.5, -1.5,  1.5, 1.0 ),
		vec4( 7.5, -1.5, -1.5, 1.0 ),
		vec4( 7.5,  1.5, -1.5, 1.0 ),
		vec4(  10.5,  1.5, -1.5, 1.0 ),
		vec4(  10.5, -1.5, -1.5, 1.0 )
	];
	cube();
	//1 right
	vertices = [
		vec4( -4.5, -1.5,  1.5, 1.0 ),
		vec4( -4.5,  1.5,  1.5, 1.0 ),
		vec4(  -1.5,  1.5,  1.5, 1.0 ),
		vec4(  -1.5, -1.5,  1.5, 1.0 ),
		vec4( -4.5, -1.5, -1.5, 1.0 ),
		vec4( -4.5,  1.5, -1.5, 1.0 ),
		vec4(  -1.5,  1.5, -1.5, 1.0 ),
		vec4(  -1.5, -1.5, -1.5, 1.0 )
	];
	cube();
	//2 right
	vertices = [
		vec4( -7.5, -1.5,  1.5, 1.0 ),
		vec4( -7.5,  1.5,  1.5, 1.0 ),
		vec4(  -4.5,  1.5,  1.5, 1.0 ),
		vec4(  -4.5, -1.5,  1.5, 1.0 ),
		vec4( -7.5, -1.5, -1.5, 1.0 ),
		vec4( -7.5,  1.5, -1.5, 1.0 ),
		vec4(  -4.5,  1.5, -1.5, 1.0 ),
		vec4(  -4.5, -1.5, -1.5, 1.0 )
	];
	cube();
	//3 right
	vertices = [
		vec4( -10.5, -1.5,  1.5, 1.0 ),
		vec4( -10.5,  1.5,  1.5, 1.0 ),
		vec4(  -7.5,  1.5,  1.5, 1.0 ),
		vec4(  -7.5, -1.5,  1.5, 1.0 ),
		vec4( -10.5, -1.5, -1.5, 1.0 ),
		vec4( -10.5,  1.5, -1.5, 1.0 ),
		vec4(  -7.5,  1.5, -1.5, 1.0 ),
		vec4(  -7.5, -1.5, -1.5, 1.0 )
	];
	cube();

	pushData(points, "vPosition");
	pushData(colors, "vColor");
	pushWeights(weights);
	setBoneMatrices(-30);

	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.DEPTH_TEST);
	gl.pointSize = 8.0;
}

function cube() {
	quad( 1, 0, 3, 2 );
	quad( 2, 3, 7, 6 );
	quad( 3, 0, 4, 7 );
	quad( 6, 5, 1, 2 );
	quad( 4, 5, 6, 7 );
	quad( 5, 4, 0, 1 );
}

//I could not find a way to pass a 5 object array into the shader, so I use this as a workaround
//I push the first 4 weights as a vec4 and the last one separately as a float
function pushWeights(weights) {
	let w4 = [];
	let w5 = [];

	for (let w of weights) {
		w4.push(w[0], w[1], w[2], w[3]);
		w5.push(w[4]);
	}

	pushDataRaw(w4, "weights", 4);
	pushDataRaw(w5, "weight5", 1);
}

function pushDataRaw(data, name, size) {
	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

	let attrib = gl.getAttribLocation(program, name);
	gl.vertexAttribPointer(attrib, size, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attrib);
}

//Use the position of the point to calculate bone weights
function computeWeights(x) {
	let bones = [-12, -6, 0, 6, 12]; // bone positions
	let w = [];

	for (let i = 0; i < bones.length; i++) {
		let d = Math.abs(x - bones[i]);
		let weight = Math.max(0, 1 - d / 6);
		w.push(weight);
	}

	normalize(w);

	return w;
}

//We use this function to set the matrices used for the waits using a hierarchical model
function setBoneMatrices(angle) {
	let boneMatrix2 = rotateZ(0);
	let boneMatrix1 = mult(mult(translate(-6.0, 0.0, 0.0), mult(rotateZ(angle), translate(6.0, 0.0, 0.0))), boneMatrix2);
	let boneMatrix0 = mult(mult(translate(-12.0, 0.0, 0.0), mult(rotateZ(angle), translate(12.0, 0.0, 0.0))), boneMatrix1);
	let boneMatrix3 = mult(mult(translate(6.0, 0.0, 0.0), mult(rotateZ(-angle), translate(-6.0, 0.0, 0.0))), boneMatrix2);
	let boneMatrix4 = mult(mult(translate(12.0, 0.0, 0.0), mult(rotateZ(-angle), translate(-12.0, 0.0, 0.0))), boneMatrix3);

	setUniformMatrix("boneMatrix0", boneMatrix0);
	setUniformMatrix("boneMatrix1", boneMatrix1);
	setUniformMatrix("boneMatrix2", boneMatrix2);
	setUniformMatrix("boneMatrix3", boneMatrix3);
	setUniformMatrix("boneMatrix4", boneMatrix4);
}

//SLERp function
//Takes 2 angles and a time from 0 to 1 and outputs a quaternion.
function slerp(q1, q2, t) {
	q1 = angletoQuat(q1[0], q1[1], q1[2]);
	q2 = angletoQuat(q2[0], q2[1], q2[2]);
	let dotProd = dot(q1, q2);

	dotProd = Math.max(-1.0, Math.min(1.0, dotProd));

	let angle = Math.acos(dotProd);

	if (Math.abs(angle) < 1e-8) {
		return q1;
	}

	let p1 = Math.sin((1 - t) * angle) / Math.sin(angle);
	let p2 = Math.sin(t * angle) / Math.sin(angle);

	let b1 = q1.map(x => x * p1);
	let b2 = q2.map(x => x * p2);
	return add(b1, b2);
}

function angletoQuat(x, y, z) {
	x = x * Math.PI / 180;
	y = y * Math.PI / 180;
	z = z * Math.PI / 180;
	return normalize(vec4(Math.sin(x/2)*Math.cos(y/2),Math.cos(z/2)-Math.cos(x/2)*Math.sin(y/2),Math.sin(z/2),
		Math.cos(x/2)*Math.sin(y/2),Math.cos(z/2)+Math.sin(x/2)*Math.cos(y/2),Math.sin(z/2),
		Math.cos(x/2)*Math.cos(y/2),Math.sin(z/2)-Math.sin(x/2)*Math.sin(y/2),Math.cos(z/2),
		Math.cos(x/2)*Math.cos(y/2),Math.cos(z/2)+Math.sin(x/2)*Math.sin(y/2),Math.sin(z/2)));
}


function render() {
	gl.clear( gl.COLOR_BUFFER_BIT);

	var cameraMatrix = lookAt(vec3(0.0, 5, 10.0), vec3(0, 0, 0), vec3(0.0, 1.0, 0.0));
	var cameraLoc = gl.getUniformLocation(program, 'cameraMatrix');
	gl.uniformMatrix4fv(cameraLoc, false, flatten(cameraMatrix));

	let elapsed = (performance.now() - startTime) / 1000;

	let tGlobal = (elapsed % totalTime) / totalTime;

	let qt = tGlobal * (spline.controlPointCount[0] - 1);

	let i = Math.floor(qt);
	let t = qt - i;
	let q1 = spline.controlAngles[i];
	let q2 = spline.controlAngles[(i + 1) % spline.controlPointCount[0]];
	const [x, y, z, w] = slerp(q1, q2, t);
	//converts the quaternion to a mat4 (for some reason the quatToMatrix function in MV.js does not convert to a mat4,
	//so it did not work here, since I need a mat4 to combine with the translation matrix later)
	let rotationMatrix = mat4([
		1 - 2 * (y * y + z * z), 2 * (x * y - w * z),     2 * (x * z + w * y),     0,
		2 * (x * y + w * z),     1 - 2 * (x * x + z * z), 2 * (y * z - w * x),     0,
		2 * (x * z - w * y),     2 * (y * z + w * x),     1 - 2 * (x * x + y * y), 0,
		0,                       0,                       0,                       1
	]);
	if (path.length > 0 && elapsed <= totalTime && !path2start) {
		let numPoints = path.length / 3;
		let i = tGlobal * (numPoints - 1);

		let i0 = Math.floor(i);
		let i1 = (i0 + 1) % numPoints;

		let t = i - i0;

		let x0 = path[i0 * 3];
		let y0 = path[i0 * 3 + 1];
		let z0 = path[i0 * 3 + 2];

		let x1 = path[i1 * 3];
		let y1 = path[i1 * 3 + 1];
		let z1 = path[i1 * 3 + 2];

		let x = x0 + (x1 - x0) * t;
		let y = y0 + (y1 - y0) * t;
		let z = z0 + (z1 - z0) * t;

		let modelMatrix = mult(translate(x, y, z), rotationMatrix);

		let ctMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
		gl.uniformMatrix4fv(ctMatrixLoc, false, flatten(modelMatrix));
		if (pathIndex >= numPoints - 1) {
			pathIndex = numPoints - 1;
		}
	}
	let amplitude = 30;
	let speed = spline.controlPointCount[0]/2;

	angle = amplitude * Math.sin(speed * elapsed);
	setBoneMatrices(angle);
	console.log(angle);

	let viewMatrix = gl.getUniformLocation(program, "viewMatrix");
	gl.uniformMatrix4fv(viewMatrix, false, flatten(perspective(110, 1, 0.1, 100)));

	gl.uniform1i(gl.getUniformLocation(program, "cube"), true);
	pushData(points, "vPosition");
	pushData(colors, "vColor");
	gl.drawArrays(gl.TRIANGLES, 0, points.length);

	gl.uniform1i(gl.getUniformLocation(program, "cube"), false);
	if (controlPointBuffer) {
		gl.bindBuffer(gl.ARRAY_BUFFER, controlPointBuffer);

		let vPosition = gl.getAttribLocation(program, "vPosition");
		gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(vPosition);

		let vColor = gl.getAttribLocation(program, "vColor");
		gl.disableVertexAttribArray(vColor);
		gl.vertexAttrib4f(vColor, 1.0, 1.0, 1.0, 1.0);

		gl.drawArrays(gl.POINTS, 0, numControlPoints);
	}

	requestAnimationFrame(render);
}

//makes a cube face
function quad(a, b, c, d)
{
	let vertexColors = [
		[ 0.0, 0.0, 0.0, 1.0 ],  // black
		[ 1.0, 0.0, 0.0, 1.0 ],  // red
		[ 1.0, 1.0, 0.0, 1.0 ],  // yellow
		[ 0.0, 1.0, 0.0, 1.0 ],  // green
		[ 0.0, 0.0, 1.0, 1.0 ],  // blue
		[ 1.0, 0.0, 1.0, 1.0 ],  // magenta
		[ 0.0, 1.0, 1.0, 1.0 ],  // cyan
		[ 1.0, 1.0, 1.0, 1.0 ]   // white
	];

	let indices = [ a, b, c, a, c, d ];

	for ( let i = 0; i < indices.length; ++i ) {
		points.push( vertices[indices[i]] );
		let vx = vertices[indices[i]][0];
		weights.push(computeWeights(vx));

		colors.push(vertexColors[a]);

	}
}

function pushData(data, attName) {

	let buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

	let attrib = gl.getAttribLocation(program, attName);
	gl.vertexAttribPointer(attrib, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(attrib);
}

function generateCatmullRomCurve(points, segments = 20) {
	let curve = [];
	let M = [
		vec4(-0.5, 1.0, -0.5, 0.0),
		vec4(1.5, -2.5, 0.0, 1.0),
		vec4(-1.5, 2.0, 0.5, 0.0),
		vec4(0.5, -0.5, 0.0, 0.0)];
	for (let i = 3; i < points.length; i++) {
		let P = [points[i - 3], points[i - 2], points[i - 1], points[i]];
		let B = multMP(M, P);
		for (let j = 0; j <= segments; j++) {
			let T = j/segments;
			let U = vec4(T**3, T**2, T, 1.0);
			let point = multU(U, B);
			curve.push(point[0], point[1], point[2]);
		}
	}
	return curve;
}

function generateBSpline(points, segments = 20) {
	let curve = [];
	let M = [
		vec4(-1.0, 3.0, -3.0, 1.0),
		vec4(3.0, -6.0, 0.0, 4.0),
		vec4(-3.0, 3.0, 3.0, 1.0),
		vec4(1.0, 0.0, 0.0, 0.0)];
	for (let i = 3; i < points.length; i++) {
		let P = [points[i - 3], points[i - 2], points[i - 1], points[i]];
		let B = multMP(M, P);
		for (let j = 0; j < segments; j++) {
			let T = j/segments;
			let U = vec4(T**3, T**2, T, 1.0);
			let point = multU(U, B);
			curve.push(point[0] / 6, point[1] / 6, point[2] / 6);
		}
	}
	return curve;
}

//these are helper functions as the mult in MV.js does not work here
function multMP(M, P) {
	let result = vec4([0.0, 0.0], [0.0, 0.0], [0.0, 0.0], [0.0, 0.0]);
	for (let i = 0; i < P.length; i++) {
		let x = 0;
		let y = 0;
		let z = 0;
		for (let j = 0; j < P.length; j++) {
			x = x + P[j][0] * M[j][i];
			y = y + P[j][1] * M[j][i];
			z = z + P[j][2] * M[j][i];
		}
		result[i] = [x, y, z];
	}
	return result;
}

function multU(U, P) {
	let x = U[0]*P[0][0] + U[1]*P[1][0] + U[2]*P[2][0] + U[3]*P[3][0];
	let y = U[0]*P[0][1] + U[1]*P[1][1] + U[2]*P[2][1] + U[3]*P[3][1];
	let z = U[0]*P[0][2] + U[1]*P[1][2] + U[2]*P[2][2] + U[3]*P[3][2];
	return [x, y, z];
}

function setUniformMatrix(name, data) {
	let matrixLoc = gl.getUniformLocation(program, name);
	gl.uniformMatrix4fv(matrixLoc, false, flatten(data));
}


class Spline {

	splineCount;
	controlPointCount = [];
	time = [];
	controlPoints = [];
	controlAngles = [];

	constructor() {

	}


	handleFileSelection(event) {

		let file = event.target.files[0];

		let reader = new FileReader();
		reader.readAsText(file);

		reader.onload = () => {
			gl.clear(gl.COLOR_BUFFER_BIT);
			let lines = reader.result.split('\n');
			for (let i = lines.length - 1; i >= 0; i--) {
				if (lines[i][0] === '#' || !lines[i]) {
					lines.splice(i, 1);
				}
			}
			this.splineCount = parseFloat(lines[0]);
			this.controlPointCount = [];
			this.time = [];
			this.controlPoints = [];
			this.controlAngles = [];
			lines.splice(0, 1);
			let count = 0;
			for (let i = 0; i < lines.length; i++) {
				if (count === 0) {
					this.controlPointCount.push(parseInt(lines[i]));
					this.time.push(parseInt(lines[i+1]));
					count = parseInt(lines[i]) * 2;
					i++;
				} else if (count % 2 === 0) {
					let controlPoint = lines[i].split(',');
					for(let j = 0; j < controlPoint.length; j++) {
						controlPoint[j] = parseFloat(controlPoint[j]);
					}
					this.controlPoints.push(controlPoint);
					count--;
				} else {
					let controlPoint = lines[i].split(',');
					for(let j = 0; j < controlPoint.length; j++) {
						controlPoint[j] = parseFloat(controlPoint[j]);
					}
					this.controlAngles.push(controlPoint);
					count--;
				}
			}
			path = generateCatmullRomCurve(this.controlPoints);
			path2 = generateBSpline(this.controlPoints);
			totalTime = this.time[0];
			startTime = performance.now();
			pathIndex = 0;
			path2Index = 0;
			let flatPoints = [];
			for (let p of this.controlPoints) {
				flatPoints.push(p[0], p[1], p[2], 1.0);
			}

			numControlPoints = this.controlPoints.length;

			controlPointBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, controlPointBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, flatten(flatPoints), gl.STATIC_DRAW);
			render();
		}
	}
}