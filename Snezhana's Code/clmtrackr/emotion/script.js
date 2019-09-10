// Adapted from https://github.com/auduno/clmtrackr/blob/dev/examples/clm_emotiondetection.html
const cameraEl = document.getElementById("camera");
const canvasEl = document.getElementById("canvas");
const resultsEl = document.getElementById("results");
const tracker = new clm.tracker();
const classifier = new emotionClassifier();

const imgCanvas = document.getElementById("pictureCanvas").getContext("2d");
// Setting up the images
let img1 = new Image(); //happy
let img2 = new Image(); //sad
let img3 = new Image(); // mad
let img4 = new Image(); // surprised

// setting up the images's sources
img1.src =
  "https://images.squarespace-cdn.com/content/5c43e8e09d5abb9b2799f576/1550479298809-X3LL556UT0Q1BNJ2EJ52/Stay+Happy+Logo+waves.png?format=1500w&content-type=image%2Fpng";
img2.src =
  "https://media.tenor.com/images/6342f6ad18545ad726a4e2116b4486c2/tenor.gif";
img3.src = "https://thumbs.gfycat.com/WelloffSameBats-size_restricted.gif";
img4.src =
  "https://pics.me.me/my-surprised-cat-melissa-who-cant-believe-what-she-just-32309737.png";

// tab fill
let block1 = document.getElementById("1");
let block2 = document.getElementById("2");
let block3 = document.getElementById("3");
let block4 = document.getElementById("4");

let happyCounter = 0;

startCamera();

cameraEl.addEventListener("play", () => {
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
  var c = canvasEl.getContext("2d");
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

  // Repeat!
  window.requestAnimationFrame(renderFrame);
}

function updateData(er) {
  var r = "";
  for (var i = 0; i < er.length; i++) {
    // Simplify to an integer
    er[i].value = parseInt(er[i].value * 100);

    // Construct some HTML to show results
    r += '<span class="result"><span class="label';
    if (er[i].value > 50) {
      r += " highlight";
      if (er[i].emotion == "happy") {
        imgCanvas.drawImage(img1, 100, 100, 150, 150);
        imgCanvas.clearRect(0, 0, 100, 100);
        happyCounter++;
        console.log(happyCounter);
        if (happyCounter > 25) {
          block01();
        } else if (happyCounter > 50) {
          block02();
        }
      } else if (er[i].emotion == "sad") {
        imgCanvas.clearRect(0, 0, 100, 100);
        imgCanvas.drawImage(img2, 100, 100, 150, 150);
      } else if (er[i].emotion == "angry") {
        imgCanvas.drawImage(img3, 100, 100, 150, 150);
      } else if (er[i].emotion == "surprised") {
        imgCanvas.drawImage(img4, 100, 100, 150, 150);
      } else {
        console.log("I got here");
        imgCanvas.clearRect(0, 0, 100, 100);
      }
    }
    r +=
      '">' +
      er[i].emotion +
      '</span> <span class="value">' +
      er[i].value +
      "</span></span>";
  }
  resultsEl.innerHTML = r;
}

function block01() {
  block1.style.backgroundColor = "rgb(222, 194, 254)";
  block2.style.backgroundColor = "rgb(255, 255, 255)";
  block3.style.backgroundColor = "rgb(255, 255, 255)";
  block4.style.backgroundColor = "rgb(255, 255, 255)";
}

function block02() {
  block1.style.backgroundColor = "rgb(222, 194, 254)";
  block2.style.backgroundColor = "rgb(212, 174, 240)";
  block3.style.backgroundColor = "rgb(255, 255, 255)";
  block4.style.backgroundColor = "rgb(255, 255, 255)";
}

// ------------------------
// Reports outcome of trying to get the camera ready
function cameraReady(err) {
  if (err) {
    console.log("Camera not ready: " + err);
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
    .then(function(stream) {
      cameraEl.srcObject = stream;
      cameraReady();
    })
    .catch(function(err) {
      cameraReady(err); // Report error
    });
}
