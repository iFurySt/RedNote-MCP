import { Note } from "./rednoteTools";

async function getNoteDetail(page: Page, url: string): Promise<Note> {
  await page.goto(url);

  // Wait for content to load
  logger.info("Waiting for content to load");
  await this.page.waitForSelector("note-container");
  await this.page.waitForSelector("media-container");

  function getContent() {
    // Get main article content
    const article = document.querySelector("main article");
    if (!article) throw new Error("Article not found");

    // Get title from h1 or first text block
    const title =
      article.querySelector("h1")?.textContent?.trim() ||
      article.querySelector(".title")?.textContent?.trim() ||
      "";

    // Get content from article text
    const contentBlock = article.querySelector(".note-scroller");
    if (!contentBlock) throw new Error("Content block not found");
    const content =
      contentBlock
        .querySelector(".note-content .note-text span")
        ?.textContent?.trim() || "";
    // Get tags from article text
    const tags = Array.from(
      contentBlock?.querySelectorAll(".note-content .note-text a")
    ).map((tag) => {
      return tag.textContent?.trim() || "";
    });

    // Get author info
    const authorElement = article.querySelector(".author-container .info");
    const authorAvatarURL =
      authorElement?.querySelector(".avatar-item")?.src || "";
    const author = authorElement?.querySelector(".username")?.trim() || "";

    const contentImages = Array.from(
      document.querySelectorAll(".media-container img")
    ).map((img) => {
      return img.src;
    });

    // Get interaction counts
    const likesElement = article.querySelector(
      '.like-count, [data-testid="likes-count"]'
    );
    const likes = parseInt(likesElement?.textContent || "0");

    const commentsElement = article.querySelector(
      '.comment-count, [data-testid="comments-count"]'
    );
    const comments = parseInt(commentsElement?.textContent || "0");

    return {
      title,
      content,
      tags,
      url: url,
      author,
      likes,
      collects: 0,
      comments,
    };
  }

  return await this.page.evaluate(getContent);
}
