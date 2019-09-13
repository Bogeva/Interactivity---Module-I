const cameraEl = document.getElementById('camera');
const canvasEl = document.getElementById('captureCanvas');
const offscreenCanvasEl = document.getElementById('offscreenCanvas');
const rectangle1 = document.getElementById('rectangle1');

let oldFrame = null;
let oldFrameCapturedAt = 0;

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

  let diffCount = 0;
  let brightCount = 0;

  // Frame data is one giant array of red, green, blue and alpha values per pixel.
  // R G B A R G B A R G B A ... (that's three pixels)

  let totalPixels = frame.data.length / 4; // Get total number of pixels by dividing by 4 (since each pixel uses 4 values)

  // If we've already processed a frame, compare the new frame with it
  if (oldFrame !== null) {
    // Iterate over each pixel
    for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
      // This shows you how to get the RGB values.
      let r = frame.data[pixelIndex * 4 + 0];
      let g = frame.data[pixelIndex * 4 + 1];
      let b = frame.data[pixelIndex * 4 + 2];
        
      let grey = (r+g+b)/3; // if grey is zero then it's white, if 255 black
        
      
      // If amount of brightness is less than 180 (out of 255), set the pixel to pink
      if (grey > 150) {
        if (wasPinkOrNot(oldFrame, pixelIndex)) {
          diffCount++; // Keep track of how many we find
        }

        frame.data[pixelIndex * 4 + 0] = 250;
        frame.data[pixelIndex * 4 + 1] = 150;
        frame.data[pixelIndex * 4 + 2] = 200;
        brightCount++;

      } else if (wasPinkOrNot(oldFrame, pixelIndex) == false) { 
        diffCount++;
      }
    }
  }
    
  // Write our modified frame back to the buffer
  offscreenC.putImageData(frame, 0, 0);

  // Draw buffer to the visible canvas
  c.drawImage(offscreenCanvasEl, 0, 0);

  // Give a numerical readout of proportion of pixels that have changed
  let brightness = Math.floor(100 * (brightCount / totalPixels));
  let difference = Math.floor(100 * (diffCount / totalPixels));

  c.fillStyle = 'white';
  c.font = '28px "Fira Code", Monaco, "Andale Mono", "Lucida Console", "Bitstream Vera Sans Mono", "Courier New", Courier, monospace';
  c.fillText(difference + '%', 100, 100);
  c.fillText(brightness + '%', 200, 100);

  let now = Date.now();
  let keepFrame = true;

  // At the moment we always compare to the last frame from the camera,
  // but we could make a logic so comparison frames are only kept every second, for example:
  if (now-oldFrameCapturedAt < 500) keepFrame = false;

  // Or, this only keeps the first frame and never updates it
  // if (oldFrame !== null) keepFrame = false;

  // Remember last frame
  if (keepFrame) {
    oldFrame = frame;
    oldFrameCapturedAt = now;
  }

  // Repeat!
  window.requestAnimationFrame(renderFrame);
}

// Function compares a pixel in two frames, returning true if
// pixel is deemed to be equal
function comparePixel(frameA, frameB, i) {
  let rA = frameA.data[i * 4 + 0];
  let gA = frameA.data[i * 4 + 1];
  let bA = frameA.data[i * 4 + 2];
  let bwA = (rA + gA + bA) / 3.0; // B&W value

  let rB = frameB.data[i * 4 + 0];
  let gB = frameB.data[i * 4 + 1];
  let bB = frameB.data[i * 4 + 2];
  let bwB = (rB + gB + bB) / 3.0; // B&W value

  // Compare B&W values
  // Use Math.abs to make negative values positive
  // (we don't care if the new value is higher or lower, just that it's changed)
  let diff = Math.abs(bwA - bwB);
  if (diff < 5) return true;
  return false;
}

// Function compares a pixel in two frames, returning true if
// pixel is deemed to be equal
function wasPinkOrNot(frameA, i) {
  let rA = frameA.data[i * 4 + 0];
  let gA = frameA.data[i * 4 + 1];
  let bA = frameA.data[i * 4 + 2];

  if (rA!=250 || gA!=150 || bA!=200) return true;
  return false;
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
