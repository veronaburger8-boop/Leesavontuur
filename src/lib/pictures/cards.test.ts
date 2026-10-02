import { expect, it } from "vitest";
import { allowedPictureUrl, findCard, parsePictureFile, pictureId, withPicture } from "./cards";

const card = (word: string) => ({ word, definitions: [], example: "", forms: null, translation: "", image: null, imageNote: null, extra: false });

it("finds the card for a word and sets or removes its picture", () => {
  const cards = [card("stert"), card("Môre")];
  expect(findCard(cards, "môre")).toBe(1);
  expect(withPicture(cards, "môre", "/pictures/x")?.[1].image).toBe("/pictures/x");
  expect(withPicture(cards, "môre", "/pictures/x")?.[0].image).toBeNull();
  expect(withPicture(cards, "kat", "/pictures/x")).toBeNull();
});

it("only accepts pictures from the generator's address over https", () => {
  expect(allowedPictureUrl("https://d8j0ntlcm91z4.cloudfront.net/u/a.png")).toBe(true);
  expect(allowedPictureUrl("http://d8j0ntlcm91z4.cloudfront.net/u/a.png")).toBe(false);
  expect(allowedPictureUrl("https://example.com/a.png")).toBe(false);
  expect(allowedPictureUrl("not a url")).toBe(false);
});

it("reads a pictures file and reports problems", () => {
  const { entries, problems } = parsePictureFile([
    { lessonId: "af-l1-my-hond-tokkie", word: "stert", url: "https://d8j0ntlcm91z4.cloudfront.net/a.png" },
    { lessonId: "x", word: "y" },
    { lessonId: "x", word: "y", url: "https://evil.example/a.png" },
  ]);
  expect(entries).toHaveLength(1);
  expect(problems).toHaveLength(2);
  expect(parsePictureFile({}).problems).toHaveLength(1);
});

it("recognises the site's own picture addresses", () => {
  expect(pictureId("/pictures/0b5a6e2e-6c1d-4d3e-9a51-2f0e8b7c1a22")).toBe("0b5a6e2e-6c1d-4d3e-9a51-2f0e8b7c1a22");
  expect(pictureId("https://elsewhere/x.png")).toBeNull();
  expect(pictureId(null)).toBeNull();
});
