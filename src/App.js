import React, { useState, useEffect } from "react";
import { HashRouter, Switch, Route } from "react-router-dom";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";
import { css } from "@emotion/css";
import { API, Storage, Auth } from "aws-amplify";
import { listPosts } from "./graphql/queries";

import Posts from "./Posts";
import Post from "./Post";
import Header from "./Header";
import CreatePost from "./CreatePost";
import Button from "./Button";

function Router() {
  /* State to manage modal for creating a new post */
  const [showOverlay, updateOverlayVisibility] = useState(false);
  const [posts, updatePosts] = useState([]);
  const [myPosts, updateMyPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      /* query the API, ask for 100 items */
      let postData = await API.graphql({
        query: listPosts,
        variables: { limit: 100 },
      });
      console.log(postData);
      let postsArray = postData.data.listPosts.items;
      /* map over the image keys in the posts array, get signed image URLs for each image */
      postsArray = await Promise.all(
        postsArray.map(async (post) => {
          const imageKey = await Storage.get(post.image);
          post.image = imageKey;
          return post;
        })
      );
      /* update the posts array in the local state */
      setPostState(postsArray);
    };
    fetchPosts();
  }, []);

  const setPostState = async (postsArray) => {
    const user = await Auth.currentAuthenticatedUser();
    const myPostData = postsArray.filter((p) => p.owner === user.username);
    updateMyPosts(myPostData);
    updatePosts(postsArray);
  };
  return (
    <>
      <HashRouter>
        <div className={contentStyle}>
          <Header />
          <hr className={dividerStyle} />
          <Button
            title="New Post"
            onClick={() => updateOverlayVisibility(true)}
          />
          <Switch>
            <Route exact path="/">
              <Posts posts={posts} />
            </Route>
            <Route exact path="/myposts">
              <Posts posts={myPosts} />
            </Route>
            <Route path="/post/:id">
              <Post />
            </Route>
          </Switch>
        </div>
        <AmplifySignOut />
      </HashRouter>
      {showOverlay && (
        <CreatePost
          updateOverlayVisibility={updateOverlayVisibility}
          updatePosts={setPostState}
          posts={posts}
        />
      )}
    </>
  );
}

const dividerStyle = css`
  margin-top: 15px;
`;

const contentStyle = css`
  min-height: calc(100vh - 45px);
  padding: 0px 40px;
`;

export default withAuthenticator(Router);
