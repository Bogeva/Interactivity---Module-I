const cameraEl = document.getElementById('camera');
const canvasEl = document.getElementById('captureCanvas');
const offscreenCanvasEl = document.getElementById('offscreenCanvas');

let oldFrame = null;
let oldFrameCapturedAt = 0;

let time = 0;

document.getElementById('btnCaptureCanvas').addEventListener('click', captureToCanvas);
document.getElementById('btnCaptureImg').addEventListener('click', captureToImg);

startCamera();

//create the video  --------------------------------
cameraEl.addEventListener('play', () => {
  console.log('Video stream started');
  offscreenCanvasEl.width = cameraEl.videoWidth;
  offscreenCanvasEl.height = cameraEl.videoHeight;
  canvasEl.width = cameraEl.videoWidth;
  canvasEl.height = cameraEl.videoHeight;
    
  // Start processing frames
  window.requestAnimationFrame(renderFrame);
});


//render the video --------------------------
function renderFrame() {
  let offscreenC = offscreenCanvasEl.getContext('2d');
  let c = canvasEl.getContext('2d');
    
  // 1. Capture to offscreen buffer
  offscreenC.drawImage(cameraEl, 0, 0);
  let frame = offscreenC.getImageData(0, 0, offscreenCanvasEl.width, offscreenCanvasEl.height);

  let totalPixels = frame.data.length / 4;   // 4 is used here since frame is represented as RGBA

  // Keep track of how many pixels have changed
  let diffCount = 0;
    
  // If we've already processed a frame, compare the new frame with it
  if (oldFrame !== null) {
    // Iterate over each pixel
    for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
      // Compare this pixel between two frames
      if (comparePixel(frame, oldFrame, pixelIndex)) {
        diffCount++; // Keep track of how many we find
      }
    }
  }

  //make sure the difference is enough   
  diffCount = 100 - Math.floor(100 * (diffCount / totalPixels));    
  if (diffCount<5 && diffCount>0.5) {
    time++;
  } else { time =0; }

  console.log(time);
  if (time == 5){
    captureToCanvas();
  }


    
  let now = Date.now();
  let keepFrame = true;

  // Remember last frame
  if (keepFrame) {
    oldFrame = frame;
    oldFrameCapturedAt = now;
  }

  // Repeat!
  window.requestAnimationFrame(renderFrame);
}


// Demonstrates capturing a frame as an IMG element
function captureToImg() {
  const imagesEl = document.getElementById('captureImages');
  const offscreenCanvasEl = document.getElementById('offscreenCanvas');

  // 1. First we have to capture to a hidden canvas
  offscreenCanvasEl.width = cameraEl.videoWidth;
  offscreenCanvasEl.height = cameraEl.videoHeight;
  var c = offscreenCanvasEl.getContext('2d');
  c.drawImage(cameraEl, 0, 0, cameraEl.videoWidth, cameraEl.videoHeight);

  // 2. Then we grab the data from the hidden canvas, and set it as the
  // source of a new IMG element
  var img = document.createElement('img');
  img.src = offscreenCanvasEl.toDataURL('image/jpeg');
  imagesEl.appendChild(img); // Add it to a DIV
}

// Demonstrates drawing a frame to a canvas
function captureToCanvas() {
  const canvasEl = document.getElementById('captureCanvas');
  canvasEl.width = cameraEl.videoWidth;
  canvasEl.height = cameraEl.videoHeight;
  var c = canvasEl.getContext('2d');
  c.drawImage(cameraEl, 0, 0, cameraEl.videoWidth, cameraEl.videoHeight);
}


// Function compares a pixel in two frames, returning true if-----------
// pixel is deemed to be equal------------------------------------------
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
    //if the diff is < 100 it only show edges, and so on
  if (diff < 30) return true;
  return false;
}

// ------------------------


// Reports outcome of trying to get the camera ready
function cameraReady(err) {
  if (err) {
    console.log('Camera not ready: ' + err);
    return;
  }
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
