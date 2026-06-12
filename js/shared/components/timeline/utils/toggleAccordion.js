export function toggleTimeAccordion(icon, accordionWrap) {
  const currentContainer = document.getElementById(accordionWrap);
  const otherContainer = accordionWrap === 'lowerBoundsWrap' ? document.getElementById('upperBoundsWrap') : document.getElementById('lowerBoundsWrap');
  const iconElement = document.getElementById(icon);


  currentContainer.classList.toggle('d-none');
  iconElement.classList.toggle('mdi-menu-down');
  iconElement.classList.toggle('mdi-menu-up');

  if (otherContainer && !otherContainer.classList.contains('d-none')) {
    otherContainer.classList.add('d-none');
    const otherIconId = accordionWrap === 'lowerBoundsWrap' ? 'upperBoundsIcon' : 'lowerBoundsIcon';
    const otherIconElement = document.getElementById(otherIconId);
    if (otherIconElement) {
      otherIconElement.classList.remove('mdi-menu-up');
      otherIconElement.classList.add('mdi-menu-down');
    }
  }
}

export async function setActiveChronology(itemId) {
  console.log('setActiveAccordion called');
  
}

export function closeAllAccordions(ev) {
  const lowerAccordion = document.getElementById('lowerBoundsAccordion');
  const upperAccordion = document.getElementById('upperBoundsAccordion');
  const lowerWrap = document.getElementById('lowerBoundsWrap');
  const upperWrap = document.getElementById('upperBoundsWrap');
  const lowerIcon = document.getElementById('lowerBoundIcon');
  const upperIcon = document.getElementById('upperBoundIcon');
  if (
    !ev.target.closest('.boundsBtn') && 
    !ev.target.closest('.boundsAccordionWrap') && 
    !lowerAccordion.contains(ev.target) && 
    !upperAccordion.contains(ev.target)
  ){
    if (lowerWrap && !lowerWrap.classList.contains('d-none')) {
      lowerWrap.classList.add('d-none');
      if (lowerIcon) {
        lowerIcon.classList.remove('mdi-menu-up');
        lowerIcon.classList.add('mdi-menu-down');
      }
    }
  
    if (upperWrap && !upperWrap.classList.contains('d-none')) {
      upperWrap.classList.add('d-none');
      if (upperIcon) {
        upperIcon.classList.remove('mdi-menu-up');
        upperIcon.classList.add('mdi-menu-down');
      }
    }
  }
}


export function closeBoundsAccordions() {
  const lowerWrap = document.getElementById('lowerBoundsWrap');
  const upperWrap = document.getElementById('upperBoundsWrap');
  const lowerIcon = document.getElementById('lowerBoundIcon');
  const upperIcon = document.getElementById('upperBoundIcon');

  if (lowerWrap && !lowerWrap.classList.contains('d-none')) {
    lowerWrap.classList.add('d-none');
    if (lowerIcon) {
      lowerIcon.classList.remove('mdi-menu-up');
      lowerIcon.classList.add('mdi-menu-down');
    }
  }

  if (upperWrap && !upperWrap.classList.contains('d-none')) {
    upperWrap.classList.add('d-none');
    if (upperIcon) {
      upperIcon.classList.remove('mdi-menu-up');
      upperIcon.classList.add('mdi-menu-down');
    }
  }
}
  
export function handleCollapse(iconElement, collapseElement, parentElement=null) {
  collapseElement.addEventListener('show.bs.collapse', () => {
    iconElement.classList.remove('mdi-menu-down');
    iconElement.classList.add('mdi-menu-up');
    if (collapseElement && parentElement) {
      const allCollapses = parentElement.querySelectorAll('.collapse');
      allCollapses.forEach((otherCollapse) => {
        if (otherCollapse !== collapseElement && otherCollapse.classList.contains('show')) {
          const otherIcon = parentElement.querySelector(`button[data-bs-target="#${otherCollapse.id}"] i`);
          if (otherIcon) {
            otherIcon.classList.remove('mdi-menu-up');
            otherIcon.classList.add('mdi-menu-down');
          }
          const bsCollapse = bootstrap.Collapse.getInstance(otherCollapse);
          if (bsCollapse) {
            bsCollapse.hide();
          }
        }
      });
    }    
  });
  collapseElement.addEventListener('hide.bs.collapse', () => {
    iconElement.classList.remove('mdi-menu-up');
    iconElement.classList.add('mdi-menu-down');
  });
}