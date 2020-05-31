import React, {useContext} from 'react'
import {Redirect} from 'react-router-dom'
import firebase from 'firebase'
import {AuthContext} from '../Auth'

function Login()
{
    const provider = new firebase.auth.GoogleAuthProvider();

    function handleLogin() {
        firebase.auth().signInWithPopup(provider).then().catch(error => {
            alert(error)
        })
    }

    const {currentUser} = useContext(AuthContext)

    if (currentUser) {
        return <Redirect to={'/'} />
    }

    return(
        <div>
            <center>
            <h1>floatr</h1>
            <p>Please login with your Google Account to continue</p>
            <button className="short-button" onClick={handleLogin}><span>Login </span></button>
            </center>
        </div>
      
    )
       
}
export default Login