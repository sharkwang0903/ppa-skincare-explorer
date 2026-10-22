/* 預留掛接點：預設不傳送、不保存、不記錄事件。只接受以下固定事件與必要參數。 */
window.PPA_EVENTS = {
  emit(name, version) {
    if (!['select_version', 'start_questionnaire', 'complete_questionnaire', 'official_click', 'preview_coupon'].includes(name)) return;
    if (![20, 50, 100].includes(Number(version))) return;
    const payload = {version: Number(version), question_count: Number(version)};
    // 正式核准追蹤後，可在此掛接。禁止加入 Email、自由文字及個別答案。
    void payload;
  }
};
