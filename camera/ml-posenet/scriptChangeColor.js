// @ts-nocheck
const cameraEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
const resultsEl = document.getElementById('results');
const poseColours = [];
var opacity = 0;
var scoreColor = 255; 

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

  // Start processing!
  window.requestAnimationFrame(process);
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

function processPoses(poses) {
  // For debug purposes, draw points
  drawPoses(poses);


  // Demo of using position:
  //  Calculates a 'slouch factor' - difference in Y between left/right shoulders
  /*if (poses.length == 1 && poses[0].score > 0.3) {
    const leftShoulder = getKeypointPos(poses, 'leftShoulder');
    const rightShoulder = getKeypointPos(poses, 'rightShoulder');
    if (leftShoulder != null && rightShoulder != null) {
      const slouchFactor = Math.floor(Math.abs(leftShoulder.y - rightShoulder.y));
      opacity = slouchFactor/130;

      var c = canvasEl.getContext('2d');
      c.fillStyle = 'black';
      c.fillText('Slouch factor: ' + slouchFactor, 100, 10);
    }
  }*/

  //  Calculates a 'head tilt factor' - difference in Y between left/right ears
  /*if (poses.length == 1 && poses[0].score > 0.3) {
    const leftEar = getKeypointPos(poses, 'leftEar');
    const rightEar = getKeypointPos(poses, 'rightEar');
    if (leftEar != null && rightEar != null) {
      const headTilt = Math.floor(Math.abs(leftEar.y - rightEar.y));

      var c = canvasEl.getContext('2d');
      c.fillStyle = 'black';
      c.fillText('Head tilt factor: ' + headTilt, 200, 10);
    }
  }*/

  function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

  //  Calculates a 'hands distance' - difference in Y between left/right ears
  if (poses.length == 1 && poses[0].score > 0.3) {
    const leftWrist = getKeypointPos(poses, 'leftWrist');
    const rightWrist = getKeypointPos(poses, 'rightWrist');
    if (leftWrist != null && rightWrist != null) {
      const handsDistance = Math.floor(Math.abs(leftWrist.x - rightWrist.x));
      const handsHeight = Math.floor(Math.abs(leftWrist.y - rightWrist.y));
      const haaaaaands = Math.floor(Math.abs((leftWrist.y - rightWrist.y)+(leftWrist.x - rightWrist.x)));

      // opacity = map_range(handsDistance, 0, 500, 0, 255);
      if(handsHeight > 20 && handsHeight <= 50){
        colorBox.style.backgroundColor = "#E1F5FE";
      }else if(handsHeight>50 && handsHeight <= 80){
        colorBox.style.backgroundColor = "#B3E5FC";
      }else if(handsHeight>80 && handsHeight <= 110){
        colorBox.style.backgroundColor = "#81D4FA";
      }else if(handsHeight>110 && handsHeight <= 150){
        colorBox.style.backgroundColor = "#4FC3F7";
      }else if(handsHeight>150 && handsHeight <= 180){
        colorBox.style.backgroundColor = "#29B6F6";
      }else if(handsHeight>180 && handsHeight <= 210){
        colorBox.style.backgroundColor = "#03A9F4";
      }else if(handsHeight>210){
        colorBox.style.backgroundColor = "#039BE5";
      }
    
      var c = canvasEl.getContext('2d');
      c.fillStyle = 'pink';
      c.fillText('hands width: ' + handsDistance, 300, 10);
      c.fillText('hands height: ' + handsHeight, 200, 10);
      c.fillText('hands: ' + haaaaaands, 100, 10);
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
  c.fillStyle = 'rgba('+scoreColor+',255,255,'+opacity+')';
  c.fillRect(0, 0, cameraEl.videoWidth, cameraEl.videoHeight);

  // Draw each detected pose
  for (var i = 0; i < poses.length; i++) {
    drawPose(i, poses[i], c);
  }

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
  

  scoreColor = (pose.score*1.5)*255;
  console.log(scoreColor);

  // Draw prediction info
  c.textBaseline = 'top';
  c.fillStyle = colour;
  c.fillText(Math.floor(pose.score * 100) + '%', 10, (index * 20) + 10);

  // Draw each pose part
  pose.keypoints.forEach(kp => {
    // Draw a dot for each keypoint
    c.beginPath();
    c.arc(kp.position.x, kp.position.y, 5, 0, 2 * Math.PI);
    c.fill();

    // Draw the keypoint's score (not very useful)
    //c.fillText(Math.floor(kp.score * 100) + '%', kp.position.x + 7, kp.position.y - 3);

    // Draw name of keypoint
    c.fillText(kp.part, kp.position.x - 3, kp.position.y + 6);
  });
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
