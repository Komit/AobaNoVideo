# 青葉のカメラ

　「青葉のカメラ」は、艦隊これくしょん～艦これ～ でゲーム画面を簡単に動画キャプチャーするためのChrome拡張です。
Chromeの機能のみで実装されていますので、macOSでも利用可能です。またタブ自体を録画するため、**他のウィンドウが上に重なったり、他の音声が再生されている状態でも問題なく録画できます。**
動画キャプチャーを取得する以外の機能は無く、ゲームや通信データへの介入、サーバへの直接アクセス等の処理は一切行っていません。

## 注意事項・制限
  - 本拡張の録画性能はChromeの仕様と、お使いの端末のマシンパワーに左右されます。
  - Retinaディスプレイ等HiDPIの場合、Chromeでズーム機能が利用されている場合には、リサイズされるため若干画質が低下します。
  - 録画時に「タブをミュート」は一時的に解除されます。
  - 録画中は一時的にウィンドウサイズが録画に最適なサイズに変更されます。**変更はしないで下さい。**
  - 録画は最大30分までです。
  - 仕組み上、録画時間に比例してChromeがメモリを消費します。
  - WebM以外の形式への対応はChromeが対応しない限り出来ません。。

## ライセンス

[MITライセンス](https://github.com/Komit/AobaNoVideo/blob/master/LICENSE.md)となります。

以下のライブラは各オリジナルのライセンスに従います。
- [jQuery](http://jquery.com/) ([ライセンス](https://jquery.org/license/))
