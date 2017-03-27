function parseOBJ(data, onLoad) {
  var indices = [];
  var vertices = [];
  var normals = [];
  var uvs = [];
  var fixedIndices = [];
  var fixedVertices = [];
  var fixedNormals = [];
  var fixedUvs = [];

  function triangulate(face) {
    var data = [];
    var i;

    face = face.split(' ');

    for (i = 1; i < face.length - 1; i++)
      data.push(face[0], face[i], face[i + 1]);

    return data;
  }

  function processVertex(vertex) {
    var i;

    for (i = 1; i < 4; i++)
      vertices.push(parseFloat(vertex[i]));
  }

  function processNormal(normal) {
    var i;

    for (i = 1; i < 4; i++)
      normals.push(parseFloat(normal[i]));
  }

  function processUv(uv) {
    var i;

    for (i = 1; i < 3; i++)
      uvs.push(parseFloat(uv[i]));
  }

  function processVertexIndex(index) {
    index = parseInt(index);

    if (index <= 0)
      return vertices.length / 3 + index;

    return index - 1;
  }

  function processNormalIndex(index) {
    index = parseInt(index);

    if (index <= 0)
      return normals.length / 3 + index;

    return index - 1;
  }

  function processUvIndex(index) {
    index = parseInt(index);

    if (index <= 0)
      return uvs.length / 2 + index;

    return index - 1;
  }

  function processFace1(face) {
    var vertex;
    var index;
    var i;
    var j;

    for (i = 0; i < face.length; i++) {
      vertex = processVertexIndex(face[i]);

      if (indices[vertex] === undefined) {
        index = fixedVertices.length / 3;
        indices[vertex] = index;

        fixedIndices.push(index);

        for (j = 0; j < 3; j++)
          fixedVertices.push(vertices[3 * vertex + j]);
      } else
        fixedIndices.push(indices[vertex]);
    }
  }

  function processFace2(face) {
    var point;
    var vertex;
    var uv;
    var index;
    var count;
    var i;
    var j;

    for (i = 0; i < face.length; i++) {
      point = face[i].split('/');

      vertex = processVertexIndex(point[0]);
      uv = processUvIndex(point[1]);

      index = -1;
      count = fixedVertices.length / 3;

      if (!indices[vertex])
        indices[vertex] = [];

      for (j = 0; j < indices[vertex].length; j++) {
        if (indices[vertex][j].uv === uv) {
          index = indices[vertex][j].index;
          break;
        }
      }

      if (index >= 0)
        fixedIndices.push(index);
      else {
        indices[vertex].push({
          uv: uv,
          index: count
        });

        fixedIndices.push(count);

        for (j = 0; j < 3; j++)
          fixedVertices.push(vertices[3 * vertex + j]);

        fixedUvs.push(uvs[2 * uv]);
        fixedUvs.push(1.0 - uvs[2 * uv + 1]);
      }
    }
  }

  function processFace3(face) {
    var point;
    var vertex;
    var uv;
    var normal;
    var index;
    var count;
    var i;
    var j;

    for (i = 0; i < face.length; i++) {
      point = face[i].split('/');

      vertex = processVertexIndex(point[0]);
      uv = processUvIndex(point[1]);
      normal = processNormalIndex(point[2]);

      index = -1;
      count = fixedVertices.length / 3;

      if (!indices[vertex])
        indices[vertex] = [];

      for (j = 0; j < indices[vertex].length; j++) {
        if (indices[vertex][j].uv === uv && indices[vertex][j].normal === normal) {
          index = indices[vertex][j].index;
          break;
        }
      }

      if (index >= 0)
        fixedIndices.push(index);
      else {
        indices[vertex].push({
          uv: uv,
          normal: normal,
          index: count
        });

        fixedIndices.push(count);

        for (j = 0; j < 3; j++)
          fixedVertices.push(vertices[3 * vertex + j]);

        for (j = 0; j < 3; j++)
          fixedNormals.push(normals[3 * normal + j]);

        fixedUvs.push(uvs[2 * uv]);
        fixedUvs.push(1.0 - uvs[2 * uv + 1]);
      }
    }
  }

  function processFace4(face) {
    var point;
    var vertex;
    var normal;
    var index;
    var count;
    var i;
    var j;

    for (i = 0; i < face.length; i++) {
      point = face[i].split('//');

      vertex = processVertexIndex(point[0]);
      normal = processNormalIndex(point[1]);

      index = -1;
      count = fixedVertices.length / 3;

      if (!indices[vertex])
        indices[vertex] = [];

      for (j = 0; j < indices[vertex].length; j++) {
        if (indices[vertex][j].normal === normal) {
          index = indices[vertex][j].index;
          break;
        }
      }

      if (index >= 0)
        fixedIndices.push(index);
      else {
        indices[vertex].push({
          normal: normal,
          index: count
        });

        fixedIndices.push(count);

        for (j = 0; j < 3; j++)
          fixedVertices.push(vertices[3 * vertex + j]);

        for (j = 0; j < 3; j++)
          fixedNormals.push(normals[3 * normal + j]);
      }
    }
  }

  function parse() {
    var libraries = [];
    var materials = [];
    var lines = data.split('\n');
    var line;
    var result;
    var i;

    for (i = 0; i < lines.length; i++) {
      line = lines[i].trim().replace(/ +(?= )/g, '');

      if (line.length === 0 || line.charAt(0) === '#')
        continue;
      else if ((result = /v( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/.exec(line)))
        processVertex(result);
      else if ((result = /vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/.exec(line)))
        processNormal(result);
      else if ((result = /vt( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/.exec(line)))
        processUv(result);
      else if ((result = /f\s(([+-]?\d+\s){2,}[+-]?\d+)/.exec(line)))
        processFace1(triangulate(result[1]));
      else if ((result = /f\s(([+-]?\d+\/[+-]?\d+\s){2,}[+-]?\d+\/[+-]?\d+)/.exec(line)))
        processFace2(triangulate(result[1]));
      else if ((result = /f\s((([+-]?\d+\/[+-]?\d+\/[+-]?\d+\s){2,})[+-]?\d+\/[+-]?\d+\/[+-]?\d+)/.exec(line)))
        processFace3(triangulate(result[1]));
      else if ((result = /f\s(([+-]?\d+\/\/[+-]?\d+\s){2,}[+-]?\d+\/\/[+-]?\d+)/.exec(line)))
        processFace4(triangulate(result[1]));
      else if (/^mtllib/.test(line)){
        //libraries.push(line.substring(7).trim());
      }else if (/^o/.test(line) || /^g/.test(line)) {
        /*mesh = processMesh(mesh);
        mesh.name = line.substring(2).trim();*/
      } else if (/^usemtl/.test(line)) {
        /*mesh = processMesh(mesh);
        mesh.material.name = line.substring(7).trim();

        if (!materials[mesh.material.name])
          materials[mesh.material.name] = [];

        materials[mesh.material.name].push(mesh.material);*/
      }
    }





    //processMesh(mesh);
    //processLibraries(libraries, materials);
  }

  parse();
  var bb = aabb(fixedVertices);
  fixedVertices = center(fixedVertices, bb);
  fixedVertices = normalize(fixedVertices, bb);


  //Normals!!!
  var vertexLineNormal = [];
  var indexLineNormal = [];
  for(var i = 0, j = 0; i< fixedVertices.length; i+=3){
    //First point
    vertexLineNormal.push(fixedVertices[i]);           
    vertexLineNormal.push(fixedVertices[i+1]);         
    vertexLineNormal.push(fixedVertices[i+2]);         

    //End point
    vertexLineNormal.push(fixedVertices[i] + fixedNormals[i] * 0.05);
    vertexLineNormal.push(fixedVertices[i+1] + fixedNormals[i+1] * 0.05);
    vertexLineNormal.push(fixedVertices[i+2] + fixedNormals[i+2] * 0.05);

    //indexes
    indexLineNormal.push(j); ++j;
    indexLineNormal.push(j); ++j;
  }

  var LinesArray = [];
    //Wireframe
    for(var i =0; i< fixedIndices.length; i = i+ 3){
      LinesArray.push(fixedIndices[i]);
      LinesArray.push(fixedIndices[i+1]);

      LinesArray.push(fixedIndices[i+1]);
      LinesArray.push(fixedIndices[i+2]);

      LinesArray.push(fixedIndices[i]);
      LinesArray.push(fixedIndices[i+2]);
    };


    //Vertex array!!!
    var VertexArray = [];
    for(var i =0; i< fixedIndices.length; i+=3){
      VertexArray.push(fixedIndices[i]);
      VertexArray.push(fixedIndices[i+1]);
      VertexArray.push(fixedIndices[i+2]);
    }


  return {  vertexPositionData: fixedVertices, normalData: fixedNormals, 
                textureCoordData: fixedUvs, vertexLineNormal: vertexLineNormal, 
                indexData: fixedIndices, LinesArray: LinesArray, 
                VertexArray: VertexArray, indexLineNormal: indexLineNormal}; 

    /*console.log(indices.length, indices);
    console.log(vertices.length, vertices);
    console.log(normals.length, normals);
    console.log(uvs.length, uvs);
    console.log(fixedIndices.length, fixedIndices);
    console.log(fixedVertices.length, fixedVertices);
    console.log(fixedNormals.length, fixedNormals);
    console.log(fixedUvs.length, fixedUvs);*/
};

function aabb(vertexData){

  var aabb = {xmin: 999999999, ymin: 999999999, zmin: 999999999, xmax: -999999999, ymax: -999999999, zmax: -999999999};

  for(var i=0;i<vertexData.length;i += 3){
      if(vertexData[i] < aabb.xmin) aabb.xmin = vertexData[i];
      if(vertexData[i + 1] < aabb.ymin) aabb.ymin = vertexData[i + 1];
      if(vertexData[i + 2] < aabb.zmin) aabb.zmin = vertexData[i + 2];

      if(vertexData[i] > aabb.xmax) aabb.xmax = vertexData[i];
      if(vertexData[i + 1] > aabb.ymax) aabb.ymax = vertexData[i + 1];
      if(vertexData[i + 2] > aabb.zmax) aabb.zmax = vertexData[i + 2];

  }

  return aabb;
}

function center(vertexData, aabb){
  var centerx = (aabb.xmin + aabb.xmax)/2;
  var centery = (aabb.ymin + aabb.ymax)/2;
  var centerz = (aabb.zmin + aabb.zmax)/2;


  for(var i=0;i<vertexData.length;i += 3){
    vertexData[i] -= centerx;
    vertexData[i + 1] -= centery;
    vertexData[i + 2] -= centerz;
  } 

  aabb.xmin -= centerx;
  aabb.ymin -= centery;
  aabb.zmin -= centerz;

  aabb.xmax -= centerx;
  aabb.ymax -= centery;
  aabb.zmax -= centerz;

  return vertexData;
}

function normalize(vertexData, aabb){
  var lenthx = Math.abs(aabb.xmax - aabb.xmin) / 1.5;
  var lenthy = Math.abs(aabb.ymax - aabb.ymin) / 1.5;
  var lenthz = Math.abs(aabb.zmax - aabb.zmin) / 1.5;

  var maxLength = Math.max(Math.max(lenthx, lenthy), lenthz);

  for(var i=0;i<vertexData.length;i += 3){
    vertexData[i] = vertexData[i]/maxLength;
    vertexData[i + 1] = vertexData[i + 1]/maxLength;
    vertexData[i + 2] = vertexData[i + 2]/maxLength;
  } 

  return vertexData;
}