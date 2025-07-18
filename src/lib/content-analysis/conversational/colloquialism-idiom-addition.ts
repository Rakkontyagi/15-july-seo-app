
export function addColloquialismAndIdiom(content: string): string {
  const colloquialisms = [
    { find: "very good", replace: "top-notch" },
    { find: "very bad", replace: "terrible" },
    { find: "quickly", replace: "in a flash" },
    { find: "understand", replace: "get the gist" },
  ];

  let newContent = content;
  colloquialisms.forEach(item => {
    newContent = newContent.replace(new RegExp(item.find, 'gi'), item.replace);
  });

  return newContent;
}
