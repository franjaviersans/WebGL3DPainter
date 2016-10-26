
brushTexture = function(gl){	
	this.texture = gl.createTexture();
	this.brushColor = "#ff00ff";
	this.intensity = 1.0;
}




brushTexture.prototype = {

    constructor: brushTexture,

    loadFromImage: function(gl){

    	var Image = new Uint8Array(33 * 33 * 4);
    	var BrushSize = 33;

    	var intensity = 1.0;

    	var Index;
	    var BrushSizeHalf = BrushSize*0.5;
	    for (var i=0; i<BrushSize; ++i)
	    {
	        for (var j=0; j<BrushSize; ++j)
	        {
	            Index = (i + j * BrushSize) * 4;
	            //
	            var coeff = Math.sqrt((i - BrushSizeHalf)*(i - BrushSizeHalf) + (j - BrushSizeHalf)*(j - BrushSizeHalf) + BrushSizeHalf) / BrushSizeHalf; // 0..1
	            if (coeff > 1.0) coeff = 1.0;
	            //

	            var inten = 1 - intensity * coeff;

	            Image[Index] = inten * 255;
	            Image[Index + 1] = inten * 255;
	            Image[Index + 2] = inten * 255;
	            Image[Index + 3] = inten * 255;
	        }
	    }





		// Bind the texture the target (TEXTURE_2D) of the active texture unit.
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 33, 33, 0, gl.RGBA, gl.UNSIGNED_BYTE, Image);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		gl.bindTexture(gl.TEXTURE_2D, null);
	}
};


