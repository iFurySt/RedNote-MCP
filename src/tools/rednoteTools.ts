import { AuthManager } from "../auth/authManager";
import { Browser, Page } from "playwright";
import logger from "../utils/logger";
import { GetNoteDetail, NoteDetail } from "./noteDetail";

export interface Note {
  title: string;
  content: string;
  tags: string[];
  url: string;
  author: string;
  likes?: number;
  collects?: number;
  comments?: number;
}

export interface Comment {
  author: string;
  content: string;
  likes: number;
  time: string;
}

export class RedNoteTools {
  private authManager: AuthManager;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor() {
    logger.info("Initializing RedNoteTools");
    this.authManager = new AuthManager();
  }

  async initialize(): Promise<void> {
    logger.info("Initializing browser and page");
    if (!this.browser) {
      this.browser = await this.authManager.getBrowser();
      this.page = await this.browser.newPage();

      // Load cookies if available
      const cookies = await this.authManager.getCookies();
      if (cookies.length > 0) {
        logger.info(`Loading ${cookies.length} cookies`);
        await this.page.context().addCookies(cookies);
      }

      // Check login status
      logger.info("Checking login status");
      await this.page.goto("https://www.xiaohongshu.com");
      const isLoggedIn = await this.page.evaluate(() => {
        const sidebarUser = document.querySelector(
          ".user.side-bar-component .channel"
        );
        return sidebarUser?.textContent?.trim() === "我";
      });

      // If not logged in, perform login
      if (!isLoggedIn) {
        logger.error("Not logged in, please login first");
        throw new Error("Not logged in");
      }
      logger.info("Login status verified");
    }
  }

  async cleanup(): Promise<void> {
    logger.info("Cleaning up browser resources");
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async searchNotes(keywords: string, limit: number = 10): Promise<Note[]> {
    logger.info(`Searching notes with keywords: ${keywords}, limit: ${limit}`);
    await this.initialize();
    if (!this.page) throw new Error("Page not initialized");

    try {
      // Navigate to search page
      logger.info("Navigating to search page");
      await this.page.goto(
        `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(
          keywords
        )}`
      );

      // Wait for search results to load
      logger.info("Waiting for search results");
      await this.page.waitForSelector(".feeds-container", {
        timeout: 30000,
      });

      // Get all note items
      let noteItems = await this.page.$$(".feeds-container .note-item");
      logger.info(`Found ${noteItems.length} note items`);
      const notes: Note[] = [];

      // Process each note
      for (let i = 0; i < Math.min(noteItems.length, limit); i++) {
        logger.info(
          `Processing note ${i + 1}/${Math.min(noteItems.length, limit)}`
        );
        try {
          // Click on the note cover to open detail
          await noteItems[i].$eval("a.cover.mask.ld", (el: HTMLElement) =>
            el.click()
          );

          // Wait for the note page to load
          logger.info("Waiting for note page to load");
          await this.page.waitForSelector("#noteContainer", {
            timeout: 30000,
          });

          await this.randomDelay(0.5, 1.5);

          // Extract note content
          const note = await this.page.evaluate(() => {
            const article = document.querySelector("#noteContainer");
            if (!article) return null;

            // Get title
            const titleElement = article.querySelector("#detail-title");
            const title = titleElement?.textContent?.trim() || "";

            // Get content
            const contentElement = article.querySelector(
              "#detail-desc .note-text"
            );
            const content = contentElement?.textContent?.trim() || "";

            // Get author info
            const authorElement = article.querySelector(
              ".author-wrapper .username"
            );
            const author = authorElement?.textContent?.trim() || "";

            // Get interaction counts from engage-bar
            const engageBar = document.querySelector(".engage-bar-style");
            const likesElement = engageBar?.querySelector(
              ".like-wrapper .count"
            );
            const likes = parseInt(
              likesElement?.textContent?.replace(/[^\d]/g, "") || "0"
            );

            const collectElement = engageBar?.querySelector(
              ".collect-wrapper .count"
            );
            const collects = parseInt(
              collectElement?.textContent?.replace(/[^\d]/g, "") || "0"
            );

            const commentsElement = engageBar?.querySelector(
              ".chat-wrapper .count"
            );
            const comments = parseInt(
              commentsElement?.textContent?.replace(/[^\d]/g, "") || "0"
            );

            return {
              title,
              content,
              url: window.location.href,
              author,
              likes,
              collects,
              comments,
            };
          });

          if (note) {
            logger.info(`Extracted note: ${note.title}`);
            notes.push(note as Note);
          }

          // Add random delay before closing
          await this.randomDelay(0.5, 1);

          // Close note by clicking the close button
          const closeButton = await this.page.$(".close-circle");
          if (closeButton) {
            logger.info("Closing note dialog");
            await closeButton.click();

            // Wait for note dialog to disappear
            await this.page.waitForSelector("#noteContainer", {
              state: "detached",
              timeout: 30000,
            });
          }
        } catch (error) {
          logger.error(`Error processing note ${i + 1}:`, error);
          const closeButton = await this.page.$(".close-circle");
          if (closeButton) {
            logger.info("Attempting to close note dialog after error");
            await closeButton.click();

            // Wait for note dialog to disappear
            await this.page.waitForSelector("#noteContainer", {
              state: "detached",
              timeout: 30000,
            });
          }
        } finally {
          // Add random delay before next note
          await this.randomDelay(0.5, 1.5);
        }
      }

      logger.info(`Successfully processed ${notes.length} notes`);
      return notes;
    } finally {
      await this.cleanup();
    }
  }

  async getNoteContent(url: string): Promise<NoteDetail> {
    logger.info(`Getting note content for URL: ${url}`);
    await this.initialize();
    if (!this.page) throw new Error("Page not initialized");

    try {
      await this.page.goto(url);
      let note = await GetNoteDetail(this.page);
      note.url = url;
      logger.info(`Successfully extracted note: ${note.title}`);
      return note;
    } catch (error) {
      logger.error("Error getting note content:", error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async getNoteComments(url: string): Promise<Comment[]> {
    logger.info(`Getting comments for URL: ${url}`);
    await this.initialize();
    if (!this.page) throw new Error("Page not initialized");

    try {
      await this.page.goto(url);

      // Wait for comments to load
      logger.info("Waiting for comments to load");
      await this.page.waitForSelector('[role="dialog"] [role="list"]');

      // Extract comments
      const comments = await this.page.evaluate(() => {
        const items = document.querySelectorAll(
          '[role="dialog"] [role="list"] [role="listitem"]'
        );
        const results: Comment[] = [];

        items.forEach((item) => {
          const author =
            item
              .querySelector('[data-testid="user-name"]')
              ?.textContent?.trim() || "";
          const content =
            item
              .querySelector('[data-testid="comment-content"]')
              ?.textContent?.trim() || "";
          const likes = parseInt(
            item.querySelector('[data-testid="likes-count"]')?.textContent ||
              "0"
          );
          const time = item.querySelector("time")?.textContent?.trim() || "";

          results.push({ author, content, likes, time });
        });

        return results;
      });

      logger.info(`Successfully extracted ${comments.length} comments`);
      return comments;
    } catch (error) {
      logger.error("Error getting note comments:", error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Wait for a random duration between min and max seconds
   * @param min Minimum seconds to wait
   * @param max Maximum seconds to wait
   */
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.random() * (max - min) + min;
    logger.debug(`Adding random delay of ${delay.toFixed(2)} seconds`);
    await new Promise((resolve) => setTimeout(resolve, delay * 1000));
  }
}
