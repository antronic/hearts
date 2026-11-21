import { render } from "solid-js/web";
import "./app.css";
import "./settings";
import { App } from "./App";
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });
render(() => <App />, document.getElementById("root")!);
