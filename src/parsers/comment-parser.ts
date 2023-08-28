export const parseComments = () => {
  const getUser = (commentNode: Element) => {
    return commentNode.querySelector("h3 > a")?.innerHTML;
  }

  const getContent = (commentNode: Element) => {
    return commentNode.querySelector("h3 + div")?.innerHTML;
  }

  const getTimestamp = (commentNode: Element) => {
    return commentNode.querySelector("h3 + div + div > abbr")?.innerHTML;
  }

  const getImages = (commentNode: Element) => {
    const imageNodes = commentNode.querySelectorAll("h3 + div + div img");

    const images = Array.from(imageNodes).map((imageNode) => {
      return (imageNode as HTMLImageElement)?.src;
    });

    return images;
  }

  const commentNodes = document.querySelectorAll(
    "#m_story_permalink_view > div[id^=ufi_] > div > div:not([id]) > div:not([id^=see_])"
  );

  const comments = Array.from(commentNodes).map((commentNode) => {
    const comment = {
      commentId: commentNode.id,
      name: getUser(commentNode),
      comment: getContent(commentNode),
      images: getImages(commentNode),
      timestamp: getTimestamp(commentNode),
      phone: "", // TODO:
      uid: "", // TODO:
      postId: 1, // TODO:
    };
    return comment;
  });

  return comments;
}
