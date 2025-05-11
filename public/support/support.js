document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("mailBtn")?.addEventListener("click", () => {
    window.location.href =
      "mailto:sumanthraju606@gmail.com?subject=Support%20regarding%20Botiq%20App&body=Hello%2C%0A%0AI%20need%20assistance%20with%20the%20Botiq%20App.%20Please%20help%20me%20with%20the%20following%20issue%3A%0A%0A%5BDescribe%20your%20issue%20here%5D%0A%0AThank%20you";
  });

  document.getElementById("gmailBtn")?.addEventListener("click", () => {
    window.location.href =
      "https://mail.google.com/mail/?view=cm&to=sumanthraju606@gmail.com&su=Support%20regarding%20Botiq%20App&body=Hello%2C%0A%0AI%20need%20assistance%20with%20the%20Botiq%20App.%20Please%20help%20me%20with%20the%20following%20issue%3A%0A%0A%5BDescribe%20your%20issue%20here%5D%0A%0AThank%20you";
  });
});
