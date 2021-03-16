import './App.css';
import * as tf from '@tensorflow/tfjs';
import soundmp3 from './Xe.wav';
import React, { useEffect, useRef } from 'react';
import {Howl} from 'howler';
const mobilenet = require('@tensorflow-models/mobilenet');
const knnClassifier = require('@tensorflow-models/knn-classifier');

// var sound = new Howl({
//   src: [soundmp3]
// });

// sound.play();

const NOT_TOUCH_LABEL = 'not_touch';
const TOUCHED_LABEL = 'touched';
const TRAINING_TIMES = 50;

function App() {
  const video = useRef();
  const classifier = useRef();
  const mobilenetModule = useRef();

  const init = async () => {
      console.log('init...');
      await setupCamera();
      console.log('set up camera success');
      classifier.current = knnClassifier.create();
      mobilenetModule.current = await mobilenet.load();
      console.log('set up done');
      console.log('khong cham tay len mat va bam train 1');
  }

  const setupCamera = () => {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia;

      if (navigator.getUserMedia) {
        navigator.getUserMedia(
          { video: true },
          stream => {
            video.current.srcObject = stream;
            video.current.addEventListener('loadeddata', resolve)
          },
          error => reject(error)
        );
      } 
      else {
        reject();
      }
    });
  }

  const train = async label => {
    console.log(label);
    for(let i = 0; i < TRAINING_TIMES; ++i) {
      console.log('Progress');
      
      await training(label);
    }
  }

  const training = label => {
    return new Promise(async resolve => {
      const embedding = mobilenetModule.current.infer(
        video.current,
        true
      );
      classifier.current.addExample(embedding, label);
      await sleep(100);
      resolve();
    });
  }

  const run = async () => {
    const embedding = mobilenetModule.current.infer(
      video.current,
      true
    );
    const result = await classifier.current.predictClass(embedding);

    console.log('Label: ', result.label);
    console.log('COnfidence: ', result.confidences);

    await sleep(200);

    run();
  }

  const sleep = (ms = 0) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  useEffect(() => {
    init();
    return () => {

    }
  }, []);
  return (
    <div className="main">
      <video
        ref = {video}
        className="video"
        autoPlay
      />

      <div className="control">
        <button className="btn" onClick={() => train(NOT_TOUCH_LABEL)}>Train 1</button>
        <button className="btn" onClick={() => train(TOUCHED_LABEL)}>Train 2</button>
        <button className="btn" onClick={() => run()}>Run</button>
      </div>
    </div>
  );
}

export default App;
