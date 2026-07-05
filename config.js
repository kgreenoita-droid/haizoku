/* =====================================================================
   配属計算ページ 設定ファイル（config.js）

   ここにだけ、GAS連携のURLと合言葉を書きます。
   顧客ページ（index.html）はこのファイルから設定を読み込みます。

   ★ 記入は最初の1回だけ。以後 index.html を作り替えても、
      このファイルはそのまま使い回せます（貼り直し不要）。

   使い方：
     LOG_ENDPOINT … GASのウェブアプリURL（末尾が /exec のもの）
     LOG_TOKEN    … GAS側の SECRET_TOKEN と全く同じ合言葉
   ===================================================================== */

window.KOSHU_CONFIG = {
  LOG_ENDPOINT: 'https://script.google.com/macros/s/AKfycbwi00m0rpNGEEQZF4XdUM2rWBu1xcQRSAmaLmatocQFhosw780baXROCks8I2AVcrWa/exec',   // 例: 'https://script.google.com/macros/s/XXXX/exec'
  LOG_TOKEN:    'cebnter-haizoku-2026'    // 例: 'kgreen-haizoku-2026'
};
