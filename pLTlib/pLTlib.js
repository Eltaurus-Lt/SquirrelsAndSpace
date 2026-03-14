const plt = {};
let $Precision = 0.0001;

plt.plotDefaults = { // default PlotSettings
  PlotRange: [0, 10], // (number = symmetric interval; [x1, x2] = explicit interval; ex: [0, x2] = one-sided plot)
  AspectRatio: 1.618,
  ScaleRatio: 1, // ratio of pixel values for axes units

  PlotOrigin: 0, // todo
  RangePivot: 0 // todo
};

plt._parseAttribute = function(value) {
  function attr2json(attrstr) {
    return attrstr.replaceAll("'",'"');
    // todo? : unescape \f etc.
  }
  function lead0fix(attrstr) {
    return attrstr.replace(/(?<!\d)\.(\d+)/g, '0.$1');
  }

  if (typeof value !== "string") { // null, in particular
    return value;
  }
  if (!isNaN(value) && value.trim() !== "") {
    return Number(value);
  }
  if (value.includes("[")) {
    try {
        return JSON.parse(value);
    } catch {}
    try {
        return JSON.parse(lead0fix(value));
    } catch {}
    const norm = attr2json(value);
    try {
        return JSON.parse(norm);
    } catch {}
    try {
        return JSON.parse(lead0fix(norm));
    } catch {}
  };
  return attr2json(value);
}

plt._parsedAttribute = function(L, attr) {
  return this._parseAttribute(L.getAttribute(attr));
}

plt.getPlotSettings = function(plotL) {
  const plotSettings = {};

  for (const setting of Object.keys(plt.plotDefaults)) {
    plotSettings[setting] = plt._parseAttribute(plotL.getAttribute(setting)) || plt.plotDefaults[setting];
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

plt._getMarkupAttributes = function(layer) {
  const attributes = {};

  attributes["Grid"] = layer.hasAttribute("Grid");

  attributes["AxisX"] = layer.hasAttribute("AxisX") || layer.hasAttribute("Axes");
  attributes["AxisY"] = layer.hasAttribute("AxisY") || layer.hasAttribute("Axes");

  attributes["ArrowheadBottom"] = layer.hasAttribute("ArrowheadBottom");
  attributes["ArrowheadLeft"] = layer.hasAttribute("ArrowheadLeft");
  attributes["ArrowheadTop"] = layer.hasAttribute("ArrowheadTop") || layer.hasAttribute("Arrowheads");
  attributes["ArrowheadRight"] = layer.hasAttribute("ArrowheadRight") || layer.hasAttribute("Arrowheads");
  
  attributes["Frame"] = layer.hasAttribute("Frame");

  function moreSpecial(attr, general) {
    const special = plt._parsedAttribute(layer, attr);
    if (special !== null) { // "" must be preserved
      return special;
    }
    return general;
  }

  attributes["Ticks"] = this._parsedAttribute(layer, "Ticks");
  attributes["TicksX"] = moreSpecial("TicksX", attributes["Ticks"]);
  attributes["TicksY"] = moreSpecial("TicksY", attributes["Ticks"]);
  attributes["TicksBottom"] = moreSpecial("TicksBottom", attributes["TicksX"]);
  attributes["TicksLeft"] = moreSpecial("TicksLeft", attributes["TicksY"]);
  attributes["TicksTop"] = moreSpecial("TicksTop", attributes["TicksX"]);
  attributes["TicksRight"] = moreSpecial("TicksRight", attributes["TicksY"]);

  attributes["Subticks"] = this._parsedAttribute(layer, "Subticks");
  attributes["SubticksX"] = moreSpecial("SubticksX", attributes["Subticks"]);
  attributes["SubticksY"] = moreSpecial("SubticksY", attributes["Subticks"]);
  attributes["SubticksBottom"] = moreSpecial("SubticksBottom", attributes["SubticksX"]);
  attributes["SubticksLeft"] = moreSpecial("SubticksLeft", attributes["SubticksY"]);
  attributes["SubticksTop"] = moreSpecial("SubticksTop", attributes["SubticksX"]);
  attributes["SubticksRight"] = moreSpecial("SubticksRight", attributes["SubticksY"]);

  return attributes;
}

plt._addadddivmethod = function(parentL) {
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

  const RangeX = plotSettings["Right"] - plotSettings["Left"];
  const RangeY = plotSettings["Top"] - plotSettings["Bottom"];
  const Px = 100 / RangeX;;
  const Py = 100 / RangeY;
  
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
    layer.setAttribute('viewBox', `${plotSettings["Left"]} ${plotSettings["Bottom"]} ${RangeX} ${RangeY}`);
  });

  /* Web Layers */
  function addTicks([axisL, tag, P], [start, end], [ticks, subticks]) {
    const subs = Math.round(subticks) || 1;
    const iStart = Math.floor((plotSettings[start] - 0) / ticks) * subs;
    const iEnd = Math.ceil((plotSettings[end] - 0) / ticks) * subs;
    for (let i = iStart; i <= iEnd; i++) {
      const pos = ticks * i / subs + 0;
      if (pos <= plotSettings[start] || pos >= plotSettings[end]) continue;
      const tickL = axisL.add(`Tick ${tag}`);
      if (i % subs !== 0 ) {
        tickL.classList.add("Sub");
      }
      if ( Math.abs(pos - 0) < $Precision ) {
        tickL.classList.add("zero");
      }
      tickL.style[start.toLowerCase()] = `${(pos - plotSettings[start]) * P}%`;
    }
  }

  plotL.querySelectorAll("div.Layer").forEach(layer => {

    /* general method for adding elements */
    layer.add = plt._addadddivmethod(layer);

    /* layer attributes  */
    const attrs = plt._getMarkupAttributes(layer);

    /* setting scale */
    layer.style.left = `${(0 - plotSettings["Left"]) * Px}%`;
    layer.style.bottom = `${(0 - plotSettings["Bottom"]) * Py}%`;
    layer.style.width = `${100 * Px}%`;
    layer.style.height = `${100 * Py}%`;

    /* Axes */
    if (attrs["AxisY"]) {
      const axisY = layer.add("Axis Y");
      axisY.add = plt._addadddivmethod(axisY);
      
      axisY.style.bottom = `${plotSettings["Bottom"]}%`;
      axisY.style.height = `${RangeY}%`;
      axisY.style.left = `${0}%`;

      /* Ticks */
      if (typeof attrs["TicksY"] === "number") {
        addTicks([axisY, "Y", Py], ["Bottom", "Top"], [attrs["TicksY"], attrs["SubticksY"]] );
      }

      /* Arrowheads */
      if (attrs["ArrowheadTop"]) {
        axisY.add("Arrowhead Y Top");
      }
      if (attrs["ArrowheadBottom"]) {
        axisY.add("Arrowhead Y Bottom");
      }
    }

    if (attrs["AxisY"]) {
      const axisX = layer.add("Axis X");
      axisX.add = plt._addadddivmethod(axisX);

      axisX.style.left = `${plotSettings["Left"]}%`;
      axisX.style.width = `${RangeX}%`;
      axisX.style.bottom = `${0}%`;

      /* Ticks */
      if (typeof attrs["TicksX"] === "number") {
        addTicks([axisX, "X", Px], ["Left", "Right"], [attrs["TicksX"], attrs["SubticksX"]] );
      }

      /* Arrowheads */
      if (attrs["ArrowheadRight"]) {
        axisX.add("Arrowhead X Right");
      }
      if (attrs["ArrowheadLeft"]) {
        axisX.add("Arrowhead X Left");
      }
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
    plt.vars[control.getAttribute("pltvar")] = plt._parseAttribute(control.value);
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

plt.unwrap = function(obj) { /* todo? -> unwrap into local scope */
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "function") {
      window[key] = value;
    }
  }
}

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
                 .filter(([x, f]) => (Math.abs(f) < 10*$Precision))
                 .map(([x, f]) => x);
  return(sol);
}

// -------------------------------------------------------

/* Embedding */

plt._embedHeight = function () {
  parent.postMessage({
    type: 'embed-height',
    height: document.body.scrollHeight
  }, '*');
}
window.addEventListener('load', plt._embedHeight);
window.addEventListener('resize', plt._embedHeight);


Object.freeze(plt);