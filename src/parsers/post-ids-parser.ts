export const parsePostIds = () => {
  const getPostId = (node: Element) => {
    const reactionElement = node.querySelector("footer [id^=like_]");

    if (!reactionElement) {
      return null;
    }

    const id = reactionElement.id.replace("like_", "");
    return id;
  };

  const postNodes = document.querySelectorAll("article");

  const postIds = Array.from(postNodes).map((postNode) => {
    return getPostId(postNode);
  });

  return postIds;
}
