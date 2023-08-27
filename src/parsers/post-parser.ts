export const parsePostContent = () => {
  // case 1: post with text has image background
  let content = document.querySelector("#m_story_permalink_view > div:first-child > div:first-child > div:first-child > header + div > div > div > div > div > span");

  if (content) {
    return content.innerHTML;
  }

  return "";
}
