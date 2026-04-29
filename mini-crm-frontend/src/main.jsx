import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";

import App from "./App";
import theme from "./theme";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* BrowserRouter wraps everything so hooks like useNavigate work anywhere */}
    <BrowserRouter>
      {/* AuthProvider makes auth state available to every component */}
      <AuthProvider>
        {/* ThemeProvider injects our custom MUI theme */}
        <ThemeProvider theme={theme}>
          {/* CssBaseline: MUI's CSS reset + applies background colour */}
          <CssBaseline />
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
