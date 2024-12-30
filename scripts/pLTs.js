setTimeout(() => {
const plotSVGs = document.querySelectorAll('svg.plot');
const axesSVG = document.querySelector('svg.axes');

// arrowheads def
let arrowheadDef = `
  <defs>
    <marker id="axisArrowhead" markerWidth="14" markerHeight="5" refX="7" refY="3.5" orient="auto-start-reverse" viewBox="0 0 10 7">
      <polygon points="10 3.5, 0 0, 1.5 3.5, 0 7"/>
    </marker>
  </defs>
`;
axesSVG.insertAdjacentHTML('afterbegin', arrowheadDef);


// plot style
const plotStyle = getComputedStyle(document.documentElement);
function cssValue(variable) {
  return plotStyle.getPropertyValue(variable).trim();
}
function cssFloat(variable, def = 0) {
  const val = parseFloat(cssValue(variable))
  return (isNaN(val) ? def : val);
}
const plotRangeLeft = cssFloat('--PlotRange-left');
const plotRangeRight = cssFloat('--PlotRange-right');
const plotRangeTop = cssFloat('--PlotRange-top');
const plotRangeBottom = cssFloat('--PlotRange-bottom');
const scaleRatio = cssFloat('font-size')/cssFloat('line-height');
const plotRangePadding = cssFloat('--PlotRangePadding');

function booleString(bstr) {
    return (!!bstr && bstr!=='false' && bstr!=='none');
}

const axisX = cssFloat('--AxisX');
const axisY = cssFloat('--AxisY');
const tickStepX = cssFloat('--TickX', 1);
const tickStepY = cssFloat('--TickY', 1);


const frameToggle = booleString(cssValue('--Frame') || false);
const gridToggle = booleString(cssValue('--Grid') || false);
const axesToggle = booleString(cssValue('--Axes') || !frameToggle);
const tickLength = cssFloat('--TickLength', 0.1 * tickStepX); /* >0: inside frame; <0: outside frame; =0: no */
const mergeOrigin = booleString(cssValue('--MergeOrigin') || false);
const tickRoundX = cssFloat('--TickRoundX', Math.max(0,-Math.floor(Math.log(tickStepX)/Math.log(10))));
const tickRoundY = cssFloat('--TickRoundY', Math.max(0,-Math.floor(Math.log(tickStepY)/Math.log(10))));
const ticksLoc = cssFloat('--ticksLoc', axesToggle ? 1 : (frameToggle ? -1 : 0)); /* >0: axes; <0: frame; =0: off */


const tickStartX = - Math.floor((axisX - plotRangeLeft) / tickStepX);
const tickStartY = - Math.floor((axisY - plotRangeBottom) / tickStepY);
const tickEndX = Math.floor((plotRangeRight - axisX) / tickStepX);
const tickEndY = Math.floor((plotRangeTop - axisY) / tickStepY);

const tickAlignX = (ticksLoc > 0) ? axisX : plotRangeLeft;
const tickAlignY = (ticksLoc > 0) ? axisY : plotRangeBottom;

const gridlinesContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
plotSVGs[0]?.insertBefore(gridlinesContainer, plotSVGs[0].firstChild);
const tickContainer = document.createElementNS("http://www.w3.org/2000/svg", "g");
axesSVG.insertBefore(tickContainer, axesSVG.firstChild);

// frame, grid, axes, ticks, and tick labels
for (i = tickStartX; i <= tickEndX; i++) {
  for (j = tickStartY; j <= tickEndY; j++) {
    
    if (i == tickStartX) {
      let horTemp = document.createElementNS("http://www.w3.org/2000/svg", "line");
      if (j == 0 && axesToggle) {
        horTemp.classList.add("axisLine");
        horTemp.setAttribute("x1", plotRangeLeft - plotRangePadding);
        horTemp.setAttribute("x2", plotRangeRight + plotRangePadding - 0.09); // 0.09 = stroke-width * (arrowhead.xmax - arrowhead.refx)
        horTemp.setAttribute("y1", axisY / scaleRatio);
        horTemp.setAttribute("y2", axisY / scaleRatio);
        horTemp.setAttribute("marker-end", 'url(#axisArrowhead)');
        axesSVG?.insertBefore(horTemp, axesSVG.getElementsByClassName('epilog')[0]);
      } else if (
          gridToggle &&
          Math.abs(axisY + j * tickStepY - plotRangeBottom) > 0.1 * tickStepY &&
          Math.abs(axisY + j * tickStepY - plotRangeTop) > 0.1 * tickStepY
      ) {
        horTemp.classList.add("gridLine");
        horTemp.setAttribute("x1", plotRangeLeft);
        horTemp.setAttribute("x2", plotRangeRight);
        horTemp.setAttribute("y1", (axisY + j * tickStepY) / scaleRatio);
        horTemp.setAttribute("y2", (axisY + j * tickStepY) / scaleRatio);
        gridlinesContainer.appendChild(horTemp);
      }

      /* tick */
      horTemp = document.createElementNS("http://www.w3.org/2000/svg", "line");
      if (
          ticksLoc && tickLength && 
          (tickLength < 0 ||
            (Math.abs(axisY + j * tickStepY - plotRangeBottom) > 0.1 * tickStepY &&
            Math.abs(axisY + j * tickStepY - plotRangeTop) > 0.1 * tickStepY)
          )
      ) {
        horTemp.classList.add("tick");
        horTemp.setAttribute("x1", tickAlignX);
        horTemp.setAttribute("x2", tickAlignX + tickLength);
        horTemp.setAttribute("y1", (axisY + j * tickStepY) / scaleRatio);
        horTemp.setAttribute("y2", (axisY + j * tickStepY) / scaleRatio);
        tickContainer?.appendChild(horTemp);
      }

      /* tick label */
      if (ticksLoc) {
        const divTemp = document.createElement('div');
        divTemp.classList.add('TeXfont', 'tickLabel', 'y');
        divTemp.innerText = (axisY + j * tickStepY).toFixed(tickRoundY);
        if (j==0 && mergeOrigin) {
          divTemp.classList.add('x');
          if (axisY==0) {
            divTemp.innerText = '0';
          }
	}
        divTemp.style.bottom = `${axisY + j * tickStepY}rlh`;
        divTemp.style.left = `${tickAlignX}rem`;
        document.body.appendChild(divTemp);
      }
    }
    
  }
  
  if (true) {
    let vertTemp = document.createElementNS("http://www.w3.org/2000/svg", "line");
    if (i == 0 && axesToggle) {
      vertTemp.setAttribute("x1", axisX);
      vertTemp.setAttribute("x2", axisX);
      vertTemp.setAttribute("y2", plotRangeTop / scaleRatio + plotRangePadding - 0.09);
      vertTemp.setAttribute("y1", plotRangeBottom / scaleRatio - plotRangePadding);
     vertTemp.setAttribute("marker-end", 'url(#axisArrowhead)');
      vertTemp.classList.add("axisLine");
      axesSVG?.insertBefore(vertTemp, axesSVG.getElementsByClassName('epilog')[0]);
    } else if (
          gridToggle &&
          Math.abs(axisX + i * tickStepX - plotRangeLeft) > 0.1 * tickStepX &&
          Math.abs(axisX + i * tickStepX - plotRangeRight) > 0.1 * tickStepX
    ) {
      vertTemp.setAttribute("x1", axisX + i * tickStepX);
      vertTemp.setAttribute("x2", axisX + i * tickStepX);
      vertTemp.setAttribute("y2", plotRangeTop / scaleRatio);
      vertTemp.setAttribute("y1", plotRangeBottom / scaleRatio);
      vertTemp.classList.add("gridLine");
      gridlinesContainer.appendChild(vertTemp);
    }

    /* tick */
    vertTemp = document.createElementNS("http://www.w3.org/2000/svg", "line");
    if (
      ticksLoc && tickLength &&
      (tickLength < 0 ||
        (Math.abs(axisX + i * tickStepX - plotRangeLeft) > 0.1 * tickStepX &&
        Math.abs(axisX + i * tickStepX - plotRangeRight) > 0.1 * tickStepX)
      )
    ) {
      vertTemp.classList.add("tick");
      vertTemp.setAttribute("x1", axisX + i * tickStepX);
      vertTemp.setAttribute("x2", axisX + i * tickStepX);
      vertTemp.setAttribute("y1", tickAlignY / scaleRatio);
      vertTemp.setAttribute("y2", tickAlignY / scaleRatio + tickLength);
      tickContainer?.appendChild(vertTemp);
    }

    /* tick label */
    if ((i || !mergeOrigin) && ticksLoc) {
      const divTemp = document.createElement('div');
      divTemp.classList.add('TeXfont', 'tickLabel', 'x');
      divTemp.innerText = (axisX + i * tickStepX).toFixed(tickRoundX);
      divTemp.style.left = `${axisX + i * tickStepX}rem`;
      divTemp.style.bottom = `${tickAlignY}rlh`;
      document.body.appendChild(divTemp);
    }
  }
}

if (frameToggle) {
    const frame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    frame.classList.add('frame');
    frame.setAttribute("x", plotRangeLeft);
    frame.setAttribute("y", plotRangeBottom / scaleRatio);
    frame.setAttribute("width", plotRangeRight - plotRangeLeft);
    frame.setAttribute("height", (plotRangeTop - plotRangeBottom) / scaleRatio);
    axesSVG?.appendChild(frame);
}






// setting svg scale
const viewBoxStr = `${plotRangeLeft} ${plotRangeBottom / scaleRatio} ${plotRangeRight - plotRangeLeft} ${(plotRangeTop - plotRangeBottom) / scaleRatio}`;

plotSVGs.forEach(svg => svg.setAttribute('viewBox', viewBoxStr));

const viewBoxStr2 = `${plotRangeLeft - plotRangePadding} ${plotRangeBottom / scaleRatio - plotRangePadding} ${plotRangeRight - plotRangeLeft + 2 * plotRangePadding} ${(plotRangeTop - plotRangeBottom) / scaleRatio + 2 * plotRangePadding}`;

axesSVG.setAttribute('viewBox', viewBoxStr2)

}, 10);



