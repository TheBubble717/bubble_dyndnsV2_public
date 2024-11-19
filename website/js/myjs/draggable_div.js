function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  var navbar = elmnt.querySelector(".moveable-navbar");

  if (navbar) {
    // If present, the navbar is where you move the DIV from:
    navbar.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    // Check if the target is an input field or textarea
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      return; // Allow normal behavior inside input fields
    }

    e = e || window.event;
    e.preventDefault();
    // Get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // Calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // Stop moving when the mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}