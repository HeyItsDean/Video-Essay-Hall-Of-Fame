import Dexie, { type Table } from "dexie";
import type { Video, VideoFlags } from "./types";

export class VideoEssayDB extends Dexie {
  videos!: Table<Video, string>;
  flags!: Table<VideoFlags, string>;

  constructor() {
    super("videoEssayHallOfFame");
    this.version(1).stores({
      videos: "id, title, owner, published_date",
      flags: "id, updatedAt, watched, watchLater, favorite"
    });
  }
}

export const db = new VideoEssayDB();
