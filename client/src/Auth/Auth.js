import React, { useState } from "react";
import {
  Typography,
  Avatar,
  Container,
  Paper,
  Grid,
  Button,
} from "@material-ui/core";

import { GoogleLogin } from "react-google-login";
import useStyles from "./Styles";
import Input from "./Input";
import Icon from "./Icon";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {signUp,signIn} from "../actions/auth"

const initialState = {firstName:'',lastName:'',email:'',password:'',confirmPassword:''}

const Auth = () => {

  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignUp] = useState(false);
  const [formdata,setFormData] = useState(initialState);
  const dispatch = useDispatch();
  const classes = useStyles();
  const navigate = useNavigate();
 

  const handleSubmit = (e) => {

    e.preventDefault();

    if(isSignup) {
        dispatch(signUp(formdata,navigate));
    }else{
      dispatch(signIn(formdata,navigate));
    }

  };

  const handleChange = (e) => {

    setFormData({...formdata,[e.target.name]:e.target.value});


  };

  const handleShowPassword = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  const switchMode = () => {
    setIsSignUp((previsSignUp) => !previsSignUp);
    setShowPassword(false);
  };

  const googleSuccess = async (res) => {
    const result = res?.profileObj;
    const token = res?.tokenId;

    

    try {
      dispatch({ type: "AUTH", data: { result, token } });

      navigate('/');

    } catch (error) {
      console.log(error);
    }
  };
  const googleFailure = (error) => {
    console.log(error);
    console.log("Google SignIn was Failed");
  };

  return (
    <>
      <Container component="main" maxWidth="xs">
        <Paper className={classes.paper} elevation={3}>
          <Avatar className={classes.avatar}>
           
          </Avatar>
          <Typography variant="h5">
            {isSignup ? "Sign Up" : "Sign In"}
          </Typography>
          <form className={classes.form} onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {isSignup && (
                <>
                  <Input
                    name="firstName"
                    label="FirstName"
                    handleChange={handleChange}
                    autoFocus
                    half
                  />
                  <Input
                    name="lastName"
                    label="LastName"
                    handleChange={handleChange}
                    half
                  />
                </>
              )}
              <Input
                name="email"
                label="Email Address"
                handleChange={handleChange}
                type="email"
              />
              <Input
                name="password"
                label="Password"
                handleChange={handleChange}
                type={showPassword ? "text" : "password"}
                handleShowPassword={handleShowPassword}
              />
              {isSignup && (
                <Input
                  name="confirmPassword"
                  label="Repeat Password"
                  handleChange={handleChange}
                  type="password"
                />
              )}
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              {isSignup ? "Sign Up " : "Sign In"}
            </Button>
            <GoogleLogin
              clientId="191325905115-li6v73fgjsoqiv4p7cank7d4inns2lj5.apps.googleusercontent.com"
              render={(renderProps) => (
                <Button
                  className={classes.googleButton}
                  color="primary"
                  fullWidth
                  onClick={renderProps.onClick}
                  disabled={renderProps.disabled}
                  startIcon={<Icon />}
                  variant="contained">
                  Google Sign In
                </Button>
              )}

              onSuccess={googleSuccess}
              onFailure={googleFailure}
              cookiePolicy="single_host_origin"/>

            <Grid container justifyContent ="center">
              <Grid item>
                <Button onClick={switchMode}>
                  {isSignup
                    ? "Already have an account? Sign In "
                    : "Don't have an account? Sign Up "}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Container>
    </>
  );
};

export default Auth;
