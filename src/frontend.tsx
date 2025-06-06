/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./App";
import { createBrowserRouter, RouterProvider } from "react-router";
import Routes from "./routes/routes";
import Route from "./routes/routes/[id]";
let router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        path: "routes",
        Component: Routes,
      },
      {
        path: "routes/:id",
        Component: Route,
      },
    ],
  },
]);

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(<RouterProvider router={router} />);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}
