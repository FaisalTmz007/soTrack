const tf = require("@tensorflow/tfjs-node");
const model = "../machine_learning/model_config.json";

async function loadModel() {
  const loadedModel = await tf.loadLayersModel(`file://${model}`);
  return loadedModel;
}

async function modelPredict(data) {
  const model = await loadModel();
  const prediction = model.predict(data);
  return prediction;
}

module.exports = modelPredict;
