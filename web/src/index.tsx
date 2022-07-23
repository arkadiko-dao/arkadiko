import * as React from 'react';
import './index.css';
import { App } from '../components/app';
import { BrowserRouter } from 'react-router-dom';
import ReactDOM from "react-dom/client";

const render = () => {
  const root = ReactDOM.createRoot(document.getElementById("app-root"));
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
};

render();
