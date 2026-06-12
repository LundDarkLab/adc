import { bsPopovers } from "../../../components/bsComponents.js";
import { cutStringByWords } from "../../../helpers/utils.js";
import { checkLogged } from "../../../shared/utils/checkLoggedUtils.js";
import * as utils from "../utils/artifactViewMediaUtils.js";
import { getEmbedUrl } from "../../../components/media/externalSources/getEmbedUrl.js";

const { isLogged: _isLogged, userId: _uid, userRole: _role, userInstitution: _inst } = checkLogged;
const isLogged = _isLogged === 'true';
const userId = parseInt(_uid);
const userRole = parseInt(_role);
const userInstitution = parseInt(_inst);

const domEl = {
  imgPanel : document.getElementById('nav-image'),
  imgLabel : document.getElementById('nav-image-tab'),
  docPanel : document.getElementById('nav-document'),
  docLabel : document.getElementById('nav-document-tab'),
  referencesPanel : document.getElementById('nav-references'),
  referencesLabel : document.getElementById('nav-references-tab'),
  videosPanel : document.getElementById('nav-video'),
  videosLabel : document.getElementById('nav-video-tab'),
  linksPanel : document.getElementById('nav-links'),
  linksLabel : document.getElementById('nav-links-tab'),
}

export function initMedia(mediaArray, meta) {
  const groups = Object.groupBy(mediaArray, item => item.filetype);
  const { 1: images, 2: documents, 3: videos, 4: references, 5: links } = groups;

  // Estrai tutti gli item con url non nullo dai gruppi 1-4
  const urlsFromMedia = [images, documents, videos, references]
    .filter(Boolean)        // rimuovi i gruppi undefined
    .flat()
    .filter(item => item.url != null);

  const allLinks = [...(links || []), ...urlsFromMedia];
  
  if(images && images.length > 0){setImgPanel(images, meta);};
  if(documents && documents.length > 0){setDocPanel(documents, meta);};
  if(references && references.length > 0){setRefPanel(references, meta);};
  if(videos && videos.length > 0){setVidPanel(videos, meta);};
  if(allLinks.length > 0){setLinkPanel(allLinks, meta);};
}

function setImgPanel(images, meta){
  domEl.imgLabel.querySelector('span').textContent = images.length;
  domEl.imgPanel.innerHTML = '';
  const imgDiv = document.createElement('div');
  imgDiv.id = 'imgDiv';
  imgDiv.classList.add('mt-2');
  domEl.imgPanel.appendChild(imgDiv);

  const modalGallery = document.getElementById('otherArtifactImages');
  modalGallery.innerHTML = '';

  images.forEach(img => {
    const imgCard = document.createElement('div');
    imgCard.classList.add('imgCard', 'bg-white', 'rounded', 'border', 'p-1');
    imgDiv.appendChild(imgCard);

    const modalCard = imgCard.cloneNode(true)
    modalGallery.appendChild(modalCard);

    const imgEl = document.createElement('div');
    imgEl.classList.add('imgCard-img', 'rounded');
    imgEl.style.backgroundImage = `url("${utils.dir.image + img.path}")`;
    const modalImgEl = imgEl.cloneNode(true);

    imgCard.appendChild(imgEl);
    modalCard.appendChild(modalImgEl);

    imgEl.addEventListener('click', () => {utils.openModal(img, meta);});
    modalImgEl.addEventListener('click', () => {utils.populateModal(img, meta);});
  });
}

function setDocPanel(documents, meta){
  domEl.docLabel.querySelector('span').textContent = documents.length;
  domEl.docPanel.innerHTML = '';

  const listGroup = document.createElement('div');
  listGroup.classList.add('list-group', 'list-group-flush', 'mt-2');

  const fragment = document.createDocumentFragment();

  documents.forEach(doc => {
    const div = document.createElement('div');
    div.classList.add('list-group-item');

    const metadataDiv = document.createElement('div');
    const h6 = document.createElement('h6');
    h6.classList.add('mb-2');
    h6.textContent = doc.text || 'No description available';
    metadataDiv.appendChild(h6);

    const localFile = document.createElement('small');
    if (doc.path && (isLogged || doc.downloadable === 1)) {
      localFile.classList.add('d-block', 'mb-1');
      localFile.innerHTML = `local file: <a href="${utils.dir.document + doc.path}" target="_blank">${doc.path}</a>`;
    }else {
      localFile.textContent = `download or preview not allowed for this file`;
    }
    metadataDiv.appendChild(localFile);

    if (doc.url) {
      const externalFile = document.createElement('small');
      externalFile.classList.add('d-block', 'mb-1');
      externalFile.innerHTML = `external source: <a href="${doc.url}" target="_blank">${doc.url}</a>`;
      metadataDiv.appendChild(externalFile);
    }

    div.appendChild(metadataDiv);

    if (isLogged && (userId === parseInt(meta.author) || userRole === 1 || (userInstitution === parseInt(meta.owner) && userRole < 3))) {
      const btnGroup = document.createElement('div');
      btnGroup.classList.add('btn-group', 'btn-group-sm', 'float-end');

      const editBtn = document.createElement('a');
      editBtn.href = `media_edit.php?media=${doc.file}`;
      editBtn.classList.add('btn', 'btn-sm', 'btn-primary');
      editBtn.innerHTML = '<i class="mdi mdi-pencil"></i> edit';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.classList.add('btn', 'btn-sm', 'btn-danger');
      delBtn.innerHTML = '<i class="mdi mdi-close"></i> delete';
      delBtn.addEventListener('click', async () => { await utils.deleteMedia(doc); });

      btnGroup.append(editBtn, delBtn);
      div.appendChild(btnGroup);
    }

    fragment.appendChild(div);
  });

  listGroup.appendChild(fragment);
  domEl.docPanel.appendChild(listGroup);
}

function setRefPanel(references, meta){
  domEl.referencesLabel.querySelector('span').textContent = references.length;
  domEl.referencesPanel.innerHTML = '';

  const listGroup = document.createElement('div');
  listGroup.classList.add('list-group', 'list-group-flush', 'mt-2');

  const fragment = document.createDocumentFragment();

  references.forEach(ref => {
    const div = document.createElement('div');
    div.classList.add('list-group-item');

    const txt = cutStringByWords(ref.text, 30);
    const metadataDiv = document.createElement('div');
    const h6 = document.createElement('h6');
    h6.classList.add('mb-2');
    h6.textContent = txt || 'No description available';
    metadataDiv.appendChild(h6);

    if (ref.path !== null) {
      const localFile = document.createElement('small');
      localFile.classList.add('d-block', 'mb-1');
      localFile.innerHTML = `local file: <a href="${utils.dir.reference + ref.path}" target="_blank">${ref.path}</a>`;
      metadataDiv.appendChild(localFile);
    }

    if (ref.url !== null) {
      const externalFile = document.createElement('small');
      externalFile.classList.add('d-block', 'mb-1');
      externalFile.innerHTML = `external source: <a href="${ref.url}" target="_blank">${ref.url}</a>`;
      metadataDiv.appendChild(externalFile);
    }

    div.appendChild(metadataDiv);

    const btnGroup = document.createElement('div');
    btnGroup.classList.add('btn-group', 'btn-group-sm', 'float-end');
    
    if (ref.text && ref.text.length !== txt.length) {
      const viewBtn = document.createElement('button');
      viewBtn.type = 'button';
      viewBtn.classList.add('btn', 'btn-sm', 'btn-info');
      viewBtn.innerHTML = '<i class="mdi mdi-eye"></i> view';

      const popover = new bootstrap.Popover(viewBtn, {
        title: 'Full reference',
        content: ref.text,
        placement: 'top',
        trigger: 'manual',
        html: false,
        container: 'body',
      });
    
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        popover.toggle();
      });
    
      btnGroup.appendChild(viewBtn);
    }

    if (isLogged && (userId === parseInt(meta.author) || userRole === 1 || (userInstitution === parseInt(meta.owner) && userRole < 3))) {
      const editBtn = document.createElement('a');
      editBtn.href = `media_edit.php?media=${ref.file}`;
      editBtn.classList.add('btn', 'btn-sm', 'btn-primary');
      editBtn.innerHTML = '<i class="mdi mdi-pencil"></i> edit';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.classList.add('btn', 'btn-sm', 'btn-danger');
      delBtn.innerHTML = '<i class="mdi mdi-close"></i> delete';
      delBtn.addEventListener('click', async () => { await utils.deleteMedia(ref); });

      btnGroup.append(editBtn, delBtn);
    }
    div.appendChild(btnGroup);
    fragment.appendChild(div);
  });

  listGroup.appendChild(fragment);
  domEl.referencesPanel.appendChild(listGroup);
  bsPopovers();
}

function setVidPanel(videos, meta){
  domEl.videosLabel.querySelector('span').textContent = videos.length;
  domEl.videosPanel.innerHTML = '';

  const videoDiv = document.createElement('div');
  videoDiv.id = 'videoDiv';
  domEl.videosPanel.appendChild(videoDiv);

  videos.forEach(vid => {
    const itemWrapper = document.createElement('div');

    const videoCard = document.createElement('div');
    videoCard.classList.add('videoCard', 'bg-white', 'rounded', 'border', 'p-1');

    const src = vid.path ? utils.dir.video + vid.path : vid.url;
    const embedUrl = getEmbedUrl(src);

    const mediaWrapper = document.createElement('div');
    mediaWrapper.classList.add('videoCard-video', 'rounded');

    if (embedUrl) {
      const iframe = document.createElement('iframe');
      iframe.src = embedUrl;
      iframe.style.width = '100%';
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
      mediaWrapper.appendChild(iframe);
    } else {
      const video = document.createElement('video');
      video.controls = true;
      video.style.width = '100%';
      video.style.objectFit = 'cover';
      const source = document.createElement('source');
      source.src = src;
      video.appendChild(source);
      mediaWrapper.appendChild(video);
    }

    const caption = document.createElement('p');
    caption.classList.add('videoCard-text');
    caption.textContent = vid.text || 'No description available';

    videoCard.appendChild(mediaWrapper);
    videoCard.appendChild(caption);

    if (isLogged && (userId === parseInt(meta.author) || userRole === 1 || (userInstitution === parseInt(meta.owner) && userRole < 3))) {
      const btnWrapper = document.createElement('div');
      btnWrapper.classList.add('video-btn');

      const editBtn = document.createElement('a');
      editBtn.href = `media_edit.php?media=${vid.file}`;
      editBtn.classList.add('btn', 'btn-sm', 'btn-primary');
      editBtn.innerHTML = '<i class="mdi mdi-pencil"></i> edit';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.classList.add('btn', 'btn-sm', 'btn-danger');
      delBtn.innerHTML = '<i class="mdi mdi-close"></i> delete';
      delBtn.addEventListener('click', async () => { await utils.deleteMedia(vid); });

      btnWrapper.append(editBtn, delBtn);
      videoCard.appendChild(btnWrapper);
    }

    itemWrapper.appendChild(videoCard);

    videoDiv.appendChild(itemWrapper);
  });
}

function setLinkPanel(links, meta){
  domEl.linksLabel.querySelector('span').textContent = links.length;
  domEl.linksPanel.innerHTML = '';

  const linkContainer = document.createElement('div');
  linkContainer.classList.add('mt-2', 'list-group', 'list-group-flush', 'list-group-numbered');
  domEl.linksPanel.appendChild(linkContainer);

  links.forEach(async link => {
    const linkItem = document.createElement('div');
    linkItem.classList.add('list-group-item', 'd-flex');

    const linkContent = document.createElement('div');
    linkContent.classList.add('ms-2', 'flex-grow-1');

    const linkDesc = document.createElement('h6');
    linkDesc.classList.add('mb-1');
    linkDesc.textContent = link.text || 'No description available';
    linkContent.appendChild(linkDesc);

    // const linkType = document.createElement('small');
    // linkType.classList.add('text-muted');
    // linkType.textContent = `direct url: ${link.url || 'unknown'}`;
    // linkContent.appendChild(linkType);
    linkItem.appendChild(linkContent);

    const btnGroup = document.createElement('div');
    btnGroup.classList.add('btn-group', 'btn-group-sm', 'align-self-start');

    const linkBtn = document.createElement('a');
    linkBtn.href = link.url;
    linkBtn.target = '_blank';
    linkBtn.classList.add('btn', 'btn-sm', 'btn-primary', 'align-self-start');
    linkBtn.innerHTML = `<i class="mdi mdi-link-variant"></i> open link`;
    btnGroup.appendChild(linkBtn);

    if (link.filetype === 5 &&isLogged && (userId === parseInt(meta.author) || userRole === 1 || (userInstitution === parseInt(meta.owner) && userRole < 3))) {

      const editBtn = document.createElement('a');
      editBtn.href = `media_edit.php?media=${link.file}`;
      editBtn.classList.add('btn', 'btn-sm', 'btn-primary');
      editBtn.innerHTML = '<i class="mdi mdi-pencil"></i> edit';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.classList.add('btn', 'btn-sm', 'btn-danger');
      delBtn.innerHTML = '<i class="mdi mdi-close"></i> delete';
      delBtn.addEventListener('click', async () => { await utils.deleteMedia(link); });

      btnGroup.append(editBtn, delBtn);
    }
    
    linkItem.appendChild(btnGroup);
    linkContainer.appendChild(linkItem);
  });
}

function getLinkIcon(type){
  const icons = {
    'image': 'mdi mdi-image',
    'document': 'mdi mdi-file-pdf-box',
    'video': 'mdi mdi-video-box',
    'reference': 'mdi mdi-book-open-variant-outline',
    'link': 'mdi mdi-link-variant',
  }
  return icons[type] || 'mdi mdi-open-in-new';
}

