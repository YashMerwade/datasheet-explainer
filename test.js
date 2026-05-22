const chart = `flowchart TD\n    A["Start"] -->|Initiate|> B["Define Problem"]`;
console.log("Original:\n" + chart);
console.log("Sanitized:\n" + chart.replace(/-->\|(.*?)\|>/g, '-->|$1| '));
