(function initTopPage(global) {
  const root = global.ServproUploadExtension || (global.ServproUploadExtension = {});
  const selectorsApi = root.selectors;
  const helpers = root.kendoHelpers;

  if (!selectorsApi || !helpers) {
    return;
  }

  if (global !== global.top) {
    return;
  }

  function isTopLevelServproPage() {
    return /servpronet\.io$/i.test(global.location.hostname);
  }

  function scanFrames() {
    const frames = helpers.queryAll(document, selectorsApi.SELECTORS.docsFrameIframe);
    for (const frame of frames) {
      frame.dataset.servproUploadHelperSeen = "true";
      frame.dataset.servproUploadHelperSrc = frame.getAttribute("src") || "";
    }
  }

  function boot() {
    if (!isTopLevelServproPage()) {
      return;
    }

    scanFrames();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})(window);
