# Frontend Canvas Challenge

Это приложение представляет собой редактор графа на React Flow, где пользователь собирает цепочку prompt → generator → result, сохраняет состояние графа через REST API и запускает тестовую генерацию изображения. В текущей реализации frontend уже включает загрузку пространства, сохранение графа, обработку ETag, polling статуса генерации и восстановление состояния после reload.

Основной стек: React, TypeScript, Vite, React Flow, FSD, Tailwind CSS, oxlint и общий HTTP-клиент на fetch без Axios.

## Запуск

Требования:

- Node.js 24.x
- npm 11.x

Установка зависимостей:

```sh
npm ci
```

Запуск backend:

```sh
npm run dev -w @canvas/api
```

Запуск frontend:

```sh
npm run dev -w @canvas/web
```

Production build frontend:

```sh
npm run build -w @canvas/web
```

Lint frontend:

```sh
npm run lint -w @canvas/web
```

> В корневом package.json нет отдельного скрипта для запуска всего приложения в одном месте; рабочий frontend запускается через workspace команду для `@canvas/web`.

## Стек

Используемые технологии и инструменты в проекте:

- React
- TypeScript
- Vite
- React Flow (`@xyflow/react`)
- React Router
- FSD (feature-sliced design) для структуры кода
- Tailwind CSS
- `oxlint` для lint
- fetch-based shared API layer
- TypeBox contracts from `@canvas/contracts`

Не используется дополнительный state manager и не добавлялся Axios; текущая реализация работает через собственный общий API client.

## Архитектура

Frontend поддерживает структуру FSD:

```text
src/
  app/
  pages/
  widgets/
  features/
  entities/
  shared/
```

Ответственность слоёв в текущем проекте:

- app: bootstrap приложения, router и базовая настройка
- pages: композиция экранов и загрузка данных пространства
- widgets: крупные UI-блоки, включая canvas и его toolbar
- features: сценарии пользователя и бизнес-логика:
  - graph editor
  - graph persistence
  - generation orchestration
  - polling lifecycle
- entities: доменные модели и entity-level API, в том числе граф и генерации
- shared: общий API client, ошибки, utilities, инфраструктурные компоненты

Важно понимать, что React Flow в этом проекте используется как editor/runtime layer, а не как источник бизнес-логики. Логика работы с canvas и генерацией не должна зависеть от внутренних runtime-полей React Flow (`selected`, `dragging`, `measured` и т. п.).

Persisted graph отделён от React Flow-модели. Это означает, что серверный граф представляет собой отдельную модель данных, а не объект React Flow runtime.

API также вынесен из компонентов: компоненты не делают fetch напрямую и не разбирают response вручную. Вся логика работы с HTTP, заголовками и ошибками находится в shared API layer и entity/API modules.

## Работа с графом

В редакторе используются три типа nodes:

- `prompt`
- `generator`
- `result`

Правила соединений:

- `prompt -> generator`
- `generator -> result`

Ограничения:

- один вход на generator;
- один исходящий edge на generator;
- один inbound connection per target;
- удаление node также удаляет связанные edges;
- количество узлов и рёбер ограничено сервером.

Canvas хранит viewport в state, и он сохраняется вместе с graph.

Persisted graph содержит только данные, необходимые для сохранения:

- `id`
- `type`
- `position`
- `data`
- `edges`
- `viewport`

Persisted graph не содержит React Flow runtime/service fields. В коде эта модель явно отделена от runtime Node/Edge объектов React Flow.

## Persistence

Это один из ключевых разделов реализации.

Текущая логика сохраняет изменения графа по следующей схеме:

1. UI обновляется локально немедленно при изменении nodes/edges/viewport.
2. Изменения сохраняются с debounce 500 ms.
3. Несколько быстрых правок приводят к одному актуальному PUT после паузы.
4. Если предыдущий PUT ещё не завершился, новые изменения не теряются и ждут своей очереди.
5. Сохранения выполняются последовательно через `save queue`.
6. Для каждого PUT используется актуальный ETag, полученный с сервера.
7. Следующий PUT отправляет `If-Match: <current ETag>`.
8. Старый ответ не должен перезаписывать более свежую локальную revision.
9. `saveNow()` отменяет ожидающий debounce и принудительно сохраняет актуальное состояние графа.
10. Generate вызывает `saveNow()`, поэтому генерация запускается только после сохранения актуальной версии графа.

Это важно для корректной работы с race conditions: stale response не должен перетирать более свежие данные.

### 412 GRAPH_VERSION_CONFLICT

При `412` и `GRAPH_VERSION_CONFLICT` текущая реализация не делает автоматический бесконечный retry старой версии. Вместо этого:

- локальные изменения сохраняются в памяти;
- пользователь видит конфликт;
- серверный граф не перезаписывает локальный черновик;
- пользователь может явно перечитать серверную версию графа и продолжить работу.

Это соответствует требованиям: без автоматического merge и без бесконечного повторения старого PUT.

## Generation flow

Поток генерации в текущей реализации следующий:

```text
изменение графа
→ saveNow()
→ актуальный graphETag
→ POST /generations
→ processing
→ polling
→ succeeded / failed
```

Подробности:

- для генерации сначала ищется связанный prompt node и result node;
- проверяется, что prompt существует и содержит непустой текст;
- graph сохраняется через `saveNow()` до создания generation;
- в отправляемом `POST /generations` используется реально сохранённый ETag;
- generation получает `Idempotency-Key`;
- повторный запрос после network error использует тот же Idempotency-Key;
- новая generation получает новый ключ;
- `202` означает `processing`;
- polling использует заголовок `Location` и, если сервер его возвращает, `Retry-After`;
- polling прекращается после `succeeded` или `failed`;
- незавершённая generation восстанавливается после reload;
- успешный результат привязывается к `resultNodeId` конкретной generation.

Важно: изменения на canvas во время генерации не должны приводить к подмене старого результата в другой result node. В текущей реализации этот риск снижен тем, что generation result привязывается к конкретному `resultNodeId`, а polling работает по конкретному generation id.

## API architecture

HTTP-логика централизована в общем слое:

- `shared/api/client.ts`
- `shared/api/errors.ts`

Здесь находится единая логика:

- общий `fetch`-wrapper;
- единая проверка `response.ok`;
- единый разбор JSON;
- единая обработка ошибок в формате `ErrorResponse`;
- создание `ApiError` с `status`, `code` и `message`;
- работа с заголовками (`ETag`, `Location`, `Retry-After`);
- единый способ отправки `If-Match`, `Idempotency-Key` и `Content-Type`.

Затем конкретные ресурсы реализованы в entity-level API modules:

- graph API
- generation API
- space API

И только после этого их используют features и UI.

Структурно это выглядит так:

```text
shared/api
    ↓
entities/.../api
    ↓
features/*/model
    ↓
UI components
```

## Performance

Реальный участок обработки graph data, который важен для производительности здесь, это преобразование React Flow runtime-представления в persisted GraphData перед сохранением.

Где это происходит:

- в `entities/graph/model/react-flow-adapter.ts`
- `toGraphData()`

Почему этот участок важен:

- он вызывается на каждом изменении nodes/edges/viewport, которое попадает в persistence pipeline;
- это один из hot paths проекта при работе canvas;
- он выполняется на каждом debounce save.

Что делает код:

- перебирает `nodes` один раз;
- для каждого node создает соответствующий persisted object;
- перебирает `edges` один раз;
- строит `viewport` без лишних копий;
- не создает промежуточные массивы вида `map().filter().find()` в этой части горячего пути.

Наивная реализация могла бы выполнять больше проходов по массивам и сохранять дополнительные промежуточные структуры на каждом изменении. Текущая реализация минимизирует лишние аллокации и объединяет преобразование данных в один последовательный проход по `nodes` и `edges`.

Это не микро-оптимизация ради “красоты кода”; это актуальная оптимизация для часто меняющегося canvas state.

## Error handling and resilience

В текущей реализации есть несколько реальных сценариев отказа и восстановления:

- сетевой сбой при запросе к API;
- HTTP error с разбором `ErrorResponse`;
- 412 conflict при сохранении графа;
- failed generation по сценарию `failure`;
- повтор генерации после network error;
- reload во время processing generation;
- stale generation result после смены node context;
- размонтирование или закрытие пространства и остановка polling.

Поведение приложения построено так, чтобы не терять локальные изменения и не подменять их stale response.

## Testing checklist

Ниже список основных сценариев, которые можно проверить вручную в текущей реализации:

- создание space;
- создание prompt/generator/result nodes;
- валидные соединения;
- невалидные соединения;
- удаление node вместе с edges;
- сохранение viewport;
- debounce после edits;
- быстрое последовательное редактирование;
- saveNow перед generation;
- ETag и If-Match;
- 412 conflict;
- успешная generation;
- failed generation;
- retry generation;
- reload после processing;
- восстановление completed generation после reload;
- остановка polling после succeeded/failed/unmount.

## Trade-offs

В этой реализации сознательно использованы конкретные решения, которые соответствуют проекту:

- не добавлен глобальный Zustand/Redux store, потому что состояние canvas локально и управляется hooks;
- не используется Axios, потому что текущий fetch-wrapper покрывает нужную функциональность;
- React Flow runtime model отделена от persisted GraphData, чтобы не сохранять служебные runtime поля;
- save queue и debounce используются вместе, чтобы избежать потери данных и stale PUT responses;
- ETag не включён в GraphData, потому что это server-side metadata persistence layer, а не доменные данные графа.

## Что НЕ входит в задание

В текущем проекте и документации не требуется:

- authentication;
- collaboration;
- undo/redo;
- mobile-specific UI;
- deployment;
- внешняя нейросеть/AI provider;
- полноценный редактор сценариев.

Это не “плохие” ограничения; это часть тестового задания и точные границы реализации.

## Итог

Текущий frontend реализует базовый, но корректный редактор graph canvas с сохранением, генерацией и восстановлением состояния, а ключевые акценты проекта — это separation of persisted graph and runtime state, ETag-based concurrency control, sequential saves, generation flow и polling lifecycle.

Реализация ориентирована не на “красивую картинку”, а на корректное поведение, защиту от stale data и race conditions, а также на устойчивую работу с API и состоянием генерации.
