Тесты модели: node tests/v3_model.cjs и node tests/prayer_model.cjs.
Тест DOM: npm install --no-save linkedom@0.18.15, затем node tests/startup_dom.cjs.
Phaser в DOM-тесте заменён имитацией: этот тест проверяет инициализацию и обработчики, но не графику.
