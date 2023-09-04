export const parseComments = () => {
  const getUser = (commentNode: Element) => {
    return commentNode.querySelector("h3 > a")?.innerHTML;
  }

  const getUserId = (commentNode: Element) => {
    const userLink = (commentNode.querySelector("h3 > a") as HTMLAnchorElement)?.href;

    if (!userLink) {
      return null;
    }

    if (userLink.includes("profile.php")) {
      const regex = /id=(\d+)/;
      const match = userLink.match(regex);
      return match ? match[1] : null;
    }

    const regex = /\/([\w\-\.]+)\?/i;
    const match = userLink.match(regex);

    return match ? match[1] : null;
  }

  const getContent = (commentNode: Element) => {
    return commentNode.querySelector("h3 + div")?.innerHTML;
  }

  const getTime = (commentNode: Element) => {
    return commentNode.querySelector("h3 + div + div + div > abbr")?.innerHTML;
  }

  const getImages = (commentNode: Element) => {
    const imageNodes = commentNode.querySelectorAll("h3 + div + div img");

    const images = Array.from(imageNodes).map((imageNode) => {
      return (imageNode as HTMLImageElement)?.src;
    });

    return images;
  }

  const commentNodes = document.querySelectorAll(
    "#m_story_permalink_view > div[id^=ufi_] > div > div:has(span[id^=like_]) > div:not([id^=see_])"
  );

  const comments = Array.from(commentNodes).map((commentNode) => {
    const comment = {
      commentId: commentNode.id,
      name: getUser(commentNode),
      comment: getContent(commentNode),
      images: getImages(commentNode),
      time: getTime(commentNode),
      uid: getUserId(commentNode),
    };
    return comment;
  });

  return comments;
}
