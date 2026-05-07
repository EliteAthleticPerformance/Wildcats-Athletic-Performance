// ========================================
// 📊 ELITE ANALYTICS ENGINE
// ========================================

window.trackEvent = function(name, params = {}) {
  if (typeof gtag !== "function") return;

  gtag("event", name, {
    app: "elite-athletic-performance",
    page: window.location.pathname,
    school: sessionStorage.getItem("school") || "unknown",
    ...params
  });

  console.log("📊 Event:", name, params);
};
