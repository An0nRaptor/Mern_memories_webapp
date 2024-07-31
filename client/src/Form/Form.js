import React, { useState,useEffect } from "react";
import { Paper, TextField, Button, Typography } from "@material-ui/core";
import useStyles from "./Styles";
import FileBase from 'react-file-base64';
import {useDispatch} from 'react-redux';
import {createPost,updatePost} from '../actions/posts';
import { useSelector } from "react-redux";




const Form = ({currentId,setCurrentId}) => {

  const [postData, setpostData] = useState({ title: "", message: "", tags: "",selectedFile: "",});
  const classes = useStyles();
  const dispatch = useDispatch();
  const user = JSON.parse(localStorage.getItem('profile'))
  
  //! actual posts is here
  const post = useSelector((state)=>currentId ? state.posts.find((p)=>p._id === currentId) : null)

  const handleSubmit =async (e) => {

    e.preventDefault()

    if(currentId===0){

      dispatch(createPost({...postData,name:user?.result?.name}))
      clear()
    
    }else{

      dispatch(updatePost(currentId,{...postData,name:user?.result?.name})) 
      clear()
    }

  };

  useEffect(()=>{

  if(post) setpostData(post)

  },[post])

  const clear = () => {
    setCurrentId(0)
    setpostData({
    title: "",
    message: "",
    tags: "",
    selectedFile: ""})
  };

  if(!user?.result?.name){ 
    return(
      <Paper className={classes.paper}>
        <Typography variant="h6" align="center" >
              Please Sign In to create your own memories and like other's memories.
        </Typography>
      </Paper>
    )
  }

  return (
    <>
      <Paper>
        <form
          autoComplete="off"
          noValidate
          className={`${classes.root} ${classes.form}` }
          onSubmit={handleSubmit}>
          <Typography variant="h6">{currentId ? 'Editing  ': 'Creating'} a Memory</Typography>
          <TextField  fullWidth  name="title" variant="outlined" label="Title"  value={postData.title} onChange={(e) => setpostData({...postData,title:e.target.value})}/>
          <TextField  fullWidth  name="message" variant="outlined" label="Message"  value={postData.message} onChange={(e) => setpostData({...postData,message:e.target.value})}/>
          <TextField  fullWidth  name="tags" variant="outlined" label="Tags"  value={postData.tags} onChange={(e) => setpostData({...postData,tags:e.target.value.split(",")})}/>
          <div className={classes.fileInput}>
          <FileBase type="file" multiple={false} onDone={({base64})=>setpostData({...postData,selectedFile:base64})}/>
          </div>
          <Button className={classes.buttonSubmit} variant="contained" color="primary" type="submit" size="large" fullWidth>Submit</Button>
          <Button variant="contained" color="secondary" type="submit" size="small" onClick={clear} fullWidth>Clear</Button>
          </form>
      </Paper>
    </>
  );
};

export default Form;
