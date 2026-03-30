// load the stylesheet
(() => {
  const stylesheetL = document.createElement("link");
  stylesheetL.rel = "stylesheet";
  stylesheetL.href = "/styles/_codeBlocks.css";
  document.head.appendChild(stylesheetL);
})();


// wrap code blocks
(() => {

const checkmarkSVG = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-1.5 -1.5 4 3' width='18px' height='12px'><path vector-effect='non-scaling-stroke' stroke-linecap='round' stroke-linejoin='round' d='M -1 0 L 0 1 L 2 -1' stroke-dasharray='20' stroke-dashoffset='0'><animate attributeName='stroke-dashoffset' dur='.5s' values='20;15;0' calcMode='spline' keyTimes='0;0.35;1' keySplines='0.25 0 0.75 1; 0.25 0 0.75 1'/></path></svg>";

document.querySelectorAll("code.block").forEach((codeL) => {
  const wrapL = document.createElement('div');
  wrapL.classList.add("scrollContainer");
  codeL.parentNode.insertBefore(wrapL, codeL);

  const btnL = document.createElement('button'); // copy button
  btnL.setAttribute("highlight", codeL.getAttribute("highlight"));
  btnL.classList.add("btn");
  btnL.insertAdjacentHTML('beforeend', checkmarkSVG);
  const animationL = btnL.querySelector('animate');

  wrapL.appendChild(btnL);
  wrapL.appendChild(codeL);

  btnL.addEventListener("click", () => {
    navigator.clipboard.writeText(codeL.innerText).then(() => {
      wrapL.classList.add("check");
      animationL.beginElement();

      wrapL.addEventListener('mouseleave', () => {
        wrapL.classList.remove("check");
      }, { once: true });
    });
  });
});

})();