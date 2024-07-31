import React, { useEffect, useState } from "react";
import { AppBar, Avatar, Button, Toolbar, Typography } from "@material-ui/core";
import memories from "../Images/memories.png";
import useStyles from "./Styles";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import decode from "jwt-decode";

const NavBar = () => {
  const classes = useStyles();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('profile')))
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  

  useEffect(() => {

    const token = user?.token

    //* JWT 
    if (token) {
      
      const decodeToken = decode(token)

      if (decodeToken.exp * 1000 < new Date().getTime()) logout()
    
      }
    
      setUser(JSON.parse(localStorage.getItem('profile')))

  }, [location, user?.token])

  const logout = () => {

    dispatch({ type: 'LOGOUT' })
    navigate('/Auth');
    setUser(null)
  }

  return (
    <>
      <AppBar className={classes.appBar} position="static" color="inherit">
        <div className={classes.brandContainer}>
          <Typography
            component={Link}
            to="/"
            variant="h2"
            className={classes.heading}
            align="center">
            Memories
          </Typography>
          <img
            src={memories}
            className={classes.image}
            alt="memories"
            height="60" />
        </div>

        <Toolbar className={classes.toolbar}>
          {user ? (
            <div className={classes.profile}>
              <Avatar
                className={classes.purple}
                alt={user.result.name}
                src={user.result.imageUrl}>

                {user.result.name.charAt(0)}
              
              </Avatar>
              <Typography className={classes.userName} variant="h6">
                {user.result.name}
              </Typography>
              <Button
                variant="contained"
                className={classes.logout}
                color="secondary"
                onClick={logout}>
                Logout
              </Button>
            </div>

          ) : (
            
            <Button
              component={Link}
              to="/auth"
              variant="contained"
              color="primary">
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </>
  );
};

export default NavBar;
