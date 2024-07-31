import { Container, Grid, Grow } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getPosts } from "../actions/posts";
import Form from "../Form/Form";
import Posts from "../Posts/Posts";
import useStyles from "../Styles"

const Home = () => {
    const [currentId,setCurrentId] = useState(0);
    const classes = useStyles();
    const dispatch = useDispatch();
  
    useEffect(() => {
      dispatch(getPosts());
    }, [currentId,dispatch]);

    return(
  <Grow in>
    <Container>
      <Grid
        container
        justifyContent="space-between"
        alignitem="stretch"
        className={classes.mainContainer}
        spacing={3} >
        <Grid item xs={12} sm={7}>
          <Posts setCurrentId={setCurrentId} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Form currentId={currentId} setCurrentId={setCurrentId} />
        </Grid>
      </Grid>
    </Container>
  </Grow>
    )
}

export default Home;
