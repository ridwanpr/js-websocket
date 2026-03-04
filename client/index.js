const timeElement = document.querySelector("#time");

const timeEventSource = new EventSource("http://localhost:3000/current-time");

timeEventSource.addEventListener("message", (event) => {
  timeElement.textContent = event.data;
});

timeEventSource.addEventListener("color", (event) => {
  timeElement.style.color = event.data;
});
