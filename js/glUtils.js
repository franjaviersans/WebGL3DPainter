//Unitary quad
Quad = function(gl) {
    this.BufferVertex = gl.createBuffer();
    this.BufferIndex = gl.createBuffer();
    var vertexData = [
                0.0, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0,// (x, y), (nx, ny, nz), (s, t)...
                1.0, 0.0, 0.0, 0.0, 0.1, 1.0, 0.0,
                1.0, 1.0, 0.0, 0.0, 0.1, 1.0, 1.0,
                0.0, 1.0, 0.0, 0.0, 0.1, 0.0, 1.0
                ];
    var indexes = [0,1,2,0,2,3];
	this.numTriangles = indexes.length;


    this.BufferVertex.numItems = vertexData.length;
    this.BufferVertex.itemSize = 4;

    this.BufferIndex.numItems = indexes.length;
    this.BufferIndex.itemSize = 1;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.BufferVertex);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.BufferIndex);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), gl.STATIC_DRAW);


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

Quad.prototype.draw = function(gl, vertexLocation, normalLocation, textureLocation){

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.BufferIndex);

    //Set attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, this.BufferVertex);  
    if(vertexLocation != -1) gl.vertexAttribPointer(vertexLocation, 2, gl.FLOAT, false, 28, 0);
    if(normalLocation != -1) gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 28, 8);
    if(textureLocation != -1) gl.vertexAttribPointer(textureLocation, 2, gl.FLOAT, false, 28, 20);

    //Draw quad
    gl.drawElements(gl.TRIANGLES, this.numTriangles, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}





Vector3D = function(x,y,z) {
	this.x = x;
	this.y = y;
	this.z = z;
};

Vector3D.sub = function(a,b){
    var c = new Vector3D();
    c.x = a.x - b.x;
    c.y = a.y - b.y;
    c.z = a.z - b.z;

    return c;
};

Vector3D.add = function(a,b){
    var c = new Vector3D();
    c.x = a.x + b.x;
    c.y = a.y + b.y;
    c.z = a.z + b.z;

    return c;
};

Vector3D.cross =  function(a,b){
    var c = new Vector3D();
    c.x = a.y * b.z - a.z * b.y;
    c.y = a.z * b.x - a.x * b.z;
    c.z = a.x * b.y - a.y * b.x;

    return c;
};

Vector3D.dot = function(a,b){
    var c;
    c = (a.x * b.x + a.y * b.y + a.z * b.z);

    return c;
};

Vector3D.mult = function(a,b){
    var c = new Vector3D();
    c.x = a.x * b;
    c.y = a.y * b;
    c.z = a.z * b;

    return c;
};

Vector3D.length = function(a){
    return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
};

Vector3D.normalize = function(a){
    var l =Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    var c = new Vector3D(a.x/l , a.y/l, a.z/l);
    return c;
};




Vector2D = function(x,y) {
    this.x = x;
    this.y = y;
};





Ray_Triangle = function(    V0, V1, V2,  // Triangle vertices
                            O,  //Ray origin
                            D  //Ray direction
                            ){

    var e1, e2;  //Edge1, Edge2
    var P, Q, T;
    var det, inv_det;
    var u, v, t;
    var EPSILON = 0.0001;

    //Find vectors for two edges sharing V1
    e1 = Vector3D.sub(V1, V0);
    e2 = Vector3D.sub(V2, V0);
    //Begin calculating determinant - also used to calculate u parameter
    P = Vector3D.cross(D, e2);
    //if determinant is near zero, ray lies in plane of triangle
    det = Vector3D.dot(e1, P);
    //NOT CULLING
    if(det > -EPSILON && det < EPSILON) return null;
    inv_det = 1.0 / det;

    //calculate distance from V1 to ray origin
    T  = Vector3D.sub(O, V0);
 
    //Calculate u parameter and test bound
    u = Vector3D.dot(T, P) * inv_det;
    //The intersection lies outside of the triangle
    if(u < 0.0 - EPSILON || u > 1.0 + EPSILON) return null;
 
    //Prepare to test v parameter
    Q = Vector3D.cross(T, e1);
 
    //Calculate V parameter and test bound
    v = Vector3D.dot(D, Q) * inv_det;
    //The intersection lies outside of the triangle
    if(v < 0.0 - EPSILON  || u + v  > 1.0 + EPSILON) return null;
 
    t = Vector3D.dot(e2, Q) * inv_det;

    return {u: u, v: v, t: t}; //ray intersection
}





















//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>QUATERNION

/**
 * @author mikael emtinger / http://gomo.se/
 * @author alteredq / http://alteredqualia.com/
 */

Quaternion = function( x, y, z, w ) {

    this.set(

        x || 0,
        y || 0,
        z || 0,
        w !== undefined ? w : 1

    );

};

Quaternion.prototype = {

    constructor: Quaternion,

    set: function ( x, y, z, w ) {

        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;

        return this;

    },

    copy: function ( q ) {

        this.x = q.x;
        this.y = q.y;
        this.z = q.z;
        this.w = q.w;

        return this;

    },

    setFromEuler: function ( vec3 ) {

        var c = Math.PI / 360, // 0.5 * Math.PI / 360, // 0.5 is an optimization
        x = vec3.x * c,
        y = vec3.y * c,
        z = vec3.z * c,

        c1 = Math.cos( y  ),
        s1 = Math.sin( y  ),
        c2 = Math.cos( -z ),
        s2 = Math.sin( -z ),
        c3 = Math.cos( x  ),
        s3 = Math.sin( x  ),

        c1c2 = c1 * c2,
        s1s2 = s1 * s2;

        this.w = c1c2 * c3  - s1s2 * s3;
        this.x = c1c2 * s3  + s1s2 * c3;
        this.y = s1 * c2 * c3 + c1 * s2 * s3;
        this.z = c1 * s2 * c3 - s1 * c2 * s3;

        return this;

    },

    setFromAxisAngle: function ( axis, angle ) {
        var halfAngle = angle / 2,
            s = Math.sin( halfAngle );

		var length = Math.sqrt(axis.x * axis.x + axis.y * axis.y + axis.z * axis.z);
			
        this.x = axis.x/length * s;
        this.y = axis.y/length * s;
        this.z = axis.z/length * s;
        this.w = Math.cos( halfAngle );

        return this;

    },

    setFromRotationMatrix: function ( m ) {
        function copySign(a, b) {
            return b < 0 ? -Math.abs(a) : Math.abs(a);
        }
        var absQ = Math.pow(m.determinant(), 1.0 / 3.0);
        this.w = Math.sqrt( Math.max( 0, absQ + m.n11 + m.n22 + m.n33 ) ) / 2;
        this.x = Math.sqrt( Math.max( 0, absQ + m.n11 - m.n22 - m.n33 ) ) / 2;
        this.y = Math.sqrt( Math.max( 0, absQ - m.n11 + m.n22 - m.n33 ) ) / 2;
        this.z = Math.sqrt( Math.max( 0, absQ - m.n11 - m.n22 + m.n33 ) ) / 2;
        this.x = copySign( this.x, ( m.n32 - m.n23 ) );
        this.y = copySign( this.y, ( m.n13 - m.n31 ) );
        this.z = copySign( this.z, ( m.n21 - m.n12 ) );
        this.normalize();
        return this;
    },

    calculateW : function () {

        this.w = - Math.sqrt( Math.abs( 1.0 - this.x * this.x - this.y * this.y - this.z * this.z ) );

        return this;

    },

    inverse: function () {

        this.x *= -1;
        this.y *= -1;
        this.z *= -1;

        return this;

    },

    length: function () {

        return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

    },

    normalize: function () {

        var l = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

        if ( l === 0 ) {

            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 0;

        } else {

            l = 1 / l;

            this.x = this.x * l;
            this.y = this.y * l;
            this.z = this.z * l;
            this.w = this.w * l;

        }

        return this;

    },

    multiplySelf: function ( quat2 ) {

        var qax = this.x,  qay = this.y,  qaz = this.z,  qaw = this.w,
        qbx = quat2.x, qby = quat2.y, qbz = quat2.z, qbw = quat2.w;

        this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

        return this;

    },

    multiply: function ( q1, q2 ) {
        this.x =  q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x;
        this.y = -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y;
        this.z =  q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z;
        this.w = -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w;

        return this;

    },

    multiplyVector3: function ( vec, dest ) {

        if( !dest ) { dest = vec; }

        var x    = vec.x,  y  = vec.y,  z  = vec.z,
            qx   = this.x, qy = this.y, qz = this.z, qw = this.w;

        // calculate quat * vec

        var ix =  qw * x + qy * z - qz * y,
            iy =  qw * y + qz * x - qx * z,
            iz =  qw * z + qx * y - qy * x,
            iw = -qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        dest.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
        dest.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
        dest.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

        return dest;

    },

	toMat4: function () {
		var x = this.x, y = this.y, z = this.z, w = this.w;

		/*var out = $M([[	1 - (yy + zz), 	xy + wz, 		xy + wz, 		0],
					 [	xy - wz, 		1 - (xx + zz), 	yz + wx, 		0],
					 [	xz + wy, 		yz - wx, 		1 - (xx + yy), 	0],
					 [	0, 				0, 				0, 				1]]);*/
					 
					 
		var out = $M([[	1 - 2*(y*y + z*z), 	2*(x*y - w*z), 		2*(x*z + w*y),		0],
					 [	2*(x*y + w*z), 		1 - 2*(x*x + z*z), 	2*(y*z - w*x), 		0],
					 [	2*(x*z - w*y), 		2*(y*z + w*x), 		1 - 2*(x*x + y*y), 	0],
					 [	0, 					0, 					0, 					1]]);

 
		return out;
	}
};

Quaternion.slerp = function ( qa, qb, qm, t ) {

    var cosHalfTheta = qa.w * qb.w + qa.x * qb.x + qa.y * qb.y + qa.z * qb.z;

    if (cosHalfTheta < 0) {
        qm.w = -qb.w; qm.x = -qb.x; qm.y = -qb.y; qm.z = -qb.z;
        cosHalfTheta = -cosHalfTheta;
    } else {
        qm.copy(qb);
    }

    if ( Math.abs( cosHalfTheta ) >= 1.0 ) {

        qm.w = qa.w; qm.x = qa.x; qm.y = qa.y; qm.z = qa.z;
        return qm;

    }

    var halfTheta = Math.acos( cosHalfTheta ),
    sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

    if ( Math.abs( sinHalfTheta ) < 0.001 ) {

        qm.w = 0.5 * ( qa.w + qb.w );
        qm.x = 0.5 * ( qa.x + qb.x );
        qm.y = 0.5 * ( qa.y + qb.y );
        qm.z = 0.5 * ( qa.z + qb.z );

        return qm;

    }

    var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
    ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

    qm.w = ( qa.w * ratioA + qm.w * ratioB );
    qm.x = ( qa.x * ratioA + qm.x * ratioB );
    qm.y = ( qa.y * ratioA + qm.y * ratioB );
    qm.z = ( qa.z * ratioA + qm.z * ratioB );

    return qm;

}

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>






































// augment Sylvester some
Matrix.glTranslate = function (v)
{
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[2][0] = v.elements[0];
    r.elements[2][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][3] = v.elements[0];
    r.elements[1][3] = v.elements[1];
    r.elements[2][3] = v.elements[2];
    return r;
  }

  throw "Invalid length for Translation";
}

Matrix.glScale = function (v)
{
  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][0] = v.elements[0];
    r.elements[1][1] = v.elements[1];
    r.elements[2][2] = v.elements[2];
    return r;
  }

  throw "Invalid length for Scale";
}

Matrix.glRotate = function (angle, x, y, z)
{
    var r = Matrix.I(4);
    c = Math.cos(angle * 3.14/180);
    s = Math.sin(angle * 3.14/180);
    r.elements[0][0] = (x*x * (1-c)) + c;
    r.elements[1][0] = (y*x * (1-c)) + z*s;
    r.elements[2][0] = (x*z * (1-c)) - y*s;
    r.elements[0][1] = (x*y * (1-c)) - z*s;
    r.elements[1][1] = (y*y * (1-c)) + c;
    r.elements[2][1] = (y*z * (1-c)) + x*s;
    r.elements[0][2] = (x*z * (1-c)) + y*s;
    r.elements[1][2] = (y*z * (1-c)) - x*s;
    r.elements[2][2] = (z*z * (1-c)) + c;
    return r;
}

Matrix.prototype.flatten = function ()
{
    var result = [];
    if (this.elements.length == 0)
        return [];


    for (var j = 0; j < this.elements[0].length; j++)
        for (var i = 0; i < this.elements.length; i++)
            result.push(this.elements[i][j]);
    return result;
}

Matrix.prototype.ensure4x4 = function()
{
    if (this.elements.length == 4 &&
        this.elements[0].length == 4)
        return this;

    if (this.elements.length > 4 ||
        this.elements[0].length > 4)
        return null;

    for (var i = 0; i < this.elements.length; i++) {
        for (var j = this.elements[i].length; j < 4; j++) {
            if (i == j)
                this.elements[i].push(1);
            else
                this.elements[i].push(0);
        }
    }

    for (var i = this.elements.length; i < 4; i++) {
        if (i == 0)
            this.elements.push([1, 0, 0, 0]);
        else if (i == 1)
            this.elements.push([0, 1, 0, 0]);
        else if (i == 2)
            this.elements.push([0, 0, 1, 0]);
        else if (i == 3)
            this.elements.push([0, 0, 0, 1]);
    }

    return this;
};

Matrix.prototype.make3x3 = function()
{
    if (this.elements.length != 4 ||
        this.elements[0].length != 4)
        return null;

    return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
                          [this.elements[1][0], this.elements[1][1], this.elements[1][2]],
                          [this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
};

Vector.prototype.flatten = function ()
{
    return this.elements;
};

function mht(m) {
    var s = "";
    if (m.length == 16) {
        for (var i = 0; i < 4; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*4+0].toFixed(4) + "," + m[i*4+1].toFixed(4) + "," + m[i*4+2].toFixed(4) + "," + m[i*4+3].toFixed(4) + "]</span><br>";
        }
    } else if (m.length == 9) {
        for (var i = 0; i < 3; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*3+0].toFixed(4) + "," + m[i*3+1].toFixed(4) + "," + m[i*3+2].toFixed(4) + "]</font><br>";
        }
    } else {
        return m.toString();
    }
    return s;
}

//
// gluLookAt
//
function makeLookAt(ex, ey, ez,
                    cx, cy, cz,
                    ux, uy, uz)
{
    var eye = $V([ex, ey, ez]);
    var center = $V([cx, cy, cz]);
    var up = $V([ux, uy, uz]);

    var mag;

    var z = eye.subtract(center).toUnitVector();
    var x = up.cross(z).toUnitVector();
    var y = z.cross(x).toUnitVector();

    var m = $M([[x.e(1), x.e(2), x.e(3), 0],
                [y.e(1), y.e(2), y.e(3), 0],
                [z.e(1), z.e(2), z.e(3), 0],
                [0, 0, 0, 1]]);

    var t = $M([[1, 0, 0, -ex],
                [0, 1, 0, -ey],
                [0, 0, 1, -ez],
                [0, 0, 0, 1]]);
    return m.x(t);
}

//
// glOrtho
//
function makeOrtho(left, right,
                   bottom, top,
                   znear, zfar)
{
    var tx = -(right+left)/(right-left);
    var ty = -(top+bottom)/(top-bottom);
    var tz = -(zfar+znear)/(zfar-znear);

    return $M([[2/(right-left), 0, 0, tx],
               [0, 2/(top-bottom), 0, ty],
               [0, 0, -2/(zfar-znear), tz],
               [0, 0, 0, 1]]);
}

//
// gluPerspective
//
function makePerspective(fovy, aspect, znear, zfar)
{
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

//
// glFrustum
//
function makeFrustum(left, right,
                     bottom, top,
                     znear, zfar)
{
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
               [0, Y, B, 0],
               [0, 0, C, D],
               [0, 0, -1, 0]]);
}

//
// glOrtho
//
function makeOrtho(left, right, bottom, top, znear, zfar)
{
    var tx = - (right + left) / (right - left);
    var ty = - (top + bottom) / (top - bottom);
    var tz = - (zfar + znear) / (zfar - znear);

    return $M([[2 / (right - left), 0, 0, tx],
           [0, 2 / (top - bottom), 0, ty],
           [0, 0, -2 / (zfar - znear), tz],
           [0, 0, 0, 1]]);
}