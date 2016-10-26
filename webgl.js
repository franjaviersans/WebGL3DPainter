
//WebGL variables
var canvas;
var gl;


//Window
var WindowWidth, WindowHeight, ncp = 0.1, fcp = 20;

var perspectiveMatrix, orthoMatrix = makeOrtho(0.0, 1.0, 0.0, 1.0, -1.0, 1.0);

var shTexture, shaderNormal, shaderTextureFS, shaderFlatColor, shaderPaint; //Shaders
var quad = null, OBJobject = null;


//Object transformation
var translate = new Vector3D(0.0,0.0,0.0);
var scale = 1.0;

//Mouse
var pressed = -1;
var lastx, lasty;
var quaternion = new Quaternion(0.0, 0.0, 0.0, 1.0), q2 = new Quaternion(0.0, 0.0, 0.0, 1.0);
var shiftKey = false;
var imageTexture = new Image(), imageBlur;
var Brush;


function clickToPaint(xx,yy){

  if(menuText.TexturedView){
      //Paint in the user click
      lastx = xx/WindowWidth;
      lasty = (WindowHeight - yy)/WindowHeight;

      OBJobject.RendertoTexture(gl, quad, shaderPaint, WindowWidth, WindowHeight, lastx, lasty, Brush); 
  }else{
      //Ray from origin to ncp    
      var direction = $V([(lastx - 0.5), (lasty - 0.5), -1.0, 0.0]).toUnitVector(); 
      var origin = $V([0.0, 0.0, 0.0, 1.0]); 
      
      //Set the ray in object space with the invert of the model matrix
      quaternion.normalize();
      var RotarioMat = quaternion.toMat4();
      var trans2 = Matrix.glTranslate($V([translate.x, translate.y, -3.0 + translate.z]));
      var scaleMat = Matrix.glScale($V([scale, scale, scale]));
      uModelMatrix = trans2.x(RotarioMat.x(scaleMat));
      var invModelMatrix = uModelMatrix.inverse();
      origin = invModelMatrix.x(origin);
      direction = invModelMatrix.x(direction).toUnitVector();

      origin = new Vector3D(origin.elements[0], origin.elements[1], origin.elements[2]);
      direction = new Vector3D(direction.elements[0], direction.elements[1], direction.elements[2]);

      //calculate the click 
      click = OBJobject.intersection(origin, direction);

      if(click != null) OBJobject.RendertoTexture(gl, quad, shaderPaint, WindowWidth, WindowHeight, click.s, click.t, Brush); 
  }
}


//
// start
//
// Called when the canvas is created to get the ball rolling.
// Figuratively, that is. There's nothing moving in this demo.
//
function start() {
  canvas = document.getElementById("glcanvas");
  canvas.addEventListener("webglcontextlost", function(event) {
            event.preventDefault();
          }, false);


      
  WindowWidth = canvas.width;
  WindowHeight = canvas.height;
  

  initWebGL(canvas);      // Initialize the GL context


  // Only continue if WebGL is available and working
  
  if (gl) {

    gl.viewport(0,0,WindowWidth,WindowHeight);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    
    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.
    initShaders();

    
    //Make the perspective Matrix
    perspectiveMatrix = makePerspective(45.0, WindowWidth/WindowHeight, ncp, fcp);
     

    //Init geometry
  	quad = new Quad(gl);


  	OBJobject = new OBJ(gl);
    Brush = new brushTexture(gl);
  	OBJobject.initSpehere(gl, 20, 20, 0.5, [1.0, 1.0, 1.0, 1.0]);



    //Pass the texture to OpenGL
    imageTexture.addEventListener("load", 
                      //Handle new image on load
                      function(){
                        OBJobject.loadFromImage(gl, imageTexture);
                      }, false);

    //imageBlur =  document.getElementById("brushImage");
 
    var color = new Vector3D(1.0,0.0,1.0);
    Brush.loadFromImage(gl);



    // Add event listener for `click` events.
    //On Click
    canvas.addEventListener('mousedown', mousedown, false);
    //On Release
    canvas.addEventListener('mouseup', mouseup, false);
    //On leave
    canvas.addEventListener('mouseleave', mouseleave, false);
    //On move
    canvas.addEventListener('mousemove', mousemove, false);


    //On key pressed
    window.addEventListener('keydown', keydown, false);
    //On key up
    window.addEventListener('keyup', keyup, false);


    createMenu();


	
    
    // Set up to draw the scene periodically.
    setInterval(drawScene, 1);
  }else{
    console.log("Your browser doesn't support WebGL");
  }
}

//
// initWebGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initWebGL() {
  gl = null;

  
  try {
    gl = canvas.getContext("experimental-webgl");
  }
  catch(e) {
  }
  
  // If we don't have a GL context, give up now
  
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
}


//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  

  if(menuText.TexturedView){
  	gl.clearColor(0.0,0.0,0.0,0.0);
  	// Clear the canvas before we start drawing on it.
  	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    

    //<Draw full screen quad with texture>
    shaderTextureFS.bind(gl);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, OBJobject.textureArray[OBJobject.actualTexture]);

    gl.enableVertexAttribArray(shaderTextureFS.getAttLoc("aVertexPos"));
    gl.enableVertexAttribArray(shaderTextureFS.getAttLoc("aTexturePosition"));

    gl.uniformMatrix4fv(shaderTextureFS.getUniformLoc("uPMatrix"), false, new Float32Array(orthoMatrix.flatten()));
    var uModel = Matrix.I(4);
    gl.uniformMatrix4fv(shaderTextureFS.getUniformLoc("uModel"), false, new Float32Array(uModel.flatten()));
    gl.uniform1i(shaderTextureFS.getUniformLoc("tex"), 0);

    quad.draw(gl, shaderTextureFS.getAttLoc("aVertexPos"), -1, shaderTextureFS.getAttLoc("aTexturePosition"));

    gl.disableVertexAttribArray(shaderTextureFS.getAttLoc("aVertexPos"));
    gl.disableVertexAttribArray(shaderTextureFS.getAttLoc("aTexturePosition"));






    //<Draw object in texture space>
    shTexture.bind(gl);

    gl.enableVertexAttribArray(shTexture.getAttLoc("aTexturePosition"));

    gl.uniformMatrix4fv(shTexture.getUniformLoc("uPMatrix"), false, new Float32Array(orthoMatrix.flatten()));

    OBJobject.drawWireframe(gl, -1, -1, shTexture.getAttLoc("aTexturePosition"));

    gl.disableVertexAttribArray(shTexture.getAttLoc("aVertexPos"));
		
  }else{
  	gl.clearColor(0.15,0.15,0.15,1.0);
  	// Clear the canvas before we start drawing on it.
  	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    //<Draw object normally>
    shaderNormal.bind(gl);

    gl.activeTexture(gl.TEXTURE0);

    gl.enableVertexAttribArray(shaderNormal.getAttLoc("aVertexPos"));
    gl.enableVertexAttribArray(shaderNormal.getAttLoc("aNormalPosition"));
    gl.enableVertexAttribArray(shaderNormal.getAttLoc("aTexturePosition"));

    //Set uniforms
    gl.uniformMatrix4fv(shaderNormal.getUniformLoc("uPMatrix"), false, new Float32Array(perspectiveMatrix.flatten()));
    var uViewMatrix = Matrix.I(4);
    gl.uniformMatrix4fv(shaderNormal.getUniformLoc("uViewMatrix"), false, new Float32Array(uViewMatrix.flatten()));

    quaternion.normalize();
    var RotarioMat = quaternion.toMat4();
    //var rot = $M(RotarioMat);
    var trans2 = Matrix.glTranslate($V([translate.x, translate.y, -3.0 + translate.z]));
    var scaleMat = Matrix.glScale($V([scale, scale, scale]));
    uModelMatrix = trans2.x(RotarioMat.x(scaleMat));

    gl.uniformMatrix4fv(shaderNormal.getUniformLoc("uModelMatrix"), false, new Float32Array(uModelMatrix.flatten()));
    gl.uniform1i(shaderNormal.getUniformLoc("light"), menuText.light);
    gl.uniform1i(shaderNormal.getUniformLoc("texture"), menuText.texture);
    gl.uniform1i(shaderNormal.getUniformLoc("tex"), 0);


     //Draw the object wireframe or not
    if(!menuText.wireframe){
    	OBJobject.draw(gl, shaderNormal.getAttLoc("aVertexPos"), shaderNormal.getAttLoc("aNormalPosition"), shaderNormal.getAttLoc("aTexturePosition"));
    }else{
    	OBJobject.drawWireframe(gl, shaderNormal.getAttLoc("aVertexPos"), shaderNormal.getAttLoc("aNormalPosition"), shaderNormal.getAttLoc("aTexturePosition"));
	}

	gl.disableVertexAttribArray(shaderNormal.getAttLoc("aVertexPos"));
    gl.disableVertexAttribArray(shaderNormal.getAttLoc("aNormalPosition"));
    gl.disableVertexAttribArray(shaderNormal.getAttLoc("aTexturePosition"));








	//Shader for normals and points
	shaderFlatColor.bind(gl);

	gl.enableVertexAttribArray(shaderFlatColor.getAttLoc("aVertexPos"));

	gl.uniformMatrix4fv(shaderFlatColor.getUniformLoc("uPMatrix"), false, new Float32Array(perspectiveMatrix.flatten()));
	gl.uniformMatrix4fv(shaderFlatColor.getUniformLoc("uViewMatrix"), false, new Float32Array(uViewMatrix.flatten()));
	gl.uniformMatrix4fv(shaderFlatColor.getUniformLoc("uModelMatrix"), false, new Float32Array(uModelMatrix.flatten()));
	
    if(menuText.vertex){
    	gl.uniform3f(shaderFlatColor.getUniformLoc("color"), 1.0, 0.0, 0.0);
    	OBJobject.drawVertex(gl, shaderFlatColor.getAttLoc("aVertexPos"));
    }
    
    if(menuText.normal){
    	gl.uniform3f(shaderFlatColor.getUniformLoc("color"), 0.0, 0.0, 1.0);
    	OBJobject.drawNormal(gl, shaderFlatColor.getAttLoc("aVertexPos"));
    }

    gl.disableVertexAttribArray(shaderFlatColor.getAttLoc("aVertexPos"));
    gl.disableVertexAttribArray(shaderFlatColor.getAttLoc("aNormalPosition"));
    gl.disableVertexAttribArray(shaderFlatColor.getAttLoc("aTexturePosition"));
  }
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  
  // Create the shader program
  shTexture = new Shader("Object to texture space", "textureSpaceObjectRender-vs", "textureSpaceObjectRender-fs");
  shTexture.compileShader(gl);
  shTexture.bind(gl);


  // Create normal rendering shader program
  shaderNormal = new Shader("Normal Rendering", "shader-vs", "shader-fs");
  shaderNormal.compileShader(gl);
  shaderNormal.bind(gl);


  //Create Texture Full screen shader
  shaderTextureFS = new Shader("Normal Rendering", "textureRender-vs", "textureRender-fs");
  shaderTextureFS.compileShader(gl);
  shaderTextureFS.bind(gl);

  //Create Texture for Color flat rendering
  shaderFlatColor = new Shader("Flat color Rendering", "flatcolor-vs", "flatcolor-fs");
  shaderFlatColor.compileShader(gl);
  shaderFlatColor.bind(gl);

  //Create Texture for Color flat rendering
  shaderPaint = new Shader("Paint Rendering", "paint-vs", "paint-fs");
  shaderPaint.compileShader(gl);
  shaderPaint.bind(gl);

}
