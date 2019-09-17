// @ts-nocheck
const cameraEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
const resultsEl = document.getElementById('results');
const offscreenCanvasEl = document.getElementById('offscreenCanvas');
let backgroundBox = document.getElementById("background");
const poseColours = [];
var opacity = 0;
var scoreColor = 255; 
var scoreColor2 = 255;
let rangeOfPeople;

let colorBox = document.getElementById("myDiv");

document.getElementById('btnFreeze').addEventListener('click', evt => {
  if (cameraEl.paused) {
    cameraEl.play();
  } else {
    cameraEl.pause();
  }
});

console.log('Loading posenet model')

// See docs for info on these parameters
// https://github.com/tensorflow/tfjs-models/tree/master/posenet
let model = null;
posenet.load({
  architecture: 'ResNet50',
  outputStride: 32,
  inputResolution: 257,
  quantBytes: 4
}).then(m => {
  model = m;
  console.log('Model loaded, starting camera');
  startCamera();
})



cameraEl.addEventListener('play', () => {
  // Resize canvas to match camera frame sie
  canvasEl.width = cameraEl.videoWidth;
  canvasEl.height = cameraEl.videoHeight;

  offscreenCanvasEl.width = cameraEl.videoWidth;
  offscreenCanvasEl.height = cameraEl.videoHeight;

  // Start processing!
  window.requestAnimationFrame(process);

  //call render frame
  window.requestAnimationFrame(renderFrame);
});

// Processes the last frame from camera
function process() {
  model.estimateMultiplePoses(canvasEl, {
    flipHorizontal: false,
    maxDetections: 5, /* max # poses */
    scoreThreshold: 0.5,
    nmsRadius: 20
  }).then(processPoses); /* call processPoses with result */
}

function renderFrame() {
  let offscreenC = offscreenCanvasEl.getContext('2d');
  let c = canvasEl.getContext('2d');

  // 1. Capture to offscreen buffer
  offscreenC.drawImage(cameraEl, 0, 0);

  // 2. Read the pixel data from this buffer
  let frame = offscreenC.getImageData(0, 0, offscreenCanvasEl.width, offscreenCanvasEl.height);

  let blueCount = 0;


  let totalPixels = frame.data.length / 4; // Get total number of pixels by dividing by 4 (since each pixel uses 4 values)
  
  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex++) {
    let r = frame.data[pixelIndex * 4 + 0];
    let g = frame.data[pixelIndex * 4 + 1];
    let b = frame.data[pixelIndex * 4 + 2];

    let grey = (r+g+b)/3;
    if (grey < 150) { 
      // frame.data[pixelIndex * 4 + 3] = 0;
      blueCount++;
    }
    if(b < 50){
      frame.data[pixelIndex * 4 + 2]=0;
    }
  }

  // % of image that is 'blue enough'
  let blueValue = 100 - Math.floor(100 * (blueCount / (frame.data.length / 4)));
  rangeOfPeople = Math.floor(map_range(blueValue,0,100,2,5));
  console.log(rangeOfPeople);

  // turn the rectangle from white to black depending on the brightness of the room
  colorBox.style.backgroundColor='rgb('+blueValue*2.55+','+blueValue*2.55+','+blueValue*2.55+')';
  
    
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

function map_range(value, low1, high1, low2, high2) {
  return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function processPoses(poses) {
  // For debug purposes, draw points
  drawPoses(poses);

  //  Calculates a 'hands distance' - difference in Y between left/right ears
  if (poses.length == rangeOfPeople && poses[0].score > 0.3) {
    for(y=0; y< poses.length; y++){
      const leftWrist = getKeypointPos(poses, 'leftWrist');
      const leftEar = getKeypointPos(poses, 'leftEar');
      // console.log(leftWrist, leftEar);
      if (leftWrist != null && leftEar != null) {
        const closeness = Math.floor(Math.abs(leftWrist.x - leftEar.x));
        
        if(closeness <= 50){
          console.log('hi');
          backgroundBox.style.backgroundColor = "blue";
        } else if (closeness > 50 && closeness <= 80){
          backgroundBox.style.backgroundColor = 'cyan';
        } else if (closeness > 80 && closeness <= 110){
          backgroundBox.style.backgroundColor = 'pink';
        } else if (closeness >110 && closeness <= 150){
          backgroundBox.style.backgroundColor = 'turquoise';
        }
      }
    }
  }


  // Repeat, if not paused
  if (cameraEl.paused) {
    console.log('Paused processing');
    return;
  }
  window.requestAnimationFrame(process);
}

// Helper function to get a named keypoint position
function getKeypointPos(poses, name, poseIndex = 0) {
  // Don't return a value if overall score is low
  if (poses.score < 0.3) return null;
  if (poses.length < poseIndex) return null;

  const kp = poses[poseIndex].keypoints.find(kp => kp.part == name);
  if (kp == null) return null;
  return kp.position;
}

function drawPoses(poses) {
  // Draw frame to canvas
  var c = canvasEl.getContext('2d');
  c.drawImage(cameraEl, 0, 0, cameraEl.videoWidth, cameraEl.videoHeight);

  // Fade out image
  c.fillStyle = 'rgba('+scoreColor+','+scoreColor2+',255,'+opacity+')';
  //console.log(c.fillStyle);
  c.fillRect(0, 0, cameraEl.videoWidth, cameraEl.videoHeight);

  // Draw each detected pose
  // for (var i = 0; i < poses.length; i++) {
  //   drawPose(i, poses[i], c);
  // }

  // If there's no poses, draw a warning
  if (poses.length == 0) {
    c.textBaseline = 'top';
    c.fillStyle = 'red';
    c.fillText('No poses detected', 10, 10);
  }
}

// Draws debug info for each detected pose
function drawPose(index, pose, c) {
  // Lookup or generate random colour for this pose index
  if (!poseColours[index]) poseColours[index] = getRandomColor();
  const colour = poseColours[index];
  
 
  opacity = map_range(pose.score, 0, 0.6, 0, 1);
  //console.log(scoreColor);

  // Draw prediction info
  c.textBaseline = 'top';
  c.fillStyle = colour;
  c.fillText(Math.floor(pose.score * 100) + '%', 10, (index * 20) + 10);

}
  

// ------------------------
function getRandomColor() {
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

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
  navigator.getUserMedia({ video: { width: 640, height: 480 }, audio: false },
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
