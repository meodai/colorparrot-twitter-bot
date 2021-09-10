const color = require("./src/color");

/**
 *
 const {
   namedColors,
   namedColorsMap,
   findColors,
 } = await color.getNamedColors();
 */

test("make sure the findColor function works", async () => {
  const {
    findColors,
  } = await color.getNamedColors();

  expect(typeof findColors).toBe("object");
  expect(typeof findColors.getNamesForValues).toBe("function");

  const name = findColors.getNamesForValues(["#fedcba"]);

  expect(typeof name).toBe("object"); // array actually ;)
  expect(name.length).toBe(1);
  expect(name[0]).toHaveProperty("name");
});

test("extract colors from images", async () => {
  const {
    findColors,
  } = await color.getNamedColors();

  const colorsInImage = await color.getPalette(
    "https://pbs.twimg.com/media/E-y8HQsWEAQiiTl?format=jpg&name=small",
    9
  );

  expect(typeof colorsInImage).toBe("object");
  expect(colorsInImage.length).toBe(9);
  expect(colorsInImage[0]).toHaveProperty("name");
});

