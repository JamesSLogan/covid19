// adding dark accordion classes
// Dark accorion is generated by eleventuy.js

let acc = document.querySelector(".dark-accordion-bg"); 
if(acc) {
    let nextSibling = acc.nextElementSibling;
    nextSibling.classList.add("dark-accordion-sibling");
    
    let firstChild = acc.firstElementChild;
    firstChild.classList.add("dark-accordion-first");
  }

