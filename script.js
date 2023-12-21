let model;
const loadModel = async () => {
    console.log("Start model loading.");
    model = await tf.loadLayersModel("https://raw.githubusercontent.com/yhanyi/MNIST-Digits/main/model/model.json");
    console.log("Model loading complete.");
};
loadModel();

let isDrawing;
let posX = new Array();
let posY = new Array();
let dragArray = new Array();
document.getElementById("charts").innerHTML = "";
document.getElementById("charts").style.display = "none";

const drawingCanvas = document.getElementById("drawing-canvas");
const canvas = document.createElement("canvas");
const clearButton = document.getElementById("clear-button");
const predictButton = document.getElementById("predict-button");
canvas.setAttribute("width", 150);
canvas.setAttribute("height", 150);
canvas.setAttribute("id", "canvas");
canvas.style.backgroundColor = "black";
drawingCanvas.appendChild(canvas);

if (typeof G_vmlCanvasManager !== "undefined") {
    canvas = G_vmlCanvasManager.initElement(canvas);
}

ctx = canvas.getContext("2d");

function addMovement(x, y, isDrawing) {
    posX.push(x);
    posY.push(y);
    dragArray.push(isDrawing);
}

function drawCanvas() {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = "white";
    ctx.lineJoin = "round";
    ctx.lineWidth = 10;
    for (let i = 0; i < posX.length; i++) {
        ctx.beginPath();
        if (dragArray[i] && i) {
            ctx.moveTo(posX[i-1], posY[i-1]);
        } else {
            ctx.moveTo(posX[i]-1, posY[i]);
        }
        ctx.lineTo(posX[i], posY[i]);
        ctx.closePath();
        ctx.stroke();
    }
}

// Mouse Support
canvas.onmousedown = (e) => {
    let rect = canvas.getBoundingClientRect();
    let mouseX = e.clientX - rect.left;
    let mouseY = e.clientY - rect.top;
    isDrawing = true;
    addMovement(mouseX, mouseY);
    drawCanvas();
};

canvas.onmousemove = (e) => {
    if (isDrawing) {
        let rect = canvas.getBoundingClientRect();
        let mouseX = e.clientX - rect.left;
        let mouseY = e.clientY - rect.top;
        addMovement(mouseX, mouseY, true);
        drawCanvas();
    }
};

canvas.onmouseup = (e) => {
    isDrawing = false;
};

canvas.onmouseleave = (e) => {
    isDrawing = false;
};

// Touch support
canvas.addEventListener("touchstart", function (e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
    let rect = canvas.getBoundingClientRect();
    let touch = e.touches[0];
    let mouseX = touch.clientX - rect.left;
    let mouseY = touch.clientY - rect.top;
    isDrawing = true;
    addMovement(mouseX, mouseY);
    drawCanvas();
}, false);

canvas.addEventListener("touchmove", function (e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
    if (isDrawing) {
        let rect = canvas.getBoundingClientRect();
        let touch = e.touches[0];
        let mouseX = touch.clientX - rect.left;
        let mouseY = touch.clientY - rect.top;
        addMovement(mouseX, mouseY, true);
        drawCanvas();
    }
}, false);

canvas.addEventListener("touchend", function (e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
    isDrawing = false;
}, false);

canvas.addEventListener("touchleave", function (e) {
    if (e.target === canvas) {
        e.preventDefault();
    }
    isDrawing = false;
}, false);

// Clear canvas
clearButton.onclick = async () => {
    ctx.clearRect(0, 0, 150, 150);
    posX = new Array();
    posY = new Array();
    dragArray = new Array();
    $("predictions").empty();
};

// Process the canvas input as data
function processCanvas(image) {
    let input = tf.browser.fromPixels(image).resizeNearestNeighbor([28, 28]).mean(2).expandDims(2).expandDims().toFloat();
    console.log(input[0]);
    return input.div(255.0);
}

// Start predictions
predictButton.onclick = async () => {
    let raw_canvas = canvas.toDataURL();
    let input = processCanvas(canvas);
    console.log(input.shape);
    let predictions = await model.predict(input).data();
    console.log(predictions);
    let output = Array.from(predictions);
    console.log(output);
    displayChart(output);
    displayLabel(output);
};

let chart = "";
let first = 0;
function loadChart(label, data, selection) {
    let context = document.getElementById("charts").getContext("2d");
    chart = new Chart(context, {
        type: "bar",
        data: {
            labels: label,
            datasets: [{
                label: "Confidence",
                backgroundColor: "#000000",
                borderColor: "#ffffff",
                data: data
            }]
        },
        options: {}
    });
}

function displayChart(data) {
    let option = "CNN";
    labels = ["0","1","2","3","4","5","6","7","8","9"];
    if (first === 0) {
        loadChart(labels, data, option);
        first = 1;
    } else {
        chart.destroy();
        loadChart(labels, data, option);
    }
    document.getElementById("charts").style.display = "block";
}

function displayLabel(data) {
    let max = data[0];
    let maxIndex = 0;
    for (let i = 1; i < data.length; i++) {
        if (data[i] > max) {
            maxIndex = i;
            max = data[i];
        }
    }
    document.getElementById("predictions").innerHTML = "Predicting " + maxIndex + " with " + Math.trunc(max * 100) + "% confidence.";
}