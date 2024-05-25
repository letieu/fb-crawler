export const parsePost = () => {
  const getContent = () => {
    // case 1: post with text has image background
    let content = document.querySelector("#m_story_permalink_view > div:first-child > div:first-child > div:first-child > header + div > div > div > div > div > span");

    if (content) {
      return content.innerHTML;
    }

    // case 2: post with normal text
    content = document.querySelector("#m_story_permalink_view > div:first-child > div:first-child > div:first-child > header + div > div > p");

    if (content) {
      return content.innerHTML;
    }

    return "";
  }

  const getUid = () => {
    const userLink = (
      document.querySelector("#m_story_permalink_view > div:first-child > div:first-child > div:first-child > header header > h3 > span > strong:nth-child(1) > a") as HTMLAnchorElement
    )?.href;

    if (!userLink) {
      return null;
    }

    const regex = /id=(\d+)/;

    const match = userLink.match(regex);

    return match ? match[1] : null;
  }

  const getTime = () => {
    const timeElement = document.querySelector("footer div > abbr") as HTMLElement;
    return timeElement.textContent;
  }

  return {
    content: getContent(),
    uid: getUid(),
    time: getTime(),
  };
}
