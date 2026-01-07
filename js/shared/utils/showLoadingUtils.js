function createLoading() {
  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 1);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  `;
  
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 3rem;
    height: 3rem;
    border: 0.25em solid #6c757d;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spinner-border 0.75s linear infinite;
  `;
  
  const text = document.createElement('p');
  text.textContent = 'Loading ...';
  text.style.cssText = `
    margin-top: 1rem;
    color: #6c757d;
  `;
  
  // Aggiungi animazione keyframes (se non supportata nativamente)
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spinner-border {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  loader.appendChild(spinner);
  loader.appendChild(text);
  document.body.appendChild(loader);
}

export function showLoading(show) {
  if (show) {
    createLoading();
  } else {
    const loader = document.getElementById('global-loader');
    if (loader) {
      document.body.removeChild(loader);
    }
  }
}


// let loadingDiv = null;
// const loadingHTML = `
//   <div id="loadingDiv">
//     <p>
//       <span class="dot dot1">.</span>
//       <span class="dot dot2">.</span>
//       <span class="dot dot3">.</span>
//       Loading
//     </p>
//   </div>`;

// export function showLoading(show) {
//   if (show) {
//     if (!loadingDiv) {
//       loadingDiv = document.createElement('div');
//       loadingDiv.innerHTML = loadingHTML;
//       document.body.appendChild(loadingDiv);
//     }
//   } else {
//     if (loadingDiv) {
//       document.body.removeChild(loadingDiv);
//       loadingDiv = null;
//     }
//   }
// }