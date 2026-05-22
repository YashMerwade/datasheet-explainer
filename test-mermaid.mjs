import mermaid from 'mermaid';
import { JSDOM } from 'jsdom';

// Setup DOM for Mermaid
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = window.document;

mermaid.initialize({ startOnLoad: false });

const chart = `flowchart TD
    A["Start"] -->|Initiate| B["Define Problem"]
`;

mermaid.render('graph1', chart).then(({svg}) => {
  console.log("Success!");
}).catch(err => {
  console.error("Error:", err);
});
