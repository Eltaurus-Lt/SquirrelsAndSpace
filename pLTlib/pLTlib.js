const plotDefaults = { // default PlotSettings
  PlotRange: [0, 10], // (number = symmetric interval; [x1, x2] = explicit interval; ex: [0, x2] = one-sided plot)
  AspectRatio: 1.618,
  ScaleRatio: 1, // ratio of pixel values for axes units

  PlotOffset: 0 // todo
};
const layerDefaults = {
};
const axesDefaults = {
};
const gridDefaults = {
};

function attributeParse(value) {
  if (typeof value === "string" && !isNaN(value) && value.trim() !== "") {
    return Number(value);
  }
  return value;
}

function getPlotSettings(plotL) {
  const plotSettings = {};

  for (const setting of Object.keys(plotDefaults)) {
    plotSettings[setting] = attributeParse(plotL.getAttribute(setting)) || plotDefaults[setting];
  }

  if (Array.isArray(plotSettings["PlotRange"]) && plotSettings["PlotRange"].length > 1) {
    plotSettings["Left"] = plotSettings["PlotRange"][0];  
    plotSettings["Right"] = plotSettings["PlotRange"][1];
  } else if (typeof plotSettings["PlotRange"] === "number" && !isNaN(plotSettings["PlotRange"])) {
    plotSettings["Left"] = -plotSettings["PlotRange"];
    plotSettings["Right"] = plotSettings["PlotRange"];
  } else {
    console.error("PlotRange format isn't recognized ", plotSettings["PlotRange"]);
  }
  plotSettings["Left"] = plotL.getAttribute("Left") || plotSettings["Left"];
  plotSettings["Right"] = plotL.getAttribute("Right") || plotSettings["Right"];
  plotSettings["Top"] = plotL.getAttribute("Top") || (plotSettings["Right"] / plotSettings["AspectRatio"]);
  plotSettings["Bottom"] = plotL.getAttribute("Bottom") || (plotSettings["Left"] / plotSettings["AspectRatio"]);

  return plotSettings;
}

document.querySelectorAll("div.plot").forEach(plotL => {
  const plotSettings = getPlotSettings(plotL);
  plotL.querySelectorAll("svg.layer").forEach(layer => {

    /* general method for adding elements */
    layer.add = (childType) => {
      const childL = document.createElementNS("http://www.w3.org/2000/svg", childType);
      layer.appendChild(childL);
      return childL;
    }

    // set viewboxes
    layer.setAttribute('viewBox', `
      ${plotSettings["Left"]}
      ${plotSettings["Bottom"]}
      ${plotSettings["Right"] - plotSettings["Left"]}
      ${plotSettings["Top"] - plotSettings["Bottom"]}
    `);
  });
});



let arrowheadDef = `
  <defs>
    <marker id="axisArrowhead" markerWidth="14" markerHeight="5" refX="7" refY="3.5" orient="auto-start-reverse" viewBox="0 0 10 7">
      <polygon points="10 3.5, 0 0, 1.5 3.5, 0 7"/>
    </marker>
  </defs>
`;






/* Manipulate */
const controls = document.getElementById("controlPanel")?.querySelectorAll("input");
const vars = {};
function updateVars() {
  controls.forEach(control => {
    vars[control.getAttribute("var")] = attributeParse(control.value);
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






/* embedded messaging */

function embedHeight(){
  parent.postMessage({
    type: 'embed-height',
    height: document.body.scrollHeight
  }, '*');
}
window.addEventListener('load', embedHeight);
window.addEventListener('resize', embedHeight);