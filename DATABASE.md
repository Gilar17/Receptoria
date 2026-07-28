## Что есть в системе (сущности):

Note - заметки
User — владелец рецептов, автор, голосующий
Recipe — сам рецепт (может быть приватным или публичным)
Tag — метки (многие-ко-многим с Recipe)
Vote — голос пользователя за публичный рецепт (уникально: один пользователь → один голос на рецепт)
(опционально) Collection / Folder — папки/коллекции для организации
(опционально) RecipeVersion — версии рецепта (история изменений)

## Ключевые правила:

- Публичность — это свойство Recipe (visibility)
- Голосовать можно только по публичным (проверяется на уровне приложения; можно усилить триггером/констрейнтом позже)
- Голос уникален: (userId, recipeId) — уникальный индекс

## Схема базы данных
- Note: id, ownerId -> User, title, createdAt
- User: id (cuid), email unique, name optional, createdAt
- Recipe: id, ownerId -> User, title, content, description optional, categoryId -> Category,
  visibility (PRIVATE|PUBLIC, default PRIVATE), createdAt, updatedAt, publishedAt nullable
- Vote: id, userId -> User, recipeId-> Recipe, value int default 1, creatт