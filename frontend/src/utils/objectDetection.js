import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";

let model = null;

/**
 * Load Coco-SSD model
 */
export async function loadModel() {
  if (!model) {
    model = await cocoSsd.load();
    console.log("Coco-SSD model loaded");
  }
  return model;
}

/**
 * Detect objects in the given video element
 * @param {HTMLVideoElement} videoElement 
 * @returns Array of detected objects [{class, score, bbox}]
 */
export async function detectObjects(videoElement) {
  if (!model) await loadModel();

  // Perform detection
  const predictions = await model.detect(videoElement);

  // Filter relevant objects for proctoring
  const relevantObjects = predictions.filter(pred =>
    ["cell phone", "book", "laptop"].includes(pred.class) && pred.score > 0.5
  );

  return relevantObjects; // [{class: 'cell phone', score: 0.9, bbox: [...]}, ...]
}
