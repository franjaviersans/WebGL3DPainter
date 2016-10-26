/**
 * @class ShaderMaterial
 * @extends Material
 * @constructor
 * @param {String} id
 * @param {String} vertex
 * @param {String} fragment
 */
Shader = function(id, vertex, fragment) {

  this.program;
  this._id = id;
  this._vertex = vertex;
  this._fragment = fragment;
  this._uniform = {};
  this._attributes = {};
};


Shader.prototype = {

  constructor: Shader,

  compileShader: function(gl) {
    var fs = this._getShader(gl, this._fragment);
    var vs = this._getShader(gl, this._vertex);
    
    // Create the shader program
    
    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    
    // If creating the shader program failed, alert
    
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      alert("Unable to initialize the shader program.");
    }


    gl.useProgram(this.program);
    this._loadUniforms(gl);
    this._loadAttributes(gl);
  },


  _getShader:  function(gl, id) {
    var shaderScript = document.getElementById(id);
    
    // Didn't find an element with the specified ID; abort.
    
    if (!shaderScript) {
      return null;
    }
    
    // Walk through the source element's children, building the
    // shader source string.
    
    var theSource = "";
    var currentChild = shaderScript.firstChild;
    
    while(currentChild) {
      if (currentChild.nodeType == 3) {
        theSource += currentChild.textContent;
      }
      
      currentChild = currentChild.nextSibling;
    }
    
    // Now figure out what type of shader script we have,
    // based on its MIME type.
    
    var shader;
    
    if (shaderScript.type == "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
      return null;  // Unknown shader type
    }
    
    // Send the source to the shader object
    
    gl.shaderSource(shader, theSource);
    
    // Compile the shader program
    
    gl.compileShader(shader);
    
    // See if it compiled successfully
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
      return null;
    }
    
    return shader;
  },




  bind: function(gl) {
    gl.useProgram(this.program);
  },


  _loadUniforms: function(gl) {
    var uniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
    var name;
    var k;

    for (k = 0; k < uniforms; k++) {
      name = gl.getActiveUniform(this.program, k).name;
      this._uniform[name] = gl.getUniformLocation(this.program, name);
    }
  },


  _loadAttributes: function(gl) {
    var attributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
    var name;
    var k;

    for (k = 0; k < attributes; k++) {
      name = gl.getActiveAttrib(this.program, k).name;
      this._attributes[name] = gl.getAttribLocation(this.program, name);
    }
  },


  getUniformLoc: function(name) {
    if(this._uniform[name] !== null) return this._uniform[name];
  },

  getAttLoc: function(name) {
    if(this._attributes[name] !== null) return this._attributes[name];
  }
}