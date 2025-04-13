import { Note } from "./rednoteTools";

export async function GetNoteDetail(page: Page): Promise<Note> {
  // Wait for content to load
  logger.info("Waiting for content to load");
  await this.page.waitForSelector(".note-container");
  await this.page.waitForSelector(".media-container");

  function getContent() {
    // Get main article content
    const article = document.querySelector(".note-container");
    if (!article) throw new Error("Article not found");

    // Get title from h1 or first text block
    const title =
      article.querySelector("#detail-title")?.textContent?.trim() ||
      article.querySelector(".title")?.textContent?.trim() ||
      "";

    // Get content from article text
    const contentBlock = article.querySelector(".note-scroller");
    if (!contentBlock) throw new Error("Content block not found");
    const content =
      contentBlockn
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

    return {
      title,
      content,
      tags,
      author,
      url: "",
    };
  }

  return await this.page.evaluate(getContent);
}
