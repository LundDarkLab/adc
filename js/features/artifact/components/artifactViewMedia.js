import * as utils from "../utils/artifactViewMediaUtils.js";

const domEl = {
  imgPanel : document.getElementById('nav-image'),
  imgLabel : document.getElementById('nav-image-tab'),
  docPanel : document.getElementById('nav-document'),
  docLabel : document.getElementById('nav-document-tab'),
  referencesPanel : document.getElementById('nav-references'),
  referencesLabel : document.getElementById('nav-references-tab'),
  videosPanel : document.getElementById('nav-video'),
  videosLabel : document.getElementById('nav-video-tab'),
}

export function initMedia(mediaArray) {
  
  const groups = Object.groupBy(mediaArray, item => item.filetype);
  const { 1: images, 2: documents, 3: videos, 4: references } = groups;
  
  if(images && images.length > 0){setImgPanel(images);};
  if(documents && documents.length > 0){setDocPanel(documents);};
  if(references && references.length > 0){setRefPanel(references);};
  if(videos && videos.length > 0){setVidPanel(videos);};
  
  
}

function setImgPanel(images){
  domEl.imgLabel.querySelector('span').textContent = images.length;
  domEl.imgPanel.innerHTML = '';
  const imgDiv = document.createElement('div');
  imgDiv.id = 'imgDiv';
  domEl.imgPanel.appendChild(imgDiv);

  const modalGallery = document.getElementById('otherArtifactImages');
  modalGallery.innerHTML = '';

  images.forEach(img => {
    const imgCard = document.createElement('div');
    imgCard.classList.add('imgCard', 'bg-white', 'rounded', 'border', 'p-2', 'mb-3');
    imgDiv.appendChild(imgCard);

    const modalCard = imgCard.cloneNode(true)
    modalGallery.appendChild(modalCard);

    const imgEl = document.createElement('div');
    imgEl.classList.add('imgCard-img');
    imgEl.style.backgroundImage = `url("${utils.pathToImage + img.path}")`;
    const modalImgEl = imgEl.cloneNode(true);

    imgCard.appendChild(imgEl);
    modalCard.appendChild(modalImgEl);

    imgEl.addEventListener('click', () => {utils.openModal(img);});
    modalImgEl.addEventListener('click', () => {utils.populateModal(img);});
  });
}

function setDocPanel(documents){
  domEl.docLabel.querySelector('span').textContent = documents.length;
  domEl.docPanel.innerHTML = '';
  documents.forEach(doc => {
    const docLink = document.createElement('a');
    docLink.href = utils.pathToImage + doc.path;
    docLink.textContent = doc.text || 'Download Document';
    docLink.classList.add('d-block', 'mb-2');
    docLink.setAttribute('download', '');
    domEl.docPanel.appendChild(docLink);
  });
}

function setRefPanel(references){
  domEl.referencesLabel.querySelector('span').textContent = references.length;
  domEl.referencesPanel.innerHTML = '';
  references.forEach(ref => {
    const refLink = document.createElement('a');
    refLink.href = ref.path;
    refLink.textContent = ref.text || ref.path;
    refLink.classList.add('d-block', 'mb-2');
    refLink.setAttribute('target', '_blank');
    domEl.referencesPanel.appendChild(refLink);
  });
}

function setVidPanel(videos){
  domEl.videosLabel.querySelector('span').textContent = videos.length;
  domEl.videosPanel.innerHTML = '';
  videos.forEach(vid => {
    const vidDiv = document.createElement('div');
    vidDiv.classList.add('media-item', 'mb-3');
    vidDiv.innerHTML = `
      <video controls class="img-fluid rounded mb-2" style="max-width: 400px;">
        <source src="${utils.pathToImage + vid.path}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <p>${vid.text || 'No description available'}</p>
    `;
    domEl.videosPanel.appendChild(vidDiv);
  });
}

