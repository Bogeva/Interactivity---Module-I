// Adapted from https://github.com/auduno/clmtrackr/blob/dev/examples/clm_emotiondetection.html
const cameraEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
const resultsEl = document.getElementById('results');
const tracker = new clm.tracker();
const classifier = new emotionClassifier();

var mood = [0, 0, 0, 0, 0, 0];
var finalMood = 0;

startCamera();

cameraEl.addEventListener('play', () => {
  // Resize everything to match to video frame size
  canvasEl.width = cameraEl.videoWidth;
  canvasEl.height = cameraEl.videoHeight;
  cameraEl.width = cameraEl.videoWidth;
  cameraEl.height = cameraEl.videoHeight;

  // Set up classifier & model
  pModel.shapeModel.nonRegularizedVectors.push(9);
  pModel.shapeModel.nonRegularizedVectors.push(11);
  classifier.init(emotionModel);

  // Set up tracker
  tracker.init(pModel);
  tracker.start(cameraEl);

  // Start monitoring frames
  window.requestAnimationFrame(renderFrame);
});



function renderFrame() {
  var c = canvasEl.getContext('2d');
  var p = tracker.getCurrentPosition();
  if (!p) {
    window.requestAnimationFrame(renderFrame);
    return; // Tracker not tracking yet
  }

  // Optional visual feedback of tracker
  c.drawImage(cameraEl, 0, 0);
  tracker.draw(canvasEl);

  var cp = tracker.getCurrentParameters();
  var er = classifier.meanPredict(cp);
  if (er) {
    updateData(er);
  }
    
  finalMood = (mood[5] - mood[0] - mood[1] - mood[2] - mood[3] - mood[4])/2;
  if (finalMood < 0) {
    finalMood = 0;
  }
    
  let frame = c.getImageData(0, 0, canvasEl.width, canvasEl.height);

  let totalPixels = frame.data.length / 4; // Get total number of pixels by dividing by 4 (since each pixel uses 4 values)
  for (let pixelIndex = totalPixels; pixelIndex > totalPixels-(finalMood*500); pixelIndex--) {
    let r = frame.data[pixelIndex * 4 + 0];
    let g = frame.data[pixelIndex * 4 + 1];
    let b = frame.data[pixelIndex * 4 + 2];
    
    r = frame.data[pixelIndex * 4 + 0] = r+50;
    g = frame.data[pixelIndex * 4 + 1] = (r+g+b)/3;
    b = frame.data[pixelIndex * 4 + 2] = (r+g+b)/2;
  }

  // Draw something in the background so effect is obvious
  var gradient = c.createLinearGradient(0, 0, canvasEl.width, canvasEl.height);
  gradient.addColorStop(0, 'deeppink');
  gradient.addColorStop(1, 'palegreen');
  c.fillStyle = gradient;
  c.fillRect(0, 0, canvasEl.width, canvasEl.height);

  c.putImageData(frame, 0, 0);

  c.drawImage(canvasEl, 0, 0);

  // Repeat!
  window.requestAnimationFrame(renderFrame);

}

function updateData(er) {
  var r = '';
  for (var i = 0; i < er.length; i++) {
    // Simplify to an integer
    er[i].value = parseInt(er[i].value * 100);

    // Construct some HTML to show results
    r += '<span class="result"><span class="label';
    if (er[i].value > 50) {
      r += ' highlight';
      mood[i]++;
      //console.log(mood);
    }
    r += '">' + er[i].emotion + '</span> <span class="value">' + er[i].value + '</span></span>';
  }
  resultsEl.innerHTML = r;
}

function positionLoop() {
  requestAnimationFrame(positionLoop);
  var positions = tracker.getCurrentPosition();
    // positions = [[x_0, y_0], [x_1,y_1], ... ]
    // do something with the positions ...

  if (positions) {
    var positionString0 = 'featurepoint '+0+' : ['+positions[0][0].toFixed(2)+','+positions[0][1].toFixed(2)+']';
    var positionString14 = 'featurepoint '+14+' : ['+positions[14][0].toFixed(2)+','+positions[14][1].toFixed(2)+']';
    var positionString33 = 'featurepoint '+33+' : ['+positions[33][0].toFixed(2)+','+positions[33][1].toFixed(2)+']';
    var positionString7 = 'featurepoint '+7+' : ['+positions[7][0].toFixed(2)+','+positions[7][1].toFixed(2)+']';
    var faceWidth = 'width :' +(positions[14][0].toFixed(2) - positions[0][0].toFixed(2));
    var faceHeight = 'height :' +(positions[7][0].toFixed(2) - positions[33][0].toFixed(2));
    //console.log(faceWidth);
    //console.log(faceHeight);
  }
}
positionLoop();

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
  const constraints = {
    audio: false,
    video: { width: 640, height: 480 }
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      cameraEl.srcObject = stream;
      cameraReady();
    })
    .catch(function (err) {
      cameraReady(err); // Report error
    });
}
