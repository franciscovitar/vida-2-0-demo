"""E2E opcional para el showcase: servidor local + Chromium headless en el mismo proceso.

Requiere Playwright Python y Chromium disponibles en el entorno de QA; no se cargan en la demo.
"""

import json
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
HEADERS = {
    item["key"]: item["value"]
    for item in json.loads((ROOT / "vercel.json").read_text())["headers"][0]["headers"]
}


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        for key, value in HEADERS.items():
            self.send_header(key, value)
        super().end_headers()

    def log_message(self, *_args):
        return


def check(page, url, width, errors, requests):
    page.goto(url, wait_until="load")
    assert "Buen día, Alex" in page.locator("#panel").inner_text()
    assert "Francisco Vitar" in page.locator("#panel").text_content()
    assert "Día de ejemplo" in page.locator("#panel").text_content()
    assert page.locator("#mobile-nav").get_attribute("aria-label") == "Ir a un módulo"
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), f"overflow al abrir ({width}px)"

    page.locator('[data-tour="start"]').click()
    assert "Recorrido guiado · 1 de 3" in page.locator(".recruiter-guide").text_content()
    page.locator('.recruiter-guide [data-open-capture]').click()
    page.locator('[data-capture-example="2"]').click()
    page.locator('[data-capture-form="confirm"] button[type="submit"]').click()
    assert "Continuar: ver resultado" in page.locator('#capture-dialog').inner_text()
    page.locator('#capture-dialog [data-tour="next"]').click()
    assert not page.locator('#capture-dialog').evaluate('(dialog) => dialog.open')
    assert "Recorrido guiado · 2 de 3" in page.locator(".recruiter-guide").text_content()
    assert page.locator("#mobile-nav").input_value() == "finanzas"
    assert "Supermercado" in page.locator("#panel").inner_text()
    page.locator('.recruiter-guide [data-tour="next"]').click()
    assert page.locator("#mobile-nav").input_value() == "sistema"
    assert "El desafío detrás del producto" in page.locator("#panel").inner_text()
    page.locator('.recruiter-guide [data-tour="next"]').click()
    assert page.locator(".recruiter-guide").count() == 0

    page.locator("#mobile-nav").select_option("nutricion")
    page.locator('[data-nutrition-tab="nutrientes"]').click()
    assert "Micronutrientes" in page.locator("#panel").inner_text()
    page.locator('[data-nutrition-window="7"]').click()
    assert "Sin evidencia" in page.locator("#panel").inner_text()
    page.locator('[data-nutrition-tab="hoy"]').click()
    food = page.locator('[data-capture-form="food"]')
    food.locator('input[name="amount"]').fill("2")
    food.locator('button[type="submit"]').click()
    assert "Alimento agregado" in page.locator("#announcement").inner_text()
    assert page.evaluate('document.activeElement?.closest("form")?.dataset.captureForm') == "food"

    page.locator("#mobile-nav").select_option("gimnasio")
    workout = page.locator('[data-capture-form="set"][data-exercise="press"]')
    workout.locator('input[name="kg"]').fill("42.5")
    workout.locator('input[name="reps"]').fill("8")
    workout.locator('button[type="submit"]').click()
    assert "Serie agregada" in page.locator("#announcement").inner_text()
    assert "42,5 kg" in page.locator('[aria-labelledby="ex-press"]').inner_text()
    assert page.evaluate('document.activeElement?.closest("form")?.dataset.exercise') == "press"
    page.locator('[data-gym-tab="progreso"]').click()
    assert "Referencia de fuerza" in page.locator("#panel").inner_text()
    page.locator('[data-gym-tab="rutina"]').click()
    assert "Alternativa visual «V4»" in page.locator("#panel").inner_text()

    page.locator("#mobile-nav").select_option("finanzas")
    page.locator('[data-finance-tab="import"]').click()
    page.locator('[data-finance-import="example"]').click()
    assert "Todo conciliado" in page.locator("#panel").inner_text()
    page.locator('[data-action="undo"]').last.click()
    assert "Confirmar 4 movimientos" in page.locator("#panel").inner_text()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), f"overflow en importador ({width}px)"

    for section in ("tareas", "proyectos", "agenda", "plan", "salud", "mazos", "ingles", "informacion", "compras", "peliculas", "sistema"):
        page.locator("#mobile-nav").select_option(section)
        assert page.locator("#panel h1").count() == 1, f"encabezado faltante: {section}"
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), f"overflow en {section} ({width}px)"

    page.reload(wait_until="load")
    page.locator("#mobile-nav").select_option("finanzas")
    page.locator('[data-finance-tab="import"]').click()
    assert "Confirmar 4 movimientos" in page.locator("#panel").inner_text(), "una recarga no conserva acciones"
    assert not errors, f"Errores de JS: {errors}"
    assert all(r.startswith(url) for r in requests), f"Solicitud externa: {requests}"


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(PreviewHandler, directory=str(ROOT)))
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f"http://127.0.0.1:{server.server_port}/"
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                executable_path=os.environ.get("CHROMIUM_PATH") or None,
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            for width, height in [(1440, 900), (820, 1080), (390, 844)]:
                ctx = browser.new_context(viewport={"width": width, "height": height}, base_url=url)
                page = ctx.new_page()
                errors, requests = [], []
                page.on("pageerror", lambda exc: errors.append(str(exc)))
                page.on("request", lambda request: requests.append(request.url))
                check(page, url, width, errors, requests)
                assert "connect-src 'none'" in page.request.get(url).headers.get("content-security-policy", "")
                print(f"PASS {width}×{height} · navegación, 5B, deshacer, reinicio, CSP, red, consola y overflow")
                ctx.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
