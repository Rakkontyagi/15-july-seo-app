
export function integrateInformalExpression(content: string): string {
  const informalExpressions = [
    { find: "It is", replace: "It's" },
    { find: "I am", replace: "I'm" },
    { find: "do not", replace: "don't" },
    { find: "will not", replace: "won't" },
  ];

  let newContent = content;
  informalExpressions.forEach(item => {
    newContent = newContent.replace(new RegExp(item.find, 'gi'), item.replace);
  });

  return newContent;
}
