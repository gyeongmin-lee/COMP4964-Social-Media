import React, { useState, useEffect } from "react";
import { css } from "@emotion/css";
import { useParams } from "react-router-dom";
import { API, Predictions, Storage } from "aws-amplify";
import { getPost } from "./graphql/queries";

export default function Post() {
  const [loading, updateLoading] = useState(true);
  const [post, updatePost] = useState(null);
  const [tags, updateTags] = useState(null);
  const { id } = useParams();

  console.log(tags);

  useEffect(() => {
    const getLabels = async () => {
      if (post !== null) {
        try {
          const { labels } = await Predictions.identify({
            labels: {
              source: {
                key: post.key,
              },
              type: "LABELS",
            },
          });
          const currentTags = labels.map((obj) => obj.name);
          updateTags(currentTags);
        } catch (err) {
          console.log({ err });
        }
      }
    };
    getLabels();
  }, [post]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await API.graphql({
          query: getPost,
          variables: { id },
        });
        const currentPost = postData.data.getPost;
        const image = await Storage.get(currentPost.image);

        currentPost.key = currentPost.image;
        currentPost.image = image;
        updatePost(currentPost);
        updateLoading(false);
      } catch (err) {
        console.log("error: ", err);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) return <h3>Loading...</h3>;
  return (
    <>
      <h1 className={titleStyle}>{post.name}</h1>
      <h3 className={locationStyle}>{post.location}</h3>
      <p>{post.description}</p>
      <div style={{ display: "flex", overflow: "auto" }}>
        Tags:{" "}
        {tags &&
          tags.map((tag) => (
            <span className={spanStyle} key={tag}>
              {tag}
            </span>
          ))}
      </div>
      <br />
      <img alt="post" src={post.image} className={imageStyle} />
    </>
  );
}

const titleStyle = css`
  margin-bottom: 7px;
`;

const locationStyle = css`
  color: #0070f3;
  margin: 0;
`;

const spanStyle = css`
  margin-right: 8px;
  padding: 8px;
  background-color: lightgrey;
`;

const imageStyle = css`
  max-width: 500px;
  @media (max-width: 500px) {
    width: 100%;
  }
`;
