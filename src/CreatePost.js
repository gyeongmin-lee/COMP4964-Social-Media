import React, { useState } from "react";
import { css } from "@emotion/css";
import Button from "./Button";
import { v4 as uuid } from "uuid";
import { Storage, API, Auth } from "aws-amplify";
import { createPost } from "./graphql/mutations";

/* Initial state to hold form input, saving state */
const initialState = {
  name: "",
  description: "",
  image: {},
  file: "",
  location: "",
  isSaving: false, // indicates if saving is in progress
};

export default function CreatePost({
  updateOverlayVisibility,
  updatePosts,
  posts,
}) {
  /* 1. Create local state with useState hook */
  const [formState, updateFormState] = useState(initialState);

  /* 2. onChangeText handler updates the form state when a user types into a form field */
  const onChangeText = (e) => {
    e.persist();
    updateFormState((currentState) => ({
      ...currentState,
      [e.target.name]: e.target.value,
    }));
  };

  /* 3. onChangeFile handler will be fired when a user uploads a file  */
  const onChangeFile = (e) => {
    e.persist();
    if (!e.target.files[0]) return;
    const image = {
      fileInfo: e.target.files[0],
      name: `${e.target.files[0].name}_${uuid()}`,
    };
    updateFormState((currentState) => ({
      ...currentState,
      file: URL.createObjectURL(e.target.files[0]),
      image,
    }));
  };

  /* 4. Save the post  */
  const save = async () => {
    try {
      const { name, description, location, image } = formState;
      if (!name || !description || !location || !image.name) return;
      // Indicate file upload is in progress
      updateFormState((currentState) => ({ ...currentState, isSaving: true }));
      const postId = uuid();
      const postInfo = {
        name,
        description,
        location,
        image: formState.image.name,
        id: postId,
      };

      // Upload the image to S3 bucket
      await Storage.put(formState.image.name, formState.image.fileInfo);
      // Add post to DynamoDB using GraphQL
      await API.graphql({
        query: createPost,
        variables: { input: postInfo },
        authMode: "AMAZON_COGNITO_USER_POOLS", // updated
      });
      const { username } = await Auth.currentAuthenticatedUser(); // new
      updatePosts([
        ...posts,
        { ...postInfo, image: formState.file, owner: username },
      ]); // updated
      updateFormState((currentState) => ({ ...currentState, isSaving: false }));
      updateOverlayVisibility(false);
    } catch (err) {
      console.log("error: ", err);
    }
  };

  return (
    <div className={containerStyle}>
      <input
        placeholder="Post name"
        name="name"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Location"
        name="location"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input
        placeholder="Description"
        name="description"
        className={inputStyle}
        onChange={onChangeText}
      />
      <input type="file" onChange={onChangeFile} />
      {formState.file && (
        <img className={imageStyle} alt="preview" src={formState.file} />
      )}
      <Button title="Create New Post" onClick={save} />
      <Button
        type="cancel"
        title="Cancel"
        onClick={() => updateOverlayVisibility(false)}
      />
      {formState.isSaving && (
        <p className={savingMessageStyle}>Saving post...</p>
      )}
    </div>
  );
}

const inputStyle = css`
  margin-bottom: 10px;
  outline: none;
  padding: 7px;
  border: 1px solid #ddd;
  font-size: 16px;
  border-radius: 4px;
`;

const imageStyle = css`
  height: 120px;
  margin: 10px 0px;
  object-fit: contain;
`;

const containerStyle = css`
  display: flex;
  flex-direction: column;
  width: 400px;
  height: 420px;
  position: fixed;
  left: 0;
  border-radius: 4px;
  top: 0;
  margin-left: calc(50vw - 220px);
  margin-top: calc(50vh - 230px);
  background-color: white;
  border: 1px solid #ddd;
  box-shadow: rgba(0, 0, 0, 0.25) 0px 0.125rem 0.25rem;
  padding: 20px;
`;

const savingMessageStyle = css`
  margin-bottom: 0px;
`;
