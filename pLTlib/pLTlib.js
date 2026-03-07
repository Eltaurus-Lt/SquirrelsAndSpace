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
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
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

  plotL.querySelectorAll("div.axes").forEach(axesL => {
    const axisX = document.createElement("div");
    axisX.classList.add("axis", "X");
    axisX.style.bottom = `${100 * plotSettings["Bottom"] / (plotSettings["Bottom"] - plotSettings["Top"])}%`;
    axesL.appendChild(axisX);
    const axisY = document.createElement("div");
    axisY.classList.add("axis", "Y");
    axisY.style.right = `${100 * plotSettings["Right"] / (plotSettings["Right"] - plotSettings["Left"])}%`;
    axesL.appendChild(axisY);
    if (axesL.hasAttribute("ArrowHeads")) {
      const arrowheadX = document.createElement("div");
      arrowheadX.classList.add("arrowhead", "right");
      axesL.appendChild(arrowheadX);
      const arrowheadY = document.createElement("div");
      arrowheadY.classList.add("arrowhead", "top");
      axesL.appendChild(arrowheadY);
    }
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



// -------------------------------------------------------

/* plotting methods */

let $Precision = 0.0001;

function Subdivide(range, Npoints) {
  const dx = (range[1] - range[0]) / Npoints;
  let x = range[0];
  const pt = [];
  for (let n = 0; n <= Npoints; n++) {
    pt.push(x);
    x += dx;
  }
  return pt;
}

function LinearParametric(f, xs) {
  let path = "";
  for (const x of xs) {
    path += ` L ${f(x).join(" ")}`;
  }
  return "M" + path.substring(2);
}

function BezierParametric(f, df, ts) {
  let F = f(ts[0]);
  let dF = df(ts[0]);
  let dt3 = (ts[1] - ts[0]) / 3;
  let path = `M ${F.join(" ")} C ${F[0] + dt3 * dF[0]} ${F[1] + dt3 * dF[1]}`;
  for (let i = 1; i < ts.length - 1; i++) {
    F = f(ts[i]); dF = df(ts[i]);
    path += ` ${F[0] - dt3 * dF[0]} ${F[1] - dt3 * dF[1]} ${F[0]} ${F[1]}`;
    dt3 = (ts[i + 1] - ts[i]) / 3;
    path += ` C ${F[0] + dt3 * dF[0]} ${F[1] + dt3 * dF[1]}`;
  }
  F = f(ts[ts.length - 1]); dF = df(ts[ts.length - 1]);
  path += ` ${F[0] - dt3 * dF[0]} ${F[1] - dt3 * dF[1]} ${F[0]} ${F[1]}`;
  return path;
}

function FindRoot(fdf, x0, iter) {
  let FdF;
  for (let i = 0; i < iter; i++) {
    FdF = fdf(x0);
    x0 -= FdF[0] / FdF[1];
  }
  return([x0, fdf(x0)[0]]);
}

function NSolve(fdf, x0s, iter) {
  const sol = x0s.map(x0 => FindRoot(fdf, x0, iter))
                 .filter(([x, f]) => (Math.abs(f) < $Precision))
                 .map(([x, f]) => x);
  return(sol);
}



// -------------------------------------------------------

/* embedded messaging */

function embedHeight(){
  parent.postMessage({
    type: 'embed-height',
    height: document.body.scrollHeight
  }, '*');
}
window.addEventListener('load', embedHeight);
window.addEventListener('resize', embedHeight);