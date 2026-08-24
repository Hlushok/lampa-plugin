# lampa-plugin

## Nova Skin + Lampac — персональний Premium-пілот

URL для ручного тесту:

https://hlushok.github.io/lampa-plugin/nova_skin_pr.js

Автор Nova Skin — `amikdn`. Реєстраційний автор bridge у LampaUA — `LampaUA`.

`nova_skin_pr.js` сам знаходить адресу Lampac через уже завантажений
`online.js`, тому адреса bridge не містить `lampac={localhost}` або номера групи.
Loader перевіряє наявний серверний доступ через `/lifeevents` і працює
fail-closed: лише HTTP 200 з очікуваною відповіддю дозволяє завантажити
`nova_skin_premium.js`; Viewer, анонімний користувач або мережева помилка нічого
не підвантажують. Сам Premium-build також завершується без entitlement-прапорця,
який встановлює bridge після перевірки.

Номер групи в bridge не дублюється: дозвіл повертає чинний серверний механізм
`Online.checkOnlineSearchGroup` (у поточній конфігурації Premium — група 3).

Початкові значення застосовуються лише за відсутності користувацького значення:

- фонова перевірка джерел — увімкнена;
- вигляд списку — `Плитка`.

Власний вибір користувача, зокрема `nova_skin_enabled=false`, не
перезаписується. Після входу, виходу або зміни акаунта доступ перевіряється
повторно без очищення даних Lampa; оформлення реагує на зміну доступу в поточній
сесії.

`nova_skin_premium.js` генерується з актуального upstream-файла окремим
детермінованим build-скриптом. Чисте byte-for-byte дзеркало `nova_skin.js` не
змінюється. Premium-build додає лише виправлення вибору серії: враховує
`Lampa.Timeline.view(hash).updated`, тому новіший перегляд не відкидається через
стару частково переглянуту серію.

Workflow `sync-nova-skin-premium.yml` щогодини фіксує immutable upstream-коміт,
перевіряє JavaScript і тести, генерує Premium-build та оновлює лише
`nova_skin_premium.js`. Якщо автор змінить патчовані ділянки, build зупиниться
замість публікації неперевіреного файла.

Майбутнє штатне підключення в `LampaWeb.customPlugins`:

```json
{
  "url": "https://hlushok.github.io/lampa-plugin/nova_skin_pr.js",
  "status": 1,
  "name": "Nova Skin Premium",
  "author": "LampaUA"
}
```

На етапі пілота цей запис у `init.conf` не додається: посилання встановлюється
вручну лише на тестовому пристрої.
