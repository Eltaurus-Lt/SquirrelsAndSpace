const plotStyle = getComputedStyle(document.documentElement);
function cssFloat(variable) {
  return parseFloat(plotStyle.getPropertyValue(variable).trim());
}
const plotRangeLeft = cssFloat('--PlotRange-left');
const plotRangeRight = cssFloat('--PlotRange-right');
const plotRangeTop = cssFloat('--PlotRange-top');
const plotRangeBottom = cssFloat('--PlotRange-bottom');
const scaleRatio = cssFloat('font-size')/cssFloat('line-height');

const viewBoxStr = `${plotRangeLeft} ${plotRangeBottom / scaleRatio} ${plotRangeRight - plotRangeLeft} ${(plotRangeTop - plotRangeBottom) / scaleRatio}`;

const plotSVGs = document.querySelectorAll('svg.plot');
plotSVGs.forEach(svg => svg.setAttribute('viewBox', viewBoxStr));


