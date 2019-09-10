const cameraEl = document.getElementById('camera');
const canvasEl = document.getElementById('canvas');
// const thingEl = document.getElementById('thing');

const tracker = new clm.tracker();

let audio = document.querySelector('audio');
window.onload = function() {
  document.getElementById("audio").play();
}

// document.body.addEventListener('click', e => {
//   document.getElementById('canvas').classList.toggle('hidden');
// });

startCamera();

cameraEl.addEventListener('play', () => {
  // Resize everything to match the  video frame size
  canvasEl.width = cameraEl.videoWidth;
  canvasEl.height = cameraEl.videoWidth;
  cameraEl.width = cameraEl.videoWidth;
  cameraEl.height = cameraEl.videoHeight;

  // Initialise and start tracking
  tracker.init();
  tracker.start(cameraEl);

  // Process a frame
  window.requestAnimationFrame(renderFrame);
});


function renderFrame() {
  var c = canvasEl.getContext('2d');
  var p = tracker.getCurrentPosition();

  if (p) {
    // Got a tracked head!
    let eventData = processTrack(p);

    // Draw track data to canvas if canvas itself is visible
    if (!canvasEl.classList.contains('hidden')) {
      c.drawImage(cameraEl, 0, 0);
      tracker.draw(canvasEl);
    }

    // // Update the red thing
    // thingEl.style.transform = 'rotate(' + eventData.rotation + 'deg)';
    // thingEl.classList.remove('inactive');
    // thingEl.style.transform += ' scale(' + eventData.horiz * 10 + ',' + 10 * eventData.vert + ')';

    // Update UI labels (for debugging)
    document.getElementById('rotation').innerText = eventData.rotation.toString();
    document.getElementById('size').innerText =
      Math.floor(eventData.size * 100) + '%';
    document.getElementById('tracking').innerText = 'Yes';
    if(document.getElementById('tracking').innerText = 'Yes'){
      audio.play();
    }
  } else {
    // No tracking :(
    document.getElementById('tracking').innerText = 'No';
    document.getElementById('rotation').innerText = '';
    document.getElementById('size').innerText = '';
    //thingEl.classList.add('inactive');
    if(document.getElementById('tracking').innerText = 'No'){
      audio.pause();
    }
  }

  // Process next frame
  window.requestAnimationFrame(renderFrame);
}

function processTrack(p) {
  var eventData = {
    rotation: NaN,
    size: NaN,
    horiz: NaN,
    vert: NaN
  };

  // Use point 0 and 14, which correspond roughly to the sides of the face
  // See diagram on https://github.com/auduno/clmtrackr
  eventData.rotation = Math.floor(calcAngle(p[0], p[14]));

  if(eventData.rotation < -25){
    audio.playbackRate = 0.2;
  } else if(eventData.rotation < -10){
    audio.playbackRate = 0.5;
  } else if(eventData.rotation > 10){
    audio.playbackRate = 1.5;
  } else if(eventData.rotation > 25){
    audio.playbackRate = 2.0;
  } else {
    audio.playbackRate = 1;
  }

  // Use points 33 and 7 which correspond roughly to the top and bottom of face
  const vDistance = calcDistance(p[33], p[7]);
  // Get a ratio of vertical distance and canvas height
  eventData.vert = vDistance / canvasEl.height;

  // Points that correspond to sides
  const hDistance = calcDistance(p[1], p[13]);

  // Get a ratio of horizontal distance and canvas width
  eventData.horiz = hDistance / canvasEl.width;

  // Compute an overall relative size based on average of both
  eventData.size = (eventData.vert + eventData.horiz) / 2;
  console.log(eventData.size);
  
  if( Math.floor(eventData.size * 100) > 10 &&  Math.floor(eventData.size * 100) <= 15){
    audio.volume = 0.1;
  } else if( Math.floor(eventData.size * 100) > 15 &&  Math.floor(eventData.size * 100) <= 17){
    audio.volume = 0.2;
  } else if( Math.floor(eventData.size * 100) > 17 &&  Math.floor(eventData.size * 100) <= 20){
    audio.volume = 0.3;
  } else if( Math.floor(eventData.size * 100) > 20 &&  Math.floor(eventData.size * 100) <= 24){
    audio.volume = 0.4;
  } else if( Math.floor(eventData.size * 100) > 24 &&  Math.floor(eventData.size * 100) <= 28){
    audio.volume = 0.5;
  } else if( Math.floor(eventData.size * 100) > 28 &&  Math.floor(eventData.size * 100) <= 30){
    audio.volume = 0.6;
  } else if( Math.floor(eventData.size * 100) > 30 &&  Math.floor(eventData.size * 100) <= 34){
    audio.volume = 1;
  }
  
  return eventData;
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

// ------------------------
// Utility functions
// ------------------------

// Calculate distance between two coordinates, given as [x,y]
function calcDistance(a, b) {
  let x = b[0] - a[0];
  let y = b[1] - a[1];
  x = x * x;
  y = y * y;
  return Math.sqrt(x + y);
}

// Calculate angle between two coordinates, given as [x,y]
function calcAngle(a, b) {
  return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
}
