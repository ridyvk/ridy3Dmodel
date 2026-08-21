# ridy

写真から制作したホーランドロップの3Dモデルを、自然な骨格アニメーション付きで表示するインストール可能なWebアプリです。

画面には3Dモデルだけを表示します。ドラッグで回転、ピンチまたはホイールで拡大できます。

## ローカル確認

```bash
npm ci
npm test
npm run build
npm run dev
```

## GitHub Pages

`main` ブランチへの反映後、GitHubの `Settings` → `Pages` → `Build and deployment` で `Source` を `GitHub Actions` に設定します。設定後は同梱のワークフローが `ridy` を公開します。

## モデル更新

次のモデルを `public/models/ridy-rabbit-v1.glb` と差し替え、アニメーションクリップ名を維持すれば、アプリ側の画面構成を変えずに改良版へ更新できます。
