const plotSettings = JSON.parse(document.getElementById("PlotSettings")?.textContent || "{}");
/* settings docstring:

  PlotRange: horizontal range (number = symmetric interval; [x1, x2] = explicit interval; [0, x2] = one-sided plot)
  CanvasAspect: w/h of the image (default = 1.618; 1 = square; vertical alignment ??)
todo  ScaleAspect: ratio of plot unit lengths in horizontal and vertical directions (default = 1)

todo  PlotRangePadding: 0;
todo  PlotOffset: 0;

.axes .frame .grid .arrowheads
  
todo  Ticks .... (grid.ticks ...)
todo  SubTicks
todo  MergeOrigin: true;

*/
// default values:
plotSettings["PlotRange"] ??= 10;
plotSettings["CanvasAspect"] ??= 1.618;
plotSettings["ScaleAspect"] ??= 1;
if (Array.isArray(plotSettings["PlotRange"]) && plotSettings["PlotRange"].length > 1) {
  plotSettings["Left"] ??= plotSettings["PlotRange"][0];  
  plotSettings["Right"] ??= plotSettings["PlotRange"][1];
} else if (typeof plotSettings["PlotRange"] === "number" && !isNaN(plotSettings["PlotRange"])) {
  plotSettings["Left"] ??= -plotSettings["PlotRange"];
  plotSettings["Right"] ??= plotSettings["PlotRange"];
} else {
  console.error("PlotRange format isn't recognized ", plotSettings["PlotRange"]);
}
plotSettings["Top"] ??= plotSettings["Right"] / plotSettings["CanvasAspect"];
plotSettings["Bottom"] ??= plotSettings["Left"] / plotSettings["CanvasAspect"];



/* Manipulate */
const controls = document.getElementById("controlPanel")?.querySelectorAll("input");
const vars = {};
function updateVars() {
  controls.forEach(control => {
    vars[control.getAttribute("var")] = Number(control.value);
  });
}
const dynamic = [];
function update() {
  updateVars();
  for (const updF of dynamic) {
    updF(vars); // todo: updF.toString() ... if contains changed value || switch to maninpulation observers
  }
}
controls.forEach(control => {
  control.oninput = update;
});



document.querySelectorAll("svg.plot").forEach((plotCanvasL) => {

  // general method for adding elements to plots
  plotCanvasL.add = (childType) => {
    const childL = document.createElementNS("http://www.w3.org/2000/svg", childType);
    plotCanvasL.appendChild(childL);
    return childL;
  }

  // set viewboxes
  plotCanvasL.setAttribute('viewBox', `
    ${plotSettings["Left"]}
    ${plotSettings["Bottom"]}
    ${plotSettings["Right"] - plotSettings["Left"]}
    ${plotSettings["Top"] - plotSettings["Bottom"]}
  `);
});



let arrowheadDef = `
  <defs>
    <marker id="axisArrowhead" markerWidth="14" markerHeight="5" refX="7" refY="3.5" orient="auto-start-reverse" viewBox="0 0 10 7">
      <polygon points="10 3.5, 0 0, 1.5 3.5, 0 7"/>
    </marker>
  </defs>
`;



/* embedded messaging */

function embedHeight(){
  parent.postMessage({
    type: 'embed-height',
    height: document.body.scrollHeight
  }, '*');
}
window.addEventListener('load', embedHeight);
window.addEventListener('resize', embedHeight);