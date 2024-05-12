export async function getAdsLink() {
  // Define helper
  function findAncestor(el, sel) {
    while (
      (el = el.parentElement) &&
      !(el.matches || el.matchesSelector).call(el, sel)
    );
    return el;
  }

  // get list sponsored span
  const nodeList = document.querySelectorAll(".native-text > span.f5");
  const arr = Array.from(nodeList).map((element) => element);
  const sponsoredSpans = arr.filter(
    (i) =>
      i.textContent.startsWith("Sponsored") ||
      i.textContent.startsWith("Được tài")
  );

  // get list sponsored wrapper
  const sponsoredDiv = sponsoredSpans.map((e) =>
    findAncestor(e, "div[data-focusable=true]")
  );

  // collect links
  const links = [];
  for await (const div of sponsoredDiv) {
    div.scrollIntoView();

    // click to post
    div.click();
    await new Promise((res) => setTimeout(() => res(true), 3_000));

    const searchParams = new URLSearchParams(location.search);
    const pageId = searchParams.get("id");
    const postId = searchParams.get("story_fbid");

    const link = `https://www.facebook.com/${pageId}/posts/${postId}`;
    links.push(link);

    history.back();
    await new Promise((res) => setTimeout(() => res(true), 300));
  }

  return links;
}
