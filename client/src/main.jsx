import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./store.js";
import { ColorModeProvider } from "./theme.jsx";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <Provider store={store}>
            <ColorModeProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </ColorModeProvider>
        </Provider>
    </StrictMode>
);
