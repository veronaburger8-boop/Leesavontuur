import { expect, it } from "vitest";
import { galgieWords, roundState } from "./galgie";

const card = (word: string) => ({ word, definitions: [], example: "", forms: null, translation: "", image: null, imageNote: null, extra: false });

it("takes single lesson words of 3 to 12 letters, special letters included", () => {
  const words = galgieWords([
    { spelling: ["Hond", "sê", "môre", "'n", "sokkerbal", "ys", "tafel-doek", "twee woorde", "onverskillighede"], wordCards: [card("hond"), card("perdeby")] },
  ]);
  expect(words).toEqual(["hond", "môre", "sokkerbal", "perdeby"]);
});

it("pops a balloon for each wrong letter and ends when the word is found or the balloons are gone", () => {
  expect(roundState({ word: "môre", guessed: ["m", "o", "r"] })).toMatchObject({ shown: ["m", null, "r", null], wrong: ["o"], balloonsLeft: 6, over: false });
  expect(roundState({ word: "môre", guessed: ["m", "ô", "r", "e"] })).toMatchObject({ won: true, over: true });
  expect(roundState({ word: "kat", guessed: ["b", "c", "d", "e", "f", "g", "h"] })).toMatchObject({ lost: true, balloonsLeft: 0 });
});
