module.exports = {
  "apps/web/**/*.{js,jsx,ts,tsx}": (filenames) => {
    const escapedFileNames = filenames.map((name) => `"${name}"`).join(" ");
    return [`cd apps/web && npx eslint --fix ${escapedFileNames}`];
  },
  "**/*.{js,jsx,ts,tsx,json,css,md}": ["prettier --write"],
};
