const cameraEl = document.getElementById('camera');
const canvasEl = document.getElementById('captureCanvas');
const offscreenCanvasEl = document.getElementById('offscreenCanvas');
const rectangle1 = document.getElementById('rectangle1');

startCamera();

cameraEl.addEventListener('play', () => {
  console.log('Video stream started');

  // Set the offscreen canvas to be same size as video feed
  offscreenCanvasEl.width = cameraEl.videoWidth;
  offscreenCanvasEl.height = cameraEl.videoHeight;

  // Set the drawing canvas to be same size too
  canvasEl.width = cameraEl.videoWidth;
  canvasEl.height = cameraEl.videoHeight;

  // Call 'renderFrame' now that the stream has started
  window.requestAnimationFrame(renderFrame);
});


// Demonstrates a mediated rendering of video frames
function renderFrame() {
  let offscreenC = offscreenCanvasEl.getContext('2d');
  let c = canvasEl.getContext('2d');

  // 1. Capture to offscreen buffer
  offscreenC.drawImage(cameraEl, 0, 0);

  // 2. Read the pixel data from this buffer
  let frame = offscreenC.getImageData(0, 0, offscreenCanvasEl.width, offscreenCanvasEl.height);

  let blueCount = 0;

  // Frame data is one giant array of red, green, blue and alpha values per pixel.
  // R G B A R G B A R G B A ... (that's three pixels)

  let totalPixels = frame.data.length / 4; // Get total number of pixels by dividing by 4 (since each pixel uses 4 values)
  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
    // This shows you how to get the RGB values. We just want B
    let r = frame.data[pixelIndex * 4 + 0];
    let g = frame.data[pixelIndex * 4 + 1];
    let b = frame.data[pixelIndex * 4 + 2];
      
    let grey = (r+g+b)/3; // if grey is zero then it's white, if 255 black
      
// If amount of blue is less than 180 (out of 255), set the pixel to grey
    if (grey > 150) { 
      frame.data[pixelIndex * 4 + 0] = 250;
      frame.data[pixelIndex * 4 + 1] = 100;
      frame.data[pixelIndex * 4 + 2] = 150;
      blueCount++;
    }
  }

  // % of image that is 'blue enough'
  let blueValue = 100 - Math.floor(100 * (blueCount / (frame.data.length / 4)));
  // turn the rectangle from white to black depending on the brightness of the room
  rectangle1.style.backgroundColor='rgb('+blueValue*2.55+','+blueValue*2.55+','+blueValue*2.55+')';
    
    
  // Write our modified frame back to the buffer
  offscreenC.putImageData(frame, 0, 0);

  // Draw buffer to the visible canvas
  c.drawImage(offscreenCanvasEl, 0, 0);

  c.fillStyle = 'white';
  c.font = '48px "Fira Code", Monaco, "Andale Mono", "Lucida Console", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace';
  c.fillText(blueValue + "%", 100, 100);

  // Repeat!
  window.requestAnimationFrame(renderFrame);
}


// ------------------------

// Reports outcome of trying to get the camera ready
function cameraReady(err) {
  if (err) {
    console.log('Camera not ready: ' + err);
    return;
  }
  console.log('Camera ready');
}

// Tries to get the camera ready, and begins streaming video to the cameraEl element.
function startCamera() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  if (!navigator.getUserMedia) {
    cameraReady('getUserMedia not supported');
    return;
  }
  navigator.getUserMedia({ video: true },
    (stream) => {
      try {
        cameraEl.srcObject = stream;
      } catch (error) {
        cameraEl.srcObject = window.URL.createObjectURL(stream);
      }
      cameraReady();
    },
    (error) => {
      cameraReady(error);
    });
}
