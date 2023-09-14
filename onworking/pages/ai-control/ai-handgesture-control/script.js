import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
const DEFAULT_ROBOT_PROFILE = "RPI_BW_001";
/**
 * ESP_CW_001
 * RPI_BW_001
 * RPI_CL_001
 * RPI_CL_002
 * RPI_CW_001
 * RPI_HA_001
 * RPI_HW_001
 * JTSN_HW_001
 */
const deviceNamePrefixMap = {
  ESP_CW_001: "CoPlay",
  RPI_BW_001: "BBC",
};
/**
 * Bluetooth 서비스 및 특성 UUID
 */
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const {
  pairButton,
  sendMediaServerInfoButton,
  openWebSocketButton,
  stopButton,
} = initializeDOMElements();
let {
  device,
  websocket,
  networkConfig,
  // gestureRecognizer,
  handLandmarker,
  model,
  runningMode,
  controlCommandMap,
  lastDirection,
} = initializeVariables();

function initializeDOMElements() {
  const pairButton = document.getElementById("pairButton");
  const sendMediaServerInfoButton = document.getElementById(
    "sendMediaServerInfoButton"
  );
  const openWebSocketButton = document.getElementById("openWebSocketButton");
  const stopButton = document.getElementById("stopButton");

  return {
    pairButton,
    sendMediaServerInfoButton,
    openWebSocketButton,
    stopButton,
  };
}

function initializeVariables() {
  let device;
  let websocket;
  let networkConfig = {};
  // let gestureRecognizer;
  let model;
  let runningMode = "IMAGE";
  let controlCommandMap = {
    0: "N",
    1: "W",
    2: "S",
    3: "E",
    4: "STOP",
  };
  let lastDirection;
  let handLandmarker;

  return {
    device,
    websocket,
    networkConfig,
    // gestureRecognizer,
    handLandmarker,
    model,
    runningMode,
    controlCommandMap,
    lastDirection,
  };
}

async function bluetoothPairing() {
  const robotSelect = document.getElementById("robotSelect");
  const robotNameInput = document.getElementById("robotNameInput");

  device = await connectToBluetoothDevice(
    deviceNamePrefixMap[robotSelect.value] ?? undefined
  );
  robotNameInput.value = device.name;
} //done dùng để lấy tên của robot và thực hiện kết nối bluetooth

function sendMediaServerInfo() {
  networkConfig = {
    ssid: "DaVincent",
    password: "13/1/2004",
    host: "agilertc.com",
    port: "8276",
    channel: "instant",
    channel_name: "zozit",
  };

  const devicePort =
    window.location.protocol.replace(/:$/, "") === "http"
      ? networkConfig.port
      : networkConfig.port - 1;

  if (device) {
    const metricData = {
      type: "metric",
      data: {
        server: {
          ssid: networkConfig.ssid,
          password: networkConfig.password,
          host: networkConfig.host,
          port: devicePort,
          path: `pang/ws/pub?channel=instant&name=${networkConfig.channel_name}&track=video&mode=bundle`,
        },
        profile: robotSelect.value,
      },
    };
    sendMessageToDeviceOverBluetooth(JSON.stringify(metricData), device);
  }
} // truyền thông tin qua bluetooth

function handleChunk(frame) {
  const canvasElement = document.getElementById("canvasElement");

  drawVideoFrameOnCanvas(canvasElement, frame);
  frame.close();
}

async function openWebSocket() {
  const videoElement = document.getElementById("videoElement");

  const path = `pang/ws/sub?channel=instant&name=${networkConfig.channel_name}&track=video&mode=bundle`;
  const serverURL = `${
    window.location.protocol.replace(/:$/, "") === "https" ? "wss" : "ws"
  }://${networkConfig.host}:${networkConfig.port}/${path}`;

  websocket = new WebSocket(serverURL);
  websocket.binaryType = "arraybuffer";
  websocket.onopen = async () => {
    if (device) {
      await getVideoStream({
        deviceId: device.id,
      }).then(async (stream) => {
        videoElement.srcObject = stream;
        await loadTrainedModel('http://127.0.0.1:5501/tfjs/model.json').then(() => {
        detectHandGestureFromVideo(model, stream);
        });
      });
    }

  displayMessage("Open Video WebSocket");
  const videoDecoder = new VideoDecoder({
    output: handleChunk,
    error: (error) => console.error(error),
  });

  const videoDecoderConfig = {
    codec: "avc1.42E03C",
  };

  if (!(await VideoDecoder.isConfigSupported(videoDecoderConfig))) {
    throw new Error("VideoDecoder configuration is not supported.");
  }

  videoDecoder.configure(videoDecoderConfig);

  websocket.onmessage = (e) => {
    try {
      if (videoDecoder.state === "configured") {
        const encodedChunk = new EncodedVideoChunk({
          type: "key",
          data: e.data,
          timestamp: e.timeStamp,
          duration: 0,
        });

        videoDecoder.decode(encodedChunk);
      }
    } catch (error) {
      console.error(error);
    }
  };
  keepWebSocketAlive(websocket);
  }
}
 // tạo server trung gian

function stop() {
  websocket.close();
  disconnectFromBluetoothDevice(device);
} // dừng kết nối

async function loadTrainedModel(modelPath) {
  try {
    model = await tf.loadLayersModel(modelPath);
    await createGestureRecognizer();

  } catch (error) {
    console.error('lỗi nha:', error);
  }
} // tạo model

async function createGestureRecognizer() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      delegate: "GPU"
    },
    runningMode: runningMode,
    numHands: 2
  });
} //tạo mediapipe handlandmark
async function detectHandGestureFromVideo(gestureRecognizer, stream) {
  const videoTrack = stream.getVideoTracks()[0];
  const capturedImage = new ImageCapture(videoTrack);
  let net;
  const runHandpose = async () =>{
     net = await handpose.load()
  }
  while (true) {
    await capturedImage.grabFrame().then( async (imageBitmap) =>{
      const handLandmarkerResult = handLandmarker.detect(imageBitmap);
      const inshape=handLandmarkerResult.landmarks;
      const resultArray = [[]]
      if (inshape.length!=0)
      {
        for (let i = 0; i < 21; i++) {
          const cx =inshape[0][i].x
          const cy =inshape[0][i].y
          resultArray[0].push(cx)
          resultArray[0].push(cy)
        }
        const answer=model.predict(tf.tensor(resultArray))
        const predictions = answer.dataSync();
        let maxNumber = predictions[0];
        let p;
        for (let i = 1; i < predictions.length; i++) {
          if (predictions[i] > maxNumber) {
            p = i;
          }
        }
        if (Object.keys(controlCommandMap).includes(String(p))) {
          const direction = controlCommandMap[String(p)];
          if (direction !== lastDirection) {
            lastDirection = direction;

            const controlCommand = {
              type: "control",
              direction,
            };
            if (websocket && websocket.readyState === WebSocket.OPEN) {
              websocket.send(JSON.stringify(controlCommand));
              displayMessage(`Send '${direction}' command`);
            }
          }
        }
       
      }
      // const input=inshape.flat()
      // const input_formatted = [input];
      // console.log(inshape);
      // console.log(input)
      // if (input_formatted[0].length==42)
      // {
      //   const answer=model.predict(tf.tensor(input_formatted))
      //   const predictions = answer.dataSync();
      //   console.log(predictions);
      // }    
      // else console.log("đù")
      // model.predict(tf.tensor(handLandmarkerResult.landmarks))
      // predictions = predictions.dataSync();
      // console.log =(predictions);
    });
      }
  }

async function connectToBluetoothDevice(deviceNamePrefix) {
  const options = {
    filters: [
      { namePrefix: deviceNamePrefix },
      { services: [UART_SERVICE_UUID] },
    ].filter(Boolean),
  };

  try {
    device = await navigator.bluetooth.requestDevice(options);
    console.log("Found Bluetooth device: ", device);

    await device.gatt?.connect();
    console.log("Connected to GATT server");

    return device;
  } catch (error) {
    console.error(error);
  }
} //done

function disconnectFromBluetoothDevice(device) {
  if (device.gatt?.connected) {
    device.gatt.disconnect();
  } else {
    console.log("Bluetooth Device is already disconnected");
  }
}//done

async function sendMessageToDeviceOverBluetooth(message, device) {
  const MAX_MESSAGE_LENGTH = 15;
  const messageArray = [];

  // Split message into smaller chunks
  while (message.length > 0) {
    const chunk = message.slice(0, MAX_MESSAGE_LENGTH);
    message = message.slice(MAX_MESSAGE_LENGTH);
    messageArray.push(chunk);
  }

  if (messageArray.length > 1) {
    messageArray[0] = `${messageArray[0]}#${messageArray.length}$`;
    for (let i = 1; i < messageArray.length; i++) {
      messageArray[i] = `${messageArray[i]}$`;
    }
  }

  console.log("Connecting to GATT Server...");
  const server = await device.gatt?.connect();

  console.log("Getting UART Service...");
  const service = await server?.getPrimaryService(UART_SERVICE_UUID);

  console.log("Getting UART RX Characteristic...");
  const rxCharacteristic = await service?.getCharacteristic(
    UART_RX_CHARACTERISTIC_UUID
  );

  // Check GATT operations is ready to write
  if (rxCharacteristic?.properties.write) {
    // Send each chunk to the device
    for (const chunk of messageArray) {
      try {
        await rxCharacteristic?.writeValue(new TextEncoder().encode(chunk));
        console.log(`Message sent: ${chunk}`);
      } catch (error) {
        console.error(`Error sending message: ${error}`);
      }
    }
  }
} //done

async function getVideoStream({
  deviceId,
  idealWidth,
  idealHeight,
  idealFrameRate,
}) {
  return navigator.mediaDevices.getUserMedia({
    video: deviceId
      ? {
          deviceId,
          width: { min: 640, ideal: idealWidth },
          height: { min: 400, ideal: idealHeight },
          frameRate: { ideal: idealFrameRate, max: 120 },
        }
      : true,
  });
}
function drawVideoFrameOnCanvas(canvas, frame) {
  console.log("drawing video frame on canvas");
  
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
}

function displayMessage(messageContent) {
  const messageView = document.getElementById("messageView");

  if (typeof messageContent == "object") {
    messageContent = JSON.stringify(messageContent);
  }
  messageView.innerHTML += `${messageContent}\n`;
  messageView.scrollTop = messageView.scrollHeight;
}

function keepWebSocketAlive(webSocket, interval) {
  const pingInterval = interval ?? 10000;
  let pingTimer;

  function sendPing() {
    if (webSocket.readyState === WebSocket.OPEN) {
      webSocket.send("ping");
    }
  }

  function schedulePing() {
    pingTimer = setInterval(sendPing, pingInterval);
  }

  function handlePong() {}

  function handleWebSocketClose() {
    clearInterval(pingTimer);
  }

  webSocket.addEventListener("open", () => {
    schedulePing();
  });

  webSocket.addEventListener("message", (event) => {
    if (event.data === "pong") {
      handlePong();
    }
  });

  webSocket.addEventListener("close", () => {
    handleWebSocketClose();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  pairButton.addEventListener("click", bluetoothPairing);
  sendMediaServerInfoButton.addEventListener("click", sendMediaServerInfo);
  openWebSocketButton.addEventListener("click", openWebSocket);
  stopButton.addEventListener("click", stop);
});
