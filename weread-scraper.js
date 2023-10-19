// ==UserScript==
// @name         WeRead Scraper
// @namespace    https://github.com/Sec-ant/weread-scraper
// @version      1.4.3
// @author       Ze-Zheng Wu
// @description  Scrape WeRead books and save them as HTML files
// @license      MIT
// @icon         https://weread.qq.com/favicon.ico
// @homepage     https://github.com/Sec-ant/weread-scraper
// @homepageURL  https://github.com/Sec-ant/weread-scraper
// @source       https://github.com/Sec-ant/weread-scraper.git
// @supportURL   https://github.com/Sec-ant/weread-scraper/issues
// @match        https://weread.qq.com/web/reader/*
// @match        https://weread.qq.com/web/book/read*
// @require      https://fastly.jsdelivr.net/npm/minify-html-wasm@0.1.1/dist/no-modules/index.min.js
// @require      https://fastly.jsdelivr.net/npm/zustand@4.4.3/umd/vanilla.production.js
// @require      https://fastly.jsdelivr.net/npm/zustand@4.4.3/umd/middleware.production.js
// @require      https://fastly.jsdelivr.net/npm/@sec-ant/gm-fetch@1.2.0/dist/index.iife.js
// @connect      fastly.jsdelivr.net
// @connect      weread.qq.com
// @connect      tencent-cloud.com
// @connect      *
// @grant        GM_deleteValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_unregisterMenuCommand
// @grant        GM_webRequest
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function (gmFetch, vanilla, middleware, init) {
  'use strict';

  var _GM_deleteValue = /* @__PURE__ */ (() => typeof GM_deleteValue != "undefined" ? GM_deleteValue : void 0)();
  var _GM_getValue = /* @__PURE__ */ (() => typeof GM_getValue != "undefined" ? GM_getValue : void 0)();
  var _GM_registerMenuCommand = /* @__PURE__ */ (() => typeof GM_registerMenuCommand != "undefined" ? GM_registerMenuCommand : void 0)();
  var _GM_setValue = /* @__PURE__ */ (() => typeof GM_setValue != "undefined" ? GM_setValue : void 0)();
  var _GM_unregisterMenuCommand = /* @__PURE__ */ (() => typeof GM_unregisterMenuCommand != "undefined" ? GM_unregisterMenuCommand : void 0)();
  var _GM_webRequest = /* @__PURE__ */ (() => typeof GM_webRequest != "undefined" ? GM_webRequest : void 0)();
  var _unsafeWindow = /* @__PURE__ */ (() => typeof unsafeWindow != "undefined" ? unsafeWindow : void 0)();
  var concatenateTemplateLiteralTag = function concatenateTemplateLiteralTag2(raw) {
    return String.raw.apply(String, [{
      raw
    }].concat([].slice.call(arguments, 1)));
  };
  var any = concatenateTemplateLiteralTag;
  const windowDefineGetter = Object.prototype.__defineGetter__.bind(_unsafeWindow);
  let windowLocalStorage = void 0;
  try {
    windowLocalStorage = _unsafeWindow.localStorage;
  } catch (_) {
  }
  const stylePreset = any`
  @font-face {
    font-family: "汉仪旗黑50S";
    src: url("https://fastly.jsdelivr.net/gh/Sec-ant/weread-scraper/public/fonts/HYQiHei_50S.woff2");
  }
  @font-face {
    font-family: "汉仪旗黑65S";
    src: url("https://fastly.jsdelivr.net/gh/Sec-ant/weread-scraper/public/fonts/HYQiHei_65S.woff2");
  }
  @font-face {
    font-family: "汉仪楷体";
    src: url("https://fastly.jsdelivr.net/gh/Sec-ant/weread-scraper/public/fonts/HYKaiTiS.woff2");
  }
  @font-face {
    font-family: "方正仿宋";
    src: url("https://fastly.jsdelivr.net/gh/Sec-ant/weread-scraper/public/fonts/FZFSJW.woff2");
  }
  @font-face {
    font-family: "PingFang SC";
    src: url("https://fastly.jsdelivr.net/gh/Sec-ant/weread-scraper/public/fonts/PingFang-SC-Regular.woff2");
  }
  .readerChapterContent {
    break-after: page;
    /* 支持旧版本浏览器 */
    page-break-after: always;
  }
`;
  const annotationStyle = any`
  /* 携带注释信息的元素，下面的样式用来让它显示为一个黑色的圆 */
  span.reader_footer_note {
    text-indent: 0; /* 避免继承段落的缩进样式 */
    text-align: left; /* 文字左对齐 */
    position: relative; /* 用来给伪元素做定位参照 */
    display: inline-block; /* 使宽度和高度指定有效 */
    width: 1em; /* 设定宽度 */
    height: 1em; /* 设定高度 */
    background-color: black; /* 设定背景为黑色 */
    border-radius: 50%; /* 圆角化为圆形 */
    cursor: pointer; /* 光标样式改为手指 */
  }
  /* before 伪元素用来显示“注”这个字 */
  span.reader_footer_note:before {
    position: absolute; /* 绝对位置，基准为 span.reader_footer_note */
    content: "注"; /* 显示“注”字 */
    color: white; /* 字颜色为白色 */
    left: 0.15em; /* 微调字的位置 */
    top: 0.1em; /* 微调字的位置 */
    font-size: 0.75em; /* 设定文字大小 */
    font-family: "汉仪楷体"; /* 设定字体 */
  }
  /* after 伪元素用来显示注释内容，只在光标移至“注”上方时才显示 */
  span.reader_footer_note:hover:after {
    position: fixed; /* 相对于视窗的位置 */
    content: attr(data-wr-footernote); /* 获取并设置注释内容 */
    left: 0; /* 设定相对于视窗的位置 */
    bottom: 0; /* 设定相对于视窗的位置 */
    margin: 1em; /* 设定背景气泡与视窗边缘预留的空间 */
    background: black; /* 设定背景气泡为黑色 */
    border-radius: 0.25em; /* 背景气泡圆角 */
    color: white; /* 设定文字为白色 */
    padding: 0.5em; /* 设定文字内容与背景气泡边缘预留的空间 */
    font-size: 1em; /* 设定文字大小 */
    font-family: "汉仪楷体"; /* 设定字体 */
    z-index: 1; /* 避免被其它元素遮挡 */
  }
`;
  const htmlElement = document.createElement("html");
  const headElement = document.createElement("head");
  const styleElement = document.createElement("style");
  const bodyElement = document.createElement("body");
  headElement.insertAdjacentHTML("beforeend", any`<meta charset="utf-8" />`);
  headElement.append(styleElement);
  htmlElement.append(headElement, bodyElement);
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const wasmInitPromise = gmFetch("https://fastly.jsdelivr.net/npm/minify-html-wasm@0.1.1/dist/no-modules/index_bg.wasm").then(init);
  const preRenderContainerObserver = new MutationObserver(async () => {
    const preRenderContainer = document.querySelector(
      ".preRenderContainer:not([style])"
    );
    if (!preRenderContainer) {
      return;
    }
    const preRenderContent = preRenderContainer.querySelector("#preRenderContent");
    if (!preRenderContent) {
      return;
    }
    scraperPageStore.setState({
      preRenderContainer: preRenderContainer.cloneNode(
        true
      )
    });
  });
  const scraperSessionInitialState = {
    scraping: false,
    chapterLevelList: {}
  };
  const scraperSessionStore = vanilla.createStore()(
    middleware.subscribeWithSelector(
      middleware.persist(() => scraperSessionInitialState, {
        name: "scraper-session-storage",
        storage: middleware.createJSONStorage(() => sessionStorage)
      })
    )
  );
  const GMStorage = {
    getItem: (name) => {
      return _GM_getValue(name);
    },
    setItem: (name, value) => {
      _GM_setValue(name, value);
    },
    removeItem: (name) => {
      _GM_deleteValue(name);
    }
  };
  const scraperGMInitialState = {
    clickInterval: 0,
    booleanOptions: [
      {
        name: "Inline Images",
        value: false
      },
      {
        name: "Display Annotations",
        value: false
      }
    ]
  };
  const scraperGMStore = vanilla.createStore()(
    middleware.subscribeWithSelector(
      middleware.persist(() => scraperGMInitialState, {
        name: "scraper-gm-storage",
        storage: middleware.createJSONStorage(() => GMStorage),
        merge: (persistedState, currentState) => {
          return {
            ...currentState,
            ...persistedState,
            booleanOptions: currentState.booleanOptions.map(
              (currentBooleanOption) => {
                const persistedBooleanOption = persistedState.booleanOptions.find(
                  ({ name }) => name === currentBooleanOption.name
                );
                if (persistedBooleanOption) {
                  return persistedBooleanOption;
                }
                return currentBooleanOption;
              }
            )
          };
        }
      })
    )
  );
  const scraperPageInitialState = {
    preRenderContainer: null,
    pageContentLoaded: false,
    isNewChapter: false,
    timeout: 0,
    pageContentLoadedCleanUp: () => {
    }
  };
  const scraperPageStore = vanilla.createStore()(
    middleware.subscribeWithSelector(() => scraperPageInitialState)
  );
  function scrapingOn() {
    windowDefineGetter("localStorage", () => void 0);
    _GM_webRequest(
      [
        // 阻截微信读书的阅读进度请求，避免抓取过程中的翻页信息被记录为阅读进度
        // 发出这个请求表示此时页面已经加载完毕
        {
          selector: "https://weread.qq.com/web/book/read*",
          action: "cancel"
        },
        // 订阅微信读书的章节内容获取请求
        // 发出这个请求表示内容为新章节，否则为接续页
        // chapter/e_* 是 epub 格式，chapter/t_* 是 txt 格式
        // 将请求重定向到一个没有被加入到 @match 的网址会让请求正常发出
        // 但仍可以正常触发回调函数
        {
          selector: "https://weread.qq.com/web/book/chapter/*",
          action: {
            redirect: "https://chapter.invalid"
          }
        }
      ],
      (info) => {
        switch (info) {
          case "cancel":
            scraperPageStore.setState({
              pageContentLoaded: true
            });
            break;
          case "redirect":
            scraperPageStore.setState({
              isNewChapter: true
            });
            break;
        }
      }
    );
    preRenderContainerObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    const unsub = subscribePageContentLoaded();
    scraperPageStore.setState({
      pageContentLoadedCleanUp: getPageContentLoadedCleanUpFunction(unsub)
    });
  }
  function scrapingOff() {
    scraperPageStore.getState().pageContentLoadedCleanUp();
    preRenderContainerObserver.disconnect();
    _GM_webRequest([], () => {
    });
    windowDefineGetter("localStorage", () => windowLocalStorage);
  }
  scraperSessionStore.subscribe(
    (state) => state.scraping,
    (scraping) => {
      if (scraping) {
        scrapingOn();
      } else {
        scrapingOff();
      }
    },
    {
      fireImmediately: true
    }
  );
  function subscribePageContentLoaded() {
    return scraperPageStore.subscribe(
      (state) => state.pageContentLoaded,
      async (pageContentLoaded) => {
        var _a, _b;
        if (!pageContentLoaded) {
          return;
        }
        const { preRenderContainer } = scraperPageStore.getState();
        if (preRenderContainer) {
          const chapterTitle = ((_b = (_a = document.querySelector(".chapterTitle")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()) || void 0;
          await feed(preRenderContainer, chapterTitle);
        } else {
          console.warn("Failed to find .preRenderContainer element.");
        }
        let nextPageButton = document.querySelector(".readerFooter_button");
        if (!nextPageButton) {
          const ending = document.querySelector(".readerFooter_ending");
          if (ending) {
            stopScrapingAndSave();
          }
          return;
        }
        await new Promise((resolve) => {
          scraperPageStore.setState({
            timeout: setTimeout(() => {
              resolve();
            }, scraperGMStore.getState().clickInterval)
          });
        });
        scraperPageStore.setState(scraperPageInitialState);
        nextPageButton = document.querySelector(".readerFooter_button");
        nextPageButton == null ? void 0 : nextPageButton.dispatchEvent(
          new MouseEvent("click", {
            clientX: 1,
            clientY: 1
          })
        );
      }
    );
  }
  function getPageContentLoadedCleanUpFunction(unsub) {
    return () => {
      unsub();
      clearTimeout(scraperPageStore.getState().timeout);
      scraperPageStore.setState(scraperPageInitialState);
    };
  }
  async function feed(preRenderContainer, chapterTitle) {
    var _a, _b, _c, _d;
    if (styleElement.childNodes.length === 0) {
      const preRenderStyleElement = preRenderContainer.querySelector("style") || styleElement;
      styleElement.append(stylePreset, preRenderStyleElement.innerHTML);
      if (scraperGMStore.getState().booleanOptions[1].value) {
        styleElement.prepend(annotationStyle);
      }
      await wasmInitPromise;
      styleElement.outerHTML = decoder.decode(
        init.minify(encoder.encode(styleElement.outerHTML), {
          minify_css: true
        })
      );
    }
    const preRenderContent = preRenderContainer.querySelector(
      "#preRenderContent"
    );
    if (scraperGMStore.getState().booleanOptions[0].value) {
      const fetchImagePromises = [];
      const backgroundImageRegExp = new RegExp("(?<=background-image:url\\().+?(?=\\))");
      for (const image of preRenderContainer.querySelectorAll("img")) {
        const url = image.getAttribute("data-src") ?? image.src;
        if (!url) {
          continue;
        }
        fetchImagePromises.push(
          (async () => {
            try {
              const resp = await gmFetch(url);
              if (resp.ok) {
                const imageBlob = await resp.blob();
                const imageDataUrl = await blobToBase64(imageBlob);
                image.src = imageDataUrl;
              }
            } catch (e) {
              console.warn(`Failed to fetch image (${url}): ${e}`);
            }
          })()
        );
      }
      for (const element of preRenderContainer.querySelectorAll(
        '[style*="background-image:url("]'
      )) {
        const styleAttribute = element.getAttribute("style");
        if (!styleAttribute) {
          continue;
        }
        const url = (_a = styleAttribute == null ? void 0 : styleAttribute.match(backgroundImageRegExp)) == null ? void 0 : _a[0];
        if (!url) {
          continue;
        }
        fetchImagePromises.push(
          (async () => {
            try {
              const resp = await gmFetch(url);
              if (resp.ok) {
                const imageBlob = await resp.blob();
                const imageDataUrl = await blobToBase64(imageBlob);
                element.setAttribute(
                  "style",
                  styleAttribute.replace(backgroundImageRegExp, imageDataUrl)
                );
              }
            } catch (e) {
              console.warn(`Failed to fetch background image (${url}): ${e}`);
            }
          })()
        );
      }
      await Promise.all(fetchImagePromises);
    } else {
      for (const image of preRenderContainer.querySelectorAll("img")) {
        image.src = image.getAttribute("data-src") ?? image.src;
      }
    }
    recursivelyRemoveDataAttr(preRenderContent);
    collapseSpans(preRenderContent);
    if (scraperPageStore.getState().isNewChapter) {
      preRenderContent.removeAttribute("id");
      preRenderContent.classList.add("readerChapterContent");
      const dataChapterTitle = ((_c = (_b = document.querySelector("span.readerTopBar_title_chapter")) == null ? void 0 : _b.textContent) == null ? void 0 : _c.trim()) || "";
      preRenderContent.setAttribute("data-chapter-title", dataChapterTitle);
      preRenderContent.setAttribute(
        "data-chapter-level",
        scraperSessionStore.getState().chapterLevelList[dataChapterTitle] || "1"
      );
      typeof chapterTitle === "string" && preRenderContent.insertAdjacentHTML(
        "afterbegin",
        any`<h1>${chapterTitle}</h1>`
      );
      await wasmInitPromise;
      preRenderContent.innerHTML = decoder.decode(
        init.minify(encoder.encode(preRenderContent.innerHTML), {})
      );
      bodyElement.insertAdjacentElement("beforeend", preRenderContent);
    } else {
      await wasmInitPromise;
      (_d = bodyElement.lastElementChild) == null ? void 0 : _d.insertAdjacentHTML(
        "beforeend",
        decoder.decode(init.minify(encoder.encode(preRenderContent.innerHTML), {}))
      );
    }
  }
  _GM_registerMenuCommand("Start Scraping", startScraping);
  function startScraping() {
    scraperSessionStore.setState({
      scraping: true,
      chapterLevelList: Object.fromEntries(
        [...document.querySelectorAll(".chapterItem_link")].map((e) => {
          var _a, _b;
          return [
            ((_a = e.textContent) == null ? void 0 : _a.trim()) || "",
            ((_b = e.className.match(new RegExp("(?<=chapterItem_level)\\d+"))) == null ? void 0 : _b[0]) || "1"
          ];
        })
      )
    });
    window.location.reload();
  }
  _GM_registerMenuCommand("Cancel Scraping", cancelScraping);
  function cancelScraping() {
    scraperSessionStore.setState({ scraping: false, chapterLevelList: {} });
    styleElement.innerHTML = "";
    bodyElement.innerHTML = "";
  }
  _GM_registerMenuCommand("Stop Scraping & Save", stopScrapingAndSave);
  async function stopScrapingAndSave() {
    var _a, _b;
    scraperSessionStore.setState({
      scraping: false,
      chapterLevelList: {}
    });
    saveContent(
      any`<!DOCTYPE html>` + htmlElement.outerHTML,
      (_b = (_a = document.querySelector(".readerCatalog_bookInfo_title_txt")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim()
    );
    styleElement.innerHTML = "";
    bodyElement.innerHTML = "";
  }
  _GM_registerMenuCommand("Set Click Interval", setClickInterval);
  function setClickInterval() {
    const prevClickInterval = scraperGMStore.getState().clickInterval;
    let newClickInterval = parseFloat(
      window.prompt("Click interval (ms): ", prevClickInterval.toString()) || ""
    );
    if (!Number.isFinite(newClickInterval) || newClickInterval < 0) {
      newClickInterval = prevClickInterval;
    }
    scraperGMStore.setState({
      clickInterval: newClickInterval
    });
  }
  scraperGMStore.subscribe(
    (state) => state.booleanOptions,
    (() => {
      const menuIds = [];
      return (booleanOptions) => {
        for (let i = 0; i < booleanOptions.length; ++i) {
          if (typeof menuIds[i] !== "undefined") {
            _GM_unregisterMenuCommand(menuIds[i]);
          }
          menuIds[i] = _GM_registerMenuCommand(
            `${booleanOptions[i].name} ${booleanOptions[i].value ? "✔" : "✘"}`,
            () => {
              toggleBooleanOptions(i);
            }
          );
        }
      };
    })(),
    {
      fireImmediately: true
    }
  );
  function toggleBooleanOptions(index) {
    const nextBooleanOptions = [...scraperGMStore.getState().booleanOptions];
    nextBooleanOptions[index].value = !nextBooleanOptions[index].value;
    scraperGMStore.setState({
      booleanOptions: nextBooleanOptions
    });
  }
  function recursivelyRemoveDataAttr(element) {
    const attributes = element.attributes;
    for (let i = attributes.length - 1; i >= 0; --i) {
      const attributeName = attributes[i].name;
      if (["data-wr-id", "data-wr-co"].includes(attributeName)) {
        element.removeAttribute(attributeName);
      }
    }
    for (const child of element.children) {
      recursivelyRemoveDataAttr(child);
    }
  }
  function isSimpleSpan(element) {
    return (element == null ? void 0 : element.tagName) === "SPAN" && (element == null ? void 0 : element.attributes.length) === 0 && element.innerHTML.length <= 1;
  }
  function collapseSpans(element) {
    for (const span of element.querySelectorAll("span")) {
      if (!isSimpleSpan(span)) {
        continue;
      }
      let nextElementSibling = span.nextElementSibling;
      while (isSimpleSpan(nextElementSibling)) {
        span.append(nextElementSibling.textContent ?? "");
        nextElementSibling.remove();
        nextElementSibling = span.nextElementSibling;
      }
    }
  }
  function saveContent(content, fileName = "微信读书") {
    const contentBlob = new Blob([content], {
      type: "text/html;charset=utf-8"
    });
    const dummyLink = document.createElement("a");
    dummyLink.href = URL.createObjectURL(contentBlob);
    dummyLink.download = `${fileName}.html`;
    document.body.appendChild(dummyLink);
    dummyLink.click();
    document.body.removeChild(dummyLink);
    URL.revokeObjectURL(dummyLink.href);
  }
  async function blobToBase64(blob) {
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

})(gmFetch, zustandVanilla, zustandMiddleware, wasm_bindgen);
