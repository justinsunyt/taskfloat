import React, {useState, useEffect, useContext} from 'react'
import * as firebase from 'firebase'
import {Link} from 'react-router-dom'
import {AuthContext} from '../Auth'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as solidIcons from '@fortawesome/free-solid-svg-icons'
import * as regularIcons from '@fortawesome/free-regular-svg-icons'

function ForumDetail({match}) {
    const rootRef = firebase.database().ref()
    const [forumState, setForumState] = useState([])
    const [classState, setClassState] = useState([])
    const [userState, setUserState] = useState([])
    const [id, setId] = useState(0)
    const [postState, setPostState] = useState({
        "class" : "",
        "classId" : "",
        "comments" : [],
        "creatorId" : "",
        "creatorDisplayName" : "",
        "date" : "\"\"",
        "id" : 0,
        "likes" : [],
        "text" : "",
        "title" : ""
    })
    const [commentState, setCommentState] = useState("")
    const [mod, setMod] = useState(false)
    const [liked, setLiked] = useState(false)
    const {currentUser} = useContext(AuthContext)
    const userId = currentUser.uid
    const userDisplayName = currentUser.displayName
    const today = new Date()

    let title = postState.title
    let text = postState.text
    let date = new Date(JSON.parse(postState.date))
    let year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()
    let creatorId = postState.creatorId
    let creatorDisplayName = postState.creatorDisplayName
    let numLikes = postState.likes.length
    let sortedComments = postState.comments.sort((a, b) => {
        const d1 = new Date(JSON.parse(a.date))
        const d2 = new Date(JSON.parse(b.date))
        return (d2 - d1)
    })
    let numComments = postState.comments.length
    let className = postState.class
    let classId = postState.classId

    const linkStyle = {
        color: "black",
        textDecoration: "none",
        cursor: "pointer"
    }

    function fetchData(data) {
        let counter = 0
        for (let value of Object.values(data)) {
            if (counter === 0) {
                setClassState(value)
            }
            if (counter === 1) {
                let ids = []
                for (let i = 0; i < value.length; i++) {
                    if (value[i]["comments"] === undefined){
                        value[i]["comments"] = []
                    }
                    // initialize "comments" if undefined
                    if (value[i]["likes"] === undefined){
                        value[i]["likes"] = []
                    }
                    // initialize "likes" if undefined
                    ids.push(value[i].id)
                }
                if (ids.includes(parseInt(match.params.id))) {
                    setForumState(value)
                    setId(parseInt(match.params.id))
                    for (let i = 0; i < value.length; i++) {
                        if (value[i].id === parseInt(match.params.id)) {
                            setPostState(value[i])
                            if (value[i].likes.includes(userId)) {
                                setLiked(true)
                            }
                        }
                    }
                } else {
                    alert("This post has been deleted")
                    window.location.reload()
                }
            }
            if (counter === 2) {
                setUserState(value)
                for (let i = 0; i < value.length; i++) {
                    if (value[i].id === userId) {
                        setMod(value[i].mod)
                    }
                }
            }
            counter ++
        }
    }

    function handleChange(event) {
        const {value, type} = event.target
        let change = ""
        if (type === "checkbox") {
            setForumState(prevForum => {
                const updatedForum = prevForum.map(post => {
                    let newPost = post
                    if (post.id === id) {
                        if (post.likes.includes(userId)) {
                            const filteredLikes = post.likes.filter(value => {
                                if (value !== userId) {
                                    return value
                                }
                            })
                            newPost.likes = filteredLikes
                            setLiked(false)
                            change = "unliked post"
                            // if post is liked, unlike post
                        } else {
                            if (!newPost.likes) {
                                newPost.likes = []
                            }
                            newPost.likes.push(userId)
                            setLiked(true)
                            change = "liked post"
                            // if post is unliked, like post
                        }
                    }
                    console.log(newPost)
                    return newPost
                })
                console.log("Writing data to Firebase, change: " + change)
                rootRef.set({"classData": classState, "forumData": updatedForum, "userData": userState})
                console.log("Succesfully wrote data")
                return updatedForum
            })
        }
        else if (type === "textarea") {
            setCommentState(value)
        }
        console.log("New state:")
        console.log(forumState)
    }

    function handleSubmit() {
        if (commentState === "") {
            alert("You cannot comment nothing")
        } else {
            let change = ""
            setForumState(prevForum => {
                const updatedForum = prevForum.map(post => {
                    let newPost = post
                    if (post.id === id) {
                        let newComment = {}
                        newComment.id = post.comments.length
                        newComment.creatorId = userId
                        newComment.creatorDisplayName = userDisplayName
                        newComment.date = JSON.stringify(today)
                        newComment.text = commentState
                        newPost.comments.push(newComment)
                    }
                    change = "new comment"
                    console.log(newPost)
                    return newPost
                })
                console.log("Writing data to Firebase, change: " + change)
                rootRef.set({"classData": classState, "forumData": updatedForum, "userData": userState})
                console.log("Succesfully wrote data")
                return updatedForum
            })
            console.log("New state:")
            console.log(forumState)
            document.getElementById("comment").value = ""
        }
    }

    function handleDeletePost() {
        if (window.confirm("Are you sure you want to delete this post?\nThis action is irreversible")) {
            const change = "deleted post"
            let updatedForum = forumState
            for (const [i, post] of updatedForum.entries()) { 
                if (post.id === id) { 
                    updatedForum.splice(i, 1)
                }
            }
            console.log(updatedForum)
            console.log("Writing data to Firebase, change: " + change)
            rootRef.set({"classData": classState, "forumData": updatedForum, "userData": userState})
            console.log("Succesfully wrote data")
            window.location.reload()
        }
    }

    function handleDeleteComment(commentId) {
        if (window.confirm("Are you sure you want to delete this comment?\nThis action is irreversible")) {
            const change = "deleted comment"
            let updatedForum = forumState
            for (const post of updatedForum) { 
                if (post.id === id) { 
                    for (const [i, comment] of post.comments.entries()) {
                        if (comment.id === commentId) {
                            post.comments.splice(i, 1)
                        }
                    }
                }
            }
            console.log(updatedForum)
            console.log("Writing data to Firebase, change: " + change)
            rootRef.set({"classData": classState, "forumData": updatedForum, "userData": userState})
            console.log("Succesfully wrote data")
        }
    }

    useEffect(() => {
        rootRef.once("value")
        .then(snap => {
            console.log("Fetched data:")
            console.log(snap.val())
            fetchData(snap.val())
        })
        // fetch forum data when component mounts
        setInterval(() => {rootRef.on("value", snap => {
            fetchData(snap.val())
        })}, 5000)
        // fetch data when database updates
    }, [])

    const commentSection = sortedComments.map(comment => {
        const commentId = comment.id
        const creatorId = comment.creatorId
        const creatorDisplayName = comment.creatorDisplayName
        const text = comment.text

        return(
            <div>
                <p><b>{creatorDisplayName}</b></p>
                <p>{text}</p>
                <div className="post-delete" onClick = {() => handleDeleteComment(commentId)} style={linkStyle}>
                    {(mod || (userId === creatorId)) && <FontAwesomeIcon icon={regularIcons.faTrashAlt}/>}
                </div>
                <br/>
            </div>
        )
    })

    return (
        <div>
            <div className="forum">
                <div className="forum-post">
                    <div className="post-header">
                        <Link to={'/class/' + classId} style={linkStyle}>
                            from <u>{className}</u>
                        </Link>
                        <label align="right" className="like-btn">
                            <input 
                                type="checkbox" 
                                checked={liked} 
                                onChange={handleChange}
                                align="right"
                                id="like"
                            />
                        <b>{liked ? <FontAwesomeIcon icon={solidIcons.faHeart}/> : <FontAwesomeIcon icon={regularIcons.faHeart}/>} {numLikes}</b></label>
                    </div>
                    <div className="post-title">
                        <h2 className="post-title">{title}</h2>
                    </div>   
                    <div className="post-text-long">
                        {text}
                    </div> 
                    <div className="post-footer">
                        <div>Posted by <i>{creatorDisplayName} - {month} / {day} / {year}</i></div>
                        <div>{numComments} {(numComments === 1) ? "comment" : "comments"}</div>  
                    </div>
                    <div className="post-delete" onClick = {handleDeletePost} style={linkStyle}>
                        {(mod || (creatorId === userId)) && <FontAwesomeIcon icon={regularIcons.faTrashAlt}/>}
                    </div>
                </div>
            </div>
            <div className="comment-input">
                <form>
                    <textarea name="comment" id="comment" className="comment-textarea" onChange={handleChange} placeholder="Comment here"></textarea>    
                </form>
                <button onClick={handleSubmit} className="comment-button"><span>Comment </span></button>
            </div>    
            <div className="comment-section">
                {commentSection}
            </div>
        </div>
    )
}

export default ForumDetail