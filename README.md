# Liquidity Vault — неделя 8 (каркас)

Минимальный Anchor-протокол для Solana localnet/devnet. На этом этапе он создает настройки vault, PDA-mint share-токена, PDA-токен-аккаунт для принятого mint и персональную карточку позиции. Внесения токенов, выпуска shares и работы с реальными средствами пока нет.

## Инструменты

Совместимые версии, зафиксированные в проекте:

- Rust 1.86.0 (`rust-toolchain.toml`); для установки AVM может понадобиться host Rust 1.88.0.
- Solana CLI 2.3.0.
- Anchor CLI и crates 0.32.1.
- Node.js 24 и Yarn 1.x.

Установите инструменты Rust, Solana CLI и Anchor по официальным руководствам, затем:

```bash
corepack yarn install
corepack yarn build
corepack yarn test
```

`yarn build` собирает SBF-программу и отдельно генерирует IDL/TypeScript-типы. Это обходит несовместимость Cargo 1.84 из стандартного SBF toolchain Solana CLI 2.3.0 с edition 2024 в актуальных транзитивных зависимостях. `yarn test` использует собранный бинарник, поднимает локальный validator, создает тестовый mint и проверяет создание vault и позиции.

## Аккаунты и полномочия

| Аккаунт | Адрес / владелец | Что хранит / полномочия |
| --- | --- | --- |
| `Vault` | PDA `[b"vault", admin]`; владелец — программа | Администратор, mint принятого токена, mint shares, общий объем внесений (на этой неделе `0`) и bump. |
| Share mint | PDA `[b"share_mint", vault]`; владелец — SPL Token Program | Mint shares; mint authority — PDA `Vault`, не пользователь. Эмиссия пока не реализована. |
| Vault token account | PDA `[b"vault_tokens", vault]`; владелец — SPL Token Program | Баланс принятого mint; token authority — PDA `Vault`. |
| `Position` | PDA `[b"position", vault, user]`; владелец — программа | Пользователь, vault, его внесенный объем (на этой неделе `0`) и bump. |

`initialize_vault` создает первые три аккаунта и сохраняет начальные настройки. `open_position` создает отдельную позицию для пользователя; подпись пользователя требуется, vault проверяется по PDA.

## Devnet

Для тестовой сети нужен отдельный кошелек и немного devnet SOL на комиссии. Храните keypair вне репозитория; приватные ключи и seed-фразы в git не добавлять. `.gitignore` исключает `target/`, локальные keypair-файлы и каталоги ключей.

```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 2
corepack yarn build
anchor deploy --provider.cluster devnet
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
  ANCHOR_WALLET="$HOME/.config/solana/id.json" yarn init:devnet
```

Скрипт `scripts/init-devnet.ts` создает тестовый mint с 6 decimals, инициализирует vault и выводит адреса аккаунтов и транзакции. Program ID, зафиксированный для сборки: `3UcmouisNffeyqHTrwmkztu22Zf9jFj2cvZyvLC1t4EW`.

Публичные devnet-ссылки на Explorer пока не приведены: программа не задеплоена и аккаунты не инициализированы. В текущей среде faucet отклонил запросы на 2 SOL и 1 SOL из-за лимита, баланс тестового кошелька — 0 SOL. Не считайте настроенный Program ID существующим on-chain аккаунтом; добавьте ссылки после подтвержденного деплоя и инициализации.