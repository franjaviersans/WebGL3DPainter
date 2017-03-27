//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> MENU
var FizzyText = function() {
  this.message = 'dat.gui';
  this.speed = 0.8;
  this.vertex = false;
  this.normal = false;
  this.wireframe = false;
  this.texture = true;
  this.TexturedView = false;
  this.light = true;
  this.reload = function () {};
  this.load = function() {
      document.getElementById("openOBJ").click(); //Fake function to do a click on input
  };
  this.loadTexture = function() {
      document.getElementById("openTexture").click();  //Fake function to do a click on input
  };
};


function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}


var menuText = new FizzyText();

function createMenu() {
  var gui = new dat.GUI();

  var f1 = gui.addFolder('View');
  f1.add(menuText, 'wireframe').name('Wireframe');
  f1.add(menuText, 'light').name('Enable Light');
  f1.add(menuText, 'normal').name('Enable Normal');
  f1.add(menuText, 'texture').name('Enable Texture');
  f1.add(menuText, 'vertex').name('Enable Vertex');


  var f2 = gui.addFolder('Texture');
  f2.add(menuText, 'TexturedView').name('Texture View');
  f2.add(menuText, 'reload').name('Reload');

  var f3 = gui.addFolder('Object');
  f3.add(menuText, 'load').name('Load OBJ object');
  f3.add(menuText, 'loadTexture').name('Load Texture');

  var f4 = gui.addFolder('Brush');
  f4.addColor(Brush, 'brushColor').name('Brush Color');
  f4.add(Brush, 'intensity').name('Brush Intensity').min(0.0).max(5.0).step(0.1);
  
  //gui.add(text, 'explode');
};

//Function to handle Open OBJ file
function openFile(e){
  var reader = new FileReader();

  reader.addEventListener("load", function(event) {
      OBJobject.loadModel(event.target.result);
    });

   reader.readAsText(e.target.files[0]);
}

//Function to handle Open Texture file
function openTexture(e){
  var reader = new FileReader();

  reader.addEventListener("load", function(event) {
    console.log('aja');

      imageTexture.src = event.target.result;
    }, false);

   reader.readAsDataURL(e.target.files[0]);
}
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> End menu












//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>MOUSE EVENTS
mousedown = function(event) {
  var box = canvas.getBoundingClientRect();
  var xx = (event.pageX - box.left) * (canvas.width /box.width);
  var yy = (event.pageY - box.top) * (canvas.height /box.height);

    
  if(event.button == 0){
    pressed = event.button;
    lastx = xx/WindowWidth;
    lasty = (WindowHeight - yy)/WindowHeight;
    clickToPaint(xx,yy);

  }else if(event.button == 1){
    pressed = event.button;
  }else if(event.button == 2){
    pressed = event.button;
  }

  lastx = xx;
  lasty = yy;
  
  }

mouseup = function(event) {
    var box = canvas.getBoundingClientRect();
    var xx = (event.pageX - box.left) * (canvas.width /box.width);
    var yy = (event.pageY - box.top) * (canvas.height /box.height);

    if(pressed == 0){
      lastx = xx/WindowWidth;
      lasty = (WindowHeight - yy)/WindowHeight;
      clickToPaint(xx,yy);
      
    }else if(pressed == 1){
      if(shiftKey){
        //Bring object closer
        var dx = (xx - lastx);
        var dy = (yy - lasty);

        translate.z -= dy/100;
      }else{
        //translate object
        var dx = (xx - lastx)/100;
        var dy = -(yy - lasty)/100;

        translate.x += dx;
        translate.y += dy;
      }

    }else if(pressed == 2){
      //Rotate object using quaternion
      var dx = (xx - lastx);
      var dy = (yy - lasty);

      if(!(dx == 0 && dy == 0)){
        //Calculate angle and rotation axis
        var angle = Math.sqrt(dx*dx + dy*dy)/50.0;
          
        //Acumulate rotation with quaternion multiplication
        var vec = new Vector3D(dy, dx, 0.0);
        q2.setFromAxisAngle(vec, angle);
        q2.normalize(); 
        quaternion = quaternion.multiply(q2, quaternion);
        quaternion.normalize();
      }
    }
    lastx = xx;
    lasty = yy;
      
    pressed = -1;
  }



  mousemove = function(event) {

    var box = canvas.getBoundingClientRect();
    var xx = (event.pageX - box.left) * (canvas.width /box.width);
    var yy = (event.pageY - box.top) * (canvas.height /box.height);
    
    if(pressed == 0){
      lastx = xx/WindowWidth;
      lasty = (WindowHeight - yy)/WindowHeight;
      clickToPaint(xx,yy);

    }else if(pressed == 1){
      if(shiftKey){
        //Bring object closer
        var dx = (xx - lastx);
        var dy = (yy - lasty);
      
        translate.z -= dy/100;
      }else{
        //translate object
        var dx = (xx - lastx)/100;
        var dy = -(yy - lasty)/100;
        
        translate.x += dx;
        translate.y += dy;
      }
  
    }else if(pressed == 2){
      var dx = (xx - lastx);
      var dy = (yy - lasty);
      
      if(!(dx == 0 && dy == 0)){
        //Calculate angle and rotation axis
        var angle = Math.sqrt(dx*dx + dy*dy)/50.0;
          
        //Acumulate rotation with quaternion multiplication
        var vec = new Vector3D(dy, dx, 0.0);
        q2.setFromAxisAngle(vec, angle);
        q2.normalize(); 
        quaternion = quaternion.multiply(q2, quaternion);
        quaternion.normalize();
        
      }
    }

    lastx = xx;
    lasty = yy;

  }


  mouseleave = function(event) {  
    pressed = -1;
  }

  keydown = function(event) {
      if (event.keyCode == 76) menuText.light = !menuText.light;
      if (event.keyCode == 85) menuText.TexturedView = !menuText.TexturedView;
      if (event.keyCode == 86) menuText.vertex = !menuText.vertex;
      if (event.keyCode == 78) menuText.normal = !menuText.normal;
      if (event.keyCode == 87) menuText.wireframe = !menuText.wireframe;
      if (event.keyCode == 84) menuText.texture = !menuText.texture;
       if(event.shiftKey) shiftKey = true;
  }

  keyup = function(event) {
      if(!event.shiftKey) shiftKey = false;
  }

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>MOUSE EVENTS