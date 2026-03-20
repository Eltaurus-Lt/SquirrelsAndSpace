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
    plotSettings["PlotRange"] = Math.abs(plotSettings["PlotRange"]);
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

  attributes["Ticks"] = plt._parsedAttribute(layer, "Ticks");
  attributes["TicksX"] = moreSpecial("TicksX", attributes["Ticks"]);
  attributes["TicksY"] = moreSpecial("TicksY", attributes["Ticks"]);
  attributes["TicksBottom"] = moreSpecial("TicksBottom", attributes["TicksX"]);
  attributes["TicksLeft"] = moreSpecial("TicksLeft", attributes["TicksY"]);
  attributes["TicksTop"] = moreSpecial("TicksTop", attributes["TicksX"]);
  attributes["TicksRight"] = moreSpecial("TicksRight", attributes["TicksY"]);

  attributes["Subticks"] = plt._parsedAttribute(layer, "Subticks");
  attributes["SubticksX"] = moreSpecial("SubticksX", attributes["Subticks"]);
  attributes["SubticksY"] = moreSpecial("SubticksY", attributes["Subticks"]);
  attributes["SubticksBottom"] = moreSpecial("SubticksBottom", attributes["SubticksX"]);
  attributes["SubticksLeft"] = moreSpecial("SubticksLeft", attributes["SubticksY"]);
  attributes["SubticksTop"] = moreSpecial("SubticksTop", attributes["SubticksX"]);
  attributes["SubticksRight"] = moreSpecial("SubticksRight", attributes["SubticksY"]);

  /* Labels */
  attributes["AxesLabels"] = plt._parsedAttribute(layer, "AxesLabels");
  attributes["AxisLabelX"] = moreSpecial("AxisLabelX", attributes["AxesLabels"]?.[0]);
  attributes["AxisLabelY"] = moreSpecial("AxisLabelY", attributes["AxesLabels"]?.[1]);

  return attributes;
}

plt._addadddivmethod = function(parentL) {
  return function(classList = "") {
    const childL = document.createElement("div");
    if (classList) {
      childL.classList.add(...classList.split(" ").filter(Boolean));
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
      if (pos < plotSettings[start] || pos > plotSettings[end]) continue;
      const tickL = axisL.add(`Tick ${tag}`);
      if (i % subs !== 0 ) {
        tickL.classList.add("Sub");
      } else {
        tickL.add = plt._addadddivmethod(tickL);
        tickL.add("Label").innerText = `${String(pos)}`;
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

      /* Label */
      if (attrs["AxisLabelY"]) {
        axisY.add("Label Y").innerHTML = attrs["AxisLabelY"];
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

       /* Label */
      if (attrs["AxisLabelX"]) {
        axisX.add("Label X").innerHTML = attrs["AxisLabelX"];
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

plt.unwrap = function(obj) { 
  Object.getOwnPropertyNames(obj)
    .filter(key => typeof obj[key] === "function") /* todo? properties (PI) too? */
    .forEach(key => window[key] = obj[key]); /* todo? -> unwrap into local scope */
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

plt.LinearListPlot = function(xys) {
  let path = "";
  for (const xy of xys) {
    path += ` L ${xy.join(" ")}`;
  }
  return "M" + path.substring(2);
}

plt.LinearPlot = function(f, xs) {
  let path = "";
  for (const x of xs) {
    path += ` L ${x} ${f(x)}`;
  }
  return "M" + path.substring(2);
}

plt.BezierPlot = function(f, df, xs) {
  let F = f(xs[0]);
  let dF = df(xs[0]);
  let dx3 = (xs[1] - xs[0]) / 3;
  let path = `M ${xs[0]} ${F} C ${xs[0] + dx3} ${F + dx3 * dF}`;
  for (let i = 1; i < xs.length - 1; i++) {
    F = f(xs[i]); dF = df(xs[i]);
    path += ` ${xs[i] - dx3} ${F - dx3 * dF} ${xs[i]} ${F}`;
    dx3 = (xs[i + 1] - xs[i]) / 3;
    path += ` C ${xs[i] + dx3} ${F + dx3 * dF}`;
  }
  F = f(xs[xs.length - 1]); dF = df(xs[xs.length - 1]);
  path += ` ${xs[xs.length - 1] - dx3} ${F - dx3 * dF} ${xs[xs.length - 1]} ${F}`;
  return path;
}

plt.LinearParametric = function(f, ts) {
  let path = "";
  for (const t of ts) {
    path += ` L ${f(t).join(" ")}`;
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

plt.BezierListPlot = function(xys) {
    const n = xys.length - 1; // number of bezier segments
    var c = new Array(n); // temp second diag
    var dx = new Array(n), dy = new Array(n); // rhs

    /* LAE Matrices (tridiagonal) */
    // First rows
    dx[0] = xys[0][0] + 2 * xys[1][0];
    dy[0] = xys[0][1] + 2 * xys[1][1];
    // Internal rows
    for (i = 1; i < n - 1; i++) {
        dx[i] = 4 * xys[i][0] + 2 * xys[i+1][0];
        dy[i] = 4 * xys[i][1] + 2 * xys[i+1][1];
    }
    // Last rows
    dx[n-1] = 4 * xys[n-1][0] + .5 * xys[n][0];
    dy[n-1] = 4 * xys[n-1][1] + .5 * xys[n][1];

    /* Solve using Thomas algorithm */
    var b;
    dx[0] = .5 * dx[0];
    dy[0] = .5 * dy[0];
    c[0] = 0.5;

    // Forward pass
    for (let i = 1; i < n; i++) {
        c[i] = 1 / ((i < n - 1 ? 4.0 : 3.5) - c[i-1]);
        dx[i] = (dx[i] - dx[i-1]) * c[i];
        dy[i] = (dy[i] - dy[i-1]) * c[i];
    }

    // Back substitution
    for (let i = n - 2; i >= 0; i--) {
        dx[i] -= c[i] * dx[i+1];
        dy[i] -= c[i] * dy[i+1];
    }

    /* path */
    let path = `M ${xys[0].join(" ")}`;
    for (i = 0; i < n - 1; i++) {
        path += ` C ${dx[i]} ${dy[i]} ${2*xys[i+1][0]-dx[i+1]} ${2*xys[i+1][1]-dy[i+1]} ${xys[i+1].join(" ")}`;
    }
    path += ` C ${dx[n-1]} ${dy[n-1]} ${.5*(xys[n][0]+dx[n-1])} ${.5*(xys[n][1]+dy[n-1])} ${xys[n].join(" ")}`;  // (0 acceleration condition)
    return path;
}

plt.ListPlot = function(markupLayer, markers, classList = "") {
  if (typeof markers[0] === "number") { // solo marker
    markers = [markers];
  }
  return markers.map(([x, y]) => {
    const marker = markupLayer.add("PlotMarker " + classList);
    marker.style.left = `${x}%`;
    marker.style.bottom = `${y}%`;
    return marker;
  });

      // path/line versions (for vector layers)
      //   //markerL.setAttribute("d", `M ${x} ${Math.cos(x)} Z`);
      // markerL.setAttribute("x1", x);
      // markerL.setAttribute("x2", x + $Precision);
      // markerL.setAttribute("y1", x/k + t);
      // markerL.setAttribute("y2", x/k + t);

}

/* Solvers */

plt.FindRoot = function(f, df, x0, iter, damp = 1) { // Newton-Raphson
  for (let i = 0; i < iter; i++) {
    x0 -= damp * f(x0) / df(x0);
  }
  return([x0, f(x0)]);
}

plt.LocateRoot = function(f, [a, b], Imax = Infinity) { // Brent-Dekker
  // init
  var fa = f(a), fb = f(b);
  if (fa*fb >= 0) {
    return fa === 0 ? a : undefined;
  }
  const swap = () => {if (Math.abs(fa) < Math.abs(fb)) {
    [a, b] = [b, a];
    [fa, fb] = [fb, fa];
  }};
  swap();
  var c = a, fc = fa, s, fs, c_old = c;
  var m = true; // bisection flag

  for (i = 0; Math.abs(b - a) > $Precision && Math.abs(fb) > 0 && i < Imax ; i++) {
    const ifafb = 1 / (fa-fb);
    if (fa !== fc && fb !== fc) { // IQI step
      const ifafc = 1 / (fa-fc), ifbfc = 1 / (fb-fc);
      s = a*fb*fc*ifafb*ifafc - b*fa*fc*ifafb*ifbfc + c*fa*fb*ifafc*ifbfc;
    } else { // secant step
      s = b - fb * (b-a) * ifafb;
    }
    const Asb = 2*Math.abs(s-b), Abc = Math.abs(b-c), Aco = Math.abs(c-c_old);
    const δ = 2 * Number.EPSILON * Math.abs(b) + $Precision;
    if ((s - b) * (4*s - 3*a - b) >= 0 || // s ∉ [(3a+b)/4, b]
      (m && Asb >= Abc) || (!m && Asb >= Aco) ||
      (m && Abc < δ) || (!m && Aco < δ) ) {
        s = (a+b) / 2; // bisection step
        m = true;
    } else {
      m = false;
    }

    fs = f(s);

    c_old = c;
    c = b;
    if (fa * fs < 0) {
      b = s;
    } else {
      a = s;
    }
    swap();
  }
  return b;
}

plt.NSolve = function(f, x0s, Imax = Infinity) {
  const sol = [];
  var x;
  for (let i = 1; i < x0s.length; i++) {
    x = plt.LocateRoot(f, [x0s[i-1], x0s[i]], Imax);
    if (x !== undefined) {
      sol.push(x);
    }
  }
  return(sol);
}

plt.NRSolve = function(f, df, x0s, iter, damp = 1) {
  const sol = x0s.map(x0 => plt.FindRoot(f, df, x0, iter, damp))
                 .filter(([x, f]) => (Math.abs(f) < 10*$Precision))
                 .map(([x, f]) => x);
  return(sol);
}

plt._NVectorAdd = function(N) {
  return function vadd(v1, v2) {
    const res = [];
    for (i = 0; i < N; i++) {
      res.push(v1[i]+v2[i]);
    }
    return res;
  }
}
plt._NVectorMult = function(N) {
  return function vmult(k, v) {
    const res = [];
    for (i = 0; i < N; i++) {
      res.push(k*v[i]);
    }
    return res;
  }
}

plt.NDSolve = function(rhs, x0, ts, method = "rk4") {
  var x = x0; 
  const sol = [[ts[0], x]];
  if (typeof x0 === "number") { /* 1D */
    for (let i = 1; i < ts.length; i++) {
      const dt = ts[i] - ts[i-1];
      const k1dt = rhs(ts[i-1]   , x) *dt;
      const k2dt = rhs(ts[i]-dt/2, x + .5*k1dt) *dt;
      const k3dt = rhs(ts[i]-dt/2, x + .5*k2dt) *dt;
      const k4dt = rhs(ts[i]     , x + k3dt) *dt;
      x += (k1dt + 2*k2dt + 2*k3dt + k4dt)/6;
      sol.push([ts[i], x]);
    }
  } else { /* ND */
    const N = x0.length;
    const vadd = plt._NVectorAdd(N);
    const vmult = plt._NVectorMult(N);
    for (let i = 1; i < ts.length; i++) {
      const dt = ts[i] - ts[i-1];
      const k1dt = vmult(dt, rhs(ts[i-1]   , x));
      const k2dt = vmult(dt, rhs(ts[i]-dt/2, vadd(x, vmult(.5, k1dt))));
      const k3dt = vmult(dt, rhs(ts[i]-dt/2, vadd(x, vmult(.5, k2dt))));
      const k4dt = vmult(dt, rhs(ts[i]     , vadd(x, k3dt)));
      x = vadd(x, vmult(1/6, vadd(vadd(k1dt, vmult(2, k2dt)), vadd(vmult(2, k3dt), k4dt))));
      sol.push([ts[i], x]);
    }    
  }
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


//  Object.freeze(plt); // (todo) + set enuberable/writable/configurable to ...