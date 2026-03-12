const plt = {"private": {}};


plt.plotDefaults = { // default PlotSettings
  PlotRange: [0, 10], // (number = symmetric interval; [x1, x2] = explicit interval; ex: [0, x2] = one-sided plot)
  AspectRatio: 1.618,
  ScaleRatio: 1, // ratio of pixel values for axes units

  PlotOffset: 0 // todo
};

attributeParse = function (value) {
  if (typeof value === "string" && !isNaN(value) && value.trim() !== "") {
    return Number(value);
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    return value;
  }
}

plt.getPlotSettings = function (plotL) {
  const plotSettings = {};

  for (const setting of Object.keys(plt.plotDefaults)) {
    plotSettings[setting] = attributeParse(plotL.getAttribute(setting)) || plt.plotDefaults[setting];
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
  plotSettings["Top"] = plotL.getAttribute("Top") || (plotSettings["Right"] / plotSettings["AspectRatio"] / plotSettings["ScaleRatio"]);
  plotSettings["Bottom"] = plotL.getAttribute("Bottom") || (plotSettings["Left"] / plotSettings["AspectRatio"] / plotSettings["ScaleRatio"]);

  return plotSettings;
}

plt.private.addadddivmethod = function(parentL) {
  return function(classList = "") {
    const childL = document.createElement("div");
    if (classList) {
      childL.classList.add(...classList.split(" "));
    }
    parentL.appendChild(childL);
    return childL;
  }
}  

document.querySelectorAll("div.Plot").forEach(plotL => {
  const plotSettings = plt.getPlotSettings(plotL);
  
  /* Vector Layers */
  plotL.querySelectorAll("svg.Layer").forEach(layer => {
    layer.style.aspectRatio = plotSettings["AspectRatio"];
    layer.setAttribute("preserveAspectRatio", "none");

    /* general method for adding elements */
    layer.add = (childType, classList = "") => {
      const childL = document.createElementNS("http://www.w3.org/2000/svg", childType);
      if (classList) {
        childL.classList.add(...classList.split(" "));
      }
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

  /* Web Layers */
  plotL.querySelectorAll("div.Layer").forEach(layer => {

    /* general method for adding elements */
    layer.add = plt.private.addadddivmethod(layer);
  });

  /* Axes */
  plotL.querySelectorAll("div.Layer[Axes]").forEach(axesL => {
    const axisX = axesL.add("Axis X");
    axisX.style.bottom = `${100 * plotSettings["Bottom"] / (plotSettings["Bottom"] - plotSettings["Top"])}%`;
    axisX.add = plt.private.addadddivmethod(axisX);
    if (axesL.hasAttribute("Arrowheads")) {
      axisX.add("Arrowhead X Right");
    }

    const axisY = axesL.add("Axis Y");
    axisY.style.right = `${100 * plotSettings["Right"] / (plotSettings["Right"] - plotSettings["Left"])}%`;
    axisY.add = plt.private.addadddivmethod(axisY);
    if (axesL.hasAttribute("Arrowheads")) {
      axisY.add("Arrowhead Y Top");
    }

  });
});



plt.arrowheadDef = `
  <defs>
    <marker id="axisArrowhead" markerWidth="14" markerHeight="5" refX="7" refY="3.5" orient="auto-start-reverse" viewBox="0 0 10 7">
      <polygon points="10 3.5, 0 0, 1.5 3.5, 0 7"/>
    </marker>
  </defs>
`;



/* DYNAMIC EVALUATION */

plt.controls = document.querySelectorAll("input[pltvar]");
plt.vars = {};
plt.dynamic = [];
plt.updateVars = function() {
  plt.controls.forEach(control => {
    plt.vars[control.getAttribute("pltvar")] = attributeParse(control.value);
  });
}

plt.update = function() {
  plt.updateVars();
  for (const updF of plt.dynamic) {
    updF(plt.vars); // todo: updF.toString() ... if contains changed value || switch to maninpulation observers
  }
}
plt.controls.forEach(control => {
  control.oninput = plt.update;
});



// -------------------------------------------------------

/* NUMERICAL METHODS */
/* Utility */

let $Precision = 0.0001;

plt.Subdivide = function(range, Npoints) {
  const dx = (range[1] - range[0]) / Npoints;
  let x = range[0];
  const pt = [];
  for (let n = 0; n <= Npoints; n++) {
    pt.push(x);
    x += dx;
  }
  return pt;
}

/* Plotting */

plt.LinearParametric = function(f, xs) {
  let path = "";
  for (const x of xs) {
    path += ` L ${f(x).join(" ")}`;
  }
  return "M" + path.substring(2);
}

plt.BezierParametric = function(f, df, ts) {
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

/* Solvers */

plt.FindRoot = function(fdf, x0, iter) {
  let FdF;
  for (let i = 0; i < iter; i++) {
    FdF = fdf(x0);
    x0 -= FdF[0] / FdF[1];
  }
  return([x0, fdf(x0)[0]]);
}

plt.NSolve = function(fdf, x0s, iter) {
  const sol = x0s.map(x0 => plt.FindRoot(fdf, x0, iter))
                 .filter(([x, f]) => (Math.abs(f) < $Precision))
                 .map(([x, f]) => x);
  return(sol);
}

Object.freeze(plt);

// -------------------------------------------------------

/* Embedding */

plt.private.embedHeight = function () {
  parent.postMessage({
    type: 'embed-height',
    height: document.body.scrollHeight
  }, '*');
}
window.addEventListener('load', plt.private.embedHeight);
window.addEventListener('resize', plt.private.embedHeight);