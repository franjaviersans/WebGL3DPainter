/**
 * @class EZ3.OBJRequest
 * @extends EZ3.Request
 * @param {String} url
 * @param {Boolean} [cached]
 * @param {Boolean} [crossOrigin]
 */
EZ3.OBJRequest = function(url, cached, crossOrigin) {
  EZ3.Request.call(this, url, new EZ3.Entity(), cached, crossOrigin);
};

EZ3.OBJRequest.prototype = Object.create(EZ3.Request.prototype);
EZ3.OBJRequest.prototype.constructor = EZ3.OBJRequest;

/**
 * @method EZ3.OBJRequest#_parseMTL
 * @param {String} baseUrl
 * @param {String} data
 * @param {EZ3.Material[]} materials
 * @param {EZ3.RequestManager} requests
 */
EZ3.OBJRequest.prototype._parseMTL = function(baseUrl, data, materials, requests) {
  var that = this;
  var currents;

  function processColor(color) {
    var values = color.split(' ');

    return new EZ3.Vector3(parseFloat(values[0]), parseFloat(values[1]), parseFloat(values[2]));
  }

  function processDiffuse(color) {
    var diffuse = processColor(color);
    var i;

    for (i = 0; i < currents.length; i++)
      currents[i].diffuse = diffuse;
  }

  function processSpecular(color) {
    var specular = processColor(color);
    var i;

    for (i = 0; i < currents.length; i++)
      currents[i].specular = specular;
  }

  function processTransparency(opacity, invert) {
    var i;

    opacity = parseFloat(opacity);

    if (invert)
      opacity = 1 - opacity;

    if (opacity >= 1)
      return;

    for (i = 0; i < currents.length; i++) {
      //currents[i].transparent = true;
      //currents[i].opacity = opacity;
    }
  }

  function processDiffuseMap(url) {
    var texture = new EZ3.Texture2D(requests.addImageRequest(baseUrl + url, that.cached, that.crossOrigin));
    var i;

    for (i = 0; i < currents.length; i++)
      currents[i].diffuseMap = texture;
  }

  function parse() {
    var lines = data.split('\n');
    var line;
    var key;
    var value;
    var i;
    var j;

    for (i = 0; i < lines.length; i++) {
      line = lines[i].trim();

      j = line.indexOf(' ');

      key = (j >= 0) ? line.substring(0, j) : line;
      key = key.toLowerCase();

      value = (j >= 0) ? line.substring(j + 1) : '';
      value = value.trim();

      if (key === 'newmtl')
        currents = materials[value];
      else if (currents) {
        if (key === 'kd')
          processDiffuse(value);
        else if (key === 'ks')
          processSpecular(value);
        else if (key === 'map_kd')
          processDiffuseMap(value);
        else if (key === 'd')
          processTransparency(value);
        else if (key === 'tr')
          processTransparency(value, true);
      }
    }
  }

  parse();
};

/**
 * @method EZ3.OBJRequest#_parseOBJ
 * @param {String} data
 * @param {Function} onLoad
 */
EZ3.OBJRequest.prototype._parseOBJ = function(data, onLoad) {
  var that = this;
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

  function processMesh(mesh) {
    if (fixedIndices.length) {
      mesh.geometry.buffers.setTriangles(fixedIndices, (fixedVertices.length / 3) > EZ3.Math.MAX_USHORT);
      mesh.geometry.buffers.setPositions(fixedVertices);

      if (fixedUvs.length) {
        mesh.geometry.buffers.setUVs(fixedUvs);
        fixedUvs = [];
      }

      if (fixedNormals.length) {
        mesh.geometry.buffers.setNormals(fixedNormals);
        fixedNormals = [];
      }

      indices = [];
      fixedIndices = [];
      fixedVertices = [];

      that.asset.add(mesh);

      return new EZ3.Mesh();
    }

    return mesh;
  }

  function processLibraries(libraries, materials) {
    var requests = new EZ3.RequestManager();
    var baseUrl = EZ3.toBaseUrl(that.url);
    var files = [];
    var i;

    for (i = 0; i < libraries.length; i++)
      files.push(requests.addFileRequest(baseUrl + libraries[i], that.cached, that.crossOrigin));

    requests.onComplete.add(function() {
      for (i = 0; i < files.length; i++)
        that._parseMTL(baseUrl, files[i].data, materials, requests);

      requests.onComplete.removeAll();
      requests.onComplete.add(function() {
        onLoad(that.url, that.asset);
      });

      requests.start();
    });

    requests.start();
  }

  function parse() {
    var mesh = new EZ3.Mesh();
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
      else if (/^mtllib/.test(line))
        libraries.push(line.substring(7).trim());
      else if (/^o/.test(line) || /^g/.test(line)) {
        mesh = processMesh(mesh);
        mesh.name = line.substring(2).trim();
      } else if (/^usemtl/.test(line)) {
        mesh = processMesh(mesh);
        mesh.material.name = line.substring(7).trim();

        if (!materials[mesh.material.name])
          materials[mesh.material.name] = [];

        materials[mesh.material.name].push(mesh.material);
      }
    }

    processMesh(mesh);
    processLibraries(libraries, materials);
  }

  parse();
};

/**
 * @method EZ3.OBJRequest#send
 * @param {Function} onLoad
 * @param {Function} onError
 */
EZ3.OBJRequest.prototype.send = function(onLoad, onError) {
  var that = this;
  var requests = new EZ3.RequestManager();

  requests.addFileRequest(this.url, this.crossOrigin);

  requests.onComplete.add(function(assets, failed) {
    if (failed)
      return onError(that.url, true);

    that._parseOBJ(assets.get(that.url).data, onLoad);
  });

  requests.send();
};