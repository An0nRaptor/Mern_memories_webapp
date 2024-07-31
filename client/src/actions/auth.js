import { AUTH } from "../constants/actionTypes";
import * as api from "../Api/index.js";

export const signIn = (formdata, navigate) => async (dispatch) => {
  try {
    const { data } = await api.signIn(formdata);

    dispatch({ type: AUTH, data });

    navigate("/");

  } catch (error) {

    console.log(error);

  }
};


export const signUp = (formdata, navigate) => async (dispatch) => {
  
  try {
    // Signup in the user
    const { data } = await api.signUp(formdata);

    dispatch({ type: AUTH, data });

    navigate("/");

  } catch (error) {

    console.log(error);

  }
};
