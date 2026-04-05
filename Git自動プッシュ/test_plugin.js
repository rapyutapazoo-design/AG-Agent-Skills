(function() {
    'use strict';

    // 修正1: ハードコードされたトークンを削除し、環境やプラグイン設定から取得する想定に変更
    // const config = kintone.plugin.app.getConfig('DUMMY_PLUGIN_ID');
    // const apiToken = config.apiToken;

    kintone.events.on('app.record.detail.show', function(event) {
        // 修正2: 不要なconsole.logを削除

        // 修正3: レコード全体ではなく、特定のフィールド（スペース）をKintone標準APIで安全に操作する
        const spaceElement = kintone.app.record.getSpaceElement('dummy_space');
        if (spaceElement) {
            spaceElement.style.backgroundColor = 'yellow';
        }

        return event;
    });

})();
