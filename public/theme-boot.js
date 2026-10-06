/* Aplica o tema salvo antes do React carregar (evita piscar branco no tema escuro). Sem lógica: só reaplica o cache. */
(function () {
  try {
    var raw = localStorage.getItem("gastos:css");
    if (!raw) return;
    var c = JSON.parse(raw);
    var r = document.documentElement;
    var k;
    for (k in c.vars) r.style.setProperty(k, c.vars[k]);
    for (k in c.attrs) r.setAttribute(k, c.attrs[k]);
    r.style.colorScheme = c.scheme;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m && c.themeColor) m.setAttribute("content", c.themeColor);
  } catch (e) { /* sem cache: usa o tema padrão do CSS */ }
})();
