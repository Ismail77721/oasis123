# Проверки 3.2.0
Из корня игры:
- node tests/v3_model.cjs
- node tests/v1_7_charity.cjs
- node tests/startup_dom.cjs

Для startup_dom.cjs необходим linkedom 0.18.15 (npm install --no-save linkedom@0.18.15).
DOM-проверка использует заглушки Phaser: проверяет сценарии интерфейса, но не заменяет реальное устройство.
Все файлы js дополнительно проверены node --check.
