import React from "react";
import { Container } from "@material-ui/core";
import './index.css'
import NavBar from "./NavBar/NavBar";
import Home from "./Home/Home";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Auth from './Auth/Auth'
const App = () => {

  return (
    <BrowserRouter>
      <Container maxWidth="lg">
        <NavBar />
        <Routes>
          <Route path="/" exact element={<Home/>} />
          <Route path="/Auth" exact element={<Auth/>} />
        </Routes>
      </Container>
    </BrowserRouter>

  );
};

export default App;
