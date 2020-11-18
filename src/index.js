import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import Amplify, { Analytics } from "aws-amplify";
import config from "./aws-exports";
import { AmazonAIPredictionsProvider } from "@aws-amplify/predictions";

Amplify.configure(config);
Amplify.addPluggable(new AmazonAIPredictionsProvider());
Analytics.autoTrack("session", {
  enable: true,
  provider: "AWSPinpoint",
});
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
