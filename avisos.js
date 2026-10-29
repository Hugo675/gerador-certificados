// Shim do sistema de avisos (equivalente ao helper da plataforma)
(function () {
  "use strict";
  var toaster = null;
  function ensure() {
    if (!toaster) {
      toaster = document.createElement("div");
      toaster.className = "toaster";
      document.body.appendChild(toaster);
    }
    return toaster;
  }
  window.skipUI = {
    toast: function (message, opts) {
      opts = opts || {};
      var item = document.createElement("div");
      item.className = "toast";
      item.setAttribute("role", opts.type === "error" ? "alert" : "status");
      var content = document.createElement("div");
      content.className = "toast-content";
      if (opts.type) item.setAttribute("data-type", opts.type);
      var p = document.createElement("p");
      p.textContent = message;
      content.appendChild(p);
      item.appendChild(content);
      ensure().appendChild(item);
      setTimeout(function () { item.remove(); }, opts.duration || 3000);
    }
  };
})();